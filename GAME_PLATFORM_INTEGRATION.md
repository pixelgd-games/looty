# Looty Game / Platform Integration Guide

這份文件只給 AI / Codex 讀。
用途是讓未來做遊戲、接遊戲、接平台的 AI 先理解 Looty 的責任邊界與接入準則。

它不是對外文件，也不是已完成實作說明。
目前是架構準則與決策草案，部分內容尚未實作。

日期：2026-07-09。

## 一句話結論

Looty 是平台錢包與玩家帳號管理者。

玩家帳號由 Looty 平台統一管理；遊戲只接平台發的 session / launch token，不自己登入、不自己記錢、不自己改餘額。

目前重點不是立刻實作會員或錢包，而是先把平台、遊戲、帳號、錢包、Game Gateway、外部平台接入的責任分清楚。

## 現階段不要做

現階段不要因為看到本文件，就直接新增玩家表、錢包表、會員中心、Gateway 或 Supinova 整合。

要改 DB 時，仍然先產小 SQL migration 給使用者確認。

不要復活舊的：

- `players`
- `player_balances`
- `access_whitelist`
- `site_settings`
- `ensure_my_player_v1()`

## 責任分工

### Looty Platform

Looty Platform 是平台層，負責：

- 玩家身份。
- Guest / registered 帳號。
- Supabase Auth 對應。
- 建立與管理 `player_accounts`。
- 建立與管理平台錢包。
- 建立 game session。
- 發 launch token。
- 管理餘額、交易流水、idempotency。
- Admin 遊戲上架資料。
- 公開遊戲列表。
- 查帳與安全控管。

Looty Platform 不負責：

- 遊戲畫面。
- 遊戲動畫、音效與主要玩法前端。
- 一般遊戲最終規則裁決。
- 博奕機率與結果裁決。
- 即時多人房間同步。
- 第三方平台自己的玩家帳號與錢包。

### Game

Game 是遊戲本體，負責：

- 顯示遊戲。
- 遊戲畫面與互動。
- 遊戲玩法。
- 局號 / round。
- 接收平台給的 `launch_token`。
- 回報下注 / 派彩 / 退款 / 結算事件。
- 顯示平台回傳的餘額與結果。

Game 不負責：

- 玩家登入。
- 建立 Guest。
- 保存正式玩家帳號。
- 保存玩家 email、Google 帳號、手機或真實身份。
- 直接讀寫 Supabase Auth。
- 直接寫 Looty 的 Supabase。
- 直接寫 `player_accounts`、`wallet_accounts`、`wallet_transactions`。
- 直接更新玩家餘額。
- 決定玩家能不能提款、領 bonus 或使用正式錢包。

### Game Gateway

Game Gateway 是平台與遊戲之間的轉接層，負責：

- 驗證 launch token / session。
- 把遊戲的下注、派彩、退款、rollback 請求轉成平台可處理的格式。
- 對接 Looty wallet API 或第三方平台 wallet API。
- 隔離不同遊戲、不同外部平台的 API 差異。
- 避免遊戲直接依賴 Looty DB、Supabase Auth 或 Supinova。

Game Gateway 的重點是隔離責任，不是把所有遊戲邏輯搬進 Looty。

### Wallet Interface

Wallet Interface 是錢包抽象介面，負責固定錢包語意：

- 查餘額。
- 扣款下注。
- 派彩入帳。
- 退款 / rollback。
- 關閉局號。

它後面第一階段可以接 Looty 同一個 Supabase 裡的 wallet tables。
未來如果接 Supinova 或第三方平台 wallet API，應該改 adapter，不應讓遊戲重寫。

## 帳號設計

### 帳號類型

玩家帳號分兩種：

- Guest / 匿名玩家。
- Registered / 正式帳號。

Guest 可以先玩，後面可以升級成正式帳號。

不要讓遊戲自己建立 Guest。
Guest 應該由 Looty Platform 建立，之後對應到 `player_accounts`。

正式帳號使用 Supabase Auth，例如：

- Google。
- Email OTP。
- Email / password。

登入後也對應到同一套 `player_accounts`。

### Guest 升級正式帳號

Guest 轉正式帳號時，不要換一個全新玩家。

正確方向是把原本的 `player_accounts` 接到正式 Supabase Auth user 上。

可以合併：

- 遊戲進度。
- 收藏。
- 任務狀態。
- 非真金流體驗幣紀錄。

要小心：

- 真錢錢包不要亂 merge。
- bonus 不要重複領。
- 如果 email 已經有舊帳號，要決定是合併、忽略，還是讓玩家選。

### player_accounts 方向

```text
player_accounts
- id
- auth_user_id
- account_type: guest / registered
- display_name
- status
- created_at
- upgraded_at
```

說明：

- `auth_user_id` 對應 Supabase Auth user。
- Guest 可以先沒有正式登入身份，但仍應有 `player_accounts`。
- Guest 升級 registered 時，應更新同一筆 `player_accounts`，不是新增一個完全無關玩家。

## 錢包設計

### 核心結論

Looty 使用平台錢包。

我們不是讓每個遊戲自己有錢包，也不是讓遊戲直接存一個自己的 balance。

錢包放在 Looty Platform 這邊：

- 遊戲不能直接改玩家餘額。
- 遊戲要下注、派彩、退款，都要走平台後端 / DB RPC / API。
- 錢包一定要有流水，不只存一個 `balance` 數字。
- `balance` 可以作為目前餘額欄位，但交易真相必須能從 `wallet_transactions` 查到。

### 錢包帳戶

第一版方向是玩家在平台有 wallet account。

可以先理解成：

```text
player_account
  -> wallet_account by currency
```

同一個 `player_account_id + currency` 通常只會有一個 active wallet account。

如果未來要明確區分 demo / guest_credit / real，可以再加 `wallet_type` 或用額外欄位區分，但不要讓遊戲直接依賴這個內部設計。

### wallet_accounts 方向

```text
wallet_accounts
- id
- player_account_id
- currency
- balance
- locked_balance
- status
- created_at
- updated_at
```

說明：

- `balance` 是目前可用餘額。
- `locked_balance` 可用於未結算、保留、凍結或之後的真金流場景。
- 第一版如果還沒用到 `locked_balance`，也可以先保留設計方向，不一定立刻實作。

### wallet_transactions 方向

```text
wallet_transactions
- id
- wallet_account_id
- type: deposit / withdraw / bet / payout / refund / adjustment
- amount
- balance_before
- balance_after
- game_id
- round_id
- idempotency_key
- metadata
- created_at
```

說明：

- 每一次下注、派彩、退款、調整，都要寫交易流水。
- `bet` 通常扣款。
- `payout` 通常入帳。
- `refund` 用於取消、rollback 或退款。
- `adjustment` 用於後台或系統調整。
- `idempotency_key` 必須避免重送造成重複扣款或重複派彩。
- `round_id` 用來對應遊戲局號。
- `balance_before` / `balance_after` 用來查帳與除錯。
- `metadata` 放遊戲或供應商回傳的補充資訊，不放玩家隱私資料。

### 轉帳與 ledger

第一版不先做完整銀行式 double-entry transfer。

目前方向是：

```text
wallet_account
  + wallet_transactions
  + idempotency_key
  + round_id
```

等之後需要正式 settlement、平台資金池、供應商結算或更嚴格審計，再升級成更完整的 ledger / transfer model。

## 遊戲啟動流程

目前方向：

```text
Player / Guest
  -> Looty Platform
    -> ensure player_account
    -> ensure wallet_account
    -> create game_session
    -> issue launch_token
      -> Game
```

遊戲啟動後：

```text
Game
  -> report bet / payout / refund / close round
    -> Game Gateway
      -> Wallet Interface
        -> Looty wallet API / DB RPC / backend API
```

遊戲只認 `launch_token`。

遊戲不要拿 Supabase auth token，也不要知道玩家 email、Google 帳號、後台權限或真實身份。

## 建議遊戲收到的 session payload

遊戲只需要知道最少資訊：

```json
{
  "session_id": "...",
  "game_id": "...",
  "player_account_ref": "...",
  "account_type": "guest",
  "currency": "POINT"
}
```

如果未來有 demo / guest_credit / real，可加：

```json
{
  "wallet_mode": "guest_credit"
}
```

不要傳：

- email
- phone
- Google profile
- Supabase access token
- admin role
- 真實身份資料

## Game session / round 方向

Game session 是平台發給遊戲的啟動授權。

遊戲不應直接拿 Supabase Auth session。遊戲應只拿短效 `launch_token`，再由 Gateway 或平台驗證。

### game_sessions 方向

```text
game_sessions
- id
- player_account_id
- wallet_account_id
- game_id
- launch_token_hash
- account_type: guest / registered
- currency
- status
- expires_at
- created_at
- closed_at
```

### game_rounds 方向

```text
game_rounds
- id
- game_session_id
- game_id
- round_id
- status
- bet_amount
- payout_amount
- refund_amount
- started_at
- settled_at
```

說明：

- `launch_token` 不應明文長期保存，資料庫只保存 hash 或可驗證資訊。
- `round_id` 要能對應到 `wallet_transactions.round_id`。
- 每一局下注、派彩、退款都要能追到 session、game、round。

## 建議 RPC / API

平台或 Gateway 應提供固定介面：

```text
create_game_session
wallet_get_balance
wallet_bet
wallet_payout
wallet_refund
close_game_round
upgrade_guest_account
```

如果底層想用更通用命名，也可以對應成：

```text
wallet_debit
wallet_credit
wallet_rollback
```

但對遊戲語意來說，第一版建議文件與 API 保持接近：

- `bet`
- `payout`
- `refund`

重點：

- bet / payout / refund 必須有 `idempotency_key`。
- 同一個 `idempotency_key` 重送時，不能重複扣款或重複派彩。
- refund / rollback 要能對應原本的 bet 或 round。
- 遊戲端只能呼叫這些介面，不能直接寫錢包表。

## 主要接入方向

### Looty 自己的平台接自己的遊戲

```text
Looty Platform
  -> Game Gateway
    -> Looty Game
```

這是最乾淨的目標形狀：

- Looty Platform 管玩家、session、錢包。
- Looty Game 管畫面與玩法。
- Game Gateway 管中間轉接。
- Wallet Interface 管錢包呼叫語意。

### 外部遊戲接進 Looty

```text
Looty Platform
  -> Game Gateway
    -> External Game
```

這種情境下：

- Looty 負責玩家身份、game session、錢包與交易流水。
- 外部遊戲只認 Looty 給的 session 或 launch token。
- 外部遊戲透過 Looty 提供的 wallet API 請求下注、派彩、退款。
- 外部遊戲不直接讀寫 Looty Supabase。
- 外部遊戲不保存 Looty 玩家隱私資料。

### Looty 遊戲接到外部平台

```text
External Platform
  -> Looty Game Gateway
    -> Looty Game
```

這種情境下：

- 外部平台通常負責玩家身份與錢包。
- Looty Game Gateway 負責把 Looty 遊戲的下注、派彩、退款轉成外部平台 API。
- Looty Game 不直接知道外部平台的玩家隱私資料。
- Looty Game 不直接寫外部平台錢包。
- 如果外部平台有自己的 session/token，Gateway 負責轉成遊戲能理解的最小 session payload。

## Supinova / Spinova

目前結論：第一階段不要先接 Supinova 錢包。

原因：

- Looty 自己的平台和遊戲都還在整理責任邊界。
- Looty 平台目前也用 Supabase。
- Supabase 免費方案下，多接一套 Supabase / 外部錢包會更複雜。
- 現階段還沒有真的第三方平台或高頻交易壓力，不需要先拆服務。
- 先把 Looty 自己的平台錢包設計好，比先接外部錢包更重要。

現在方向：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Looty wallet tables in same Supabase
```

未來如果接 Supinova：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Supinova adapter
        -> Supinova API / Supinova DB
```

重點是用 adapter 對接，不讓遊戲直接依賴 Supinova。

## 接入檢查清單

新遊戲要接 Looty 前，至少確認：

- 有唯一 `slug`。
- 有可被 Loader 載入的 `launch_url`。
- 能接受平台給的 session 或 launch token。
- 不需要自己做玩家登入。
- 不需要自己建立 Guest。
- 不直接碰 Supabase auth token。
- 不直接寫玩家資料表。
- 不直接寫錢包資料表。
- 每一局有 `round_id` 或等價局號。
- 每一次下注、派彩、退款都有唯一 `idempotency_key` 或交易識別。
- 可以區分 demo / guest / registered 的遊玩情境，但不要自己決定正式錢包權限。
- iframe 內畫面能在手機全螢幕容器正常顯示。

## 目前 Supabase 現況

讀取時間：2026-07-09。

目前 Looty 的 public schema 已存在：

- `games`
- `public_games_v1`
- `admin_users`

2026-07-09 已從遠端 DB 移除：

- `players`
- `player_balances`
- `access_whitelist`
- `site_settings`
- RPC: `ensure_my_player_v1`

注意：

- `games` / `public_games_v1` / `admin_users` 是目前前台與 Admin 正在使用的核心資料。
- `players`、`player_balances`、`ensure_my_player_v1` 是舊會員 / 舊餘額方向留下的資料結構，已先移除，避免跟正式錢包混在一起。
- `access_whitelist`、`site_settings` 目前程式碼沒有使用，已移除。
- Looty 目前以 Supabase CLI + migration 管理資料庫；MCP 暫不作為主要操作方式，也不要讓其他專案共用 Looty MCP。
- 2026-07-09 已刪除未追蹤的 baseline migration 草稿；不要留下未確認的大重建 SQL 檔。
- 新平台錢包不要直接沿用 `player_balances` 當正式錢包。
- 新平台錢包應使用 `wallet_accounts` + `wallet_transactions`，並保留交易流水、局號、idempotency。
- 如果之後真的需要玩家資料表，建議用 `player_accounts` 重新建立，不要直接復活舊 `players`。
- 2026-07-10 已建立平台帳號 / 錢包核心 migration 草稿：`20260709170000_create_platform_account_wallet_core.sql`。
- 這份 migration 草稿已由使用者確認方向，但尚未套用到遠端 Supabase。

## 尚未定案

這些還不要寫死：

- Guest 的保存期限。
- Guest 是否一定用 Supabase anonymous sign-in，或先用本地 guest token 過渡。
- Guest balance 是純 demo balance，還是可以有短期 guest credit。
- Guest 升級正式帳號時，衝突資料要自動 merge 還是讓玩家選。
- 正式帳號第一版登入方式：Google、email OTP、email/password，還是多種並存。
- `wallet_accounts.balance` 是否只是目前餘額快取，或是否要完全以 `wallet_transactions` 重算。
- 第一版是否立刻實作 `locked_balance`。
- 第一版是否需要 `wallet_type`，或先用 `currency` + `account_type` 處理。
- Supinova 未來是主錢包、審計工具，還是獨立 settlement service。
- Game Gateway 第一版放在 Supabase RPC、Edge Function，還是外部 API server。

## 實作提醒

- 不要先做完整會員中心再做遊戲 session；應先做最小可用的 `create_game_session`。
- 目前可從已確認的 `20260709170000_create_platform_account_wallet_core.sql` 開始，先套平台帳號、錢包、交易流水、game session、game round 骨架。
- 不要讓前端直接 `insert player_accounts`、`wallet_accounts`、`wallet_transactions`。
- 玩家初始化、Guest 建立、錢包建立，應放在 DB RPC 或後端流程。
- Admin 白名單之後可視需要從 email 升級到 auth user id，但不是目前 MVP blocker。
- 錢包資料表要預留 `idempotency_key`、`round_id`、交易識別與查帳資訊，避免未來重做。

## Supabase 操作原則

Looty 的 Supabase project ref 是：

```text
lsazydefvnuqglultqii
```

AI 操作 Supabase 前必須先確認目前目標是 Looty，不是 Aura、Supinova 或其他專案。

注意：Supabase CLI 登入 token 在這台 Windows 上是全域狀態，不是專案檔的一部分。不要只相信 `--profile` 名稱或目前所在資料夾。
Looty 遠端 Supabase 操作優先使用專案包裝指令，不要直接依賴全域 `supabase login`。

確認方式：

```powershell
.\scripts\supabase-looty.cmd projects list
```

結果中 `Looty` / `lsazydefvnuqglultqii` 應為 `linked: true`。
如果只看到 `arua`，立刻停止；這代表目前 CLI token 不是 Looty 帳號。

本機第一次設定時，從 `.env.supabase.local.example` 建立 `.env.supabase.local`，填入 Looty 專用 `SUPABASE_ACCESS_TOKEN` 與 `SUPABASE_DB_PASSWORD`。`.env.supabase.local` 只留本機，不提交、不貼到對話裡。

2026-07-09 已在本機設定完成並驗證成功：`.\scripts\supabase-looty.cmd projects list` 可看到 `Looty` / `lsazydefvnuqglultqii` / `linked: true`。

目前 Looty 專案內有 `.codex/config.toml`，設定了 project-scoped Supabase MCP：

```text
https://mcp.supabase.com/mcp?project_ref=lsazydefvnuqglultqii&read_only=true
```

原則：

- 先 read-only 看 schema。
- 不要直接改 production DB。
- 要改 DB 時，先產 SQL migration，讓使用者確認後再執行。
- 不要自行建立或保留 baseline / 大重建 migration，除非使用者明確同意。
- 不要用其他專案的 Supabase CLI 預設登入操作 Looty。
- `.env.supabase.local` 只放本機，不提交；內容需要 Looty 的 `SUPABASE_ACCESS_TOKEN`、`SUPABASE_PROJECT_ID`、`SUPABASE_DB_PASSWORD`。
- 如果 CLI token 指到錯帳號，不要反覆叫使用者重登；先確認 `.env.supabase.local` 是否是 Looty token。
- 不要在文件或程式碼裡提交 Supabase access token、service role key、DB password。

## 參考資料

- Supabase Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Billing / Free Plan: https://supabase.com/docs/guides/platform/billing-on-supabase
- SOFTSWISS Casino Platform: https://www.softswiss.com/casino-platform/
- SOFTSWISS Game Aggregator: https://www.softswiss.com/game-aggregator/
- EveryMatrix CasinoEngine: https://everymatrix.com/casinoengine/
- Stripe Idempotent Requests: https://docs.stripe.com/api/idempotent_requests
- Modern Treasury Ledger notes: https://www.moderntreasury.com/journal/how-to-scale-a-ledger-part-i
