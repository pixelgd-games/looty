# Looty Game / Platform Integration Guide

這份文件只給 AI / Codex 讀。
用途是讓未來做遊戲、接遊戲、接平台的 AI 先理解 Looty 的接入準則。

它不是對外文件，也不是已完成實作說明。
目前是架構準則與決策草案，部分內容尚未實作。

日期：2026-07-09。

## 先讀這段

Looty 要把「平台」和「遊戲」責任切清楚。

平台負責玩家身份、登入、錢包、交易紀錄、遊戲 session、營運資料。
遊戲負責畫面、玩法、局號、下注結果、派獎結果。

遊戲不要自己登入玩家，也不要直接改玩家餘額。

## 給做遊戲的 AI

如果你是來做一款要接進 Looty 的遊戲，請遵守以下規則。

遊戲可以做：

- 遊戲畫面
- 遊戲規則
- 局號 / round
- 下注操作
- 結果計算
- 派獎結果
- 呼叫平台提供的錢包介面

遊戲不要做：

- 自己做玩家登入
- 自己保存正式玩家帳號
- 直接讀寫 Supabase auth user
- 直接更新玩家餘額
- 直接寫 `wallet_accounts` 或 `wallet_transactions`
- 保存玩家 email、Google 帳號、手機或真實身份
- 自己決定玩家能不能提款、領 bonus、使用正式錢包

遊戲應該只認平台給的 session。

```text
Looty Platform
  -> create_game_session
    -> launch_token
      -> Game
```

遊戲啟動後，應透過平台或 Game Gateway 提供的 API 做這些事：

```text
wallet_get_balance
wallet_debit
wallet_credit
wallet_rollback
close_game_round
```

如果正式 Wallet API 還沒實作，遊戲可以先做 mock adapter。
但 mock adapter 的函式名稱、參數概念、回傳格式要盡量貼近正式介面，避免之後重寫。

## 給接平台的 AI

如果你是來把 Looty 接到第三方平台，或讓第三方遊戲接進 Looty，請先分清楚錢包在哪邊。

### Looty 遊戲給別的平台用

```text
Third-party Platform
  -> Looty Game Gateway
    -> Looty Game
```

這時錢包通常是第三方平台的。
Looty Game Gateway 要把下注、派獎、rollback 轉成對方平台的錢包 API。

Looty Game 不應直接知道第三方平台的玩家隱私資料。

### 第三方遊戲接進 Looty

```text
Looty Platform
  -> Game Gateway
    -> Third-party Game
```

這時錢包是 Looty 的。
第三方遊戲下注、派獎、rollback 都要走 Looty wallet API。

第三方遊戲不應直接寫 Looty 的資料庫。

## 錢包決策

### 1. 目前先不要獨立接 Supinova

現在不建議把 Supinova 當成獨立錢包服務接進來。

原因：

- Looty 平台目前也用 Supabase。
- Supinova 若也是另一個 Supabase，免費方案下會多一份專案、額度、同步與維護成本。
- 錢包交易需要穩定、可回滾、可查帳；跨兩個免費 Supabase 專案會讓 MVP 變複雜。
- 現階段還沒有真的第三方平台或高頻交易壓力，不需要先拆服務。

目前建議：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Looty wallet tables in same Supabase
```

也就是先在 Looty 同一個 Supabase 裡做平台錢包，但資料表與 API 設計要像正式錢包。

未來如果 Supinova 要接管，再換成：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Supinova API / Supinova DB
```

這樣遊戲端不用重寫。

### 2. 錢包是平台責任，不是遊戲責任

遊戲只能提出請求：

- 查餘額
- 扣款下注
- 派獎入帳
- 取消 / rollback
- 關閉局號

平台負責：

- 玩家能不能玩
- 餘額夠不夠
- 扣款是否成功
- 派獎是否入帳
- 交易紀錄是否完整
- 重送請求是否會重複扣款

不要讓遊戲直接更新 `wallet_accounts.balance` 這類欄位。

## 帳號與 Guest 決策

### 1. 平台統一登入，遊戲不再登入一次

玩家不管是正式帳號還是 Guest，都先在 Looty 平台取得身份。

進遊戲時，平台建立 `game_session`，再發短效 `launch_token` 給遊戲。

```text
Player / Guest
  -> Looty Platform
    -> create_game_session
      -> launch_token
        -> Game
```

遊戲只認 `launch_token`，不要拿 Supabase auth token，也不要知道玩家 email、Google 帳號或後台權限。

### 2. Guest 是匿名玩家，不是沒有玩家

Guest 應該是平台裡的一種玩家身份。

建議方向：

```text
Guest = Supabase anonymous user + player_accounts row
Registered = Supabase normal user + player_accounts row
```

Guest 可以：

- 看大廳
- 試玩遊戲
- 使用 demo balance 或 guest credit
- 留短期進度
- 之後升級成正式帳號

Guest 不應該：

- 提款
- 真金流下注
- 領正式優惠
- 被視為永久可找回帳號
- 直接跨裝置找回，除非升級成正式帳號

### 3. Guest 升級正式帳號要有 merge 規則

Guest 轉正式帳號時，要決定哪些資料合併。

可以合併：

- 遊戲進度
- 收藏
- 任務狀態
- 非真金流體驗幣紀錄

要小心：

- 真錢錢包不要亂 merge
- bonus 不要被重複領
- 如果 email 已經有舊帳號，要決定是合併、忽略，還是讓玩家選

## 建議遊戲收到的 session payload

遊戲只需要知道最少資訊：

```json
{
  "session_id": "...",
  "game_id": "...",
  "player_account_ref": "...",
  "account_type": "guest",
  "wallet_mode": "guest_credit",
  "currency": "POINT"
}
```

不要傳：

- email
- phone
- Google profile
- Supabase access token
- admin role
- 真實身份資料

## 建議資料模型

先不用一次做完整，但方向應該長這樣。

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
- 新平台錢包不要直接沿用 `player_balances` 當正式錢包。
- 新平台錢包應改成 `wallet_accounts` + `wallet_transactions`，並保留交易流水、局號、idempotency。
- 如果之後真的需要玩家資料表，建議用 `player_accounts` 重新建立，不要直接復活舊 `players`。

### player_accounts

```text
id
auth_user_id
account_type: guest / registered
status
created_at
upgraded_at
```

### wallet_accounts

```text
id
player_account_id
wallet_type: demo / guest_credit / real
currency
balance
status
created_at
```

### wallet_transactions

```text
id
player_account_id
wallet_account_id
game_session_id
game_round_id
type: debit / credit / rollback / adjustment
amount
currency
idempotency_key
balance_after
status
created_at
```

### game_sessions

```text
id
player_account_id
game_id
account_type
wallet_mode: demo / guest_credit / real
launch_token_hash
expires_at
status
created_at
closed_at
```

### game_rounds

```text
id
game_session_id
player_account_id
game_id
round_ref
status
bet_amount
win_amount
started_at
settled_at
```

## 建議 RPC / API

平台或 Gateway 應提供這些固定介面：

```text
create_game_session
wallet_get_balance
wallet_debit
wallet_credit
wallet_rollback
close_game_round
upgrade_guest_account
```

重點：

- `wallet_debit` 和 `wallet_credit` 必須有 `idempotency_key`。
- 同一個 `idempotency_key` 重送時，不能重複扣款或重複派獎。
- rollback 要能對應原本的交易。
- 遊戲端只能呼叫這些介面，不能直接寫錢包表。

## 接入檢查清單

新遊戲要接 Looty 前，至少確認：

- 有唯一 `slug`。
- 有可被 Loader 載入的 `launch_url`。
- 能接受平台給的 session 或 launch token。
- 不需要自己做玩家登入。
- 不直接碰 Supabase auth token。
- 不直接寫錢包資料表。
- 每一局有 `round_id` 或等價局號。
- 每一次下注、派獎、rollback 都有唯一 `idempotency_key` 或交易識別。
- 可以區分 demo、guest credit、real wallet。
- iframe 內畫面能在手機全螢幕容器正常顯示。

## 尚未定案

這些還不要寫死：

- Guest 的保存期限。
- Guest 是否一定用 Supabase anonymous sign-in，或先用本地 guest token 過渡。
- Guest balance 是純 demo balance，還是可以有短期 guest credit。
- Guest 升級正式帳號時，衝突資料要自動 merge 還是讓玩家選。
- 正式帳號第一版登入方式：Google、email OTP、email/password，還是多種並存。
- `wallet_accounts.balance` 是否只作快取，真相完全以 `wallet_transactions` 重算。
- Supinova 未來是主錢包、審計工具、還是獨立 settlement service。
- Game Gateway 第一版放在 Supabase RPC、Edge Function，還是外部 API server。

## 實作提醒

- 不要先做完整會員中心再做遊戲 session；應先做最小可用的 `create_game_session`。
- 不要讓前端直接 `insert player_accounts`、`wallet_accounts`、`wallet_transactions`。
- 玩家初始化、Guest 建立、錢包建立，應放在 DB RPC 或後端流程。
- Admin 白名單之後應從 email 升級到 auth user id。
- 錢包資料表要預留 `idempotency_key`、`round_id`、`transaction_id`，避免未來重做。

## Supabase 操作原則

Looty 的 Supabase project ref 是：

```text
lsazydefvnuqglultqii
```

AI 操作 Supabase 前必須先確認目前目標是 Looty，不是 Aura、Supinova 或其他專案。

Looty 的 Supabase CLI profile 是：

```text
looty-pixelgd
```

確認方式：

```bash
npx supabase --profile looty-pixelgd --workdir "D:\Studio\Project_Code\looty" projects list
```

結果中 `Looty` / `lsazydefvnuqglultqii` 應為 `linked: true`。

目前 Looty 專案內有 `.codex/config.toml`，設定了 project-scoped Supabase MCP：

```text
https://mcp.supabase.com/mcp?project_ref=lsazydefvnuqglultqii&read_only=true
```

原則：

- 先 read-only 看 schema。
- 不要直接改 production DB。
- 要改 DB 時，先產 SQL migration，讓使用者確認後再執行。
- 不要用其他專案的 Supabase CLI 預設登入操作 Looty。
- 不要在文件或程式碼裡提交 Supabase access token、service role key、DB password。

## 參考資料

- Supabase Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Billing / Free Plan: https://supabase.com/docs/guides/platform/billing-on-supabase
- SOFTSWISS Casino Platform: https://www.softswiss.com/casino-platform/
- SOFTSWISS Game Aggregator: https://www.softswiss.com/game-aggregator/
- EveryMatrix CasinoEngine: https://everymatrix.com/casinoengine/
- Stripe Idempotent Requests: https://docs.stripe.com/api/idempotent_requests
- Modern Treasury Ledger notes: https://www.moderntreasury.com/journal/how-to-scale-a-ledger-part-i
