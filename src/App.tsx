/** Root: fetch 2D/3D data, layer toggles, render MapView. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import MapView from './components/MapView'
import {
  fetch2dCorridors,
  fetch3dNetwork,
  getApiBaseUrl,
  getTilesetUrl,
} from './lib/api'
import type {
  CorridorProperties,
  FeatureCollection,
  Network3DProperties,
} from './types/geojson'

export type LayersEnabled = {
  layer2d: boolean
  layer3d: boolean
  layerTileset: boolean
}

const DEFAULT_LAYERS: LayersEnabled = {
  layer2d: true,
  layer3d: true,
  layerTileset: true,
}

function App() {
  const [data2d, setData2d] = useState<
    FeatureCollection<CorridorProperties> | null
  >(null)
  const [data3d, setData3d] = useState<
    FeatureCollection<Network3DProperties> | null
  >(null)
  const [loading2d, setLoading2d] = useState(true)
  const [loading3d, setLoading3d] = useState(true)
  const [error2d, setError2d] = useState<string | null>(null)
  const [error3d, setError3d] = useState<string | null>(null)
  const [layersEnabled, setLayersEnabled] = useState<LayersEnabled>(DEFAULT_LAYERS)

  const baseUrl = useMemo(() => getApiBaseUrl(), [])
  const tilesetUrl = useMemo(() => getTilesetUrl(), [])

  const toggleLayer = useCallback((key: keyof LayersEnabled) => {
    setLayersEnabled((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    setLoading2d(true)
    setError2d(null)
    fetch2dCorridors({ signal })
      .then(setData2d)
      .catch((e: unknown) => {
        if (signal.aborted) return
        setData2d(null)
        setError2d(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!signal.aborted) setLoading2d(false)
      })

    return () => controller.abort()
  }, [baseUrl])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    setLoading3d(true)
    setError3d(null)
    fetch3dNetwork({ signal })
      .then(setData3d)
      .catch((e: unknown) => {
        if (signal.aborted) return
        setData3d(null)
        setError3d(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!signal.aborted) setLoading3d(false)
      })
  }, [baseUrl])

  const loading = loading2d || loading3d
  const hasAnyData = data2d !== null || data3d !== null

  return (
    <div className="app-shell">
      <div className="topbar">
        <h1>Layers</h1>
        <div className="row">
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={layersEnabled.layer2d}
              onChange={() => toggleLayer('layer2d')}
            />
            <span>2D corridors</span>
            {loading2d && <span className="status loading">loading</span>}
            {error2d && (
              <span className="status error" title={error2d}>
                error
              </span>
            )}
          </label>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={layersEnabled.layer3d}
              onChange={() => toggleLayer('layer3d')}
            />
            <span>3D network</span>
            {loading3d && <span className="status loading">loading</span>}
            {error3d && (
              <span className="status error" title={error3d}>
                error
              </span>
            )}
          </label>
          <label className="row" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={layersEnabled.layerTileset}
              onChange={() => toggleLayer('layerTileset')}
            />
            <span>3D tileset</span>
          </label>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          API: <code>{baseUrl}</code>
          {!hasAnyData && !loading && (
            <span style={{ marginLeft: 8 }}>
              — Start backend on <code>http://localhost:8000</code>
            </span>
          )}
        </div>
      </div>

      <MapView
        data2d={data2d}
        data3d={data3d}
        layersEnabled={layersEnabled}
        tilesetUrl={tilesetUrl}
      />
    </div>
  )
}

export default App
