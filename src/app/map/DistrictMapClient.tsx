'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import type { DistrictStat } from '@/lib/districtStats'
import { formatCurrency } from '@/lib/utils'

const HCMCChoropleth = dynamic(() => import('@/components/maps/HCMCChoropleth'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center text-gray-500">
      Loading map…
    </div>
  ),
})

type DistrictMapClientProps = {
  initialData: DistrictStat[]
  heightClass?: string
}

export default function DistrictMapClient({
  initialData,
  heightClass = 'h-[calc(100vh-4rem)]',
}: DistrictMapClientProps) {
  const summary = useMemo(() => {
    if (!initialData.length) {
      return { avg: 0, max: 0 }
    }
    const total = initialData.reduce((sum, item) => sum + item.avgPrice, 0)
    const max = Math.max(...initialData.map((item) => item.avgPrice))
    return {
      avg: total / initialData.length,
      max,
    }
  }, [initialData])

  return (
    <div className={`flex flex-col ${heightClass}`}>
      <div className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Districts</p>
            <p className="font-semibold text-gray-900">{initialData.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Avg. price</p>
            <p className="font-semibold text-gray-900">
              {initialData.length ? formatCurrency(summary.avg * 1_000_000_000) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Peak price</p>
            <p className="font-semibold text-gray-900">
              {initialData.length ? formatCurrency(summary.max * 1_000_000_000) : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <HCMCChoropleth data={initialData} />
      </div>
    </div>
  )
}

