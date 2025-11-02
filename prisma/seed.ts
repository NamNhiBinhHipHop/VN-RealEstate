import { PrismaClient, PropertyType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Seed Properties
  const properties = [
    // Hanoi
    { type: PropertyType.APARTMENT, city: 'Hanoi', avgPricePerM2: 45000000, avgYieldPct: 4.5, mgmtFeePct: 0.5 },
    { type: PropertyType.LAND, city: 'Hanoi', avgPricePerM2: 80000000, avgYieldPct: 0, mgmtFeePct: 0 },
    { type: PropertyType.SHOPHOUSE, city: 'Hanoi', avgPricePerM2: 60000000, avgYieldPct: 6.0, mgmtFeePct: 1.0 },
    { type: PropertyType.OFFICETEL, city: 'Hanoi', avgPricePerM2: 35000000, avgYieldPct: 5.5, mgmtFeePct: 0.8 },
    
    // Ho Chi Minh City
    { type: PropertyType.APARTMENT, city: 'Ho Chi Minh City', avgPricePerM2: 55000000, avgYieldPct: 5.0, mgmtFeePct: 0.5 },
    { type: PropertyType.LAND, city: 'Ho Chi Minh City', avgPricePerM2: 120000000, avgYieldPct: 0, mgmtFeePct: 0 },
    { type: PropertyType.SHOPHOUSE, city: 'Ho Chi Minh City', avgPricePerM2: 80000000, avgYieldPct: 6.5, mgmtFeePct: 1.0 },
    { type: PropertyType.OFFICETEL, city: 'Ho Chi Minh City', avgPricePerM2: 42000000, avgYieldPct: 6.0, mgmtFeePct: 0.8 },
    
    // Da Nang
    { type: PropertyType.APARTMENT, city: 'Da Nang', avgPricePerM2: 25000000, avgYieldPct: 5.5, mgmtFeePct: 0.4 },
    { type: PropertyType.LAND, city: 'Da Nang', avgPricePerM2: 35000000, avgYieldPct: 0, mgmtFeePct: 0 },
    { type: PropertyType.SHOPHOUSE, city: 'Da Nang', avgPricePerM2: 30000000, avgYieldPct: 7.0, mgmtFeePct: 0.8 },
    { type: PropertyType.OFFICETEL, city: 'Da Nang', avgPricePerM2: 22000000, avgYieldPct: 6.5, mgmtFeePct: 0.6 },
    
    // Nha Trang
    { type: PropertyType.APARTMENT, city: 'Nha Trang', avgPricePerM2: 20000000, avgYieldPct: 6.0, mgmtFeePct: 0.4 },
    { type: PropertyType.LAND, city: 'Nha Trang', avgPricePerM2: 25000000, avgYieldPct: 0, mgmtFeePct: 0 },
    { type: PropertyType.SHOPHOUSE, city: 'Nha Trang', avgPricePerM2: 22000000, avgYieldPct: 7.5, mgmtFeePct: 0.7 },
    { type: PropertyType.OFFICETEL, city: 'Nha Trang', avgPricePerM2: 18000000, avgYieldPct: 7.0, mgmtFeePct: 0.5 },
  ]

  for (const property of properties) {
    await prisma.property.upsert({
      where: {
        id: `${property.city}-${property.type}`.toLowerCase().replace(/\s+/g, '-')
      },
      update: {},
      create: {
        id: `${property.city}-${property.type}`.toLowerCase().replace(/\s+/g, '-'),
        ...property
      }
    })
  }

  // Seed Market Data (Bank Interest Rates)
  const marketData = [
    { bankName: 'Vietcombank', interestRate: 8.5, loanTermYears: 20 },
    { bankName: 'BIDV', interestRate: 8.3, loanTermYears: 20 },
    { bankName: 'VietinBank', interestRate: 8.4, loanTermYears: 20 },
    { bankName: 'Agribank', interestRate: 8.2, loanTermYears: 20 },
    { bankName: 'Techcombank', interestRate: 8.6, loanTermYears: 20 },
    { bankName: 'MB Bank', interestRate: 8.7, loanTermYears: 20 },
  ]

  for (const data of marketData) {
    await prisma.marketData.upsert({
      where: {
        id: data.bankName.toLowerCase().replace(/\s+/g, '-')
      },
      update: data,
      create: {
        id: data.bankName.toLowerCase().replace(/\s+/g, '-'),
        ...data
      }
    })
  }

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

