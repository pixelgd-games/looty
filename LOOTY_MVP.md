# Looty MVP 規劃

## 當前產品決策

Looty 現階段不以「完整平台功能」為第一優先，
而是先聚焦成一個可用的遊戲入口平台：

- 玩家可以看到可開放的遊戲
- 玩家可以點進遊戲
- Looty 可以正確把玩家送進對應遊戲

換句話說，Looty 第一階段先做到「能開遊戲來玩」即可，
不需要一開始就把玩家平台、排行榜、官方挑戰、完整後台營運介面全部做滿。

## 現階段核心目標

Looty MVP 的成功條件：

1. Lobby 能顯示可公開的遊戲列表。
2. 玩家點擊遊戲後，能透過 Game Loader 正確進入遊戲。
3. 遊戲是否上架、名稱、封面、遊戲連結等資訊，可以直接在雲端管理。
4. 整個流程可部署在 Cloudflare Pages，並以 Supabase 作為資料來源。

## 現階段不優先做的事

以下項目不列為 Looty MVP 必做：

- 自製 Admin 後台網頁
- 完整玩家帳號平台
- 排行榜
- 官方挑戰系統
- 幣流 / 錢包 / ledger / settlement
- Aura / Hype5 / FuGhost / Spinnova 的正式深度整合
- 複雜營運後台 UI

這些都可以留待第二階段之後再做。

## 遊戲管理策略

為了降低開發成本，現階段建議：

- **先不要把遊戲管理做成 Looty 內建網頁**
- **直接使用 Supabase Dashboard 管理遊戲資料**

這代表：

- 遊戲資料由 Supabase 管理
- Looty 前端直接讀取 Supabase 的公開資料
- 是否顯示、是否可啟動、啟動網址，都應該以資料庫為主

這樣可以先少做一整套後台 UI / Auth / CRUD 維護成本，
把力氣集中在「玩家真的能順利開遊戲」這件事上。

## 單一資料來源原則

Looty MVP 應盡量把遊戲上架資訊收斂到資料庫，
不要把關鍵狀態分散在多個地方。

理想上，以下資訊都應來自 Supabase：

- 遊戲名稱
- slug
- 類型
- 縮圖
- 是否公開
- 實際啟動網址

因此，現有這類本地硬編碼設定應視為過渡方案，而不是長期來源：

- `src/config/enabled-games.js`
- `src/config/game-urls.js`

長期方向是把這兩份設定收回到資料庫管理。

目前資料模型上的最重要目標已完成：

- `launch_url` 已進入資料庫
- `sort_order` 已進入資料庫

接下來真正的重點不再是補 schema，
而是補齊遊戲資料，讓公開 view 真的開始出現可玩的遊戲。

## 建議的最小資料模型

若以 Supabase 當作暫時的遊戲管理後台，建議 `games` 至少具備以下欄位：

- `id`
- `slug`
- `name`
- `thumbnail`
- `type`
- `launch_url`
- `published`
- `supports_live`
- `sort_order`
- `created_at`
- `updated_at`

### 最小欄位說明

- `slug`
  - 遊戲唯一識別，用於 `/game?slug=...`
- `name`
  - Lobby 顯示名稱
- `thumbnail`
  - Lobby 封面圖
- `type`
  - 用於 Lobby 分類，例如 `slot`、`fish`、`card`、`arcade`、`casual`
- `launch_url`
  - 真正的遊戲網址，可為本地靜態頁或外部站點
- `published`
  - MVP 階段建議作為單一公開開關
  - `false` 時不顯示於 Lobby，Game Loader 也不應允許進入
- `supports_live`
  - 是否屬於可標記為 live 的遊戲
- `sort_order`
  - 控制 Lobby 排序

## 目前已確認的 DB 狀態

根據目前 Supabase 檢查結果，`games` 目前已存在以下欄位：

- `id`
- `name`
- `slug`
- `thumbnail`
- `type`
- `supports_live`
- `published`
- `created_at`
- `launch_url`
- `sort_order`

目前已確認的 constraint / index：

- Primary key: `id`
- Unique: `slug`
- Index: `published`
- Index: `type`

目前 `games` 尚未有以下欄位：

- `updated_at`

這表示：

- Lobby 顯示哪些遊戲，已可主要由資料庫控制
- Game Loader 載去哪裡，也已可改由資料庫控制
- 目前剩下的主要工作是前端改接與補齊資料內容

## MVP 階段的簡化原則

為了維持簡單，MVP 階段建議：

- 先用 `published` 當唯一公開控制欄位
- 不急著拆成多種複雜狀態
- 不急著做內建 Admin 頁面
- 不急著做多層權限系統

如果未來真的需要更細的控管，再增加：

- `enabled`
- `visibility`
- `launch_mode`
- `access_policy`

但在現在這個階段，先不要過度設計。

## 建議的 MVP 資料流

1. 在 Supabase `games` 表維護遊戲資料。
2. 建立或調整公開 view，讓 Lobby 與 Game Loader 使用。
3. Lobby 只讀取 `published = true` 的遊戲。
4. 玩家點擊遊戲後進入 `/game?slug=...`
5. Game Loader 依 `slug` 從資料庫讀取遊戲資料。
6. 若該遊戲未公開或不存在，直接擋下。
7. 若存在且可公開，使用 `launch_url` 載入遊戲。

## 已確認的 public view 狀態

目前 `public_games_v1` 定義可理解為：

- 來源：`games`
- 條件：`published = true` 且 `launch_url` 有值
- 排序：`sort_order ASC, created_at DESC`

目前公開欄位包含：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `launch_url`
- `sort_order`

這代表：

- `public_games_v1` 已經適合做 Lobby 公開遊戲列表
- `public_games_v1` 也已可支撐 Game Loader 的公開資料需求
- 目前 `public_games_v1` 查詢結果為 `0 rows`，代表還沒有任何遊戲同時滿足公開且具備 `launch_url`

## 已確認的權限狀態

目前已知：

- `games` 已開啟 RLS
- `admin_users` 已開啟 RLS
- 匿名讀取 `published = true` 的遊戲已成立

這表示：

- Lobby 匿名讀取公開遊戲清單已成立
- Loader 也可沿用相同模式，只要前端改成直接使用 DB 回傳的 `launch_url`

## 最小 DB 調整清單

若 Looty 要走目前定義的 MVP 路線，最小必要 DB 調整已完成：

1. 在 `games` 新增 `launch_url`
2. 在 `games` 新增 `sort_order`
3. 更新 `public_games_v1`，把 `launch_url`、`sort_order` 一起暴露出來

目前最小必要的下一步不再是改 schema，而是補資料：

1. 把要上架的遊戲補上 `published = true`
2. 把要上架的遊戲補上 `launch_url`
3. 為需要排序的遊戲補上 `sort_order`

以下屬於建議但不是 MVP blocker：

- `updated_at`
- `admin_users` 改綁 `auth_user_id`
- 收斂重複的 published-read policy

## 對目前專案的實際建議

以目前 repo 狀態來看，近程建議如下：

1. 暫停投資 `/admin/*` 的 UI 開發。
2. 直接在 Supabase Dashboard 補齊 `published`、`launch_url`、`sort_order`。
3. 讓 Lobby 與 Game Loader 最終只依賴資料庫，不依賴本地白名單。
4. 保留 Admin 頁面可以，但不列為近期核心交付。

## 第二階段之後再做

以下功能屬於 Looty 擴張期再處理即可：

- 玩家身份與平台帳號體系
- 排行榜
- 官方挑戰
- 更完整的後台管理介面
- 幣流與經濟整合
- 與 Aura / Hype5 / FuGhost / Spinnova 的正式串接

## 一句話總結

Looty 現階段的最佳策略不是先把平台做滿，
而是先把它做成一個穩定、可管理、可部署的遊戲入口平台。
