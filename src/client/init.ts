import { getVueComponentContext } from '../adapters/vue'
import { hideHighlight, highlightElement } from '../ui/highlight'
import { createFloatingTrigger } from '../ui/floating-trigger'
import { createSelectionPopover } from '../ui/selection-popover'

const INIT_FLAG = '__ui_context_grab_initialized__'
const LOG_PREFIX = '[ui-context-grab]'
const CLASS_LIMIT = 10
const HTML_SNIPPET_LIMIT = 600
const PATH_DEPTH_LIMIT = 8
const CSS_RULE_MATCH_LIMIT = 20

type WindowWithUiContextGrab = Window & {
  [INIT_FLAG]?: boolean
}

interface CollectedContext {
  componentName: string | null
  componentStack: string[]
  file: string | null
  lineNumber: number | null
  columnNumber: number | null
  sourceLocation: string | null
  sourceStack: Array<{
    filePath: string
    lineNumber: number | null
    columnNumber: number | null
    componentName: string | null
  }>
  tag: string
  id: string | null
  classList: string[]
  htmlSnippet: string
  selectorPath: string
  domPath: string
  cssRuleMatches: CssRuleMatch[]
}

interface CssRuleMatch {
  selector: string
  source: string
}

let active = false
let trigger: ReturnType<typeof createFloatingTrigger> | null = null
let popover: ReturnType<typeof createSelectionPopover> | null = null
let lastSelectedElement: Element | null = null

function toClassList(element: Element): string[] {
  return Array.from(element.classList).slice(0, CLASS_LIMIT)
}

function toHtmlSnippet(element: Element): string {
  const html = element.outerHTML || ''
  return html.length > HTML_SNIPPET_LIMIT ? `${html.slice(0, HTML_SNIPPET_LIMIT)}...` : html
}

function escapeForSelector(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
}

function toSelectorSegment(element: Element): string {
  const tag = element.tagName.toLowerCase()

  if (element.id) {
    return `${tag}#${escapeForSelector(element.id)}`
  }

  const classPart = Array.from(element.classList)
    .slice(0, 2)
    .map((cls) => `.${escapeForSelector(cls)}`)
    .join('')

  const parent = element.parentElement
  if (!parent) {
    return `${tag}${classPart}`
  }

  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName.toLowerCase() === tag,
  )
  const nth = siblings.indexOf(element) + 1

  return `${tag}${classPart}:nth-of-type(${Math.max(1, nth)})`
}

function toSelectorPath(element: Element): string {
  const parts: string[] = []
  let cursor: Element | null = element
  let depth = 0

  while (cursor && depth < PATH_DEPTH_LIMIT) {
    parts.unshift(toSelectorSegment(cursor))
    if (cursor.id) {
      break
    }
    cursor = cursor.parentElement
    depth += 1
  }

  return parts.join(' > ')
}

function toDomPath(element: Element): string {
  const parts: string[] = []
  let cursor: Element | null = element
  let depth = 0

  while (cursor && depth < PATH_DEPTH_LIMIT) {
    const tag = cursor.tagName.toLowerCase()
    const idPart = cursor.id ? `#${cursor.id}` : ''
    const classPart = cursor.classList.length > 0 ? `.${Array.from(cursor.classList).slice(0, 2).join('.')}` : ''
    parts.unshift(`${tag}${idPart}${classPart}`)
    cursor = cursor.parentElement
    depth += 1
  }

  return parts.join(' > ')
}

function collectMatchesFromRule(
  element: Element,
  rule: CSSRule,
  source: string,
  bucket: CssRuleMatch[],
): void {
  if (bucket.length >= CSS_RULE_MATCH_LIMIT) {
    return
  }

  if (rule instanceof CSSStyleRule) {
    if (element.matches(rule.selectorText)) {
      bucket.push({ selector: rule.selectorText, source })
    }
    return
  }

  if (rule instanceof CSSMediaRule || rule instanceof CSSSupportsRule) {
    for (const nested of Array.from(rule.cssRules)) {
      collectMatchesFromRule(element, nested, source, bucket)
      if (bucket.length >= CSS_RULE_MATCH_LIMIT) {
        return
      }
    }
  }
}

function toCssRuleMatches(element: Element): CssRuleMatch[] {
  const matches: CssRuleMatch[] = []

  for (const sheet of Array.from(document.styleSheets)) {
    if (matches.length >= CSS_RULE_MATCH_LIMIT) {
      break
    }

    let cssRules: CSSRuleList
    try {
      cssRules = sheet.cssRules
    } catch {
      continue
    }

    const ownerNode = sheet.ownerNode
    const source =
      sheet.href ||
      (ownerNode instanceof Element && ownerNode.tagName.toLowerCase() === 'style'
        ? 'inline <style>'
        : 'unknown stylesheet')

    for (const rule of Array.from(cssRules)) {
      collectMatchesFromRule(element, rule, source, matches)
      if (matches.length >= CSS_RULE_MATCH_LIMIT) {
        break
      }
    }
  }

  return matches
}

async function toCollectedContext(element: Element): Promise<CollectedContext> {
  const componentContext = await getVueComponentContext(element)
  return {
    componentName: componentContext.componentName,
    componentStack: componentContext.componentStack,
    file: componentContext.file,
    lineNumber: componentContext.lineNumber,
    columnNumber: componentContext.columnNumber,
    sourceLocation: componentContext.sourceLocation,
    sourceStack: componentContext.sourceStack,
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classList: toClassList(element),
    htmlSnippet: toHtmlSnippet(element),
    selectorPath: toSelectorPath(element),
    domPath: toDomPath(element),
    cssRuleMatches: toCssRuleMatches(element),
  }
}

function handleMouseEnter(event: Event): void {
  if (!active) {
    return
  }

  const target = event.target
  if (!(target instanceof Element)) {
    hideHighlight()
    return
  }

  if (trigger?.containsTarget(target)) {
    hideHighlight()
    return
  }

  if (popover?.containsTarget(target)) {
    return
  }

  highlightElement(target)
}

async function handleClick(event: MouseEvent): Promise<void> {
  if (!active) {
    return
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  if (trigger?.containsTarget(target)) {
    return
  }

  if (popover?.containsTarget(target)) {
    return
  }

  const anchor = target.closest('a[href]')
  if (anchor) {
    event.preventDefault()
  }

  highlightElement(target)
  const context = await toCollectedContext(target)
  console.log(LOG_PREFIX, context)

  const clearComment = lastSelectedElement !== target
  popover?.show(target.getBoundingClientRect(), {
    componentName: context.componentName,
    componentStack: context.componentStack,
    file: context.file,
    lineNumber: context.lineNumber,
    columnNumber: context.columnNumber,
    sourceLocation: context.sourceLocation,
    selectorPath: context.selectorPath,
    domPath: context.domPath,
  }, clearComment)
  lastSelectedElement = target
}

function handleMouseLeave(): void {
  hideHighlight()
}

function handleKeyDown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase()
  const isToggleShortcut = event.shiftKey && key === 'c'
  if (isToggleShortcut) {
    event.preventDefault()
    setActive(!active)
    return
  }

  if (key === 'escape' && active) {
    event.preventDefault()
    setActive(false)
  }
}

function setActive(nextActive: boolean): void {
  active = nextActive
  trigger?.setActive(active)

  if (active) {
    document.addEventListener('mouseenter', handleMouseEnter, { capture: true, passive: true })
    document.addEventListener('click', handleClick, { capture: true })
    document.addEventListener('mouseleave', handleMouseLeave, { passive: true })
    return
  }

  document.removeEventListener('mouseenter', handleMouseEnter, { capture: true })
  document.removeEventListener('click', handleClick, { capture: true })
  document.removeEventListener('mouseleave', handleMouseLeave)
  lastSelectedElement = null
  hideHighlight()
  popover?.hide()
}

export function init(): void {
  const windowWithFlag = window as WindowWithUiContextGrab
  if (windowWithFlag[INIT_FLAG]) {
    return
  }

  windowWithFlag[INIT_FLAG] = true
  trigger = createFloatingTrigger(setActive)
  popover = createSelectionPopover(() => setActive(false))
  document.addEventListener('keydown', handleKeyDown)
}
