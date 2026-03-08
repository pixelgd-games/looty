// 本機開發用遊戲網址表
// demo-slot 目前由 Looty 自己提供靜態頁
// lord-of-gomoku 已改為雲端 games 站
// 之後其他遊戲也統一掛到 pixelgd-games 的 games 站

export const GAME_URLS = {
  "demo-slot": "/game/demo-slot/index.html",
  "lord-of-gomoku": "https://games.pixelgd-games.workers.dev/"
}

export function getGameUrl(slug) {
  return GAME_URLS[slug] || null
}