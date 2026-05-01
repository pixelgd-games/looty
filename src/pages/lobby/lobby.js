export function renderLobby() {
  return `
    <div class="shell">
      <header class="topbar-shell">
        <div class="topbar">
          <a class="brand-link" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
          <div class="topbar-actions" aria-label="member actions">
            <button class="topbar-action" type="button" data-auth-open="login" aria-haspopup="dialog" aria-controls="authModal">登入</button>
            <button class="topbar-action topbar-action-primary" type="button" data-auth-open="register" aria-haspopup="dialog" aria-controls="authModal">註冊</button>
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

      <section class="auth-modal" id="authModal" aria-hidden="true" hidden>
        <div class="auth-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
          <button class="auth-modal-close" type="button" data-auth-close aria-label="關閉會員視窗">X</button>

          <div class="auth-modal-surface">
            <div class="auth-layout auth-modal-layout">
              <section class="auth-stage auth-modal-stage" aria-label="Looty member visual">
                <div class="auth-stage-copy">
                  <p class="auth-kicker">MEMBER ACCESS</p>
                  <h2 class="auth-title" id="authModalTitle">會員登入</h2>
                  <p class="auth-lead" id="authModalLead">回到 Looty，直接從你的遊戲入口繼續開始。</p>
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
