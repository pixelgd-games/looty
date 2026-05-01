import { fetchPublicGames } from "./data.js"
import { initLobbyAuthModal } from "./auth-modal.js"
import { getLobbyElements } from "./dom.js"
import { renderGameGrid } from "./game-grid.js"
import { renderLobbyHero } from "./hero.js"
import { renderLobby } from "./lobby.js"

export async function initLobbyPage(appRoot) {
  if (!appRoot) return

  appRoot.innerHTML = renderLobby()

  const elements = getLobbyElements(appRoot)

  renderLobbyHero(elements)
  initLobbyAuthModal(elements)

  const games = await fetchPublicGames()
  renderGameGrid(elements.gameGrid, games)
}
