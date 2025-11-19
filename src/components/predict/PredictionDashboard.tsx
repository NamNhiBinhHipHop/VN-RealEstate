'use client'

import { useEffect, useMemo, useState } from 'react'
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

type PredictionDashboardProps = {
  embedded?: boolean
}

export default function PredictionDashboard({ embedded = false }: PredictionDashboardProps) {
  const [formData, setFormData] = useState({
    bedrooms: 3,
    area: 80,
    location: '',
  })

  const [locations, setLocations] = useState<string[]>([])
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const containerClass = embedded ? '' : 'container mx-auto px-4 py-8'
  const panelClass = embedded
    ? 'rounded-3xl border border-gray-200 bg-white p-6 shadow-sm'
    : ''

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
      if (!response.ok) {
        throw new Error('Unable to load locations')
      }
      const data = await response.json()
      setLocations(data.locations)
      if (data.locations.length > 0) {
        setFormData((prev) => ({ ...prev, location: data.locations[0] }))
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
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        let errorMessage = 'Prediction failed'
        try {
          const errorData = await response.clone().json()
          errorMessage = errorData.error || errorData.detail || errorMessage
        } catch {
          const text = await response.text()
          if (text) {
            errorMessage = text
          }
        }
        throw new Error(errorMessage)
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

  const loadingCard = useMemo(
    () => (
      <Card className={panelClass || 'shadow-sm'}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Checking model availability...</p>
        </CardContent>
      </Card>
    ),
    [panelClass]
  )

  const offlineCard = useMemo(
    () => (
      <Card className={`${panelClass} border-red-200 bg-red-50`}>
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
              Make sure the <code>/api</code> folder contains <code>model.json</code> and{' '}
              <code>encoders.json</code> produced by <code>train_model.py</code>.
            </p>
            <p className="text-sm text-gray-600">
              The runtime depends on pre-trained LightGBM artifacts; no on-demand training happens.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    ),
    [panelClass]
  )

  if (apiStatus === 'checking') {
    return <div className={containerClass}>{loadingCard}</div>
  }

  if (apiStatus === 'offline') {
    return <div className={containerClass}>{offlineCard}</div>
  }

  return (
    <div className={containerClass}>
      <div className={panelClass}>
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              LightGBM Price Prediction
            </h2>
          </div>
          <p className="text-gray-600">
            A gradient-boosting model trained on 6,200+ verified HCMC transactions delivers consistent
            valuations.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">Bedrooms</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.bedrooms}
                      onChange={(e) =>
                        setFormData({ ...formData, bedrooms: parseInt(e.target.value, 10) })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Floor area (m²)
                    </label>
                    <Input
                      type="number"
                      min="20"
                      max="500"
                      step="0.1"
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: parseFloat(e.target.value) })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <p className="mt-1 text-xs text-gray-500">
                      {locations.length} locations available
                    </p>
                  </div>

                  {error && (
                    <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Predicting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <Sparkles className="mr-2 h-4 w-4" />
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
                    <div className="mb-1 text-sm text-gray-600">Estimated price</div>
                    <div className="text-4xl font-bold text-purple-600">
                      {formatCurrency(prediction.predicted_price * 1_000_000_000)}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      ≈ {prediction.predicted_price.toFixed(2)} billion VND
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <div className="mb-1 text-sm text-gray-600">Price per m²</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {formatCurrency(prediction.price_per_sqm * 1_000_000_000)}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-sm text-gray-600">Floor area</div>
                      <div className="text-xl font-semibold text-gray-900">
                        {prediction.area} m²
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bedrooms:</span>
                      <span className="font-medium">{prediction.bedrooms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{prediction.location}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-purple-200 bg-purple-100 p-4">
                    <div className="flex items-start space-x-2">
                      <Building className="mt-0.5 h-5 w-5 text-purple-600" />
                      <div className="text-sm text-purple-900">
                        <strong>Note:</strong> The model reflects historical data and ships as pre-trained
                        artifacts. Real-world prices vary with timing, legal status, and property condition.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-12 text-center">
                  <Sparkles className="mx-auto mb-4 h-16 w-16 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">No prediction yet</h3>
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
              The LightGBM model is trained offline and shipped via <code>api/model.json</code> &amp;{' '}
              <code>api/encoders.json</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <div className="mb-1 text-2xl font-bold text-blue-600">6,246</div>
                <div className="text-sm text-gray-600">Training properties</div>
              </div>
              <div>
                <div className="mb-1 text-2xl font-bold text-purple-600">{locations.length}</div>
                <div className="text-sm text-gray-600">Supported locations</div>
              </div>
              <div>
                <div className="mb-1 text-2xl font-bold text-green-600">140</div>
                <div className="text-sm text-gray-600">Boosted trees</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

