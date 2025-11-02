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
            Công cụ tính toán đầu tư bất động sản thông minh cho thị trường Việt Nam
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/predict">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg">
                🤖 Dự Đoán Giá ML
              </Button>
            </Link>
            {user ? (
              <Link href="/calculator">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Bắt đầu tính toán
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Đăng ký miễn phí
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
              Tính toán đầu tư chính xác và toàn diện
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Phân tích ROI, IRR, dòng tiền và rủi ro với dữ liệu thị trường thực tế
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/predict">
              <Card className="text-center cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-pulse" />
                  <CardTitle className="text-purple-900">Dự Đoán Giá ML ⭐</CardTitle>
                  <CardDescription className="text-purple-700">
                    Trí tuệ nhân tạo dự đoán giá từ 6,000+ bất động sản thực tế
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Card className="text-center">
              <CardHeader>
                <Calculator className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Tính toán chính xác</CardTitle>
                <CardDescription>
                  Công thức tài chính chuẩn quốc tế với dữ liệu thị trường Việt Nam
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Phân tích đa kịch bản</CardTitle>
                <CardDescription>
                  So sánh kịch bản lạc quan, cơ sở và bi quan để đánh giá rủi ro
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Biểu đồ trực quan</CardTitle>
                <CardDescription>
                  Hiển thị dòng tiền, ROI, IRR qua biểu đồ dễ hiểu
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Building className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Đa loại BĐS</CardTitle>
                <CardDescription>
                  Hỗ trợ căn hộ, đất nền, shophouse, officetel tại các thành phố lớn
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-red-600 mx-auto mb-4" />
                <CardTitle>So sánh kịch bản</CardTitle>
                <CardDescription>
                  Lưu trữ và so sánh nhiều kịch bản đầu tư khác nhau
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <CardTitle>Cảnh báo rủi ro</CardTitle>
                <CardDescription>
                  Phát hiện các rủi ro tiềm ẩn và đưa ra khuyến nghị
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
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-gray-600">
              Chỉ 3 bước đơn giản để có báo cáo đầu tư chi tiết
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nhập thông tin</h3>
              <p className="text-gray-600">
                Vốn chủ sở hữu, tỷ lệ vay, loại BĐS và thành phố
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tính toán tự động</h3>
              <p className="text-gray-600">
                Hệ thống phân tích dựa trên dữ liệu thị trường thực tế
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nhận báo cáo</h3>
              <p className="text-gray-600">
                ROI, IRR, dòng tiền và cảnh báo rủi ro chi tiết
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Sẵn sàng bắt đầu đầu tư thông minh?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng nghìn nhà đầu tư đã sử dụng công cụ của chúng tôi
          </p>
          {user ? (
            <Link href="/calculator">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Tính toán ngay
              </Button>
            </Link>
          ) : (
            <Link href="/auth">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Đăng ký miễn phí
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
                Công cụ tính toán đầu tư bất động sản hàng đầu Việt Nam
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/calculator" className="hover:text-white">Tính toán đầu tư</Link></li>
                <li><Link href="/scenarios" className="hover:text-white">Quản lý kịch bản</Link></li>
                <li><Link href="/compare" className="hover:text-white">So sánh</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Pháp lý</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-white">Chính sách bảo mật</a></li>
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