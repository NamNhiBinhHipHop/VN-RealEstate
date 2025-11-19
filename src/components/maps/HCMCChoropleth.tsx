'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl, {
  type Map,
  type MapLayerMouseEvent,
  type ExpressionSpecification,
} from 'mapbox-gl'
import type { FeatureCollection, Polygon } from 'geojson'
import type { DistrictStat } from '@/lib/districtStats'
import { formatCurrency } from '@/lib/utils'

type ChoroplethProps = {
  data: DistrictStat[]
  geoJsonUrl?: string
  className?: string
}

type EnrichedFeatureCollection = FeatureCollection<Polygon, GeoJSON.GeoJsonProperties> & {
  features: Array<
    FeatureCollection['features'][number] & {
      id: number
      properties: {
        [key: string]: unknown
        avgPrice?: number | null
        count?: number
        district?: string
      }
    }
  >
}

const SOURCE_ID = 'hcmc-districts'
const FILL_LAYER_ID = 'hcmc-district-fill'
const BORDER_LAYER_ID = 'hcmc-district-borders'
const DEFAULT_GEOJSON_URL = '/data/hcmc_districts.geojson'
const FALLBACK_COLOR_STOPS = ['#eff3ff', '#c6dbef', '#9ecae1', '#6baed6', '#3182bd', '#08519c']

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat('vi-VN')

function normalizeName(name: string) {
  return name
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/quan|huyen/g, '')
}

function formatAvgPrice(value?: number | null) {
  if (!value || Number.isNaN(value)) return 'N/A'
  return currencyFormatter.format(value * 1_000_000_000)
}

export default function HCMCChoropleth({
  data,
  geoJsonUrl = DEFAULT_GEOJSON_URL,
  className,
}: ChoroplethProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const popupRef = useRef<mapboxgl.Popup | null>(null)
  const hoveredFeatureId = useRef<number | null>(null)
  const boundsRef = useRef<mapboxgl.LngLatBounds | null>(null)
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [tokenMissing, setTokenMissing] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetch(geoJsonUrl)
      .then((res) => res.json())
      .then((payload) => {
        if (isMounted) setGeojson(payload)
      })
      .catch((error) => {
        console.error('Failed to load geojson:', error)
      })
    return () => {
      isMounted = false
    }
  }, [geoJsonUrl])

  const enrichedGeojson = useMemo<EnrichedFeatureCollection | null>(() => {
    if (!geojson) return null
    const statsMap = new Map(
      data.map((stat) => [normalizeName(stat.district), stat] as const)
    )

    const features = geojson.features.map((feature, idx) => {
      const rawName =
        (feature.properties?.district as string) ??
        (feature.properties?.name as string) ??
        ''
      const stat = statsMap.get(normalizeName(rawName))
      return {
        ...feature,
        id: idx,
        properties: {
          ...(feature.properties ?? {}),
          district: rawName,
          avgPrice: stat?.avgPrice ?? null,
          count: stat?.count ?? 0,
        },
      }
    })

    return {
      ...(geojson as FeatureCollection<Polygon>),
      features,
    }
  }, [geojson, data])

const colorScale = useMemo(() => {
    if (!data.length) {
      return {
        expression: ['case', ['has', 'avgPrice'], '#9ecae1', '#e2e8f0'] as ExpressionSpecification,
        stops: [],
      }
    }
    const values = data.map((item) => item.avgPrice).filter(Boolean) as number[]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const step = (max - min) / (FALLBACK_COLOR_STOPS.length - 1 || 1)

    const thresholds = Array.from({ length: FALLBACK_COLOR_STOPS.length }, (_, index) =>
      Number((min + step * index).toFixed(2))
    )

    const expressionParts: (string | number | string[])[] = [
      'step',
      ['get', 'avgPrice'],
      FALLBACK_COLOR_STOPS[0],
    ]
    thresholds.slice(1).forEach((threshold, index) => {
      expressionParts.push(threshold)
      expressionParts.push(FALLBACK_COLOR_STOPS[index + 1])
    })

    const stops = thresholds.map((threshold, index) => ({
      color: FALLBACK_COLOR_STOPS[index],
      value: threshold,
    }))

    return { expression: expressionParts as ExpressionSpecification, stops }
  }, [data])

  const fitMapToBounds = useCallback(() => {
    if (!mapRef.current || !boundsRef.current) return
    mapRef.current.fitBounds(boundsRef.current, {
      padding: window.innerWidth < 768 ? 24 : 48,
      duration: 700,
    })
  }, [])

  useEffect(() => {
    if (!enrichedGeojson || mapRef.current || !containerRef.current) return

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setTokenMissing(true)
      return
    }

    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [106.7, 10.78],
      zoom: 9.5,
    })

    mapRef.current = map
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
    })

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: enrichedGeojson,
      })

      map.addLayer({
        id: FILL_LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': colorScale.expression,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.85,
            ['case', ['has', 'avgPrice'], 0.7, 0.3],
          ],
        },
      })

      map.addLayer({
        id: BORDER_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#111827',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2.5,
            1,
          ],
          'line-opacity': 0.9,
        },
      })

      const bounds = enrichedGeojson.features.reduce(
        (acc, feature) => {
          const coordinates = feature.geometry.coordinates[0]
          coordinates.forEach(([lng, lat]) => acc.extend([lng, lat]))
          return acc
        },
        new mapboxgl.LngLatBounds()
      )

      if (!bounds.isEmpty()) {
        boundsRef.current = bounds
        map.fitBounds(bounds, { padding: 48 })
      }
    })

    const handleMove = (event: MapLayerMouseEvent) => {
      if (!event.features?.length || !mapRef.current) return
      const feature = event.features[0]
      const id = feature.id as number

      if (hoveredFeatureId.current !== null && hoveredFeatureId.current !== id) {
        mapRef.current.setFeatureState(
          { source: SOURCE_ID, id: hoveredFeatureId.current },
          { hover: false }
        )
      }

      hoveredFeatureId.current = id
      mapRef.current.setFeatureState({ source: SOURCE_ID, id }, { hover: true })

      const { district, avgPrice, count } = feature.properties ?? {}
      const html = `
        <div class="text-sm">
          <div class="font-semibold text-gray-900 mb-1">${district ?? 'Unknown district'}</div>
          <div class="text-gray-600">Avg. price: <strong>${formatAvgPrice(
            typeof avgPrice === 'number' ? avgPrice : null
          )}</strong></div>
          <div class="text-gray-600">Listings: <strong>${numberFormatter.format(
            typeof count === 'number' ? count : 0
          )}</strong></div>
        </div>
      `

      popupRef.current
        ?.setLngLat(event.lngLat)
        .setHTML(html)
        .addTo(mapRef.current)
    }

    const handleLeave = () => {
      if (!mapRef.current) return
      if (hoveredFeatureId.current !== null) {
        mapRef.current.setFeatureState(
          { source: SOURCE_ID, id: hoveredFeatureId.current },
          { hover: false }
        )
      }
      hoveredFeatureId.current = null
      popupRef.current?.remove()
    }

    map.on('mousemove', FILL_LAYER_ID, handleMove)
    map.on('mouseleave', FILL_LAYER_ID, handleLeave)

    return () => {
      popupRef.current?.remove()
      map.off('mousemove', FILL_LAYER_ID, handleMove)
      map.off('mouseleave', FILL_LAYER_ID, handleLeave)
      map.remove()
      mapRef.current = null
    }
  }, [colorScale.expression, enrichedGeojson, fitMapToBounds])

  useEffect(() => {
    if (!mapRef.current || !enrichedGeojson) return
    const source = mapRef.current.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
    if (source) {
      source.setData(enrichedGeojson)
    }
  }, [enrichedGeojson])

  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setPaintProperty(FILL_LAYER_ID, 'fill-color', colorScale.expression)
  }, [colorScale])

  return (
    <div className={`relative h-full w-full ${className ?? ''}`}>
      {tokenMissing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/90 text-center p-6">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Mapbox token is missing
          </p>
          <p className="text-gray-600">
            Set <code className="px-1 py-0.5 rounded bg-gray-100">NEXT_PUBLIC_MAPBOX_TOKEN</code> in
            your environment to enable the choropleth map.
          </p>
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />

      {/* Legend */}
      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 p-3 shadow">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
          Avg. price (VND)
        </p>
        <div className="space-y-1">
          {colorScale.stops.map((stop, index) => {
            const next = colorScale.stops[index + 1]
            const label = next
              ? `${formatCurrency(stop.value * 1_000_000_000)} – ${formatCurrency(
                  next.value * 1_000_000_000
                )}`
              : `≥ ${formatCurrency(stop.value * 1_000_000_000)}`
            return (
              <div key={stop.value} className="flex items-center space-x-2 text-xs text-gray-600">
                <span
                  className="inline-block h-3 w-3 rounded-sm border border-gray-300"
                  style={{ backgroundColor: stop.color }}
                />
                <span>{label}</span>
              </div>
            )
          })}
          {!colorScale.stops.length && (
            <p className="text-xs text-gray-500">No pricing data available</p>
          )}
        </div>
      </div>

      {/* Reset View */}
      <button
        type="button"
        onClick={fitMapToBounds}
        className="absolute right-4 top-4 z-10 rounded border border-gray-300 bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 shadow hover:bg-white"
      >
        Reset view
      </button>
    </div>
  )
}

