# Looty MVP 規劃

這份文件記錄 Looty 目前的 MVP 方向，並對齊 repo 現況。

## MVP 核心目標

Looty 第一階段的成功條件仍然很單純：

1. 玩家能看到公開遊戲列表
2. 玩家能點進遊戲
3. Game Loader 能依 `slug` 正確載入對應遊戲
4. 遊戲的公開狀態、名稱、封面、啟動網址、排序可以在雲端管理
5. 整體能部署為 Cloudflare Pages 靜態站

## 目前 repo 已達成的部分

- Lobby 已可從 `public_games_v1` 顯示遊戲
- Game Loader 已可從 `public_games_v1` 取 `launch_url`
- Admin Login 已可用 Google OAuth + `admin_users` 白名單
- Admin 已可管理 `games` 的基本資料
- Admin 已補上 `launch_url` 與 `sort_order` 欄位
- 前台 / Loader / Admin 已開始共用錯誤視窗與錯誤代碼
- `npm run build` 可成功輸出多頁靜態站
- `npm run smoke` 可做最小本機 smoke check
- Cloudflare Pages Git 自動部署已接到 `looty-git` 的 `main`
- 前台會員登入目前已從 Lobby 移除，MVP 先維持公開遊戲入口

## 目前已確認的前台改版策略

目前 Looty 前台已採用以下方向：

- 前台仍然是 Lobby / 遊戲平台，不是單一活動官網
- 公開遊戲列表優先讀 `public_games_v1`
- 暫時不顯示分類 tabs
- 直接顯示全部公開可玩的遊戲
- 後端資料欄位保留，不刪 `type`、`supports_live` 等未來分類能力
- 不改 Supabase schema
- 不改 Cloudflare Pages 靜態部署架構
- 不引入 React / Vue / Next.js

### 目前前台 UI 狀態

截至 2026-07-08，目前首頁 UI 可理解為：

- 前台不顯示登入 / 註冊 UI
- Hero 已改為固定主視覺 banner
- Lobby 直接顯示全部公開遊戲，不再顯示分類 tabs
- 遊戲卡與整體背景已往黑色 / 黑綠漸層方向收斂
- Game Loader 保留全畫面 Loading overlay，iframe 先視覺滿版載入，overlay 在 iframe 初次 load 後淡出
- Game Loader 外層 document 保留原生 scroll，透過 sticky 遊戲容器與 scroll handoff spacer 協助手機瀏覽器網址列收合

## 目前採用的 MVP 實作策略

現在的 repo 採用以下做法：

- Public 資料來源以 Supabase 為唯一真相來源
- Lobby 與 Game Loader 都直接依賴 `public_games_v1`
- Admin 直接對 `games` table 做 CRUD
- Vite 只作為 build tool，不使用 React / Vue / Next.js
- Game Loader 進入遊戲時保留 Looty loading overlay，不改成無提示

### 關於前台分類 UI

目前更合理的 MVP 表現方式是：

- 直接顯示全部公開可玩的遊戲
- 先不要用分類把少量內容切得很碎
- 保留資料欄位，等遊戲數量變多後再重新打開分類 UI

### 關於前台會員

目前前台會員登入已暫停，Lobby 不顯示登入 / 註冊、會員狀態或餘額。現階段 MVP 先聚焦公開遊戲入口、Game Loader 與 Admin 管理。

若之後恢復會員功能，過去的 DB/RPC 方向仍可作為參考：

- 前端不直接 `insert players` / `player_balances`
- 會員初始化留在 DB 端處理，比較容易維持一致
- 可以讓 RLS 與 `auth.uid()` 邏輯留在資料層

會員功能恢復前，以下仍不屬於目前 Lobby 範圍：

- guest merge
- `auth.users` trigger
- Worker
- `/me` 完整會員中心
- `displayName` 寫入 `players`
- 餘額歷史 / 點數流水

### 關於 Admin 的定位

原始的 MVP 討論曾經偏向「先不用做內建 Admin UI」。
但依目前 repo 現況，已經存在一套 **輕量但可用** 的 Admin 後台。

因此現在比較合理的定位是：

- Admin 可以保留，並持續維持基本可用
- 但不需要在這個階段把它做成完整營運系統

## 目前的資料來源原則

Looty 現階段應盡量避免把遊戲可見性拆成多份本地設定。

目前 repo 應以以下原則理解：

- `games` 是後台管理來源
- `public_games_v1` 是公開讀取來源
- `launch_url` 與 `sort_order` 已經是正式欄位，不是暫時補丁
- repo 目前 **沒有** 使用本地 `enabled-games` 白名單
- 預期錯誤應用共用錯誤視窗呈現，並附上 `LOOTY-*` 錯誤代碼，避免把資料讀取失敗誤判成空資料
- 後台 `/admin/*` 之後應用 Cloudflare Access 保護；目前先規劃以 `looty-git.pages.dev/admin/*` 測試，正式網域確定後再調整

## 目前前端假設的最小資料模型

`games` 至少應具備：

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

目前 `type` 至少涵蓋：

- `slot`
- `fish`
- `card`
- `arcade`
- `casual`
- `adult`

### 欄位用途

- `slug`: 遊戲唯一識別，用於 `/game/?slug=...`
- `name`: Lobby 顯示名稱
- `thumbnail`: Lobby 封面圖
- `type`: Lobby 分類依據
- `launch_url`: 真正要開的遊戲網址
- `published`: 是否可被公開 view 看見
- `supports_live`: 是否出現在 live 類別
- `sort_order`: Lobby 排序用

## `public_games_v1` 的契約

目前前端實作預期 `public_games_v1` 至少提供：

- `id`
- `slug`
- `name`
- `type`
- `supports_live`
- `thumbnail`
- `created_at`
- `launch_url`
- `sort_order`

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

前端也預期：

- Lobby 只會拿到公開可展示的遊戲
- Loader 只會拿到可啟動的遊戲

如果未來要調整公開規則，優先改 DB view / policy，不要回頭再引入本地硬編碼白名單。

## 目前不優先做的事

以下仍然不是 MVP blocker：

- 完整玩家帳號平台
- 排行榜
- 官方挑戰系統
- 複雜營運後台 UI
- 幣流 / ledger / settlement
- Aura / Hype5 / FuGhost / Spinnova 的正式深度整合

## 接下來最值得做的事

1. 補上 `/me` 或其他會員登入後的明確落點與會員中心骨架
2. 把 `admin_users` 白名單從 email 升級為 auth user id
3. 補上 Admin UI 的基本排版與手機版可用性
4. 設定 Cloudflare Access 保護 `/admin/*`
5. 確認 `looty-git` 接手正式網域與舊 Direct Upload 專案的退場策略
6. 視需要把目前最小 smoke check 擴充成完整 automated tests

## 一句話總結

Looty 的 MVP 不是把平台功能做滿，
而是把「看到遊戲 -> 點進遊戲 -> 成功啟動遊戲」這條主路徑做穩，
並讓遊戲資料可以在雲端持續維護。
