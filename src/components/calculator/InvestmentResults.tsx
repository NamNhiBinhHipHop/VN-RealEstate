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
    'Thu nhập thuê': month.rentalIncome,
    'Trả nợ': -month.loanPayment,
    'Phí quản lý': -month.mgmtFee,
    'Dòng tiền ròng': month.netCashflow
  }))

  // Prepare scenario comparison data
  const scenarioData = [
    {
      scenario: 'Bi quan',
      roi: result.scenarios.pessimistic.roi,
      irr: result.scenarios.pessimistic.irr,
      finalValue: result.scenarios.pessimistic.totalEquity
    },
    {
      scenario: 'Cơ sở',
      roi: result.scenarios.base.roi,
      irr: result.scenarios.base.irr,
      finalValue: result.scenarios.base.totalEquity
    },
    {
      scenario: 'Lạc quan',
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
      
      setSaveMessage('Đã lưu kịch bản thành công!')
      if (onSaveScenario) onSaveScenario()
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveMessage(`Lỗi: ${err.message}`)
      } else {
        setSaveMessage('Không thể lưu kịch bản')
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
              Cảnh báo rủi ro
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
                <p className="text-sm text-gray-600">Giá bất động sản</p>
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
                <p className="text-sm text-gray-600">Số tiền vay</p>
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
                <p className="text-sm text-gray-600">Chi phí ban đầu</p>
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
                <p className="text-sm text-gray-600">Dòng tiền hàng tháng</p>
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
          <CardTitle>So sánh kịch bản</CardTitle>
          <CardDescription>
            ROI và IRR theo các kịch bản tăng trưởng khác nhau
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
                    name === 'roi' ? 'ROI (%/năm)' : 
                    name === 'irr' ? 'IRR (%)' : 'Giá trị cuối kỳ'
                  ]}
                />
                <Legend />
                <Bar dataKey="roi" fill="#3b82f6" name="ROI (%/năm)" />
                <Bar dataKey="irr" fill="#10b981" name="IRR (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            {scenarioData.map((scenario, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded">
                <h4 className="font-medium">{scenario.scenario}</h4>
                <p className="text-gray-600">ROI: {formatPercent(scenario.roi)}/năm</p>
                <p className="text-gray-600">IRR: {formatPercent(scenario.irr)}</p>
                <p className="text-gray-600">Giá trị: {formatCurrency(scenario.finalValue)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cashflow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Dòng tiền hàng tháng (5 năm đầu)</CardTitle>
          <CardDescription>
            Theo dõi thu nhập, chi phí và dòng tiền ròng
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
                <Line type="monotone" dataKey="Thu nhập thuê" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="Trả nợ" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Dòng tiền ròng" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết chi phí ban đầu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Thuế chuyển nhượng (0.5%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.transferTax)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí công chứng (0.1%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.notaryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí môi giới (1.5%):</span>
              <span className="font-medium">{formatCurrency(result.initialCosts.brokerageFee)}</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between font-bold">
              <span>Tổng chi phí:</span>
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
                <h4 className="font-medium">Lưu kịch bản này</h4>
                <p className="text-sm text-gray-600">
                  Lưu để so sánh với các kịch bản khác sau này
                </p>
              </div>
              <Button
                onClick={handleSaveScenario}
                disabled={isSaving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu kịch bản'}</span>
              </Button>
            </div>
            {saveMessage && (
              <p className={`mt-2 text-sm ${saveMessage.includes('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

