import { supabase } from "../lib/supabaseClient.js"

export async function loginMember({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email || "").trim(),
    password: String(password || ""),
  })

  if (error) {
    throw new Error("登入失敗：" + error.message)
  }

  const session = data.session ?? (await getCurrentMemberSession())

  if (!session?.user) {
    throw new Error("登入失敗：沒有取得會員 session")
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
    throw new Error("註冊失敗：" + error.message)
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
    throw new Error("登出失敗：" + error.message)
  }
}

export async function getCurrentMemberSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error("讀取會員狀態失敗：" + error.message)
  }

  return session
}

export async function ensureMyPlayer() {
  const { data, error } = await supabase.rpc("ensure_my_player_v1")

  if (error) {
    throw new Error("會員資料初始化失敗：" + error.message)
  }

  const row = Array.isArray(data) ? data[0] : data

  if (!row?.player_id) {
    throw new Error("會員資料初始化失敗：RPC 沒有回傳 player_id")
  }

  return row
}
