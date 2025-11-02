'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Building, LogOut, User } from 'lucide-react'
import Link from 'next/link'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Building className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">
            VN Real Estate Calculator
          </span>
        </Link>

        {user ? (
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                href="/calculator" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Tính toán
              </Link>
              <Link 
                href="/predict" 
                className="text-purple-600 hover:text-purple-900 font-medium"
              >
                Dự Đoán ML
              </Link>
              <Link 
                href="/scenarios" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Kịch bản
              </Link>
              <Link 
                href="/compare" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                So sánh
              </Link>
            </nav>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/auth">
              <Button variant="outline">Đăng nhập</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

