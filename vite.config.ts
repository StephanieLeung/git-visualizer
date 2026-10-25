import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Builds electron/ into dist-electron/ and launches Electron alongside the dev server
    electron({
      main: {
        entry: 'electron/main.ts'
      },
      preload: {
        // Preload scripts may contain web assets, so use rollupOptions.input instead of lib.entry
        input: path.join(__dirname, 'electron/preload.ts')
      },
      // Polyfills Electron/Node APIs in the renderer; disabled under test, see
      // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
      renderer: process.env.NODE_ENV === 'test' ? undefined : {}
    })
  ]
})
