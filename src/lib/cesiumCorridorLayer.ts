/** Sync GeoJSON corridor data to Cesium DataSource (2D flat / 3D extruded polygons / HDB footprints). */
import * as Cesium from 'cesium'
import type {
  CorridorProperties,
  FeatureCollection,
  HdbFootprintProperties,
  Network3DProperties,
  Position,
} from '../types/geojson'
import { getColor2d, getColor3d } from './corridorColors'

const HOVER_LAYER_2D = '2d' as const
const HOVER_LAYER_3D = '3d' as const
const HOVER_LAYER_HDB = 'hdb' as const

export type HoverLayer = typeof HOVER_LAYER_2D | typeof HOVER_LAYER_3D | typeof HOVER_LAYER_HDB

export interface EntityWithCorridor {
  _corridorProps?: CorridorProperties | Network3DProperties | HdbFootprintProperties
  _layer?: HoverLayer
}

function ringToDegreesFlat(ring: Position[]): number[] {
  const out: number[] = []
  for (const p of ring) {
    out.push(p[0], p[1])
  }
  return out
}

function buildPolygonHierarchy(rings: Position[][]): Cesium.PolygonHierarchy {
  if (!rings[0] || rings[0].length < 3) {
    throw new Error('Ring must have at least 3 positions')
  }
  return new Cesium.PolygonHierarchy(
    Cesium.Cartesian3.fromDegreesArray(ringToDegreesFlat(rings[0])),
    rings.slice(1).map((hole) =>
      new Cesium.PolygonHierarchy(
        Cesium.Cartesian3.fromDegreesArray(ringToDegreesFlat(hole)),
      ),
    ),
  )
}

const OUTLINE_COLOR = Cesium.Color.fromBytes(20, 20, 20, 200)
const HIGHLIGHT_COLOR = Cesium.Color.fromBytes(255, 220, 0, 220)

function applyAlpha(color: Cesium.Color, alpha: number): Cesium.Color {
  return new Cesium.Color(color.red, color.green, color.blue, alpha)
}

function hexToColor(hex: string, alpha: number): Cesium.Color {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return new Cesium.Color(r, g, b, alpha)
}

function addPolygon2d(
  ds: Cesium.CustomDataSource,
  rings: Position[][],
  material: Cesium.Color,
  props: CorridorProperties,
): void {
  const hierarchy = buildPolygonHierarchy(rings)
  const entity = ds.entities.add({
    polygon: {
      hierarchy,
      height: 0,
      extrudedHeight: 0,
      material,
      outline: true,
      outlineColor: OUTLINE_COLOR,
      perPositionHeight: false,
    },
  })
  ;(entity as unknown as EntityWithCorridor)._corridorProps = props
  ;(entity as unknown as EntityWithCorridor)._layer = HOVER_LAYER_2D
}

function addPolygon3d(
  ds: Cesium.CustomDataSource,
  rings: Position[][],
  minAlt: number,
  maxAlt: number,
  material: Cesium.Color,
  props: Network3DProperties,
): void {
  const hierarchy = buildPolygonHierarchy(rings)
  const entity = ds.entities.add({
    polygon: {
      hierarchy,
      height: minAlt,
      extrudedHeight: maxAlt,
      material,
      outline: true,
      outlineColor: OUTLINE_COLOR,
      perPositionHeight: false,
      closeTop: true,
      closeBottom: true,
    },
  })
  ;(entity as unknown as EntityWithCorridor)._corridorProps = props
  ;(entity as unknown as EntityWithCorridor)._layer = HOVER_LAYER_3D
}

function addPolygonHdb(
  ds: Cesium.CustomDataSource,
  rings: Position[][],
  maxAlt: number,
  material: Cesium.Color,
  props: HdbFootprintProperties,
): void {
  const hierarchy = buildPolygonHierarchy(rings)
  const entity = ds.entities.add({
    polygon: {
      hierarchy,
      height: 0,
      extrudedHeight: maxAlt,
      material,
      outline: true,
      outlineColor: Cesium.Color.fromBytes(80, 60, 40, 160),
      perPositionHeight: false,
      closeTop: true,
      closeBottom: true,
    },
  })
  ;(entity as unknown as EntityWithCorridor)._corridorProps = props
  ;(entity as unknown as EntityWithCorridor)._layer = HOVER_LAYER_HDB
}

export function highlightEntity(entity: Cesium.Entity | null, originalColor: Cesium.Color | null): void {
  if (!entity?.polygon) return
  entity.polygon.material = new Cesium.ColorMaterialProperty(
    originalColor ? new Cesium.ConstantProperty(HIGHLIGHT_COLOR) : new Cesium.ConstantProperty(HIGHLIGHT_COLOR),
  )
}

export function sync2dCorridorLayer(
  ds: Cesium.CustomDataSource | null,
  data: FeatureCollection<CorridorProperties> | null,
  priorityRange: { min: number; max: number } | null,
  enabled: boolean,
  colorHex?: string,
  alpha?: number,
): void {
  if (!ds) return
  ds.entities.removeAll()
  if (!enabled || !data) return

  for (const feature of data.features) {
    const geom = feature.geometry
    if (!geom) continue
    const props = feature.properties ?? {}
    let material = getColor2d(props, priorityRange)
    if (colorHex) {
      material = hexToColor(colorHex, alpha ?? material.alpha)
    } else if (alpha !== undefined) {
      material = applyAlpha(material, alpha)
    }

    const addRings = (rings: Position[][]) => {
      if (!rings[0] || rings[0].length < 3) return
      addPolygon2d(ds!, rings, material, props as CorridorProperties)
    }

    if (geom.type === 'Polygon') {
      addRings(geom.coordinates as Position[][])
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates as Position[][][]) {
        addRings(poly)
      }
    }
  }
}

export function sync3dCorridorLayer(
  ds: Cesium.CustomDataSource | null,
  data: FeatureCollection<Network3DProperties> | null,
  priorityRange: { min: number; max: number } | null,
  enabled: boolean,
  colorHex?: string,
  alpha?: number,
): void {
  if (!ds) return
  ds.entities.removeAll()
  if (!enabled || !data) return

  for (const feature of data.features) {
    const geom = feature.geometry
    if (!geom) continue
    const props = feature.properties ?? {}
    const minAlt = typeof props.min_altitude === 'number' ? props.min_altitude : 0
    const maxAlt = typeof props.max_altitude === 'number' ? props.max_altitude : minAlt + 100
    let material = getColor3d(props, priorityRange)
    if (colorHex) {
      material = hexToColor(colorHex, alpha ?? material.alpha)
    } else if (alpha !== undefined) {
      material = applyAlpha(material, alpha)
    }

    const addRings = (rings: Position[][]) => {
      if (!rings[0] || rings[0].length < 3) return
      addPolygon3d(ds!, rings, minAlt, maxAlt, material, props)
    }

    if (geom.type === 'Polygon') {
      addRings(geom.coordinates as Position[][])
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates as Position[][][]) {
        addRings(poly)
      }
    }
  }
}

const HDB_DEFAULT_COLOR = Cesium.Color.fromBytes(180, 150, 110, 140)

export function syncHdbFootprintLayer(
  ds: Cesium.CustomDataSource | null,
  data: FeatureCollection<HdbFootprintProperties> | null,
  enabled: boolean,
  colorHex?: string,
  alpha?: number,
): void {
  if (!ds) return
  ds.entities.removeAll()
  if (!enabled || !data) return

  for (const feature of data.features) {
    const geom = feature.geometry
    if (!geom) continue
    const props = feature.properties ?? {}
    let material = HDB_DEFAULT_COLOR.clone()
    if (colorHex) {
      material = hexToColor(colorHex, alpha ?? material.alpha)
    } else if (alpha !== undefined) {
      material = applyAlpha(material, alpha)
    }

    let h = 0;
    if (typeof props.height === 'number' && props.height > 0) {
      h = props.height;
    } else if (typeof props.levels === 'number') {
      h = props.levels * 3;
    } else if (typeof props.levels === 'string' && !isNaN(Number(props.levels))) {
      h = Number(props.levels) * 3;
    } else {
      h = 10; // default generic height if nothing
    }

    const addRings = (rings: Position[][]) => {
      if (!rings[0] || rings[0].length < 3) return
      addPolygonHdb(ds!, rings, h, material, props as HdbFootprintProperties)
    }

    if (geom.type === 'Polygon') {
      addRings(geom.coordinates as Position[][])
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates as Position[][][]) {
        addRings(poly)
      }
    }
  }
}
