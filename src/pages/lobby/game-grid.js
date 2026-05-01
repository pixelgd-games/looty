import { buildGameUrl, getGameTypeLabel } from "./utils.js"

export function renderGameGrid(gridElement, games) {
  if (!gridElement) return

  if (games.length === 0) {
    gridElement.replaceChildren(createEmptyState())
    return
  }

  gridElement.replaceChildren(...games.map(createGameCard))
}

function createEmptyState() {
  const wrapper = document.createElement("div")
  wrapper.className = "empty-state"

  const title = document.createElement("div")
  title.className = "empty-title"
  title.textContent = "目前還沒有公開遊戲。"

  const copy = document.createElement("div")
  copy.className = "empty-copy"
  copy.textContent = "遊戲上架後會自動出現在這裡。"

  wrapper.append(title, copy)
  return wrapper
}

function createGameCard(game) {
  const card = document.createElement("a")
  card.className = "game-card"
  card.href = buildGameUrl(game.slug)

  const cover = document.createElement("div")
  cover.className = "game-card-cover"
  if (game.thumbnail) {
    cover.style.backgroundImage = `url("${game.thumbnail}")`
  }

  const body = document.createElement("div")
  body.className = "game-body"

  const head = document.createElement("div")
  head.className = "game-head"
  head.append(createTypeChip(getGameTypeLabel(game.type)))

  if (game.supports_live) {
    head.append(createTypeChip("Live", "live"))
  }

  const name = document.createElement("div")
  name.className = "game-card-name"
  name.textContent = game.name

  const meta = document.createElement("div")
  meta.className = "game-card-meta"
  meta.textContent = game.slug

  body.append(head, name, meta)
  card.append(cover, body)

  return card
}

function createTypeChip(label, modifier = "") {
  const chip = document.createElement("span")
  chip.className = modifier ? `type-chip ${modifier}` : "type-chip"
  chip.textContent = label
  return chip
}
