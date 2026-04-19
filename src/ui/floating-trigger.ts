const TRIGGER_ID = '__ui_context_grab_trigger__'

const BASE_BUTTON_STYLE = `
position: fixed;
right: 16px;
bottom: 16px;
width: 44px;
height: 44px;
border-radius: 999px;
border: 1px solid rgba(15, 23, 42, 0.2);
background: #0f172a;
color: #f8fafc;
display: inline-flex;
align-items: center;
justify-content: center;
cursor: pointer;
z-index: 2147483647;
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
transition: background-color 120ms ease, transform 120ms ease;
`

const ACTIVE_BUTTON_STYLE = 'background: #15803d;'
const INACTIVE_BUTTON_STYLE = 'background: #0f172a;'

const ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
  <path d="M12 3V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M12 17V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M3 12H7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M17 12H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="12" cy="12" r="3.8" stroke="currentColor" stroke-width="1.8"/>
</svg>
`

export interface FloatingTrigger {
  containsTarget(target: EventTarget | null): boolean
  setActive(active: boolean): void
}

function ensureButton(): HTMLButtonElement {
  const existing = document.getElementById(TRIGGER_ID)
  if (existing instanceof HTMLButtonElement) {
    return existing
  }

  const button = document.createElement('button')
  button.id = TRIGGER_ID
  button.type = 'button'
  button.setAttribute('aria-label', 'Toggle UI Context Grab inspector')
  button.style.cssText = BASE_BUTTON_STYLE + INACTIVE_BUTTON_STYLE
  button.innerHTML = ICON
  document.body.appendChild(button)
  return button
}

function renderState(button: HTMLButtonElement, active: boolean): void {
  button.style.cssText = BASE_BUTTON_STYLE + (active ? ACTIVE_BUTTON_STYLE : INACTIVE_BUTTON_STYLE)
  button.title = active ? 'UI Context Grab: On' : 'UI Context Grab: Off'
}

export function createFloatingTrigger(onToggle: (active: boolean) => void): FloatingTrigger {
  const button = ensureButton()
  let active = false

  renderState(button, active)
  button.onclick = () => {
    active = !active
    renderState(button, active)
    onToggle(active)
  }

  return {
    containsTarget(target: EventTarget | null): boolean {
      return target instanceof Node ? button.contains(target) : false
    },
    setActive(nextActive: boolean): void {
      active = nextActive
      renderState(button, active)
    },
  }
}
