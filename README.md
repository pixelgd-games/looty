# Looty

Looty 是一個用 **Vanilla JS + Vite** 做的多頁前端專案，負責三件事：

- 顯示公開遊戲 Lobby
- 透過 `slug` 把玩家送進對應遊戲
- 提供輕量的 Admin 後台管理遊戲資料

這份 README 以目前 repo 的實作為準，不沿用舊版交接文件裡已過時的描述。

## 目前狀態

截至 2026-05-01，目前 repo 的實作狀態如下：

- Lobby 直接讀取 Supabase 的 `public_games_v1`
- Game Loader 直接用 `slug` 查 `public_games_v1`，並以 `launch_url` 載入遊戲
- Admin 使用 Google OAuth + `admin_users` email 白名單
- Admin 可管理 `name`、`slug`、`thumbnail`、`type`、`supports_live`、`published`、`launch_url`、`sort_order`
- 專案輸出為靜態站，部署方式是 `npm run build` 後上傳 `dist`
- `npm run build` 已於 2026-05-01 再次驗證成功

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

Lobby 由 [src/main.js](/D:/Studio/Project_Code/looty/src/main.js) 啟動，實際的資料查詢與篩選在 [src/pages/lobby/grid.js](/D:/Studio/Project_Code/looty/src/pages/lobby/grid.js)。

目前會從 `public_games_v1` 讀取：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `sort_order`

畫面上的分類規則目前是：

- `games` -> `type === "casual"`
- `casino` -> `slot / fish / card / arcade`
- `premium` -> `type === "adult"`
- `live` -> `supports_live === true`

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

## 專案結構

- [index.html](/D:/Studio/Project_Code/looty/index.html): Lobby 入口
- [game/index.html](/D:/Studio/Project_Code/looty/game/index.html): Game Loader
- [admin/login/index.html](/D:/Studio/Project_Code/looty/admin/login/index.html): Admin 登入頁
- [admin/games/index.html](/D:/Studio/Project_Code/looty/admin/games/index.html): Admin 遊戲列表
- [admin/games/new/index.html](/D:/Studio/Project_Code/looty/admin/games/new/index.html): 新增遊戲頁
- [admin/games/edit/index.html](/D:/Studio/Project_Code/looty/admin/games/edit/index.html): 編輯遊戲頁
- [src/lib/supabaseClient.js](/D:/Studio/Project_Code/looty/src/lib/supabaseClient.js): 唯一 Supabase client
- [src/styles/lobby.css](/D:/Studio/Project_Code/looty/src/styles/lobby.css): Lobby 樣式

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

- Cloudflare Pages
- 手動上傳整個 `dist/`

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
- 目前沒有 automated tests
- Cloudflare Pages 與 GitHub 的自動部署流程尚未打通

## 交接提醒

1. 目前不要再假設 repo 內有 `enabled-games` 白名單。
2. 若新增遊戲，要一起確認 `published`、`launch_url`、`sort_order` 是否正確。
3. `premium` 分類目前對應 `type === "adult"`。
4. 若要讓遊戲能從 Loader 啟動，請優先檢查 `public_games_v1` 是否有把該遊戲查出來。
5. 若要改部署方式，先保住目前可用的靜態輸出流程。
