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
- 2026-07-23 `npm audit`、`npm run build` 與 `npm run smoke` 已通過；遠端 Supabase DB lint 先前已通過。
- 2026-07-23 已確認 Looty linked true，本機與遠端 16 筆 migrations 全部同步。
- 以下問題目前不阻擋公開遊戲啟動主路徑。

## 優先處理

### Gateway 防濫用

狀態：待處理。

`supabase/functions/looty-gateway/index.ts` 目前允許沒有 `Origin` 的請求。瀏覽器 CORS 白名單有效，但外部腳本仍可直接呼叫 `create-session`，持續建立 Guest、wallet 與 session。

現有 IP rate limit 能降低速度，但不能完全阻止自動化濫用。

### Loader 與 Gateway 逾時

狀態：待處理。

- Game Loader 只等待 iframe `load`，遊戲無回應時 Loading 可能一直顯示。
- Gateway 呼叫 Supabase Auth / REST RPC 時沒有明確逾時。

未來處理時應分開設定遊戲載入逾時與後端請求逾時，不要共用一個不合理的時間。

### iframe 信任邊界

狀態：接入不完全可信任遊戲前處理。

Game Loader 建立的 iframe 目前沒有 `sandbox` 或能力限制。現有遊戲多為不同網域，風險較低；但 Looty 也允許 `/` 開頭的同網域 `launch_url`，同網域遊戲可能接觸 Looty origin 的頁面與 storage。

不要直接套用過度嚴格的 sandbox。應先確認遊戲需要的音訊、全螢幕、輸入、下載或其他能力，再建立平台規則。

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
- Loader 缺少 slug 時顯示錯誤。
- Admin Login 可載入。
- 共用 Error Modal 可顯示。

目前未完整自動驗證：

- Loader 成功建立 session 並載入遊戲。
- Admin 新增、編輯、刪除與排序。
- URL helper 與 Admin 表單驗證。
- Gateway 純函式與錯誤轉換。

Production Gateway security smoke 會建立正式 Demo 測試資料，不要在一般檢查中自動執行。

## 維運限制

### Repo 無法單獨重建完整 DB

目前 repo 不保留 baseline migration，既有 migrations 會假設遠端已存在 `games`、`admin_users` 等核心物件。`supabase/config.toml` 也保留預設 `./seed.sql` 路徑，但 repo 沒有該檔案。

這是目前已知限制，不要自行建立大型 baseline migration。正式營運前應另行確認備份、還原與災難復原流程。

## 次要改善

- Gateway 非預期 RPC 錯誤目前可能把原始 DB message 回傳給呼叫者。
- Gateway 會先完整讀取 request body，再檢查 16 KiB 上限。
- Lobby 無效縮圖目前可能顯示破圖，沒有自動切回 placeholder。
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

2026-07-23 已更新 `@supabase/supabase-js`、Vite、ws 與 esbuild。

`npm audit` 已是 0 vulnerabilities，build 與 smoke 已通過。專案維持 Vite 7，沒有為了追最新版升級到 Vite 8。

## 不列為問題

- 新 Demo 錢包的 10,000 POINT 是正式營運前刻意灌入的測試餘額。
- 這筆測試餘額目前不要求符合正式 ledger / settlement 規格。
- 正式營運前再依使用者決定關閉方式與測試資料清理方式。
