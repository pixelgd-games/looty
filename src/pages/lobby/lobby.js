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

      <header class="topbar-shell">
        <div class="topbar">
          <a class="brand-link" href="/" aria-label="Looty lobby">
            <span class="brand-mark">Looty</span>
          </a>
          <div class="topbar-actions" id="topbarActions" aria-label="member actions">
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
