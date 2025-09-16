import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    console.log("=== ACTIVE JOBS API CALLED ===")
    
    // Get active jobs with candidate count
    const activeJobs = await prisma.job.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        mode: true,
        postedDate: true,
        _count: {
          select: {
            candidates: true
          }
        }
      },
      orderBy: {
        postedDate: 'desc'
      }
    })
    
    console.log("Active jobs found:", activeJobs.length)
    
    return NextResponse.json({
      success: true,
      jobs: activeJobs,
      count: activeJobs.length
    })
    
  } catch (error) {
    console.error("Error fetching active jobs:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch active jobs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
