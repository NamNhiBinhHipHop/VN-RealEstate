import { NextResponse } from 'next/server'
import { loadDistrictStats } from '@/lib/districtStats'

export async function GET() {
  try {
    const districts = await loadDistrictStats()
    return NextResponse.json({
      districts,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to load district stats:', error)
    return NextResponse.json(
      { error: 'Unable to load district stats' },
      { status: 500 }
    )
  }
}

