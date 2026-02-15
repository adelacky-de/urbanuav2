/** Map corner note: data sources, 3D tileset status. */
type TilesetState = 'idle' | 'loading' | 'loaded' | 'error'

type Props = {
  tilesetState: TilesetState
  tilesetError: string | null
}

export default function MapCornerNote({ tilesetState, tilesetError }: Props) {
  return (
    <div className="corner-note">
      <div>
        <strong>Sources:</strong>{' '}
        <code>/2d-corridors</code>, <code>/3d-network</code>, <code>/3dtiles/tileset.json</code>
      </div>
      <div className="note-muted">
        <strong>3D tileset:</strong> {tilesetState}
        {tilesetState === 'error' && tilesetError && (
          <span title={tilesetError}> — {tilesetError.slice(0, 40)}…</span>
        )}
      </div>
      <div className="note-muted">
        <strong>Color:</strong> 2D/3D by priorityID; 3D by corridor_type when set
      </div>
    </div>
  )
}
