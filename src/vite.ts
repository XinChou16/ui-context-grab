import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Inspector from 'vite-plugin-vue-inspector'
import type { Plugin, PluginOption } from 'vite'
import { normalizePath } from 'vite'
import type { VitePluginInspectorOptions } from 'vite-plugin-vue-inspector'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const SOURCE_CLIENT_ENTRY = resolve(CURRENT_DIR, 'client/index.ts')
const DIST_CLIENT_ENTRY = resolve(CURRENT_DIR, 'client.mjs')

function getClientImportPath(): string {
  const entry = existsSync(SOURCE_CLIENT_ENTRY) ? SOURCE_CLIENT_ENTRY : DIST_CLIENT_ENTRY
  return `/@fs/${normalizePath(entry)}`
}

export interface UiContextGrabOptions {
  enabled?: boolean
  vueInspector?: boolean | Partial<VitePluginInspectorOptions>
}

function createVueInspectorPlugin(
  options: UiContextGrabOptions['vueInspector'],
): PluginOption[] {
  if (options === false) {
    return []
  }

  return [
    Inspector({
      vue: 3,
      enabled: false,
      toggleButtonVisibility: 'never',
      toggleComboKey: false,
      cleanHtml: false,
      ...(typeof options === 'object' ? options : {}),
    }),
  ]
}

function createUiContextGrabClientPlugin(enabled: boolean): Plugin {
  return {
    name: 'ui-context-grab:client',
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

export function uiContextGrab(options: UiContextGrabOptions = {}): PluginOption[] {
  const enabled = options.enabled ?? true

  return [
    ...createVueInspectorPlugin(options.vueInspector),
    createUiContextGrabClientPlugin(enabled),
  ]
}

export function visualPrompt(options: UiContextGrabOptions = {}): PluginOption[] {
  return uiContextGrab(options)
}

export default uiContextGrab
