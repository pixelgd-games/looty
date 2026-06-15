export function renderLobby() {
  return `
    <div class="shell">
      <main class="lobby-page">
        <header class="site-header">
          <a class="brand-link" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
        </header>

        <section class="hero" aria-label="Looty hero image">
          <img class="hero-image" src="/hero/looty-hero-main.webp" alt="" loading="eager" decoding="async">
        </section>

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
