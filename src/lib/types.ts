export interface User {
  id: string
  name: string
  email: string
}

export interface Property {
  id: string
  type: 'APARTMENT' | 'LAND' | 'SHOPHOUSE' | 'OFFICETEL'
  city: string
  avgPricePerM2: number
  avgYieldPct: number
  mgmtFeePct: number
}

export interface MarketData {
  id: string
  bankName: string
  interestRate: number
  loanTermYears: number
  updatedAt: string
}

export interface InvestmentInput {
  equityCapital: number
  loanPct: number
  propertySize: number
  city: string
  propertyType: Property['type']
  investHorizonYears: number
  bankId?: string
}

export interface MonthlyData {
  month: number
  loanPayment: number
  rentalIncome: number
  mgmtFee: number
  netCashflow: number
  loanBalance: number
}

export interface ScenarioResult {
  propertyValue: number
  totalEquity: number
  roi: number
  irr: number
}

export interface InvestmentResult {
  propertyPrice: number
  loanAmount: number
  initialCosts: {
    transferTax: number
    notaryFee: number
    brokerageFee: number
    total: number
  }
  monthlyData: MonthlyData[]
  scenarios: {
    pessimistic: ScenarioResult
    base: ScenarioResult
    optimistic: ScenarioResult
  }
  alerts: string[]
}

export interface Scenario {
  id: string
  equityCapital: number
  loanPct: number
  investHorizonYears: number
  createdAt: string
  property: {
    type: Property['type']
    city: string
    avgPricePerM2: number
  }
  calcResult: InvestmentResult
}

export const PROPERTY_TYPES = {
  APARTMENT: 'Căn hộ',
  LAND: 'Đất nền',
  SHOPHOUSE: 'Nhà phố thương mại',
  OFFICETEL: 'Officetel'
} as const

export const CITIES = [
  'Hanoi',
  'Ho Chi Minh City', 
  'Da Nang',
  'Nha Trang',
  'Can Tho',
  'Hai Phong',
  'Bien Hoa',
  'Hue',
  'Vung Tau',
  'Quy Nhon'
] as const

