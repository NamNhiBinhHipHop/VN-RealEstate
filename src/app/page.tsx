import HomeClient from '@/components/home/HomeClient'
import { loadDistrictStats } from '@/lib/districtStats'

export default async function HomePage() {
  const districtStats = await loadDistrictStats()
  return <HomeClient districtStats={districtStats} />
}
