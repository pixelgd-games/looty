import { supabase } from "/src/lib/supabaseClient.js"
import { getEnabledGameSlugs } from "/src/config/enabled-games.js"

export const CASINO_TYPES = ["slot", "fish", "card", "arcade"]

export const state = {
  main: "explore",
  casinoSub: "slot",
}

let gamesCache = []

export async function fetchGames() {
  const { data, error } = await supabase
    .from("public_games_v1")
    .select("id, slug, name, type, supports_live, thumbnail, created_at")

  if (error) {
    console.error(error)
    return []
  }

  const list = data || []
  const enabledSlugs = getEnabledGameSlugs()

  return list.filter((g) => enabledSlugs.includes(g.slug))
}

export function getFilteredGames(list) {
  let result = list.slice()

  if (state.main === "games") {
    result = result.filter((g) => g.type === "casual")
  } else if (state.main === "casino") {
    result = result.filter((g) => CASINO_TYPES.includes(g.type))
    result = result.filter((g) => g.type === state.casinoSub)
  } else if (state.main === "premium") {
    result = result.filter((g) => g.type === "adult")
  } else if (state.main === "live") {
    result = result.filter((g) => g.supports_live === true)
  }

  return result
}

export function syncTabsUI() {
  document.querySelectorAll("#mainTabs .tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.main === state.main)
  })

  const subWrap = document.getElementById("casinoSubTabs")
  if (subWrap) {
    subWrap.classList.toggle("show", state.main === "casino")
  }

  document.querySelectorAll("#casinoSubTabs .tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.sub === state.casinoSub)
  })
}

export function renderGrid() {
  syncTabsUI()

  const grid = document.getElementById("gameGrid")
  if (!grid) return

  grid.innerHTML = ""

  const list = getFilteredGames(gamesCache)

  list.forEach((g) => {
    const el = document.createElement("div")
    el.className = "game"

    el.innerHTML = `
      <div class="cover" style="background-image:url('${g.thumbnail || ""}')"></div>
      <div class="name">${g.name}</div>
      <div class="meta">/game/?slug=${encodeURIComponent(g.slug)}</div>
    `

    el.onclick = () => {
      window.location.href = "/game/?slug=" + encodeURIComponent(g.slug)
    }

    grid.appendChild(el)
  })
}

export function bindLobbyEvents() {
  const mainTabs = document.getElementById("mainTabs")
  const casinoSubTabs = document.getElementById("casinoSubTabs")

  if (mainTabs) {
    mainTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab")
      if (!tab) return
      state.main = tab.dataset.main
      renderGrid()
    })
  }

  if (casinoSubTabs) {
    casinoSubTabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab")
      if (!tab) return
      state.casinoSub = tab.dataset.sub
      renderGrid()
    })
  }
}

export async function initLobbyGames() {
  gamesCache = await fetchGames()
  renderGrid()
}