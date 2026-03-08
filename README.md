{
  "project": "Looty",
  "version": "v0",
  "updated_at": "2026-03-08",
  "purpose": "給新對話快速接手 Looty 目前進度、資料夾結構、路由、已完成與未完成項目。",
  "positioning": {
    "description": "HTML5 game lobby platform。Looty 提供遊戲入口、遊戲路由、Admin 後台、未來玩家系統。遊戲本體直接放在 Looty 的 public/game/<slug>/index.html。",
    "current_focus": "先完成 Looty 平台與第一個完整遊戲流程，其他引擎整合放後面。"
  },
  "tech_stack": {
    "frontend": "Vanilla JS + Vite",
    "database": "Supabase",
    "auth": "Supabase Auth",
    "api_client": "supabase-js",
    "hosting": "Cloudflare Pages"
  },
  "important_rules": [
    "不要用 React / Vue / Next.js",
    "Vite 只作為 build tool",
    "前端最終輸出為 static files",
    "所有平台資料來自 Supabase",
    "只要有 npm module import，就必須用 Vite dev server，不可用 Live Server 或直接開 HTML"
  ],
  "current_progress_percent": {
    "looty_overall": 70,
    "admin": 90
  },
  "current_status": {
    "completed": [
      "Lobby prototype 可跑",
      "Supabase 已連線",
      "games table 已可讀取",
      "/game?slug=<slug> Router 已可運作",
      "遊戲可從 /public/game/<slug>/index.html 載入",
      "Admin Login（Google OAuth）完成",
      "admin_users 白名單檢查完成",
      "Admin Games List 完成",
      "Create Game 完成",
      "Edit Game 完成",
      "Delete Game 完成",
      "Lobby / 靜態遊戲連結完成"
    ],
    "pending": [
      "Lobby UI 優化",
      "玩家登入系統",
      "players / player_balances 串接",
      "Cloudflare Pages 部署",
      "Admin 手機版排版優化（延後）"
    ]
  },
  "routes": {
    "lobby": "/",
    "game_loader": "/game?slug=<slug>",
    "admin_login": "/admin/login/",
    "admin_games": "/admin/games/",
    "admin_games_new": "/admin/games/new/",
    "admin_games_edit": "/admin/games/edit/?id=<uuid>"
  },
  "database": {
    "tables": {
      "games": {
        "columns": [
          "id",
          "name",
          "slug",
          "thumbnail",
          "type",
          "supports_live",
          "published",
          "created_at"
        ]
      },
      "players": {
        "status": "planned"
      },
      "player_balances": {
        "status": "planned"
      },
      "admin_users": {
        "columns": [
          "id",
          "email",
          "created_at"
        ],
        "current_rule": "目前以 email 白名單判斷 admin",
        "future_upgrade": "之後改用 Supabase auth user_id"
      },
      "access_whitelist": {
        "status": "planned"
      }
    },
    "views": {
      "public_games_v1": "Lobby 使用的 public read-only games list"
    }
  },
  "repository_structure": {
    "looty": {
      "index.html": "Lobby 入口",
      "game": {
        "index.html": "Game loader page，依 slug 載入 public/game/<slug>/index.html"
      },
      "admin": {
        "login": {
          "index.html": "Admin 登入頁"
        },
        "games": {
          "index.html": "Games 管理首頁",
          "new": {
            "index.html": "新增遊戲頁"
          },
          "edit": {
            "index.html": "編輯遊戲頁"
          }
        }
      },
      "src": {
        "main.js": "Lobby 入口腳本",
        "lib": {
          "supabaseClient.js": "統一建立 supabase client"
        },
        "admin": {
          "auth.js": "Google 登入 / 登出 / admin 白名單檢查",
          "games.js": "Games 列表顯示 / 編輯連結 / 刪除",
          "game-form.js": "Create / Edit game 共用表單邏輯"
        },
        "pages": {
          "lobby": {
            "lobby.js": "renderLobby()",
            "grid.js": "bindLobbyEvents() / initLobbyGames()"
          }
        },
        "styles": {
          "lobby.css": "Lobby 樣式"
        }
      },
      "public": {
        "game": {
          "<slug>": {
            "index.html": "單一遊戲入口檔"
          }
        }
      }
    }
  },
  "key_files": {
    "src/lib/supabaseClient.js": {
      "purpose": "唯一 Supabase client 來源",
      "important_note": "其他檔案都只能 import 這個，不要直接在 HTML 或其他 JS 裡 import @supabase/supabase-js"
    },
    "src/admin/auth.js": {
      "purpose": "Admin login flow",
      "flow": [
        "Google OAuth 登入",
        "取得 session",
        "讀取 session.user.email",
        "查 admin_users 是否有這個 email",
        "有則進 /admin/games/",
        "沒有則 signOut"
      ]
    },
    "src/admin/games.js": {
      "purpose": "Games 管理列表",
      "functions": [
        "讀取 games table",
        "顯示列表",
        "編輯連結",
        "Lobby 連結",
        "靜態遊戲連結",
        "刪除遊戲"
      ]
    },
    "src/admin/game-form.js": {
      "purpose": "新增 / 編輯遊戲共用邏輯",
      "functions": [
        "依 query id 載入遊戲",
        "slug 基本防呆",
        "Create game",
        "Update game",
        "成功後導回 /admin/games/"
      ]
    },
    "game/index.html": {
      "purpose": "依 slug 載入對應 public/game/<slug>/index.html"
    }
  },
  "admin_tested_flow": [
    "進入 /admin/login/",
    "Google 登入",
    "白名單檢查通過",
    "跳到 /admin/games/",
    "可新增遊戲",
    "可編輯遊戲",
    "可刪除遊戲"
  ],
  "game_loader_flow": [
    "玩家進入 Lobby",
    "選擇遊戲",
    "前往 /game?slug=<slug>",
    "Game loader 載入 /public/game/<slug>/index.html"
  ],
  "important_notes": [
    "現在正式使用的 admin 路由是 /admin/games/new/ 與 /admin/games/edit/?id=<uuid>",
    "不要再使用舊路徑 /admin/game-new.html 與 /admin/game-edit.html",
    "若看到 Failed to resolve module specifier '@supabase/supabase-js'，通常代表不是用 Vite dev server 開啟",
    "正確本機開法是 npm run dev，然後進 http://localhost:5173/"
  ],
  "remembered_later_items": [
    "Admin 手機版排版優化之後再做",
    "刪除遊戲後改 DOM 更新，不再 location.reload()",
    "admin_users 白名單改為 Supabase auth user_id"
  ],
  "next_recommended_steps": [
    "Cloudflare Pages 部署 looty-lobby",
    "Cloudflare Pages 部署 looty-admin",
    "做第一個正式可玩遊戲",
    "之後再接玩家系統"
  ]
}