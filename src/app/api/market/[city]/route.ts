import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city: cityParam } = await params
    const city = decodeURIComponent(cityParam)
    
    // Get properties for the city
    const properties = await prisma.property.findMany({
      where: {
        city: city
      }
    })

    if (properties.length === 0) {
      return NextResponse.json(
        { error: 'No market data found for this city.' },
        { status: 404 }
      )
    }

    // Get current market data (interest rates)
    const marketData = await prisma.marketData.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      city,
      properties,
      marketData
    })
  } catch (error) {
    console.error('Market data error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}

