import { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import DistrictMapClient from './DistrictMapClient'
import { loadDistrictStats } from '@/lib/districtStats'

export const metadata: Metadata = {
  title: 'Ho Chi Minh City price map | VN Real Estate Calculator',
  description:
    'Explore Ho Chi Minh City property prices with a LightGBM-powered choropleth map, aggregated by district.',
}

export default async function MapPage() {
  const districts = await loadDistrictStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DistrictMapClient initialData={districts} />
    </div>
  )
}

