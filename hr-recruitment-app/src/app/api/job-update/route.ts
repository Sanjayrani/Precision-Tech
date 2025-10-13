import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      job_id,
      job_title, 
      job_description, 
      job_location, 
      company_name, 
      company_description, 
      job_mode, 
      recruiter_name, 
      recruiter_email, 
      recruiter_designation,
      // Weights
      technical_skills_weight,
      soft_skills_weight,
      open_to_work_weight,
      job_match_weight,
      location_match_weight,
      experience_weight,
      education_weight,
      threshold_score,
      custom_weights
    } = body

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_JOB_UPDATE
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    console.log("=== JOB UPDATE API CALLED ===")
    console.log("Job ID:", job_id)
    console.log("Job Title:", job_title)
    console.log("Company:", company_name)
    console.log("Triggering WEXA job update process flow...")

    // Check if required parameters are set
    if (!projectId || !agentflow_id || !apiKey) {
      throw new Error("Missing required parameters")
    }

    // Validate required fields
    if (!job_id || !job_title || !job_description || !job_location || !company_name || !job_mode || !recruiter_name || !recruiter_email || !recruiter_designation) {
      throw new Error("Missing required job fields: job_id, job_title, job_description, job_location, company_name, job_mode, recruiter_name, recruiter_email, and recruiter_designation are required")
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`
    const requestBody = {
      agentflow_id: agentflow_id,
      executed_by: executed_by,
      goal: `Update Job
job_id: ${job_id}
job_title: ${job_title}
job_mode: ${job_mode}
job_description: ${job_description}
job_location: "${job_location}"
company_name: ${company_name}
company_description: ${company_description || "No company description provided"}
recruiter_name: ${recruiter_name}
recruiter_email: ${recruiter_email}
recruiter_designation: ${recruiter_designation}

Candidate Evaluation Weights:
- Technical Skills: ${technical_skills_weight || 35}
- Soft Skills: ${soft_skills_weight || 15}
- Open to Work: ${open_to_work_weight || 5}
- Job Match: ${job_match_weight || 15}
- Location Match: ${location_match_weight || 5}
- Experience: ${experience_weight || 15}
- Education: ${education_weight || 10}
Threshold Score: ${threshold_score ?? 70}
${custom_weights && custom_weights.length > 0 ? `
Custom Weights:
${custom_weights.map((weight: {name: string, weight: number}) => `- ${weight.name}: ${weight.weight}`).join('\n')}` : ''}

Please update the job with ID: ${job_id} with the above information.`,
      input_variables: {
        job_id: job_id,
        job_title: job_title,
        job_description: job_description,
        job_location: job_location,
        company_name: company_name,
        company_description: company_description || "",
        job_mode: job_mode,
        recruiter_name: recruiter_name,
        recruiter_email: recruiter_email,
        recruiter_designation: recruiter_designation,
        // Weights
        technical_skills_weight: technical_skills_weight || 35,
        soft_skills_weight: soft_skills_weight || 15,
        open_to_work_weight: open_to_work_weight || 5,
        job_match_weight: job_match_weight || 15,
        location_match_weight: location_match_weight || 5,
        experience_weight: experience_weight || 15,
        education_weight: education_weight || 10,
        threshold_score: (typeof threshold_score === 'number' ? threshold_score : 70),
        custom_weights: custom_weights || [],
        action: "update_job",
        timestamp: new Date().toISOString(),
        created_by: "system"
      },
      projectID: projectId
    }

    console.log("=== MAKING WEXA API CALL (JOB UPDATE) ===")
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

    console.log("=== WEXA API RESPONSE (JOB UPDATE) ===")
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
    } catch (jsonError) {
      console.log("Response is not JSON, treating as success")
      data = { success: true }
    }

    console.log("=== JOB UPDATE SUCCESS ===")

    return NextResponse.json({
      success: true,
      data: data,
      message: "Job update process flow triggered successfully",
      job: {
        job_id,
        job_title,
        job_description,
        job_location,
        company_name,
        company_description: company_description || "",
        job_mode,
        recruiter_name,
        recruiter_email,
        recruiter_designation,
        // Weights
        technical_skills_weight: technical_skills_weight || 35,
        soft_skills_weight: soft_skills_weight || 15,
        open_to_work_weight: open_to_work_weight || 5,
        job_match_weight: job_match_weight || 15,
        location_match_weight: location_match_weight || 5,
        experience_weight: experience_weight || 15,
        education_weight: education_weight || 10,
        threshold_score: (typeof threshold_score === 'number' ? threshold_score : 70),
        custom_weights: custom_weights || [],
        updatedDate: new Date().toISOString(),
        isActive: true
      }
    })
  } catch (error) {
    console.error("Error triggering WEXA job update:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger job update",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
