# Looty

Looty 是 Flash 系統裡的遊戲入口 / Lobby / 輕量 Admin 前端。

這份文件是 **目前 repo 實作真相來源**。AI 或 Codex 進來時先讀這份，不要優先相信舊對話或過時交接內容。

## 文件地圖

| 分類 | 文件 | 唯一責任 |
| --- | --- | --- |
| 核心 | `README.md` | 目前 repo 實作、資料流、部署與 DB 真相。 |
| AI | `AGENTS.md` | AI / Codex 工作規則。 |
| 產品 | `docs/product/PRODUCT_SCOPE.md` | 正式產品邊界、交付標準與下一步。 |
| 平台 | `docs/platform/GAME_PLATFORM_INTEGRATION.md` | 遊戲接 Looty 的 Platform、Gateway、Wallet 契約與雙平台共用架構。 |
| 平台 | `docs/platform/CRAZYGAMES_INTEGRATION.md` | CrazyGames Build、SDK、廣告、存檔與上架規範。 |
| 平台 | `docs/platform/FLASH.md` | Flash 大系統背景與模組責任。 |
| 營運 | `docs/operations/KNOWN_ISSUES.md` | 已確認問題、風險與處理狀態。 |
| 營運 | `docs/operations/ANALYTICS_MONITORING.md` | Analytics、監控、KPI、告警與後續施工順序。 |

目前共 8 份文件，每份只維護一種責任。新增內容時優先更新現有文件；除非出現新的獨立責任，否則不要再新增文件。

這個 repo 的程式碼仍是 Looty 平台；`docs/platform` 另外保存遊戲發布到 Looty 與 CrazyGames 的串接規範。製作遊戲的 AI 要同時讀兩份平台文件，讓同一套遊戲本體可以用不同 Platform Client 發布到兩個平台。

CrazyGames 串接只適用於非博弈遊戲。博弈相關產品只走 Looty 或另外核准的平台，不建立 CrazyGames Build。

## 專案定位

Looty 目前負責：

- 顯示公開遊戲 Lobby。
- 用 `/game/?slug=<slug>` 把玩家送進對應遊戲。
- 提供輕量 Admin 管理遊戲上架資料。
- 建立平台帳號、平台錢包、game session、game round 的 DB 骨架。

Looty 目前不負責：

- 遊戲本體玩法與前端表現。
- 修改已上架遊戲的本體 repo。
- 即時多人同步。
- 博奕結果裁決 / RNG。
- 完整會員中心 UI。
- 完整 ledger / settlement 系統。
- 讓前端直接寫玩家或錢包資料。

遊戲本體不應自己登入玩家，也不應直接改玩家餘額。細節看 `docs/platform/GAME_PLATFORM_INTEGRATION.md`。

Looty 任務中不要直接修改遊戲本體。已上架遊戲目前只會從 Loader 收到 Looty session 參數；遊戲是否要讀取這些參數，必須等使用者明確指定該遊戲接入時，再到該遊戲 repo 處理。

## 目前狀態

目前狀態：

- 技術棧是 Vanilla JS + Vite，多頁靜態站。
- Hosting 走 Cloudflare Pages，GitHub `main` 自動部署到 `looty-git`。
- Auth / Database / View 走 Looty Supabase：`lsazydefvnuqglultqii`。
- Lobby 直接讀 `public_games_v1`。
- Game Loader 用 `slug` 查 `public_games_v1`，先呼叫 `looty-gateway/create-session`，再把 Looty session 參數附加到 iframe `launch_url`。
- 目前沒有修改任何已上架遊戲本體；舊遊戲忽略 Looty query params 也應可照常顯示。
- 前台會員登入已從 Lobby 移除，首頁維持純公開遊戲入口。
- Lobby 右上角有「加入桌面」入口，搭配 PWA manifest 與 Looty app icon；目前不註冊 service worker、不做離線快取。
- Admin 使用 Google OAuth + `admin_users` email 白名單。
- Admin 可管理 `games` 的基本上架欄位。
- 前台 / Loader / Admin 共用錯誤視窗與 `LOOTY-*` 錯誤代碼。
- Repo 沒有本地 `enabled-games` 白名單，也沒有 `src/config/game-urls.js`。
- 平台骨架 migration 已套用，新增 `player_accounts`、`wallet_accounts`、`wallet_transactions`、`game_sessions`、`game_rounds`。
- 最小 game session / wallet RPC 已套用，目前只開給 `service_role`。
- Supabase Edge Function `looty-gateway` v4 已部署，支援一次性 launch code、`exchange` 與第一版 wallet endpoints。
- Loader 只把兩分鐘有效、只能使用一次的 `looty_launch_code` 傳給 iframe；遊戲以它交換最長一小時的 `gateway_token`。
- Gateway v1 已自行驗證 route、token、scope、session 與 rate limit，不把 Supabase anon key、JWT 或 service role key 傳給遊戲。
- Wallet 目前明確是 `demo` mode，只接受 `POINT`；正式金流仍要走可信任遊戲後端或外部 wallet adapter。
- 2026-07-31 已更新 PostCSS 安全版本，`npm audit`、`npm run build` 與 `npm run smoke` 通過。
- Looty 自管遊戲封面放在 `public/games/<slug>/cover.webp`，目前 `speed-rush`、`ocean-battle`、`color-guess`、`valkyrie-dragons-hoard`、`dead-county`、`ninja-four-elements`、`arrgh-hoops` 已使用。
- Lobby 已有手機橫向版面：觸控低高度橫向裝置顯示 4 欄，PC 與手機直向維持原版面。
- Looty Analytics v1.0 已完成規劃，尚未建立 Grafana、Reporting Views、Gateway health 或 Analytics event。

## 目前工作方向

現在不是重做架構或補大型功能的階段。

短期重點：

1. 保持首頁 -> Game Loader -> 遊戲啟動的主路徑穩定。
2. 用電腦版 Admin 管理遊戲上架資料。
3. 讓文件清楚分出 Looty Platform、Game、Game Gateway、Wallet Interface 的責任。
4. 讓遊戲接入 AI 依 `docs/platform/GAME_PLATFORM_INTEGRATION.md` 讀取 Looty session 參數。
5. 不先做完整會員中心、不恢復前台登入 UI、不接 Supinova、不切正式網域。

如果要改遊戲本體，必須是使用者明確指定某一款遊戲，並切到該遊戲 repo 後再做；Looty repo 不代替遊戲 repo 實作玩法、下注、派彩或 UI。

## 路由

- Lobby: `/`
- Game Loader: `/game/?slug=<slug>`
- Admin Login: `/admin/login/`
- Admin Games: `/admin/games/`
- Admin New Game: `/admin/games/new/`
- Admin Edit Game: `/admin/games/edit/?id=<uuid>`

## 手機桌面入口

Looty 可以讓使用者把網站加到手機桌面，形式接近手機 app，但目前不是 Google Play / App Store 上架 app。

- 首頁右上角顯示「加入桌面」入口。
- `public/manifest.webmanifest` 控制 app 名稱、啟動路徑、顯示模式與 icon。
- Looty app icon 放在 `public/icons/looty-app-icon-*.png`。
- App icon 使用滿版深色背景與中央符號，避免 Android PWA 啟動畫面顯示放大的內嵌圓角圖。
- 目前刻意不註冊 service worker，也不做離線快取，避免遊戲與封面更新後手機仍看到舊版本。
- 現有 Admin 只管理遊戲上架資料；平台 logo / app icon 之後若要讓後台改，應另做「平台設定」，不要塞進 games 表單。

## 主要檔案

- `index.html`: Lobby 入口。
- `game/index.html`: Game Loader HTML shell。
- `admin/login/index.html`: Admin 登入頁。
- `admin/games/index.html`: Admin 遊戲列表。
- `admin/games/new/index.html`: 新增遊戲頁。
- `admin/games/edit/index.html`: 編輯遊戲頁。
- `src/main.js`: Lobby entry。
- `src/pages/lobby/index.js`: Lobby 初始化流程。
- `src/pages/lobby/lobby.js`: Lobby HTML 結構。
- `src/pages/lobby/data.js`: 讀取 `public_games_v1`。
- `src/pages/lobby/game-grid.js`: 遊戲卡片與 empty/error state。
- `src/pages/lobby/utils.js`: Lobby 小工具。
- `src/pages/game/index.js`: Game Loader 資料讀取、錯誤處理、iframe 載入。
- `src/admin/auth.js`: Admin OAuth、session、白名單檢查。
- `src/admin/games.js`: Admin 遊戲列表、連結、刪除。
- `src/admin/game-form.js`: Admin 新增 / 編輯共用表單。
- `src/lib/supabaseClient.js`: 唯一 Supabase client。
- `src/lib/urls.js`: `launch_url` 正規化與安全格式檢查。
- `src/ui/error-modal.js`: 共用錯誤視窗與錯誤碼。
- `src/styles/theme.css`: 前台基礎樣式。
- `src/styles/lobby.css`: Lobby 樣式。
- `public/manifest.webmanifest`: 手機桌面 / PWA manifest。
- `public/icons/looty-app-icon-*.png`: Looty 手機桌面 app icon。
- `public/hero/looty-hero-main.webp`: 首頁主視覺。
- `public/games/<slug>/cover.webp`: Looty 自管遊戲封面。
- `supabase/functions/looty-gateway/index.ts`: Looty Gateway Edge Function。

## Lobby 資料流

流程：

1. `src/main.js` 呼叫 `initLobbyPage()`。
2. `src/pages/lobby/index.js` render Lobby shell。
3. `src/pages/lobby/data.js` 查 `public_games_v1`。
4. `src/pages/lobby/game-grid.js` render 遊戲卡片。

Lobby 目前不顯示分類 tabs，不做前端分類分頁，直接顯示所有公開可玩的遊戲。

Lobby 讀取欄位：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `sort_order`

`type` / `supports_live` 保留在資料模型中，但目前不作為首頁分類 UI。

## 遊戲封面規格

- 比例：`3:4`。
- 尺寸：`750 x 1000`。
- 格式：WebP。
- 路徑：`public/games/<slug>/cover.webp`。
- Admin `thumbnail` 使用 `/games/<slug>/cover.webp`。
- 遊戲商提供原圖，由 Looty 統一裁切、壓縮、存放與上架；不要把 Lobby 封面放進遊戲本體 repo。

## Game Loader 資料流

流程：

1. 從 query string 取得 `slug`。
2. 查 `public_games_v1`。
3. 取出 `launch_url`。
4. 用 `src/lib/urls.js` 檢查 URL。
5. 呼叫 `looty-gateway/create-session` 建立平台 session 與一次性 launch code。
6. 將非敏感 session 資訊與一次性 launch code 加到 iframe URL。
7. 以 iframe 載入遊戲。

Loader 會附加給遊戲的 query params：

- `looty_session_id`
- `looty_launch_code`
- `looty_game_id`
- `looty_currency`
- `looty_wallet_mode`
- `looty_gateway_url`
- `looty_exchange_url`

舊遊戲若不讀這些參數，仍可照常顯示。

`launch_url` 只接受：

- `http://...`
- `https://...`
- `/` 開頭的站內路徑，例如 `/game/<slug>/index.html`

Loader UI 現況：

- iframe 一開始就滿版，避免 loading 消失時畫面位移。
- 外層 document 保留原生 scroll。
- `#game` 用 sticky 滿版承接遊戲畫面。
- Loading overlay 可見時接住 `pan-y` 手勢，隱藏後才把觸控交回 iframe。
- iframe 初次 load 後，overlay 會淡出再移除。
- iframe 由 Looty Platform 設定 `sandbox`、`allow`、referrer policy 與全螢幕權限；不修改遊戲本體。
- 同網域遊戲採 opaque origin 隔離；跨網域遊戲只為遊戲自己的儲存需求加入 `allow-same-origin`。
- iframe 30 秒內沒有完成 `load` 時會移除，並顯示載入逾時錯誤。

Game Loader 錯誤碼：

- `LOOTY-GAME-001`: 缺少 `slug`
- `LOOTY-GAME-002`: 找不到指定遊戲
- `LOOTY-GAME-003`: 遊戲啟動網址未設定
- `LOOTY-GAME-004`: 遊戲資料讀取失敗
- `LOOTY-GAME-005`: 遊戲啟動網址格式不支援
- `LOOTY-GAME-006`: 遊戲 iframe 載入逾時

## Admin 現況

Admin auth：

- Google OAuth 登入。
- 使用 Supabase session。
- 以 `session.user.email` 查 `admin_users`。
- 不通過時拒絕進入 Admin。

Admin games：

- 直接操作 `games` table。
- 可列出、建立、編輯、刪除遊戲。
- 可設定上架狀態、啟動網址、排序。
- 目前以電腦版後台為主，手機版優化不是目前待辦。
- 遊戲列表用 DOM 建構，不用資料字串拼 `innerHTML`。
- `launch_url` 顯示前會先正規化。
- 刪除成功後局部更新列表，不整頁 reload。

Admin form：

- 新增 / 編輯共用。
- 驗證 `slug` 只能是小寫英數與 `-`。
- 驗證 `sort_order` 只能是整數或空值，空值會使用 `0`。
- 驗證 `launch_url` 只能是 `http(s)` 或 `/` 開頭站內路徑。
- 已上架遊戲必須有 `launch_url`。

目前後台可管理的 `type`：

- `slot`
- `fish`
- `card`
- `arcade`
- `casual`
- `adult`

小遊戲 / 非博弈 H5 遊戲也可以先上架測試：

- 優先使用 `casual` 或 `arcade`，不要硬塞成 `slot` / `fish`。
- `supports_live` 通常先用 `false`。
- 要出現在正式 Lobby 才設 `published = true`；只先放進 Admin 則用 `published = false`。
- 目前可維持 Demo / free-play，不接 Looty Wallet。
- 遊戲可以先忽略 Looty session query params。
- 不要把分數、獎勵、入場費或一般遊玩流程偽裝成 `bet / payout`。
- `name`、`slug`、`launch_url`、`thumbnail` 應使用正式感命名，不要帶 `dev`、`test`、`prototype` 或雛形字樣。

## 資料契約

`games` 是 Admin 管理來源，欄位：

- `id`
- `name`
- `slug`
- `thumbnail`
- `type`
- `supports_live`
- `published`
- `launch_url`
- `sort_order`
- `created_at`

`public_games_v1` 是前台公開讀取來源，欄位：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `launch_url`
- `sort_order`

目前預期 view 邏輯：

```sql
SELECT
  id,
  slug,
  name,
  type,
  supports_live,
  thumbnail,
  created_at,
  launch_url,
  sort_order
FROM games
WHERE
  published = true
  AND launch_url IS NOT NULL
  AND btrim(launch_url) <> ''
ORDER BY sort_order, created_at DESC;
```

前台讀 `public_games_v1` 時，應把資料視為已公開、可顯示、可啟動。
前台不要再自行判斷 `published`，也不要回頭引入本地白名單。

## 平台骨架 DB

2026-07-10 已套用：

- `20260709123000_drop_legacy_player_balance.sql`
- `20260709124500_drop_unused_access_settings.sql`
- `20260709170000_create_platform_account_wallet_core.sql`
- `20260710010000_create_game_session_wallet_rpc.sql`
- `20260710011000_restrict_game_session_wallet_rpc_grants.sql`
- `20260710013000_fix_wallet_rpc_variable_conflicts.sql`
- `20260710140000_secure_admin_game_access.sql`
- `20260710141000_create_gateway_v1_session_auth.sql`
- `20260710142000_bind_rounds_to_game_sessions.sql`
- `20260710143000_add_gateway_runtime_limits.sql`
- `20260710210000_grant_demo_wallet_initial_credit.sql`

本機已建立、遠端尚待使用者確認：

- `20260731171000_restrict_demo_wallet_currency.sql`

目前 public schema 包含：

- `admin_users`
- `games`
- `public_games_v1`
- `player_accounts`
- `wallet_accounts`
- `wallet_transactions`
- `game_sessions`
- `game_rounds`
- `gateway_rate_limits`

5 張平台骨架表：

- `player_accounts`: 玩家身份，Guest 和正式帳號都用這張。
- `wallet_accounts`: 玩家平台錢包，目前是一個玩家一種幣別一個 active wallet。
- `wallet_transactions`: 錢包流水，包含 `game_session_id`、`balance_before`、`balance_after`、`idempotency_key`。
- `game_sessions`: 玩家進遊戲時的平台 session，只存 launch code / gateway token hash，不存明文 credential。
- `game_rounds`: 遊戲局號，以 `game_session_id + round_id` 隔離不同玩家與 session。
- `gateway_rate_limits`: Gateway route / IP 時窗計數，只存 rate limit key hash。

目前沒有做：

- 沒有復活 `players`。
- 沒有復活 `player_balances`。
- 沒有改 `games` 或 `admin_users` 的欄位與資料。
- `games` / `admin_users` 的 RLS policy 與 grants 已收緊。
- `public_games_v1` 契約不變，已改成 security invoker view 搭配固定公開欄位函式。
- 沒有建立會員 UI。
- 沒有讓前端直接寫錢包。
- 沒有接 Supinova。

安全現況：

- 5 張平台骨架表與 `gateway_rate_limits` 都有開 RLS，沒有前端直接讀寫 policy，anon / authenticated table grants 已撤銷。
- `games` 只允許通過 `is_looty_admin()` 的 authenticated 使用者管理；`admin_users` 不再直接暴露給前端。
- `create_game_session`、`exchange_game_launch_code`、`wallet_get_balance`、`wallet_bet`、`wallet_payout`、`wallet_refund`、`close_game_round` 只 grant 給 `service_role`。
- `looty_hash_secret`、`looty_active_session`、`looty_apply_wallet_transaction` 是內部 helper，只保留 owner execute。
- 未來玩家、Guest、錢包初始化應走後端或 Gateway，不要讓前端直接寫 table。

## Looty Gateway

2026-07-10 已部署 Supabase Edge Function：

```text
https://lsazydefvnuqglultqii.supabase.co/functions/v1/looty-gateway
```

目前支援：

```http
POST /functions/v1/looty-gateway/create-session
POST /functions/v1/looty-gateway/exchange
POST /functions/v1/looty-gateway/balance
POST /functions/v1/looty-gateway/bet
POST /functions/v1/looty-gateway/payout
POST /functions/v1/looty-gateway/refund
POST /functions/v1/looty-gateway/close-round
```

輸入：

```json
{
  "slug": "color-guess",
  "currency": "POINT",
  "expires_in_seconds": 3600
}
```

輸出：

```json
{
  "session_id": "...",
  "game_id": "...",
  "player_account_ref": "...",
  "launch_code": "...",
  "launch_code_expires_at": "...",
  "account_type": "guest",
  "currency": "POINT",
  "wallet_mode": "demo",
  "expires_at": "..."
}
```

遊戲以一次性 launch code 呼叫 `exchange`：

```json
{
  "launch_code": "..."
}
```

`exchange` 回傳最長一小時、只放在執行中記憶體的 `gateway_token`。Wallet endpoints 的 body 使用 `gateway_token`，不再使用舊 `launch_token`。

現況：

- Function `verify_jwt` 是 `false`，由 Gateway v1 自己驗證 create-session origin、Supabase user token、一次性 launch code、gateway token、scope、session 與 rate limit。
- `create-session` 會把 Supabase client 自動附加的同值 `apikey` / Bearer token 視為 Guest；只有不同於 `apikey` 的 Bearer token 才當作會員 session 驗證。
- Function 內部使用 `SUPABASE_SERVICE_ROLE_KEY` 呼叫 RPC。
- service role key 不放進前端。
- 已驗證不存在 slug 回 `404 game is not available`，不新增資料。
- 已驗證未允許 origin 回 `403`、launch code 只能用一次、無效 token 回 `404`。
- 已驗證 Gateway 可完成 create-session、exchange、balance、payout、bet、idempotency、round session 隔離、close-round 流程。
- 前端 Loader 已接 `create-session`，但舊遊戲不需要立刻改程式。
- Loader 不把 Supabase anon key、JWT、Authorization header 或 service role key 傳給 iframe。
- `gateway_token` 目前只代表 `demo` wallet；正式金流仍需要可信任遊戲後端或外部 wallet adapter。
- 新建立的 Demo POINT 錢包會取得 10,000 POINT，並寫入一筆 `deposit` 流水；營運前可用另一個小步 migration 關閉並清理測試資料。

2026-07-31 本機已完成、遠端尚未部署：

- `create-session` 缺少 `Origin` 時回 `403`。
- Demo wallet 只接受 `POINT`，其他幣別回 `400`。
- Supabase Auth 與 RPC 分別使用 5 秒、8 秒逾時。
- Request body 以串流限制 16 KiB，非預期 DB 訊息不直接回傳。

## 環境變數

本機與 Cloudflare Pages 都需要：

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

不要把完整 anon key、service role key、access token、DB password 寫進文件或對話。

## Supabase 作業

Looty 的 Supabase project ref：

```text
lsazydefvnuqglultqii
```

操作遠端 Supabase 前必跑：

```powershell
.\scripts\supabase-looty.cmd projects list
```

確認結果裡：

- `name` 是 `Looty`
- `ref` 是 `lsazydefvnuqglultqii`
- `linked` 是 `true`

如果只看到 `arua`，立刻停止。

本機第一次設定：

```powershell
copy .env.supabase.local.example .env.supabase.local
```

然後在 `.env.supabase.local` 填 Looty 專用：

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID=lsazydefvnuqglultqii`
- `SUPABASE_DB_PASSWORD`

`.env.supabase.local` 只放本機，不提交、不貼到對話裡。

原則：

- Looty 遠端 Supabase 操作優先使用 `.\scripts\supabase-looty.cmd`。
- 不要直接依賴全域 `supabase login`。
- 不要使用 Aura / arua 的 CLI 狀態操作 Looty。
- 要改 DB 前，先產 SQL migration 給使用者確認。
- 不要留下未確認的 baseline / 大重建 migration 草稿。
- Supabase MCP 暫不授權、不作為主要操作方式，也不要給其他專案共用 Looty MCP。

目前 MCP URL 只作備註，不當主流程：

```text
https://mcp.supabase.com/mcp?project_ref=lsazydefvnuqglultqii&read_only=true
```

## 開發與建置

```bash
npm install
npm run dev
npm run build
npm run test:gateway
```

注意：

- 這是 Vite 多頁專案，請用 Vite dev server，不要直接開 HTML。
- `vite.config.js` 的多頁 `input` 不能拿掉，否則 `/game` 與 `/admin` build 後會失效。
- 專案使用 Node.js 22；Cloudflare Pages 與支援 `.node-version` 的本機工具會讀取根目錄版本設定。
- `npm` 在 Windows PowerShell 可能被 execution policy 擋住；可改用 `npm.cmd`。

## Smoke Check

```bash
npm run smoke
```

Gateway v1 正式環境安全 smoke：

```powershell
$env:ALLOW_PRODUCTION_GATEWAY_SMOKE='1'
npm.cmd run smoke:gateway
```

安全 smoke 會建立標記為 `gateway-security-smoke` 的 demo session / round / transaction 測試資料，不要在未確認 Looty 專案時執行。

Smoke 目標：

- 先跑 `npm run build`。
- 啟動本機 Vite。
- 啟動 headless Chrome / Edge。
- 驗首頁、iframe sandbox / 權限 / 載入逾時、Lobby 破圖 fallback、Loader 缺 slug、Admin login、共用錯誤視窗。
- `npm run test:gateway` 以本機模擬驗證 Auth / RPC 回應內容逾時會轉成 `503`，不連遠端、不建立資料。

2026-07-31 已確認：

- `npm audit` 為 0 vulnerabilities。
- `npm run build` 通過。
- `npm run smoke` 通過。
- `npm run test:gateway` 通過。
- 全專案 JavaScript 語法與 Gateway TypeScript 解析通過。
- Gateway v1 security smoke 最後於 2026-07-10 確認通過，本次沒有重跑，避免建立新的正式 Demo 測試資料。

若要指定 browser，用 `SMOKE_BROWSER_PATH`。

## Cloudflare Pages

目前已知部署模式，已於 2026-07-09 在 Cloudflare Dashboard 確認：

- Cloudflare account: `pixelgd.games@gmail.com`
- Cloudflare Pages project: `looty-git`
- GitHub repo: `pixelgd-games/looty`
- Production branch: `main`
- Automatic deployments: enabled
- Root directory: 留空
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Frontend env vars:
  - `VITE_SUPABASE_URL`: 已設定，指向 Looty Supabase `lsazydefvnuqglultqii`
  - `VITE_SUPABASE_ANON_KEY`: 已設定，不要把完整 key 寫進文件或對話
- Production hostname: `looty-git.pages.dev`
- Custom domains: 目前未設定

目前可先使用 Cloudflare Pages 現有網址，不需要先更換或綁定正式網域。
正式網域與舊 Direct Upload Pages 退場方式，等正式營運前再決定。

2026-07-09 production smoke check：

- `https://looty-git.pages.dev/` 可載入。
- Lobby 可從 Supabase 讀到公開遊戲。
- `https://looty-git.pages.dev/game/?slug=color-guess` 可載入 Game Loader，iframe 指向 `https://color-guess-68b.pages.dev/`。
- `/admin/*` 目前沒有 Cloudflare Access 攔截；Admin 保護由 Looty 自己的 Supabase session + `admin_users` 白名單負責。

2026-07-10 Gateway v1 production smoke：

- Cloudflare Pages deployment `9994a81` 已 Active。
- Lobby 可讀到 3 款公開遊戲。
- Admin 已通過 `is_looty_admin()` 並讀到 3 筆遊戲資料。
- `color-guess` Loader 可建立新 session 並載入 iframe。
- Iframe URL 有 `looty_launch_code`、`looty_exchange_url`、`looty_wallet_mode=demo`，沒有舊 `looty_launch_token`。
- Gateway security smoke 已驗證 body limit、rate limit、一次性 code、token、idempotency 與跨 session round 隔離。

2026-07-11 Ocean Battle 上架確認：

- `ocean-battle` 已以 `type = fish`、`supports_live = false`、`published = true` 上架。
- 正式 Lobby 可顯示 Ocean Battle，Loader 可建立 session 並載入 `https://ocean-battle.pages.dev/` iframe。
- Ocean Battle 目前不接 wallet，遊戲本體只忽略 Looty query params，沒有修改遊戲 repo。

2026-07-11 Speed-Rush 上架確認：

- `speed-rush` 已以 `type = arcade`、`supports_live = false`、`published = true` 上架。
- 正式 Lobby 可顯示 Speed-Rush，Loader 可建立 session 並載入 `https://speed-rush.pages.dev/` iframe。
- Speed-Rush 目前的押注、餘額、賽果與賠付都是 H5 client 展示，不接 Looty wallet，也沒有修改遊戲 repo。

2026-07-12 Lobby 封面與橫向版面確認：

- `speed-rush`、`ocean-battle`、`color-guess` 已改用 Looty 自管 `750 x 1000` WebP 封面。
- 正式 Lobby 已驗證三張封面正常載入。
- 手機橫向版面已加入，觸控低高度橫向裝置使用 4 欄並縮小 Hero、間距、標題與按鈕。
- PC 與手機直向版面不受影響。

2026-07-14 Valkyrie: Dragon's Hoard 上架確認：

- `valkyrie-dragons-hoard` 已以 `type = slot`、`supports_live = false`、`published = true` 上架。
- `launch_url` 為 `https://valkyrie-dragons-hoard.pages.dev/`。
- 封面已使用 Looty 自管 `/games/valkyrie-dragons-hoard/cover.webp`，規格為 `750 x 1000` WebP。
- 正式 Lobby 可顯示 Valkyrie: Dragon's Hoard，Loader 可建立 session 並載入 iframe。
- Valkyrie: Dragon's Hoard 是正式開發產品，目前不接 Looty Wallet；
  遊戲本體可忽略 Looty session query params，沒有修改遊戲 repo。

2026-07-14 Dead County 上架確認：

- `dead-county` 已以 `type = fish`、`supports_live = false`、`published = true` 上架。
- `launch_url` 為 `https://dead-county.pages.dev/`。
- 封面已使用 Looty 自管 `/games/dead-county/cover.webp`，規格為 `750 x 1000` WebP。
- 正式 Lobby 可顯示 Dead County，Loader 可建立 session 並載入 iframe。
- Dead County 是正式開發產品，目前不接 Looty Wallet；遊戲本體可忽略
  Looty session query params，沒有修改遊戲 repo。

2026-07-16 Ninja: Four Elements 上架確認：

- `ninja-four-elements` 已以 `type = slot`、`supports_live = false`、`published = true` 上架。
- `launch_url` 為 `https://ninja-four-elements.pages.dev/`。
- 封面已使用 Looty 自管 `/games/ninja-four-elements/cover.webp`，規格為 `750 x 1000` WebP。
- 正式 Lobby 可顯示 Ninja: Four Elements，Loader 可建立 session 並載入 iframe。
- Ninja: Four Elements 是正式開發產品，目前不接 Looty Wallet；遊戲本體
  可忽略 Looty session query params，沒有修改遊戲 repo。

2026-07-18 Arrgh! Hoops 上架測試確認：

- `arrgh-hoops` 已以 `type = arcade`、`supports_live = false`、`published = true` 上架測試。
- `launch_url` 為 `https://arrgh-hoops.pages.dev/`。
- 封面已使用 Looty 自管 `/games/arrgh-hoops/cover.webp`，規格為 `750 x 1000` WebP。
- 正式 Lobby 可顯示 Arrgh! Hoops，Loader 可建立 session 並載入 iframe。
- Arrgh! Hoops 目前維持 Demo / free-play，不接 Looty Wallet，遊戲本體可忽略 Looty session query params，沒有修改遊戲 repo。

Cloudflare 操作提醒：

- 這台 Chrome 可能有多個 Cloudflare 帳號；操作 Looty 前先確認左上角帳號是 `pixelgd.games@gmail.com`。
- 不要在未確認帳號時修改 Pages、Workers、Zero Trust 或環境變數。

## Cloudflare Access 選用加固

目前 Admin 已有 Supabase Google OAuth + `admin_users` email 白名單保護，符合目前產品階段的應用層需求。

Cloudflare Access 不是目前登入功能的前提，也不是目前交付的阻擋項目。之後如果要再加一層入口保護，可以把 `/admin/*` 納入 Cloudflare Access，讓使用者進入 Admin HTML 前先通過 Cloudflare。

若要設定，預計：

- hostname: `looty-git.pages.dev`
- path: `/admin/*`
- Application type: Self-hosted
- allowed Google emails:
  - `pixelgd.games@gmail.com`
  - `johnnyli1226@gmail.com`
- 前端 `admin_users` 白名單檢查保留，作為應用層保護。

## 未來可改善

以下不是目前 blocker：

- `admin_users` 之後可視需要從 email 白名單升級為 auth user id。
- 前台會員登入停用，尚未設計新的 `/me` 或會員中心。
- 平台 logo / app icon 後續可做成平台設定頁，目前先用靜態素材。
- Cloudflare Access 未啟用，可視安全需求再加。
- 正式網域與舊 Direct Upload Pages 退場方式等正式營運前再決定。
- Automated tests 還不完整。

## 交接提醒

1. 不要假設 repo 有 `enabled-games` 白名單。
2. 新增遊戲時確認 `published`、`launch_url`、`sort_order`。
3. Loader 啟動失敗時，優先查 `public_games_v1` 是否查得到該 `slug`，再查 `looty-gateway/create-session`。
4. 調整公開規則時，優先改 DB view / policy，不要加本地硬編碼。
5. 改部署前，先保住目前可用的靜態輸出流程。
6. 做遊戲接入前，先讀 `docs/platform/GAME_PLATFORM_INTEGRATION.md`。
7. 不要在 Looty repo 任務中直接修改遊戲本體 repo。
