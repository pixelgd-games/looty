const LOBBY_HERO_IMAGE = "/hero/looty-hero-main.webp"

export function renderLobbyHero(elements) {
  if (!elements.hero) return

  setHeroBackground(elements.hero, LOBBY_HERO_IMAGE)
}

function setHeroBackground(heroElement, thumbnail) {
  if (!thumbnail) {
    heroElement.style.removeProperty("--hero-image")
    heroElement.dataset.hasImage = "false"
    return
  }

  heroElement.style.setProperty("--hero-image", `url("${thumbnail.replaceAll('"', '\\"')}")`)
  heroElement.dataset.hasImage = "true"
}
