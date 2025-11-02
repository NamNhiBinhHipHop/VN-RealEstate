import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { z } from 'zod'

const saveScenarioSchema = z.object({
  propertyId: z.string(),
  equityCapital: z.number(),
  loanPct: z.number(),
  investHorizonYears: z.number(),
  calcResult: z.object({
    propertyPrice: z.number(),
    loanAmount: z.number(),
    initialCosts: z.object({
      transferTax: z.number(),
      notaryFee: z.number(),
      brokerageFee: z.number(),
      total: z.number()
    }),
    monthlyData: z.array(z.object({
      month: z.number(),
      loanPayment: z.number(),
      rentalIncome: z.number(),
      mgmtFee: z.number(),
      netCashflow: z.number(),
      loanBalance: z.number()
    })),
    scenarios: z.object({
      pessimistic: z.object({
        propertyValue: z.number(),
        totalEquity: z.number(),
        roi: z.number(),
        irr: z.number()
      }),
      base: z.object({
        propertyValue: z.number(),
        totalEquity: z.number(),
        roi: z.number(),
        irr: z.number()
      }),
      optimistic: z.object({
        propertyValue: z.number(),
        totalEquity: z.number(),
        roi: z.number(),
        irr: z.number()
      })
    }),
    alerts: z.array(z.string())
  })
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const data = saveScenarioSchema.parse(body)

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Không tìm thấy bất động sản' },
        { status: 404 }
      )
    }

    // Save scenario
    const scenario = await prisma.scenario.create({
      data: {
        userId: user.userId,
        propertyId: data.propertyId,
        equityCapital: data.equityCapital,
        loanPct: data.loanPct,
        investHorizonYears: data.investHorizonYears,
        calcResultJson: data.calcResult
      },
      include: {
        property: true
      }
    })

    return NextResponse.json({
      message: 'Lưu kịch bản thành công',
      scenario: {
        id: scenario.id,
        equityCapital: scenario.equityCapital,
        loanPct: scenario.loanPct,
        investHorizonYears: scenario.investHorizonYears,
        createdAt: scenario.createdAt,
        property: {
          type: scenario.property.type,
          city: scenario.property.city
        },
        calcResult: scenario.calcResultJson
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Save scenario error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
})

