import { bindAuthPanel, getAuthModeConfig, renderAuthPanel } from "../../auth/shared.js"

export function initLobbyAuthModal(elements) {
  const {
    authModal,
    authModalLead,
    authModalPanel,
    authModalTitle,
    authCloseButtons,
    authOpenButtons,
  } = elements

  if (!authModal || !authModalLead || !authModalPanel || !authModalTitle) return

  const state = {
    lastTrigger: null,
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

  authOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openModal(button.dataset.authOpen, button)
    })
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
}

function normalizeMode(mode) {
  return mode === "register" ? "register" : "login"
}
