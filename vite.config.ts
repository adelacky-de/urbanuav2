/// <reference path="./vite-plugin-cesium.d.ts" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
  server: {
    proxy: {
      // All /api/* requests go to backend; covers /2d-corridors, /3d-network, /3dtiles/* (tileset + child tiles)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
