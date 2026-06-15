import { fetchPublicGames } from "./data.js"
import { getLobbyElements } from "./dom.js"
import { renderGameGrid, renderGameGridError } from "./game-grid.js"
import { renderLobby } from "./lobby.js"
import { ERROR_CODES, showErrorModal } from "../../ui/error-modal.js"

export async function initLobbyPage(appRoot) {
  if (!appRoot) return

  appRoot.innerHTML = renderLobby()

  const elements = getLobbyElements(appRoot)

  try {
    const games = await fetchPublicGames()
    renderGameGrid(elements.gameGrid, games)
  } catch (error) {
    renderGameGridError(elements.gameGrid)
    showErrorModal({
      code: ERROR_CODES.LOBBY_GAMES_READ_FAILED,
      title: "Game list failed to load",
      message: "We could not load the public games right now. Please try again later or contact an administrator.",
      error,
    })
  }
}
