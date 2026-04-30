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
- `npm run build` 可成功輸出多頁靜態站

## 目前採用的 MVP 實作策略

現在的 repo 採用以下做法：

- Public 資料來源以 Supabase 為唯一真相來源
- Lobby 與 Game Loader 都直接依賴 `public_games_v1`
- Admin 直接對 `games` table 做 CRUD
- Vite 只作為 build tool，不使用 React / Vue / Next.js

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

1. 把 `admin_users` 白名單從 email 升級為 auth user id
2. 補上 Admin UI 的基本排版與手機版可用性
3. 刪除遊戲後改成局部更新，不再 `location.reload()`
4. 打通 Cloudflare Pages 與 GitHub 的自動部署
5. 視需要補上 automated tests 或最小 smoke checks

## 一句話總結

Looty 的 MVP 不是把平台功能做滿，
而是把「看到遊戲 -> 點進遊戲 -> 成功啟動遊戲」這條主路徑做穩，
並讓遊戲資料可以在雲端持續維護。
