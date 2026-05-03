import { bindAuthPanel, getAuthModeConfig, renderAuthPanel } from "../../auth/shared.js"
import { ensureMyPlayer, getCurrentMemberSession, loginMember, registerMember, signOutMember } from "../../auth/member.js"
import { ERROR_CODES, showErrorModal } from "../../ui/error-modal.js"

export function initLobbyAuthModal(elements) {
  const {
    profileActions,
    profileAvatar,
    profileBalance,
    profileName,
    profileStatus,
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

  renderProfileSummary()

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
              message: "Registration received. Please check your email to verify the account.",
              resetForm: true,
            }
          }

          state.session = result.session
          state.player = result.player
          renderMemberActions()
          closeModal()
          return { resetForm: true }
        }

        const result = await loginMember(values)
        state.session = result.session
        state.player = result.player
        renderMemberActions()
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

  const handleProfileActionClick = async (event) => {
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
      renderMemberActions()
      closeModal()
    } catch (error) {
      logoutButton.disabled = false
      showErrorModal({
        code: ERROR_CODES.AUTH_SIGN_OUT_FAILED,
        title: "Sign out failed",
        message: "We could not sign you out right now. Please try again later.",
        error,
        reload: false,
      })
    }
  }

  profileActions?.addEventListener("click", (event) => {
    void handleProfileActionClick(event)
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

  function renderMemberActions() {
    renderProfileSummary()

    if (!profileActions) return

    if (!state.session?.user) {
      profileActions.replaceChildren(
        createAuthButton("Log In", "login"),
        createAuthButton("Sign Up", "register", true),
      )
      return
    }

    profileActions.replaceChildren(createLogoutButton())
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
      showErrorModal({
        code: ERROR_CODES.AUTH_MEMBER_STATE_FAILED,
        title: "Member state failed to load",
        message: "We could not load your member session. Please try again later.",
        error,
        reload: false,
      })
    }

    renderMemberActions()
  }

  function renderProfileSummary() {
    const name = state.session?.user ? getMemberName(state.session.user) : "Guest"
    const balance = state.player ? formatBalance(state.player.balance) : "--"

    if (profileName) {
      profileName.textContent = name
    }

    if (profileStatus) {
      profileStatus.textContent = state.session?.user
        ? "Member profile ready."
        : "Log in to sync your Looty profile."
    }

    if (profileBalance) {
      profileBalance.textContent = balance
    }

    if (profileAvatar) {
      profileAvatar.textContent = getInitial(name)
    }
  }
}

function normalizeMode(mode) {
  return mode === "register" ? "register" : "login"
}

function createAuthButton(label, mode, primary = false) {
  const button = document.createElement("button")
  button.className = primary ? "profile-action profile-action-primary" : "profile-action"
  button.type = "button"
  button.dataset.authOpen = mode
  button.setAttribute("aria-haspopup", "dialog")
  button.setAttribute("aria-controls", "authModal")
  button.textContent = label
  return button
}

function createLogoutButton() {
  const button = document.createElement("button")
  button.className = "profile-action"
  button.type = "button"
  button.dataset.memberLogout = "true"
  button.textContent = "Sign Out"
  return button
}

function getMemberName(user) {
  const metadata = user.user_metadata || {}
  const nameCandidates = [
    metadata.display_name,
    metadata.displayName,
    metadata.full_name,
    metadata.name,
    metadata.nickname,
    metadata.preferred_username,
  ]

  for (const candidate of nameCandidates) {
    const name = String(candidate || "").trim()
    if (name) return name
  }

  return "Looty Member"
}

function getInitial(value) {
  return String(value || "L").trim().slice(0, 1).toUpperCase() || "L"
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
