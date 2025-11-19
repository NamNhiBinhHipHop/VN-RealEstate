import { promises as fs } from 'fs'
import path from 'path'

export type DistrictStat = {
  district: string
  avgPrice: number
  count: number
}

let cachedDistrictStats: DistrictStat[] | null = null

function normalizeDistrictName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

export function matchDistrictName(
  name: string,
  stats: DistrictStat[]
): DistrictStat | undefined {
  const target = normalizeDistrictName(name)
  return stats.find((stat) => normalizeDistrictName(stat.district) === target)
}

export async function loadDistrictStats(): Promise<DistrictStat[]> {
  if (cachedDistrictStats) {
    return cachedDistrictStats
  }

  const filePath = path.join(process.cwd(), 'data', 'district_stats.json')
  const contents = await fs.readFile(filePath, 'utf-8')
  cachedDistrictStats = JSON.parse(contents) as DistrictStat[]
  return cachedDistrictStats
}

