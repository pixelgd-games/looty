# Looty AI Guide

這份文件只給 AI / Codex 讀，不是對外產品文件。

## 先讀文件

進入專案後先讀：

1. `README.md`
2. `docs/platform/GAME_PLATFORM_INTEGRATION.md`
3. `docs/platform/CRAZYGAMES_INTEGRATION.md`
4. `docs/product/PRODUCT_SCOPE.md`
5. `docs/platform/FLASH.md`
6. `docs/operations/KNOWN_ISSUES.md`
7. `docs/operations/ANALYTICS_MONITORING.md`

`README.md` 是目前 repo 實作真相來源。
`docs/platform/GAME_PLATFORM_INTEGRATION.md` 是 Looty 與遊戲的接入契約。
`docs/platform/CRAZYGAMES_INTEGRATION.md` 是 CrazyGames Build、SDK、廣告、存檔與上架規範。
`docs/platform/FLASH.md` 只看大系統背景，不當作 Looty repo 細節真相。
`docs/operations/KNOWN_ISSUES.md` 記錄已確認問題與改善方向；不要看到問題就自行施工。
`docs/operations/ANALYTICS_MONITORING.md` 記錄 Analytics、監控、會員與平台後續施工順序；沒有可靠資料的 KPI 不要先做假數字。

新增內容時優先更新現有文件。除非出現新的獨立責任，不要新增重複文件。

如果任務是製作或修改一款要同時發布到 Looty 與 CrazyGames 的遊戲，至少要讀兩份平台文件：

1. `docs/platform/GAME_PLATFORM_INTEGRATION.md`
2. `docs/platform/CRAZYGAMES_INTEGRATION.md`

遊戲使用同一套本體，平台差異放在 Looty Client、CrazyGames Client、Local Client。Local Client 只供本機開發測試，不是正式發布平台，也不能在正式平台初始化失敗時自動啟用。不要只靠 iframe 判斷平台，也不要讓任何 Build 同時呼叫兩個平台的服務。

雙平台規則只適用於非博弈遊戲。博弈相關產品不接 CrazyGames，不建立 CrazyGames Client、Build、廣告或上架素材；是否屬於博弈要看實際玩法與交易機制，不能只看 `games.type`。

`D:\Studio\Project-Gaming` 內的產品一律按博弈產品處理，不建立
CrazyGames Client、Build、SDK、廣告或上架素材。除非使用者明確把
某款產品移出該工作區並重新分類，否則 Looty 的 `games.type` 不得
改變這項邊界。

## 回答方式

- 用一般人聽得懂的話回答。
- 簡單、扼要、直接講重點。
- 不寫過度技術化或冗長說明。
- 有做什麼、沒做什麼、下一步是什麼，要講清楚。

## 寫程式方式

- 代碼要精簡扼要。
- 不寫程式碼備註。
- 不做無關重構。
- 優先沿用現有架構與風格。
- 不新增不必要的抽象層。
- 不把簡單問題做複雜。
- 不為營運前舊資料、舊流程、舊欄位保留相容代碼。

## Looty 固定規則

- 不改成 React / Vue / Next.js，除非使用者明確要求。
- 不改 Cloudflare Pages 靜態部署架構。
- 不新增本地 `enabled-games` 白名單。
- 不恢復前台會員登入 UI，除非先重新設計會員入口。
- 不把 Flash 兄弟模組責任硬塞進 Looty。
- 遊戲不要自己登入玩家，也不要直接改玩家餘額。
- 在 Looty repo 任務中不要修改任何遊戲本體 repo；只有使用者明確指定某一款遊戲並切到該遊戲 repo 時，才處理遊戲本體接入。
- 博弈相關產品不接 CrazyGames；不要替這類產品建立 CrazyGames Build、SDK、廣告或上架流程。
- CrazyGames Build 不呼叫 Looty Gateway；Looty Build 不初始化 CrazyGames SDK 或載入 CrazyGames 廣告。
- Looty launch code 與 gateway token 只留在記憶體，不寫入瀏覽器儲存、Log 或 Analytics。
- Lobby 遊戲封面統一使用 `3:4`、`750 x 1000` WebP。
- 遊戲商提供原圖後，由 Looty AI 裁切、壓縮並放到 `public/games/<slug>/cover.webp`。
- Lobby 封面屬於 Looty 平台素材，不要放進或修改遊戲本體 repo。

## Supabase 規則

- Looty Supabase project ref 是 `lsazydefvnuqglultqii`。
- Supabase CLI token 在這台 Windows 上是全域登入狀態，不是專案檔的一部分。
- Looty 遠端 Supabase 操作優先使用 `.\scripts\supabase-looty.cmd`，不要直接依賴全域 `supabase login`。
- 不要只相信 profile 名稱或目前所在資料夾；每次 DB 操作前都要跑 `.\scripts\supabase-looty.cmd projects list`。
- `projects list` 必須看到 `Looty` / `lsazydefvnuqglultqii` / `linked: true`。
- 如果只看到 `arua`，立刻停止；不要反覆叫使用者重登，先確認 `.env.supabase.local` 是否是 Looty token。
- 不要使用 arua / Aura 的 Supabase CLI 狀態操作 Looty。
- Looty 目前主力用 Supabase CLI + migration 管理 DB。
- Supabase MCP 暫不授權、不作為主要操作方式，也不要給其他專案共用 Looty MCP。
- 要改 DB 前，先產 SQL migration 給使用者確認。
- 不要留下未確認的 baseline / 大重建 migration 草稿；這類檔案容易被誤套用。
- `.env.supabase.local` 只放本機，不提交；範本是 `.env.supabase.local.example`。
- 如果 `.env.supabase.local` 不存在，請使用者在本機建立；不要要求使用者把 token 或 DB password 貼到對話裡。
- 不要在文件或程式碼裡提交 Supabase access token、service role key、DB password。

## DB 現況

正式營運前的舊資料不要保留，也不要當成正式歷史資料維護。
如果看到測試資料、過渡資料、舊設計殘留資料，先視為可清理或可重建，不要為了相容舊資料犧牲新設計。

目前遠端 public schema 核心包含：

- `games`
- `admin_users`
- `public_games_v1`
- `player_accounts`
- `wallet_accounts`
- `wallet_transactions`
- `game_sessions`
- `game_rounds`
- `gateway_rate_limits`

目前 repo 不保留 baseline migration。未來 DB 改動用小步、可審查的 migration，不要一次重建整個 schema。

不要復活舊的：

- `players`
- `player_balances`
- `access_whitelist`
- `site_settings`
- `ensure_my_player_v1()`

玩家與錢包方向：

- 玩家表用 `player_accounts`，不要直接復活舊 `players`。
- 錢包用 `wallet_accounts` + `wallet_transactions`，不要復活舊 `player_balances`。
- 會員、Guest、錢包初始化放在 DB RPC 或後端流程，不要讓前端直接寫玩家或錢包表。
- 目前 5 張平台骨架表與 `gateway_rate_limits` 已開 RLS，沒有前端讀寫 policy，anon / authenticated table grants 已撤銷。
- Game session / wallet RPC 已建立，目前只開給 `service_role`，不要從前端直接呼叫。
- Supabase Edge Function `looty-gateway` v4 已部署，支援 `create-session`、一次性 launch code `exchange` 與第一版 wallet endpoints。
- Game Loader 進遊戲前會建立 session，並把 `looty_session_id`、`looty_launch_code`、`looty_game_id`、`looty_currency`、`looty_wallet_mode`、`looty_gateway_url`、`looty_exchange_url` 傳給 iframe。
- 遊戲以兩分鐘有效、只能使用一次的 launch code 交換最長一小時的 `gateway_token`；Loader 不把 Supabase anon key、JWT 或 service role key 傳給 iframe。
- Gateway v1 已自行驗證 route、token、scope、session 與 DB-backed rate limit；目前 wallet mode 是 `demo`，不代表正式金流。
- Round 與 wallet transaction 已綁定 `game_session_id`，相同 `round_id` 可安全存在於不同 session。
- 目前沒有修改任何已上架遊戲本體；舊遊戲可以先忽略 Looty session 參數。

## 最近確認

- 2026-07-09 已在本機建立 `.env.supabase.local`，並驗證 `.\scripts\supabase-looty.cmd projects list` 可看到 Looty linked true。
- 2026-07-10 已套用平台骨架 migration：`20260709170000_create_platform_account_wallet_core.sql`。
- 2026-07-10 已套用 RPC migration：`20260710010000_create_game_session_wallet_rpc.sql` 與 `20260710011000_restrict_game_session_wallet_rpc_grants.sql`。
- 2026-07-10 已套用 RPC 修正 migration：`20260710013000_fix_wallet_rpc_variable_conflicts.sql`。
- 2026-07-10 已套用第一階段安全 migrations：`20260710140000_secure_admin_game_access.sql`、`20260710141000_create_gateway_v1_session_auth.sql`、`20260710142000_bind_rounds_to_game_sessions.sql`、`20260710143000_add_gateway_runtime_limits.sql`。
- 2026-07-10 已部署 `looty-gateway` v4，`verify_jwt=false`，改由 Gateway 自行驗證 create-session origin、launch code、gateway token、scope、session 與 rate limit。
- 2026-07-10 已修正 Supabase client 匿名 `apikey` / Bearer token 被誤判成無效會員 session；Guest create-session 與完整 Gateway security smoke 已通過。
- 2026-07-10 已套用 `20260710210000_grant_demo_wallet_initial_credit.sql`；新 Demo POINT 錢包取得 10,000 POINT 並留下 `deposit` 流水，正式營運前再關閉並清理測試資料。
- 2026-07-10 已驗證 Gateway 可完成 create-session、exchange、balance、payout、bet、idempotency、跨 session round 隔離、close-round 流程。
- 2026-07-10 已確認 `npm run build` 與 `npm run smoke` 通過。
- 2026-07-10 Cloudflare Pages deployment `9994a81` 已 Active；production Lobby、Admin 與 `color-guess` Loader 已驗證通過，iframe 不再包含舊 `looty_launch_token`。
- 2026-07-11 已上架 `ocean-battle`：`type = fish`、`supports_live = false`、`published = true`、`launch_url = https://ocean-battle.pages.dev/`；Lobby -> Loader -> iframe 已驗證通過，沒有修改遊戲本體。
- 2026-07-11 已上架 `speed-rush`：`type = arcade`、`supports_live = false`、`published = true`、`launch_url = https://speed-rush.pages.dev/`；Lobby -> Loader -> iframe 已驗證通過，目前押注與賠付只是 H5 client 展示，沒有接 Looty wallet 或修改遊戲本體。
- 2026-07-12 已上架 Looty 自管封面：`speed-rush`、`ocean-battle`、`color-guess`，並驗證正式 Lobby 正常顯示。
- 2026-07-12 已加入手機橫向 Lobby 版面，觸控低高度橫向裝置改為 4 欄，PC 與手機直向不受影響。
- 2026-07-18 `valkyrie-dragons-hoard`、`dead-county`、`ninja-four-elements`、`arrgh-hoops` 已完成上架或上架測試；詳細狀態以 `README.md` 為準。
- 2026-07-23 已確認 Looty / `lsazydefvnuqglultqii` linked true，本機與遠端 16 筆 migrations 全部同步。
- 2026-07-23 已建立 `docs/operations/ANALYTICS_MONITORING.md`，Analytics 與監控仍在規劃階段，尚未實作。
- 2026-07-23 已更新 `@supabase/supabase-js`、Vite、ws 與 esbuild；`npm audit` 為 0 vulnerabilities，build 與 smoke 已通過。
