import { buildGameUrl, getGameTypeLabel } from "./utils.js"

const TEXT = {
  allGames: "All",
  openGame: "Open game",
  play: "Play",
  popular: "Popular",
  rating: "Rating",
  emptyTitle: "No games available",
  emptyCopy: "Published games will appear here.",
  errorTitle: "Game list failed to load",
  errorCopy: "Please try again later or contact an administrator.",
}

const DISPLAY_NAMES = {
  "demo-slot": "Demo Slot",
  "lord-of-gomoku": "Lord of Gomoku",
}

const CATEGORY_ITEMS = [
  { type: "all", label: TEXT.allGames, mark: "ALL" },
  { type: "slot", label: "Slots", mark: "S" },
  { type: "casual", label: "Casual", mark: "C" },
  { type: "arcade", label: "Arcade", mark: "A" },
  { type: "card", label: "Card", mark: "K" },
  { type: "fish", label: "Fish", mark: "F" },
  { type: "live", label: "Live", mark: "L" },
]

export function renderGameGrid(gridElement, games) {
  if (!gridElement) return

  if (games.length === 0) {
    gridElement.replaceChildren(createEmptyState())
    return
  }

  const categoryRail = createCategoryRail(games)
  const gameShelf = createGameShelf(games)

  gridElement.replaceChildren(categoryRail, gameShelf)
}

export function renderGameGridError(gridElement) {
  if (!gridElement) return

  gridElement.replaceChildren(createGridState({
    className: "empty-state is-error",
    title: TEXT.errorTitle,
    copy: TEXT.errorCopy,
  }))
}

function createEmptyState() {
  return createGridState({
    className: "empty-state",
    title: TEXT.emptyTitle,
    copy: TEXT.emptyCopy,
  })
}

function createGridState({ className, title: titleText, copy: copyText }) {
  const wrapper = document.createElement("div")
  wrapper.className = className

  const title = document.createElement("div")
  title.className = "empty-title"
  title.textContent = titleText

  const copy = document.createElement("div")
  copy.className = "empty-copy"
  copy.textContent = copyText

  wrapper.append(title, copy)
  return wrapper
}

function createCategoryRail(games) {
  const wrapper = document.createElement("nav")
  wrapper.className = "game-category-rail"
  wrapper.setAttribute("aria-label", "game categories")

  CATEGORY_ITEMS.forEach((category) => {
    const count = getCategoryCount(games, category.type)
    const item = document.createElement("div")
    item.className = "game-category-item"

    const mark = document.createElement("span")
    mark.className = "game-category-mark"
    mark.textContent = category.mark

    const label = document.createElement("span")
    label.className = "game-category-label"
    label.textContent = category.label

    const total = document.createElement("span")
    total.className = "game-category-count"
    total.textContent = String(count)

    item.append(mark, label, total)
    wrapper.append(item)
  })

  return wrapper
}

function createGameShelf(games) {
  const section = document.createElement("section")
  section.className = "game-shelf"
  section.setAttribute("aria-label", TEXT.popular)

  const header = document.createElement("div")
  header.className = "game-shelf-head"

  const title = document.createElement("h3")
  title.className = "game-shelf-title"
  title.textContent = TEXT.popular

  const count = document.createElement("span")
  count.className = "game-shelf-count"
  count.textContent = `${games.length} games`

  const tileGrid = document.createElement("div")
  tileGrid.className = "game-tile-grid"
  tileGrid.append(...games.map(createGameTile))

  header.append(title, count)
  section.append(header, tileGrid)

  return section
}

function createGameTile(game) {
  const card = document.createElement("article")
  card.className = "game-tile"

  const gameUrl = getGameUrl(game)
  card.append(
    createTilePoster(game, gameUrl),
    createTileBody(game, gameUrl),
  )

  return card
}

function createTilePoster(game, gameUrl) {
  const displayName = getDisplayName(game)
  const poster = document.createElement("a")
  poster.className = "game-tile-poster"
  poster.href = gameUrl
  poster.setAttribute("aria-label", `${TEXT.openGame}: ${displayName}`)

  if (game.thumbnail) {
    poster.style.backgroundImage = `url("${game.thumbnail}")`
  } else {
    poster.classList.add("is-empty")
  }

  return poster
}

function createTileBody(game, gameUrl) {
  const displayName = getDisplayName(game)
  const body = document.createElement("div")
  body.className = "game-tile-body"

  const title = document.createElement("h3")
  title.className = "game-tile-title"
  title.textContent = displayName

  const tags = document.createElement("div")
  tags.className = "game-tile-tags"

  const type = document.createElement("span")
  type.className = "game-tile-tag"
  type.textContent = getGameTypeLabel(game.type)

  const rating = document.createElement("span")
  rating.className = "game-tile-rating"
  rating.textContent = getRating(game)
  rating.setAttribute("aria-label", `${TEXT.rating}: ${getRating(game)}`)

  tags.append(type, rating)

  const action = document.createElement("a")
  action.className = "game-tile-play"
  action.href = gameUrl
  action.textContent = TEXT.play

  body.append(title, tags, action)
  return body
}

function getRating(game) {
  const seed = String(game.slug || game.name || "").split("").reduce((sum, char) => {
    return sum + char.charCodeAt(0)
  }, 0)

  return (8.2 + (seed % 8) / 10).toFixed(1)
}

function getGameUrl(game) {
  return game.url || buildGameUrl(game.slug)
}

function getCategoryCount(games, type) {
  if (type === "all") {
    return games.length
  }

  if (type === "live") {
    return games.filter((game) => game.supports_live).length
  }

  return games.filter((game) => game.type === type).length
}

function getDisplayName(game) {
  if (DISPLAY_NAMES[game.slug]) {
    return DISPLAY_NAMES[game.slug]
  }

  const name = String(game.name || "").trim()
  if (name && !containsCjk(name)) {
    return name
  }

  const slugName = String(game.slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ")

  return slugName || "Untitled Game"
}

function containsCjk(value) {
  return /[\u3400-\u9fff]/.test(value)
}
