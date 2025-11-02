'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { PROPERTY_TYPES, CITIES, type Property, type MarketData } from '@/lib/types'
import { api, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface InvestmentFormProps {
  onCalculate: (result: any) => void
  isLoading: boolean
}

export function InvestmentForm({ onCalculate, isLoading }: InvestmentFormProps) {
  const [formData, setFormData] = useState({
    equityCapital: 2000000000, // 2 tỷ VND
    loanPct: 70,
    propertySize: 80, // 80m2
    city: 'Hanoi',
    propertyType: 'APARTMENT' as keyof typeof PROPERTY_TYPES,
    investHorizonYears: 10,
    bankId: ''
  })
  
  const [marketData, setMarketData] = useState<{
    properties: Property[]
    marketData: MarketData[]
  } | null>(null)
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [error, setError] = useState('')

  // Load market data when city or property type changes
  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const data = await api.getMarketData(formData.city)
        setMarketData({ properties: data.properties, marketData: data.marketData })
        
        // Find matching property
        const property = data.properties.find((p: Property) => p.type === formData.propertyType)
        setSelectedProperty(property || null)
      } catch (err) {
        console.error('Failed to load market data:', err)
      }
    }

    loadMarketData()
  }, [formData.city, formData.propertyType])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const calculatePropertyPrice = () => {
    if (!selectedProperty) return 0
    return formData.propertySize * selectedProperty.avgPricePerM2
  }

  const calculateLoanAmount = () => {
    return calculatePropertyPrice() * (formData.loanPct / 100)
  }

  const calculateRequiredEquity = () => {
    return calculatePropertyPrice() - calculateLoanAmount()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedProperty) {
      setError('Không tìm thấy dữ liệu bất động sản cho loại và thành phố này')
      return
    }

    const requiredEquity = calculateRequiredEquity()
    if (formData.equityCapital < requiredEquity) {
      setError(`Vốn chủ sở hữu không đủ. Cần tối thiểu ${formatCurrency(requiredEquity)}`)
      return
    }

    try {
      const result = await api.calculateInvestment(formData)
      onCalculate(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Đã xảy ra lỗi khi tính toán')
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Thông tin đầu tư</CardTitle>
        <CardDescription>
          Nhập thông tin để tính toán khả năng đầu tư bất động sản
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vốn chủ sở hữu */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Vốn chủ sở hữu (VND)</label>
              <Input
                type="number"
                value={formData.equityCapital}
                onChange={(e) => handleInputChange('equityCapital', Number(e.target.value))}
                placeholder="2000000000"
                min="0"
                step="100000000"
              />
              <p className="text-xs text-gray-500">
                {formatCurrency(formData.equityCapital)}
              </p>
            </div>

            {/* Tỷ lệ vay */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tỷ lệ vay (%)</label>
              <Input
                type="number"
                value={formData.loanPct}
                onChange={(e) => handleInputChange('loanPct', Number(e.target.value))}
                min="0"
                max="100"
                step="5"
              />
            </div>

            {/* Thành phố */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Thành phố</label>
              <select
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Loại bất động sản */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại bất động sản</label>
              <select
                value={formData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Diện tích */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Diện tích (m²)</label>
              <Input
                type="number"
                value={formData.propertySize}
                onChange={(e) => handleInputChange('propertySize', Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>

            {/* Thời gian đầu tư */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Thời gian đầu tư (năm)</label>
              <Input
                type="number"
                value={formData.investHorizonYears}
                onChange={(e) => handleInputChange('investHorizonYears', Number(e.target.value))}
                min="1"
                max="50"
                step="1"
              />
            </div>

            {/* Ngân hàng */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Ngân hàng (tùy chọn)</label>
              <select
                value={formData.bankId}
                onChange={(e) => handleInputChange('bankId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Chọn ngân hàng có lãi suất tốt nhất</option>
                {marketData?.marketData.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.interestRate}%/năm
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Thông tin tóm tắt */}
          {selectedProperty && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Thông tin dự kiến:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Giá BĐS:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculatePropertyPrice())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Số tiền vay:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculateLoanAmount())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Vốn cần thiết:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculateRequiredEquity())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tỷ suất thuê dự kiến:</span>
                  <span className="ml-2 font-medium">{selectedProperty.avgYieldPct}%/năm</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !selectedProperty}>
            {isLoading ? 'Đang tính toán...' : 'Tính toán đầu tư'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

