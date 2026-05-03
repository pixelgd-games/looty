import { buildGameUrl, getGameTypeLabel } from "./utils.js"

const TEXT = {
  openGame: "Open game",
  play: "Play",
  studio: "Studio",
  mode: "Mode",
  featured: "Featured",
  rating: "Rating",
  emptyTitle: "No games available",
  emptyCopy: "Published games will appear here.",
  errorTitle: "Game list failed to load",
  errorCopy: "Please try again later or contact an administrator.",
}

const DISPLAY_NAMES = {
  "lord-of-gomoku": "Lord of Gomoku",
}

export function renderGameGrid(gridElement, games) {
  if (!gridElement) return

  if (games.length === 0) {
    gridElement.replaceChildren(createEmptyState())
    return
  }

  gridElement.replaceChildren(...games.map(createGameMovieCard))
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

function createGameMovieCard(game) {
  const card = document.createElement("article")
  card.className = "game-movie-card"

  const gameUrl = buildGameUrl(game.slug)
  card.append(
    createPoster(game, gameUrl),
    createDetails(game),
    createRatingPanel(game, gameUrl),
  )

  return card
}

function createPoster(game, gameUrl) {
  const displayName = getDisplayName(game)
  const poster = document.createElement("a")
  poster.className = "game-movie-poster"
  poster.href = gameUrl
  poster.setAttribute("aria-label", `${TEXT.openGame}: ${displayName}`)

  if (game.thumbnail) {
    poster.style.backgroundImage = `url("${game.thumbnail}")`
  } else {
    poster.classList.add("is-empty")
  }

  return poster
}

function createDetails(game) {
  const displayName = getDisplayName(game)
  const details = document.createElement("div")
  details.className = "game-movie-details"

  const title = document.createElement("h3")
  title.className = "game-movie-title"
  title.textContent = displayName

  const meta = document.createElement("div")
  meta.className = "game-movie-meta"
  meta.append(
    createMetaRow(TEXT.studio, "Looty"),
    createMetaRow(TEXT.mode, getModeText(game)),
  )

  const synopsis = document.createElement("p")
  synopsis.className = "game-movie-synopsis"
  synopsis.textContent = getSynopsis(game)

  const tags = document.createElement("div")
  tags.className = "game-movie-tags"
  getTags(game).forEach((tag) => {
    const chip = document.createElement("span")
    chip.className = "game-movie-tag"
    chip.textContent = tag
    tags.append(chip)
  })

  const slug = document.createElement("p")
  slug.className = "game-movie-slug"
  slug.textContent = `ID: ${game.slug}`

  details.append(title, meta, synopsis, tags, slug)
  return details
}

function createMetaRow(label, value) {
  const row = document.createElement("p")
  row.className = "game-movie-meta-row"

  const key = document.createElement("strong")
  key.textContent = `${label}: `

  const text = document.createElement("span")
  text.textContent = value

  row.append(key, text)
  return row
}

function createRatingPanel(game, gameUrl) {
  const panel = document.createElement("div")
  panel.className = "game-movie-side"

  const rating = document.createElement("div")
  rating.className = "game-movie-rating"
  rating.setAttribute("aria-label", `${TEXT.rating}: ${getRating(game)}`)

  const value = document.createElement("span")
  value.className = "game-movie-rating-value"
  value.textContent = getRating(game)

  const label = document.createElement("span")
  label.className = "game-movie-rating-label"
  label.textContent = TEXT.rating

  rating.append(value, label)

  const playLink = document.createElement("a")
  playLink.className = "game-movie-play"
  playLink.href = gameUrl
  playLink.textContent = TEXT.play

  panel.append(rating, playLink)
  return panel
}

function getModeText(game) {
  const type = getGameTypeLabel(game.type)
  return game.supports_live ? `${type}, Live` : type
}

function getTags(game) {
  const tags = [getGameTypeLabel(game.type), TEXT.featured]

  if (game.supports_live) {
    tags.push("Live")
  }

  return [...new Set(tags.filter(Boolean))]
}

function getSynopsis(game) {
  if (game.slug === "lord-of-gomoku") {
    return "A focused board strategy game built around clean decisions, fast rounds, and sharp tactical pressure."
  }

  return "A featured Looty game selected for quick play, clear rules, and replayable sessions."
}

function getRating(game) {
  const seed = String(game.slug || game.name || "").split("").reduce((sum, char) => {
    return sum + char.charCodeAt(0)
  }, 0)

  return (8.2 + (seed % 8) / 10).toFixed(1)
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
