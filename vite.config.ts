import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from 'vite-plugin-mkcert'
import uiContextGrab from './src/lib'

// https://vite.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist-demo',
  },
  plugins: [
    vue(),
    mkcert(),
    uiContextGrab(),
  ],
})
