'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Building,
  Calculator,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react'
import DistrictMapClient from '@/app/map/DistrictMapClient'
import PredictionDashboard from '@/components/predict/PredictionDashboard'
import type { DistrictStat } from '@/lib/districtStats'

type HomeClientProps = {
  districtStats: DistrictStat[]
}

export default function HomeClient({ districtStats }: HomeClientProps) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            VN Real Estate Investment Calculator
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl md:text-2xl">
            A modern toolset for modeling Vietnamese real-estate investments, cash flow, and risk.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/predict">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg hover:from-purple-700 hover:to-purple-800" size="lg">
                🤖 ML Price Prediction
              </Button>
            </Link>
            {user ? (
              <Link href="/calculator">
                <Button className="bg-white text-blue-600 hover:bg-gray-100" size="lg">
                  Open Calculator
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button className="bg-white text-blue-600 hover:bg-gray-100" size="lg">
                  Create a free account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Hồ Chí Minh City
              </p>
              <h2 className="text-2xl font-bold text-gray-900">District-level price heatmap</h2>
              <p className="text-sm text-gray-600">
                Aggregated listings + LightGBM predictions visualized as a choropleth.
              </p>
            </div>
            <Link
              href="/map"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Open full-screen map →
            </Link>
          </div>
          <div className="h-[550px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <DistrictMapClient initialData={districtStats} heightClass="h-[550px]" />
          </div>
        </div>
      </section>

      {/* Prediction Section */}
      <section className="bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Run a prediction instantly</h2>
          <p className="mb-6 text-sm text-gray-600">
            Use the LightGBM model directly from the homepage—adjust bedrooms, floor area, and district to get a
            fresh valuation.
          </p>
          <PredictionDashboard embedded />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Complete investment analytics in one place</h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              Model ROI, IRR, cash flow, and risk with live Vietnamese market data.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/predict">
              <Card className="cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white text-center transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-purple-600" />
                  <CardTitle className="text-purple-900">ML Pricing ⭐</CardTitle>
                  <CardDescription className="text-purple-700">
                    Gradient-boosting model trained on 6,000+ verified transactions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card className="text-center">
              <CardHeader>
                <Calculator className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <CardTitle>Precision formulas</CardTitle>
                <CardDescription>
                  Institutional-grade cash-flow and loan math tailored to Vietnam.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <CardTitle>Scenario planning</CardTitle>
                <CardDescription>
                  Compare optimistic, base, and conservative cases side by side.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-purple-600" />
                <CardTitle>Visual dashboards</CardTitle>
                <CardDescription>
                  Highlight IRR, ROI, and monthly cash flow with clean charts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Building className="mx-auto mb-4 h-12 w-12 text-orange-600" />
                <CardTitle>Property coverage</CardTitle>
                <CardDescription>
                  Apartments, land, shophouses, officetels across major cities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="mx-auto mb-4 h-12 w-12 text-red-600" />
                <CardTitle>Portfolio tracking</CardTitle>
                <CardDescription>
                  Save multiple scenarios and benchmark them instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="mx-auto mb-4 h-12 w-12 text-indigo-600" />
                <CardTitle>Risk alerts</CardTitle>
                <CardDescription>
                  Flag leverage, yield, and liquidity issues before you commit.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="text-xl text-gray-600">Three quick steps to a complete investment memo.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Capture inputs</h3>
              <p className="text-gray-600">Equity, leverage, property type, and target city.</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Run the models</h3>
              <p className="text-gray-600">Cash flow, loan schedules, and ML pricing in seconds.</p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Review the report</h3>
              <p className="text-gray-600">Shareable ROI, IRR, cash flow, and risk alerts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to invest with confidence?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl">
            Join thousands of Vietnamese investors who rely on our analytics.
          </p>
          {user ? (
            <Link href="/calculator">
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                Launch calculator
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                Get started for free
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <Building className="h-6 w-6" />
                <span className="text-lg font-bold">VN Real Estate Calculator</span>
              </div>
              <p className="text-gray-400">
                The end-to-end investment toolkit for Vietnam’s real-estate market.
              </p>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/calculator" className="hover:text-white">
                    Investment calculator
                  </Link>
                </li>
                <li>
                  <Link href="/scenarios" className="hover:text-white">
                    Scenario manager
                  </Link>
                </li>
                <li>
                  <Link href="/compare" className="hover:text-white">
                    Compare deals
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Product guide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 font-semibold">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Terms of use
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VN Real Estate Calculator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

