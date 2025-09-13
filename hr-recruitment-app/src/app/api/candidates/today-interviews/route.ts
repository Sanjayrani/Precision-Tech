import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware'

export const GET = requireAuth(async (request: NextRequest) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const candidates = await prisma.candidate.findMany({
      where: {
        interviewDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
      orderBy: { interviewDate: 'asc' },
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('Error fetching today\'s interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s interviews' },
      { status: 500 }
    )
  }
})
