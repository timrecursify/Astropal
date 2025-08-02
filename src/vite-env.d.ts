/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_ZAPIER_WEBHOOK_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
