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
- 2026-07-10 已部署 Supabase Edge Function `looty-gateway` v4，支援 `create-session`、一次性 launch code `exchange` 與第一版 wallet endpoints。
- 2026-07-10 已修正匿名 Supabase client 被誤判成無效會員 session 的問題，正式網站 Guest `create-session` 已驗證通過。
- 2026-07-10 新建立的 Demo POINT 錢包會取得 10,000 POINT 並留下發放流水；正式營運前再用小步 migration 關閉並清理測試資料。
- 2026-07-10 Game Loader 已改傳兩分鐘有效、只能用一次的 launch code；遊戲可交換最長一小時的 `gateway_token`，Supabase anon key / JWT 不進 iframe。
- 2026-07-10 已套用第一階段安全 migrations，收緊 Admin / table 權限、綁定 round / transaction session、加入 scope、rate limit 與過期清理。
- Gateway v1 wallet mode 目前明確是 `demo`；正式金流仍需要可信任遊戲後端或外部 wallet adapter。
- 目前沒有修改任何已上架遊戲本體；舊遊戲可以先忽略 Looty session 參數。
- 2026-07-10 已確認 `npm run build` 與 `npm run smoke` 通過。

## 目前工作方向

目前不是重做架構或補大型功能的階段。MVP 主路徑已經可用，接下來先以現有 Cloudflare Pages 網址和電腦版 Admin 驗證實際內容。

同時要先把平台與遊戲責任邊界整理清楚。未來會有兩種方向：外部遊戲接進 Looty、Looty 自己的遊戲接到外部平台。帳號、Guest、錢包、game session、Gateway 的分工要先在文件裡定好，不要等開始寫功能才混在一起。

現在主要要做：

1. 用 Admin 上架 / 下架 / 編輯遊戲資料。
2. 確認 Lobby 能看到公開遊戲。
3. 確認 Game Loader 能用 `slug` 開啟正確遊戲。
4. Gateway v1 授權交接已完成；若要驗證遊戲端，下一步由使用者指定一款乾淨遊戲 repo 做正式接入。
5. 持續整理 `GAME_PLATFORM_INTEGRATION.md` 的遊戲接入規則。
6. 有具體問題時再針對該問題修正。

現在不要主動切正式網域、重做 Admin、恢復會員中心 UI、做完整錢包功能或把 Flash 兄弟模組接進來。
也不要在 Looty repo 任務中直接修改遊戲本體 repo。

## 技術與營運策略結論

2026-07-10 已完成一次 Looty repo、Supabase、Cloudflare Pages 與正式營運基線調查。除非外部服務、法規或產品目標明顯改變，後續 AI 不需要重新做同一輪泛用調查，應直接以本節作為產品與營運方向。

Looty 的目標不是讓一個人維護完整金融 / 博弈平台，而是成為：

- 一個人可以簡單維運的遊戲入口與接入平台。
- 現在不一定收錢，但架構保留接正式錢包或外部結算商的能力。
- 對外合作時有清楚、可驗證的遊戲接入契約。
- Looty 自己的遊戲可以透過 adapter 接到其他遊戲商或外部平台。
- 投資、授權或收購時，系統可以靠文件、migration、測試與操作流程交接，不依賴原作者口頭說明。

專業基線不是功能數量，而是：

- 權限與責任邊界清楚。
- 部署可以重現與回復。
- 重要操作可以追查。
- 資料有備份與還原流程。
- 遊戲不直接碰玩家資料或平台 DB。
- 外部錢包或平台可以透過 adapter 更換。
- 已知限制誠實記錄，不把平台骨架宣稱成正式金流。

建議長期維持的錢包接入方向：

```text
Game
  -> Looty Gateway v1
    -> Wallet Adapter
      -> Demo Wallet
      -> Looty non-cash points
      -> External platform wallet
```

Looty 核心只固定玩家 / Guest、遊戲目錄、launch session、round、idempotency、統一錢包語意與查帳資訊。儲值、提款、KYC、正式 ledger、settlement 與第三方平台差異放在外部系統或 adapter，不要先由 Looty 自己承擔。

### 未來營運入場與 POINT 方向（未實作）

遊戲類型與收費方式要分開。未來每款遊戲可有獨立的入場模式：

- `free`：免費進入，只建立 session，不扣 POINT。
- `points_entry`：由 Looty 扣除指定 POINT 後發放入場資格。
- `paid_purchase`：真實付款由平台金流與訂單系統處理，成功後再轉成平台 POINT 或購買資格。

遊戲不接觸現金、匯率、付款訂單，也不自行發放或修改 POINT。非博弈遊戲不應硬套 `bet / payout`，未來應使用 `entry_fee / purchase / reward / refund` 等交易語意，並用 idempotency 避免重新整理或斷線重連時重複扣款。

小遊戲或非博弈 H5 遊戲可以先作為公開遊戲入口上架測試。這類遊戲現階段應維持 Demo / free-play，不接 Looty Wallet，`type` 優先使用 `casual` 或 `arcade`，遊戲端可以忽略 Looty session query params。若只是測試 Admin 資料，不想出現在 Lobby，則保持 `published = false`。

POINT 性質至少要能區分：

- Demo POINT：測試使用，不可提款或兌現。
- Paid POINT：玩家付款取得，購買、退款與有效期限要由平台定義。
- Bonus POINT：平台贈送，使用限制與有效期限要由平台定義。

目前只有 `wallet_mode = demo` 與新錢包 10,000 Demo POINT。上述入場模式、POINT 分類、真實付款與非博弈交易類型都尚未實作，正式施工前要再確認規則並使用小步 migration。

若產品同時包含付費入場、隨機結果與可兌現獎品，不要直接當一般付費遊戲上線，正式營運前需另做法規確認。

### 第一階段安全基線（已完成）

2026-07-10 已完成：

1. Gateway v1 授權已定案。
   - 不讓遊戲取得 Looty 的 Supabase JWT、anon key 或 service role key。
   - URL 只放兩分鐘有效、只能使用一次的 launch code。
   - Launch code 交換最長一小時、限 session / action scope 的 Gateway token。
2. Round 所屬已修正。
   - 每一局與 wallet transaction 都綁定自己的 `game_session_id`。
   - 不同玩家或 session 可安全使用相同 `round_id`。
3. DB 與 Admin 權限已稽核並收緊。
   - `games`、`admin_users`、公開 view、RPC grant 與 RLS policy 已核對。
   - Admin 改用 `is_looty_admin()`，前端不再直接讀整張白名單。
4. Gateway 防濫用能力已補上。
   - DB-backed rate limit、16 KiB body 限制、token / session 過期、rate bucket 清理與結構化失敗紀錄。
   - Guest account 的長期保存期限仍未定案，第一階段不自動刪除玩家或錢包。
5. 安全測試已建立。
   - 已驗證 origin、一次性 launch code、無效 token、idempotency、跨 session round 與 close-round 權限。

第一階段已用四個小步 migration 套用，Gateway v1 security smoke 已通過。後續若改 Gateway 契約，仍要先確認設計，再產生小步、可審查的 migration。

完成第一階段後，再依需求進行：

- 一人維運：Cloudflare 部署失敗通知、Supabase advisor、備份 / 還原演練、事故處理文件、依賴漏洞管理。
- 對外接入：版本化 API、OpenAPI、最小 JS SDK、範例遊戲、Sandbox、接入檢查與 contract tests。
- 商業交接：架構圖、服務成本、帳號與資產所有權、第三方授權、備份證明、測試結果與已知限制。
- 正式金流：只有在出現明確合作方、收入需求與維運責任後，才評估外部 wallet / ledger / settlement 服務；不要現在自行補完整金融系統。

### 已查證參考

這次結論已對照以下官方資料：

- Supabase Production Checklist：RLS、索引、rate limit、負載測試與正式上線檢查。
  - https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase Database Backups：付費方案每日備份、PITR 與免費方案自行匯出方向。
  - https://supabase.com/docs/guides/platform/backups
- Cloudflare Pages Git integration：Git 自動部署與 preview deployment。
  - https://developers.cloudflare.com/pages/configuration/git-integration/
- Cloudflare Notifications：Pages 部署成功 / 失敗通知。
  - https://developers.cloudflare.com/notifications/notification-available/
- OWASP API Security Top 10：物件授權、Authentication、功能權限與資源濫用風險。
  - https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- NIST Secure Software Development Framework：安全開發、元件來源、漏洞回應與採購 / 收購溝通基線。
  - https://csrc.nist.gov/projects/ssdf
- GitHub Dependabot：依賴漏洞告警與修補方向。
  - https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-alerts

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
- Loader 會把 `looty_session_id`、`looty_launch_code`、`looty_game_id`、`looty_currency`、`looty_wallet_mode`、`looty_gateway_url`、`looty_exchange_url` 傳給遊戲。
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
