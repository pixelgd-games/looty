import { supabase } from "/src/lib/supabaseClient.js"

const PUBLIC_GAME_FIELDS = "id, slug, name, type, supports_live, thumbnail, created_at, sort_order"

const LOCAL_SHOWCASE_GAMES = [
  {
    id: "local-demo-slot",
    slug: "demo-slot",
    name: "Demo Slot",
    type: "slot",
    supports_live: false,
    thumbnail: "",
    created_at: null,
    sort_order: 999,
    url: "/game/demo-slot/",
  },
]

export async function fetchPublicGames() {
  const { data, error } = await supabase
    .from("public_games_v1")
    .select(PUBLIC_GAME_FIELDS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return mergeLocalShowcaseGames(data || [])
}

function mergeLocalShowcaseGames(games) {
  const existingSlugs = new Set(games.map((game) => game.slug).filter(Boolean))
  const localGames = LOCAL_SHOWCASE_GAMES.filter((game) => !existingSlugs.has(game.slug))

  return [...games, ...localGames]
}
