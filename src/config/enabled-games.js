export const ENABLED_GAMES = {
  "demo-slot": true,
  "lord-of-gomoku": true,
}

export function isGameEnabled(slug) {
  return ENABLED_GAMES[slug] === true
}

export function getEnabledGameSlugs() {
  return Object.keys(ENABLED_GAMES).filter((slug) => ENABLED_GAMES[slug] === true)
}