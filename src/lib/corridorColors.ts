/** Colour and priority for 2D/3D corridor layers (by priorityID / corridor_type). */
import * as Cesium from 'cesium'
import type { CorridorProperties, Network3DProperties } from '../types/geojson'

export function asNumber(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t))
}

const CORRIDOR_TYPE_COLORS: Record<string, Cesium.Color> = {
  open_space: Cesium.Color.fromBytes(100, 180, 255, 140),
  above_building: Cesium.Color.fromBytes(255, 160, 80, 140),
  default: Cesium.Color.fromBytes(120, 200, 120, 140),
}

export function getColor2d(
  props: CorridorProperties | undefined,
  priorityRange: { min: number; max: number } | null,
): Cesium.Color {
  const fallback = Cesium.Color.fromBytes(80, 160, 255, 135)
  const n = asNumber(props?.priorityID)
  if (n === null || !priorityRange) return fallback
  const light = Cesium.Color.fromBytes(255, 255, 204, 135)
  const dark = Cesium.Color.fromBytes(177, 0, 38, 135)
  const denom = priorityRange.max - priorityRange.min || 1
  const t = clamp01((n - priorityRange.min) / denom)
  return Cesium.Color.lerp(light, dark, t, new Cesium.Color())
}

export function getColor3d(
  props: Network3DProperties | undefined,
  priorityRange: { min: number; max: number } | null,
): Cesium.Color {
  const typeKey = (props?.corridor_type ?? 'default') as string
  const byType = CORRIDOR_TYPE_COLORS[typeKey] ?? CORRIDOR_TYPE_COLORS.default
  const n = props?.priorityID != null ? Number(props.priorityID) : null
  if (n === null || !Number.isFinite(n) || !priorityRange) return byType
  const light = Cesium.Color.fromBytes(255, 255, 204, 140)
  const dark = Cesium.Color.fromBytes(177, 0, 38, 140)
  const denom = priorityRange.max - priorityRange.min || 1
  const t = clamp01((n - priorityRange.min) / denom)
  return Cesium.Color.lerp(light, dark, t, new Cesium.Color())
}
