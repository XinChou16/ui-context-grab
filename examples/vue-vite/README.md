# Vue Vite Example

This example shows how to integrate `ui-context-grab` in a Vue + Vite app.

The example imports the plugin by its package name:

```ts
import uiContextGrab from 'ui-context-grab'
```

For local development inside this repository, `vite.config.ts` aliases `ui-context-grab` to `../../src/lib/index.ts`. In an external project, install the package and remove the alias.

## Run

From the repository root:

```bash
pnpm example:vue
```

Open the dev server URL, click the floating button in the lower-right corner, hover elements to highlight them, and click a card or button to inspect the collected context in the browser console.
