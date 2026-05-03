const HORIZONTAL_BEAMS = [
  { tone: "cyan", top: "16%", width: "34vw", height: "1px", duration: "14.8s", delay: "-4.2s", opacity: ".28" },
  { tone: "blue", top: "24%", width: "48vw", height: "2px", duration: "11.9s", delay: "-8.1s", opacity: ".42" },
  { tone: "pink", top: "34%", width: "26vw", height: "1px", duration: "13.4s", delay: "-2.9s", opacity: ".24" },
  { tone: "cyan", top: "43%", width: "58vw", height: "3px", duration: "11.2s", delay: "-6.4s", opacity: ".56" },
  { tone: "blue", top: "52%", width: "42vw", height: "2px", duration: "14.6s", delay: "-10.3s", opacity: ".3" },
  { tone: "cyan", top: "61%", width: "64vw", height: "4px", duration: "12.4s", delay: "-5.5s", opacity: ".62" },
  { tone: "pink", top: "71%", width: "30vw", height: "1px", duration: "15.9s", delay: "-7.6s", opacity: ".22" },
  { tone: "blue", top: "81%", width: "46vw", height: "2px", duration: "13.9s", delay: "-11.4s", opacity: ".34" },
]

export function renderLobby() {
  return `
    <div class="shell">
      ${renderBeamField()}

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
                <p class="section-kicker">PUBLIC LOBBY</p>
                <h2 class="section-title">All Games</h2>
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

function renderBeamField() {
  return `
      <div class="beam-field" aria-hidden="true">
        <div class="beam-field-sheen"></div>
        <div class="beam-field-vignette"></div>
        <div class="beam-field-stream">
          ${HORIZONTAL_BEAMS.map(renderBeam).join("")}
        </div>
      </div>
  `
}

function renderBeam(beam) {
  return `<span class="beam beam-${beam.tone}" style="${buildBeamStyle(beam)}"></span>`
}

function buildBeamStyle(beam) {
  return [
    `--beam-top:${beam.top}`,
    `--beam-width:${beam.width}`,
    `--beam-height:${beam.height}`,
    `--beam-duration:${beam.duration}`,
    `--beam-delay:${beam.delay}`,
    `--beam-opacity:${beam.opacity}`,
  ].join("; ")
}
