import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { job_title, candidates_required } = body

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_WEXA_LINKEDIN_SOURCING_RECORD_CREATOR
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    console.log("=== LINKEDIN SOURCING API CALLED ===")
    console.log("Triggering WEXA LinkedIn sourcing process flow...")
    console.log("Project ID:", projectId)
    console.log("Agent Flow ID:", agentflow_id)
    console.log("Job Title:", job_title)
    console.log("Candidates Required:", candidates_required)
    console.log("Request body received:", body)

    // Check if required parameters are set
    if (!projectId || !agentflow_id || !apiKey) {
      throw new Error("Missing required parameters")
    }

    // Validate required fields
    if (!job_title || !candidates_required || candidates_required < 1) {
      throw new Error("Missing required fields: job_title and candidates_required (minimum 1) are required")
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`
    const requestBody = {
      agentflow_id: agentflow_id,
      executed_by: executed_by,
      goal: `Source ${candidates_required} LinkedIn candidates for ${job_title} position`,
      input_variables: {
        job_title: job_title,
        candidates_required: candidates_required,
        action: "linkedin_sourcing",
        timestamp: new Date().toISOString(),
        created_by: "system"
      },
      projectID: projectId
    }

    console.log("=== MAKING WEXA API CALL ===")
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

    console.log("=== WEXA API RESPONSE ===")
    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("WEXA API error response:", errorText)
      throw new Error(`WEXA API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    let data = {}
    try {
      data = await response.json()
      console.log("WEXA API response data:", JSON.stringify(data, null, 2))
    } catch (jsonError) {
      console.log("Response is not JSON, treating as success")
      data = { success: true }
    }

    console.log("=== LINKEDIN SOURCING SUCCESS ===")
    console.log("Returning success response")

    return NextResponse.json({
      success: true,
      data: data,
      message: "LinkedIn sourcing process flow triggered successfully",
      sourcing: {
        job_title,
        candidates_required,
        initiated_at: new Date().toISOString(),
        status: "initiated"
      }
    })
  } catch (error) {
    console.error("Error triggering WEXA LinkedIn sourcing:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger LinkedIn sourcing",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
