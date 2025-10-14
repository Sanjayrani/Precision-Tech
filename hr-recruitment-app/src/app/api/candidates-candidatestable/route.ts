import { NextRequest, NextResponse } from "next/server"
import { htmlToPlainText } from "@/lib/formatHtml"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '10', 10)
    const searchQuery = searchParams.get('search') || ''
    const statusQuery = searchParams.get('status') || ''
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 100)
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_CANDIDATES_TABLE_ID
    const jobsTableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    console.log("Fetching candidates from Wexa API...")
    console.log("Candidates Table ID:", tableId)

    // Check if required parameters are set
    if (!projectId || !tableId || !apiKey) {
      throw new Error("Missing required parameters")
    }

    // Always fetch from WEXA in large pages (up to 100) and aggregate, then
    // slice according to the requested page/limit to guarantee consistent
    // pagination regardless of WEXA's paging semantics.
    const wexaFetchLimit = 100

    const buildUrl = (p: number, lim: number) => `https://api.wexa.ai/storage/${projectId}/${tableId}?page=${p}&limit=${lim}&query=&sort=1&sort_key=_id`

    // Fetch first page to discover total count
    const firstUrl = buildUrl(1, wexaFetchLimit)
    console.log('WEXA API first page URL:', firstUrl)
    const firstRes = await fetch(firstUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    })
    if (!firstRes.ok) {
      throw new Error(`Wexa AI API error: ${firstRes.status} ${firstRes.statusText}`)
    }
    const firstData = await firstRes.json()
    const firstRecords = firstData.records || []
    const totalCountAll = firstData.total_count || firstData.totalCount || firstRecords.length
    // Derive the real page size used by WEXA (some backends cap or ignore limit)
    const firstPageSize = Array.isArray(firstRecords) ? firstRecords.length : 0
    const effectivePageSize = Math.max(1, firstPageSize || wexaFetchLimit)
    const totalWexaPages = Math.max(1, Math.ceil(totalCountAll / effectivePageSize))
    console.log('WEXA API first fetch:', {
      firstRecords: firstRecords.length,
      totalCountAll,
      totalWexaPages,
      requestedLimit: wexaFetchLimit,
      effectivePageSize,
    })

    let allRecords = firstRecords
    if (totalWexaPages > 1) {
      const pageNumbers: number[] = []
      for (let p = 2; p <= totalWexaPages; p++) pageNumbers.push(p)
      console.log('Fetching additional WEXA pages:', pageNumbers)
      const responses = await Promise.all(
        pageNumbers.map(async (p) => {
          const url = buildUrl(p, wexaFetchLimit)
          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
            },
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

    // Safety: if provider returns more than reported, trim to totalCountAll
    if (allRecords.length > totalCountAll) {
      allRecords = allRecords.slice(0, totalCountAll)
    }

    // Final safety: do not exceed reported total
    const candidatesRecords = allRecords.slice(0, totalCountAll)
    console.log('Aggregated WEXA records total:', candidatesRecords.length)

    // Optionally fetch jobs to enrich candidate's job info by job_id
    const jobMap = new Map<string, { title: string; companyName: string }>()
    if (jobsTableId) {
      try {
        const jobsRes = await fetch(`https://api.wexa.ai/storage/${projectId}/${jobsTableId}` , {
          method: 'GET',
          headers: {
            'x-api-key': apiKey as string,
            'Content-Type': 'application/json',
          },
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
    
    // Map the records to match the candidates schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCandidates = candidatesRecords?.map((record: any, index: number) => ({
      id: record.candidate_id || record._id || `candidate-${index + 1}`,
      candidateName: record.candidate_name || record.Candidate_Name || record.name || `Candidate ${index + 1}`,
      email: record.candidate_email || record.Candidate_Email || record.email || "",
      phoneNumber: record.phone_number || record.Phone_Number || record.phoneNumber || "",
      linkedinUrl: record.candidate_linkedin_url || record.Candidate_LinkedIn_URL || record.linkedinUrl || "",
      skills: String(record.skills || record.Skills || record.skillSet || ""),
      experience: String(record.experience || record.Experience || record.experienceLevel || ""),
      certifications: String(record.certifications || record.Certifications || record.certificates || ""),
      projects: String(record.projects || record.Projects || record.projectPortfolio || ""),
      craftedMessage: String(record.crafted_message || record.Crafted_Message || record.craftedMessage || ""),
      miscellaneousInformation: String(record.miscellaneous_information || record.Miscellaneous_Information || record.additionalInfo || ""),
      candidateScore: record.candidate_score || record.Candidate_Score || record.score || 0,
      scoreDescription: String(record.score_description || record.Score_Description || record.scoreDetails || ""),
      // Normalize score_breakdown into an array of display-friendly strings
      score_breakdown: (() => {
        const raw = (record.score_breakdown ?? record.Score_Breakdown ?? record.scoreBreakdown ?? record.ScoreBreakDown) as unknown
        // Array case
        if (Array.isArray(raw)) {
          return raw
            .map((item) => {
              if (typeof item === 'string') return htmlToPlainText(item).trim()
              if (item && typeof item === 'object') {
                const obj = item as Record<string, unknown>
                // Common key possibilities
                const label = (obj.label || obj.name || obj.key || obj.criterion || obj.category) as string | undefined
                const value = (obj.value || obj.score || obj.weight || obj.percent || obj.percentage) as unknown
                if (label != null && (value !== undefined && value !== null && value !== '')) {
                  return `${String(label)}: ${String(value)}`.trim()
                }
                // Fallback: try to stringify a concise representation
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
        // String case
        if (typeof raw === 'string') {
          const cleaned = htmlToPlainText(raw).trim()
          return cleaned ? [cleaned] : []
        }
        // Nothing usable
        return []
      })(),
      jobsMapped: record.jobs_mapped || record.Jobs_Mapped || record.mappedJobs || "",
      currentJobTitle: record.current_job_title || record.Current_Job_Title || record.currentPosition || "",
      currentEmployer: record.current_employer || record.Current_Employer || record.currentCompany || "",
      openToWork: record.open_to_work || record.Open_To_Work || record.availableForWork || true,
      education: record.education || record.Education || record.educationalBackground || "",
      endorsements: record.endorsements || record.Endorsements || record.recommendations || "",
      recommendationsReceived: record.recommendations_received || record.Recommendations_Received || record.recommendationCount || 0,
      linkedinInmailMessageStatus: record.linkedin_inmail_message_status || record.LinkedIn_Inmail_Message_Status || record.inmailStatus || "",
      emailStatus: record.email_status || record.Email_Status || record.emailCommunicationStatus || "",
      linkedinMessages: record.linkedin_messages || record.LinkedIn_Messages || record.linkedinMessageCount || 0,
      emailMessages: record.email_messages || record.Email_Messages || record.emailMessageCount || 0,
      // Handle overall_messages based on its type - using only real data
      overallMessages: (() => {
        // Prefer explicit overall_messages, fallback to Overall_Messages
        const raw = (record.overall_messages ?? record.Overall_Messages) as unknown

        // Array case: map each entry; convert strings from HTML to plain text
        if (Array.isArray(raw)) {
          return raw.map((item: unknown) => {
            if (typeof item === 'string') return htmlToPlainText(item)
            if (item && typeof item === 'object') {
              const obj = { ...(item as Record<string, unknown>) }
              // Try to clean common content keys if present
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

        // String case: convert HTML into plain text
        if (typeof raw === 'string') {
          return htmlToPlainText(raw)
        }

        // Nothing usable
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
      createdAt: record.created_at || record.Created_At || record.createdAt || "",
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

    // Apply search filter if search query is provided
    // Apply search and status filters
    const filteredBySearch = searchQuery
      ? mappedCandidates.filter((candidate: {
          candidateName?: string
          email?: string
          skills?: string
          currentJobTitle?: string
          currentEmployer?: string
          candidateLocation?: string
        }) => {
          const query = searchQuery.toLowerCase()
          return (
            (candidate.candidateName?.toLowerCase() || '').includes(query) ||
            (candidate.email?.toLowerCase() || '').includes(query) ||
            (candidate.skills?.toLowerCase() || '').includes(query) ||
            (candidate.currentJobTitle?.toLowerCase() || '').includes(query) ||
            (candidate.currentEmployer?.toLowerCase() || '').includes(query) ||
            (candidate.candidateLocation?.toLowerCase() || '').includes(query)
          )
        })
      : mappedCandidates

    const filteredCandidates = statusQuery
      ? filteredBySearch.filter((c: { status?: string }) => String(c.status || '').toLowerCase() === statusQuery.toLowerCase())
      : filteredBySearch

    // Sort latest to oldest using createdAt when available, otherwise stable fallback
    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
      const ad = a.createdAt ? new Date(String(a.createdAt)) : null as unknown as Date | null
      const bd = b.createdAt ? new Date(String(b.createdAt)) : null as unknown as Date | null
      const at = ad && !isNaN(ad.getTime()) ? ad.getTime() : 0
      const bt = bd && !isNaN(bd.getTime()) ? bd.getTime() : 0
      if (bt === at) {
        return String(a.id || '').localeCompare(String(b.id || ''))
      }
      return bt - at
    })

    // Slice for requested page/limit on our side
    const start = (page - 1) * limit
    const end = start + limit
    const pageCandidates = sortedCandidates.slice(start, end)

    // Always report the count of the filtered set to match displayed results
    const totalCount = filteredCandidates.length
    
    console.log('Returning to frontend (candidates table):', {
      candidatesOnPage: pageCandidates.length,
      totalCount,
      page,
      limit,
      slice: `${start}-${end}`,
      first3Ids: pageCandidates.slice(0,3).map((c:any)=>c.id),
      last3Ids: pageCandidates.slice(-3).map((c:any)=>c.id),
      statusQuery,
      searchQuery
    })
    
    return NextResponse.json({
      success: true,
      candidates: pageCandidates,
      totalCount,
      page,
      limit,
      message: searchQuery 
        ? `Found ${totalCount} candidates matching "${searchQuery}"` 
        : "Candidates fetched successfully from Wexa table"
    })

  } catch (error) {
    console.error("Error fetching candidates from Wexa AI:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch candidates from Wexa table",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
