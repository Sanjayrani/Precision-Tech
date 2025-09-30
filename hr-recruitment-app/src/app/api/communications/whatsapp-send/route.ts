import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      candidate_name,
      candidate_phone,
      job_title,
      message,
    } = body

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    if (!projectId || !agentflow_id || !apiKey) {
      throw new Error("Missing required parameters")
    }

    if (!candidate_phone || !message) {
      throw new Error("Missing required fields: candidate_phone and message are required")
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`

    const requestBody = {
      agentflow_id,
      executed_by,
      goal: `Send WhatsApp message\nCandidate: ${candidate_name || 'candidate'}\nPhone: ${candidate_phone}\nJob: ${job_title || 'the opportunity'}\n\nMessage:\n${message}`,
      input_variables: {
        candidate_name: candidate_name || "",
        candidate_phone,
        job_title: job_title || "",
        message,
        action: "whatsapp_send",
        timestamp: new Date().toISOString(),
        created_by: "system",
      },
      projectID: projectId,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WEXA API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    let data: unknown = {}
    try {
      data = await response.json()
    } catch {
      data = { success: true }
    }

    return NextResponse.json({
      success: true,
      data,
      message: "WhatsApp sender flow triggered",
    })
  } catch (error) {
    console.error("Error triggering WhatsApp sender:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger WhatsApp sender",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}


