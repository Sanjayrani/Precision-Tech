import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      // Core identifiers
      id,
      candidate_id,
      candidateName,
      email,
      phoneNumber,
      linkedinUrl,
      candidateLocation,
      status,
      stage,
      interviewDate,
      // Additional optional fields
      currentJobTitle,
      currentEmployer,
      skills,
      experience,
      education,
      projects,
      certifications,
      endorsements,
      openToWork,
      jobId
    } = body

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_CANDIDATE_UPDATE
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    console.log("=== CANDIDATE UPDATE API CALLED ===")
    console.log("Request body:", JSON.stringify(body, null, 2))
    console.log("Environment variables:", {
      projectId: projectId ? "SET" : "MISSING",
      agentflow_id: agentflow_id ? "SET" : "MISSING", 
      apiKey: apiKey ? "SET" : "MISSING",
      executed_by: executed_by ? "SET" : "MISSING"
    })
    console.log("Triggering WEXA candidate update process flow...")

    if (!projectId || !agentflow_id || !apiKey) {
      console.error("Missing required parameters:", { projectId, agentflow_id, apiKey })
      throw new Error("Missing required parameters")
    }

    // At least one identifier and a name or email should be provided
    if (!(id || candidate_id) || !(candidateName || email)) {
      throw new Error("Missing required candidate fields: id/candidate_id and candidateName/email are required")
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`
    const requestBody = {
      agentflow_id: agentflow_id,
      executed_by: executed_by,
      goal: `Update Candidate\nCandidate ID: ${id || candidate_id}\nName: ${candidateName }\nEmail: ${email}\nPhone: ${phoneNumber}\nLinkedIn: ${linkedinUrl}\nLocation: ${candidateLocation}\nStatus: ${status}\nStage: ${stage}\nInterview Date: ${interviewDate || ''}\nJob ID: ${jobId}`,
      input_variables: {
        action: "candidate_update",
        candidate_id: id || candidate_id,
        candidateName: candidateName,
        email: email,
        phoneNumber: phoneNumber,
        linkedinUrl: linkedinUrl,
        candidateLocation: candidateLocation,
        status: status,
        stage: stage,
        interviewDate: interviewDate,
        currentJobTitle: currentJobTitle,
        currentEmployer: currentEmployer,
        skills: skills,
        experience: experience,
        education: education,
        projects: projects,
        certifications: certifications,
        endorsements: endorsements,
        openToWork: typeof openToWork === 'boolean' ? openToWork : undefined,
        jobId: jobId,
        timestamp: new Date().toISOString(),
        created_by: "system"
      },
      projectID: projectId
    }

    console.log("=== MAKING WEXA API CALL (CANDIDATE UPDATE) ===")
    console.log("URL:", url)
    console.log("Request body:", JSON.stringify(requestBody, null, 2))
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    console.log("=== WEXA API RESPONSE (CANDIDATE UPDATE) ===")
    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("WEXA API error response:", errorText)
      throw new Error(`WEXA API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    let data: unknown = {}
    try {
      data = await response.json()
    } catch {
      data = { success: true }
    }

    console.log("=== CANDIDATE UPDATE SUCCESS ===")

    return NextResponse.json({
      success: true,
      data,
      message: "Candidate update process flow triggered successfully",
    })
  } catch (error) {
    console.error("Error triggering WEXA candidate update:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger candidate update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}


