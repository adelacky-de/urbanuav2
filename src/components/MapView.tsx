/** Map container: Cesium, 2D/3D layers and tileset sync, tooltip and corner note. */
import { useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import type { LayersEnabled } from '../App'
import type {
  CorridorProperties,
  FeatureCollection,
  Network3DProperties,
} from '../types/geojson'
import { asNumber } from '../lib/corridorColors'
import { sync2dCorridorLayer, sync3dCorridorLayer } from '../lib/cesiumCorridorLayer'
import { useCesiumViewer } from '../hooks/useCesiumViewer'
import CorridorTooltip from './CorridorTooltip'
import MapCornerNote from './MapCornerNote'

type Props = {
  data2d: FeatureCollection<CorridorProperties> | null
  data3d: FeatureCollection<Network3DProperties> | null
  layersEnabled: LayersEnabled
  tilesetUrl: string
}

function computePriorityRange2d(
  data: FeatureCollection<CorridorProperties> | null,
): { min: number; max: number } | null {
  if (!data) return null
  const vals: number[] = []
  for (const f of data.features) {
    const n = asNumber(f.properties?.priorityID)
    if (n !== null) vals.push(n)
  }
  if (vals.length === 0) return null
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

function computePriorityRange3d(
  data: FeatureCollection<Network3DProperties> | null,
): { min: number; max: number } | null {
  if (!data) return null
  const vals: number[] = []
  for (const f of data.features) {
    const n = f.properties?.priorityID
    if (typeof n === 'number' && Number.isFinite(n)) vals.push(n)
  }
  if (vals.length === 0) return null
  return { min: Math.min(...vals), max: Math.max(...vals) }
}

export default function MapView({
  data2d,
  data3d,
  layersEnabled,
  tilesetUrl,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null)
  const [tilesetState, setTilesetState] = useState<
    'idle' | 'loading' | 'loaded' | 'error'
  >('idle')
  const [tilesetError, setTilesetError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<import('../hooks/useCesiumViewer').HoveredInfo | null>(null)

  const { viewerRef, dataSource2dRef, dataSource3dRef } = useCesiumViewer(
    containerRef,
    setHovered,
    tilesetRef,
  )

  const priorityRange2d = useMemo(() => computePriorityRange2d(data2d), [data2d])
  const priorityRange3d = useMemo(() => computePriorityRange3d(data3d), [data3d])

  useEffect(() => {
    sync2dCorridorLayer(
      dataSource2dRef.current,
      data2d,
      priorityRange2d,
      layersEnabled.layer2d,
    )
  }, [dataSource2dRef, data2d, priorityRange2d, layersEnabled.layer2d])

  useEffect(() => {
    sync3dCorridorLayer(
      dataSource3dRef.current,
      data3d,
      priorityRange3d,
      layersEnabled.layer3d,
    )
  }, [dataSource3dRef, data3d, priorityRange3d, layersEnabled.layer3d])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    if (!layersEnabled.layerTileset || !tilesetUrl) {
      if (tilesetRef.current) {
        try {
          viewer.scene.primitives.remove(tilesetRef.current)
          ;(tilesetRef.current as unknown as { destroy?: () => void }).destroy?.()
        } catch {
          // ignore
        }
        tilesetRef.current = null
        setTilesetState('idle')
        setTilesetError(null)
      }
      return
    }

    let cancelled = false
    setTilesetState('loading')
    setTilesetError(null)

    Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {})
      .then((tileset) => {
        if (cancelled || viewer.isDestroyed()) {
          try {
            (tileset as unknown as { destroy?: () => void }).destroy?.()
          } catch {
            // ignore
          }
          return
        }
        viewer.scene.primitives.add(tileset)
        tilesetRef.current = tileset
        setTilesetState('loaded')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        setTilesetState('error')
        setTilesetError(msg)
        console.error('Failed to load 3D tileset', e)
      })

    return () => {
      cancelled = true
    }
  }, [viewerRef, layersEnabled.layerTileset, tilesetUrl])

  return (
    <div className="map-root">
      <div ref={containerRef} className="cesium-container" />
      {hovered && <CorridorTooltip hovered={hovered} />}
      <MapCornerNote tilesetState={tilesetState} tilesetError={tilesetError} />
    </div>
  )
}
