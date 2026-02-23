/** Map container: Cesium, 2D/3D/HDB layers, tileset sync, navigation ball, layer panel, info bar. */
import { useEffect, useMemo, useRef, useState } from 'react'
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
  loading2d: boolean
  loading3d: boolean
  loadingHdb: boolean
  error2d: string | null
  error3d: string | null
  errorHdb: string | null
  onToggleLayer: (key: keyof LayersEnabled) => void
  onLayerStyleChange: (key: keyof LayersEnabled, style: Partial<LayerStyle>) => void
  onBoundsChange: (bbox: [number, number, number, number]) => void
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
  loading2d,
  loading3d,
  loadingHdb,
  error2d,
  error3d,
  errorHdb,
  onToggleLayer,
  onLayerStyleChange,
  onBoundsChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<HoveredInfo | null>(null)
  const [selected, setSelected] = useState<SelectedInfo[] | null>(null)
  const [processing, setProcessing] = useState({ layer2d: false, layer3d: false, layerHdb: false })

  const { viewerRef, dataSource2dRef, dataSource3dRef, dataSourceHdbRef, clearSelection } = useCesiumViewer(
    containerRef,
    setHovered,
    setSelected,
    onBoundsChange,
  )

  const priorityRange2d = useMemo(() => computePriorityRange2d(data2d), [data2d])
  const priorityRange3d = useMemo(() => computePriorityRange3d(data3d), [data3d])

  // 2D corridors
  useEffect(() => {
    const controller = new AbortController()
    setProcessing((p) => ({ ...p, layer2d: true }))
    sync2dCorridorLayer(
      dataSource2dRef.current,
      data2d,
      priorityRange2d,
      layersEnabled.layer2d,
      layerStyles.layer2d.colorHex,
      layerStyles.layer2d.alpha,
      controller.signal,
    ).then(() => {
      if (!controller.signal.aborted) setProcessing((p) => ({ ...p, layer2d: false }))
    })
    return () => controller.abort()
  }, [dataSource2dRef, data2d, priorityRange2d, layersEnabled.layer2d, layerStyles.layer2d])

  // 3D network
  useEffect(() => {
    const controller = new AbortController()
    setProcessing((p) => ({ ...p, layer3d: true }))
    sync3dCorridorLayer(
      dataSource3dRef.current,
      data3d,
      priorityRange3d,
      layersEnabled.layer3d,
      layerStyles.layer3d.colorHex,
      layerStyles.layer3d.alpha,
      controller.signal,
    ).then(() => {
      if (!controller.signal.aborted) setProcessing((p) => ({ ...p, layer3d: false }))
    })
    return () => controller.abort()
  }, [dataSource3dRef, data3d, priorityRange3d, layersEnabled.layer3d, layerStyles.layer3d])

  // HDB footprints
  useEffect(() => {
    const controller = new AbortController()
    setProcessing((p) => ({ ...p, layerHdb: true }))
    syncHdbFootprintLayer(
      dataSourceHdbRef.current,
      dataHdb,
      layersEnabled.layerHdb,
      layerStyles.layerHdb.colorHex,
      layerStyles.layerHdb.alpha,
      controller.signal,
    ).then(() => {
      if (!controller.signal.aborted) setProcessing((p) => ({ ...p, layerHdb: false }))
    })
    return () => controller.abort()
  }, [dataSourceHdbRef, dataHdb, layersEnabled.layerHdb, layerStyles.layerHdb])

  // Check if any primary data layer is loaded or processing geometries
  const isLoading = loading2d || loading3d || loadingHdb || processing.layer2d || processing.layer3d || processing.layerHdb;

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
      <InfoBar selected={selected} onClear={clearSelection} />
    </div>
  )
}
