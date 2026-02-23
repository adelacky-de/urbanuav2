/** Backend API: fetch 2D/3D corridors, 3D Tiles, and HDB footprints; validate GeoJSON. */
import type {
  CorridorProperties,
  FeatureCollection,
  HdbFootprintProperties,
  Network3DProperties,
} from '../types/geojson'

// Dev: Vite proxy in vite.config.ts forwards /api -> localhost:8000. No
const DEFAULT_API_BASE_URL = '/api'

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim()
  if (!trimmed) return DEFAULT_API_BASE_URL
  return trimmed.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const envBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  return normalizeBaseUrl(envBase ?? DEFAULT_API_BASE_URL)
}

function assertFeatureCollection(json: unknown): asserts json is FeatureCollection {
  if (
    !json ||
    typeof json !== 'object' ||
    (json as { type?: unknown }).type !== 'FeatureCollection' ||
    !Array.isArray((json as { features?: unknown }).features)
  ) {
    throw new Error('Invalid GeoJSON: expected a FeatureCollection')
  }
}

export async function fetch2dCorridors(opts?: {
  signal?: AbortSignal
  bbox?: [number, number, number, number]
}): Promise<FeatureCollection<CorridorProperties>> {
  const baseUrl = getApiBaseUrl()
  let url = `${baseUrl}/2d-corridors`
  if (opts?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = opts.bbox
    url += `?min_lon=${minLon}&min_lat=${minLat}&max_lon=${maxLon}&max_lat=${maxLat}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: opts?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Failed to fetch 2d-corridors (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`,
    )
  }

  const json = (await res.json()) as unknown
  assertFeatureCollection(json)
  return json as FeatureCollection<CorridorProperties>
}

export async function fetch3dNetwork(opts?: {
  signal?: AbortSignal
  bbox?: [number, number, number, number]
}): Promise<FeatureCollection<Network3DProperties>> {
  const baseUrl = getApiBaseUrl()
  let url = `${baseUrl}/3d-network`
  if (opts?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = opts.bbox
    url += `?min_lon=${minLon}&min_lat=${minLat}&max_lon=${maxLon}&max_lat=${maxLat}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: opts?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Failed to fetch 3d-network (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`,
    )
  }

  const json = (await res.json()) as unknown
  assertFeatureCollection(json)
  return json as FeatureCollection<Network3DProperties>
}

export async function fetchHealth(opts?: {
  signal?: AbortSignal
}): Promise<{ status: string }> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/health`

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: opts?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Health check failed (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`,
    )
  }

  const json = (await res.json()) as unknown
  if (!json || typeof (json as { status?: unknown }).status !== 'string') {
    throw new Error('Invalid health response')
  }
  return json as { status: string }
}

export async function fetchHdbFootprints(opts?: {
  signal?: AbortSignal
  bbox?: [number, number, number, number]
}): Promise<FeatureCollection<HdbFootprintProperties>> {
  const baseUrl = getApiBaseUrl()
  let url = `${baseUrl}/hdb-footprints`
  if (opts?.bbox) {
    const [minLon, minLat, maxLon, maxLat] = opts.bbox
    url += `?min_lon=${minLon}&min_lat=${minLat}&max_lon=${maxLon}&max_lat=${maxLat}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: opts?.signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Failed to fetch hdb-footprints (${res.status} ${res.statusText})${text ? `: ${text}` : ''}`,
    )
  }

  const json = (await res.json()) as unknown
  assertFeatureCollection(json)
  return json as FeatureCollection<HdbFootprintProperties>
}
