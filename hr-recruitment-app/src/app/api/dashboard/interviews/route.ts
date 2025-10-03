import { NextResponse } from "next/server"
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

export async function GET() {
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
    const mappedCandidates = allRecords?.map((record: unknown, index: number) => {
      const rec = record as Record<string, unknown>
      return {
        id: rec.candidate_id || rec._id || `candidate-${index + 1}`,
        candidateName: rec.candidate_name || rec.Candidate_Name || rec.name || `Candidate ${index + 1}`,
        email: rec.candidate_email || rec.Candidate_Email || rec.email || "",
        phoneNumber: rec.phone_number || rec.Phone_Number || rec.phoneNumber || "",
        linkedinUrl: rec.candidate_linkedin_url || rec.Candidate_LinkedIn_URL || rec.linkedinUrl || "",
        skills: String(rec.skills || rec.Skills || rec.skillSet || ""),
        experience: String(rec.experience || rec.Experience || rec.experienceLevel || ""),
        certifications: String(rec.certifications || rec.Certifications || rec.certificates || ""),
        projects: String(rec.projects || rec.Projects || rec.projectPortfolio || ""),
        miscellaneousInformation: String(rec.miscellaneous_information || rec.Miscellaneous_Information || rec.additionalInfo || ""),
        candidateScore: rec.candidate_score || rec.Candidate_Score || rec.score || 0,
        scoreDescription: String(rec.score_description || rec.Score_Description || rec.scoreDetails || ""),
        score_breakdown: (() => {
          const raw = (rec.score_breakdown ?? rec.Score_Breakdown ?? rec.scoreBreakdown ?? rec.ScoreBreakDown) as unknown
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
        jobsMapped: rec.jobs_mapped || rec.Jobs_Mapped || rec.mappedJobs || "",
        currentJobTitle: rec.current_job_title || rec.Current_Job_Title || rec.currentPosition || "",
        currentEmployer: rec.current_employer || rec.Current_Employer || rec.currentCompany || "",
        openToWork: rec.open_to_work || rec.Open_To_Work || rec.availableForWork || true,
        education: rec.education || rec.Education || rec.educationalBackground || "",
        endorsements: rec.endorsements || rec.Endorsements || rec.recommendations || "",
        overallMessages: (() => {
          const raw = (rec.overall_messages ?? rec.Overall_Messages) as unknown
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
        followUpCount: rec.follow_up_count || rec.Follow_Up_Count || rec.followUpAttempts || 0,
        candidateLocation: rec.candidate_location || rec.Candidate_Location || rec.location || "",
        lastContactedDate: rec.last_contacted_on || rec.Last_Contacted_On || rec.last_contacted_date || rec.Last_Contacted_Date || rec.lastContact || "",
        providerId: rec.provider_id || rec.Provider_ID || rec.sourceProvider || "",
        linkedinMessageRead: rec.linkedin_message_read || rec.LinkedIn_Message_Read || rec.linkedinReadStatus || false,
        jobId: rec.Job_id || rec.Job_ID || rec.associatedJob || "",
        replyStatus: rec.reply_status || rec.Reply_Status || rec.responseStatus || "",
        emailMessageRead: rec.email_message_read || rec.Email_Message_Read || rec.emailReadStatus || false,
        linkedinMessage: rec.linkedin_message || rec.LinkedIn_Message || rec.lastLinkedInMessage || "",
        meetingLink: rec.meeting_link || rec.Meeting_Link || rec.interviewLink || "",
        meetingDate: rec.meeting_date || rec.Meeting_Date || rec.interviewDate || "",
        eventId: rec.event_id || rec.Event_ID || rec.calendarEventId || "",
        emailProviderId: rec.email_provider_id || rec.Email_Provider_ID || rec.emailServiceProvider || "",
        subject: rec.subject || rec.Subject || rec.messageSubject || "",
        status: rec.status || rec.Status || rec.candidateStatus,
        stage: rec.stage || rec.Stage || rec.candidate_stage || rec.Candidate_Stage || "",
        interviewDate: rec.meeting_date || rec.Meeting_Date || rec.interviewDate || null,
        createdAt: normalizeDateToISO(rec.created_at || rec.Created_At || rec.createdAt),
        job: (() => {
          const jid = rec.Job_id || rec.Job_ID || rec.associatedJob || ""
          const fromMap = jid ? jobMap.get(String(jid)) : null
          return {
            id: jid,
            title: fromMap?.title || rec.jobs_mapped || rec.Jobs_Mapped || "Job Title",
            companyName: fromMap?.companyName || rec.current_employer || rec.Current_Employer || rec.currentCompany || "Company"
          }
        })()
      }
    }) || []

    // Filter specifically for "Meeting Scheduled" status
    const meetingScheduledCandidates = mappedCandidates.filter((candidate: Record<string, unknown>) => {
      const status = candidate.status || ""
      console.log(`Checking candidate ${candidate.candidateName}: status="${status}"`)
      return status === "Meeting Scheduled"
    })

    console.log(`Found ${meetingScheduledCandidates.length} candidates with "Meeting Scheduled" status`)
    console.log("Meeting Scheduled candidates:", meetingScheduledCandidates.map((c: Record<string, unknown>) => ({
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
