import { fetchPublicGames } from "./data.js"
import { renderGameGrid, renderGameGridError } from "./game-grid.js"
import { renderLobby } from "./lobby.js"
import { ERROR_CODES, showErrorModal } from "../../ui/error-modal.js"

let deferredInstallPrompt = null

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
})

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null
})

export async function initLobbyPage(appRoot) {
  if (!appRoot) return

  appRoot.innerHTML = renderLobby()
  setupInstallButton(appRoot)

  const gameGrid = appRoot.querySelector("#gameGrid")

  try {
    const games = await fetchPublicGames()
    renderGameGrid(gameGrid, games)
  } catch (error) {
    renderGameGridError(gameGrid)
    showErrorModal({
      code: ERROR_CODES.LOBBY_GAMES_READ_FAILED,
      title: "Game list failed to load",
      message: "We could not load the public games right now. Please try again later or contact an administrator.",
      error,
    })
  }
}

function setupInstallButton(appRoot) {
  const button = appRoot.querySelector("#installAppButton")
  const help = appRoot.querySelector("#installHelp")
  const actions = appRoot.querySelector(".header-actions")
  if (!button || !help || !actions) return

  if (isStandaloneApp()) {
    hideInstallUi(button, help)
    return
  }

  button.hidden = false

  button.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      help.hidden = true
      button.setAttribute("aria-expanded", "false")
      button.disabled = true

      try {
        deferredInstallPrompt.prompt()
        const choice = await deferredInstallPrompt.userChoice
        if (choice.outcome === "accepted") {
          hideInstallUi(button, help)
        }
      } finally {
        button.disabled = false
        deferredInstallPrompt = null
      }
      return
    }

    const isOpen = help.hidden
    help.hidden = !isOpen
    button.setAttribute("aria-expanded", String(isOpen))
  })

  document.addEventListener("click", (event) => {
    if (actions.contains(event.target)) return

    help.hidden = true
    button.setAttribute("aria-expanded", "false")
  })
}

function hideInstallUi(button, help) {
  button.hidden = true
  help.hidden = true
  button.setAttribute("aria-expanded", "false")
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
}
