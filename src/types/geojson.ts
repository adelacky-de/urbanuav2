/** GeoJSON corridor types: geometry, FeatureCollection, 2D/3D properties. */
export type Position = [number, number] | [number, number, number]

export type PolygonCoordinates = Position[][]
export type MultiPolygonCoordinates = Position[][][]

export type PolygonGeometry = {
  type: 'Polygon'
  coordinates: PolygonCoordinates
}

export type MultiPolygonGeometry = {
  type: 'MultiPolygon'
  coordinates: MultiPolygonCoordinates
}

export type Geometry = PolygonGeometry | MultiPolygonGeometry

export type Feature<P = Record<string, unknown>, G extends Geometry = Geometry> = {
  type: 'Feature'
  id?: string | number | null
  geometry: G
  properties: P
}

export type FeatureCollection<P = Record<string, unknown>> = {
  type: 'FeatureCollection'
  features: Array<Feature<P>>
}

export type CorridorProperties = {
  PLN_AREA_N?: string | number
  priorityID?: string | number
  Pop_Density?: string | number
  [key: string]: unknown
}

export type Network3DProperties = {
  min_altitude?: number
  max_altitude?: number
  corridor_type?: string
  volume_m3?: number
  priorityID?: number
  [key: string]: unknown
}

