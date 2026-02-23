/** InfoBar: bottom bar showing clicked polygon properties in a table. */
import { useCallback } from 'react'
import type { SelectedInfo } from '../hooks/useCesiumViewer'

const LAYER_LABELS: Record<string, string> = {
  '2d': '2D Corridor',
  '3d': '3D Network',
  'hdb': 'HDB Footprint',
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '—'
  return String(v)
}

type Props = {
  selected: SelectedInfo[] | null
  onClear: () => void
}

export default function InfoBar({ selected, onClear }: Props) {
  if (!selected || selected.length === 0) return null

  // Collect all unique property keys to form table columns (excluding internal '_' keys)
  const allKeys = new Set<string>()
  selected.forEach(sel => {
    Object.keys(sel.properties).forEach(k => {
      if (!k.startsWith('_')) allKeys.add(k)
    })
  })

  // Limit columns to top 15 so table doesn't get wildly wide
  const cols = Array.from(allKeys).slice(0, 15)

  const exportCsv = useCallback(() => {
    if (!selected || selected.length === 0) return
    const colsList = Array.from(allKeys)
    
    let csv = 'Layer Type,' + colsList.map(c => `"${c}"`).join(',') + '\n'
    
    selected.forEach(sel => {
      const props = sel.properties as Record<string, unknown>
      const layerLabel = LAYER_LABELS[sel.layer] ?? sel.layer
      const row = [`"${layerLabel}"`]
      colsList.forEach(c => {
        let val = props[c]
        if (val === null || val === undefined || val === '') val = ''
        row.push(`"${String(val).replace(/"/g, '""')}"`)
      })
      csv += row.join(',') + '\n'
    })
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'corridors_selection.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [selected, allKeys])

  return (
    <div className="info-bar info-bar-tall" role="region" aria-label="Feature info">
      <div className="info-bar-header" style={{ justifyContent: 'space-between', padding: '8px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="info-badge">Selection ({selected.length})</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="clear-selection-btn" onClick={exportCsv} style={{ background: 'rgba(77, 166, 255, 0.2)', borderColor: 'rgba(77, 166, 255, 0.4)' }}>Export CSV</button>
          <button className="clear-selection-btn" onClick={onClear}>Clear Selection</button>
        </div>
      </div>

      <div className="info-bar-scroll info-table-container">
        <table className="info-table">
          <thead>
            <tr>
              <th>Layer Type</th>
              {cols.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {selected.map((sel, idx) => {
              const props = sel.properties as Record<string, unknown>
              const layerLabel = LAYER_LABELS[sel.layer] ?? sel.layer
              return (
                <tr key={idx}>
                  <td>{layerLabel}</td>
                  {cols.map(c => (
                    <td key={c}>{formatVal(props[c])}</td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
