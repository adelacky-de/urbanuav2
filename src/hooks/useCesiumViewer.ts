/** Create/destroy Cesium Viewer, base map, DataSources; handle hover pick. */
import { useEffect, useRef, type RefObject } from 'react'
import * as Cesium from 'cesium'
import type { CorridorProperties, Network3DProperties } from '../types/geojson'
import type { EntityWithCorridor, HoverLayer } from '../lib/cesiumCorridorLayer'

export type HoveredInfo = {
  x: number
  y: number
  properties: CorridorProperties | Network3DProperties
  layer: HoverLayer
}

export function useCesiumViewer(
  containerRef: RefObject<HTMLDivElement | null>,
  setHovered: (info: HoveredInfo | null) => void,
  tilesetRef: RefObject<Cesium.Cesium3DTileset | null>,
): {
  viewerRef: RefObject<Cesium.Viewer | null>
  dataSource2dRef: RefObject<Cesium.CustomDataSource | null>
  dataSource3dRef: RefObject<Cesium.CustomDataSource | null>
} {
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const dataSource2dRef = useRef<Cesium.CustomDataSource | null>(null)
  const dataSource3dRef = useRef<Cesium.CustomDataSource | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (viewerRef.current) return

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      vrButton: false,
    })

    viewer.imageryLayers.removeAll()
    viewer.imageryLayers.addImageryProvider(
      new Cesium.UrlTemplateImageryProvider({
        url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        credit: '&copy; OpenStreetMap contributors &copy; CARTO',
        minimumLevel: 0,
        maximumLevel: 19,
      }),
    )

    try {
      (viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'
    } catch {
      // Cesium credit container may be missing in some builds
    }

    viewer.scene.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(103.8198, 1.3521, 25000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-60),
        roll: 0,
      },
    })

    const ds2d = new Cesium.CustomDataSource('corridors-2d')
    const ds3d = new Cesium.CustomDataSource('corridors-3d')
    viewer.dataSources.add(ds2d)
    viewer.dataSources.add(ds3d)

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.endPosition)
      const id = (picked as { id?: unknown } | undefined)?.id as Cesium.Entity | undefined
      const entity = id as unknown as EntityWithCorridor
      const props = entity?._corridorProps
      const layer = entity?._layer
      if (props && (layer === '2d' || layer === '3d')) {
        setHovered({
          x: movement.endPosition.x,
          y: movement.endPosition.y,
          properties: props,
          layer,
        })
      } else {
        setHovered(null)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    viewerRef.current = viewer
    dataSource2dRef.current = ds2d
    dataSource3dRef.current = ds3d

    return () => {
      handler.destroy()
      const tileset = tilesetRef.current
      if (tileset) {
        try {
          viewer.scene.primitives.remove(tileset)
          ;(tileset as unknown as { destroy?: () => void }).destroy?.()
        } catch {
          // ignore
        }
        if ('current' in tilesetRef) tilesetRef.current = null
      }
      viewer.destroy()
      viewerRef.current = null
      dataSource2dRef.current = null
      dataSource3dRef.current = null
    }
  }, [containerRef, setHovered, tilesetRef])

  return { viewerRef, dataSource2dRef, dataSource3dRef }
}
