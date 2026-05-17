# UI Context Grab

`ui-context-grab` 是一个面向前端调试场景的 Vite 插件。它会在开发环境中向页面注入一个浮动触发器，帮助开发者快速采集当前元素的 DOM、组件和样式上下文，减少在 DevTools 中反复定位的时间。

本仓库同时包含插件实现和一个本地 demo，用于验证采集流程与 UI 行为。

## 项目定位

这个项目解决的是“我已经看到问题元素，但还不知道它来自哪个组件、命中了哪些样式、对应什么 DOM 路径”的场景。

核心思路是：

1. 在 `serve` 阶段自动注入客户端脚本。
2. 在页面右下角放一个浮动按钮，作为采集开关。
3. 开启后监听 `mouseenter` 和 `click`，对目标元素做高亮和上下文采集。
4. 把采集结果输出到控制台，或通过浮层复制出来。

## 技术栈

- Vite 8
- Vue 3
- TypeScript
- pnpm

## 已实现能力

- 仅在开发环境注入客户端脚本，构建产物不注入。
- 页面右下角浮动按钮，用于开启和关闭采集模式。
- 使用 `mouseenter` 做高亮，不依赖 `mousemove`。
- 点击元素后收集上下文并输出日志。
- 兼容 Vue 3 和 Vue 2 风格运行时信息。
- Vue 3 开发环境下通过 `vite-plugin-vue-inspector` 和 `element-source` 展示组件行列信息。
- 尝试优先返回用户代码对应的组件文件路径，避开 `node_modules`。
- 采集项包括：
  - `file`
  - `sourceLocation`
  - `lineNumber`
  - `columnNumber`
  - `componentName`
  - `componentStack`
  - `tag`
  - `id`
  - `classList`
  - `htmlSnippet`
  - `selectorPath`
  - `domPath`
  - `cssRuleMatches`

## 采集流程

1. 运行开发服务并打开页面。
2. 点击右下角按钮，进入采集模式。
3. 鼠标悬停到目标元素上，页面会显示高亮框。
4. 点击目标元素后，控制台会输出 `[ui-context-grab]` 采集结果。
5. 再次点击按钮可退出采集模式并清理高亮。

## 控制台输出示例

```ts
{
  componentName: "ExampleCard",
  componentStack: ["ExampleCard", "HomePage"],
  file: "/src/components/ExampleCard.vue",
  sourceLocation: "/src/components/ExampleCard.vue:12:5",
  lineNumber: 12,
  columnNumber: 5,
  tag: "button",
  id: null,
  classList: ["btn", "btn-primary"],
  htmlSnippet: "<button class=\"btn btn-primary\">Save</button>",
  selectorPath: "div#app > main.page > button.btn.btn-primary:nth-of-type(1)",
  domPath: "html > body > div#app > main.page > button.btn.btn-primary",
  cssRuleMatches: [
    { selector: ".btn", source: "http://localhost:5173/src/style.css" },
    { selector: ".btn-primary", source: "inline <style>" }
  ]
}
```

## 目录结构

```text
src/
  lib/index.ts            # 插件对外导出入口
  vite.ts                 # Vite 插件实现与 HTML 注入逻辑
  client/index.ts         # 客户端运行时入口
  client/init.ts          # 采集状态机与事件处理
  ui/highlight.ts         # 元素高亮框
  ui/floating-trigger.ts  # 右下角浮动按钮
  ui/selection-popover.ts # 元素采集后的信息浮层
  adapters/vue.ts         # Vue 组件上下文提取
```

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务：

```bash
pnpm dev
```

构建库产物：

```bash
pnpm build
```

构建 demo：

```bash
pnpm build:demo
```

demo 构建产物会输出到 `dist-demo/`，避免覆盖用于 npm 发布的 `dist/` 库产物。

预览 demo 构建结果：

```bash
pnpm preview
```

## Examples

仓库提供了一个 Vue + Vite 接入示例：

```bash
pnpm example:vue
```

示例位于 `examples/vue-vite`。它在代码中使用真实包名导入插件：

```ts
import uiContextGrab from 'ui-context-grab'
```

为了让示例配置可以直接复制到外部项目，`vite.config.ts` 保留真实包名导入。示例中同时展示了通过 `resolve.alias` 将 `ui-context-grab` 指向本地源码的写法：

```ts
resolve: {
  alias: {
    'ui-context-grab': fileURLToPath(new URL('../../src/lib/index.ts', import.meta.url)),
  },
}
```

由于 Vite 的 `resolve.alias` 在配置文件加载完成后才生效，仓库内的 `pnpm example:vue` 会先构建本地包再启动示例。复制到外部项目时，保留 `import uiContextGrab from 'ui-context-grab'`，安装包后移除这段本地源码 alias，并使用普通的 `vite` 启动命令即可。

## 在当前项目中接入

在 `vite.config.ts` 中注册插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import uiContextGrab from './src/lib'

export default defineConfig({
  plugins: [vue(), uiContextGrab()],
})
```

可选参数：

```ts
uiContextGrab({ enabled: true })
```

`enabled` 默认为 `true`，如果设置为 `false`，插件不会注入客户端脚本。

## 外部项目接入

### 安装

```bash
pnpm add -D ui-context-grab
```

也可以使用 npm 或 yarn：

```bash
npm install -D ui-context-grab
yarn add -D ui-context-grab
```

本地联调时：

```bash
pnpm build
pnpm link --global

# 在目标项目中
pnpm link --global ui-context-grab
```

### 在 Vite 项目中使用

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import uiContextGrab from 'ui-context-grab'

export default defineConfig({
  plugins: [vue(), uiContextGrab()],
})
```

### 配置项

```ts
uiContextGrab({
  enabled: true,
  vueInspector: true,
})
```

- `enabled`: 是否注入客户端脚本，默认 `true`。
- `vueInspector`: 是否启用内置 `vite-plugin-vue-inspector` source 标记，默认启用。传 `false` 可关闭，也可以传入 `vite-plugin-vue-inspector` 的部分配置。

也可以通过子路径导入客户端入口，用于手动初始化或自定义注入场景：

```ts
import { init } from 'ui-context-grab/client'
```

## 打包产物

执行 `pnpm build` 后会输出到 `dist/`：

- `dist/index.mjs`
- `dist/index.cjs`
- `dist/client.mjs`
- `dist/client.cjs`
- 对应的 `d.ts` 类型声明

`package.json` 已配置 `exports`，支持：

- `ui-context-grab`
- `ui-context-grab/client`

## 发布前检查

发布到 npm 前建议依次执行：

```bash
pnpm install
pnpm check:registry
pnpm build
pnpm build:demo
pnpm pack:dry
```

如果本机 npm cache 有权限问题，可以临时指定 cache 目录：

```bash
npm_config_cache=/private/tmp/npm-cache npm pack --dry-run
```

`pnpm check:registry` 会要求当前 npm registry 是官方源 `https://registry.npmjs.org/`，避免误发到镜像或私有源。

首次公开发布：

```bash
npm login
pnpm publish:alpha
```

发布 alpha 版本使用 `pnpm publish:alpha`，会通过 `scripts/publish.sh alpha` 检查官方 registry 和干净工作区，然后执行 `npm version prerelease --preid alpha`，再发布到 npm 的 `alpha` dist-tag。发布正式版本使用 `pnpm publish:latest`，会执行同样检查，然后 `npm version patch` 并发布到默认 `latest` dist-tag。

发布后可通过以下命令确认 registry 信息：

```bash
npm view ui-context-grab
```

## 已知限制

- 目前默认只输出到 `console`，还没有提供 `onCollect` 回调扩展点。
- `cssRuleMatches` 读取跨域样式表时会受浏览器同源策略限制，读取失败会自动跳过。
- `selectorPath` 和 `domPath` 主要用于调试，不保证在复杂 DOM 变更后长期稳定。
- 插件仅在开发环境生效，不会注入生产构建。

## 排错指南

- 如果出现 `Failed to resolve module specifier`：
  - 确认开发环境中可访问插件注入的脚本路径。
  - 检查 Vite dev server 是否正常运行。
- 如果点击元素没有输出：
  - 确认已经先点击右下角按钮进入激活状态。
  - 确认是在 `pnpm dev` 的开发模式下运行。
- 如果 `file` 显示为 `null`：
  - 目标元素可能不是 Vue 组件管理的 DOM。
  - 或者运行时实例不可达，无法提取组件文件路径。

## 进一步说明

当前实现的重点是“快速拿到上下文”，而不是做完整的 UI Inspector。后续如果需要，还可以继续扩展：

- 采集更多元信息，例如 props、setup state 或事件绑定信息。
- 增加 `onCollect` 回调，便于接入自定义日志系统。
- 将控制台日志替换为更完整的侧边浮层展示。
