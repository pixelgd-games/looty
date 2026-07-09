export const ERROR_CODES = Object.freeze({
  LOBBY_GAMES_READ_FAILED: "LOOTY-LOBBY-001",

  GAME_MISSING_SLUG: "LOOTY-GAME-001",
  GAME_NOT_FOUND: "LOOTY-GAME-002",
  GAME_URL_MISSING: "LOOTY-GAME-003",
  GAME_READ_FAILED: "LOOTY-GAME-004",
  GAME_URL_INVALID: "LOOTY-GAME-005",

  ADMIN_AUTH_READ_FAILED: "LOOTY-ADMIN-001",
  ADMIN_NOT_ALLOWED: "LOOTY-ADMIN-002",
  ADMIN_GAMES_READ_FAILED: "LOOTY-ADMIN-003",
  ADMIN_DELETE_FAILED: "LOOTY-ADMIN-004",
  ADMIN_GAME_READ_FAILED: "LOOTY-ADMIN-005",
  ADMIN_GAME_NOT_FOUND: "LOOTY-ADMIN-006",
  ADMIN_GAME_SAVE_FAILED: "LOOTY-ADMIN-007",
  ADMIN_FORM_INVALID: "LOOTY-ADMIN-008",
  ADMIN_SIGN_OUT_FAILED: "LOOTY-ADMIN-009",
  ADMIN_OAUTH_FAILED: "LOOTY-ADMIN-010",
})

const STYLE_ID = "looty-error-modal-style"
const MODAL_ID = "looty-error-modal"

let activeCleanup = null

export function showErrorModal(options = {}) {
  const config = normalizeOptions(options)

  if (config.error) {
    console.error(`[${config.code}] ${config.title}`, config.error)
  } else {
    console.warn(`[${config.code}] ${config.title}: ${config.message}`)
  }

  closeErrorModal()
  ensureStyles()

  const modal = document.createElement("section")
  modal.id = MODAL_ID
  modal.className = "looty-error-modal"
  modal.setAttribute("role", "presentation")

  const dialog = document.createElement("div")
  dialog.className = "looty-error-dialog"
  dialog.setAttribute("role", "dialog")
  dialog.setAttribute("aria-modal", "true")
  dialog.setAttribute("aria-labelledby", "looty-error-title")
  dialog.setAttribute("aria-describedby", "looty-error-message")

  const kicker = document.createElement("p")
  kicker.className = "looty-error-kicker"
  kicker.textContent = "ERROR"

  const title = document.createElement("h2")
  title.id = "looty-error-title"
  title.className = "looty-error-title"
  title.textContent = config.title

  const message = document.createElement("p")
  message.id = "looty-error-message"
  message.className = "looty-error-message"
  message.textContent = config.message

  const code = document.createElement("p")
  code.className = "looty-error-code"
  code.textContent = `Error code: ${config.code}`

  const actions = document.createElement("div")
  actions.className = "looty-error-actions"

  if (config.primaryAction) {
    actions.append(createActionButton(config.primaryAction, "primary"))
  } else if (config.reload !== false) {
    actions.append(createActionButton({
      label: "Reload",
      onClick: () => location.reload(),
    }, "primary"))
  }

  if (config.secondaryAction) {
    actions.append(createActionButton(config.secondaryAction))
  } else if (config.close !== false) {
    actions.append(createActionButton({
      label: "Close",
      onClick: closeErrorModal,
      closeBeforeAction: false,
    }))
  }

  dialog.append(kicker, title, message, code, actions)
  modal.append(dialog)
  document.body.append(modal)
  document.body.classList.add("looty-error-modal-open")

  const handleKeydown = (event) => {
    if (event.key === "Escape" && config.close !== false) {
      closeErrorModal()
    }
  }

  const handleOverlayClick = (event) => {
    if (event.target === modal && config.close !== false) {
      closeErrorModal()
    }
  }

  document.addEventListener("keydown", handleKeydown)
  modal.addEventListener("click", handleOverlayClick)

  activeCleanup = () => {
    document.removeEventListener("keydown", handleKeydown)
    modal.removeEventListener("click", handleOverlayClick)
    modal.remove()
    document.body.classList.remove("looty-error-modal-open")
    activeCleanup = null
  }

  dialog.querySelector("button")?.focus()

  return { close: closeErrorModal }
}

export function closeErrorModal() {
  activeCleanup?.()
}

function normalizeOptions(options) {
  return {
    code: options.code || "LOOTY-UNKNOWN-000",
    title: options.title || "Something went wrong",
    message: options.message || "The system is having trouble right now. Please try again later.",
    error: options.error,
    reload: options.reload,
    close: options.close,
    primaryAction: options.primaryAction,
    secondaryAction: options.secondaryAction,
  }
}

function createActionButton(action, modifier = "") {
  const button = document.createElement("button")
  button.type = "button"
  button.className = modifier ? `looty-error-action ${modifier}` : "looty-error-action"
  button.textContent = action.label || "OK"
  button.addEventListener("click", () => {
    if (action.closeBeforeAction !== false) {
      closeErrorModal()
    }

    action.onClick?.()
  })
  return button
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = `
    body.looty-error-modal-open{
      overflow:hidden;
    }

    .looty-error-modal{
      position:fixed;
      inset:0;
      z-index:10000;
      display:grid;
      place-items:center;
      padding:24px;
      background:rgba(5,7,12,.68);
      -webkit-backdrop-filter:blur(14px);
      backdrop-filter:blur(14px);
      color:#f7f8fc;
      font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif;
    }

    .looty-error-dialog{
      width:min(420px,100%);
      padding:24px;
      border:1px solid rgba(235,255,61,.18);
      border-radius:18px;
      background:linear-gradient(180deg, rgba(24,29,38,.96) 0%, rgba(10,14,20,.98) 100%);
      box-shadow:0 28px 70px rgba(0,0,0,.46), inset 0 1px 0 rgba(255,255,255,.06);
    }

    .looty-error-kicker{
      margin:0 0 8px;
      color:#ebff3d;
      font-size:12px;
      font-weight:800;
      letter-spacing:.12em;
    }

    .looty-error-title{
      margin:0;
      font-size:24px;
      line-height:1.2;
    }

    .looty-error-message{
      margin:12px 0 0;
      color:rgba(247,248,252,.84);
      font-size:15px;
      line-height:1.6;
    }

    .looty-error-code{
      margin:16px 0 0;
      padding:10px 12px;
      border:1px solid rgba(255,255,255,.08);
      border-radius:12px;
      background:rgba(255,255,255,.04);
      color:rgba(247,248,252,.72);
      font-size:13px;
      font-weight:700;
      word-break:break-word;
    }

    .looty-error-actions{
      display:flex;
      justify-content:flex-end;
      gap:10px;
      margin-top:20px;
    }

    .looty-error-action{
      min-height:38px;
      padding:0 16px;
      border:1px solid rgba(235,255,61,.14);
      border-radius:999px;
      background:rgba(15,19,28,.92);
      color:#f7f8fc;
      font:inherit;
      font-size:13px;
      font-weight:800;
      cursor:pointer;
    }

    .looty-error-action.primary{
      border-color:rgba(255,255,255,.08);
      background:linear-gradient(180deg, #ebff3d 0%, #d5ff18 100%);
      color:#1d2128;
    }

    @media (max-width:480px){
      .looty-error-modal{
        padding:16px;
      }

      .looty-error-dialog{
        padding:20px;
      }

      .looty-error-actions{
        flex-direction:column;
      }

      .looty-error-action{
        width:100%;
      }
    }
  `
  document.head.append(style)
}
