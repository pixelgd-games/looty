import { supabase } from "../lib/supabaseClient.js"

export async function loginMember({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || ""),
  })

  if (error) {
    throw new Error("Login failed: " + error.message)
  }

  const session = data.session ?? (await getCurrentMemberSession())

  if (!session?.user) {
    throw new Error("Login failed: member session was not returned.")
  }

  const player = await ensureMyPlayer()
  return { session, player }
}

export async function registerMember({ displayName, email, password }) {
  const trimmedDisplayName = String(displayName || "").trim()
  const { data, error } = await supabase.auth.signUp({
    email: String(email || "").trim(),
    password: String(password || ""),
    options: {
      data: trimmedDisplayName ? { display_name: trimmedDisplayName } : undefined,
    },
  })

  if (error) {
    throw new Error("Registration failed: " + error.message)
  }

  if (!data.session?.user) {
    return {
      needsEmailVerification: true,
      session: null,
      player: null,
    }
  }

  const player = await ensureMyPlayer()

  return {
    needsEmailVerification: false,
    session: data.session,
    player,
  }
}

export async function signOutMember() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error("Sign out failed: " + error.message)
  }
}

export async function getCurrentMemberSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error("Failed to read member session: " + error.message)
  }

  return session
}

export async function ensureMyPlayer() {
  const { data, error } = await supabase.rpc("ensure_my_player_v1")

  if (error) {
    throw new Error("Failed to initialize member profile: " + error.message)
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row?.player_id) {
    throw new Error("Failed to initialize member profile: RPC did not return player_id.")
  }

  return row
}
