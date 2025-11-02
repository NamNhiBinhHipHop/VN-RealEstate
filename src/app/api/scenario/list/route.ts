import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get user's scenarios with pagination
    const [scenarios, total] = await Promise.all([
      prisma.scenario.findMany({
        where: { userId: user.userId },
        include: {
          property: {
            select: {
              type: true,
              city: true,
              avgPricePerM2: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.scenario.count({
        where: { userId: user.userId }
      })
    ])

    const formattedScenarios = scenarios.map(scenario => ({
      id: scenario.id,
      equityCapital: scenario.equityCapital,
      loanPct: scenario.loanPct,
      investHorizonYears: scenario.investHorizonYears,
      createdAt: scenario.createdAt,
      property: scenario.property,
      calcResult: scenario.calcResultJson
    }))

    return NextResponse.json({
      scenarios: formattedScenarios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('List scenarios error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
})

