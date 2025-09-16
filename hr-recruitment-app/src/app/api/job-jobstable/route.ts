import { NextResponse } from "next/server"

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    console.log("Fetching jobs from Wexa API...")
    console.log("Project ID:", projectId)
    console.log("Jobs Table ID:", tableId)

    // Check if required parameters are set
    if (!projectId || !tableId || !apiKey) {
      throw new Error("Missing required parameters")
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
    
    // Map the records to match the jobs schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedJobs = data.records?.map((record: any, index: number) => ({
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
      isActive: true,
      _count: {
        candidates: 0 // This would need to be fetched separately if you have candidate data
      }
    })) || []

    return NextResponse.json({
      success: true,
      jobs: mappedJobs,
      totalCount: data.total_count || mappedJobs.length,
      message: "Jobs fetched successfully from Wexa table"
    })

  } catch (error) {
    console.error("Error fetching jobs from Wexa AI:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch jobs from Wexa table",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
