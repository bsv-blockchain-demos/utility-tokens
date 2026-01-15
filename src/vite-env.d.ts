/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OVERLAY_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
