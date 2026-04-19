需要新开发一个vite插件，核心实现，鼠标悬浮到 DOM 上，自动收集当前组件关联信息上下文

技术栈: TS Vite plugin

插件名: ui-context-grab

插件位置: src/lib/index.ts

相关技术要点实现限制:

  1. Hover 高亮边框 (src/ui/highlight.ts)

  创建一个 position:fixed + pointerEvents:none 的透明 div 覆盖层。鼠标移入时调用
   getBoundingClientRect() 获取目标元素坐标，将覆盖层的 left/top/width/height
  同步过去，视觉上形成高亮边框。pointerEvents:none 保证不拦截点击事件。

  ---
  2. Vue 组件文件信息读取 (src/adapters/vue.ts)

  从 DOM 元素上读取 Vue 内部挂载的 __vueParentComponent / __vue__
  属性，拿到组件实例后从 instance.type.__file 或 instance.$options.__file
  取得源文件路径。优先返回非 node_modules 的用户代码组件，同时收集 props 和
  setupState 作为上下文数据。

  ---
  3. Vite 插件注入 (src/vite.ts)

  通过 transformIndexHtml 钩子，在 HTML 的 </body> 前插入一段 <script 
  type="module">，内容是 import { init } from '{pkg-name}'; 