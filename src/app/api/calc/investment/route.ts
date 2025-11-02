import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { InvestmentCalculator, InvestmentInput } from '@/lib/calculations'
import { z } from 'zod'

const investmentSchema = z.object({
  equityCapital: z.number().min(0, 'Vốn chủ sở hữu phải lớn hơn 0'),
  loanPct: z.number().min(0).max(100, 'Tỷ lệ vay phải từ 0-100%'),
  propertySize: z.number().min(1, 'Diện tích phải lớn hơn 0'),
  city: z.string().min(1, 'Thành phố không được để trống'),
  propertyType: z.enum(['APARTMENT', 'LAND', 'SHOPHOUSE', 'OFFICETEL']),
  investHorizonYears: z.number().min(1).max(50, 'Thời gian đầu tư từ 1-50 năm'),
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
        { error: 'Không tìm thấy dữ liệu bất động sản cho loại và thành phố này' },
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
        { error: 'Không tìm thấy dữ liệu lãi suất' },
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
          error: 'Vốn chủ sở hữu không đủ',
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
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

