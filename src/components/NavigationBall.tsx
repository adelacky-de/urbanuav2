/** NavigationBall: Drag-to-rotate rolling ball widget (bottom-right). */
import { useState, useRef, type RefObject } from 'react'
import * as Cesium from 'cesium'

type Props = {
  viewerRef: RefObject<Cesium.Viewer | null>
}

export default function NavigationBall({ viewerRef }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const ballRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !lastPos.current) return
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }

    const speed = 0.005 // radians per pixel
    const camera = viewer.scene.camera

    if (Math.abs(dx) > 0) {
      camera.rotate(Cesium.Cartesian3.UNIT_Z, -dx * speed)
    }
    if (Math.abs(dy) > 0) {
      camera.lookUp(dy * speed)
    }

    if (ballRef.current) {
      const style = ballRef.current.style
      const curPx = parseFloat(style.getPropertyValue('--px') || '0')
      const curPy = parseFloat(style.getPropertyValue('--py') || '0')
      style.setProperty('--px', `${curPx + dx}px`)
      style.setProperty('--py', `${curPy + dy}px`)
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    lastPos.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  const handleReset = () => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return
    viewer.scene.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(103.8198, 1.3521, 25000),
      orientation: {
        heading: 0, // default North-up
        pitch: Cesium.Math.toRadians(-60),
        roll: 0,
      },
      duration: 1.5,
    })
    if (ballRef.current) {
      ballRef.current.style.setProperty('--px', '0px')
      ballRef.current.style.setProperty('--py', '0px')
    }
  }

  return (
    <div className="nav-ball-container" aria-label="Camera navigation">
      <div 
        ref={ballRef}
        className={`rolling-ball ${isDragging ? 'dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag to orbit camera"
      />
      <button className="nav-btn-reset" onClick={handleReset} title="Reset view">⌖</button>
    </div>
  )
}
