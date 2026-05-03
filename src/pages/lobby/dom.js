export function getLobbyElements(root = document) {
  return {
    hero: root.querySelector("#hero"),
    gameGrid: root.querySelector("#gameGrid"),
    profileActions: root.querySelector("#profileActions"),
    profileAvatar: root.querySelector("#profileAvatar"),
    profileBalance: root.querySelector("#profileBalance"),
    profileName: root.querySelector("#profileName"),
    profileStatus: root.querySelector("#profileStatus"),
    authModal: root.querySelector("#authModal"),
    authModalLead: root.querySelector("#authModalLead"),
    authModalPanel: root.querySelector("#authModalPanel"),
    authModalTitle: root.querySelector("#authModalTitle"),
    authCloseButtons: [...root.querySelectorAll("[data-auth-close]")],
  }
}
