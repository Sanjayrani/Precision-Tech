import { NextRequest, NextResponse } from "next/server"
import { htmlToPlainText } from "@/lib/formatHtml"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageParam = parseInt(searchParams.get('page') || '1', 10)
    const limitParam = parseInt(searchParams.get('limit') || '10', 10)
    const searchQuery = searchParams.get('search') || ''
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : Math.min(limitParam, 100)
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_CANDIDATES_TABLE_ID
    const jobsTableId = process.env.NEXT_PUBLIC_JOBS_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    console.log("Fetching ALL candidates for communications from Wexa API...")
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
    
    // Helper function to check if overall_messages has actual content
    const hasValidOverallMessages = (record: Record<string, unknown>): boolean => {
      const raw = record.overall_messages ?? record.Overall_Messages
      
      // Check if it's a non-empty string
      if (typeof raw === 'string' && raw.trim() !== '') {
        return true
      }
      
      // Check if it's a non-empty array
      if (Array.isArray(raw) && raw.length > 0) {
        return true
      }
      
      // Check if it's an object with actual content
      if (raw && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>
        // Check for Recruiter/Candidate keys with content
        if ('Recruiter' in obj || 'Candidate' in obj) {
          return true
        }
        // Check for any non-empty values
        if (Object.keys(obj).length > 0) {
          return Object.values(obj).some(value => {
            if (typeof value === 'string' && value.trim() !== '') return true
            if (Array.isArray(value) && value.length > 0) return true
            return false
          })
        }
      }
      
      return false
    }
    
    // Map ALL records to match the candidates schema (no filtering by overall_messages)
    const mappedCandidates = candidatesRecords
      ?.map((record: unknown, index: number) => {
        const rec = record as Record<string, unknown>
        const hasMessages = hasValidOverallMessages(rec)
        
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
      // Normalize score_breakdown into an array of display-friendly strings
      score_breakdown: (() => {
        const raw = (rec.score_breakdown ?? rec.Score_Breakdown ?? rec.scoreBreakdown ?? rec.ScoreBreakDown) as unknown
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
      jobsMapped: rec.jobs_mapped || rec.Jobs_Mapped || rec.mappedJobs || "",
      currentJobTitle: rec.current_job_title || rec.Current_Job_Title || rec.currentPosition || "",
      currentEmployer: rec.current_employer || rec.Current_Employer || rec.currentCompany || "",
      openToWork: rec.open_to_work || rec.Open_To_Work || rec.availableForWork || true,
      education: rec.education || rec.Education || rec.educationalBackground || "",
      endorsements: rec.endorsements || rec.Endorsements || rec.recommendations || "",
      recommendationsReceived: rec.recommendations_received || rec.Recommendations_Received || rec.recommendationCount || 0,
      linkedinInmailMessageStatus: rec.linkedin_inmail_message_status || rec.LinkedIn_Inmail_Message_Status || rec.inmailStatus || "",
      emailStatus: rec.email_status || rec.Email_Status || rec.emailCommunicationStatus || "",
      linkedinMessages: rec.linkedin_messages || rec.LinkedIn_Messages || rec.linkedinMessageCount || 0,
      emailMessages: rec.email_messages || rec.Email_Messages || rec.emailMessageCount || 0,
      // Handle overall_messages based on its type - using only real data
      overallMessages: (() => {
        // Prefer explicit overall_messages, fallback to Overall_Messages
        const raw = (rec.overall_messages ?? rec.Overall_Messages) as unknown

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

        // Object case: return as-is since we already validated it has content
        if (raw && typeof raw === 'object') {
          return raw
        }

        // Nothing usable
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
      createdAt: rec.created_at || rec.Created_At || rec.createdAt || "",
      // Add metadata about whether this candidate has messages
      hasMessages: hasMessages,
      messageCount: (() => {
        if (!hasMessages) return 0
        const rawOverall = (rec.overall_messages ?? rec.Overall_Messages) as unknown
        return Array.isArray(rawOverall) ? rawOverall.length : 1
      })(),
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

    // Apply search filter if search query is provided
    const filteredCandidates = searchQuery 
      ? mappedCandidates.filter((candidate: {
          candidateName?: string
          email?: string
          phoneNumber?: string
          currentJobTitle?: string
          currentEmployer?: string
        }) => {
          const query = searchQuery.toLowerCase()
          return (
            (candidate.candidateName?.toLowerCase() || '').includes(query) ||
            (candidate.email?.toLowerCase() || '').includes(query) ||
            (candidate.phoneNumber?.toLowerCase() || '').includes(query) ||
            (candidate.currentJobTitle?.toLowerCase() || '').includes(query) ||
            (candidate.currentEmployer?.toLowerCase() || '').includes(query)
          )
        })
      : mappedCandidates

    // Sort candidates: those with non-empty overall_messages first, then remaining candidates
    const sortedCandidates = [...filteredCandidates].sort((a, b) => {
      // Check if overall_messages has any content (array with items OR non-empty string)
      const aHasMessages = a.overallMessages && (
        (Array.isArray(a.overallMessages) && a.overallMessages.length > 0) ||
        (typeof a.overallMessages === 'string' && a.overallMessages.trim() !== '')
      )
      const bHasMessages = b.overallMessages && (
        (Array.isArray(b.overallMessages) && b.overallMessages.length > 0) ||
        (typeof b.overallMessages === 'string' && b.overallMessages.trim() !== '')
      )
      
      // Debug logging to see what's happening
      console.log('Sorting candidates:', {
        a: { 
          name: a.candidateName, 
          messages: a.overallMessages, 
          type: typeof a.overallMessages,
          isArray: Array.isArray(a.overallMessages), 
          length: Array.isArray(a.overallMessages) ? a.overallMessages.length : (typeof a.overallMessages === 'string' ? a.overallMessages.length : 'N/A'),
          hasMessages: aHasMessages 
        },
        b: { 
          name: b.candidateName, 
          messages: b.overallMessages, 
          type: typeof b.overallMessages,
          isArray: Array.isArray(b.overallMessages), 
          length: Array.isArray(b.overallMessages) ? b.overallMessages.length : (typeof b.overallMessages === 'string' ? b.overallMessages.length : 'N/A'),
          hasMessages: bHasMessages 
        }
      })
      
      // First sort by message status (those with messages first)
      if (aHasMessages && !bHasMessages) {
        console.log(`${a.candidateName} (HAS messages) should come before ${b.candidateName} (NO messages)`)
        return -1
      }
      if (!aHasMessages && bHasMessages) {
        console.log(`${b.candidateName} (HAS messages) should come before ${a.candidateName} (NO messages)`)
        return 1
      }
      
      // Then sort by creation date (latest first)
      const ad = a.createdAt ? new Date(String(a.createdAt)) : null as unknown as Date | null
      const bd = b.createdAt ? new Date(String(b.createdAt)) : null as unknown as Date | null
      const at = ad && !isNaN(ad.getTime()) ? ad.getTime() : 0
      const bt = bd && !isNaN(bd.getTime()) ? bd.getTime() : 0
      return bt - at
    })

    // Slice for requested page/limit on our side
    const start = (page - 1) * limit
    const end = start + limit
    const pageCandidates = sortedCandidates.slice(start, end)

    // Use the correct total count from filtered results
    const totalCount = filteredCandidates.length
    
    console.log('Returning to frontend:', { 
      candidatesOnPage: pageCandidates.length, 
      totalCount,
      page,
      limit,
      slice: `${start}-${end}`,
      totalFromAPI: candidatesRecords.length,
      searchQuery,
      withMessages: filteredCandidates.filter((c: { hasMessages: boolean }) => c.hasMessages).length,
      withoutMessages: filteredCandidates.filter((c: { hasMessages: boolean }) => !c.hasMessages).length
    })
    
    return NextResponse.json({
      success: true,
      candidates: pageCandidates,
      totalCount,
      page,
      limit,
      message: searchQuery 
        ? `Found ${totalCount} candidates matching "${searchQuery}"`
        : "All candidates fetched successfully from Wexa table",
      // Important: Stats should always reflect the full dataset, not the search subset
      stats: {
        totalCandidates: mappedCandidates.length,
        withMessages: mappedCandidates.filter((c: { hasMessages: boolean }) => c.hasMessages).length,
        withoutMessages: mappedCandidates.filter((c: { hasMessages: boolean }) => !c.hasMessages).length
      }
    })

  } catch (error) {
    console.error("Error fetching all candidates from Wexa AI:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch all candidates from Wexa table",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    )
  }
}
