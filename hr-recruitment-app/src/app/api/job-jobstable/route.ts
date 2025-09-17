import { NextResponse } from "next/server"

// Normalize various date formats to ISO string
const normalizeDateToISO = (input: unknown): string => {
  if (!input) return new Date().toISOString()
  const raw = String(input).trim()
  // Try native parse first
  const native = new Date(raw)
  if (!isNaN(native.getTime())) return native.toISOString()

  // Try numeric timestamp
  if (/^\d{10,13}$/.test(raw)) {
    const ms = raw.length === 13 ? parseInt(raw, 10) : parseInt(raw, 10) * 1000
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  // Try D/M/Y or D-M-Y
  const dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
  if (dmy) {
    const [, dStr, mStr, yStr] = dmy
    const d = parseInt(dStr, 10)
    const m = parseInt(mStr, 10) - 1
    const yearNum = yStr.length === 2 ? parseInt(yStr, 10) : parseInt(yStr, 10)
    const y = yStr.length === 2 ? (yearNum < 50 ? 2000 + yearNum : 1900 + yearNum) : yearNum
    const date = new Date(y, m, d)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // Try Y-M-D or Y/M/D
  const ymd = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (ymd) {
    const y = parseInt(ymd[1], 10)
    const m = parseInt(ymd[2], 10) - 1
    const d = parseInt(ymd[3], 10)
    const date = new Date(y, m, d)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  // Fallback: use today to avoid "Invalid Date" downstream
  return new Date().toISOString()
}

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
      postedDate: normalizeDateToISO(record.posted_on || record.Posted_On || record.postedDate),
      updatedDate: normalizeDateToISO(record.updated_on || record.Updated_On || record.updatedDate),
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
