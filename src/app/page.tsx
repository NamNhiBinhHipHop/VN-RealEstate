'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Building, Calculator, TrendingUp, Users, BarChart3, Shield, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            VN Real Estate Investment Calculator
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            A modern toolset for modeling Vietnamese real-estate investments, cash flow, and risk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/predict">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg">
                🤖 ML Price Prediction
              </Button>
            </Link>
            {user ? (
              <Link href="/calculator">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Open Calculator
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Create a free account
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete investment analytics in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Model ROI, IRR, cash flow, and risk with live Vietnamese market data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/predict">
              <Card className="text-center cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                  <CardTitle className="text-purple-900">ML Pricing ⭐</CardTitle>
                  <CardDescription className="text-purple-700">
                    Gradient-boosting model trained on 6,000+ verified transactions.
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card className="text-center">
              <CardHeader>
                <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Precision formulas</CardTitle>
                <CardDescription>
                  Institutional-grade cash-flow and loan math tailored to Vietnam.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Scenario planning</CardTitle>
                <CardDescription>
                  Compare optimistic, base, and conservative cases side by side.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Visual dashboards</CardTitle>
                <CardDescription>
                  Highlight IRR, ROI, and monthly cash flow with clean charts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Building className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Property coverage</CardTitle>
                <CardDescription>
                  Apartments, land, shophouses, officetels across major cities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>Portfolio tracking</CardTitle>
                <CardDescription>
                  Save multiple scenarios and benchmark them instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
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
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600">
              Three quick steps to a complete investment memo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Capture inputs</h3>
              <p className="text-gray-600">
                Equity, leverage, property type, and target city.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Run the models</h3>
              <p className="text-gray-600">
                Cash flow, loan schedules, and ML pricing in seconds.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Review the report</h3>
              <p className="text-gray-600">
                Shareable ROI, IRR, cash flow, and risk alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to invest with confidence?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of Vietnamese investors who rely on our analytics.
          </p>
          {user ? (
            <Link href="/calculator">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Launch calculator
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get started for free
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building className="h-6 w-6" />
                <span className="text-lg font-bold">VN Real Estate Calculator</span>
              </div>
              <p className="text-gray-400">
                The end-to-end investment toolkit for Vietnam’s real-estate market.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/calculator" className="hover:text-white">Investment calculator</Link></li>
                <li><Link href="/scenarios" className="hover:text-white">Scenario manager</Link></li>
                <li><Link href="/compare" className="hover:text-white">Compare deals</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Product guide</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Terms of use</a></li>
                <li><a href="#" className="hover:text-white">Privacy policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VN Real Estate Calculator. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}