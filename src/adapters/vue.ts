import { vueResolver } from 'element-source'
import type { ElementSourceInfo } from 'element-source'

type UnknownRecord = Record<string, unknown>

interface VueLikeInternalInstance {
  parent?: VueLikeInternalInstance | null
  type?: {
    __file?: string
    __name?: string
    name?: string
  } | null
  props?: UnknownRecord
  setupState?: UnknownRecord
}

interface Vue2LikeInstance {
  $parent?: Vue2LikeInstance | null
  $options?: {
    __file?: string
    name?: string
  } | null
  $props?: UnknownRecord
  _setupState?: UnknownRecord
}

export interface VueComponentContext {
  file: string | null
  lineNumber: number | null
  columnNumber: number | null
  sourceLocation: string | null
  componentName: string | null
  componentStack: string[]
  sourceStack: ElementSourceInfo[]
  props: UnknownRecord | null
  setupState: UnknownRecord | null
}

function isUserCodeFile(filePath: string): boolean {
  return !filePath.includes('/node_modules/')
}

function getFileFromVue3Instance(instance: VueLikeInternalInstance): string | null {
  return typeof instance.type?.__file === 'string' ? instance.type.__file : null
}

function getNameFromVue3Instance(instance: VueLikeInternalInstance): string | null {
  if (typeof instance.type?.name === 'string' && instance.type.name.length > 0) {
    return instance.type.name
  }
  if (typeof instance.type?.__name === 'string' && instance.type.__name.length > 0) {
    return instance.type.__name
  }
  return null
}

function getFileFromVue2Instance(instance: Vue2LikeInstance): string | null {
  return typeof instance.$options?.__file === 'string' ? instance.$options.__file : null
}

function getNameFromVue2Instance(instance: Vue2LikeInstance): string | null {
  return typeof instance.$options?.name === 'string' && instance.$options.name.length > 0
    ? instance.$options.name
    : null
}

function getVue3Instance(element: Element): VueLikeInternalInstance | null {
  const withVue = element as Element & {
    __vueParentComponent?: VueLikeInternalInstance
  }
  return withVue.__vueParentComponent ?? null
}

function getVue2Instance(element: Element): Vue2LikeInstance | null {
  const withVue = element as Element & {
    __vue__?: Vue2LikeInstance
  }
  return withVue.__vue__ ?? null
}

function basenameFromFile(filePath: string | null): string | null {
  if (!filePath) {
    return null
  }
  const normalized = filePath.replace(/\\/g, '/')
  const last = normalized.split('/').pop()
  if (!last) {
    return null
  }
  return last.replace(/\.[^.]+$/, '') || null
}

function toDisplayName(name: string | null, filePath: string | null): string | null {
  if (name && name.length > 0) {
    return name
  }
  return basenameFromFile(filePath)
}

function pushStackName(stack: string[], name: string | null, filePath: string | null): void {
  const displayName = toDisplayName(name, filePath)
  if (!displayName) {
    return
  }
  stack.push(displayName)
}

function createEmptyContext(): VueComponentContext {
  return {
    file: null,
    lineNumber: null,
    columnNumber: null,
    sourceLocation: null,
    componentName: null,
    componentStack: [],
    sourceStack: [],
    props: null,
    setupState: null,
  }
}

function toSourceLocation(
  filePath: string | null,
  lineNumber: number | null,
  columnNumber: number | null,
): string | null {
  if (!filePath) {
    return null
  }
  if (lineNumber === null || columnNumber === null) {
    return filePath
  }
  return `${filePath}:${lineNumber}:${columnNumber}`
}

function toSourceComponentStack(sourceStack: ElementSourceInfo[]): string[] {
  const stack = sourceStack
    .map((frame) => frame.componentName ?? basenameFromFile(frame.filePath))
    .filter((name): name is string => Boolean(name))

  return stack.length > 0 ? stack : []
}

function applySourceInfo(
  context: VueComponentContext,
  sourceStack: ElementSourceInfo[],
): VueComponentContext {
  const source = sourceStack[0] ?? null
  const sourceComponentStack = toSourceComponentStack(sourceStack)

  return {
    ...context,
    file: source?.filePath ?? context.file,
    lineNumber: source?.lineNumber ?? null,
    columnNumber: source?.columnNumber ?? null,
    sourceLocation: toSourceLocation(
      source?.filePath ?? context.file,
      source?.lineNumber ?? null,
      source?.columnNumber ?? null,
    ),
    componentName: source?.componentName ?? context.componentName,
    componentStack:
      sourceComponentStack.length > 0 ? sourceComponentStack : context.componentStack,
    sourceStack,
  }
}

async function getVueSourceStack(element: Element): Promise<ElementSourceInfo[]> {
  try {
    return await vueResolver.resolveStack(element)
  } catch {
    return []
  }
}

function pickVue3Context(instance: VueLikeInternalInstance): VueComponentContext {
  let cursor: VueLikeInternalInstance | null | undefined = instance
  let fallback: VueComponentContext = {
    file: null,
    lineNumber: null,
    columnNumber: null,
    sourceLocation: null,
    componentName: null,
    componentStack: [],
    sourceStack: [],
    props: null,
    setupState: null,
  }
  const componentStack: string[] = []
  let picked: VueComponentContext | null = null

  while (cursor) {
    const file = getFileFromVue3Instance(cursor)
    const runtimeName = getNameFromVue3Instance(cursor)
    const componentName = toDisplayName(runtimeName, file)
    pushStackName(componentStack, runtimeName, file)

    if (fallback.componentName === null && componentName) {
      fallback.componentName = componentName
    }

    if (file) {
      const candidate: VueComponentContext = {
        file,
        lineNumber: null,
        columnNumber: null,
        sourceLocation: null,
        componentName,
        componentStack: [],
        sourceStack: [],
        props: cursor.props ?? null,
        setupState: cursor.setupState ?? null,
      }

      if (fallback.file === null) {
        fallback = candidate
      }

      if (picked === null || (isUserCodeFile(file) && !isUserCodeFile(picked.file ?? ''))) {
        picked = candidate
      }
    }

    cursor = cursor.parent
  }

  const selected = picked ?? fallback
  selected.componentStack = componentStack.length > 0 ? componentStack : ['Anonymous']
  return selected
}

function pickVue2Context(instance: Vue2LikeInstance): VueComponentContext {
  let cursor: Vue2LikeInstance | null | undefined = instance
  let fallback: VueComponentContext = {
    file: null,
    lineNumber: null,
    columnNumber: null,
    sourceLocation: null,
    componentName: null,
    componentStack: [],
    sourceStack: [],
    props: null,
    setupState: null,
  }
  const componentStack: string[] = []
  let picked: VueComponentContext | null = null

  while (cursor) {
    const file = getFileFromVue2Instance(cursor)
    const runtimeName = getNameFromVue2Instance(cursor)
    const componentName = toDisplayName(runtimeName, file)
    pushStackName(componentStack, runtimeName, file)

    if (fallback.componentName === null && componentName) {
      fallback.componentName = componentName
    }

    if (file) {
      const candidate: VueComponentContext = {
        file,
        lineNumber: null,
        columnNumber: null,
        sourceLocation: null,
        componentName,
        componentStack: [],
        sourceStack: [],
        props: cursor.$props ?? null,
        setupState: cursor._setupState ?? null,
      }

      if (fallback.file === null) {
        fallback = candidate
      }

      if (picked === null || (isUserCodeFile(file) && !isUserCodeFile(picked.file ?? ''))) {
        picked = candidate
      }
    }

    cursor = cursor.$parent
  }

  const selected = picked ?? fallback
  selected.componentStack = componentStack.length > 0 ? componentStack : ['Anonymous']
  return selected
}

function getFallbackVueComponentContext(element: Element): VueComponentContext {
  const vue3 = getVue3Instance(element)
  if (vue3) {
    return pickVue3Context(vue3)
  }

  const vue2 = getVue2Instance(element)
  if (vue2) {
    return pickVue2Context(vue2)
  }

  return createEmptyContext()
}

export async function getVueComponentContext(element: Element): Promise<VueComponentContext> {
  const fallback = getFallbackVueComponentContext(element)
  const sourceStack = await getVueSourceStack(element)
  if (sourceStack.length === 0) {
    return fallback
  }

  return applySourceInfo(fallback, sourceStack)
}
