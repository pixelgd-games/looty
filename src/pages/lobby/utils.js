const GAME_TYPE_LABELS = {
  slot: "Slot",
  fish: "Fish",
  card: "Card",
  arcade: "Arcade",
  casual: "Casual",
  adult: "Premium",
}

export function buildGameUrl(slug) {
  return "/game/?slug=" + encodeURIComponent(slug)
}

export function getGameTypeLabel(type) {
  return GAME_TYPE_LABELS[type] || "Game"
}
