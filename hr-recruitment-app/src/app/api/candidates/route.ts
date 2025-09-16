import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const candidateSchema = z.object({
  candidateName: z.string().min(1),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  skills: z.string(),
  experience: z.string().optional(),
  projects: z.string().optional(),
  education: z.string().optional(),
  certificates: z.string().optional(),
  endorsements: z.string().optional(),
  currentJobTitle: z.string().optional(),
  currentEmployer: z.string().optional(),
  openToWork: z.boolean().default(true),
  candidateLocation: z.string().optional(),
  jobId: z.string(),
})

export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')

    const skip = (page - 1) * limit

    const where = {
      ...(search && {
        OR: [
          { candidateName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { skills: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(jobId && { jobId }),
      ...(status && { status }),
    }

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              title: true,
              companyName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.candidate.count({ where }),
    ])

    return NextResponse.json({
      candidates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const validatedData = candidateSchema.parse(body)

    // Check if candidate already exists for this job
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        email: validatedData.email,
        jobId: validatedData.jobId,
      },
    })

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'Candidate already exists for this job' },
        { status: 400 }
      )
    }

    const candidate = await prisma.candidate.create({
      data: validatedData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
    })

    return NextResponse.json(candidate, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    )
  }
})
