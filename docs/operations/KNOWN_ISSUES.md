# Looty Known Issues

這份文件只給 AI / Codex 讀，不是對外產品文件。

目前 repo 實作真相以 `../../README.md` 為準。

用途：

- 記錄已確認的技術問題、風險與改善方向。
- 避免不同 AI 重複檢查、重複下結論。
- 區分目前問題、未來風險與刻意保留的測試行為。

## 目前結論

- 現有正式產品架構可繼續使用，不需要重做。
- Lobby、Game Loader、Admin、Gateway 與 DB 的責任分工大致正確。
- 2026-07-31 `npm audit`、`npm run build`、`npm run smoke`、`npm run test:gateway`、全專案 JavaScript 語法與 Gateway TypeScript 解析已通過。
- 2026-07-31 已確認 Looty linked true；使用者決定暫緩 DB 層 Demo wallet 幣別 migration，未套用檔案已從 active migrations 移除，本機與遠端 16 筆 migrations 同步。
- 以下問題目前不阻擋公開遊戲啟動主路徑。

## 優先處理

### Gateway 防濫用

狀態：已部署 Gateway v5，不建立玩家、錢包或 session 的 production security smoke 已通過。

`create-session` 現在會拒絕缺少 `Origin` 或來源不在白名單的請求。

這能擋掉一般無來源腳本，但 `Origin` 不是不可偽造的身份憑證；DB-backed IP rate limit 仍需保留。若正式營運後仍有濫用，再增加 CAPTCHA、裝置證明或邊緣防護，不要只靠 CORS。

### Loader 與 Gateway 逾時

狀態：Gateway v5 與 Loader 前端已部署，正式 Lobby、Loader 錯誤路徑與資產已驗證。

- Game Loader 等待 iframe `load` 最長 30 秒，逾時會移除 iframe 並顯示 `LOOTY-GAME-006`。
- Gateway 的 Supabase Auth 逾時為 5 秒，REST RPC 逾時為 8 秒。
- iframe 若成功載入外框後才在遊戲內卡住，平台無法只靠 `load` 判斷；要更精準需遊戲實作 ready handshake，屬於遊戲本體接入工作。

### iframe 信任邊界

狀態：已部署，正式資產與本機 smoke 已驗證。

Game Loader 現在統一設定 `sandbox`、`allow`、`referrerPolicy=no-referrer` 與全螢幕權限，不開 modal、popup、下載或 top navigation。

同網域遊戲不給 `allow-same-origin`，以 opaque origin 保護 Looty；跨網域遊戲保留 `allow-same-origin`，讓遊戲能使用自己的 storage。未來若遊戲需要新增 iframe 能力，先確認是遊戲必要需求，再調整平台白名單。

## 資料量增加後處理

### Guest 資料成長

目前匿名玩家每次啟動遊戲都會建立新的 player account、wallet account 與 game session。前台會員入口停用期間，大部分啟動都會走這條流程。

Guest 保存期限與清理規則尚未定案。資料量明顯增加前，需要先決定 Guest 是否重用、保留多久，以及哪些資料可以清理。

### Gateway runtime cleanup

目前成功建立 session 後會同步執行 runtime cleanup。清理會依 session 狀態、到期時間與 rate limit 到期時間掃描資料。

資料量增加後應評估：

- 改成排程或低頻清理。
- 為實際清理條件補適當索引。
- 避免每次 create-session 都承擔完整清理成本。

## 測試缺口

狀態：視需求補強。

目前本機 smoke 主要驗證：

- Lobby 可載入。
- iframe sandbox、權限、同／跨網域隔離與載入逾時。
- Lobby 無效縮圖會切回 placeholder。
- Loader 缺少 slug 時顯示錯誤。
- Admin Login 可載入。
- 共用 Error Modal 可顯示。

目前未完整自動驗證：

- Loader 成功建立 session 並載入遊戲。
- Admin 新增、編輯、刪除與排序。
- URL helper 與 Admin 表單驗證。
- Gateway 其他 request validation 與錯誤轉換。

Production Gateway security smoke 會建立正式 Demo 測試資料，不要在一般檢查中自動執行。

設定 `GATEWAY_NON_MUTATING_SMOKE=1` 時只驗證 Origin、Demo 幣別與欄位上限，不建立玩家、錢包或 session；仍會經過既有 rate limit 計數。

## 維運限制

### Repo 無法單獨重建完整 DB

目前 repo 不保留 baseline migration，既有 migrations 會假設遠端已存在 `games`、`admin_users` 等核心物件。`supabase/config.toml` 也保留預設 `./seed.sql` 路徑，但 repo 沒有該檔案。

這是目前已知限制，不要自行建立大型 baseline migration。正式營運前應另行確認備份、還原與災難復原流程。

## 次要改善

- Error Modal 尚未做完整 focus trap 與關閉後焦點還原。
- Admin 新增與編輯頁的欄位及 game type options 有重複維護。
- 前台與錯誤介面的中英文尚未完全統一。

## 模組化方向

目前不要繼續拆小 Lobby 或 Admin，也不要改成 React / Vue / Next.js。

未來有實際需求時再做：

- Gateway 新增更多 endpoints 時，再拆分 route、驗證、RPC client、CORS / rate limit。
- 集中管理 game type，避免 Lobby 與 Admin 選項不同步。
- 第一款遊戲正式接 Looty wallet 時，再建立最小 Game Gateway client 或 API contract。
- 優先補測試與逾時處理，不要為了模組化增加不必要抽象。

## 已處理

### 開發依賴漏洞

2026-07-23 已更新 `@supabase/supabase-js`、Vite、ws 與 esbuild；2026-07-31 再更新 PostCSS 與相關安全修正。

`npm audit` 已是 0 vulnerabilities，build 與 smoke 已通過。專案維持 Vite 7，沒有為了追最新版升級到 Vite 8。

### Demo wallet 幣別

Gateway v5 已限制 Demo wallet 只接受 `POINT`。

使用者決定暫緩 DB 層的幣別 constraint / trigger，正式營運前再處理。未套用的 migration 已從 active migrations 移除，避免未來執行其他 `db push` 時被順便套用。暫緩期間保留新 Demo POINT 錢包 10,000 POINT 的測試餘額。

### Gateway 錯誤與 body limit

Gateway 現在以串流限制 request body 16 KiB，Supabase 上游失敗回統一 `503`，非預期 DB 訊息不再直接回傳。

本機 `test:gateway` 會模擬 Auth / RPC 已回標頭但 response body 讀取失敗，確認兩者都回 `503`；不連遠端、不建立資料。`create-session` 的 `display_name` 最長 120 字。

### Lobby 與 Admin 小問題

- Lobby 封面載入失敗會移除破圖並切回 placeholder。
- Admin 新增／編輯模式改以頁面路徑決定；編輯網址缺少 `id` 時不再誤新增資料。

## 不列為問題

- 新 Demo 錢包的 10,000 POINT 是正式營運前刻意灌入的測試餘額。
- 這筆測試餘額目前不要求符合正式 ledger / settlement 規格。
- 正式營運前再依使用者決定關閉方式與測試資料清理方式。
