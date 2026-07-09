# Looty

Looty 是 Flash 系統裡的遊戲入口 / Lobby / 輕量 Admin 前端。

這份文件是 **目前 repo 實作真相來源**。AI 或 Codex 進來時先讀這份，不要優先相信舊對話或過時交接內容。

## 文件地圖

1. `README.md`
   - 目前 repo 實作、資料流、部署、DB 現況與限制。
2. `GAME_PLATFORM_INTEGRATION.md`
   - 給 Looty AI 與做遊戲的 AI 看，說明遊戲要怎麼接 Looty、哪些責任不能混在一起。
3. `LOOTY_MVP.md`
   - MVP 產品邊界、目前不做什麼、下一步。
4. `FLASH.md`
   - Flash 大系統背景，只看責任邊界，不當作 repo 細節真相。

## 專案定位

Looty 目前負責：

- 顯示公開遊戲 Lobby。
- 用 `/game/?slug=<slug>` 把玩家送進對應遊戲。
- 提供輕量 Admin 管理遊戲上架資料。
- 建立平台帳號、平台錢包、game session、game round 的 DB 骨架。

Looty 目前不負責：

- 遊戲本體玩法與前端表現。
- 即時多人同步。
- 博奕結果裁決 / RNG。
- 完整會員中心 UI。
- 完整 ledger / settlement 系統。
- 讓前端直接寫玩家或錢包資料。

遊戲本體不應自己登入玩家，也不應直接改玩家餘額。細節看 `GAME_PLATFORM_INTEGRATION.md`。

## 目前狀態

截至 2026-07-10：

- 技術棧是 Vanilla JS + Vite，多頁靜態站。
- Hosting 走 Cloudflare Pages，GitHub `main` 自動部署到 `looty-git`。
- Auth / Database / View 走 Looty Supabase：`lsazydefvnuqglultqii`。
- Lobby 直接讀 `public_games_v1`。
- Game Loader 直接用 `slug` 查 `public_games_v1`，再用 `launch_url` 載入 iframe。
- 前台會員登入已從 Lobby 移除，首頁維持純公開遊戲入口。
- Admin 使用 Google OAuth + `admin_users` email 白名單。
- Admin 可管理 `games` 的基本上架欄位。
- 前台 / Loader / Admin 共用錯誤視窗與 `LOOTY-*` 錯誤代碼。
- Repo 沒有本地 `enabled-games` 白名單，也沒有 `src/config/game-urls.js`。
- 平台骨架 migration 已套用，新增 `player_accounts`、`wallet_accounts`、`wallet_transactions`、`game_sessions`、`game_rounds`。
- 最小 game session / wallet RPC 已套用，目前只開給 `service_role`。
- Supabase Edge Function `looty-gateway` 已部署，第一版只提供 `create-session`。
- 2026-07-10 已確認 `npm run build` 與 `npm run smoke` 通過。

## 目前工作方向

現在不是重做架構或補大型功能的階段。

短期重點：

1. 保持首頁 -> Game Loader -> 遊戲啟動的主路徑穩定。
2. 用電腦版 Admin 管理遊戲上架資料。
3. 讓文件清楚分出 Looty Platform、Game、Game Gateway、Wallet Interface 的責任。
4. 下一步決定 `/game/?slug=...` 是否要接 `looty-gateway` 建立 session。
5. 不先做完整會員中心、不恢復前台登入 UI、不接 Supinova、不切正式網域。

## 路由

- Lobby: `/`
- Game Loader: `/game/?slug=<slug>`
- Admin Login: `/admin/login/`
- Admin Games: `/admin/games/`
- Admin New Game: `/admin/games/new/`
- Admin Edit Game: `/admin/games/edit/?id=<uuid>`

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
- `public/hero/looty-hero-main.webp`: 首頁主視覺。
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

## Game Loader 資料流

流程：

1. 從 query string 取得 `slug`。
2. 查 `public_games_v1`。
3. 取出 `launch_url`。
4. 用 `src/lib/urls.js` 檢查 URL。
5. 以 iframe 載入遊戲。

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

Game Loader 錯誤碼：

- `LOOTY-GAME-001`: 缺少 `slug`
- `LOOTY-GAME-002`: 找不到指定遊戲
- `LOOTY-GAME-003`: 遊戲啟動網址未設定
- `LOOTY-GAME-004`: 遊戲資料讀取失敗
- `LOOTY-GAME-005`: 遊戲啟動網址格式不支援

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
- 驗證 `sort_order` 只能是整數或空值。
- 驗證 `launch_url` 只能是 `http(s)` 或 `/` 開頭站內路徑。
- 已上架遊戲必須有 `launch_url`。

目前後台可管理的 `type`：

- `slot`
- `fish`
- `card`
- `arcade`
- `casual`
- `adult`

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

目前 public schema 包含：

- `admin_users`
- `games`
- `public_games_v1`
- `player_accounts`
- `wallet_accounts`
- `wallet_transactions`
- `game_sessions`
- `game_rounds`

5 張平台骨架表：

- `player_accounts`: 玩家身份，Guest 和正式帳號都用這張。
- `wallet_accounts`: 玩家平台錢包，目前是一個玩家一種幣別一個 active wallet。
- `wallet_transactions`: 錢包流水，包含 `balance_before`、`balance_after`、`idempotency_key`。
- `game_sessions`: 玩家進遊戲時的平台 session，只存 `launch_token_hash`，不存明文 token。
- `game_rounds`: 遊戲局號，可對應下注、派彩、退款紀錄。

目前沒有做：

- 沒有復活 `players`。
- 沒有復活 `player_balances`。
- 沒有改 `games`。
- 沒有改 `admin_users`。
- 沒有改 `public_games_v1`。
- 沒有建立會員 UI。
- 沒有讓前端直接寫錢包。
- 沒有接 Supinova。

安全現況：

- 5 張平台骨架表都有開 RLS。
- 目前沒有開前端直接讀寫 table 的 policy。
- `create_game_session`、`wallet_get_balance`、`wallet_bet`、`wallet_payout`、`wallet_refund`、`close_game_round` 目前只 grant 給 `service_role`。
- `looty_hash_launch_token`、`looty_active_session`、`looty_apply_wallet_transaction` 是內部 helper，目前只保留 owner execute。
- 未來玩家、Guest、錢包初始化應走後端或 Gateway，不要讓前端直接寫 table。

## Looty Gateway

2026-07-10 已部署 Supabase Edge Function：

```text
https://lsazydefvnuqglultqii.supabase.co/functions/v1/looty-gateway
```

目前支援：

```http
POST /functions/v1/looty-gateway/create-session
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
  "launch_token": "...",
  "account_type": "guest",
  "currency": "POINT",
  "expires_at": "..."
}
```

現況：

- Function `verify_jwt` 是 `true`，沒有授權 header 會被 Supabase 擋下。
- Function 內部使用 `SUPABASE_SERVICE_ROLE_KEY` 呼叫 RPC。
- service role key 不放進前端。
- 已驗證未授權呼叫回 `401`。
- 已驗證不存在 slug 回 `404 game is not available`，不新增資料。
- 目前前端 Loader 還沒接這個 Gateway，仍維持原本 iframe 啟動流程。

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
```

注意：

- 這是 Vite 多頁專案，請用 Vite dev server，不要直接開 HTML。
- `vite.config.js` 的多頁 `input` 不能拿掉，否則 `/game` 與 `/admin` build 後會失效。
- `npm` 在 Windows PowerShell 可能被 execution policy 擋住；可改用 `npm.cmd`。

## Smoke Check

```bash
npm run smoke
```

Smoke 目標：

- 先跑 `npm run build`。
- 啟動本機 Vite。
- 啟動 headless Chrome / Edge。
- 驗首頁、Loader 缺 slug、Admin login、共用錯誤視窗。

2026-07-10 已確認：

- `npm run build` 通過。
- `npm run smoke` 通過。

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

Cloudflare 操作提醒：

- 這台 Chrome 可能有多個 Cloudflare 帳號；操作 Looty 前先確認左上角帳號是 `pixelgd.games@gmail.com`。
- 不要在未確認帳號時修改 Pages、Workers、Zero Trust 或環境變數。

## Cloudflare Access 選用加固

目前 Admin 已有 Supabase Google OAuth + `admin_users` email 白名單保護，MVP 階段已足夠。

Cloudflare Access 不是目前登入功能的前提，也不是 MVP blocker。之後如果要再加一層入口保護，可以把 `/admin/*` 納入 Cloudflare Access，讓使用者進入 Admin HTML 前先通過 Cloudflare。

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
- Cloudflare Access 未啟用，可視安全需求再加。
- 正式網域與舊 Direct Upload Pages 退場方式等正式營運前再決定。
- Automated tests 還不完整。

## 交接提醒

1. 不要假設 repo 有 `enabled-games` 白名單。
2. 新增遊戲時確認 `published`、`launch_url`、`sort_order`。
3. Loader 啟動失敗時，優先查 `public_games_v1` 是否查得到該 `slug`。
4. 調整公開規則時，優先改 DB view / policy，不要加本地硬編碼。
5. 改部署前，先保住目前可用的靜態輸出流程。
6. 做遊戲接入前，先讀 `GAME_PLATFORM_INTEGRATION.md`。
