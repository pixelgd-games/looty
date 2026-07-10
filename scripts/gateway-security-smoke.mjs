import assert from "node:assert/strict"
import crypto from "node:crypto"

const gatewayUrl = (process.env.GATEWAY_URL || "https://lsazydefvnuqglultqii.supabase.co/functions/v1/looty-gateway").replace(/\/+$/, "")
const gameSlug = process.env.GATEWAY_GAME_SLUG || "color-guess"
const lootyOrigin = process.env.GATEWAY_LOOTY_ORIGIN || "https://looty-git.pages.dev"
const gameOrigin = process.env.GATEWAY_GAME_ORIGIN || "https://game-smoke.example"
const isProduction = gatewayUrl.includes("lsazydefvnuqglultqii.supabase.co")

if (isProduction && process.env.ALLOW_PRODUCTION_GATEWAY_SMOKE !== "1") {
  throw new Error("Set ALLOW_PRODUCTION_GATEWAY_SMOKE=1 to run against the Looty production Gateway.")
}

const runId = crypto.randomUUID()

const blocked = await post("create-session", {
  slug: gameSlug,
  currency: "POINT",
}, "https://not-looty.example")
assert.equal(blocked.status, 403, "create-session must reject an unapproved origin")

const sessionA = await createSession()
const sessionB = await createSession()
const exchangeA = await exchange(sessionA.launch_code)
const exchangeB = await exchange(sessionB.launch_code)

const reusedCode = await post("exchange", {
  launch_code: sessionA.launch_code,
})
assert.equal(reusedCode.status, 404, "launch code must be single-use")

const invalidToken = await post("balance", {
  gateway_token: "invalid-gateway-token",
})
assert.equal(invalidToken.status, 404, "invalid gateway token must be rejected")

const oversizedBody = await fetch(`${gatewayUrl}/balance`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: gameOrigin,
  },
  body: JSON.stringify({ gateway_token: "invalid", padding: "x".repeat(17 * 1024) }),
})
assert.equal(oversizedBody.status, 400, "oversized JSON body must be rejected")

const balance = await post("balance", {
  gateway_token: exchangeA.gateway_token,
})
assert.equal(balance.status, 200, "valid gateway token must read balance")

const sharedRoundId = `smoke-shared-${runId}`
const payoutKeyA = `smoke-payout-a-${runId}`
const payoutA = await wallet("payout", exchangeA.gateway_token, sharedRoundId, 100, payoutKeyA)
const payoutARepeat = await wallet("payout", exchangeA.gateway_token, sharedRoundId, 100, payoutKeyA)
assert.equal(payoutARepeat.transaction_id, payoutA.transaction_id, "idempotent retry must return the same transaction")
assert.equal(String(payoutARepeat.balance_after), String(payoutA.balance_after), "idempotent retry must keep the same balance")

const conflictingRetry = await post("payout", {
  gateway_token: exchangeA.gateway_token,
  round_id: sharedRoundId,
  amount: 101,
  idempotency_key: payoutKeyA,
  metadata: { source: "gateway-security-smoke", run_id: runId },
})
assert.equal(conflictingRetry.status, 409, "conflicting idempotency retry must be rejected")

await wallet("payout", exchangeB.gateway_token, sharedRoundId, 100, `smoke-payout-b-${runId}`)

const foreignRoundId = `smoke-foreign-${runId}`
await wallet("payout", exchangeB.gateway_token, foreignRoundId, 20, `smoke-foreign-payout-${runId}`)

const crossSessionClose = await post("close-round", {
  gateway_token: exchangeA.gateway_token,
  round_id: foreignRoundId,
})
assert.equal(crossSessionClose.status, 404, "a session must not close another session's round")

const ownerClose = await post("close-round", {
  gateway_token: exchangeB.gateway_token,
  round_id: foreignRoundId,
})
assert.equal(ownerClose.status, 200, "the owning session must close its round")

const betRoundId = `smoke-bet-${runId}`
await wallet("bet", exchangeA.gateway_token, betRoundId, 10, `smoke-bet-${runId}`)

const closeBet = await post("close-round", {
  gateway_token: exchangeA.gateway_token,
  round_id: betRoundId,
})
assert.equal(closeBet.status, 200, "an open round must close successfully")

if (process.env.TEST_GATEWAY_RATE_LIMIT === "1") {
  let limited = false

  for (let index = 0; index < 35; index += 1) {
    const response = await post("create-session", {
      slug: "",
      currency: "POINT",
    }, lootyOrigin)

    if (response.status === 429) {
      limited = true
      break
    }
  }

  assert.equal(limited, true, "create-session rate limit must return 429")
}

console.log("Gateway security smoke passed.")

async function createSession() {
  const response = await post("create-session", {
    slug: gameSlug,
    currency: "POINT",
    expires_in_seconds: 3600,
  }, lootyOrigin)

  return expectSuccess(response, "create-session")
}

async function exchange(launchCode) {
  const response = await post("exchange", {
    launch_code: launchCode,
  })

  return expectSuccess(response, "exchange")
}

async function wallet(route, gatewayToken, roundId, amount, idempotencyKey) {
  const response = await post(route, {
    gateway_token: gatewayToken,
    round_id: roundId,
    amount,
    idempotency_key: idempotencyKey,
    metadata: { source: "gateway-security-smoke", run_id: runId },
  })

  return expectSuccess(response, route)
}

async function post(route, body, origin = gameOrigin) {
  const response = await fetch(`${gatewayUrl}/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  })

  return {
    status: response.status,
    body: await response.json().catch(() => null),
  }
}

function expectSuccess(response, label) {
  assert.equal(response.status, 200, `${label} failed: ${JSON.stringify(response.body)}`)
  return response.body
}
