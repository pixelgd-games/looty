import assert from "node:assert/strict"

const originalFetch = globalThis.fetch

globalThis.Deno = {
  env: {
    get(name) {
      return {
        SUPABASE_URL: "https://supabase.example",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
        SUPABASE_ANON_KEY: "anon-key",
      }[name]
    },
  },
  serve() {},
}

try {
  const { callRpc, resolveAuthUser } = await import("../supabase/functions/looty-gateway/index.ts")

  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      throw new DOMException("Timed out", "AbortError")
    },
  })

  const authResult = await resolveAuthUser(new Request("https://gateway.example/create-session", {
    headers: {
      apikey: "anon-key",
      authorization: "Bearer member-token",
    },
  }))
  assert.deepEqual(authResult, {
    ok: false,
    error: "Gateway authentication is unavailable",
    status: 503,
  })

  const rpcResult = await callRpc("test_rpc", {})
  assert.equal(rpcResult.ok, false)
  assert.deepEqual(rpcResult.body, {
    code: "LOOTY_UPSTREAM_UNAVAILABLE",
    message: "Gateway upstream request failed",
  })

  globalThis.fetch = async () => ({
    ok: false,
    json: async () => {
      throw new Error("Auth error body should not be read")
    },
  })

  const invalidAuthResult = await resolveAuthUser(new Request("https://gateway.example/create-session", {
    headers: {
      apikey: "anon-key",
      authorization: "Bearer invalid-token",
    },
  }))
  assert.deepEqual(invalidAuthResult, {
    ok: false,
    error: "User session is not valid",
    status: 401,
  })

  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ id: "user-1" }),
  })

  const validAuthResult = await resolveAuthUser(new Request("https://gateway.example/create-session", {
    headers: {
      apikey: "anon-key",
      authorization: "Bearer valid-token",
    },
  }))
  assert.deepEqual(validAuthResult, {
    ok: true,
    userId: "user-1",
  })

  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [{ result: "ok" }],
  })

  const successfulRpcResult = await callRpc("test_rpc", {})
  assert.deepEqual(successfulRpcResult, {
    ok: true,
    body: [{ result: "ok" }],
  })

  console.log("Gateway unit check passed.")
} finally {
  globalThis.fetch = originalFetch
  delete globalThis.Deno
}
