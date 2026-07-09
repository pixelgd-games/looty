# Looty MVP

這份文件只記錄 **MVP 產品邊界與下一步**。

目前 repo 的實作細節、路由、欄位、部署與檔案位置，請看 `README.md`。不要在這份文件重複維護技術契約。

## 一句話

Looty MVP 要先把這條主路徑做穩：

```text
看到遊戲 -> 點進遊戲 -> 成功啟動遊戲
```

同時讓遊戲資料可以在雲端後台維護。

## MVP 成功條件

1. 玩家能看到公開遊戲列表。
2. 玩家能點進遊戲。
3. Game Loader 能依 `slug` 載入正確遊戲。
4. 遊戲名稱、封面、分類、是否上架、啟動網址、排序能在 Admin 管理。
5. 專案能穩定 build 成 Cloudflare Pages 靜態站。

## 目前已達成

- Lobby 已可從 `public_games_v1` 顯示公開遊戲。
- Game Loader 已可從 `public_games_v1` 取 `launch_url` 並載入 iframe。
- Game Loader 已有 loading overlay 與明確錯誤碼。
- Admin Login 已可用 Google OAuth + `admin_users` 白名單。
- Admin 頁面目前已有 Supabase session + `admin_users` 白名單保護，MVP 階段已足夠。
- Admin 已可管理 `games` 基本上架資料。
- Admin 已支援 `launch_url` 與 `sort_order`。
- Admin 列表已避免用資料字串拼 HTML。
- `launch_url` 已集中做格式檢查，只接受 `http(s)` 與 `/` 開頭站內路徑。
- 前台會員登入已從 Lobby 移除。
- Cloudflare Pages Git 自動部署已接到 `looty-git` 的 `main`。
- 2026-07-09 已確認 `looty-git.pages.dev` production 可載入，Cloudflare 帳號為 `pixelgd.games@gmail.com`。
- Cloudflare env vars 已指向 Looty Supabase `lsazydefvnuqglultqii`。
- `npm run build` 可成功輸出多頁靜態站。
- 2026-07-10 已套用平台骨架 migration，新增玩家帳號、平台錢包、交易流水、game session、game round 的 DB 地基。
- 2026-07-10 已套用第一版 game session / wallet RPC，目前只開給 `service_role`。
- 2026-07-10 已部署 Supabase Edge Function `looty-gateway`，支援 `create-session` 與第一版 wallet endpoints。
- 2026-07-10 Game Loader 已接 `looty-gateway/create-session`，進遊戲前會建立 session 並把 Looty session 參數附加到 iframe URL。
- 2026-07-10 已確認 `npm run build` 與 `npm run smoke` 通過。

## 目前工作方向

目前不是重做架構或補大型功能的階段。MVP 主路徑已經可用，接下來先以現有 Cloudflare Pages 網址和電腦版 Admin 驗證實際內容。

同時要先把平台與遊戲責任邊界整理清楚。未來會有兩種方向：外部遊戲接進 Looty、Looty 自己的遊戲接到外部平台。帳號、Guest、錢包、game session、Gateway 的分工要先在文件裡定好，不要等開始寫功能才混在一起。

現在主要要做：

1. 用 Admin 上架 / 下架 / 編輯遊戲資料。
2. 確認 Lobby 能看到公開遊戲。
3. 確認 Game Loader 能用 `slug` 開啟正確遊戲。
4. 挑一個乾淨的遊戲 repo，依 Looty session 參數正式接入 wallet endpoints。
5. 持續整理 `GAME_PLATFORM_INTEGRATION.md` 的遊戲接入規則。
6. 有具體問題時再針對該問題修正。

現在不要主動切正式網域、重做 Admin、恢復會員中心 UI、做完整錢包功能或把 Flash 兄弟模組接進來。

## 目前前台策略

- Looty 是 H5 遊戲平台 / Lobby，不是單一遊戲官網。
- 遊戲數量還少時，不顯示分類 tabs。
- Lobby 直接顯示全部公開可玩遊戲。
- `type` / `supports_live` 保留在資料裡，等遊戲數量增加後再開分類 UI。
- Hero 使用固定主視覺 banner。
- 不顯示登入 / 註冊 / 會員狀態 / 餘額。

## 目前 Loader 策略

- Loader 保留全畫面 Loading overlay。
- Loader 先建立 Looty game session，再啟動 iframe。
- Loader 會把 `looty_session_id`、`looty_launch_token`、`looty_game_id`、`looty_currency`、`looty_gateway_url` 傳給遊戲。
- iframe 一開始就滿版載入，避免 overlay 消失時畫面跳動。
- 外層 document 保留原生 scroll，配合 sticky 遊戲容器，讓手機瀏覽器網址列有機會收合。
- overlay 可見時接住垂直滑動手勢，隱藏後才把觸控交回 iframe。

## Admin 定位

Admin 目前是 **輕量但可用** 的遊戲上架後台。

現階段要維持：

- 可登入。
- 可看列表。
- 可新增 / 編輯 / 刪除遊戲。
- 可設定上架狀態、啟動網址、排序。

現階段不要把 Admin 做成完整營運系統。

目前 Admin 已經需要 Supabase Google OAuth 登入，並會檢查 `admin_users` 白名單。這個保護在 MVP 階段已足夠，不需要為了 MVP 先加 Cloudflare Access，也不需要立刻把 `admin_users` 改成 auth user id。

目前 Admin 以電腦版可用為準，已能完成遊戲上架、下架、新增、編輯、刪除與排序等核心管理操作。手機版優化不是目前待辦，等實際需要再處理。

目前可先使用 Cloudflare Pages 現有網址，不需要先更換或綁定正式網域。正式網域與舊 Direct Upload Pages 退場方式，等確定要正式營運前再決定。

## 目前不做

以下不是 MVP blocker：

- 完整玩家帳號平台。
- 前台會員中心 `/me`。
- guest merge。
- `auth.users` trigger 初始化。
- 餘額歷史 / 點數流水。
- 排行榜。
- 官方挑戰系統。
- 複雜營運後台 UI。
- Admin 手機版優化。
- 正式網域切換。
- 舊 Direct Upload Pages 退場。
- 幣流 / ledger / settlement。
- Aura / Hype5 / FuGhost / Spinnova 的正式深度整合。

## 會員功能立場

前台會員登入目前停用。

若未來恢復會員功能，建議：

- 先重新設計前台入口，不要直接把舊 modal 塞回 Lobby。
- 會員、Guest、錢包初始化放在 DB RPC 或後端流程，不要讓前端直接 `insert player_accounts` / `wallet_accounts` / `wallet_transactions`。
- 先定義登入後落點，例如 `/me` 或會員中心，再恢復 UI。

## 資料來源原則

- `games` 是 Admin 管理來源。
- `public_games_v1` 是前台公開讀取來源。
- `published` 與 `launch_url` 的公開規則應在 DB view / policy 處理。
- 不要回頭加本地 `enabled-games` 白名單。
- 不要把遊戲可見性拆成多份設定。

## 未來可改善

以下是待辦方向，不代表現在必須立刻施工：

1. 視需要擴充 automated tests。
2. 視需要把 `admin_users` 從 email 白名單升級為 auth user id。
3. 視安全需求再評估 Cloudflare Access 保護 `/admin/*`。
4. 若要恢復會員功能，先設計 `/me` 或會員中心骨架。
5. 正式營運前，再決定正式網域與舊 Direct Upload Pages 的退場方式。

## 給 AI 的提醒

- 不要把 `LOOTY_MVP.md` 當作欄位或路由真相來源。
- 要改程式前，先讀 `README.md`。
- 要理解大系統背景，再讀 `FLASH.md`。
- MVP 的核心不是功能做滿，而是主路徑穩定。
