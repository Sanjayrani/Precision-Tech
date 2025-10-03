import { NextResponse } from 'next/server'

// Trigger WEXA flow to update a candidate by linkedin_url with provided fields
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      linkedin_url,
      candidate_name,
      email,
      phone_number,
      location,
      status,
      stage,
      interview_date,
    } = body || {}

    if (!linkedin_url) {
      return NextResponse.json(
        { success: false, error: 'LinkedIn URL is required' },
        { status: 400 }
      )
    }

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const agentflowId = process.env.NEXT_PUBLIC_WEXA_UPDATE_CANDIDATE
    const executedBy = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    if (!projectId || !apiKey || !agentflowId) {
      return NextResponse.json(
        { success: false, error: 'Missing WEXA config env: PROJECT_ID/SECRET_ID/WEXA_UPDATE_CANDIDATE' },
        { status: 500 }
      )
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`

    const fields: Record<string, unknown> = {}
    if (candidate_name !== undefined) fields.candidate_name = candidate_name
    if (email !== undefined) fields.email = email
    if (phone_number !== undefined) fields.phone_number = phone_number
    if (location !== undefined) fields.location = location
    if (status !== undefined) fields.status = status
    if (stage !== undefined) fields.stage = stage
    if (interview_date !== undefined) fields.interview_date = interview_date

    const requestBody = {
      agentflow_id: agentflowId,
      executed_by: executedBy,
      goal: `Update candidate identified by LinkedIn URL: ${linkedin_url}. Apply provided field updates.`,
      input_variables: {
        action: 'update_candidate',
        linkedin_url,
        ...fields,
        timestamp: new Date().toISOString(),
      },
      projectID: projectId,
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey as string,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { success: false, error: `WEXA error: ${res.status} ${res.statusText} - ${txt}` },
        { status: 502 }
      )
    }

    let data: unknown = {}
    try {
      data = await res.json()
    } catch (e) {
      console.error('Non-JSON response from WEXA flow:', e)
      data = { ok: true }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to trigger candidate update flow:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger candidate update flow' },
      { status: 500 }
    )
  }
}


