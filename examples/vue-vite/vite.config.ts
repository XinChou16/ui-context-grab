import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import uiContextGrab from 'ui-context-grab'

const exampleRoot = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: exampleRoot,
  plugins: [vue(), uiContextGrab()],
  resolve: {
    alias: {
      'ui-context-grab': fileURLToPath(new URL('../../src/lib/index.ts', import.meta.url)),
    },
  },
})
