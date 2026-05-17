import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { normalizePath } from 'vite'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const SOURCE_CLIENT_ENTRY = resolve(CURRENT_DIR, 'client/index.ts')
const DIST_CLIENT_ENTRY = resolve(CURRENT_DIR, 'client.mjs')

function getClientImportPath(): string {
  const entry = existsSync(SOURCE_CLIENT_ENTRY) ? SOURCE_CLIENT_ENTRY : DIST_CLIENT_ENTRY
  return `/@fs/${normalizePath(entry)}`
}

export interface UiContextGrabOptions {
  enabled?: boolean
}

export function uiContextGrab(options: UiContextGrabOptions = {}): Plugin {
  const enabled = options.enabled ?? true

  return {
    name: 'ui-context-grab',
    apply: 'serve',
    enforce: 'post',
    transformIndexHtml(html) {
      const clientImportPath = getClientImportPath()
      if (!enabled || html.includes(clientImportPath)) {
        return html
      }

      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: `import { init } from '${clientImportPath}';\ninit();`,
            injectTo: 'body',
          },
        ],
      }
    },
  }
}

export function visualPrompt(options: UiContextGrabOptions = {}): Plugin {
  return uiContextGrab(options)
}

export default uiContextGrab
