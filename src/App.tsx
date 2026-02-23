/** Root: fetch 2D/3D/HDB data, layer toggles + styles, render MapView. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import {
  fetch2dCorridors,
  fetch3dNetwork,
  fetchHdbFootprints,
  getApiBaseUrl,
  getTilesetUrl,
} from './lib/api'
import type {
  CorridorProperties,
  FeatureCollection,
  HdbFootprintProperties,
  Network3DProperties,
} from './types/geojson'

export type LayersEnabled = {
  layer2d: boolean
  layer3d: boolean
  layerTileset: boolean
  layerHdb: boolean
}

export type LayerStyle = {
  colorHex: string
  alpha: number
}

const DEFAULT_LAYERS: LayersEnabled = {
  layer2d: false,
  layer3d: true,
  layerTileset: false,
  layerHdb: true,
}

const DEFAULT_STYLES: Record<keyof LayersEnabled, LayerStyle> = {
  layer2d: { colorHex: '#4da6ff', alpha: 0.53 },
  layer3d: { colorHex: '#64c864', alpha: 0.55 },
  layerTileset: { colorHex: '#ffffff', alpha: 1 },
  layerHdb: { colorHex: '#b49670', alpha: 0.55 },
}

function App() {
  const [data2d, setData2d] = useState<FeatureCollection<CorridorProperties> | null>(null)
  const [data3d, setData3d] = useState<FeatureCollection<Network3DProperties> | null>(null)
  const [dataHdb, setDataHdb] = useState<FeatureCollection<HdbFootprintProperties> | null>(null)
  const [loading2d, setLoading2d] = useState(true)
  const [loading3d, setLoading3d] = useState(true)
  const [loadingHdb, setLoadingHdb] = useState(true)
  const [error2d, setError2d] = useState<string | null>(null)
  const [error3d, setError3d] = useState<string | null>(null)
  const [errorHdb, setErrorHdb] = useState<string | null>(null)
  const [layersEnabled, setLayersEnabled] = useState<LayersEnabled>(DEFAULT_LAYERS)
  const [layerStyles, setLayerStyles] = useState<Record<keyof LayersEnabled, LayerStyle>>(DEFAULT_STYLES)

  const baseUrl = useMemo(() => getApiBaseUrl(), [])
  const tilesetUrl = useMemo(() => getTilesetUrl(), [])

  const toggleLayer = useCallback((key: keyof LayersEnabled) => {
    setLayersEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const setLayerStyle = useCallback((key: keyof LayersEnabled, style: Partial<LayerStyle>) => {
    setLayerStyles((prev) => ({ ...prev, [key]: { ...prev[key], ...style } }))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setLoading2d(true); setError2d(null)
    fetch2dCorridors({ signal })
      .then(setData2d)
      .catch((e: unknown) => { if (!signal.aborted) { setData2d(null); setError2d(e instanceof Error ? e.message : String(e)) } })
      .finally(() => { if (!signal.aborted) setLoading2d(false) })
    return () => controller.abort()
  }, [baseUrl])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setLoading3d(true); setError3d(null)
    fetch3dNetwork({ signal })
      .then(setData3d)
      .catch((e: unknown) => { if (!signal.aborted) { setData3d(null); setError3d(e instanceof Error ? e.message : String(e)) } })
      .finally(() => { if (!signal.aborted) setLoading3d(false) })
    return () => controller.abort()
  }, [baseUrl])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    setLoadingHdb(true); setErrorHdb(null)
    fetchHdbFootprints({ signal })
      .then(setDataHdb)
      .catch((e: unknown) => { if (!signal.aborted) { setDataHdb(null); setErrorHdb(e instanceof Error ? e.message : String(e)) } })
      .finally(() => { if (!signal.aborted) setLoadingHdb(false) })
    return () => controller.abort()
  }, [baseUrl])

  return (
    <div className="app-shell">
      <MapView
        data2d={data2d}
        data3d={data3d}
        dataHdb={dataHdb}
        layersEnabled={layersEnabled}
        layerStyles={layerStyles}
        tilesetUrl={tilesetUrl}
        loading2d={loading2d}
        loading3d={loading3d}
        loadingHdb={loadingHdb}
        error2d={error2d}
        error3d={error3d}
        errorHdb={errorHdb}
        onToggleLayer={toggleLayer}
        onLayerStyleChange={setLayerStyle}
      />
    </div>
  )
}

export default App
