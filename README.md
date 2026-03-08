{
  "project": "Looty",
  "version": "v0",
  "updated_at": "2026-03-08",
  "purpose": "給新對話或下一個 AI 快速接手 Looty 目前的專案狀態、資料夾結構、部署方式、登入設定、已完成與未完成項目。",
  "positioning": {
    "description": "HTML5 game lobby platform。Looty 提供遊戲入口、Lobby、Game Loader、Admin 後台，作為後續玩家系統與其他引擎串接的入口平台。",
    "current_focus": "先完成 Looty 平台本體與第一個完整雲端可用版本。其他引擎整合放後面。",
    "responsibilities": [
      "Lobby 顯示可開放遊戲",
      "Game Loader 依 slug 載入遊戲",
      "Admin Login",
      "Admin Games 管理",
      "可開放遊戲白名單控制"
    ],
    "non_responsibilities": [
      "遊戲本體邏輯",
      "即時同步",
      "多人房間",
      "機率裁決",
      "經濟結算"
    ]
  },
  "tech_stack": {
    "frontend": "Vanilla JS + Vite",
    "database": "Supabase",
    "auth": "Supabase Auth + Google OAuth",
    "api_client": "supabase-js",
    "hosting": "Cloudflare Pages",
    "repository": "GitHub"
  },
  "important_rules": [
    "不要用 React / Vue / Next.js",
    "Vite 只作為 build tool",
    "前端最終輸出為 static files",
    "所有平台資料來自 Supabase",
    "只要有 npm module import，就必須用 Vite dev server，不可用 Live Server 或直接開 HTML",
    "Lobby 與 Game Loader 都要受 enabled-games 白名單控制",
    "目前部署可用版本是手動上傳 dist，不是 Git 自動部署"
  ],
  "current_status": {
    "summary": "Looty 已進入可用雲端版。前台與後台都已上線並可使用。",
    "progress_percent": {
      "looty_lobby": 85,
      "looty_admin": 90,
      "looty_deployment": 80,
      "looty_overall": 85
    },
    "phase": "Cloudflare Pages 手動部署可用版完成；Git 自動部署尚未打通。"
  },
  "completed": [
    "Lobby 已可從 public_games_v1 讀取遊戲資料",
    "Lobby 已可依主分類 / 娛樂子分類切換顯示",
    "Lobby 目前只顯示 enabled-games 白名單允許的遊戲",
    "Game Loader 已可使用 /game/?slug=<slug> 載入遊戲",
    "Game Loader 已改為查 public_games_v1，不直接查 games 正表",
    "Game Loader 已完成不存在遊戲 / 未開放遊戲擋下邏輯",
    "Game Loader 已與 enabled-games 白名單共用同一套控制",
    "enabled-games.js 已完成，採 ENABLED_GAMES 物件 + isGameEnabled() + getEnabledGameSlugs() 形式",
    "Admin Login 已完成",
    "Admin Google OAuth 已完成",
    "admin_users email 白名單檢查已完成",
    "Admin Games List 已完成",
    "新增遊戲功能已完成",
    "編輯遊戲功能已完成",
    "刪除遊戲功能已完成",
    "Cloudflare Pages 前台雲端版已上線",
    "Cloudflare Pages 後台雲端版已上線",
    "Google OAuth 雲端登入已修復",
    "Supabase Auth 雲端回跳已修復",
    "Vite 多頁 build 已完成",
    "npm run build 已驗證成功",
    "npm run preview 已驗證成功",
    "GitHub repo 已建立",
    "Looty 專案已 git init / commit / push 成功"
  ],
  "pending": [
    "Cloudflare Pages 與 GitHub 自動部署流程打通",
    "Lobby UI 優化",
    "Admin UI 優化",
    "Admin 手機版排版優化",
    "刪除遊戲後改 DOM 更新，不再 location.reload()",
    "admin_users 白名單由 email 升級為 Supabase auth user_id",
    "玩家登入系統",
    "players / player_balances 串接",
    "正式遊戲擴充時，enabled-games 白名單同步擴充",
    "部署與登入設定整理進 README / 交接文件"
  ],
  "routes": {
    "lobby": "/",
    "game_loader": "/game/?slug=<slug>",
    "admin_login": "/admin/login/",
    "admin_games": "/admin/games/",
    "admin_games_new": "/admin/games/new/",
    "admin_games_edit": "/admin/games/edit/?id=<uuid>"
  },
  "cloud_urls": {
    "site": "https://looty.pages.dev/",
    "admin_login": "https://looty.pages.dev/admin/login/",
    "admin_games": "https://looty.pages.dev/admin/games/",
    "game_loader_example": "https://looty.pages.dev/game/?slug=demo-slot"
  },
  "local_urls": {
    "vite_dev": "http://localhost:5173/",
    "local_admin_login": "http://localhost:5173/admin/login/",
    "local_admin_games": "http://localhost:5173/admin/games/",
    "local_game_loader_example": "http://localhost:5173/game/?slug=demo-slot",
    "vite_preview": "http://localhost:4173/"
  },
  "deployment": {
    "current_method": "Cloudflare Pages 手動上傳 dist",
    "current_state": "可用",
    "project_name": "looty",
    "pages_domain": "looty.pages.dev",
    "build_command": "npm run build",
    "build_output_directory": "dist",
    "manual_upload_note": "Cloudflare Pages 手動上傳目前支援單一資料夾或單一 zip。實際部署時上傳整個 dist 資料夾即可，部署後可正確對應多頁輸出結構。",
    "git_auto_deploy": {
      "status": "not_working_yet",
      "note": "GitHub repo 已建立並 push 成功，但 Cloudflare Pages 的 Git 連動匯入流程尚未成功打通。現階段不影響可用版本。"
    }
  },
  "auth_config": {
    "google_cloud": {
      "oauth_client_name": "Looty Admin",
      "client_type": "Web application",
      "authorized_javascript_origins": [
        "http://localhost:5173",
        "https://looty.pages.dev"
      ],
      "authorized_redirect_uris": [
        "https://lsazydefvnuqglultqii.supabase.co/auth/v1/callback"
      ]
    },
    "supabase_auth": {
      "site_url": "http://localhost:5173",
      "redirect_urls": [
        "http://localhost:5173/admin/login/",
        "https://looty.pages.dev/admin/login/"
      ],
      "important_note": "雲端後台登入問題已透過補上 https://looty.pages.dev/admin/login/ 修復。"
    },
    "admin_auth_flow": [
      "進入 /admin/login/",
      "點用 Google 登入",
      "Google OAuth 完成",
      "Supabase 取得 session",
      "以 session.user.email 查 admin_users 白名單",
      "若通過則進 /admin/games/",
      "若不通過則 signOut"
    ]
  },
  "database": {
    "tables": {
      "games": {
        "status": "in_use",
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
      "admin_users": {
        "status": "in_use",
        "columns": [
          "id",
          "email",
          "created_at"
        ],
        "current_rule": "目前以 email 白名單判斷 admin",
        "future_upgrade": "之後改用 Supabase auth user_id"
      },
      "players": {
        "status": "planned"
      },
      "player_balances": {
        "status": "planned"
      },
      "access_whitelist": {
        "status": "planned"
      }
    },
    "views": {
      "public_games_v1": {
        "status": "in_use",
        "purpose": "Lobby 與 Game Loader 使用的 public read-only games list"
      }
    }
  },
  "game_access_control": {
    "current_enabled_games": [
      "demo-slot"
    ],
    "blocked_example": [
      "demo-fish"
    ],
    "logic": [
      "Lobby 只顯示 enabled-games 白名單中的 slug",
      "Game Loader 先檢查 slug 是否在白名單內",
      "白名單內才繼續查 public_games_v1",
      "若不在白名單或查不到資料，就顯示 game not found"
    ]
  },
  "repository": {
    "github_owner": "pixelgd-games",
    "github_repo": "looty",
    "default_branch": "main",
    "remote_origin": "https://github.com/pixelgd-games/looty.git",
    "current_state": "push successful"
  },
  "project_structure": {
    "root": {
      "index.html": "Lobby 入口頁",
      "vite.config.js": "Vite 多頁 build 設定",
      "package.json": "npm scripts 與 dependencies",
      "package-lock.json": "npm lock file",
      "README.md": "待補完整交接內容",
      ".gitignore": "git ignore 設定"
    },
    "admin": {
      "login/index.html": "Admin Login 頁",
      "games/index.html": "Admin Games 管理首頁",
      "games/new/index.html": "新增遊戲頁",
      "games/edit/index.html": "編輯遊戲頁"
    },
    "game": {
      "index.html": "Game Loader 頁，依 slug 載入對應遊戲"
    },
    "public": {
      "game/demo-slot/index.html": "目前已存在的 demo-slot 靜態遊戲頁"
    },
    "src": {
      "main.js": "Lobby 入口腳本",
      "lib/supabaseClient.js": "唯一 Supabase client 來源",
      "config/enabled-games.js": "可開放遊戲白名單控制",
      "admin/auth.js": "Google OAuth / admin 白名單檢查 / signOut",
      "admin/games.js": "Games 列表 / 編輯 / 靜態連結 / 刪除",
      "admin/game-form.js": "新增 / 編輯遊戲共用表單邏輯",
      "pages/lobby/lobby.js": "renderLobby()",
      "pages/lobby/grid.js": "Lobby 讀資料、過濾、render、點擊事件",
      "styles/lobby.css": "Lobby 樣式"
    },
    "dist": {
      "status": "build_output_only",
      "note": "部署產物，不是原始碼來源"
    }
  },
  "key_files": {
    "vite.config.js": {
      "purpose": "Vite 多頁 build 設定",
      "important_note": "必須保留多頁 input，否則 build / preview 會只打包根首頁，/game 與 /admin 路由會失效。"
    },
    "src/config/enabled-games.js": {
      "purpose": "控制可開放遊戲白名單",
      "current_format": "ENABLED_GAMES object + isGameEnabled() + getEnabledGameSlugs()"
    },
    "game/index.html": {
      "purpose": "Game Loader",
      "important_logic": [
        "從 URL 讀 slug",
        "先檢查白名單",
        "再查 public_games_v1",
        "存在才載入 /game/<slug>/index.html",
        "不存在則顯示 game not found"
      ]
    },
    "src/admin/auth.js": {
      "purpose": "Admin 登入流程",
      "flow": [
        "Google OAuth 登入",
        "取得 session",
        "檢查 admin_users",
        "通過則進 /admin/games/"
      ]
    },
    "src/admin/games.js": {
      "purpose": "Games 後台管理列表",
      "functions": [
        "讀 games table",
        "顯示列表",
        "編輯連結",
        "Lobby 連結",
        "靜態遊戲連結",
        "刪除遊戲"
      ]
    },
    "src/admin/game-form.js": {
      "purpose": "Create / Edit game 共用表單邏輯",
      "functions": [
        "依 id 載入遊戲資料",
        "slug 基本防呆",
        "Create game",
        "Update game",
        "成功後導回 /admin/games/"
      ]
    }
  },
  "verified_flows": {
    "local_dev": [
      "http://localhost:5173/ 可正常開啟 Lobby",
      "Lobby 可看到 Demo Slot",
      "點擊 Demo Slot 可進 /game/?slug=demo-slot",
      "Game Loader 可正常顯示 Demo Slot Game",
      "http://localhost:5173/admin/login/ 可登入",
      "http://localhost:5173/admin/games/ 可管理遊戲"
    ],
    "local_preview": [
      "npm run build 成功",
      "npm run preview 成功",
      "http://localhost:4173/ 可正常開啟",
      "http://localhost:4173/game/?slug=demo-slot 可正常顯示"
    ],
    "cloud_pages": [
      "https://looty.pages.dev/ 可正常開啟 Lobby",
      "https://looty.pages.dev/game/?slug=demo-slot 可正常顯示 Demo Slot Game",
      "https://looty.pages.dev/admin/login/ 可正常顯示登入頁",
      "https://looty.pages.dev/admin/games/ 雲端登入後可正常管理"
    ]
  },
  "known_issues": [
    {
      "title": "Cloudflare Pages Git 自動部署尚未打通",
      "status": "open",
      "impact": "目前只能手動上傳 dist 部署",
      "workaround": "使用 Cloudflare Pages 的 Drag and drop your files，上傳整個 dist 資料夾"
    },
    {
      "title": "後台畫面仍為很簡單的原始樣式",
      "status": "known",
      "impact": "功能不受影響，但 UI 尚未優化"
    },
    {
      "title": "Admin delete 仍使用 location.reload()",
      "status": "known",
      "impact": "UX 較差，但功能正常"
    }
  ],
  "removed_or_should_not_keep": [
    {
      "item": "client_secret_706...json",
      "status": "removed",
      "note": "不應留在前端專案中"
    }
  ],
  "next_recommended_steps": [
    "把本次部署與 OAuth / Supabase 設定整理進 README",
    "補做 Admin 雲端版新增 / 編輯 / 刪除完整再驗證一次",
    "之後再回頭處理 Cloudflare Pages 與 GitHub 自動部署",
    "再進行 Lobby / Admin UI 優化",
    "再開始擴充更多正式遊戲"
  ],
  "handoff_note": {
    "for_next_ai": [
      "Looty 已有可用雲端版，不要再從零開始判斷部署方式",
      "目前最重要的是維持現有可用狀態，不要先大改架構",
      "Cloudflare Pages 現在採手動上傳 dist，不是 Git 自動部署",
      "Google OAuth 與 Supabase Auth 雲端回跳問題已解掉，請沿用目前設定",
      "enabled-games 白名單是目前保護遊戲可見性與可進入性的關鍵機制",
      "若新增遊戲，除了資料庫 published 外，也必須同步更新 enabled-games.js"
    ]
  }
}