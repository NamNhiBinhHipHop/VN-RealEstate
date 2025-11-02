'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { InvestmentForm } from '@/components/calculator/InvestmentForm'
import { InvestmentResults } from '@/components/calculator/InvestmentResults'

export default function CalculatorPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [calculationResult, setCalculationResult] = useState(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth')
    }
  }, [user, isLoading, router])

  const handleCalculate = (result: any) => {
    setCalculationResult(result)
  }

  const handleSaveScenario = () => {
    // Refresh or show success message
    console.log('Scenario saved successfully')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tính toán đầu tư bất động sản
          </h1>
          <p className="text-gray-600">
            Nhập thông tin để phân tích khả năng đầu tư và lợi nhuận dự kiến
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div>
            <InvestmentForm 
              onCalculate={handleCalculate}
              isLoading={false}
            />
          </div>

          {/* Results */}
          <div>
            {calculationResult ? (
              <InvestmentResults 
                data={calculationResult}
                onSaveScenario={handleSaveScenario}
              />
            ) : (
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có kết quả tính toán
                </h3>
                <p className="text-gray-500">
                  Điền thông tin bên trái và nhấn &quot;Tính toán đầu tư&quot; để xem kết quả phân tích
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

