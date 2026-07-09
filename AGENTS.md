# Looty AI Guide

這份文件只給 AI / Codex 讀，不是對外產品文件。

## 先讀文件

進入專案後先讀：

1. `README.md`
2. `GAME_PLATFORM_INTEGRATION.md`
3. `LOOTY_MVP.md`
4. `FLASH.md`

`README.md` 是目前 repo 實作真相來源。
`FLASH.md` 只看大系統背景，不當作 Looty repo 細節真相。

## 回答方式

- 用一般人聽得懂的話回答。
- 簡單、扼要、直接講重點。
- 不寫過度技術化或冗長說明。
- 有做什麼、沒做什麼、下一步是什麼，要講清楚。

## 寫程式方式

- 代碼要精簡扼要。
- 不寫程式碼備註。
- 不做無關重構。
- 優先沿用現有架構與風格。
- 不新增不必要的抽象層。
- 不把簡單問題做複雜。
- 不為營運前舊資料、舊流程、舊欄位保留相容代碼。

## Looty 固定規則

- 不改成 React / Vue / Next.js，除非使用者明確要求。
- 不改 Cloudflare Pages 靜態部署架構。
- 不新增本地 `enabled-games` 白名單。
- 不恢復前台會員登入 UI，除非先重新設計會員入口。
- 不把 Flash 兄弟模組責任硬塞進 Looty。
- 遊戲不要自己登入玩家，也不要直接改玩家餘額。

## Supabase 規則

- Looty Supabase project ref 是 `lsazydefvnuqglultqii`。
- Supabase CLI token 在這台 Windows 上是全域登入狀態，不是專案檔的一部分。
- Looty 遠端 Supabase 操作優先使用 `.\scripts\supabase-looty.cmd`，不要直接依賴全域 `supabase login`。
- 不要只相信 profile 名稱或目前所在資料夾；每次 DB 操作前都要跑 `.\scripts\supabase-looty.cmd projects list`。
- `projects list` 必須看到 `Looty` / `lsazydefvnuqglultqii` / `linked: true`。
- 如果只看到 `arua`，立刻停止；不要反覆叫使用者重登，先確認 `.env.supabase.local` 是否是 Looty token。
- 不要使用 arua / Aura 的 Supabase CLI 狀態操作 Looty。
- Looty 目前主力用 Supabase CLI + migration 管理 DB。
- Supabase MCP 暫不授權、不作為主要操作方式，也不要給其他專案共用 Looty MCP。
- 要改 DB 前，先產 SQL migration 給使用者確認。
- 不要留下未確認的 baseline / 大重建 migration 草稿；這類檔案容易被誤套用。
- `.env.supabase.local` 只放本機，不提交；範本是 `.env.supabase.local.example`。
- 如果 `.env.supabase.local` 不存在，請使用者在本機建立；不要要求使用者把 token 或 DB password 貼到對話裡。
- 不要在文件或程式碼裡提交 Supabase access token、service role key、DB password。

## DB 規則

正式營運前的舊資料不要保留，也不要當成正式歷史資料維護。
如果看到測試資料、過渡資料、舊設計殘留資料，先視為可清理或可重建，不要為了相容舊資料犧牲新設計。

目前遠端 DB 只保留：

- `public.games`
- `public.admin_users`
- `public.public_games_v1`

目前 repo 不保留 baseline migration。未來 DB 改動用小步、可審查的 migration，不要一次重建整個 schema。

不要復活舊的：

- `players`
- `player_balances`
- `access_whitelist`
- `site_settings`
- `ensure_my_player_v1()`

未來玩家與錢包方向：

- 玩家表用 `player_accounts`，不要直接復活舊 `players`。
- 錢包用 `wallet_accounts` + `wallet_transactions`，不要復活舊 `player_balances`。
- 會員、Guest、錢包初始化放在 DB RPC 或後端流程，不要讓前端直接寫玩家或錢包表。
