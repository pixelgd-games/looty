const AUTH_MODE_CONFIG = {
  login: {
    title: "Member Login",
    lead: "Return to Looty and keep your game state connected.",
    heading: "Log in to Looty",
    copy: "Enter your account details to continue from the Looty lobby.",
    submitLabel: "Log In",
    altLabel: "New here?",
    altMode: "register",
    altAction: "Create an account",
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
        label: "Password",
        name: "password",
        type: "password",
        placeholder: "Enter your password",
        autocomplete: "current-password",
        required: true,
      },
    ],
  },
  register: {
    title: "Create Account",
    lead: "Set up your Looty member profile before you play.",
    heading: "Create your Looty account",
    copy: "Fill in the basics to start using your member profile.",
    submitLabel: "Sign Up",
    altLabel: "Already registered?",
    altMode: "login",
    altAction: "Log in",
    fields: [
      {
        label: "Display Name",
        name: "displayName",
        type: "text",
        placeholder: "Name shown in the lobby",
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
        label: "Password",
        name: "password",
        type: "password",
        placeholder: "At least 8 characters",
        autocomplete: "new-password",
        required: true,
      },
      {
        label: "Confirm Password",
        name: "confirmPassword",
        type: "password",
        placeholder: "Enter the password again",
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
        ${renderTab(mode, "login", "Log In")}
        ${renderTab(mode, "register", "Sign Up")}
      </div>

      <h2 class="auth-panel-heading">${escapeHtml(config.heading)}</h2>
      <p class="auth-panel-copy">${escapeHtml(config.copy)}</p>
      <p class="auth-feedback" data-auth-feedback hidden aria-live="polite"></p>

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
  const feedback = root.querySelector("[data-auth-feedback]")

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.authSwitch || "login"
      options.onModeChange?.(nextMode)
    })
  })

  if (!form) return

  const inputs = [...form.querySelectorAll("input, button")]
  const submitButton = form.querySelector(".auth-submit")
  const defaultSubmitLabel = submitButton?.textContent || ""

  const setFeedback = (type, message) => {
    if (!feedback) return

    if (!message) {
      feedback.hidden = true
      feedback.textContent = ""
      feedback.className = "auth-feedback"
      return
    }

    feedback.hidden = false
    feedback.textContent = message
    feedback.className = type ? `auth-feedback is-${type}` : "auth-feedback"
  }

  const setPending = (pending) => {
    form.classList.toggle("is-pending", pending)
    modeButtons.forEach((button) => {
      button.disabled = pending
    })
    inputs.forEach((control) => {
      control.disabled = pending
    })

    if (submitButton) {
      submitButton.textContent = pending ? "Working..." : defaultSubmitLabel
    }
  }

  form.addEventListener("input", () => {
    setFeedback("", "")
  })

  form.addEventListener("submit", async (event) => {
    event.preventDefault()

    if (mode === "register") {
      const password = form.elements.namedItem("password")?.value || ""
      const confirmPasswordField = form.elements.namedItem("confirmPassword")
      const confirmPassword = confirmPasswordField?.value || ""

      if (confirmPasswordField instanceof HTMLInputElement) {
        confirmPasswordField.setCustomValidity("")
      }

      if (password !== confirmPassword && confirmPasswordField instanceof HTMLInputElement) {
        confirmPasswordField.setCustomValidity("The passwords do not match.")
      }
    }

    if (!form.reportValidity()) return

    if (!options.onSubmit) {
      form.reset()
      return
    }

    const formData = new FormData(form)
    const values = Object.fromEntries(formData.entries())

    setPending(true)

    try {
      const result = await options.onSubmit({
        mode,
        values,
        form,
        setFeedback,
      })

      if (result?.message) {
        setFeedback(result.type || "info", result.message)
      }

      if (result?.resetForm) {
        form.reset()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "The action failed. Please try again later."
      setFeedback("error", message)
    } finally {
      setPending(false)
    }
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
