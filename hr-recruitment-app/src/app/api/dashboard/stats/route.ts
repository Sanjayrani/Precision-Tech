import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [totalJobs, totalCandidates, todayInterviews, selectedCandidates, rejectedCandidates] = await Promise.all([
      prisma.job.count({ where: { isActive: true } }),
      prisma.candidate.count(),
      prisma.candidate.count({
        where: {
          interviewDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.candidate.count({ where: { status: 'selected' } }),
      prisma.candidate.count({ where: { status: 'rejected' } }),
    ])

    return NextResponse.json({
      totalJobs,
      totalCandidates,
      todayInterviews,
      selectedCandidates,
      rejectedCandidates,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
})
