# Looty Game / Platform Integration Guide

這份文件只給 AI / Codex 讀。

用途：

- 讓 Looty AI 知道平台、遊戲、錢包、Gateway 的責任邊界。
- 讓其他做遊戲的 AI 知道遊戲要怎麼接 Looty。
- 避免遊戲自己登入玩家、自己建玩家、自己改錢包。

這不是對外 API 文件，也不是完整錢包系統規格。

日期：2026-07-10。

## 一句話

Looty 是平台入口與玩家平台層。

遊戲只應接 Looty 給的啟動入口、session、一次性 launch code 與短效 gateway token。遊戲不登入玩家、不保存玩家身份、不直接寫 Looty Supabase、不直接改玩家餘額。

## 絕對邊界：Looty AI 不改遊戲本體

在 Looty repo 的任務中，AI 只能改 Looty 平台本身：

- Lobby。
- Game Loader。
- Admin。
- Looty Gateway。
- Looty DB migration / RPC。
- Looty 文件。

不要從 Looty 任務直接修改任何遊戲本體 repo。

目前已上架的遊戲本體都沒有因為 Loader 接 session 而被修改：

- `color-guess`
- `lord-of-gomoku`
- `monster-lab-dev`

Looty 現在只是在 iframe URL 旁邊多帶 Looty session 參數。舊遊戲如果不讀這些參數，仍應照常顯示。

只有在使用者明確切換到某一個遊戲 repo，並要求「這款遊戲接 Looty wallet / session」時，遊戲 AI 才能改該遊戲本體。

## 目前接入現況

現在已完成的是 **公開遊戲啟動 + Looty session 建立流程**：

```text
Lobby
  -> public_games_v1
  -> /game/?slug=<slug>
  -> looty-gateway/create-session
  -> public_games_v1.launch_url + one-time launch code
  -> iframe 載入遊戲
  -> 遊戲需要 wallet 時呼叫 looty-gateway/exchange
  -> gateway_token + wallet endpoints
```

目前已套用 DB 平台骨架，並已建立 game session / wallet RPC。
這些 RPC 只開給 `service_role`，前端與遊戲不能直接呼叫。
Supabase Edge Function `looty-gateway` v4 已部署，負責建立 session、交換短效 token、rate limit 與轉接 wallet 操作。

所以現階段遊戲接 Looty，先做到：

- 有唯一 `slug`。
- 有可被 iframe 載入的 `launch_url`。
- 畫面能在 Looty 的 iframe / 手機滿版容器正常顯示。
- 不要求 Looty 前台登入。
- 不要求遊戲自己讀 Supabase Auth。
- 不直接寫玩家或錢包資料。
- 透過 Looty Gateway 呼叫 wallet，不把 Supabase key 或 service role key 放進遊戲前端。
- Loader 進遊戲前會呼叫 `looty-gateway/create-session`，再把一次性 launch code 與非敏感 session 參數帶給 iframe。

## 給遊戲 AI 的最短規則

如果你是在做一款要接 Looty 的遊戲，先遵守這些：

- 遊戲入口要能被 URL 直接打開。
- 遊戲要能被 iframe 載入。
- 不要因為 Looty 已帶 session 參數，就擅自改遊戲下注或派彩流程。
- 只有使用者明確要求接入該遊戲時，才開始改遊戲本體。
- 不要在遊戲內做 Looty 玩家登入。
- 不要在遊戲內建立 Guest。
- 不要讀或保存 Supabase access token。
- 不要讀或保存玩家 email、Google profile、phone。
- 不要直接連 Looty Supabase。
- 不要直接寫 `player_accounts`、`wallet_accounts`、`wallet_transactions`。
- 每一局要有自己的 `round_id` 或等價局號。
- 下注、派彩、退款要能帶唯一 `idempotency_key`。
- 如果只是舊遊戲維持 iframe 顯示，可以先忽略 Looty session 參數。
- 如果要正式接 wallet，才透過 Looty Gateway 回報下注、派彩、退款。

## 責任分工

### Looty Platform

Looty Platform 負責：

- 玩家身份。
- Guest / registered 帳號。
- Supabase Auth 對應。
- `player_accounts`。
- 平台錢包。
- `game_sessions`。
- launch code / gateway token 發放與驗證。
- 錢包交易語意與 idempotency。
- Admin 遊戲上架資料。
- 公開遊戲列表。
- 平台安全與查帳。

Looty Platform 不負責：

- 遊戲畫面。
- 遊戲動畫、音效與主要玩法前端。
- 一般遊戲最終規則裁決。
- 博奕機率與結果裁決。
- 即時多人房間同步。
- 第三方平台自己的玩家帳號與錢包。

### Game

Game 負責：

- 顯示遊戲。
- 遊戲畫面與互動。
- 遊戲玩法。
- 產生或管理局號 / round。
- 接收平台給的 session / launch code / gateway token。
- 需要接 wallet 時，透過 Looty Gateway 回報下注、派彩、退款、結算事件。
- 顯示平台回傳的餘額與結果。

Game 不負責：

- 玩家登入。
- 建立 Guest。
- 保存正式玩家帳號。
- 保存玩家 email、Google 帳號、手機或真實身份。
- 直接讀寫 Supabase Auth。
- 直接寫 Looty Supabase。
- 直接更新玩家餘額。
- 決定玩家能不能提款、領 bonus 或使用正式錢包。

### Game Gateway

Game Gateway 是平台與遊戲之間的轉接層，負責：

- 驗證 launch code / gateway token / session。
- 把遊戲的 bet / payout / refund / rollback 轉成平台可處理的格式。
- 對接 Looty wallet API 或第三方平台 wallet API。
- 隔離不同遊戲、不同外部平台的 API 差異。
- 避免遊戲直接依賴 Looty DB、Supabase Auth 或 Supinova。

Game Gateway 的重點是隔離責任，不是把所有遊戲邏輯搬進 Looty。

### Wallet Interface

Wallet Interface 固定錢包語意：

- 查餘額。
- 扣款下注。
- 派彩入帳。
- 退款 / rollback。
- 關閉局號。

第一階段接 Looty 同一個 Supabase 裡的 wallet tables。
未來如果接 Supinova 或第三方平台 wallet API，應改 adapter，不讓遊戲重寫。

## 帳號設計

玩家帳號分兩種：

- Guest / 匿名玩家。
- Registered / 正式帳號。

Guest 可以先玩，後面可以升級成正式帳號。

原則：

- Guest 由 Looty Platform 建立，不由遊戲建立。
- 正式帳號使用 Supabase Auth，例如 Google、Email OTP、Email / password。
- Guest 與正式帳號都對應 `player_accounts`。
- Guest 升級 registered 時，應更新同一筆 `player_accounts`，不是換一個全新玩家。

`player_accounts`：

```text
id
auth_user_id
account_type: guest / registered
display_name
status
created_at
upgraded_at
```

## 錢包設計

Looty 使用平台錢包。

原則：

- 遊戲不能直接改玩家餘額。
- 遊戲要下注、派彩、退款，都要走平台後端 / DB RPC / API。
- 錢包一定要有流水，不只存一個 `balance`。
- `balance` 可以是目前餘額，但交易真相必須能從 `wallet_transactions` 查到。
- 每次錢包操作都要有 `idempotency_key`，避免重複扣款或重複派彩。

`wallet_accounts`：

```text
id
player_account_id
currency
balance
locked_balance
status
created_at
updated_at
```

目前方向是一個 `player_account_id + currency` 只會有一個 active wallet account。

`wallet_transactions`：

```text
id
wallet_account_id
type: deposit / withdraw / bet / payout / refund / adjustment
amount
balance_before
balance_after
game_session_id
game_id
round_id
idempotency_key
metadata
created_at
```

說明：

- `bet` 通常扣款。
- `payout` 通常入帳。
- `refund` 用於取消、rollback 或退款。
- `adjustment` 用於後台或系統調整。
- `round_id` 用來對應遊戲局號。
- `metadata` 放遊戲或供應商補充資訊，不放玩家隱私資料。

第一版不先做完整銀行式 double-entry ledger。
之後需要正式 settlement、平台資金池、供應商結算或更嚴格審計時，再升級。

## 非博弈遊戲與入場模式（未實作）

遊戲類型不等於收費方式。未來 Looty Platform 可為每款遊戲定義：

- `free`：免費進入，不扣 POINT。
- `points_entry`：Looty 扣除指定 POINT，成功後才發放入場資格。
- `paid_purchase`：真實付款由 Looty 的金流與訂單層處理，遊戲只接收已授權的入場結果。

責任邊界：

- Looty 決定價格、扣款、退款、付款結果與入場資格。
- Game 只接收平台授權，不自行收費、不決定匯率、不直接修改餘額。
- 重新整理或斷線重連不能重複收費；每次購買或入場扣款都要有 idempotency key。
- 非博弈交易未來應使用 `entry_fee / purchase / reward / refund`，不要把一般入場費偽裝成 `bet`。
- Demo、Paid、Bonus POINT 的購買、使用、退款、有效期限與可否兌現必須由 Looty Platform 分開定義。

目前 DB 與 Gateway 尚未提供上述入場模式與非博弈交易類型。現在只有 `wallet_mode = demo`、10,000 Demo POINT 與既有 wallet endpoints；遊戲 AI 不要自行實作或假設這些未來規格已經可用。

## 遊戲啟動方向

目前已實作的啟動方式：

```text
Player
  -> Lobby
  -> /game/?slug=<slug>
  -> looty-gateway/create-session
  -> iframe launch_url + Looty query params
```

目前 Loader 會附加給 iframe 的 query params：

```text
looty_session_id
looty_launch_code
looty_game_id
looty_currency
looty_wallet_mode
looty_gateway_url
looty_exchange_url
```

遊戲可以先只讀這些參數，不一定要立刻接錢包。舊遊戲如果忽略這些 query params，仍可照常顯示。

遊戲 AI 接入時，建議先做最低限度支援：

1. 從 URL 讀取 `looty_launch_code` 與 `looty_exchange_url`。
2. 若缺少這兩個值，維持原本 demo / free-play 流程。
3. 對 `looty_exchange_url` POST `{ "launch_code": "..." }`。
4. 將回傳的 `gateway_token` 只保存在執行中的記憶體狀態。
5. Wallet requests 使用 `gateway_token`，不要使用 Supabase anon key、JWT 或 Authorization header。
6. 目前 `wallet_mode` 是 `demo`，不要把它當成正式可兌現資產。

啟動目標：

```text
Player / Guest
  -> Looty Platform
    -> ensure player_account
    -> ensure wallet_account
    -> create game_session
    -> issue one-time launch_code
      -> Game exchanges gateway_token
```

遊戲啟動後：

```text
Game
  -> bet / payout / refund / close round
    -> Game Gateway
      -> Wallet Interface
        -> Looty wallet API / DB RPC / backend API
```

遊戲只認一次性 `launch_code` 與交換後的短效 `gateway_token`。
遊戲不要拿 Supabase auth token，也不要知道玩家 email、Google 帳號、後台權限或真實身份。

重要限制：

- Loader 只傳 `looty_session_id`、`looty_launch_code`、`looty_game_id`、`looty_currency`、`looty_wallet_mode`、`looty_gateway_url`、`looty_exchange_url`。
- Launch code 兩分鐘到期且只能交換一次；`gateway_token` 最長一小時並綁定 game session 與 action scopes。
- Loader 不把 Supabase anon key、JWT、Authorization header 或任何 service role key 傳給遊戲。
- `looty-gateway` v3 的 `verify_jwt = false`，由 Gateway 自己驗證 route、origin、launch code、gateway token、scope、session 與 rate limit。
- 遊戲 AI 不要自己發明其他授權方式，也不要去抓 Looty bundle 裡的 env key。

## Session payload 建議

遊戲只需要最少資訊：

```json
{
  "session_id": "...",
  "game_id": "...",
  "player_account_ref": "...",
  "account_type": "guest",
  "currency": "POINT"
}
```

目前 Gateway v1 會回：

```json
{
  "wallet_mode": "demo"
}
```

不要傳：

- email
- phone
- Google profile
- Supabase access token
- admin role
- 真實身份資料

新建立的 Demo POINT 錢包目前由 Looty Platform 發放 10,000 POINT，並留下 `deposit` 流水。這是平台測試點數，不由遊戲發放，也不能提款或兌現。

## Game session / round

`game_sessions` 是平台發給遊戲的啟動授權。

Launch code 與 gateway token 都不應明文長期保存，資料庫只保存 hash。

`game_sessions`：

```text
id
player_account_id
wallet_account_id
game_id
launch_code_hash
launch_code_expires_at
launch_code_used_at
gateway_token_hash
gateway_token_expires_at
gateway_token_scopes
account_type
currency
wallet_mode
status
expires_at
created_at
closed_at
```

`game_rounds`：

```text
id
game_session_id
game_id
round_id
status
bet_amount
payout_amount
refund_amount
started_at
settled_at
```

每一局下注、派彩、退款都要能追到 session、game、round。

## Gateway endpoint

目前已部署：

```http
POST https://lsazydefvnuqglultqii.supabase.co/functions/v1/looty-gateway/create-session
```

要求：

- Supabase Function `verify_jwt` 為 `false`。
- `create-session` 只接受 Looty production / localhost origin，並可驗證傳入的 Supabase user token；沒有 user token 時建立 Guest。
- Supabase client 自動附加的同值 `apikey` / Bearer token 視為 Guest；只有不同於 `apikey` 的 Bearer token 才當作會員 session 驗證。
- 外部遊戲不需要 Supabase key 或 Authorization header。
- Function 內部才使用 service role 呼叫 DB RPC。
- service role key 不能進前端、遊戲端或公開 repo。

輸入：

```json
{
  "slug": "color-guess",
  "currency": "POINT",
  "expires_in_seconds": 3600
}
```

輸出：

```json
{
  "session_id": "...",
  "game_id": "...",
  "player_account_ref": "...",
  "launch_code": "...",
  "launch_code_expires_at": "...",
  "account_type": "guest",
  "currency": "POINT",
  "wallet_mode": "demo",
  "expires_at": "..."
}
```

Launch code exchange：

```http
POST /functions/v1/looty-gateway/exchange
```

```json
{
  "launch_code": "..."
}
```

回傳 `gateway_token`、到期時間與 action scopes。Launch code 交換成功後立刻失效。

Wallet endpoints：

```http
POST /functions/v1/looty-gateway/balance
POST /functions/v1/looty-gateway/bet
POST /functions/v1/looty-gateway/payout
POST /functions/v1/looty-gateway/refund
POST /functions/v1/looty-gateway/close-round
```

Wallet endpoint 共通要求：

- body 要帶交換後的 `gateway_token`。
- `bet` / `payout` / `refund` 要帶 `round_id`、`amount`、`idempotency_key`。
- `metadata` 可選，但必須是 object。
- service role key 只存在 Edge Function 環境，不進遊戲前端。
- Request body 上限 16 KiB；各 route 有 DB-backed IP rate limit。

目前授權狀態：

- Looty Loader 呼叫 `create-session`，只把一次性 launch code 傳給 iframe。
- 遊戲交換後可直接用 `gateway_token` 呼叫 Gateway v1，不需要任何 Supabase key。
- `gateway_token` 只放執行中記憶體，重新整理時由 Loader 建立新 session。
- 目前 `wallet_mode = demo`；正式金流仍需可信任遊戲後端或外部 wallet adapter，不能把瀏覽器派彩當作正式裁決。

`balance` body：

```json
{
  "gateway_token": "..."
}
```

`bet` body：

```json
{
  "gateway_token": "...",
  "round_id": "round-001",
  "amount": 10,
  "idempotency_key": "game-round-001-bet",
  "metadata": {
    "source": "game"
  }
}
```

`payout` body：

```json
{
  "gateway_token": "...",
  "round_id": "round-001",
  "amount": 18,
  "idempotency_key": "game-round-001-payout",
  "metadata": {
    "source": "game"
  }
}
```

`refund` body：

```json
{
  "gateway_token": "...",
  "round_id": "round-001",
  "amount": 10,
  "idempotency_key": "game-round-001-refund",
  "metadata": {
    "reason": "round_cancelled"
  }
}
```

`close-round` body：

```json
{
  "gateway_token": "...",
  "round_id": "round-001"
}
```

注意：

- 不存在 slug 會回 `404 game is not available`，不建立 session。
- 無效、過期或 scope 不符的 `gateway_token` 會回 `404 game session is not active`。
- 無效、過期或已使用的 launch code 會回 `404 launch code is invalid or expired`。
- 缺必要參數會回 `400`。
- 超過 rate limit 會回 `429`。
- 重送同一個 `idempotency_key` 不會重複扣款或重複派彩。
- Round 以 `game_session_id + round_id` 隔離；一個 session 不能關閉另一個 session 的 round。

遊戲端不得保存 `launch_code` 或 `gateway_token` 到長期 storage。`gateway_token` 只放執行中記憶體，重新整理頁面時由 Loader 重新建立 session。

## 建議 API / RPC

DB 層第一版已建立：

```text
create_game_session
exchange_game_launch_code
wallet_get_balance
wallet_bet
wallet_payout
wallet_refund
close_game_round
```

尚未建立：

```text
upgrade_guest_account
```

底層 helper 包含：

```text
looty_hash_secret
looty_active_session
looty_apply_wallet_transaction
looty_consume_gateway_rate_limit
looty_cleanup_gateway_runtime
```

但給遊戲看的語意建議保持：

- `bet`
- `payout`
- `refund`

要求：

- bet / payout / refund 必須帶 `idempotency_key`。
- 同一個 `idempotency_key` 重送時，不能重複扣款或重複派彩。
- refund / rollback 要能對應原本 bet 或 round。
- 遊戲端只能呼叫 API / RPC，不能直接寫錢包表。

## 主要接入方向

### Looty 自己的平台接自己的遊戲

```text
Looty Platform
  -> Game Gateway
    -> Looty Game
```

- Looty Platform 管玩家、session、錢包。
- Looty Game 管畫面與玩法。
- Game Gateway 管中間轉接。
- Wallet Interface 管錢包語意。

### 外部遊戲接進 Looty

```text
Looty Platform
  -> Game Gateway
    -> External Game
```

- Looty 負責玩家身份、game session、錢包與交易流水。
- 外部遊戲只認 Looty 給的 session、launch code 或 gateway token。
- 外部遊戲透過 Looty wallet API 請求下注、派彩、退款。
- 外部遊戲不直接讀寫 Looty Supabase。
- 外部遊戲不保存 Looty 玩家隱私資料。

### Looty 遊戲接到外部平台

```text
External Platform
  -> Looty Game Gateway
    -> Looty Game
```

- 外部平台通常負責玩家身份與錢包。
- Looty Game Gateway 把 Looty 遊戲的 bet / payout / refund 轉成外部平台 API。
- Looty Game 不直接知道外部平台玩家隱私資料。
- Looty Game 不直接寫外部平台錢包。

## Supinova / Spinnova

目前結論：第一階段不要先接 Supinova / Spinnova。

原因：

- Looty 自己的平台和遊戲責任邊界才剛整理好。
- Looty 目前用同一個 Supabase 補平台骨架就夠。
- 還沒有正式第三方平台或高頻交易壓力。
- 先把 Looty 自己的平台錢包語意定好，比先接外部錢包更重要。

現在方向：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Looty wallet tables in same Supabase
```

未來如果接 Supinova / Spinnova：

```text
Looty Platform
  -> Game Gateway
    -> Wallet Interface
      -> Supinova adapter
        -> Supinova API / Supinova DB
```

重點是用 adapter 對接，不讓遊戲直接依賴 Supinova / Spinnova。

## 接入檢查清單

新遊戲要接 Looty 前，至少確認：

- 有唯一 `slug`。
- 有可被 Loader 載入的 `launch_url`。
- 能被 iframe 載入。
- 手機滿版容器下畫面正常。
- 不需要自己做玩家登入。
- 不需要自己建立 Guest。
- 不直接碰 Supabase auth token。
- 不直接寫玩家資料表。
- 不直接寫錢包資料表。
- 每一局有 `round_id` 或等價局號。
- 每一次下注、派彩、退款都有唯一 `idempotency_key` 或交易識別。
- 可以區分 demo / guest / registered 的遊玩情境，但不要自己決定正式錢包權限。

已上架舊遊戲的原則：

- 不需要為了 Loader session 立即改遊戲本體。
- 先讓它們維持 iframe 可玩。
- 要接錢包時，一次只挑一款遊戲改。
- 改遊戲本體前，先確認該遊戲 repo 是乾淨工作區，並先讀該遊戲自己的 AI 文件。

## Supabase 現況

目前 Looty 的 public schema 包含：

- `games`
- `public_games_v1`
- `admin_users`
- `player_accounts`
- `wallet_accounts`
- `wallet_transactions`
- `game_sessions`
- `game_rounds`
- `gateway_rate_limits`

已移除或不再使用：

- `players`
- `player_balances`
- `access_whitelist`
- `site_settings`
- `ensure_my_player_v1()`

已套用 migration：

- `20260709123000_drop_legacy_player_balance.sql`
- `20260709124500_drop_unused_access_settings.sql`
- `20260709170000_create_platform_account_wallet_core.sql`
- `20260710010000_create_game_session_wallet_rpc.sql`
- `20260710011000_restrict_game_session_wallet_rpc_grants.sql`
- `20260710013000_fix_wallet_rpc_variable_conflicts.sql`
- `20260710140000_secure_admin_game_access.sql`
- `20260710141000_create_gateway_v1_session_auth.sql`
- `20260710142000_bind_rounds_to_game_sessions.sql`
- `20260710143000_add_gateway_runtime_limits.sql`
- `20260710210000_grant_demo_wallet_initial_credit.sql`

已部署 Edge Function：

- `looty-gateway` v4，`verify_jwt=false`，由 Gateway 自行驗證。

注意：

- `games` / `public_games_v1` / `admin_users` 是目前前台與 Admin 正在使用的核心資料。
- 5 張平台骨架表與 `gateway_rate_limits` 已開 RLS，沒有前端讀寫 policy，anon / authenticated table grants 已撤銷。
- Game session / wallet RPC 目前只開給 `service_role`，不要從前端直接呼叫。
- `games` 只允許通過 `is_looty_admin()` 的 authenticated 使用者管理；前端不直接讀整張 `admin_users`。
- 新平台錢包不要沿用 `player_balances`。
- 玩家資料用 `player_accounts`，不要復活 `players`。
- 錢包資料用 `wallet_accounts` + `wallet_transactions`，保留交易流水、局號與 idempotency。

## 尚未定案

這些還不要寫死：

- Guest 的保存期限。
- Guest 是否一定用 Supabase anonymous sign-in，或先用本地 guest token 過渡。
- Guest balance 是純 demo balance，還是短期 guest credit。
- Guest 升級正式帳號時，衝突資料要自動 merge 還是讓玩家選。
- 正式帳號第一版登入方式。
- `wallet_accounts.balance` 是否只是目前餘額快取，或是否要完全以 `wallet_transactions` 重算。
- 第一版是否立刻使用 `locked_balance`。
- 第一版是否需要 `wallet_type`。

## 實作提醒

- 不要先做完整會員中心再做遊戲 session。
- Loader 已接 `looty-gateway/create-session`，遊戲接入時使用 `exchange` 取得短效 `gateway_token`。
- 不要在 Looty repo 任務中直接修改遊戲本體 repo。
- 下一步若要接遊戲本體，必須由使用者明確指定哪一款遊戲，並切到該遊戲 repo 執行。
- 不要讓前端直接 `insert player_accounts`、`wallet_accounts`、`wallet_transactions`。
- 玩家初始化、Guest 建立、錢包建立，應放在 DB RPC 或後端流程。
- Admin 白名單之後可視需要從 email 升級到 auth user id，但不是目前 MVP blocker。
- 錢包流程要預留 `idempotency_key`、`round_id`、交易識別與查帳資訊。

## Supabase 操作原則

Looty 的 Supabase project ref：

```text
lsazydefvnuqglultqii
```

AI 操作 Supabase 前必須先確認目前目標是 Looty，不是 Aura、Supinova 或其他專案。

確認方式：

```powershell
.\scripts\supabase-looty.cmd projects list
```

結果中 `Looty` / `lsazydefvnuqglultqii` 應為 `linked: true`。
如果只看到 `arua`，立刻停止。

`.env.supabase.local` 只留本機，不提交、不貼到對話裡。

原則：

- Looty 遠端 Supabase 操作優先使用 `.\scripts\supabase-looty.cmd`。
- 不要直接依賴全域 `supabase login`。
- 要改 DB 時，先產 SQL migration，讓使用者確認後再執行。
- 不要建立或保留 baseline / 大重建 migration，除非使用者明確同意。
- 不要在文件或程式碼裡提交 Supabase access token、service role key、DB password。
