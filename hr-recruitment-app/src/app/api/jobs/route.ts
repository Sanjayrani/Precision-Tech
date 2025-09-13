import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'
import { z } from 'zod'

const jobSchema = z.object({
  title: z.string().min(1),
  mode: z.enum(['remote', 'hybrid', 'onsite']),
  description: z.string().min(1),
  location: z.string().min(1),
  recruiterName: z.string().min(1),
  recruiterDetails: z.string().optional(),
  recruiterDesignation: z.string().min(1),
  companyName: z.string().min(1),
  companyDescription: z.string().optional(),
})

export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const page = searchParams.get('page') || '1'
    const search = searchParams.get('search')

    const take = limit ? parseInt(limit) : undefined
    const skip = take ? (parseInt(page) - 1) * take : undefined

    const where = {
      isActive: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          _count: {
            select: { candidates: true },
          },
        },
        orderBy: { postedDate: 'desc' },
        take,
        skip,
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: take || total,
        totalPages: take ? Math.ceil(total / take) : 1,
      },
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
})

export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const validatedData = jobSchema.parse(body)

    const job = await prisma.job.create({
      data: {
        ...validatedData,
        recruiterId: user.userId,
      },
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
})
