import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/auth'
import { z } from 'zod'

const compareScenarioSchema = z.object({
  scenarioIds: z.array(z.string()).min(2, 'Select at least two scenarios to compare').max(5, 'You can compare up to five scenarios at once')
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    const { scenarioIds } = compareScenarioSchema.parse(body)

    // Get scenarios belonging to the user
    const scenarios = await prisma.scenario.findMany({
      where: {
        id: { in: scenarioIds },
        userId: user.userId
      },
      include: {
        property: {
          select: {
            type: true,
            city: true,
            avgPricePerM2: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (scenarios.length !== scenarioIds.length) {
      return NextResponse.json(
        { error: 'Some scenarios were not found or do not belong to your account.' },
        { status: 404 }
      )
    }

    // Format scenarios for comparison
    const comparison = scenarios.map(scenario => {
      const calcResult = scenario.calcResultJson as any
      
      return {
        id: scenario.id,
        name: `${scenario.property.city} - ${scenario.property.type}`,
        equityCapital: scenario.equityCapital,
        loanPct: scenario.loanPct,
        investHorizonYears: scenario.investHorizonYears,
        createdAt: scenario.createdAt,
        property: scenario.property,
        summary: {
          propertyPrice: calcResult.propertyPrice,
          loanAmount: calcResult.loanAmount,
          totalInitialCosts: calcResult.initialCosts.total,
          monthlyNetCashflow: calcResult.monthlyData[0]?.netCashflow || 0,
          scenarios: {
            pessimistic: {
              roi: calcResult.scenarios.pessimistic.roi,
              irr: calcResult.scenarios.pessimistic.irr,
              totalEquity: calcResult.scenarios.pessimistic.totalEquity
            },
            base: {
              roi: calcResult.scenarios.base.roi,
              irr: calcResult.scenarios.base.irr,
              totalEquity: calcResult.scenarios.base.totalEquity
            },
            optimistic: {
              roi: calcResult.scenarios.optimistic.roi,
              irr: calcResult.scenarios.optimistic.irr,
              totalEquity: calcResult.scenarios.optimistic.totalEquity
            }
          },
          alerts: calcResult.alerts
        }
      }
    })

    // Calculate comparison metrics
    const metrics = {
      bestROI: comparison.reduce((best, current) => 
        current.summary.scenarios.base.roi > best.summary.scenarios.base.roi ? current : best
      ),
      bestIRR: comparison.reduce((best, current) => 
        current.summary.scenarios.base.irr > best.summary.scenarios.base.irr ? current : best
      ),
      lowestRisk: comparison.reduce((lowest, current) => 
        current.summary.alerts.length < lowest.summary.alerts.length ? current : lowest
      ),
      highestCashflow: comparison.reduce((highest, current) => 
        current.summary.monthlyNetCashflow > highest.summary.monthlyNetCashflow ? current : highest
      )
    }

    return NextResponse.json({
      scenarios: comparison,
      metrics: {
        bestROI: { id: metrics.bestROI.id, name: metrics.bestROI.name, roi: metrics.bestROI.summary.scenarios.base.roi },
        bestIRR: { id: metrics.bestIRR.id, name: metrics.bestIRR.name, irr: metrics.bestIRR.summary.scenarios.base.irr },
        lowestRisk: { id: metrics.lowestRisk.id, name: metrics.lowestRisk.name, alertCount: metrics.lowestRisk.summary.alerts.length },
        highestCashflow: { id: metrics.highestCashflow.id, name: metrics.highestCashflow.name, cashflow: metrics.highestCashflow.summary.monthlyNetCashflow }
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Compare scenarios error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
})

