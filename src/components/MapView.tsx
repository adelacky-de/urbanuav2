/** Map container: Cesium, 2D/3D/HDB layers, tileset sync, navigation ball, layer panel, info bar. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import type { LayersEnabled, LayerStyle } from '../App'
import type {
  CorridorProperties,
  FeatureCollection,
  HdbFootprintProperties,
  Network3DProperties,
} from '../types/geojson'
import { asNumber } from '../lib/corridorColors'
import { sync2dCorridorLayer, sync3dCorridorLayer, syncHdbFootprintLayer } from '../lib/cesiumCorridorLayer'
import { useCesiumViewer } from '../hooks/useCesiumViewer'
import type { HoveredInfo, SelectedInfo } from '../hooks/useCesiumViewer'
import CorridorTooltip from './CorridorTooltip'
import PerspectiveButton from './NavigationBall'
import LayerPanel from './LayerPanel'
import InfoBar from './InfoBar'

type Props = {
  data2d: FeatureCollection<CorridorProperties> | null
  data3d: FeatureCollection<Network3DProperties> | null
  dataHdb: FeatureCollection<HdbFootprintProperties> | null
  layersEnabled: LayersEnabled
  layerStyles: Record<keyof LayersEnabled, LayerStyle>
  tilesetUrl: string
  loading2d: boolean
  loading3d: boolean
  loadingHdb: boolean
  error2d: string | null
  error3d: string | null
  errorHdb: string | null
  onToggleLayer: (key: keyof LayersEnabled) => void
  onLayerStyleChange: (key: keyof LayersEnabled, style: Partial<LayerStyle>) => void
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
  dataHdb,
  layersEnabled,
  layerStyles,
  tilesetUrl,
  loading2d,
  loading3d,
  loadingHdb,
  error2d,
  error3d,
  errorHdb,
  onToggleLayer,
  onLayerStyleChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null)
  const [tilesetState, setTilesetState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [tilesetError, setTilesetError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<HoveredInfo | null>(null)
  const [selected, setSelected] = useState<SelectedInfo | null>(null)

  const handleSetSelected = useCallback((info: SelectedInfo | null) => setSelected(info), [])

  const { viewerRef, dataSource2dRef, dataSource3dRef, dataSourceHdbRef } = useCesiumViewer(
    containerRef,
    setHovered,
    handleSetSelected,
    tilesetRef,
  )

  const priorityRange2d = useMemo(() => computePriorityRange2d(data2d), [data2d])
  const priorityRange3d = useMemo(() => computePriorityRange3d(data3d), [data3d])

  // 2D corridors
  useEffect(() => {
    sync2dCorridorLayer(
      dataSource2dRef.current,
      data2d,
      priorityRange2d,
      layersEnabled.layer2d,
      layerStyles.layer2d.colorHex,
      layerStyles.layer2d.alpha,
    )
  }, [dataSource2dRef, data2d, priorityRange2d, layersEnabled.layer2d, layerStyles.layer2d])

  // 3D network
  useEffect(() => {
    sync3dCorridorLayer(
      dataSource3dRef.current,
      data3d,
      priorityRange3d,
      layersEnabled.layer3d,
      layerStyles.layer3d.colorHex,
      layerStyles.layer3d.alpha,
    )
  }, [dataSource3dRef, data3d, priorityRange3d, layersEnabled.layer3d, layerStyles.layer3d])

  // HDB footprints
  useEffect(() => {
    syncHdbFootprintLayer(
      dataSourceHdbRef.current,
      dataHdb,
      layersEnabled.layerHdb,
      layerStyles.layerHdb.colorHex,
      layerStyles.layerHdb.alpha,
    )
  }, [dataSourceHdbRef, dataHdb, layersEnabled.layerHdb, layerStyles.layerHdb])

  // 3D Tileset
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    if (!layersEnabled.layerTileset || !tilesetUrl) {
      if (tilesetRef.current) {
        try {
          viewer.scene.primitives.remove(tilesetRef.current)
          ;(tilesetRef.current as unknown as { destroy?: () => void }).destroy?.()
        } catch { /* ignore */ }
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
          try { (tileset as unknown as { destroy?: () => void }).destroy?.() } catch { /* ignore */ }
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

    return () => { cancelled = true }
  }, [viewerRef, layersEnabled.layerTileset, tilesetUrl])

  // Check if any primary data layer is loading
  const isLoading = loading2d || loading3d || loadingHdb;

  return (
    <div className="map-root">
      <div ref={containerRef} className="cesium-container" />

      {isLoading && (
        <div className="fullscreen-loading">
          <div className="spinner" />
          <div className="loading-text">Loading Spatial Data...</div>
        </div>
      )}

      <LayerPanel
        layersEnabled={layersEnabled}
        layerStyles={layerStyles}
        onToggle={onToggleLayer}
        onStyleChange={onLayerStyleChange}
        loading2d={loading2d}
        loading3d={loading3d}
        loadingHdb={loadingHdb}
        error2d={error2d}
        error3d={error3d}
        errorHdb={errorHdb}
      />

      {hovered && <CorridorTooltip hovered={hovered} />}
      <PerspectiveButton viewerRef={viewerRef} />
      <InfoBar selected={selected} />
    </div>
  )
}
