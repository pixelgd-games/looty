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
- Admin 已可管理 `games` 基本上架資料。
- Admin 已支援 `launch_url` 與 `sort_order`。
- Admin 列表已避免用資料字串拼 HTML。
- `launch_url` 已集中做格式檢查，只接受 `http(s)` 與 `/` 開頭站內路徑。
- 前台會員登入已從 Lobby 移除。
- Cloudflare Pages Git 自動部署已接到 `looty-git` 的 `main`。
- `npm run build` 可成功輸出多頁靜態站。

## 目前前台策略

- Looty 是 H5 遊戲平台 / Lobby，不是單一遊戲官網。
- 遊戲數量還少時，不顯示分類 tabs。
- Lobby 直接顯示全部公開可玩遊戲。
- `type` / `supports_live` 保留在資料裡，等遊戲數量增加後再開分類 UI。
- Hero 使用固定主視覺 banner。
- 不顯示登入 / 註冊 / 會員狀態 / 餘額。

## 目前 Loader 策略

- Loader 保留全畫面 Loading overlay。
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
- 幣流 / ledger / settlement。
- Aura / Hype5 / FuGhost / Spinnova 的正式深度整合。

## 會員功能立場

前台會員登入目前停用。

若未來恢復會員功能，建議：

- 先重新設計前台入口，不要直接把舊 modal 塞回 Lobby。
- 會員初始化放在 DB RPC 或後端流程，不要讓前端直接 `insert players` / `player_balances`。
- 先定義登入後落點，例如 `/me` 或會員中心，再恢復 UI。

## 資料來源原則

- `games` 是 Admin 管理來源。
- `public_games_v1` 是前台公開讀取來源。
- `published` 與 `launch_url` 的公開規則應在 DB view / policy 處理。
- 不要回頭加本地 `enabled-games` 白名單。
- 不要把遊戲可見性拆成多份設定。

## 下一步優先順序

1. 設定 Cloudflare Access 保護 `/admin/*`。
2. 把 `admin_users` 從 email 白名單升級為 auth user id。
3. 補 Admin 基本排版與手機版可用性。
4. 決定正式網域與舊 Direct Upload Pages 的退場方式。
5. 視需要擴充 automated tests。
6. 若要恢復會員功能，先設計 `/me` 或會員中心骨架。

## 給 AI 的提醒

- 不要把 `LOOTY_MVP.md` 當作欄位或路由真相來源。
- 要改程式前，先讀 `README.md`。
- 要理解大系統背景，再讀 `FLASH.md`。
- MVP 的核心不是功能做滿，而是主路徑穩定。
