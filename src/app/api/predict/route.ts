import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type LightGBMTreeNode = {
  split_feature?: number
  threshold?: number
  decision_type?: string
  default_left?: boolean
  left_child?: LightGBMTreeNode
  right_child?: LightGBMTreeNode
  leaf_value?: number
}

type LightGBMTree = {
  tree_index: number
  shrinkage?: number
  tree_structure: LightGBMTreeNode
}

type LightGBMModel = {
  feature_names: string[]
  tree_info: LightGBMTree[]
  average_output?: number
  num_trees?: number
}

type EncoderCache = {
  locations: string[]
  districts: string[]
  locationIndex: Map<string, number>
  districtIndex: Map<string, number>
}

const MODEL_PATH = path.join(process.cwd(), 'api', 'model.json')
const ENCODER_PATH = path.join(process.cwd(), 'api', 'encoders.json')

let cachedModel: LightGBMModel | null = null
let cachedEncoders: EncoderCache | null = null

async function loadModel(): Promise<LightGBMModel> {
  if (cachedModel) {
    return cachedModel
  }

  const raw = await fs.readFile(MODEL_PATH, 'utf-8')
  cachedModel = JSON.parse(raw) as LightGBMModel
  return cachedModel
}

async function loadEncoders(): Promise<EncoderCache> {
  if (cachedEncoders) {
    return cachedEncoders
  }

  const raw = await fs.readFile(ENCODER_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as { locations: string[]; districts: string[] }

  cachedEncoders = {
    locations: parsed.locations,
    districts: parsed.districts,
    locationIndex: new Map(parsed.locations.map((loc, idx) => [loc, idx])),
    districtIndex: new Map(parsed.districts.map((district, idx) => [district, idx])),
  }

  return cachedEncoders
}

function extractDistrict(location: string): string {
  const primary = location.split(',')[0].trim()
  const cleaned = primary.replace(/^Quận\s+/i, '').replace(/^Huyện\s+/i, '').trim()
  return cleaned.length > 0 ? cleaned : primary
}

function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function findLocationIndex(encoders: EncoderCache, location: string): number | undefined {
  const direct = encoders.locationIndex.get(location)
  if (direct !== undefined) {
    return direct
  }

  const normalizedTarget = normalize(location)
  for (const [loc, idx] of encoders.locationIndex.entries()) {
    if (normalize(loc) === normalizedTarget) {
      return idx
    }
  }

  const district = normalize(extractDistrict(location))
  for (const [loc, idx] of encoders.locationIndex.entries()) {
    if (normalize(loc).includes(district)) {
      return idx
    }
  }

  return undefined
}

function findDistrictIndex(encoders: EncoderCache, location: string): number | undefined {
  const district = extractDistrict(location)
  const direct = encoders.districtIndex.get(district)
  if (direct !== undefined) {
    return direct
  }

  const normalized = normalize(district)
  for (const [name, idx] of encoders.districtIndex.entries()) {
    if (normalize(name) === normalized) {
      return idx
    }
  }

  return undefined
}

function evaluateNode(node: LightGBMTreeNode | undefined, features: number[]): number {
  if (!node) {
    return 0
  }

  if (typeof node.leaf_value === 'number') {
    return node.leaf_value
  }

  const featureIndex = node.split_feature ?? 0
  const featureValue = features[featureIndex] ?? 0
  const threshold = node.threshold ?? 0
  const decisionType = node.decision_type ?? '<='
  const defaultLeft = node.default_left ?? true

  let goLeft: boolean
  switch (decisionType) {
    case '<=':
    case '≤':
      goLeft = featureValue <= threshold || (Number.isNaN(featureValue) && defaultLeft)
      break
    case '<':
      goLeft = featureValue < threshold || (Number.isNaN(featureValue) && defaultLeft)
      break
    case '>':
      goLeft = featureValue > threshold || (!Number.isNaN(featureValue) && !defaultLeft)
      break
    case '>=':
    case '≥':
      goLeft = featureValue >= threshold || (!Number.isNaN(featureValue) && !defaultLeft)
      break
    case '==':
      goLeft = featureValue === threshold
      break
    default:
      goLeft = featureValue <= threshold
  }

  const nextNode = goLeft ? node.left_child : node.right_child
  return evaluateNode(nextNode, features)
}

function predict(model: LightGBMModel, features: number[]): number {
  const base = model.average_output ?? 0
  return model.tree_info.reduce(
    (sum, tree) => sum + evaluateNode(tree.tree_structure, features),
    base
  )
}

export async function GET(request: NextRequest) {
  try {
    const model = await loadModel()
    const encoders = await loadEncoders()
    const { searchParams } = new URL(request.url)

    if (searchParams.get('locations') === 'true') {
      return NextResponse.json({ locations: encoders.locations })
    }

    return NextResponse.json({
      status: 'online',
      message: 'VN Real Estate LightGBM predictor (pre-trained)',
      model: 'LightGBM Gradient Boosting Decision Tree',
      num_trees: model.num_trees ?? model.tree_info.length,
      feature_count: model.feature_names.length,
      locations: encoders.locations.length,
      districts: encoders.districts.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to load model artifacts',
        details: String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const bedrooms = Number(body.bedrooms)
    const area = Number(body.area)
    const location = typeof body.location === 'string' ? body.location.trim() : ''

    if (!bedrooms || !area || !location) {
      return NextResponse.json(
        { error: 'Missing required fields: bedrooms, area, location' },
        { status: 400 }
      )
    }

    if (bedrooms <= 0 || area <= 0) {
      return NextResponse.json(
        { error: 'Bedrooms and area must be greater than 0' },
        { status: 400 }
      )
    }

    const [model, encoders] = await Promise.all([loadModel(), loadEncoders()])
    const locationIndex = findLocationIndex(encoders, location)
    const districtIndex = findDistrictIndex(encoders, location)

    if (locationIndex === undefined || districtIndex === undefined) {
      return NextResponse.json(
        {
          error: 'Location not found in trained dataset',
          hint: 'Use GET /api/predict?locations=true for supported values',
        },
        { status: 400 }
      )
    }

    const bedroomDensity = bedrooms / area
    const featureMap: Record<string, number> = {
      bedrooms,
      area,
      location_encoded: locationIndex,
      district_encoded: districtIndex,
      bedroom_density: bedroomDensity,
    }

    const featureVector = model.feature_names.map((name) => featureMap[name] ?? 0)
    const predictedPrice = predict(model, featureVector)

    return NextResponse.json({
      predicted_price: Number(predictedPrice.toFixed(2)),
      price_per_sqm: Number((predictedPrice / area).toFixed(4)),
      bedrooms,
      area,
      location,
      method: 'LightGBM gradient boosting (pre-trained)',
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Prediction failed',
        details: String(error),
      },
      { status: 500 }
    )
  }
}

