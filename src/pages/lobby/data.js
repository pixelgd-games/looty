import { supabase } from "/src/lib/supabaseClient.js"

const PUBLIC_GAME_FIELDS = "id, slug, name, type, supports_live, thumbnail, created_at, sort_order"

export async function fetchPublicGames() {
  const { data, error } = await supabase
    .from("public_games_v1")
    .select(PUBLIC_GAME_FIELDS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return data || []
}
