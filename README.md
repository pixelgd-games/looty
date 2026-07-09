# Looty

Looty 是 Flash 系統裡的遊戲入口 / Lobby / 輕量 Admin 前端。

這份文件是 **目前 repo 實作真相來源**。AI 或 Codex 進來時先讀這份，不要優先相信舊對話或過時交接內容。

## AI 文件閱讀順序

1. `README.md`: 目前程式架構、資料流、部署與限制。
2. `GAME_PLATFORM_INTEGRATION.md`: 給 AI 的遊戲 / 平台接入準則，包含錢包、帳號、Guest、Game Gateway 的目前設計結論與未定事項。
3. `LOOTY_MVP.md`: MVP 產品邊界、目前不做什麼、下一步。
4. `FLASH.md`: Flash 大系統背景，只看責任邊界，不當作 repo 細節真相。

## 專案定位

Looty 負責：

- 顯示公開遊戲 Lobby
- 透過 `/game/?slug=<slug>` 把玩家送進對應遊戲
- 提供輕量 Admin 後台管理遊戲上架資料

Looty 既有 MVP 尚未包含：

- 遊戲本體玩法與前端表現
- 即時多人同步
- 博奕結果裁決 / RNG
- 錢包、ledger、settlement
- 完整會員中心與點數流水

下一階段會在 Looty Platform 內實作玩家身份、game session 與平台錢包 / wallet interface。遊戲本體仍不應自己登入玩家或直接改錢包。長期方向請看 `GAME_PLATFORM_INTEGRATION.md`。

## 目前狀態

截至 2026-07-09：

- 技術棧是 Vanilla JS + Vite，多頁靜態站。
- Auth / Database / View 走 Supabase。
- Hosting 走 Cloudflare Pages，GitHub `main` 可自動部署到 `looty-git`。
- Lobby 直接讀 `public_games_v1`。
- Game Loader 直接用 `slug` 查 `public_games_v1`，再用 `launch_url` 載入 iframe。
- 前台會員登入已從 Lobby 移除，首頁維持純公開遊戲入口。
- Admin 使用 Google OAuth + `admin_users` email 白名單。
- Admin 可管理 `games` 的基本上架欄位。
- 前台 / Loader / Admin 共用錯誤視窗與 `LOOTY-*` 錯誤代碼。
- Repo 沒有本地 `enabled-games` 白名單，也沒有 `src/config/game-urls.js`。

## 目前工作方向

目前 Looty 處在 MVP 可用後的整理與驗證階段，不是架構重做階段。

現在的重點是把平台和遊戲的責任邊界先定清楚，方便未來外部遊戲接進 Looty，也方便 Looty 自己的遊戲接到外部平台。

現在主要要做的是：

1. 繼續使用目前 Cloudflare Pages 網址測試與整理內容。
2. 用電腦版 Admin 管理遊戲上架資料。
3. 確認玩家主路徑穩定：首頁看到遊戲 -> 點進 Loader -> 遊戲成功啟動。
4. 文件先釐清 Looty Platform、Game、Game Gateway、Wallet Interface 的責任。
5. 發現具體問題時，只修該問題，不順手擴大成會員、錢包、正式網域、Cloudflare Access 或大型 Admin 改版。

責任方向：

- Looty Platform 負責玩家身份、game session、平台錢包介面、交易規則與遊戲上架資料。
- Game 負責畫面、玩法、局號、下注/派獎請求時機，不自己登入玩家，也不直接改錢包。
- Game Gateway 負責平台和遊戲之間的 session、wallet API、第三方平台 API 轉接。
- Wallet Interface 負責固定錢包語意，讓後面可以接 Looty wallet tables、Supinova 或第三方平台 wallet API，而不讓遊戲重寫。
- 詳細規則看 `GAME_PLATFORM_INTEGRATION.md`。

帳號與錢包方向：

- Guest 由 Looty Platform 建立，不由遊戲建立，之後對應到 `player_accounts`。
- 正式帳號走 Supabase Auth，登入後也對應同一套 `player_accounts`。
- Guest 升級正式帳號時，應接回原本玩家資料，不要換成全新玩家。
- 錢包是 Looty 平台錢包，不是每個遊戲自己一套錢包。
- 錢包資料方向是 `wallet_accounts` + `wallet_transactions`，不能只存一個 balance。
- 下注、派彩、退款都要走平台後端 / DB RPC / API，並用 `idempotency_key` 避免重複扣款或重複派彩。
- 第一階段不先接 Supinova；未來如果要接，放在 Wallet Interface 後面的 adapter。

## 技術限制

除非明確要求，不要改以下前提：

- 不改成 React / Vue / Next.js。
- 不改 Cloudflare Pages 靜態部署架構。
- 不新增本地遊戲白名單。
- 不把 Flash 兄弟模組責任寫進 Looty。
- 不恢復前台會員登入 UI，除非先重新設計會員入口。

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

## Lobby 資料流

Lobby 流程：

1. `src/main.js` 呼叫 `initLobbyPage()`
2. `src/pages/lobby/index.js` render Lobby shell
3. `src/pages/lobby/data.js` 查 `public_games_v1`
4. `src/pages/lobby/game-grid.js` render 遊戲卡片

Lobby 目前不顯示分類 tabs，不做前端分類分頁，直接顯示所有公開可玩的遊戲。

Lobby 目前讀取欄位：

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

Game Loader 流程：

1. 從 query string 取得 `slug`
2. 查 `public_games_v1`
3. 取出 `launch_url`
4. 用 `src/lib/urls.js` 檢查 URL
5. 以 iframe 載入遊戲

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
- 目前以電腦版後台為主，已能完成遊戲上架、下架、啟動網址、排序等核心管理操作。
- Admin 手機版優化先不列為待辦，等實際需要再處理。
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

`games` 至少應具備：

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

`public_games_v1` 至少應暴露：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `launch_url`
- `sort_order`

目前預期的 view 邏輯：

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

## 環境變數

本機與 Cloudflare Pages 都需要：

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Supabase 作業

Looty 的 Supabase project ref：

```text
lsazydefvnuqglultqii
```

AI / Codex 操作 Supabase 時，先確認目標是 Looty，不要沿用其他專案的 CLI 預設登入。

目前專案已有：

- `supabase/config.toml`: Looty 的本地 Supabase CLI 骨架。
- Looty 本地 Supabase link: `lsazydefvnuqglultqii`。
- `.env.supabase.local.example`: Looty 私密 Supabase env 範本。
- `scripts/supabase-looty.cmd`: Looty 專用 Supabase CLI 包裝指令，會載入本地 token 並先檢查 Looty 專案。
- `.codex/config.toml`: Looty 專案限定的 Supabase MCP 設定，先保留 read-only 設定，但目前不授權啟用。

確認 CLI 連到正確專案：

```powershell
.\scripts\supabase-looty.cmd projects list
```

確認結果裡 `Looty` / `lsazydefvnuqglultqii` 應該是 `linked: true`。

本機第一次設定：

```powershell
copy .env.supabase.local.example .env.supabase.local
```

然後在 `.env.supabase.local` 填 Looty 專用 `SUPABASE_ACCESS_TOKEN` 與 `SUPABASE_DB_PASSWORD`。不要把 `.env.supabase.local` 上傳或貼到對話裡。

目前 MCP URL：

```text
https://mcp.supabase.com/mcp?project_ref=lsazydefvnuqglultqii&read_only=true
```

注意：

- read-only MCP 只用來看 schema / table / policy，不直接改 DB。
- Looty 目前主力使用 Supabase CLI，不使用 MCP 當主要操作方式。
- MCP 權限暫不授權；如果未來要開，必須綁定 Looty 的 `project_ref=lsazydefvnuqglultqii`，不要拿同一個 MCP 給其他專案共用。
- 要改 DB 前，先產 SQL migration 給使用者確認。
- 不要留下未確認的 baseline / 大重建 migration 草稿；這類檔案容易被誤套用。
- 不要拿 Aura 或其他專案的 Supabase CLI link 來操作 Looty。
- Supabase CLI 登入 token 在這台 Windows 上是全域狀態，不是專案檔的一部分；不要只相信 profile 名稱。
- Looty 遠端 Supabase 操作優先使用 `.\scripts\supabase-looty.cmd`，不要直接依賴全域 `supabase login`。
- `.env.supabase.local` 只放本機，不提交；內容需要 `SUPABASE_ACCESS_TOKEN`、`SUPABASE_PROJECT_ID=lsazydefvnuqglultqii`、`SUPABASE_DB_PASSWORD`。
- 如果 `projects list` 看不到 `Looty` / `lsazydefvnuqglultqii`，或只看到 `arua`，立刻停止；代表目前 CLI token 不是 Looty 帳號。
- 遇到上面狀況時，不要反覆叫使用者重登；先確認 `.env.supabase.local` 是否是 Looty token。
- Codex 目前 session 不一定會立刻載入新 MCP；通常需要重開 Codex session 後再授權 Supabase。
- 若 MCP 工具沒有出現，可用 `.\scripts\supabase-looty.cmd` 做 schema 檢查，但必須先確認 `projects list` 是 Looty。
- 2026-07-09 已用 Dashboard SQL Editor 清掉舊 `players`、`player_balances`、`ensure_my_player_v1()`。
- 2026-07-09 已用 DB password 重新 link pooler；CLI 在使用正確 Looty token 時可讀寫 Looty DB。
- 2026-07-09 已用 CLI 清掉未使用的 `access_whitelist`、`site_settings`。
- 2026-07-09 已刪除未追蹤的 `20260709131000_baseline_core_schema.sql` 草稿；目前不保留 baseline migration。
- 2026-07-09 已在本機建立 `.env.supabase.local` 並測試 `.\scripts\supabase-looty.cmd projects list` 成功看到 `Looty` / `lsazydefvnuqglultqii` / `linked: true`。
- 2026-07-10 已建立 `20260709170000_create_platform_account_wallet_core.sql` migration 草稿，內容是平台帳號、錢包、交易流水、game session、game round 骨架；使用者已確認方向，但尚未套用到遠端 Supabase。

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

- 先跑 `npm run build`
- 啟動本機 Vite
- 啟動 headless Chrome / Edge
- 驗首頁、Loader 缺 slug、Admin login、共用錯誤視窗

目前已知：

- `npm run build` 可通過。
- 某些本機 Windows Chrome / Edge CDP 環境可能讓 `npm run smoke` 卡在 browser 自動化指令；腳本已加 timeout，應快速失敗而不是卡死。
- 若要指定 browser，用 `SMOKE_BROWSER_PATH`。

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

目前可先使用 Cloudflare Pages 現有網址，不需要先更換或綁定正式網域。正式網域等確定要正式營運前再決定。

舊的 Direct Upload Pages 專案先保留，不要直接覆蓋或刪除；退場方式也等正式營運前再決定。

2026-07-09 production smoke check：

- `https://looty-git.pages.dev/` 可載入。
- Lobby 可從 Supabase 讀到公開遊戲。
- `https://looty-git.pages.dev/game/?slug=color-guess` 可載入 Game Loader，iframe 指向 `https://color-guess-68b.pages.dev/`。
- `/admin/*` 目前沒有 Cloudflare Access 攔截；Admin 保護由 Looty 自己的 Supabase session + `admin_users` 白名單負責。

Cloudflare 操作提醒：

- 這台 Chrome 可能有多個 Cloudflare 帳號；操作 Looty 前先確認左上角帳號是 `pixelgd.games@gmail.com`。
- 不要在未確認帳號時修改 Pages、Workers、Zero Trust 或環境變數。

若遊戲本體放在 `public/game/<slug>/index.html`，建置後對外路徑是：

```text
/game/<slug>/index.html
```

## Cloudflare Access 選用加固

目前 Admin 已有 Supabase Google OAuth + `admin_users` email 白名單保護，MVP 階段已足夠。

Cloudflare Access 不是目前登入功能的前提，也不是 MVP blocker。之後如果要再加一層入口保護，可以把 `/admin/*` 納入 Cloudflare Access，讓使用者進入 Admin HTML 前先通過 Cloudflare。

2026-07-09 已確認 `looty-git.pages.dev/admin/*` 目前沒有 Cloudflare Access 保護，這是預期狀態。

若要設定，預計：

- hostname: `looty-git.pages.dev`
- path: `/admin/*`
- Application type: Self-hosted
- allowed Google emails:
  - `pixelgd.games@gmail.com`
  - `johnnyli1226@gmail.com`
- 前端 `admin_users` 白名單檢查保留，作為應用層保護。

正式網域綁定後，如果有啟用 Cloudflare Access，也要把正式網域的 `/admin/*` 納入保護。

## 未來可改善

以下是後續可改善事項，不是目前 MVP blocker：

- `admin_users` 仍以 email 白名單判斷；目前可用，未來可視需要升級為 auth user id。
- 前台會員登入停用，尚未設計新的 `/me` 或會員中心。
- Cloudflare Access 未啟用；目前不是 MVP blocker，可視安全需求再加。
- 正式網域與舊 Direct Upload Pages 退場方式等正式營運前再決定。
- Automated tests 還不完整。

## 交接提醒

1. 不要假設 repo 有 `enabled-games` 白名單。
2. 新增遊戲時確認 `published`、`launch_url`、`sort_order`。
3. Loader 啟動失敗時，優先查 `public_games_v1` 是否查得到該 `slug`。
4. 調整公開規則時，優先改 DB view / policy，不要加本地硬編碼。
5. 改部署前，先保住目前可用的靜態輸出流程。
