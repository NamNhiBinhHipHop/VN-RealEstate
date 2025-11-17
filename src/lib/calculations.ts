export interface InvestmentInput {
  equityCapital: number
  loanPct: number
  propertySize: number // in m2
  pricePerM2: number
  avgYieldPct: number
  mgmtFeePct: number
  interestRate: number
  loanTermYears: number
  investHorizonYears: number
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

export class InvestmentCalculator {
  static calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    years: number
  ): number {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = years * 12
    
    if (monthlyRate === 0) return principal / numPayments
    
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
      (Math.pow(1 + monthlyRate, numPayments) - 1)
    )
  }

  static calculateLoanBalance(
    principal: number,
    annualRate: number,
    years: number,
    monthsPaid: number
  ): number {
    const monthlyRate = annualRate / 100 / 12
    const numPayments = years * 12
    
    if (monthlyRate === 0) {
      return principal - (principal / numPayments) * monthsPaid
    }
    
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRate, years)
    
    return (
      principal * Math.pow(1 + monthlyRate, monthsPaid) -
      monthlyPayment * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate)
    )
  }

  static calculateIRR(cashflows: number[], guess: number = 0.1): number {
    const maxIterations = 100
    const tolerance = 1e-6
    
    let rate = guess
    
    for (let i = 0; i < maxIterations; i++) {
      let npv = 0
      let dnpv = 0
      
      for (let j = 0; j < cashflows.length; j++) {
        npv += cashflows[j] / Math.pow(1 + rate, j)
        if (j > 0) {
          dnpv -= j * cashflows[j] / Math.pow(1 + rate, j + 1)
        }
      }
      
      if (Math.abs(npv) < tolerance) {
        return rate * 100 // Convert to percentage
      }
      
      if (Math.abs(dnpv) < tolerance) {
        break
      }
      
      rate = rate - npv / dnpv
    }
    
    return rate * 100 // Convert to percentage
  }

  static calculate(input: InvestmentInput): InvestmentResult {
    const propertyPrice = input.propertySize * input.pricePerM2
    const loanAmount = propertyPrice * (input.loanPct / 100)
    
    // Initial costs
    const transferTax = propertyPrice * 0.005 // 0.5%
    const notaryFee = propertyPrice * 0.001 // 0.1%
    const brokerageFee = propertyPrice * 0.015 // 1.5%
    const totalInitialCosts = transferTax + notaryFee + brokerageFee
    
    // Monthly calculations
    const monthlyLoanPayment = loanAmount > 0 
      ? this.calculateMonthlyPayment(loanAmount, input.interestRate, input.loanTermYears)
      : 0
    
    const monthlyRentalIncome = (propertyPrice * input.avgYieldPct / 100) / 12
    const monthlyMgmtFee = (propertyPrice * input.mgmtFeePct / 100) / 12
    
    // Generate monthly data
    const monthlyData: MonthlyData[] = []
    const totalMonths = input.investHorizonYears * 12
    
    for (let month = 1; month <= totalMonths; month++) {
      const loanBalance = loanAmount > 0 
        ? this.calculateLoanBalance(loanAmount, input.interestRate, input.loanTermYears, month)
        : 0
      
      const netCashflow = monthlyRentalIncome - monthlyLoanPayment - monthlyMgmtFee
      
      monthlyData.push({
        month,
        loanPayment: monthlyLoanPayment,
        rentalIncome: monthlyRentalIncome,
        mgmtFee: monthlyMgmtFee,
        netCashflow,
        loanBalance: Math.max(0, loanBalance)
      })
    }
    
    // Calculate scenarios
    const scenarios = {
      pessimistic: this.calculateScenario(input, monthlyData, 0.03), // 3% growth
      base: this.calculateScenario(input, monthlyData, 0.05), // 5% growth
      optimistic: this.calculateScenario(input, monthlyData, 0.07) // 7% growth
    }
    
    // Generate alerts
    const alerts: string[] = []
    if (monthlyRentalIncome < monthlyLoanPayment) {
      alerts.push('Warning: Rental income does not cover the monthly debt service.')
    }
    if (input.loanPct > 70) {
      alerts.push('Warning: High leverage (>70%) could increase financial risk.')
    }
    if (scenarios.base.roi < 10) {
      alerts.push('Warning: Projected ROI is low (<10% per year).')
    }
    
    return {
      propertyPrice,
      loanAmount,
      initialCosts: {
        transferTax,
        notaryFee,
        brokerageFee,
        total: totalInitialCosts
      },
      monthlyData,
      scenarios,
      alerts
    }
  }
  
  private static calculateScenario(
    input: InvestmentInput,
    monthlyData: MonthlyData[],
    growthRate: number
  ): ScenarioResult {
    const propertyPrice = input.propertySize * input.pricePerM2
    const loanAmount = propertyPrice * (input.loanPct / 100)
    const actualEquity = propertyPrice - loanAmount
    
    // Future property value
    const futurePropertyValue = propertyPrice * Math.pow(1 + growthRate, input.investHorizonYears)
    
    // Remaining loan balance at the end
    const finalLoanBalance = monthlyData[monthlyData.length - 1]?.loanBalance || 0
    
    // Total equity at the end
    const totalEquity = futurePropertyValue - finalLoanBalance
    
    // Calculate total returns
    const totalCashflow = monthlyData.reduce((sum, month) => sum + month.netCashflow, 0)
    const capitalGain = futurePropertyValue - propertyPrice
    const totalReturns = totalCashflow + capitalGain - (loanAmount - finalLoanBalance)
    
    // ROI calculation
    const roi = (totalReturns / actualEquity) * 100
    
    // IRR calculation
    const cashflows = [-actualEquity] // Initial investment (negative)
    monthlyData.forEach(month => {
      cashflows.push(month.netCashflow)
    })
    // Add final sale proceeds
    cashflows[cashflows.length - 1] += totalEquity
    
    const irr = this.calculateIRR(cashflows)
    
    return {
      propertyValue: futurePropertyValue,
      totalEquity,
      roi: roi / input.investHorizonYears, // Annualized ROI
      irr
    }
  }
}

