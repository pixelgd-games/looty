export function getLobbyElements(root = document) {
  return {
    hero: root.querySelector("#hero"),
    gameGrid: root.querySelector("#gameGrid"),
    authModal: root.querySelector("#authModal"),
    authModalLead: root.querySelector("#authModalLead"),
    authModalPanel: root.querySelector("#authModalPanel"),
    authModalTitle: root.querySelector("#authModalTitle"),
    authCloseButtons: [...root.querySelectorAll("[data-auth-close]")],
    authOpenButtons: [...root.querySelectorAll("[data-auth-open]")],
  }
}
