export function renderLobby() {
  return `
    <div class="shell">
      <main class="lobby-page">
        <header class="site-header">
          <a class="brand-link" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
        </header>

        <section class="hero" id="hero" aria-label="Looty hero image"></section>

        <section class="content" id="gamesSection">
          <div class="section-head">
            <div>
              <p class="section-kicker">GAME LIST</p>
              <h2 class="section-title">Featured Games</h2>
            </div>
          </div>
          <div class="grid" id="gameGrid"></div>
        </section>
      </main>
    </div>
  `
}
