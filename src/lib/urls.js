const ROOT_RELATIVE_PATH = /^\/(?!\/)/
const HTTP_URL = /^https?:\/\//i

export function normalizeLaunchUrl(rawValue) {
  const value = String(rawValue || "").trim()
  if (!value) return ""

  if (ROOT_RELATIVE_PATH.test(value)) {
    try {
      const url = new URL(value, getBaseOrigin())
      return `${url.pathname}${url.search}${url.hash}`
    } catch {
      return ""
    }
  }

  if (!HTTP_URL.test(value)) {
    return ""
  }

  try {
    const url = new URL(value)
    return url.href
  } catch {
    return ""
  }
}

function getBaseOrigin() {
  return globalThis.location?.origin || "http://localhost"
}
