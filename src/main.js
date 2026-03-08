import "./styles/lobby.css"
import { renderLobby } from "./pages/lobby/lobby.js"
import { bindLobbyEvents, initLobbyGames } from "./pages/lobby/grid.js"

document.querySelector("#app").innerHTML = renderLobby()
bindLobbyEvents()
initLobbyGames()