import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("=== DASHBOARD STATS API CALLED ===")
    
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const jobsTableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const candidatesTableId = process.env.NEXT_PUBLIC_CANDIDATES_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    // Check if required parameters are set
    if (!projectId || !jobsTableId || !candidatesTableId || !apiKey) {
      throw new Error("Missing required Wexa API parameters")
    }

    // Get jobs and candidates from Wexa API in parallel
    const [jobsResponse, candidatesResponse] = await Promise.all([
      // Fetch jobs from Wexa API
      fetch(`https://api.wexa.ai/storage/${projectId}/${jobsTableId}`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }),
      
      // Fetch candidates from Wexa API
      fetch(`https://api.wexa.ai/storage/${projectId}/${candidatesTableId}?page=1&query=&sort=1&sort_key=_id`, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      })
    ])

    // Process jobs data from Wexa
    let totalJobs = 0
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json()
      totalJobs = jobsData.records?.length || 0
      console.log("Total jobs from Wexa:", totalJobs)
    } else {
      console.error("Failed to fetch jobs from Wexa API:", jobsResponse.status)
    }

    // Process candidates data from Wexa
    let totalCandidates = 0
    let interviewsScheduled = 0
    let acceptedCandidates = 0
    let rejectedCandidates = 0

    if (candidatesResponse.ok) {
      const candidatesData = await candidatesResponse.json()
      const candidates = candidatesData.records || []
      totalCandidates = candidates.length
      
      console.log("Total candidates from Wexa:", totalCandidates)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log("All candidate statuses:", candidates.map((c: any) => ({
        name: c.candidate_name || c.Candidate_Name,
        status: c.status || c.Status
      })))
      
      // Count candidates by status (case sensitive)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candidates.forEach((candidate: any) => {
        const status = candidate.status || candidate.Status || ""
        
        switch (status) {
          case "Interview Scheduled":
            interviewsScheduled++
            break
          case "Accepted":
            acceptedCandidates++
            break
          case "Sourced":
            // Sourced candidates are part of total but not counted separately
            break
          case "Rejected":
            rejectedCandidates++
            break
          default:
            console.log(`Unknown status: "${status}" for candidate: ${candidate.candidate_name || candidate.Candidate_Name}`)
        }
      })
      
      console.log("Candidate status counts:", {
        totalCandidates,
        interviewsScheduled,
        acceptedCandidates,
        rejectedCandidates
      })
    } else {
      console.error("Failed to fetch candidates from Wexa API:", candidatesResponse.status)
    }
    
    console.log("Dashboard stats:", {
      totalJobs,
      totalCandidates,
      interviewsScheduled,
      acceptedCandidates,
      rejectedCandidates
    })
    
    return NextResponse.json({
      success: true,
      totalJobs,
      totalCandidates,
      todayInterviews: interviewsScheduled, // Map to existing field name
      selectedCandidates: acceptedCandidates, // Map to existing field name
      rejectedCandidates
    })
    
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard stats",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}