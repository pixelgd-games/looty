import { bindAuthPanel, getAuthModeConfig, renderAuthPanel } from "../../auth/shared.js"
import { ensureMyPlayer, getCurrentMemberSession, loginMember, registerMember, signOutMember } from "../../auth/member.js"

export function initLobbyAuthModal(elements) {
  const {
    topbarActions,
    authModal,
    authModalLead,
    authModalPanel,
    authModalTitle,
    authCloseButtons,
  } = elements

  if (!authModal || !authModalLead || !authModalPanel || !authModalTitle) return

  const state = {
    lastTrigger: null,
    session: null,
    player: null,
  }

  const focusFirstField = () => {
    authModalPanel.querySelector(".auth-input")?.focus()
  }

  const renderMode = (mode) => {
    const currentMode = normalizeMode(mode)
    const config = getAuthModeConfig(currentMode)

    authModalTitle.textContent = config.title
    authModalLead.textContent = config.lead
    authModalPanel.innerHTML = renderAuthPanel(currentMode)

    bindAuthPanel(authModalPanel, currentMode, {
      onModeChange(nextMode) {
        renderMode(nextMode)
        focusFirstField()
      },
      async onSubmit({ values }) {
        if (currentMode === "register") {
          const result = await registerMember(values)

          if (result.needsEmailVerification) {
            return {
              type: "success",
              message: "註冊成功，請先驗證信箱後再登入。",
              resetForm: true,
            }
          }

          state.session = result.session
          state.player = result.player
          renderTopbarActions()
          closeModal()
          return { resetForm: true }
        }

        const result = await loginMember(values)
        state.session = result.session
        state.player = result.player
        renderTopbarActions()
        closeModal()
        return { resetForm: true }
      },
    })
  }

  const closeModal = () => {
    if (authModal.hidden) return

    authModal.hidden = true
    authModal.setAttribute("aria-hidden", "true")
    document.body.classList.remove("auth-modal-open")
    state.lastTrigger?.focus()
  }

  const openModal = (mode, trigger) => {
    state.lastTrigger = trigger || null
    renderMode(mode)

    authModal.hidden = false
    authModal.setAttribute("aria-hidden", "false")
    document.body.classList.add("auth-modal-open")

    requestAnimationFrame(focusFirstField)
  }

  const handleTopbarClick = async (event) => {
    const openButton = event.target.closest("[data-auth-open]")
    if (openButton) {
      openModal(openButton.dataset.authOpen, openButton)
      return
    }

    const logoutButton = event.target.closest("[data-member-logout]")
    if (!logoutButton) return

    logoutButton.disabled = true

    try {
      await signOutMember()
      state.session = null
      state.player = null
      renderTopbarActions()
      closeModal()
    } catch (error) {
      console.error(error)
      logoutButton.disabled = false
      alert(error instanceof Error ? error.message : "登出失敗，請稍後再試。")
    }
  }

  topbarActions?.addEventListener("click", (event) => {
    void handleTopbarClick(event)
  })

  authCloseButtons.forEach((button) => {
    button.addEventListener("click", closeModal)
  })

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeModal()
    }
  })

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal()
    }
  })

  void syncMemberState()

  function renderTopbarActions() {
    if (!topbarActions) return

    if (!state.session?.user) {
      topbarActions.replaceChildren(
        createAuthButton("登入", "login"),
        createAuthButton("註冊", "register", true),
      )
      return
    }

    const summary = document.createElement("div")
    summary.className = "topbar-member"

    const name = document.createElement("span")
    name.className = "topbar-member-name"
    name.textContent = getMemberName(state.session.user)

    const meta = document.createElement("span")
    meta.className = "topbar-member-meta"
    meta.textContent = state.player ? `餘額 ${formatBalance(state.player.balance)}` : "會員已登入"

    summary.append(name, meta)
    topbarActions.replaceChildren(summary, createLogoutButton())
  }

  async function syncMemberState() {
    try {
      const session = await getCurrentMemberSession()

      state.session = session
      state.player = null

      if (session?.user) {
        state.player = await ensureMyPlayer()
      }
    } catch (error) {
      console.error(error)
    }

    renderTopbarActions()
  }
}

function normalizeMode(mode) {
  return mode === "register" ? "register" : "login"
}

function createAuthButton(label, mode, primary = false) {
  const button = document.createElement("button")
  button.className = primary ? "topbar-action topbar-action-primary" : "topbar-action"
  button.type = "button"
  button.dataset.authOpen = mode
  button.setAttribute("aria-haspopup", "dialog")
  button.setAttribute("aria-controls", "authModal")
  button.textContent = label
  return button
}

function createLogoutButton() {
  const button = document.createElement("button")
  button.className = "topbar-action"
  button.type = "button"
  button.dataset.memberLogout = "true"
  button.textContent = "登出"
  return button
}

function getMemberName(user) {
  return user.user_metadata?.display_name || user.email || "Looty 會員"
}

function formatBalance(balance) {
  const value = Number(balance)

  if (!Number.isFinite(value)) {
    return "--"
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString("zh-TW")
  }

  return value.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
