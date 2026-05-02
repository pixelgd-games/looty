import { fetchPublicGames } from "./data.js"
import { initLobbyAuthModal } from "./auth-modal.js"
import { getLobbyElements } from "./dom.js"
import { renderGameGrid, renderGameGridError } from "./game-grid.js"
import { renderLobbyHero } from "./hero.js"
import { renderLobby } from "./lobby.js"
import { ERROR_CODES, showErrorModal } from "../../ui/error-modal.js"

export async function initLobbyPage(appRoot) {
  if (!appRoot) return

  appRoot.innerHTML = renderLobby()

  const elements = getLobbyElements(appRoot)

  renderLobbyHero(elements)
  initLobbyAuthModal(elements)

  try {
    const games = await fetchPublicGames()
    renderGameGrid(elements.gameGrid, games)
  } catch (error) {
    renderGameGridError(elements.gameGrid)
    showErrorModal({
      code: ERROR_CODES.LOBBY_GAMES_READ_FAILED,
      title: "遊戲列表讀取失敗",
      message: "目前無法取得公開遊戲，請稍後再試。如果問題持續發生，請聯絡管理員。",
      error,
    })
  }
}
