import { NextResponse } from 'next/server'

type IncomingBody = {
  linkedinUrl?: string
  sending_status?: 'accept' | 'reject'
  candidateId?: string
  candidateName?: string
  channel?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingBody
    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_MESSAGE_SENDER
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    if (!projectId || !agentflow_id || !apiKey) {
      return NextResponse.json({ ok: false, error: 'Missing required env: NEXT_PUBLIC_PROJECT_ID, NEXT_PUBLIC_MESSAGE_SENDER, NEXT_PUBLIC_SECRET_ID' })
    }

    const linkedinUrl = (body.linkedinUrl || '').trim()
    const sendingStatus = body.sending_status === 'reject' ? 'reject' : 'accept'
    const channel = body.channel || 'unknown'

    if (!linkedinUrl) {
      return NextResponse.json(
        { ok: false, error: 'linkedinUrl is required' }
      )
    }

    const goal = `sending_status=${sendingStatus}; linkedin_url=${linkedinUrl}; channel=${channel}`

    const payload = {
      linkedin_url: linkedinUrl,
      sending_status: sendingStatus,
      channel: channel,
      goal,
      executed_by_id: executed_by || undefined,
      candidate_id: body.candidateId || undefined,
      candidate_name: body.candidateName || undefined,
      triggered_at: new Date().toISOString()
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`
    const requestBody = {
      agentflow_id,
      executed_by,
      goal,
      input_variables: {
        sending_status: sendingStatus,
        linkedin_url: linkedinUrl,
        channel: channel,
        candidate_id: body.candidateId || null,
        candidate_name: body.candidateName || null,
        action: 'message_sender',
        timestamp: new Date().toISOString(),
        created_by: 'system'
      },
      projectID: projectId,
      // include the simple payload for debugging/backward-compat on the receiver side
      payload
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? JSON.parse(text) : { text }

    return NextResponse.json({ ok: upstream.ok, status: upstream.status, data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message })
  }
}


