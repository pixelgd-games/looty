export function renderLobby() {
  return `
    <div class="shell">
      <div class="lobby-layout">
        <aside class="profile-sidebar" aria-label="member profile">
          <a class="brand-link profile-brand" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>

          <section class="profile-panel">
            <div class="profile-avatar" id="profileAvatar" aria-hidden="true">L</div>

            <div class="profile-copy">
              <p class="profile-kicker">PLAYER</p>
              <h1 class="profile-name" id="profileName">Guest</h1>
              <p class="profile-status" id="profileStatus">Log in to sync your Looty profile.</p>
            </div>

            <div class="profile-wallet">
              <span class="profile-wallet-label">Balance</span>
              <strong class="profile-wallet-value" id="profileBalance">--</strong>
            </div>
          </section>

          <div class="profile-actions" id="profileActions" aria-label="member actions">
            <button class="profile-action" type="button" data-auth-open="login" aria-haspopup="dialog" aria-controls="authModal">Log In</button>
            <button class="profile-action profile-action-primary" type="button" data-auth-open="register" aria-haspopup="dialog" aria-controls="authModal">Sign Up</button>
          </div>
        </aside>

        <div class="lobby-main">
          <section class="hero" id="hero" aria-label="Looty hero image"></section>

          <main class="content" id="gamesSection">
            <div class="section-head">
              <div>
                <p class="section-kicker">GAME NAME</p>
                <h2 class="section-title">Lord of Gomoku</h2>
              </div>
            </div>
            <div class="grid" id="gameGrid"></div>
          </main>
        </div>
      </div>

      <section class="auth-modal" id="authModal" aria-hidden="true" hidden>
        <div class="auth-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
          <button class="auth-modal-close" type="button" data-auth-close aria-label="Close member dialog">X</button>

          <div class="auth-modal-surface">
            <div class="auth-layout auth-modal-layout">
              <section class="auth-stage auth-modal-stage" aria-label="Looty member visual">
                <div class="auth-stage-copy">
                  <p class="auth-kicker">MEMBER ACCESS</p>
                  <h2 class="auth-title" id="authModalTitle">Member Login</h2>
                  <p class="auth-lead" id="authModalLead">Enter Looty to keep your game state and inventory connected.</p>
                </div>
              </section>

              <div class="auth-modal-panel" id="authModalPanel"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
}
