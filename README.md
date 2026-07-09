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

Looty 不負責：

- 遊戲本體玩法與前端表現
- 即時多人同步
- 博奕結果裁決 / RNG
- 錢包、ledger、settlement
- 完整會員中心與點數流水

這些能力如果需要，應由 Flash 其他模組或後續需求接入，不要硬塞進 Looty。

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

目前已知部署模式：

- Cloudflare Pages project: `looty-git`
- GitHub repo: `pixelgd-games/looty`
- Production branch: `main`
- Root directory: 留空
- Framework preset: `Vite`
- Build command: `npm run build`
- Build output directory: `dist`
- Frontend env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

舊的 Direct Upload Pages 專案先保留，不要直接覆蓋或刪除。

若遊戲本體放在 `public/game/<slug>/index.html`，建置後對外路徑是：

```text
/game/<slug>/index.html
```

## Cloudflare Access 待設定

後台 `/admin/*` 之後應加 Cloudflare Access，作為進入 Admin HTML 前的第一層保護。

預計：

- hostname: `looty-git.pages.dev`
- path: `/admin/*`
- Application type: Self-hosted
- allowed Google emails:
  - `pixelgd.games@gmail.com`
  - `johnnyli1226@gmail.com`
- 前端 `admin_users` 白名單檢查保留，作為第二層保護。

正式網域綁定後，要把正式網域的 `/admin/*` 也納入保護。

## 已知待補

- `admin_users` 仍以 email 白名單判斷，尚未升級為 auth user id。
- Admin UI 還是輕量原始 HTML，尚未做完整排版與手機版優化。
- 前台會員登入停用，尚未設計新的 `/me` 或會員中心。
- Cloudflare Access 尚待設定。
- Automated tests 還不完整。

## 交接提醒

1. 不要假設 repo 有 `enabled-games` 白名單。
2. 新增遊戲時確認 `published`、`launch_url`、`sort_order`。
3. Loader 啟動失敗時，優先查 `public_games_v1` 是否查得到該 `slug`。
4. 調整公開規則時，優先改 DB view / policy，不要加本地硬編碼。
5. 改部署前，先保住目前可用的靜態輸出流程。
