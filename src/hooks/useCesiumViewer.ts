/** Create/destroy Cesium Viewer, base map, DataSources; handle hover pick and click selection. */
import { useEffect, useRef, type RefObject } from 'react'
import * as Cesium from 'cesium'
import type { CorridorProperties, HdbFootprintProperties, Network3DProperties } from '../types/geojson'
import type { EntityWithCorridor, HoverLayer } from '../lib/cesiumCorridorLayer'

export type HoveredInfo = {
  x: number
  y: number
  properties: CorridorProperties | Network3DProperties | HdbFootprintProperties
  layer: HoverLayer
}

export type SelectedInfo = {
  properties: CorridorProperties | Network3DProperties | HdbFootprintProperties
  layer: HoverLayer
}

export function useCesiumViewer(
  containerRef: RefObject<HTMLDivElement | null>,
  setHovered: (info: HoveredInfo | null) => void,
  setSelected: (info: SelectedInfo | null) => void,
  tilesetRef: RefObject<Cesium.Cesium3DTileset | null>,
): {
  viewerRef: RefObject<Cesium.Viewer | null>
  dataSource2dRef: RefObject<Cesium.CustomDataSource | null>
  dataSource3dRef: RefObject<Cesium.CustomDataSource | null>
  dataSourceHdbRef: RefObject<Cesium.CustomDataSource | null>
} {
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const dataSource2dRef = useRef<Cesium.CustomDataSource | null>(null)
  const dataSource3dRef = useRef<Cesium.CustomDataSource | null>(null)
  const dataSourceHdbRef = useRef<Cesium.CustomDataSource | null>(null)
  const selectedEntityRef = useRef<Cesium.Entity | null>(null)
  const selectedOrigColorRef = useRef<Cesium.Color | null>(null)

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
      targetFrameRate: 60,
      contextOptions: {
        webgl: {
          alpha: true,
          antialias: true,
        },
      },
    })

    viewer.scene.postProcessStages.fxaa.enabled = true
    viewer.scene.msaaSamples = 4
    viewer.resolutionScale = window.devicePixelRatio || 1

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
    const dsHdb = new Cesium.CustomDataSource('hdb-footprints')
    viewer.dataSources.add(ds2d)
    viewer.dataSources.add(ds3d)
    viewer.dataSources.add(dsHdb)

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    // Hover
    handler.setInputAction((movement: { endPosition: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(movement.endPosition)
      const id = (picked as { id?: unknown } | undefined)?.id as Cesium.Entity | undefined
      const entity = id as unknown as EntityWithCorridor
      const props = entity?._corridorProps
      const layer = entity?._layer
      if (props && layer) {
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

    // Click to select
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position)
      const id = (picked as { id?: unknown } | undefined)?.id as Cesium.Entity | undefined
      const entity = id as unknown as EntityWithCorridor

      // Restore previous selection colour
      if (selectedEntityRef.current?.polygon && selectedOrigColorRef.current) {
        const prevMat = selectedEntityRef.current.polygon.material
        if (prevMat instanceof Cesium.ColorMaterialProperty) {
          selectedEntityRef.current.polygon.material = new Cesium.ColorMaterialProperty(
            new Cesium.ConstantProperty(selectedOrigColorRef.current),
          )
        }
      }

      const props = entity?._corridorProps
      const layer = entity?._layer

      if (props && layer && id) {
        // Read current colour before overwriting
        const mat = id.polygon?.material
        let origColor = Cesium.Color.WHITE.clone()
        if (mat instanceof Cesium.ColorMaterialProperty) {
          const val = mat.color?.getValue(Cesium.JulianDate.now())
          if (val instanceof Cesium.Color) origColor = val.clone()
        }
        selectedEntityRef.current = id
        selectedOrigColorRef.current = origColor

        // Highlight yellow
        id.polygon!.material = new Cesium.ColorMaterialProperty(
          new Cesium.ConstantProperty(Cesium.Color.fromBytes(255, 220, 0, 220)),
        )
        setSelected({ properties: props, layer })
      } else {
        selectedEntityRef.current = null
        selectedOrigColorRef.current = null
        setSelected(null)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    viewerRef.current = viewer
    dataSource2dRef.current = ds2d
    dataSource3dRef.current = ds3d
    dataSourceHdbRef.current = dsHdb

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
      dataSourceHdbRef.current = null
    }
  }, [containerRef, setHovered, setSelected, tilesetRef])

  return { viewerRef, dataSource2dRef, dataSource3dRef, dataSourceHdbRef }
}
