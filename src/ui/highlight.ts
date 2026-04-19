const OVERLAY_ID = '__ui_context_grab_highlight__'

let overlayEl: HTMLDivElement | null = null

function ensureOverlay(): HTMLDivElement {
  if (overlayEl && document.body.contains(overlayEl)) {
    return overlayEl
  }

  const existing = document.getElementById(OVERLAY_ID)
  if (existing instanceof HTMLDivElement) {
    overlayEl = existing
    return overlayEl
  }

  const el = document.createElement('div')
  el.id = OVERLAY_ID
  el.style.position = 'fixed'
  el.style.pointerEvents = 'none'
  el.style.left = '0'
  el.style.top = '0'
  el.style.width = '0'
  el.style.height = '0'
  el.style.boxSizing = 'border-box'
  el.style.border = '1px solid #22c55e'
  el.style.background = 'rgba(34, 197, 94, 0.08)'
  el.style.borderRadius = '2px'
  el.style.zIndex = '2147483647'
  el.style.display = 'none'

  document.body.appendChild(el)
  overlayEl = el

  return overlayEl
}

export function highlightElement(target: Element): void {
  const overlay = ensureOverlay()
  const rect = target.getBoundingClientRect()

  overlay.style.left = `${rect.left}px`
  overlay.style.top = `${rect.top}px`
  overlay.style.width = `${rect.width}px`
  overlay.style.height = `${rect.height}px`
  overlay.style.display = rect.width > 0 && rect.height > 0 ? 'block' : 'none'
}

export function hideHighlight(): void {
  const overlay = ensureOverlay()
  overlay.style.display = 'none'
}
