# Looty Analytics v1.0

這份文件只記錄 Looty 的營運分析、系統監控與告警規格。

狀態：規劃中，尚未實作。

目前 repo 實作真相以 `../../README.md` 為準。

## 目標

使用 Supabase 作為資料來源、Grafana Cloud Free 作為視覺化與告警工具，建立一套適合一人維運、可支撐公開產品驗證與早期商用驗證的 Looty Analytics。

原則：

- 報表數字必須有可靠資料來源，沒有資料時顯示 unavailable，不用 `0` 偽裝。
- 所有 Dashboard 使用共用模板與變數，不為每款遊戲重做。
- Grafana 只讀 Reporting Views，不讀玩家隱私、不寫入 DB。
- 現有遊戲維持可玩，不因 Analytics 規劃直接修改遊戲本體 repo。
- Demo POINT、瀏覽器端遊戲結果與正式金流必須清楚區分。
- 先做目前算得準的項目，再補需要遊戲配合的指標。

## 工具組合

- Grafana Cloud Free
  - 營運 Dashboard。
  - 系統健康 Dashboard。
  - Synthetic Monitoring。
  - Email 告警。
- Supabase Postgres
  - 營運報表資料來源。
  - Reporting Views。
  - Gateway request / error event。
- Supabase Reports
  - 查看 DB CPU、記憶體、連線、容量與效能。
- Cloudflare Web Analytics
  - 查看訪客、頁面流量與前端效能。
- Windows 排程與私人雲端資料夾
  - 執行加密 DB 備份與保留管理。

第一階段不另外導入 Metabase、Prometheus、Sentry、PagerDuty，也不自架 Grafana。

## Dashboard 架構

長期保留四層架構，但第一階段只完成第一、第二與第四層。第三層等遊戲數量與有效 Round 資料增加後再啟用。

### 第一層：Platform Overview

平台營運總覽，第一階段顯示：

- 今日、7 日、30 日 Launch Session。
- 各遊戲 Session 排行與趨勢。
- 各遊戲類型 Session 佔比。
- Guest、wallet、transaction、round 數量。
- Demo POINT 的 bet、payout、refund。
- 未關閉 Session 與 Round。
- DB 資料量與成長。
- Lobby 與 Gateway 目前狀態。
- 最近 Critical 與 Warning 告警。

以下 KPI 要等資料條件滿足後才顯示：

- DAU、WAU、MAU。
- CCU。
- 平均遊玩時間。
- 正式 Round 統計。
- RTP。
- 平台錯誤率與 API p95 回應時間。

### 第二層：System Health

只保留需要採取行動的系統資訊：

- Lobby 可用率與回應時間。
- Gateway health 狀態與回應時間。
- Gateway 4xx、5xx、429。
- API p50、p95 回應時間。
- DB 容量。
- 過久未關閉的 Session 與 Round。
- 負數錢包或交易餘額不一致。
- 最近系統告警。

不把大量 Supabase 原始 logs 搬進 Grafana。需要深入調查時使用 Supabase Logs Explorer 與 Reports。

### 第三層：Game Type Overview

狀態：保留架構，第一階段不啟用。

所有類型共用同一個 Dashboard，以 `game_type` 變數切換：

- `slot`
- `fish`
- `card`
- `arcade`
- `casual`
- `adult`

預計顯示：

- 該類型 DAU、Session、Round。
- 該類型遊戲排行。
- 平均遊玩時間。
- Demo bet、payout、refund 與 RTP。
- 錯誤率與 API 回應時間。

目前 Looty 已知公開遊戲主要分布在 slot、fish、arcade。多數仍是 Demo 或 free-play，尚未接 Looty Wallet，因此第一階段先用 Platform Overview 的類型篩選取代獨立類型 Dashboard。

### 第四層：Game Detail

所有遊戲共用同一個 Dashboard，以 `game_id` 或 `slug` 切換，不為每款遊戲複製 Dashboard。

第一階段顯示：

- 遊戲名稱、類型與狀態。
- Launch Session。
- Session 趨勢。
- 已有的 Round 與 Demo wallet transaction。
- 未關閉 Session 與 Round。
- Gateway 錯誤。

資料接入完成後增加：

- DAU、WAU、MAU。
- CCU。
- 平均遊玩時間。
- 遊戲載入成功率。
- Round 與 RTP。
- 錯誤率。
- API p50、p95 回應時間。

## KPI 定義

### Launch Session

`game_sessions` 建立成功的次數。

它代表 Looty 已發放遊戲啟動授權，不代表 iframe 一定載入成功，也不代表玩家完成一局。

### DAU / WAU / MAU

指定期間內有有效活動的不同 `player_account_id` 數量：

- DAU：每日。
- WAU：最近 7 日。
- MAU：最近 30 日。

目前 Guest 每次啟動可能建立新帳號，同一個人可能被重複計算。Guest 重用或穩定匿名身份完成前，Dashboard 不應把這個數字標成正式 DAU、WAU、MAU，可以暫時顯示 Active Accounts 並附上限制。

### CCU

最近 5 分鐘內仍有 heartbeat，且 Session 未過期、未關閉的不同 Session 數量。

目前沒有 heartbeat，不能只用 `game_sessions.status = active` 當 CCU，否則會高估同時在線人數。

### Round

以 `game_session_id + round_id` 為唯一遊戲局。

只有遊戲正式回報 Round 後才納入統計。尚未接 Looty Wallet 或 Gateway Round 的遊戲不顯示 `0`，而是顯示 unavailable。

### 平均遊玩時間

以 Session 開始時間到最後 heartbeat 或明確關閉時間計算。

只有 iframe `load` 事件不足以判斷玩家仍在遊戲內。未建立 heartbeat 或可靠關閉訊號前不顯示正式平均遊玩時間。

### 錯誤率

指定時間內：

```text
失敗 request 數 / 全部 request 數
```

必須按 route、game、status code 分開。只記錄 DB 成功交易無法推算錯誤率。

### API 回應時間

Gateway 每次 request 記錄 `duration_ms`，Dashboard 顯示 p50 與 p95，不只顯示平均值。

### RTP

只計算已結算且未退款的有效 Round：

```text
RTP = payout 總額 / bet 總額 × 100%
```

限制：

- 沒有有效 bet 時不顯示 RTP。
- 退款 Round 不納入有效 bet。
- 現階段只能標示 Demo RTP。
- 瀏覽器端自行產生的結果不能當正式商用或可兌現 RTP。
- 正式 RTP 必須建立在可信任遊戲後端或裁決系統的結果上。

## Analytics Event

第一階段預計記錄最小 request event：

- `route`
- `game_id`
- `game_session_id`
- `status_code`
- `error_code`
- `duration_ms`
- `created_at`

不記錄：

- email
- phone
- Google profile
- launch code
- gateway token
- Supabase access token
- service role key
- request 完整 body

Gateway request / error event 只保留 30 天，避免 Free DB 持續成長。

未來要啟用 CCU 與遊玩時間時，再增加最小 heartbeat。遊戲必須透過 Gateway 或明確的 Looty integration contract 回報，不讓遊戲直接寫 Supabase table。

## 告警等級

### Critical

需要立即查看：

- Lobby 連續兩次無法開啟。
- Gateway health 連續兩次失敗。
- 出現負數錢包。
- wallet account 與 transaction 餘額不一致。

### Warning

需要當天處理：

- 10 分鐘內出現 3 次以上 Gateway 5xx。
- DB 使用量超過 400 MB。
- 429 在短時間內異常增加。
- Session 或 Round 超過預定時間仍未關閉。

### Info

只顯示在 Dashboard，不主動寄信：

- 新遊戲首次出現 Session。
- 資料量達到觀察門檻。
- 一般部署或設定事件。

第一階段 Critical 與 Warning 寄到單一營運 Email。不要設定「今天沒有人玩」等低價值告警。

## Reporting Views 與權限

預計用小步 migration 建立：

- 平台每日彙總 view。
- 遊戲每日彙總 view。
- 遊戲類型每日彙總 view。
- wallet / round 彙總 view。
- 系統異常與 DB 容量 view。
- Grafana 專用唯讀 DB 帳號。
- Gateway request event 表與必要索引。

安全要求：

- Grafana 只能讀指定 Reporting Views。
- 不提供玩家隱私、token、credential 或完整 request body。
- 不提供 DB insert、update、delete 權限。
- 不使用 Supabase anon key 或 service role key 當 Grafana DB 帳號。
- Grafana DB 密碼只存放在 Grafana 安全設定，不寫進 repo。
- 查詢必須限制時間範圍，避免頻繁掃描完整資料表。

依 Looty DB 規則，正式施工前必須先產生小步 SQL migration 給使用者確認，不能直接套用。

## Gateway Health

Gateway 預計增加不建立 Guest、wallet、Session 或 transaction 的輕量 health endpoint。

健康檢查至少要能區分：

- Edge Function 可回應。
- Looty DB 可連線。

監控不得持續呼叫 `create-session`，避免產生大量測試資料。

## 現有遊戲處理原則

- 不為了 Analytics 直接修改任何遊戲本體 repo。
- 沒接 Looty Wallet 的遊戲仍可正常上架與遊玩。
- 沒有 Round、heartbeat 或 error event 時，相關 KPI 顯示 unavailable。
- 要啟用完整單一遊戲指標時，由使用者指定一款遊戲並切到該遊戲 repo 接入。
- 新遊戲沿用相同 Game Detail 模板，不新增專用 Dashboard。
- 遊戲分類沿用 `games.type`，不新增另一套 Analytics 分類。

## 免費備份

Supabase Free 不作為唯一備份來源。

預計做法：

- Windows 每天凌晨執行一次 DB logical dump。
- 備份加密後同步到私人 OneDrive 或 Google Drive。
- 保留最近 7 份每日備份。
- 保留最近 4 份每週備份。
- 每月執行一次本機還原測試。
- 備份腳本沿用本機 `.env.supabase.local`，不把密碼寫進 repo 或對話。

## 個人營運節奏

- 每天 2 分鐘：查看 Platform Overview 與未處理告警。
- 收到告警時：判斷問題屬於 Lobby、Gateway、Supabase 或外部遊戲。
- 每週 15 分鐘：查看遊戲排行、錯誤、DB 成長與未關閉 Round。
- 每月 30 分鐘：驗證 DB 備份可還原，並更新已知問題。
- 每次正式部署：由執行部署的 Codex 確認部署完成，再檢查 Lobby 與一款遊戲 Loader。

## 與平台開發順序的關係

### Gateway

Gateway 是 Looty 的核心遊戲接入服務，但目前不是從零開始。

現有 `looty-gateway` v4 已支援：

- 建立 Game Session。
- 發放一次性 launch code。
- 交換短效 gateway token。
- 驗證 route、token、scope、session 與 rate limit。
- 第一版 balance、bet、payout、refund、close-round。

接下來的工作是加固與擴充，不是重做：

- 增加不產生資料的 health endpoint。
- 補 Gateway 與外部 RPC request timeout。
- 改善沒有 `Origin` 的自動化濫用風險。
- 記錄最小 request event、錯誤與回應時間。
- 未來以 adapter 或版本化契約接第三方遊戲與外部 wallet。

Gateway 可以驗證 Supabase user token，但不負責會員註冊、登入、忘記密碼、重設密碼或寄信。

Game Loader 負責依 `slug` 找遊戲、向 Gateway 建立 Session，並載入遊戲 iframe。不要把 Loader 畫面與遊戲啟動 UI 搬進 Gateway。

### 會員驗證

會員註冊、登入、Email OTP、密碼重設、OAuth 與寄信由 Supabase Auth 負責。

目前狀態：

- Admin 已使用 Google OAuth。
- 前台會員登入入口刻意停用。
- Guest、registered 與 wallet 的 DB 骨架已存在。
- Gateway 沒有會員 token 時會建立 Guest Session。

恢復會員功能前要先定義：

- 前台會員入口與登入後落點，例如 `/me`。
- 第一版登入方式是 Google、Email OTP 或 Email / password。
- Guest 是否重用、保存多久。
- Guest 升級 registered 時如何保留帳號與 wallet。
- Email 寄送與正式 SMTP 設定。

如果第一版採 Google 或 Email OTP，不一定需要傳統忘記密碼流程。不要為了看似完整而同時實作所有登入方式。

會員、Guest 與 wallet 初始化必須走 Auth、Gateway、後端或 DB RPC，不讓前端直接寫平台資料表。

### 權限管理

Looty 已有第一版權限基礎：

- `admin_users` 白名單。
- `is_looty_admin()`。
- `games` Admin RLS。
- 平台骨架表 RLS。
- 只開給 `service_role` 的 Game Session / wallet RPC。
- `player_accounts.account_type` 區分 Guest 與 registered。

目前不需要建立複雜 RBAC 或大量角色表。

未來出現客服、營運、財務、遊戲商等明確角色時，再以最小角色與權限矩陣擴充。玩家、管理員與 service role 的現有邊界先維持不變。

### Grafana

Grafana 分成兩種工作：

- 基本系統監控：Lobby、Gateway health、回應時間與 Critical 告警，應先做。
- 玩家營運分析：DAU、CCU、遊玩時間、類型分析與 RTP，等有可靠事件與玩家資料後再做。

不能因為目前玩家少就完全不做系統監控，也不能因為已開 Grafana 就顯示尚未能正確計算的營運 KPI。

### 整體開發優先順序

依目前 Looty 已完成狀態，建議順序：

1. 加固 Gateway health、timeout 與防濫用。
2. 建立最小 Lobby / Gateway 存活監控。
3. 決定會員入口、登入方式、Guest 重用與升級規則。
4. 只實作已確認需要的會員流程。
5. 由使用者指定一款遊戲正式接 Gateway contract。
6. 建立現有資料可正確支援的 Platform Overview 與 Game Detail。
7. 玩家與有效事件增加後，再啟用完整營運 KPI 與 Game Type Overview。

## 實施階段

### 第零階段：系統存活監控

不等待玩家或遊戲 Analytics：

1. 增加 Gateway health endpoint。
2. 建立 Grafana Cloud Free。
3. 建立 Lobby 與 Gateway Synthetic Monitoring。
4. 建立最小 System Health。
5. 設定 Critical 存活告警。

完成條件：

- Lobby 中斷時會收到通知。
- Gateway 中斷時會收到通知。
- 監控不會建立 Guest、wallet、Session 或 transaction。

### 第一階段：現有資料營運報表

不修改任何遊戲本體：

1. 啟用 Cloudflare Web Analytics。
2. 產生 Reporting Views、唯讀帳號、request event 與索引 migration，交由使用者確認。
3. 增加 Gateway 最小 request event。
4. 建立 Platform Overview。
5. 擴充 System Health。
6. 建立共用 Game Detail 模板。
7. 設定 Warning 告警。
8. 建立每日備份與每月還原流程。

第一階段只顯示有可靠資料的 KPI。

### 第二階段：玩家與遊戲活動

由使用者指定遊戲後逐步接入：

1. 定義共用 Analytics event / heartbeat contract。
2. 先選一款遊戲驗證 heartbeat、遊玩時間、Round 與錯誤回報。
3. 解決 Guest 重用或穩定匿名身份後啟用 DAU、WAU、MAU。
4. 有 heartbeat 後啟用 CCU 與平均遊玩時間。
5. 有可信任 Round 與 wallet 資料後啟用 RTP。
6. 資料量足夠後啟用 Game Type Overview。

## 免費方案限制與升級條件

這套方案適合公開產品驗證與早期商用驗證，但不代表具備正式 SLA、代管備份或完整金融稽核能力。

出現以下任一情況時，應停止只依賴免費方案並重新評估：

- 開始正式收款。
- POINT 可以提款、兌現或交換有價商品。
- 需要正式 uptime SLA。
- 需要超過一天的完整 Supabase logs。
- DB 接近 400 MB。
- 需要代管自動備份或 PITR。
- 出現明確合作方、稽核或法規要求。

## 官方參考

- Grafana Cloud Pricing: https://grafana.com/pricing/
- Grafana PostgreSQL Data Source: https://grafana.com/docs/grafana/latest/datasources/postgres/
- Grafana PostgreSQL Configuration: https://grafana.com/docs/grafana/latest/datasources/postgres/configure/
- Supabase Pricing: https://supabase.com/pricing
- Supabase Reports: https://supabase.com/docs/guides/telemetry/reports
- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/about/
