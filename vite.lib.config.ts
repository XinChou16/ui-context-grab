import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/lib/index.ts'),
        client: resolve(__dirname, 'src/client/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'mjs' : 'cjs'
        return `${entryName}.${ext}`
      },
    },
    rollupOptions: {
      external: ['vite', 'node:fs', 'node:path', 'node:url'],
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
})
