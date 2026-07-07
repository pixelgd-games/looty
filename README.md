# Looty

Looty 是一個用 **Vanilla JS + Vite** 做的多頁前端專案，負責三件事：

- 顯示公開遊戲 Lobby
- 透過 `slug` 把玩家送進對應遊戲
- 提供輕量的 Admin 後台管理遊戲資料

這份 README 以目前 repo 的實作為準，不沿用舊版交接文件裡已過時的描述。

## 目前狀態

截至 2026-07-07，目前 repo 的實作狀態如下：

- Lobby 直接讀取 Supabase 的 `public_games_v1`
- Game Loader 直接用 `slug` 查 `public_games_v1`，並以 `launch_url` 載入遊戲
- 前台會員登入目前已從 Lobby 移除，首頁先維持純公開遊戲入口
- Admin 使用 Google OAuth + `admin_users` email 白名單
- Admin 可管理 `name`、`slug`、`thumbnail`、`type`、`supports_live`、`published`、`launch_url`、`sort_order`
- 前台 / Loader / Admin 已開始共用錯誤視窗與錯誤代碼
- 專案輸出為靜態站，Cloudflare Pages 已接上 Git 自動部署
- `npm run build` / `npm run smoke` 已於 2026-07-07 再次驗證成功

## 最新前台改版前提

以下是目前已確認、接下來前台改版應遵守的產品與技術前提：

- Looty 是 H5 遊戲平台 / Lobby，不是單一遊戲官網
- 前台公開遊戲列表應優先讀取 `public_games_v1`
- 不改 Supabase schema
- 不改 Cloudflare Pages 靜態部署架構
- 不改成 React / Vue / Next.js
- 維持 Vanilla JS + Vite + Supabase client

目前前台的 UI 方向是：

- 遊戲數量還不多時，暫時不顯示分類 tabs
- 直接顯示 `public_games_v1` 回傳的全部公開可玩遊戲
- 後端仍保留 `type`、`supports_live`、`published`、`launch_url`、`sort_order`
- 等遊戲數量增加後，再考慮打開分類 UI

## 技術棧

- Frontend: Vanilla JS + Vite
- Auth / Database / View: Supabase
- Hosting: Cloudflare Pages

## 路由

- Lobby: `/`
- Game Loader: `/game/?slug=<slug>`
- Admin Login: `/admin/login/`
- Admin Games: `/admin/games/`
- Admin New Game: `/admin/games/new/`
- Admin Edit Game: `/admin/games/edit/?id=<uuid>`

## 目前的資料流

### Lobby

Lobby 由 [src/main.js](/D:/Studio/Project_Code/looty/src/main.js) 啟動，首頁流程目前拆成以下模組：

- [src/pages/lobby/index.js](/D:/Studio/Project_Code/looty/src/pages/lobby/index.js): 串起首頁初始化流程
- [src/pages/lobby/lobby.js](/D:/Studio/Project_Code/looty/src/pages/lobby/lobby.js): 輸出 Lobby HTML 結構
- [src/pages/lobby/data.js](/D:/Studio/Project_Code/looty/src/pages/lobby/data.js): 讀取 `public_games_v1`
- [src/pages/lobby/game-grid.js](/D:/Studio/Project_Code/looty/src/pages/lobby/game-grid.js): 渲染遊戲卡片與 empty state
- [src/pages/lobby/dom.js](/D:/Studio/Project_Code/looty/src/pages/lobby/dom.js): 集中 DOM 取得
- [src/pages/lobby/utils.js](/D:/Studio/Project_Code/looty/src/pages/lobby/utils.js): 共用小工具

目前前台首頁已改成：

- 不顯示分類 tabs
- 不做前端分類分頁
- 直接顯示全部公開遊戲
- 主視覺使用固定 banner 圖
- 不顯示前台登入 / 註冊 UI
- 主視覺直接以圖片元素顯示，避免 banner 被背景裁切

目前會從 `public_games_v1` 讀取：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `sort_order`

目前 `type` / `supports_live` 仍然保留在資料與卡片資訊中，
但不再作為首頁的分頁切換 UI。

### Game Loader

[game/index.html](/D:/Studio/Project_Code/looty/game/index.html) 會：

1. 從 query string 取得 `slug`
2. 查詢 `public_games_v1`
3. 取出 `launch_url`
4. 以 `iframe` 載入遊戲

目前 Game Loader 的載入呈現方式是：

- `iframe` 從一開始就固定滿版，避免 loading 消失時造成畫面位移
- 進入遊戲時保留全畫面 Loading overlay
- overlay 顯示 `Looty`、loading ring 與 `Entering game...`
- 遊戲 iframe 初次 load 後，overlay 會淡出再移除
- 目前決策是先維持這個 overlay 版本，不改成無提示或透明提示

Loader 的預期錯誤會用共用錯誤視窗呈現，不再用 uncaught error 表達：

- `LOOTY-GAME-001`: 缺少 `slug`
- `LOOTY-GAME-002`: 找不到指定遊戲
- `LOOTY-GAME-003`: 遊戲啟動網址未設定
- `LOOTY-GAME-004`: 遊戲資料讀取失敗

目前 repo **沒有** 再使用本地 `enabled-games` 白名單，也沒有 `src/config/game-urls.js`。  
公開可見性與可啟動性應以 Supabase 資料與 `public_games_v1` 的 view 定義為準。

### Frontend Member Auth

前台會員登入目前已從 Lobby 移除，首頁先維持純公開遊戲入口。Admin 仍保留自己的 Google OAuth + `admin_users` 白名單流程。

DB 端曾規劃的會員骨架仍可作為後續恢復會員功能時的參考：

- `public.players`
- `public.player_balances`
- `player_balances.player_id -> players.id`
- `players`、`player_balances`、`admin_users`、`access_whitelist`、`site_settings` 都已開 RLS

曾採用的 RPC 是：

- function name：`public.ensure_my_player_v1()`
- 作用：登入後確保目前 `auth.uid()` 對應的 `players` 與 `player_balances` 存在
- 回傳欄位：`player_id`、`auth_user_id`、`balance`
- 權限：只保留 `authenticated`、`postgres`、`service_role` 可執行；`PUBLIC` / `anon` 已移除 `EXECUTE`

若之後恢復前台會員，可參考過去流程：

1. login 成功後呼叫 `supabase.auth.signInWithPassword()`
2. login 成功後呼叫 `supabase.rpc("ensure_my_player_v1")`
3. register 成功且有 session 時，呼叫 `supabase.rpc("ensure_my_player_v1")`
4. register 成功但沒有 session 時，不呼叫 RPC，改顯示「請先驗證信箱後再登入」

若之後恢復前台會員，不建議前台直接 `insert players` / `insert player_balances`，原因是：

- 會員初始化邏輯集中在 DB RPC，比較不容易前後端分岔
- RLS 與 `auth.uid()` 綁定可以留在資料層處理
- 前端只需要負責 auth 與顯示，不需要知道建立 player 的細節

也可暫時不採用 `auth.users` trigger，原因是：

- 第一版先完成最小可工作的閉環
- 登入後顯式呼叫 RPC 比較容易觀察與除錯
- 先避免把會員初始化散到 trigger 與前端兩邊

前台會員功能恢復前，以下仍不屬於目前 Lobby 範圍：

- guest merge
- `auth.users` trigger
- Worker
- `/me` 完整會員中心
- `displayName` 寫入 `players`
- 餘額歷史 / 點數流水

目前 repo 已不包含前台會員登入 UI 或前台會員 auth 模組。

## Admin 現況

[src/admin/auth.js](/D:/Studio/Project_Code/looty/src/admin/auth.js) 負責：

- Google OAuth 登入
- 取得 Supabase session
- 用 `session.user.email` 檢查 `admin_users`
- 不通過時登出並導回登入頁

[src/admin/games.js](/D:/Studio/Project_Code/looty/src/admin/games.js) 負責：

- 列出 `games`
- 顯示 `launch_url` 與 `sort_order`
- 前往編輯頁
- 開啟 Loader 與實際啟動網址；只有 `launch_url` 指向本地靜態遊戲時才顯示靜態頁連結
- 刪除遊戲，成功後局部更新列表，不再整頁 reload

[src/admin/game-form.js](/D:/Studio/Project_Code/looty/src/admin/game-form.js) 負責：

- 保護新增 / 編輯頁，只允許 admin 進入
- 新增與編輯共用表單
- `slug` 基本驗證
- `sort_order` 整數驗證

目前後台可管理的 `type` 值：

- `slot`
- `fish`
- `card`
- `arcade`
- `casual`
- `adult`

## 目前假設的資料模型

目前前端實作假設 `games` 至少具備以下欄位：

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

另外，前端也假設 `public_games_v1` 至少暴露：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `launch_url`
- `sort_order`

`public_games_v1` 的實際過濾條件與排序邏輯在資料庫端維護；目前 repo 的預期是：

- 只有公開遊戲會出現在 Lobby / Loader 查詢結果中
- `launch_url` 必須可用，遊戲才真正能啟動

目前已確認的 view definition 概念如下：

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

因此前台讀 `public_games_v1` 時，應把資料視為：

- 已公開
- 可顯示
- 可啟動

前台不需要再自己判斷 `published`，因為 `public_games_v1` 本身沒有這個欄位。

## 專案結構

- [index.html](/D:/Studio/Project_Code/looty/index.html): Lobby 入口
- [game/index.html](/D:/Studio/Project_Code/looty/game/index.html): Game Loader
- [admin/login/index.html](/D:/Studio/Project_Code/looty/admin/login/index.html): Admin 登入頁
- [admin/games/index.html](/D:/Studio/Project_Code/looty/admin/games/index.html): Admin 遊戲列表
- [admin/games/new/index.html](/D:/Studio/Project_Code/looty/admin/games/new/index.html): 新增遊戲頁
- [admin/games/edit/index.html](/D:/Studio/Project_Code/looty/admin/games/edit/index.html): 編輯遊戲頁
- [src/lib/supabaseClient.js](/D:/Studio/Project_Code/looty/src/lib/supabaseClient.js): 唯一 Supabase client
- [public/hero/looty-hero-main.webp](/D:/Studio/Project_Code/looty/public/hero/looty-hero-main.webp): 首頁主視覺圖
- [src/pages/lobby/index.js](/D:/Studio/Project_Code/looty/src/pages/lobby/index.js): Lobby 初始化入口
- [src/pages/lobby/data.js](/D:/Studio/Project_Code/looty/src/pages/lobby/data.js): Lobby 資料層
- [src/pages/lobby/game-grid.js](/D:/Studio/Project_Code/looty/src/pages/lobby/game-grid.js): Lobby 卡片渲染
- [src/styles/theme.css](/D:/Studio/Project_Code/looty/src/styles/theme.css): 前台共用色票與基礎樣式
- [src/styles/lobby.css](/D:/Studio/Project_Code/looty/src/styles/lobby.css): Lobby 版面與遊戲卡片樣式

## 環境變數

本機需要 `.env.local`：

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## 本機開發

```bash
npm install
npm run dev
```

注意：

- 這是 Vite 多頁專案，請用 Vite dev server，不要直接開 HTML
- `vite.config.js` 的多頁 `input` 不能拿掉，否則 `/game` 與 `/admin` 頁面在 build 後會失效

## 建置與部署

```bash
npm run build
```

建置輸出在 `dist/`。

## 最小 smoke check

```bash
npm run smoke
```

這個檢查會先跑 `npm run build`，再啟動本機 Vite 與 headless Chrome / Edge，確認：

- 首頁能載入
- Loader 缺少 `slug` 時會出現錯誤畫面與錯誤代碼
- Admin login 能載入
- 共用錯誤視窗能顯示錯誤代碼

如果本機找不到 Chrome / Edge，可用 `SMOKE_BROWSER_PATH` 指定 Chromium browser 執行檔。

## Cloudflare Access 待設定

後台 `/admin/*` 之後應加上 Cloudflare Access，作為進入 Admin HTML 前的第一層保護。
目前尚未設定，先記錄預計設定如下：

- 測試 hostname：`looty-git.pages.dev`
- 保護路徑：`/admin/*`
- 先只保護 Admin，不保護首頁 `/`、Game Loader `/game/` 或公開遊戲頁
- Application type：Self-hosted
- 允許的 Google email：
  - `pixelgd.games@gmail.com`
  - `johnnyli1226@gmail.com`
- 非允許帳號處理：使用 Cloudflare Access 預設拒絕頁
- 先不要 redirect 回首頁，避免測試時混淆
- 前端 `admin_users` 白名單檢查保留，作為第二層保護

正式網域綁定後，需要再新增或調整 Access application，把正式網域的 `/admin/*` 也納入保護。

目前已知部署模式：

- Cloudflare Pages project：`looty-git`
- GitHub repo：`pixelgd-games/looty`
- Production branch：`main`
- Root directory：留空
- Framework preset：`Vite`
- Build command：`npm run build`
- Build output directory：`dist`
- Frontend environment variables：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`
- 舊的 Direct Upload Pages 專案先保留，不要直接覆蓋或刪除

如果遊戲本體放在 `public/game/<slug>/index.html`，建置後對外路徑會是：

```text
/game/<slug>/index.html
```

## 前台會員狀態

前台會員登入目前已停用，線上 Lobby 不應出現登入 / 註冊 modal、會員狀態列或餘額顯示。後續若要恢復會員功能，應重新設計前台入口與對應測試流程。

## 已知待補點

- `admin_users` 目前仍以 email 白名單判斷，尚未升級為 auth user id
- Admin UI 仍是很輕量的原始 HTML，尚未做排版優化
- 前台會員登入目前停用，尚未規劃新的 `/me` 完整會員中心
- 前台會員登入恢復前，guest merge 與 `auth.users` trigger 初始化都先不納入
- 目前只有最小 smoke check，尚未有完整 automated tests

## 交接提醒

1. 目前不要再假設 repo 內有 `enabled-games` 白名單。
2. 若新增遊戲，要一起確認 `published`、`launch_url`、`sort_order` 是否正確。
3. `type` / `supports_live` 目前仍保留在資料模型裡，之後可以再打開分類 UI。
4. 若要讓遊戲能從 Loader 啟動，請優先檢查 `public_games_v1` 是否有把該遊戲查出來。
5. 若要改部署方式，先保住目前可用的靜態輸出流程。
