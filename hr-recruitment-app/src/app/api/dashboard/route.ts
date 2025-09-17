import { NextResponse } from "next/server"

// Define minimal job shape to avoid implicit any in array callbacks
type JobItem = {
  jobStatus?: string
  [key: string]: unknown
}

export async function GET() {
  try {
    console.log("=== DASHBOARD API CALLED ===")
    
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    // Check if required parameters are set
    if (!projectId || !tableId || !apiKey) {
      throw new Error("Missing required Wexa API parameters")
    }

    const url = `https://api.wexa.ai/storage/${projectId}/${tableId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Wexa AI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    console.log("Wexa API Response:", JSON.stringify(data, null, 2))
    console.log("Jobs records count:", data.records?.length || 0)
    
    // Debug: Log raw job statuses from Wexa
    console.log("Raw job statuses from Wexa:", data.records?.map((record: any) => ({
      title: record.job_title || record.Job_Title,
      job_status: record.job_status,
      Job_Status: record.Job_Status,
      jobStatus: record.jobStatus
    })))
    
    // Map the records to match the jobs schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allJobs: JobItem[] = data.records?.map((record: any, index: number) => ({
      id: record.job_id || record._id || `job-${index + 1}`,
      title: record.job_title || record.Job_Title || record.title || `Job ${index + 1}`,
      description: record.job_description || record.Job_Description || record.description || "",
      location: record.job_location || record.Job_Location || record.location || "Remote",
      companyName: record.company_name || record.Company_Name || record.companyName || "Company",
      companyDescription: record.company_description || record.Company_Description || record.companyDescription || "",
      postedDate: record.posted_on || record.Posted_On || record.postedDate || new Date().toISOString(),
      updatedDate: record.updated_on || record.Updated_On || record.updatedDate || new Date().toISOString(),
      mode: record.job_mode || record.Job_Mode || record.mode || "remote",
      recruiterName: record.recruiter_name || record.Recruiter_Name || record.recruiterName || "Recruiter",
      recruiterEmail: record.recruiter_email || record.Recruiter_Email || record.recruiterEmail || "",
      recruiterDesignation: record.recruiter_designation || record.Recruiter_Designation || record.recruiterDesignation || "HR Manager",
      jobStatus: record.job_status || record.Job_Status || record.jobStatus,
      _count: {
        candidates: 0 // This would need to be fetched separately if you have candidate data
      }
    })) || []

    // Get total jobs count
    const totalJobs = allJobs.length
    console.log("Total jobs:", totalJobs)
    
    // Debug: Log all job statuses
    console.log("All job statuses:", allJobs.map(job => ({
      title: job.title,
      status: job.jobStatus
    })))
    
    // Get active jobs (where jobStatus is "Active" - case sensitive)
    const activeJobs = allJobs.filter(job => 
      job.jobStatus === "Active"
    ).slice(0, 2) // Limit to 2 for dashboard display
    
    console.log("Active jobs found:", activeJobs.length)
    
    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        activeJobsCount: activeJobs.length
      }
    })
    
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
