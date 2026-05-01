export function renderLobby() {
  return `
    <div class="shell">
      <header class="topbar-shell">
        <div class="topbar">
          <a class="brand-link" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
          <div class="topbar-actions" aria-label="member actions">
            <a class="topbar-action" href="/login/">登入</a>
            <a class="topbar-action topbar-action-primary" href="/register/">註冊</a>
          </div>
        </div>
      </header>

      <section class="hero" id="hero" aria-label="Looty hero image"></section>

      <main class="content" id="gamesSection">
        <div class="section-head">
          <div>
            <p class="section-kicker">PUBLIC LOBBY</p>
            <h2 class="section-title">全部遊戲</h2>
          </div>
        </div>
        <div class="grid" id="gameGrid"></div>
      </main>
    </div>
  `
}
