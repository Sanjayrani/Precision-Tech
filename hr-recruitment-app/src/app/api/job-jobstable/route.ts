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
    
    // Helper to coerce values like "35", "35%", " 35 % " into a number
    const toNumber = (value: unknown): number | undefined => {
      if (value === null || value === undefined) return undefined
      if (typeof value === 'number' && !isNaN(value)) return value
      const str = String(value)
      const match = str.match(/-?\d+(?:\.\d+)?/)
      if (!match) return undefined
      const num = Number(match[0])
      return isNaN(num) ? undefined : num
    }

    const pick = (recordObj: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        const v = recordObj[k]
        if (v !== undefined && v !== null && v !== '') return v
      }
      return undefined
    }

    // Map the records to match the jobs schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedJobs = data.records?.map((record: any, index: number) => {
      // Extract weights from the record
      // Try both individual numeric fields and a consolidated weights array (possibly JSON string)
      let rawWeights = pick(record, 'weights', 'Weights', 'job_weights', 'Job_Weights')
      if (typeof rawWeights === 'string') {
        try {
          const parsed = JSON.parse(rawWeights)
          rawWeights = parsed
        } catch {
          // ignore parse errors; treat as absent
          rawWeights = undefined
        }
      }

      // Build unified list of { name, weight } from various formats
      let parsedCustomWeights: Array<{ name: string; weight: number }> = []
      if (Array.isArray(rawWeights)) {
        parsedCustomWeights = rawWeights
          .map((item: unknown) => {
            if (typeof item === 'string') {
              // e.g., "Technical Skills: 35" or "Education: 10%"
              const m = item.match(/^\s*([^:]+)\s*:\s*(-?\d+(?:\.\d+)?)\s*%?\s*$/i)
              if (!m) return undefined
              return { name: m[1].trim(), weight: Number(m[2]) }
            }
            if (item && typeof item === 'object') {
              const obj = item as { name?: unknown; label?: unknown; weight?: unknown; value?: unknown }
              const name = String(obj.name ?? obj.label ?? '')
              const num = toNumber(obj.weight ?? obj.value)
              if (!name || num === undefined) return undefined
              return { name, weight: num }
            }
            return undefined
          })
          .filter(Boolean) as Array<{ name: string; weight: number }>
      }

      // Also consider explicit custom_weights field if provided
      const extraCustom = pick(record, 'custom_weights', 'Custom_Weights') as
        | Array<{ name?: string; label?: string; weight?: unknown; value?: unknown }>
        | Record<string, unknown>
        | undefined
      if (Array.isArray(extraCustom)) {
        parsedCustomWeights.push(
          ...extraCustom
            .map((w) => {
              const name = String(w.name ?? w.label ?? '')
              const num = toNumber(w.weight ?? w.value)
              return name && num !== undefined ? { name, weight: num } : undefined
            })
            .filter(Boolean) as Array<{ name: string; weight: number }>
        )
      } else if (extraCustom && typeof extraCustom === 'object') {
        parsedCustomWeights.push(
          ...Object.entries(extraCustom)
            .map(([key, val]) => {
              const num = toNumber(val)
              return num !== undefined ? { name: key, weight: num } : undefined
            })
            .filter(Boolean) as Array<{ name: string; weight: number }>
        )
      }

      // Standard keys accumulator from direct fields
      const standard: {
        technical_skills_weight?: number
        soft_skills_weight?: number
        open_to_work_weight?: number
        job_match_weight?: number
        location_match_weight?: number
        experience_weight?: number
        education_weight?: number
      } = {
        technical_skills_weight: toNumber(pick(record, 'technical_skills_weight', 'Technical_Skills_Weight')),
        soft_skills_weight: toNumber(pick(record, 'soft_skills_weight', 'Soft_Skills_Weight')),
        open_to_work_weight: toNumber(pick(record, 'open_to_work_weight', 'Open_to_Work_Weight')),
        job_match_weight: toNumber(pick(record, 'job_match_weight', 'Job_Match_Weight')),
        location_match_weight: toNumber(pick(record, 'location_match_weight', 'Location_Match_Weight')),
        experience_weight: toNumber(pick(record, 'experience_weight', 'Experience_Weight')),
        education_weight: toNumber(pick(record, 'education_weight', 'Education_Weight')),
      }

      // Fill missing standards from label-mapped entries
      const labelToKey: Record<string, keyof typeof standard> = {
        'technical skills': 'technical_skills_weight',
        'soft skills': 'soft_skills_weight',
        'open to work': 'open_to_work_weight',
        'job match': 'job_match_weight',
        'location match': 'location_match_weight',
        'experience': 'experience_weight',
        'education': 'education_weight',
      }
      const remainingCustom: Array<{ name: string; weight: number }> = []
      for (const entry of parsedCustomWeights) {
        const key = labelToKey[entry.name.trim().toLowerCase()]
        if (key) {
          if (standard[key] === undefined) standard[key] = entry.weight
        } else {
          remainingCustom.push(entry)
        }
      }

      const weights = {
        technical_skills_weight: standard.technical_skills_weight,
        soft_skills_weight: standard.soft_skills_weight,
        open_to_work_weight: standard.open_to_work_weight,
        job_match_weight: standard.job_match_weight,
        location_match_weight: standard.location_match_weight,
        experience_weight: standard.experience_weight,
        education_weight: standard.education_weight,
        custom_weights: remainingCustom
      }

      // Check if weights exist and are not empty
      const hasWeights = (
        (Array.isArray(weights.custom_weights) && weights.custom_weights.length > 0) ||
        [
          weights.technical_skills_weight,
          weights.soft_skills_weight,
          weights.open_to_work_weight,
          weights.job_match_weight,
          weights.location_match_weight,
          weights.experience_weight,
          weights.education_weight
        ].some((v) => typeof v === 'number' && !isNaN(v))
      )

      return {
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
        weights: hasWeights ? weights : null,
        _count: {
          candidates: 0 // This would need to be fetched separately if you have candidate data
        }
      }
    }) || []

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
