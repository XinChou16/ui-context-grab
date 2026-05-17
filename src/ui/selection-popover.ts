const POPOVER_ID = '__ui_context_grab_popover__'
const GUTTER = 8

const POPOVER_STYLE = `
position: fixed;
width: 320px;
max-width: min(320px, calc(100vw - 16px));
padding: 12px;
border-radius: 10px;
background: #0b1220;
color: #e2e8f0;
border: 1px solid rgba(148, 163, 184, 0.25);
box-shadow: 0 12px 28px rgba(2, 6, 23, 0.45);
z-index: 2147483647;
font-size: 12px;
line-height: 1.45;
display: none;
`

const TITLE_STYLE = 'font-size: 12px; font-weight: 700; margin-bottom: 8px; color: #f8fafc;'
const ROW_STYLE = 'margin-bottom: 6px; word-break: break-all;'
const LABEL_STYLE = 'color: #93c5fd; margin-right: 6px;'
const INPUT_STYLE = `
width: 100%;
border: 1px solid rgba(148, 163, 184, 0.35);
background: #111827;
color: #f8fafc;
outline: none;
padding: 8px;
border-radius: 6px;
font-size: 12px;
box-sizing: border-box;
margin-top: 4px;
`
const FOOTER_STYLE = 'margin-top: 10px; display: flex; justify-content: flex-end;'
const COPY_BUTTON_STYLE = `
background: #22c55e;
color: #052e16;
border: none;
padding: 6px 10px;
border-radius: 6px;
font-size: 12px;
font-weight: 700;
cursor: pointer;
`

export interface SelectionPopoverPayload {
  componentName: string | null
  componentStack: string[]
  file: string | null
  lineNumber: number | null
  columnNumber: number | null
  sourceLocation: string | null
  selectorPath: string
  domPath: string
}

export interface SelectionPopover {
  containsTarget(target: EventTarget | null): boolean
  show(targetRect: DOMRect, payload: SelectionPopoverPayload, clearComment: boolean): void
  hide(): void
}

interface PopoverState {
  payload: SelectionPopoverPayload
  comment: string
}

function toCopyText(state: PopoverState): string {
  return [
    `componentName: ${state.payload.componentName ?? ''}`,
    `componentStack: ${state.payload.componentStack.join(' > ')}`,
    `file: ${state.payload.file ?? ''}`,
    `sourceLocation: ${state.payload.sourceLocation ?? ''}`,
    `comment: ${state.comment}`,
    `selectorPath: ${state.payload.selectorPath}`,
    `domPath: ${state.payload.domPath}`,
  ].join('\n')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function computePosition(targetRect: DOMRect, popoverRect: DOMRect): { left: number; top: number } {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = targetRect.right + GUTTER
  if (left + popoverRect.width > viewportWidth - GUTTER) {
    left = targetRect.left - popoverRect.width - GUTTER
  }
  left = clamp(left, GUTTER, Math.max(GUTTER, viewportWidth - popoverRect.width - GUTTER))

  let top = targetRect.top - popoverRect.height - GUTTER
  if (top < GUTTER) {
    top = targetRect.bottom + GUTTER
  }
  top = clamp(top, GUTTER, Math.max(GUTTER, viewportHeight - popoverRect.height - GUTTER))

  return { left, top }
}

export function createSelectionPopover(onCopySuccess?: () => void): SelectionPopover {
  let root = document.getElementById(POPOVER_ID) as HTMLDivElement | null
  if (!root) {
    root = document.createElement('div')
    root.id = POPOVER_ID
    root.style.cssText = POPOVER_STYLE
    document.body.appendChild(root)
  }

  const title = document.createElement('div')
  title.style.cssText = TITLE_STYLE
  title.textContent = 'UI Context Grab'

  const componentRow = document.createElement('div')
  componentRow.style.cssText = ROW_STYLE
  const componentLabel = document.createElement('span')
  componentLabel.style.cssText = LABEL_STYLE
  componentLabel.textContent = 'componentName:'
  const componentValue = document.createElement('span')
  componentRow.appendChild(componentLabel)
  componentRow.appendChild(componentValue)

  const fileRow = document.createElement('div')
  fileRow.style.cssText = ROW_STYLE
  const fileLabel = document.createElement('span')
  fileLabel.style.cssText = LABEL_STYLE
  fileLabel.textContent = 'file:'
  const fileValue = document.createElement('span')
  fileRow.appendChild(fileLabel)
  fileRow.appendChild(fileValue)

  const sourceLocationRow = document.createElement('div')
  sourceLocationRow.style.cssText = ROW_STYLE
  const sourceLocationLabel = document.createElement('span')
  sourceLocationLabel.style.cssText = LABEL_STYLE
  sourceLocationLabel.textContent = 'sourceLocation:'
  const sourceLocationValue = document.createElement('span')
  sourceLocationRow.appendChild(sourceLocationLabel)
  sourceLocationRow.appendChild(sourceLocationValue)

  const stackRow = document.createElement('div')
  stackRow.style.cssText = ROW_STYLE
  const stackLabel = document.createElement('span')
  stackLabel.style.cssText = LABEL_STYLE
  stackLabel.textContent = 'componentStack:'
  const stackValue = document.createElement('span')
  stackRow.appendChild(stackLabel)
  stackRow.appendChild(stackValue)

  const selectorRow = document.createElement('div')
  selectorRow.style.cssText = ROW_STYLE
  const selectorLabel = document.createElement('span')
  selectorLabel.style.cssText = LABEL_STYLE
  selectorLabel.textContent = 'selectorPath:'
  const selectorValue = document.createElement('span')
  selectorRow.appendChild(selectorLabel)
  selectorRow.appendChild(selectorValue)

  const domPathRow = document.createElement('div')
  domPathRow.style.cssText = ROW_STYLE
  const domPathLabel = document.createElement('span')
  domPathLabel.style.cssText = LABEL_STYLE
  domPathLabel.textContent = 'domPath:'
  const domPathValue = document.createElement('span')
  domPathRow.appendChild(domPathLabel)
  domPathRow.appendChild(domPathValue)

  const commentLabel = document.createElement('label')
  commentLabel.textContent = 'comment'
  commentLabel.style.cssText = LABEL_STYLE
  const commentInput = document.createElement('input')
  commentInput.type = 'text'
  commentInput.placeholder = 'Add note...'
  commentInput.style.cssText = INPUT_STYLE
  commentLabel.appendChild(commentInput)

  const footer = document.createElement('div')
  footer.style.cssText = FOOTER_STYLE
  const copyButton = document.createElement('button')
  copyButton.type = 'button'
  copyButton.style.cssText = COPY_BUTTON_STYLE
  copyButton.textContent = 'Copy'
  footer.appendChild(copyButton)

  root.replaceChildren(
    title,
    componentRow,
    stackRow,
    fileRow,
    sourceLocationRow,
    selectorRow,
    domPathRow,
    commentLabel,
    footer,
  )

  let state: PopoverState = {
    payload: {
      componentName: null,
      componentStack: [],
      file: null,
      lineNumber: null,
      columnNumber: null,
      sourceLocation: null,
      selectorPath: '',
      domPath: '',
    },
    comment: '',
  }
  let copyTimer = 0

  commentInput.oninput = () => {
    state.comment = commentInput.value
  }

  copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(toCopyText(state))
      root.style.display = 'none'
      copyButton.textContent = 'Copy'
      onCopySuccess?.()
    } catch {
      copyButton.textContent = 'Copy Failed'
      if (copyTimer) {
        window.clearTimeout(copyTimer)
      }
      copyTimer = window.setTimeout(() => {
        copyButton.textContent = 'Copy'
      }, 1400)
    }
  }

  return {
    containsTarget(target: EventTarget | null): boolean {
      return target instanceof Node ? root.contains(target) : false
    },
    show(targetRect: DOMRect, payload: SelectionPopoverPayload, clearComment: boolean): void {
      state.payload = payload
      if (clearComment) {
        state.comment = ''
        commentInput.value = ''
      }

      componentValue.textContent = payload.componentName ?? ''
      stackValue.textContent = payload.componentStack.join(' > ')
      fileValue.textContent = payload.file ?? ''
      sourceLocationValue.textContent = payload.sourceLocation ?? ''
      selectorValue.textContent = payload.selectorPath
      domPathValue.textContent = payload.domPath

      root.style.display = 'block'
      const popoverRect = root.getBoundingClientRect()
      const pos = computePosition(targetRect, popoverRect)
      root.style.left = `${pos.left}px`
      root.style.top = `${pos.top}px`
    },
    hide(): void {
      root.style.display = 'none'
    },
  }
}
