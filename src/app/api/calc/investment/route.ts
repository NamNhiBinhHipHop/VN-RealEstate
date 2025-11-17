import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { InvestmentCalculator, InvestmentInput } from '@/lib/calculations'
import { z } from 'zod'

const investmentSchema = z.object({
  equityCapital: z.number().min(0, 'Equity must be greater than 0'),
  loanPct: z.number().min(0).max(100, 'Loan percentage must be between 0 and 100'),
  propertySize: z.number().min(1, 'Floor area must be greater than 0'),
  city: z.string().min(1, 'City is required'),
  propertyType: z.enum(['APARTMENT', 'LAND', 'SHOPHOUSE', 'OFFICETEL']),
  investHorizonYears: z.number().min(1).max(50, 'Investment horizon must be between 1 and 50 years'),
  bankId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = investmentSchema.parse(body)

    // Get property data
    const property = await prisma.property.findFirst({
      where: {
        city: data.city,
        type: data.propertyType
      }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'No property data found for the selected city and type.' },
        { status: 404 }
      )
    }

    // Get market data (interest rate)
    let marketData
    if (data.bankId) {
      marketData = await prisma.marketData.findUnique({
        where: { id: data.bankId }
      })
    } else {
      // Get the bank with lowest interest rate
      marketData = await prisma.marketData.findFirst({
        orderBy: { interestRate: 'asc' }
      })
    }

    if (!marketData) {
      return NextResponse.json(
        { error: 'Interest-rate data is unavailable.' },
        { status: 404 }
      )
    }

    // Calculate property price and validate equity
    const propertyPrice = data.propertySize * property.avgPricePerM2
    const loanAmount = propertyPrice * (data.loanPct / 100)
    const requiredEquity = propertyPrice - loanAmount

    if (data.equityCapital < requiredEquity) {
      return NextResponse.json(
        {
          error: 'Equity is not sufficient for this deal.',
          details: {
            propertyPrice,
            loanAmount,
            requiredEquity,
            shortfall: requiredEquity - data.equityCapital
          }
        },
        { status: 400 }
      )
    }

    // Prepare calculation input
    const calculationInput: InvestmentInput = {
      equityCapital: data.equityCapital,
      loanPct: data.loanPct,
      propertySize: data.propertySize,
      pricePerM2: property.avgPricePerM2,
      avgYieldPct: property.avgYieldPct,
      mgmtFeePct: property.mgmtFeePct,
      interestRate: marketData.interestRate,
      loanTermYears: marketData.loanTermYears,
      investHorizonYears: data.investHorizonYears
    }

    // Calculate investment results
    const result = InvestmentCalculator.calculate(calculationInput)

    return NextResponse.json({
      input: {
        ...data,
        property: {
          id: property.id,
          type: property.type,
          city: property.city,
          avgPricePerM2: property.avgPricePerM2,
          avgYieldPct: property.avgYieldPct,
          mgmtFeePct: property.mgmtFeePct
        },
        marketData: {
          bankName: marketData.bankName,
          interestRate: marketData.interestRate,
          loanTermYears: marketData.loanTermYears
        }
      },
      result
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Investment calculation error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

