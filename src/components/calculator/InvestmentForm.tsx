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
    equityCapital: 2000000000, // 2B VND starting point
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
      setError('No property data is available for this city and property type.')
      return
    }

    const requiredEquity = calculateRequiredEquity()
    if (formData.equityCapital < requiredEquity) {
      setError(`Insufficient equity. You need at least ${formatCurrency(requiredEquity)}.`)
      return
    }

    try {
      const result = await api.calculateInvestment(formData)
      onCalculate(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred while running the calculation.')
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Investment details</CardTitle>
        <CardDescription>
          Provide the core assumptions to evaluate financing, returns, and risk.
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
            {/* Equity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equity capital (VND)</label>
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

            {/* Loan percentage */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan-to-value (%)</label>
              <Input
                type="number"
                value={formData.loanPct}
                onChange={(e) => handleInputChange('loanPct', Number(e.target.value))}
                min="0"
                max="100"
                step="5"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
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

            {/* Property type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Property type</label>
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

            {/* Size */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Size (m²)</label>
              <Input
                type="number"
                value={formData.propertySize}
                onChange={(e) => handleInputChange('propertySize', Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>

            {/* Investment horizon */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Investment horizon (years)</label>
              <Input
                type="number"
                value={formData.investHorizonYears}
                onChange={(e) => handleInputChange('investHorizonYears', Number(e.target.value))}
                min="1"
                max="50"
                step="1"
              />
            </div>

            {/* Bank */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Preferred bank (optional)</label>
              <select
                value={formData.bankId}
                onChange={(e) => handleInputChange('bankId', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select the lender with the best rate</option>
                {marketData?.marketData.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.interestRate}%/year
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary */}
          {selectedProperty && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-gray-900">Quick summary:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Property value:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculatePropertyPrice())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Loan amount:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculateLoanAmount())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Required equity:</span>
                  <span className="ml-2 font-medium">{formatCurrency(calculateRequiredEquity())}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rental yield:</span>
                  <span className="ml-2 font-medium">{selectedProperty.avgYieldPct}%/year</span>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || !selectedProperty}>
            {isLoading ? 'Calculating...' : 'Calculate investment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

