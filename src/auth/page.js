const AUTH_MODE_CONFIG = {
  login: {
    title: "會員登入",
    lead: "回到 Looty，直接從你的遊戲入口繼續開始。",
    heading: "登入你的 Looty 帳號",
    copy: "這一版先把會員入口頁面與表單骨架做好，下一步再接 Supabase auth。",
    submitLabel: "登入",
    altLabel: "還沒有帳號？",
    altHref: "/register/",
    altAction: "前往註冊",
    status: "登入功能下一步會接上 Supabase，這裡先確認畫面與流程。",
    fields: [
      { label: "Email", name: "email", type: "email", placeholder: "you@example.com", required: true },
      { label: "密碼", name: "password", type: "password", placeholder: "輸入密碼", required: true },
    ],
  },
  register: {
    title: "建立帳號",
    lead: "先把你的會員入口就位，之後再把登入流程正式接上。",
    heading: "建立你的 Looty 帳號",
    copy: "目前先完成註冊畫面、欄位與路由，真正送出資料的流程下一步再接。",
    submitLabel: "註冊",
    altLabel: "已經有帳號？",
    altHref: "/login/",
    altAction: "前往登入",
    status: "註冊功能下一步會接上 Supabase，這裡先確認欄位和視覺。",
    fields: [
      { label: "顯示名稱", name: "displayName", type: "text", placeholder: "你想顯示的名稱", required: true },
      { label: "Email", name: "email", type: "email", placeholder: "you@example.com", required: true },
      { label: "密碼", name: "password", type: "password", placeholder: "至少 8 碼", required: true },
      { label: "確認密碼", name: "confirmPassword", type: "password", placeholder: "再次輸入密碼", required: true },
    ],
  },
}

export function initAuthPage(appRoot, mode) {
  if (!appRoot) return

  const config = AUTH_MODE_CONFIG[mode] || AUTH_MODE_CONFIG.login
  appRoot.innerHTML = renderAuthPage(mode, config)
  bindAuthPage(appRoot, mode, config)
}

function renderAuthPage(mode, config) {
  return `
    <div class="shell auth-shell">
      <header class="topbar-shell">
        <div class="topbar">
          <a class="brand-link" href="/" aria-label="Back to Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
          <div class="topbar-actions">
            <a class="topbar-action" href="/">返回大廳</a>
          </div>
        </div>
      </header>

      <main class="auth-page">
        <div class="auth-layout">
          <section class="auth-stage" aria-label="Looty member visual">
            <div class="auth-stage-copy">
              <p class="auth-kicker">MEMBER ACCESS</p>
              <h1 class="auth-title">${escapeHtml(config.title)}</h1>
              <p class="auth-lead">${escapeHtml(config.lead)}</p>
            </div>
          </section>

          <section class="auth-panel">
            <div class="auth-tabs" aria-label="Auth page switch">
              <a class="auth-tab${mode === "login" ? " is-active" : ""}" href="/login/">登入</a>
              <a class="auth-tab${mode === "register" ? " is-active" : ""}" href="/register/">註冊</a>
            </div>

            <h2 class="auth-panel-heading">${escapeHtml(config.heading)}</h2>
            <p class="auth-panel-copy">${escapeHtml(config.copy)}</p>

            <form class="auth-form" id="authForm" novalidate>
              ${renderFields(config.fields)}
              ${mode === "register" ? renderRegisterChecks() : ""}
              <button class="auth-submit" type="submit">${escapeHtml(config.submitLabel)}</button>
            </form>

            <div class="auth-meta">
              <p class="auth-note" id="authStatus" role="status">${escapeHtml(config.status)}</p>
              <p class="auth-alt">
                ${escapeHtml(config.altLabel)}
                <a class="auth-inline-link" href="${config.altHref}">${escapeHtml(config.altAction)}</a>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  `
}

function bindAuthPage(appRoot, mode, config) {
  const form = appRoot.querySelector("#authForm")
  const status = appRoot.querySelector("#authStatus")

  if (!form || !status) return

  form.addEventListener("submit", (event) => {
    event.preventDefault()

    if (!form.reportValidity()) return

    if (mode === "register") {
      const password = form.elements.namedItem("password")?.value || ""
      const confirmPassword = form.elements.namedItem("confirmPassword")?.value || ""

      if (password !== confirmPassword) {
        status.textContent = "兩次輸入的密碼還不一樣，這裡先幫你卡一下。"
        return
      }
    }

    status.textContent = config.status
  })
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
            ${field.required ? "required" : ""}
          />
        </label>
      `
    })
    .join("")
}

function renderRegisterChecks() {
  return `
    <label class="auth-check">
      <input type="checkbox" name="agree" required />
      <span>我同意先用這版畫面確認註冊流程，下一步再接正式會員系統。</span>
    </label>
  `
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
