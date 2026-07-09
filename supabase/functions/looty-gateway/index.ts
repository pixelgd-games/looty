type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type CreateSessionRow = {
  session_id: string
  player_account_id: string
  wallet_account_id: string
  game_id: string
  launch_token: string
  account_type: string
  currency: string
  expires_at: string
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const DEFAULT_ALLOWED_ORIGINS = [
  "https://looty-git.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]

const allowedOrigins = (Deno.env.get("LOOTY_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

if (allowedOrigins.length === 0) {
  allowedOrigins.push(...DEFAULT_ALLOWED_ORIGINS)
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin")
  const corsHeaders = buildCorsHeaders(origin)

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: isOriginAllowed(origin) ? 204 : 403,
      headers: corsHeaders,
    })
  }

  if (!isOriginAllowed(origin)) {
    return jsonResponse({ error: "Origin is not allowed" }, 403, corsHeaders)
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, {
      ...corsHeaders,
      Allow: "POST, OPTIONS",
    })
  }

  const route = getRoute(request.url)

  if (route !== "create-session") {
    return jsonResponse({ error: "Route not found" }, 404, corsHeaders)
  }

  return createSession(request, corsHeaders)
})

async function createSession(request: Request, headers: HeadersInit): Promise<Response> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Gateway is not configured" }, 500, headers)
  }

  const body = await readJsonBody(request)

  if (!body.ok) {
    return jsonResponse({ error: body.error }, 400, headers)
  }

  const slug = typeof body.value.slug === "string" ? body.value.slug.trim() : ""
  const currency = typeof body.value.currency === "string" ? body.value.currency.trim().toUpperCase() : "POINT"
  const expiresInSeconds = normalizeInteger(body.value.expires_in_seconds, 3600)
  const displayName = typeof body.value.display_name === "string" ? body.value.display_name.trim() : null

  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return jsonResponse({ error: "Invalid game slug" }, 400, headers)
  }

  if (!/^[A-Z0-9_]{1,16}$/.test(currency)) {
    return jsonResponse({ error: "Invalid currency" }, 400, headers)
  }

  if (expiresInSeconds < 60 || expiresInSeconds > 86400) {
    return jsonResponse({ error: "Invalid session expiry" }, 400, headers)
  }

  const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_game_session`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_game_slug: slug,
      p_currency: currency,
      p_expires_in_seconds: expiresInSeconds,
      p_display_name: displayName || null,
    }),
  })

  const rpcBody = await readResponseJson(rpcResponse)

  if (!rpcResponse.ok) {
    return jsonResponse(toPublicRpcError(rpcBody), statusFromRpcError(rpcBody), headers)
  }

  const row = Array.isArray(rpcBody) ? rpcBody[0] as CreateSessionRow | undefined : undefined

  if (!row?.session_id || !row.launch_token) {
    return jsonResponse({ error: "Gateway returned an empty session" }, 502, headers)
  }

  return jsonResponse({
    session_id: row.session_id,
    game_id: row.game_id,
    player_account_ref: row.player_account_id,
    launch_token: row.launch_token,
    account_type: row.account_type,
    currency: row.currency,
    expires_at: row.expires_at,
  }, 200, headers)
}

function getRoute(url: string): string {
  const pathname = new URL(url).pathname
  const parts = pathname.split("/").filter(Boolean)
  const last = parts[parts.length - 1] ?? ""

  if (last === "looty-gateway") {
    return "create-session"
  }

  return last
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  }

  if (isOriginAllowed(origin) && origin) {
    headers["Access-Control-Allow-Origin"] = origin
  }

  return headers
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return true
  }

  if (allowedOrigins.includes(origin)) {
    return true
  }

  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
}

function jsonResponse(payload: JsonValue, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers,
  })
}

async function readJsonBody(request: Request): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string }
> {
  try {
    const value = await request.json()

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { ok: false, error: "JSON body must be an object" }
    }

    return { ok: true, value: value as Record<string, unknown> }
  } catch {
    return { ok: false, error: "Invalid JSON body" }
  }
}

async function readResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeInteger(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value)
  }

  return fallback
}

function statusFromRpcError(error: unknown): number {
  if (!error || typeof error !== "object") {
    return 502
  }

  const code = "code" in error ? error.code : null

  if (code === "22023") {
    return 400
  }

  if (code === "P0002") {
    return 404
  }

  if (code === "P0001") {
    return 409
  }

  return 502
}

function toPublicRpcError(error: unknown): { error: string } {
  if (!error || typeof error !== "object") {
    return { error: "Gateway RPC failed" }
  }

  const message = "message" in error && typeof error.message === "string"
    ? error.message
    : "Gateway RPC failed"

  return { error: message }
}
