import { supabase } from "/src/lib/supabaseClient.js"
import { normalizeLaunchUrl } from "/src/lib/urls.js"
import { ERROR_CODES, showErrorModal } from "/src/ui/error-modal.js"

const params = new URLSearchParams(location.search)
const slug = params.get("slug")

function primeParentScroll() {
  if (window.scrollY > 0) return
  if (document.documentElement.scrollHeight <= window.innerHeight) return

  window.requestAnimationFrame(() => {
    window.scrollTo(0, 1)
  })
}

function showError({ code, title, message, error }) {
  document.body.replaceChildren()

  const errorBox = document.createElement("div")
  errorBox.className = "error"

  const heading = document.createElement("strong")
  heading.textContent = title

  const copy = document.createElement("div")
  copy.textContent = message

  const codeText = document.createElement("div")
  codeText.style.marginTop = "8px"
  codeText.style.opacity = ".72"
  codeText.textContent = `錯誤代碼：${code}`

  errorBox.append(heading, copy, codeText)
  document.body.append(errorBox)

  showErrorModal({
    code,
    title,
    message,
    error,
  })
}

async function main() {
  if (!slug) {
    showError({
      code: ERROR_CODES.GAME_MISSING_SLUG,
      title: "缺少遊戲代碼",
      message: "目前無法判斷要載入哪一款遊戲，請從遊戲列表重新進入。",
    })
    return
  }

  const { data, error } = await supabase
    .from("public_games_v1")
    .select("id, slug, name, launch_url")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    showError({
      code: ERROR_CODES.GAME_READ_FAILED,
      title: "遊戲資料讀取失敗",
      message: "目前無法取得遊戲資料，請稍後再試。",
      error,
    })
    return
  }

  if (!data) {
    showError({
      code: ERROR_CODES.GAME_NOT_FOUND,
      title: "找不到遊戲",
      message: "找不到指定的公開遊戲，請回到遊戲列表重新選擇。",
    })
    return
  }

  const rawGameUrl = data.launch_url?.trim()
  if (!rawGameUrl) {
    showError({
      code: ERROR_CODES.GAME_URL_MISSING,
      title: "遊戲啟動網址未設定",
      message: "這款遊戲目前缺少啟動網址，請聯絡管理員。",
    })
    return
  }

  const gameUrl = normalizeLaunchUrl(rawGameUrl)
  if (!gameUrl) {
    showError({
      code: ERROR_CODES.GAME_URL_INVALID,
      title: "遊戲啟動網址格式不支援",
      message: "這款遊戲的啟動網址格式目前無法使用，請聯絡管理員。",
    })
    return
  }

  mountGameIframe(gameUrl, data.name)
  primeParentScroll()
}

function mountGameIframe(gameUrl, gameName) {
  const gameRoot = document.getElementById("game")
  if (!gameRoot) return

  const iframe = document.createElement("iframe")
  iframe.src = gameUrl
  iframe.title = gameName || "Looty Game"
  iframe.onload = hideLoading

  gameRoot.append(iframe)
}

function hideLoading() {
  const loadingEl = document.getElementById("loading")
  if (!loadingEl) return

  loadingEl.classList.add("is-hidden")
  window.setTimeout(() => {
    loadingEl.remove()
  }, 320)
}

main().catch((error) => {
  showError({
    code: ERROR_CODES.GAME_READ_FAILED,
    title: "遊戲載入失敗",
    message: "目前無法載入遊戲，請稍後再試。",
    error,
  })
})
