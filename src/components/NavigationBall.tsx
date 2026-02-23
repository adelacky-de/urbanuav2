/** PerspectiveButton: Bottom-right button to toggle between Top-Down and Oblique views. */
import { useState, type RefObject } from 'react'
import * as Cesium from 'cesium'

type Props = {
  viewerRef: RefObject<Cesium.Viewer | null>
}

export default function PerspectiveButton({ viewerRef }: Props) {
  const [isTopDown, setIsTopDown] = useState(false)

  const handleToggle = () => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    const newIsTopDown = !isTopDown
    setIsTopDown(newIsTopDown)

    viewer.scene.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(103.8198, 1.3521, newIsTopDown ? 40000 : 15000),
      orientation: {
        heading: 0, // default North-up
        pitch: Cesium.Math.toRadians(newIsTopDown ? -90 : -45),
        roll: 0,
      },
      duration: 1.5,
    })
  }

  return (
    <div className="perspective-btn-container" aria-label="Camera perspective">
      <button 
        className="perspective-btn" 
        onClick={handleToggle} 
        title={isTopDown ? "Switch to Oblique View" : "Switch to Top-Down View"}
      >
        <span className="perspective-icon">{isTopDown ? '🗺️' : '🏙️'}</span>
        <span className="perspective-label">{isTopDown ? 'Top-Down 2D' : 'Oblique 3D'}</span>
      </button>
    </div>
  )
}
