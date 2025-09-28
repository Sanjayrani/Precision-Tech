import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
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
      custom_weights
    } = body

    const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
    const agentflow_id = process.env.NEXT_PUBLIC_WEXA_CREATE_A_JOB
    const apiKey = process.env.NEXT_PUBLIC_SECRET_ID
    const executed_by = process.env.NEXT_PUBLIC_EXECUTED_BY_ID

    console.log("=== JOB CREATION API CALLED ===")
    console.log("Triggering WEXA job creation process flow...")

    // Check if required parameters are set
    if (!projectId || !agentflow_id || !apiKey) {
      throw new Error("Missing required parameters")
    }

    // Validate required fields
    if (!job_title || !job_description || !job_location || !company_name || !job_mode || !recruiter_name || !recruiter_email || !recruiter_designation) {
      throw new Error("Missing required job fields: job_title, job_description, job_location, company_name, job_mode, recruiter_name, recruiter_email, and recruiter_designation are required")
    }

    const url = `https://api.wexa.ai/execute_flow?projectID=${projectId}`
    const requestBody = {
      agentflow_id: agentflow_id,
      executed_by: executed_by,
      goal: `Job Title : ${job_title}
      Job Mode : ${job_mode}
Job Description : ${job_description}
Job Location : "${job_location}"
Company Name : ${company_name}
Company Description : ${company_description || "No company description provided"}
Recruiter Name : ${recruiter_name}
Recruiter Email : ${recruiter_email}
Recruiter Designation : ${recruiter_designation}

Candidate Evaluation Weights:
- Technical Skills: ${technical_skills_weight || 35}%
- Soft Skills: ${soft_skills_weight || 15}%
- Open to Work: ${open_to_work_weight || 5}%
- Job Match: ${job_match_weight || 15}%
- Location Match: ${location_match_weight || 5}%
- Experience: ${experience_weight || 15}%
- Education: ${education_weight || 10}%${custom_weights && custom_weights.length > 0 ? `
Custom Weights:
${custom_weights.map((weight: any) => `- ${weight.name}: ${weight.weight}%`).join('\n')}` : ''}`,
      input_variables: {
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
        custom_weights: custom_weights || [],
        action: "create_job",
        timestamp: new Date().toISOString(),
        created_by: "system"
      },
      projectID: projectId
    }

    console.log("=== MAKING WEXA API CALL ===")

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
      // Redacted verbose API response body from logs
    } catch (jsonError) {
      console.log("Response is not JSON, treating as success")
      data = { success: true }
    }

    console.log("=== JOB CREATION SUCCESS ===")

    return NextResponse.json({
      success: true,
      data: data,
      message: "Job creation process flow triggered successfully",
      job: {
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
        custom_weights: custom_weights || [],
        postedDate: new Date().toISOString(),
        isActive: true
      }
    })
  } catch (error) {
    console.error("Error triggering WEXA job creation:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to trigger job creation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
