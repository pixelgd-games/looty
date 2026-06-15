import { existsSync } from "node:fs"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawn, spawnSync } from "node:child_process"
import net from "node:net"
import { fileURLToPath } from "node:url"

const cwd = fileURLToPath(new URL("..", import.meta.url))
const host = "127.0.0.1"

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm"
const viteBin = path.join(cwd, "node_modules", ".bin", process.platform === "win32" ? "vite.cmd" : "vite")

let devServer
let browser

try {
  console.log("Running build...")
  runBuild()

  const appPort = await getFreePort()
  const cdpPort = await getFreePort()
  console.log(`Starting Vite on ${appPort}...`)
  devServer = startDevServer(appPort)
  await waitForHttp(`http://${host}:${appPort}/`)

  const browserPath = findBrowser()
  console.log(`Starting browser on ${cdpPort}...`)
  browser = await startBrowser(browserPath, cdpPort)
  const client = await openBrowserClient(cdpPort)

  await enableBrowserDomains(client)

  await expectPageText(client, appPort, "/", (text) => {
    const normalizedText = text.toLowerCase()
    return normalizedText.includes("looty")
      && normalizedText.includes("game list")
      && normalizedText.includes("featured games")
      && normalizedText.includes("popular")
      && normalizedText.includes("lord of gomoku")
  }, "Home loads")

  await expectPageText(client, appPort, "/game/", (text) => {
    return text.includes("LOOTY-GAME-001")
  }, "Loader missing slug shows error")

  await expectPageText(client, appPort, "/admin/login/", (text) => {
    return text.includes("Looty Admin") && text.includes("Google")
  }, "Admin login loads")

  await showSyntheticError(client)
  await waitForText(client, (text) => {
    return text.includes("LOOTY-SMOKE-001") && text.includes("Smoke test error modal")
  }, "Shared error modal shows code")

  client.ws.close()
  console.log("Smoke check passed.")
} finally {
  stopProcess(browser)
  stopProcess(devServer)
}

function runBuild() {
  const result = spawnSync(npmCmd, ["run", "build"], {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`Build failed with status ${result.status}.`)
  }
}

function startDevServer(port) {
  const server = spawn(viteBin, [
    "--host",
    host,
    "--port",
    String(port),
    "--strictPort",
  ], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  })

  server.stdout.on("data", (chunk) => {
    process.stdout.write(chunk)
  })
  server.stderr.on("data", (chunk) => {
    process.stderr.write(chunk)
  })

  return server
}

async function startBrowser(browserPath, cdpPort) {
  const profile = await mkdtemp(path.join(tmpdir(), "looty-smoke-browser-"))
  const instance = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ], {
    stdio: "ignore",
    shell: false,
  })

  await waitForHttp(`http://${host}:${cdpPort}/json/version`)
  return instance
}

async function openBrowserClient(cdpPort) {
  let response = await fetchWithTimeout(`http://${host}:${cdpPort}/json/new?${encodeURIComponent("about:blank")}`, {
    method: "PUT",
  })

  if (!response.ok) {
    response = await fetchWithTimeout(`http://${host}:${cdpPort}/json/new?${encodeURIComponent("about:blank")}`)
  }

  if (!response.ok) {
    throw new Error(`Cannot create browser target: ${response.status}`)
  }

  const target = await response.json()
  const ws = new WebSocket(target.webSocketDebuggerUrl)

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true })
    ws.addEventListener("error", reject, { once: true })
  })

  let id = 0
  const pending = new Map()

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return

    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)

    if (message.error) {
      reject(new Error(message.error.message))
    } else {
      resolve(message.result || {})
    }
  })

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const callId = ++id
      pending.set(callId, { resolve, reject })
      ws.send(JSON.stringify({ id: callId, method, params }))
    })
  }

  return { ws, send }
}

async function enableBrowserDomains(client) {
  await client.send("Page.enable")
  await client.send("Runtime.enable")
}

async function expectPageText(client, appPort, route, predicate, label) {
  await client.send("Page.navigate", {
    url: `http://${host}:${appPort}${route}`,
  })

  await waitForText(client, predicate, label)
}

async function showSyntheticError(client) {
  await client.send("Runtime.evaluate", {
    awaitPromise: true,
    expression: `
      import("/src/ui/error-modal.js").then(({ showErrorModal }) => {
        showErrorModal({
          code: "LOOTY-SMOKE-001",
          title: "Smoke test error",
          message: "Smoke test error modal",
          reload: false,
        })
      })
    `,
  })
}

async function waitForText(client, predicate, label) {
  const deadline = Date.now() + 12000
  let lastText = ""

  while (Date.now() < deadline) {
    const result = await client.send("Runtime.evaluate", {
      returnByValue: true,
      expression: "document.body ? document.body.innerText : ''",
    })

    lastText = result.result.value || ""
    if (predicate(lastText)) {
      console.log(`OK ${label}`)
      return lastText
    }

    await sleep(250)
  }

  throw new Error(`${label} failed. Last text: ${lastText.slice(0, 300)}`)
}

async function waitForHttp(url) {
  const deadline = Date.now() + 12000

  while (Date.now() < deadline) {
    try {
      const response = await fetchWithTimeout(url)
      if (response.ok) return
    } catch {
      // Retry until server/browser is ready.
    }

    await sleep(250)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.unref()
    server.on("error", reject)
    server.listen(0, host, () => {
      const address = server.address()
      server.close(() => resolve(address.port))
    })
  })
}

function findBrowser() {
  const candidates = [
    process.env.SMOKE_BROWSER_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate
  }

  throw new Error("Smoke check needs Chrome or Edge. Set SMOKE_BROWSER_PATH to a Chromium browser executable.")
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stopProcess(child) {
  if (!child?.pid) return

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    })
    return
  }

  child.kill("SIGTERM")
}
