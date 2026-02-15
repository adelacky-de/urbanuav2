/// <reference types="vite/client" />

// Some Vite plugins ship without TypeScript types.
declare module 'vite-plugin-cesium' {
  import type { PluginOption } from 'vite'
  export default function cesium(): PluginOption
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CESIUM_ION_TOKEN?: string
  readonly VITE_ION_TILESET_ASSET_ID?: string
  readonly VITE_ION_TILESET_AUTO_ZOOM?: string
}


