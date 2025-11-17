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
  method?: string
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

  // Check prediction API status
  useEffect(() => {
    const checkAPIStatus = async () => {
      try {
        const response = await fetch('/api/predict')
        if (response.ok) {
          setApiStatus('online')
          loadLocations()
        } else {
          setApiStatus('offline')
        }
      } catch {
        setApiStatus('offline')
      }
    }
    
    checkAPIStatus()
  }, [])

  const loadLocations = async () => {
    try {
      const response = await fetch('/api/predict?locations=true')
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
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.detail || 'Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('Failed to get prediction')
      }
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
        <p className="text-gray-600">Checking model availability...</p>
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
                <CardTitle>Prediction Service Unavailable</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                Unable to load the pre-trained LightGBM model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Make sure the <code>/api</code> folder contains <code>model.json</code> and <code>encoders.json</code> from the <code>train_model.py</code> script.
                </p>
                <p className="text-sm text-gray-600">
                  The app relies on a pre-trained LightGBM model—no runtime training is required.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Try again
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
              LightGBM Price Prediction
            </h1>
          </div>
          <p className="text-gray-600">
            A gradient-boosting model trained on 6,200+ verified HCMC transactions delivers consistent valuations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Property inputs</CardTitle>
                <CardDescription>
                  Provide the basics—our pre-trained LightGBM model handles the rest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePredict} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrooms
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value, 10) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Floor area (m²)
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
                      Location
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
                      {locations.length} locations available
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
                        Predicting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Run prediction
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
                    <CardTitle className="text-purple-900">Prediction summary</CardTitle>
                  </div>
                  <CardDescription>
                    Powered by the pre-trained LightGBM Gradient Boosting model.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Estimated price</div>
                    <div className="text-4xl font-bold text-purple-600">
                      {formatCurrency(prediction.predicted_price * 1000000000)}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      ≈ {prediction.predicted_price.toFixed(2)} billion VND
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Price per m²</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {formatCurrency(prediction.price_per_sqm * 1000000000)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Floor area</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {prediction.area} m²
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{prediction.bedrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{prediction.location}</span>
                    </div>
                  </div>

                  <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Building className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-900">
                        <strong>Note:</strong> The model reflects historical data and is distributed as pre-trained artifacts.
                        Actual transaction prices may vary depending on timing, legal status, and property condition.
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
                    No prediction yet
                  </h3>
                  <p className="text-gray-500">
                    Enter the property details on the left and run the LightGBM model.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Model Info */}
        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">Model stats</CardTitle>
            <CardDescription>
              The LightGBM model is trained offline and shipped via <code>api/model.json</code> &amp; <code>api/encoders.json</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">6,246</div>
                <div className="text-sm text-gray-600">Training properties</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">{locations.length}</div>
                <div className="text-sm text-gray-600">Supported locations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">140</div>
                <div className="text-sm text-gray-600">Boosted trees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

