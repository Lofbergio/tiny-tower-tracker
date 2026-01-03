/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_OCR_DEV_TOOLS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
