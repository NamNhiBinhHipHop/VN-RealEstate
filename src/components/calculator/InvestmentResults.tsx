'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { AlertTriangle, TrendingUp, DollarSign, Calendar, Save } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { api, ApiError } from '@/lib/api'

interface InvestmentResultsProps {
  data: any
  onSaveScenario?: () => void
}

export function InvestmentResults({ data, onSaveScenario }: InvestmentResultsProps) {
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  const { input, result } = data

  // Prepare chart data for monthly cashflow
  const monthlyChartData = result.monthlyData.slice(0, 60).map((month: any) => ({
    month: month.month,
    'Rental income': month.rentalIncome,
    'Debt service': -month.loanPayment,
    'Management fee': -month.mgmtFee,
    'Net cash flow': month.netCashflow
  }))

  // Prepare scenario comparison data
  const scenarioData = [
    {
      scenario: 'Pessimistic',
      roi: result.scenarios.pessimistic.roi,
      irr: result.scenarios.pessimistic.irr,
      finalValue: result.scenarios.pessimistic.totalEquity
    },
    {
      scenario: 'Base case',
      roi: result.scenarios.base.roi,
      irr: result.scenarios.base.irr,
      finalValue: result.scenarios.base.totalEquity
    },
    {
      scenario: 'Optimistic',
      roi: result.scenarios.optimistic.roi,
      irr: result.scenarios.optimistic.irr,
      finalValue: result.scenarios.optimistic.totalEquity
    }
  ]

  const handleSaveScenario = async () => {
    if (!user) return
    
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      await api.saveScenario({
        propertyId: input.property.id,
        equityCapital: input.equityCapital,
        loanPct: input.loanPct,
        investHorizonYears: input.investHorizonYears,
        calcResult: result
      })
      
      setSaveMessage('Scenario saved successfully!')
      if (onSaveScenario) onSaveScenario()
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveMessage(`Error: ${err.message}`)
      } else {
        setSaveMessage('Unable to save this scenario.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {result.alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Risk alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {result.alerts.map((alert: string, index: number) => (
                <li key={index} className="text-orange-700 text-sm">• {alert}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Property value</p>
                <p className="text-lg font-bold">{formatCurrency(result.propertyPrice)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Loan amount</p>
                <p className="text-lg font-bold">{formatCurrency(result.loanAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upfront costs</p>
                <p className="text-lg font-bold">{formatCurrency(result.initialCosts.total)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly cash flow</p>
                <p className="text-lg font-bold">
                  {formatCurrency(result.monthlyData[0]?.netCashflow || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario comparison</CardTitle>
          <CardDescription>
            ROI and IRR under different growth assumptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="scenario" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    name === 'finalValue' ? formatCurrency(value) : `${formatNumber(value, 1)}%`,
                    name === 'roi' ? 'ROI (%/year)' :
                    name === 'irr' ? 'IRR (%)' : 'Ending equity'
                  ]}
                />
                <Legend />
                <Bar dataKey="roi" fill="#3b82f6" name="ROI (%/year)" />
                <Bar dataKey="irr" fill="#10b981" name="IRR (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            {scenarioData.map((scenario, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded">
                <h4 className="font-medium">{scenario.scenario}</h4>
                <p className="text-gray-600">ROI: {formatPercent(scenario.roi)}/year</p>
                <p className="text-gray-600">IRR: {formatPercent(scenario.irr)}</p>
                <p className="text-gray-600">Ending equity: {formatCurrency(scenario.finalValue)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cashflow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly cash flow (first 5 years)</CardTitle>
          <CardDescription>
            Track rental income, expenses, and net cash flow over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace('₫', '')} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="Rental income" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Debt service" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Net cash flow" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Upfront cost breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Transfer tax (0.5%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.transferTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Notary fee (0.1%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.notaryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Brokerage fee (1.5%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.brokerageFee)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Total upfront costs:</span>
              <span>{formatCurrency(result.initialCosts.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Scenario */}
      {user && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Save this scenario</h4>
                <p className="text-sm text-gray-600">
                  Store the current run so you can compare it later.
                </p>
              </div>
              <Button
                onClick={handleSaveScenario}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save scenario'}</span>
              </Button>
            </div>
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveMessage.toLowerCase().includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

