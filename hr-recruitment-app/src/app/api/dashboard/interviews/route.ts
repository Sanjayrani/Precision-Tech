import { NextRequest, NextResponse } from "next/server"
import { htmlToPlainText } from "@/lib/formatHtml"

// Normalize various date formats to ISO string
const normalizeDateToISO = (input: unknown): string => {
  if (!input) return new Date().toISOString()
  const raw = String(input).trim()
  const native = new Date(raw)
  if (!isNaN(native.getTime())) return native.toISOString()

  if (/^\d{10,13}$/.test(raw)) {
    const ms = raw.length === 13 ? parseInt(raw, 10) : parseInt(raw, 10) * 1000
    const d = new Date(ms)
    if (!isNaN(d.getTime())) return d.toISOString()
  }

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

  const ymd = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (ymd) {
    const y = parseInt(ymd[1], 10)
    const m = parseInt(ymd[2], 10) - 1
    const d = parseInt(ymd[3], 10)
    const date = new Date(y, m, d)
    if (!isNaN(date.getTime())) return date.toISOString()
  }

  return new Date().toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_CANDIDATES_TABLE_ID
    const jobsTableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    console.log("Fetching interview scheduled candidates for dashboard...")

    if (!projectId || !tableId || !apiKey) {
      throw new Error("Missing required Wexa API parameters")
    }

    // Fetch all candidates from Wexa API
    const wexaFetchLimit = 100
    const buildUrl = (p: number, lim: number) => `https://api.wexa.ai/storage/${projectId}/${tableId}?page=${p}&limit=${lim}&query=&sort=1&sort_key=_id`

    const firstRes = await fetch(buildUrl(1, wexaFetchLimit), {
      method: 'GET',
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    })
    
    if (!firstRes.ok) {
      throw new Error(`Wexa AI API error: ${firstRes.status} ${firstRes.statusText}`)
    }
    
    const firstData = await firstRes.json()
    let allRecords = firstData.records || []
    const totalCountAll = firstData.total_count || firstData.totalCount || allRecords.length
    const firstPageSize = Array.isArray(allRecords) ? allRecords.length : 0
    const effectivePageSize = Math.max(1, firstPageSize || wexaFetchLimit)
    const totalWexaPages = Math.max(1, Math.ceil(totalCountAll / effectivePageSize))

    // Fetch remaining pages if needed
    if (totalWexaPages > 1) {
      const pageNumbers: number[] = []
      for (let p = 2; p <= totalWexaPages; p++) pageNumbers.push(p)
      const responses = await Promise.all(
        pageNumbers.map(async (p) => {
          const url = buildUrl(p, wexaFetchLimit)
          const res = await fetch(url, {
            method: 'GET',
            headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
          })
          if (!res.ok) {
            console.error('WEXA page fetch failed:', p, res.status, res.statusText)
            return { records: [] as unknown[] }
          }
          try {
            const json = await res.json()
            return { records: json.records || [] }
          } catch {
            return { records: [] as unknown[] }
          }
        })
      )
      for (const r of responses) {
        allRecords = allRecords.concat(r.records as unknown[])
      }
    }

    if (allRecords.length > totalCountAll) {
      allRecords = allRecords.slice(0, totalCountAll)
    }

    // Build job map for enrichment
    const jobMap = new Map<string, { title: string; companyName: string }>()
    if (jobsTableId) {
      try {
        const jobsRes = await fetch(`https://api.wexa.ai/storage/${projectId}/${jobsTableId}`, {
          method: 'GET',
          headers: { 'x-api-key': apiKey as string, 'Content-Type': 'application/json' },
        })
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json()
          const jobs = jobsData.records || []
          for (const rec of jobs) {
            const jid = rec.job_id || rec._id
            if (jid) {
              jobMap.set(String(jid), {
                title: rec.job_title || rec.Job_Title || rec.title || 'Job Title',
                companyName: rec.company_name || rec.Company_Name || rec.companyName || 'Company'
              })
            }
          }
        }
      } catch {
        console.error('Failed to fetch jobs for candidate enrichment')
      }
    }

    // Map candidates and filter for "Meeting Scheduled" status
    const mappedCandidates = allRecords?.map((record: any, index: number) => ({
      id: record.candidate_id || record._id || `candidate-${index + 1}`,
      candidateName: record.candidate_name || record.Candidate_Name || record.name || `Candidate ${index + 1}`,
      email: record.candidate_email || record.Candidate_Email || record.email || "",
      phoneNumber: record.phone_number || record.Phone_Number || record.phoneNumber || "",
      linkedinUrl: record.candidate_linkedin_url || record.Candidate_LinkedIn_URL || record.linkedinUrl || "",
      skills: String(record.skills || record.Skills || record.skillSet || ""),
      experience: String(record.experience || record.Experience || record.experienceLevel || ""),
      certifications: String(record.certifications || record.Certifications || record.certificates || ""),
      projects: String(record.projects || record.Projects || record.projectPortfolio || ""),
      miscellaneousInformation: String(record.miscellaneous_information || record.Miscellaneous_Information || record.additionalInfo || ""),
      candidateScore: record.candidate_score || record.Candidate_Score || record.score || 0,
      scoreDescription: String(record.score_description || record.Score_Description || record.scoreDetails || ""),
      score_breakdown: (() => {
        const raw = (record.score_breakdown ?? record.Score_Breakdown ?? record.scoreBreakdown ?? record.ScoreBreakDown) as unknown
        if (Array.isArray(raw)) {
          return raw
            .map((item) => {
              if (typeof item === 'string') return htmlToPlainText(item).trim()
              if (item && typeof item === 'object') {
                const obj = item as Record<string, unknown>
                const label = (obj.label || obj.name || obj.key || obj.criterion || obj.category) as string | undefined
                const value = (obj.value || obj.score || obj.weight || obj.percent || obj.percentage) as unknown
                if (label != null && (value !== undefined && value !== null && value !== '')) {
                  return `${String(label)}: ${String(value)}`.trim()
                }
                try {
                  return htmlToPlainText(JSON.stringify(obj))
                } catch {
                  return ''
                }
              }
              return ''
            })
            .filter((s) => typeof s === 'string' && s.length > 0)
        }
        if (typeof raw === 'string') {
          const cleaned = htmlToPlainText(raw).trim()
          return cleaned ? [cleaned] : []
        }
        return []
      })(),
      jobsMapped: record.jobs_mapped || record.Jobs_Mapped || record.mappedJobs || "",
      currentJobTitle: record.current_job_title || record.Current_Job_Title || record.currentPosition || "",
      currentEmployer: record.current_employer || record.Current_Employer || record.currentCompany || "",
      openToWork: record.open_to_work || record.Open_To_Work || record.availableForWork || true,
      education: record.education || record.Education || record.educationalBackground || "",
      endorsements: record.endorsements || record.Endorsements || record.recommendations || "",
      overallMessages: (() => {
        const raw = (record.overall_messages ?? record.Overall_Messages) as unknown
        if (Array.isArray(raw)) {
          return raw.map((item: unknown) => {
            if (typeof item === 'string') return htmlToPlainText(item)
            if (item && typeof item === 'object') {
              const obj = { ...(item as Record<string, unknown>) }
              const keysToClean = ['message', 'content', 'text', 'body', 'value'] as const
              for (const key of keysToClean) {
                const val = obj[key]
                if (typeof val === 'string') {
                  obj[key] = htmlToPlainText(val)
                }
              }
              return obj
            }
            return item
          })
        }
        if (typeof raw === 'string') {
          return htmlToPlainText(raw)
        }
        return []
      })(),
      followUpCount: record.follow_up_count || record.Follow_Up_Count || record.followUpAttempts || 0,
      candidateLocation: record.candidate_location || record.Candidate_Location || record.location || "",
      lastContactedDate: record.last_contacted_on || record.Last_Contacted_On || record.last_contacted_date || record.Last_Contacted_Date || record.lastContact || "",
      providerId: record.provider_id || record.Provider_ID || record.sourceProvider || "",
      linkedinMessageRead: record.linkedin_message_read || record.LinkedIn_Message_Read || record.linkedinReadStatus || false,
      jobId: record.Job_id || record.Job_ID || record.associatedJob || "",
      replyStatus: record.reply_status || record.Reply_Status || record.responseStatus || "",
      emailMessageRead: record.email_message_read || record.Email_Message_Read || record.emailReadStatus || false,
      linkedinMessage: record.linkedin_message || record.LinkedIn_Message || record.lastLinkedInMessage || "",
      meetingLink: record.meeting_link || record.Meeting_Link || record.interviewLink || "",
      meetingDate: record.meeting_date || record.Meeting_Date || record.interviewDate || "",
      eventId: record.event_id || record.Event_ID || record.calendarEventId || "",
      emailProviderId: record.email_provider_id || record.Email_Provider_ID || record.emailServiceProvider || "",
      subject: record.subject || record.Subject || record.messageSubject || "",
      status: record.status || record.Status || record.candidateStatus,
      stage: record.stage || record.Stage || record.candidate_stage || record.Candidate_Stage || "",
      interviewDate: record.meeting_date || record.Meeting_Date || record.interviewDate || null,
      createdAt: normalizeDateToISO(record.created_at || record.Created_At || record.createdAt),
      job: (() => {
        const jid = record.Job_id || record.Job_ID || record.associatedJob || ""
        const fromMap = jid ? jobMap.get(String(jid)) : null
        return {
          id: jid,
          title: fromMap?.title || record.jobs_mapped || record.Jobs_Mapped || "Job Title",
          companyName: fromMap?.companyName || record.current_employer || record.Current_Employer || record.currentCompany || "Company"
        }
      })()
    })) || []

    // Filter specifically for "Meeting Scheduled" status
    const meetingScheduledCandidates = mappedCandidates.filter(candidate => {
      const status = candidate.status || ""
      console.log(`Checking candidate ${candidate.candidateName}: status="${status}"`)
      return status === "Meeting Scheduled"
    })

    console.log(`Found ${meetingScheduledCandidates.length} candidates with "Meeting Scheduled" status`)
    console.log("Meeting Scheduled candidates:", meetingScheduledCandidates.map(c => ({
      name: c.candidateName,
      status: c.status,
      interviewDate: c.interviewDate,
      meetingDate: c.meetingDate
    })))

    return NextResponse.json({
      success: true,
      candidates: meetingScheduledCandidates,
      totalCount: meetingScheduledCandidates.length,
      message: "Meeting Scheduled candidates fetched successfully for dashboard"
    })

  } catch (error) {
    console.error("Error fetching meeting scheduled candidates:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch meeting scheduled candidates",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
