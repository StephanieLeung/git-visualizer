/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /** Project root: contains dist/ (renderer build) and dist-electron/ (main.js, preload.mjs) */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Bridge exposed to the renderer by preload.ts
interface Window {
  API: import('./preload').Api
}
