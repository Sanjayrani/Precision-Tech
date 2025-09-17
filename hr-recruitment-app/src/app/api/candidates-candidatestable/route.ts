import { NextResponse } from "next/server"
import { htmlToPlainText } from "@/lib/formatHtml"

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const tableId = process.env.NEXT_PUBLIC_CANDIDATES_TABLE_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID

    console.log("Fetching candidates from Wexa API...")
    console.log("Project ID:", projectId)
    console.log("Candidates Table ID:", tableId)

    // Check if required parameters are set
    if (!projectId || !tableId || !apiKey) {
      throw new Error("Missing required parameters")
    }

    const url = `https://api.wexa.ai/storage/${projectId}/${tableId}?page=1&query=&sort=1&sort_key=_id`

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
    console.log("Candidates records count:", data.records?.length || 0)
    
    // Map the records to match the candidates schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedCandidates = data.records?.map((record: any, index: number) => ({
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
      job: {
        id: record.Job_id || record.Job_ID || record.associatedJob || "",
        title: record.jobs_mapped || record.Jobs_Mapped || "Job Title",
        companyName: record.current_employer || record.Current_Employer || record.currentCompany || "Company"
      }
    })) || []

    return NextResponse.json({
      success: true,
      candidates: mappedCandidates,
      totalCount: data.total_count || mappedCandidates.length,
      message: "Candidates fetched successfully from Wexa table"
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
