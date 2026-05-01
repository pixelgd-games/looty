const AUTH_MODE_CONFIG = {
  login: {
    title: "會員登入",
    lead: "回到 Looty，直接從你的遊戲入口繼續開始。",
    heading: "登入你的 Looty 帳號",
    copy: "輸入你的帳號資訊，直接從 Looty 繼續開始。",
    submitLabel: "登入",
    altLabel: "還沒有帳號？",
    altMode: "register",
    altAction: "前往註冊",
    fields: [
      {
        label: "Email",
        name: "email",
        type: "email",
        placeholder: "you@example.com",
        autocomplete: "email",
        required: true,
      },
      {
        label: "密碼",
        name: "password",
        type: "password",
        placeholder: "輸入密碼",
        autocomplete: "current-password",
        required: true,
      },
    ],
  },
  register: {
    title: "建立帳號",
    lead: "先把你的會員入口就位，之後再把登入流程正式接上。",
    heading: "建立你的 Looty 帳號",
    copy: "填好基本資料，快速完成你的 Looty 帳號建立。",
    submitLabel: "註冊",
    altLabel: "已經有帳號？",
    altMode: "login",
    altAction: "前往登入",
    fields: [
      {
        label: "顯示名稱",
        name: "displayName",
        type: "text",
        placeholder: "你想顯示的名稱",
        autocomplete: "nickname",
        required: true,
      },
      {
        label: "Email",
        name: "email",
        type: "email",
        placeholder: "you@example.com",
        autocomplete: "email",
        required: true,
      },
      {
        label: "密碼",
        name: "password",
        type: "password",
        placeholder: "至少 8 碼",
        autocomplete: "new-password",
        required: true,
      },
      {
        label: "確認密碼",
        name: "confirmPassword",
        type: "password",
        placeholder: "再次輸入密碼",
        autocomplete: "new-password",
        required: true,
      },
    ],
  },
}

export function getAuthModeConfig(mode) {
  return AUTH_MODE_CONFIG[mode] || AUTH_MODE_CONFIG.login
}

export function renderAuthPanel(mode) {
  const config = getAuthModeConfig(mode)

  return `
    <section class="auth-panel">
      <div class="auth-tabs" aria-label="Auth modal switch">
        ${renderTab(mode, "login", "登入")}
        ${renderTab(mode, "register", "註冊")}
      </div>

      <h2 class="auth-panel-heading">${escapeHtml(config.heading)}</h2>
      <p class="auth-panel-copy">${escapeHtml(config.copy)}</p>

      <form class="auth-form" data-auth-form novalidate>
        ${renderFields(config.fields)}
        <button class="auth-submit" type="submit">${escapeHtml(config.submitLabel)}</button>
      </form>

      <p class="auth-alt">
        ${escapeHtml(config.altLabel)}
        <button class="auth-inline-link" type="button" data-auth-switch="${config.altMode}">${escapeHtml(config.altAction)}</button>
      </p>
    </section>
  `
}

export function bindAuthPanel(root, mode, options = {}) {
  const form = root.querySelector("[data-auth-form]")
  const modeButtons = root.querySelectorAll("[data-auth-switch]")

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.authSwitch || "login"
      options.onModeChange?.(nextMode)
    })
  })

  if (!form) return

  form.addEventListener("submit", (event) => {
    event.preventDefault()

    if (mode === "register") {
      const password = form.elements.namedItem("password")?.value || ""
      const confirmPasswordField = form.elements.namedItem("confirmPassword")
      const confirmPassword = confirmPasswordField?.value || ""

      if (confirmPasswordField instanceof HTMLInputElement) {
        confirmPasswordField.setCustomValidity("")
      }

      if (password !== confirmPassword && confirmPasswordField instanceof HTMLInputElement) {
        confirmPasswordField.setCustomValidity("兩次輸入的密碼還不一樣")
      }
    }

    if (!form.reportValidity()) return

    form.reset()
  })
}

function renderTab(currentMode, targetMode, label) {
  const activeClass = currentMode === targetMode ? " is-active" : ""
  const pressed = currentMode === targetMode ? "true" : "false"
  return `<button class="auth-tab${activeClass}" type="button" data-auth-switch="${targetMode}" aria-pressed="${pressed}">${label}</button>`
}

function renderFields(fields) {
  return fields
    .map((field) => {
      return `
        <label class="auth-field">
          <span class="auth-label">${escapeHtml(field.label)}</span>
          <input
            class="auth-input"
            name="${field.name}"
            type="${field.type}"
            placeholder="${escapeHtml(field.placeholder)}"
            ${field.autocomplete ? `autocomplete="${escapeHtml(field.autocomplete)}"` : ""}
            ${field.required ? "required" : ""}
          />
        </label>
      `
    })
    .join("")
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
