import { fetchPublicGames } from "./data.js"
import { getLobbyElements } from "./dom.js"
import { renderGameGrid } from "./game-grid.js"
import { renderLobbyHero } from "./hero.js"
import { renderLobby } from "./lobby.js"

export async function initLobbyPage(appRoot) {
  if (!appRoot) return

  appRoot.innerHTML = renderLobby()

  const elements = getLobbyElements()
  const games = await fetchPublicGames()

  renderLobbyHero(elements)
  renderGameGrid(elements.gameGrid, games)
}
