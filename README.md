# Looty

Looty 是一個用 **Vanilla JS + Vite** 做的多頁前端專案，負責三件事：

- 顯示公開遊戲 Lobby
- 透過 `slug` 把玩家送進對應遊戲
- 提供輕量的 Admin 後台管理遊戲資料

這份 README 以目前 repo 的實作為準，不沿用舊版交接文件裡已過時的描述。

## 目前狀態

截至 2026-05-02，目前 repo 的實作狀態如下：

- Lobby 直接讀取 Supabase 的 `public_games_v1`
- Game Loader 直接用 `slug` 查 `public_games_v1`，並以 `launch_url` 載入遊戲
- Admin 使用 Google OAuth + `admin_users` email 白名單
- Admin 可管理 `name`、`slug`、`thumbnail`、`type`、`supports_live`、`published`、`launch_url`、`sort_order`
- 專案輸出為靜態站，Cloudflare Pages 已接上 Git 自動部署
- `npm run build` 已於 2026-05-02 再次驗證成功

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
- Member Auth: 首頁彈跳視窗
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
- [src/pages/lobby/hero.js](/D:/Studio/Project_Code/looty/src/pages/lobby/hero.js): 設定首頁主視覺
- [src/pages/lobby/game-grid.js](/D:/Studio/Project_Code/looty/src/pages/lobby/game-grid.js): 渲染遊戲卡片與 empty state
- [src/pages/lobby/dom.js](/D:/Studio/Project_Code/looty/src/pages/lobby/dom.js): 集中 DOM 取得
- [src/pages/lobby/utils.js](/D:/Studio/Project_Code/looty/src/pages/lobby/utils.js): 共用小工具

目前前台首頁已改成：

- 不顯示分類 tabs
- 不做前端分類分頁
- 直接顯示全部公開遊戲
- 主視覺使用固定 banner 圖
- Top bar 的 `登入 / 註冊` 目前改為開啟首頁彈跳視窗
- 會員登入 / 註冊 UI 目前共用同一組 modal 表單，尚未接 Supabase auth

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

目前 repo **沒有** 再使用本地 `enabled-games` 白名單，也沒有 `src/config/game-urls.js`。  
公開可見性與可啟動性應以 Supabase 資料與 `public_games_v1` 的 view 定義為準。

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
- 開啟 Loader、靜態頁、實際啟動網址
- 刪除遊戲

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
- [src/auth/shared.js](/D:/Studio/Project_Code/looty/src/auth/shared.js): 前台會員彈窗共用表單設定與互動
- [src/lib/supabaseClient.js](/D:/Studio/Project_Code/looty/src/lib/supabaseClient.js): 唯一 Supabase client
- [public/hero/looty-hero-main.webp](/D:/Studio/Project_Code/looty/public/hero/looty-hero-main.webp): 首頁主視覺圖
- [src/pages/lobby/index.js](/D:/Studio/Project_Code/looty/src/pages/lobby/index.js): Lobby 初始化入口
- [src/pages/lobby/auth-modal.js](/D:/Studio/Project_Code/looty/src/pages/lobby/auth-modal.js): 首頁會員彈窗互動
- [src/pages/lobby/data.js](/D:/Studio/Project_Code/looty/src/pages/lobby/data.js): Lobby 資料層
- [src/pages/lobby/game-grid.js](/D:/Studio/Project_Code/looty/src/pages/lobby/game-grid.js): Lobby 卡片渲染
- [src/pages/lobby/hero.js](/D:/Studio/Project_Code/looty/src/pages/lobby/hero.js): Lobby 主視覺設定
- [src/styles/theme.css](/D:/Studio/Project_Code/looty/src/styles/theme.css): 前台共用色票與 top bar 樣式
- [src/styles/auth.css](/D:/Studio/Project_Code/looty/src/styles/auth.css): 會員表單共用樣式
- [src/styles/lobby.css](/D:/Studio/Project_Code/looty/src/styles/lobby.css): Lobby 與會員彈窗樣式

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

例如目前 repo 內的 demo 頁：

- 原始檔：`public/game/demo-slot/index.html`
- 對外路徑：`/game/demo-slot/index.html`

## 已知待補點

- `admin_users` 目前仍以 email 白名單判斷，尚未升級為 auth user id
- 刪除遊戲後仍使用 `location.reload()`
- Admin UI 仍是很輕量的原始 HTML，尚未做排版優化
- 前台會員的 `登入 / 註冊` 目前是首頁彈跳視窗，尚未接 Supabase auth 流程
- 目前沒有 automated tests

## 交接提醒

1. 目前不要再假設 repo 內有 `enabled-games` 白名單。
2. 若新增遊戲，要一起確認 `published`、`launch_url`、`sort_order` 是否正確。
3. `type` / `supports_live` 目前仍保留在資料模型裡，之後可以再打開分類 UI。
4. 若要讓遊戲能從 Loader 啟動，請優先檢查 `public_games_v1` 是否有把該遊戲查出來。
5. 若要改部署方式，先保住目前可用的靜態輸出流程。
