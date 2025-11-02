'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Building, TrendingUp, AlertCircle, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PredictionResult {
  predicted_price: number
  price_per_sqm: number
  bedrooms: number
  area: number
  location: string
}

export default function PredictPage() {
  const [formData, setFormData] = useState({
    bedrooms: 3,
    area: 80,
    location: ''
  })
  
  const [locations, setLocations] = useState<string[]>([])
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // Get ML API URL (uses env var if set, otherwise localhost)
  const getMLApiUrl = () => {
    // Priority: env variable > localhost
    return process.env.NEXT_PUBLIC_ML_API_URL || 'http://localhost:8000'
  }

  // Check ML API status
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const apiUrl = getMLApiUrl()
        const response = await fetch(`${apiUrl}/`)
        if (response.ok) {
          setApiStatus('online')
          loadLocations()
        } else {
          setApiStatus('offline')
        }
      } catch (err) {
        setApiStatus('offline')
      }
    }
    
    checkAPIStatus()
  }, [])

  const loadLocations = async () => {
    try {
      const apiUrl = getMLApiUrl()
      const response = await fetch(`${apiUrl}/locations`)
      const data = await response.json()
      setLocations(data.locations)
      if (data.locations.length > 0) {
        setFormData(prev => ({ ...prev, location: data.locations[0] }))
      }
    } catch (err) {
      console.error('Failed to load locations:', err)
    }
  }

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const apiUrl = getMLApiUrl()
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (err: any) {
      setError(err.message || 'Failed to get prediction')
    } finally {
      setIsLoading(false)
    }
  }

  if (apiStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kiểm tra kết nối ML API...</p>
        </div>
      </div>
    )
  }

  if (apiStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>ML API Không Khả Dụng</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                Không thể kết nối với ML prediction service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Để sử dụng tính năng dự đoán giá ML, bạn cần khởi động Python API server:
                </p>
                <div className="bg-gray-900 text-white p-4 rounded-lg font-mono text-sm">
                  <div className="mb-2"># For local development:</div>
                  <div>pip install -r requirements_ml.txt</div>
                  <div>python ml_api.py</div>
                  <div className="mt-4 mb-2"># Or deploy to Vercel (automatic)</div>
                </div>
                <p className="text-sm text-gray-600">
                  On Vercel, ML API runs automatically as serverless function
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Thử Lại
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Dự Đoán Giá ML
            </h1>
          </div>
          <p className="text-gray-600">
            Sử dụng Machine Learning (LightGBM) để dự đoán giá bất động sản dựa trên dữ liệu thực tế
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Nhập Thông Tin Bất Động Sản</CardTitle>
                <CardDescription>
                  Điền thông tin để nhận dự đoán giá từ mô hình AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePredict} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số Phòng Ngủ
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diện Tích (m²)
                    </label>
                    <Input
                      type="number"
                      min="20"
                      max="500"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Khu Vực
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    >
                      {locations.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {locations.length} khu vực khả dụng
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang dự đoán...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Dự Đoán Giá
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div>
            {prediction ? (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-purple-900">Kết Quả Dự Đoán</CardTitle>
                  </div>
                  <CardDescription>
                    Dựa trên mô hình LightGBM được huấn luyện
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Giá Dự Đoán</div>
                    <div className="text-4xl font-bold text-purple-600">
                      {formatCurrency(prediction.predicted_price * 1000000000)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ≈ {prediction.predicted_price.toFixed(2)} tỷ VND
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Giá/m²</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {formatCurrency(prediction.price_per_sqm * 1000000000)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Tổng Diện Tích</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {prediction.area} m²
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Phòng ngủ:</span>
                      <span className="font-medium">{prediction.bedrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Khu vực:</span>
                      <span className="font-medium">{prediction.location}</span>
                    </div>
                  </div>

                  <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Building className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <strong>Lưu ý:</strong> Đây là giá dự đoán từ mô hình ML dựa trên dữ liệu lịch sử. 
                        Giá thực tế có thể khác biệt tùy thuộc vào điều kiện thị trường và đặc điểm cụ thể của bất động sản.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Chưa Có Dự Đoán
                  </h3>
                  <p className="text-gray-500">
                    Điền thông tin bên trái và nhấn &quot;Dự Đoán Giá&quot; để nhận kết quả từ mô hình AI
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Model Info */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">Về Mô Hình Machine Learning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">LightGBM</div>
                <div className="text-sm text-gray-600">Gradient Boosted Trees</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">6,000+</div>
                <div className="text-sm text-gray-600">Dữ liệu huấn luyện</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">5</div>
                <div className="text-sm text-gray-600">Đặc trưng đầu vào</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

