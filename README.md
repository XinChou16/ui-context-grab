# UI Context Grab (Vite Plugin Demo)

`ui-context-grab` 是一个面向前端调试场景的 Vite 插件。  
在开发环境中，它会向页面注入一个右下角触发按钮，帮助你在页面上快速定位 DOM、组件来源和命中样式规则。

## 项目介绍

本仓库是 `ui-context-grab` 的实现与演示工程，技术栈：

- Vite 8
- Vue 3
- TypeScript
- pnpm

插件核心目标：让开发者在“看到问题的页面元素”后，快速拿到足够上下文，减少手动在 DevTools 里反复查找的时间。

## 当前已实现功能

- 开发环境自动注入客户端脚本（`serve` 生效，`build` 不注入）。
- 页面右下角浮动 icon 按钮，点击后开启/关闭采集模式。
- 监听 `mouseenter` 进行目标高亮（不使用 `mousemove`）。
- 监听 `click` 执行采集并输出日志（hover 仅高亮，不打印）。
- Vue 组件上下文提取：
  - 优先读取 `__vueParentComponent`（Vue 3）；
  - 兼容 `__vue__`（Vue 2 风格）；
  - 优先返回非 `node_modules` 组件文件路径。
- 采集日志字段：
  - `file`, `tag`, `id`, `classList`
  - `htmlSnippet`
  - `selectorPath`
  - `domPath`
  - `cssRuleMatches`（命中的 CSS 规则来源与选择器）

## 采集交互说明

1. 启动开发服务并打开页面。
2. 点击页面右下角按钮，进入采集模式（按钮变为激活态）。
3. 鼠标悬浮元素时显示高亮框。
4. 点击目标元素，在控制台输出 `[ui-context-grab]` 采集结果。
5. 再次点击按钮退出采集模式并清理高亮。

## 日志结构示例

```ts
{
  file: "/src/components/ExampleCard.vue",
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

## 快速开始

```bash
pnpm install
pnpm dev
```

构建（库产物）与预览 demo：

```bash
pnpm build
pnpm build:demo
pnpm preview
```

## 在当前项目中的接入方式

在 `vite.config.ts` 中注册插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import uiContextGrab from './src/lib'

export default defineConfig({
  plugins: [vue(), uiContextGrab()],
})
```

## 发布与复用

仓库已支持插件产物打包，执行 `pnpm build` 后会输出：

- `dist/index.mjs` / `dist/index.cjs`（插件入口）
- `dist/client.mjs` / `dist/client.cjs`（客户端运行时）
- 对应 `d.ts` 类型声明

`package.json` 已配置 `exports` 子路径，可通过：

- `ui-context-grab`
- `ui-context-grab/client`

进行导入。

## 外部项目使用文档

### 1) 安装方式

方式 A：已发布到 npm/私有源后安装

```bash
pnpm add -D ui-context-grab
```

方式 B：本地联调安装（当前仓库）

```bash
# 在 ui-context-grab 仓库先执行一次
pnpm build
pnpm link --global

# 在你的目标项目执行
pnpm link --global ui-context-grab
```

### 2) 在 Vite 项目接入

在目标项目 `vite.config.ts` 注册插件：

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import uiContextGrab from 'ui-context-grab'

export default defineConfig({
  plugins: [vue(), uiContextGrab()],
})
```

可选参数：

```ts
uiContextGrab({ enabled: true })
```

### 3) 运行与触发

```bash
pnpm dev
```

- 插件仅在 dev server 下生效（`serve`）。
- 页面右下角按钮或 `Shift + C` 可开启/关闭采集。
- `Esc` 可关闭采集。
- 点击元素后弹出信息浮窗，支持 comment 和复制。

### 4) 复制内容格式

点击 Popover 的 `Copy` 后会复制：

```text
componentName: {componentName}
componentStack: {child > parent}
file: {filepath}
comment: {comment}
selectorPath: {selectorPath}
domPath: {domPath}
```

复制成功后会自动退出高亮采集模式。

## 已知限制

- 目前默认日志输出到 `console`，还未提供 `onCollect` 回调扩展点。
- `cssRuleMatches` 对跨域样式表受浏览器安全策略限制，无法读取时会自动跳过。
- `selectorPath`/`domPath` 是调试辅助路径，不保证在所有 DOM 变更后长期稳定。

## 目录结构（核心）

```text
src/
  lib/index.ts            # 插件导出入口
  vite.ts                 # Vite 插件实现与 HTML 注入
  client/init.ts          # 客户端采集状态机
  ui/highlight.ts         # 高亮框
  ui/floating-trigger.ts  # 右下角触发按钮
  adapters/vue.ts         # Vue 组件上下文提取
```

## 排错指南

- 报错 `Failed to resolve module specifier`：
  - 确认插件注入脚本路径可被 Vite dev server 访问（当前使用 `/@fs/...` 动态注入）。
- 点击元素没有输出：
  - 确认已先点击右下角按钮进入激活状态。
  - 确认在开发模式运行（`pnpm dev`）。
- `file` 为 `null`：
  - 目标节点可能不是 Vue 组件管理的 DOM，或运行时实例不可达。
