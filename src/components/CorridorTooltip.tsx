/** Tooltip for hovered 2D/3D corridor (PLN_AREA_N, priorityID, altitude, etc.). */
import type { CorridorProperties, Network3DProperties } from '../types/geojson'
import type { HoveredInfo } from '../hooks/useCesiumViewer'

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '—'
  return String(v)
}

function TooltipRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="tooltip-row">
      <span className="tooltip-k">{label}</span>
      <span className="tooltip-v">{formatVal(value)}</span>
    </div>
  )
}

export default function CorridorTooltip({ hovered }: { hovered: HoveredInfo }) {
  return (
    <div
      className="tooltip"
      style={{ left: hovered.x, top: hovered.y }}
      role="tooltip"
    >
      <div className="tooltip-title">
        {hovered.layer === '2d' ? '2D Corridor' : '3D Network'}
      </div>
      {hovered.layer === '2d' ? (
        <>
          <TooltipRow label="PLN_AREA_N" value={(hovered.properties as CorridorProperties).PLN_AREA_N} />
          <TooltipRow label="priorityID" value={(hovered.properties as CorridorProperties).priorityID} />
          {'Pop_Density' in hovered.properties && (
            <TooltipRow label="Pop_Density" value={(hovered.properties as CorridorProperties).Pop_Density} />
          )}
        </>
      ) : (
        <>
          <TooltipRow label="min_altitude" value={(hovered.properties as Network3DProperties).min_altitude} />
          <TooltipRow label="max_altitude" value={(hovered.properties as Network3DProperties).max_altitude} />
          <TooltipRow label="corridor_type" value={(hovered.properties as Network3DProperties).corridor_type} />
          <TooltipRow label="priorityID" value={(hovered.properties as Network3DProperties).priorityID} />
          <TooltipRow label="volume_m3" value={(hovered.properties as Network3DProperties).volume_m3} />
        </>
      )}
    </div>
  )
}
