# CrazyGames Game Integration Guide

這份文件給製作遊戲、準備 CrazyGames Build 或處理 CrazyGames 上架的 AI / Codex 讀。

Looty 串接契約看 `GAME_PLATFORM_INTEGRATION.md`。兩個平台共用同一套遊戲本體時，仍要把平台功能隔離，不要讓 CrazyGames Build 呼叫 Looty Gateway。

這份 repo 文件是 CrazyGames 串接規範的唯一內部真相來源，不再維護平行的雲端版本。規範依 CrazyGames 官方文件整理，正式提交前仍要重新確認官方最新版本。

版本：1.0。
最後核對：2026-07-28。

## 適用範圍

這份規範只適用於非博弈遊戲。

博弈相關產品不接 CrazyGames，包括以投注、下注、派彩、可兌價值錢包、賭場或類賭博機制為主要內容的產品。這類遊戲不建立 CrazyGames Client、CrazyGames Build、廣告串接或上架素材。

是否屬於博弈產品要看實際玩法與交易機制，不能只用 Looty 的 `games.type` 判斷。例如一般牌類、街機或捕魚玩法不一定屬於博弈；一旦包含投注、派彩或類賭博核心循環，就不適用 CrazyGames。

## 一句話

CrazyGames Build 只使用 CrazyGames SDK 與允許的 CrazyGames 功能，不讀 Looty launch code、不呼叫 Looty Gateway，也不載入 Looty 錢包。

## 給遊戲 AI 的最短規則

- 遊戲本體、關卡、物理、UI、美術與音效維持共用。
- 先確認遊戲不是博弈相關產品；博弈產品不要建立 CrazyGames Build。
- CrazyGames 使用獨立 Build 或明確的平台發布設定。
- 不用「是否在 iframe」判斷平台，因為 Looty 與 CrazyGames 都可能使用 iframe。
- CrazyGames SDK v3 必須先初始化完成，才可呼叫 SDK。
- SDK environment 只能在 `local` 或 `crazygames` 時使用；`disabled` 時不得呼叫。
- Basic Launch 沒有廣告，遊戲仍必須完整可玩。
- Full Launch 正確送出 Gameplay start / stop。
- Midgame 與 Rewarded 廣告分開處理。
- Rewarded 只有完整播放成功後才給獎勵。
- 廣告開始時暫停遊戲、禁止操作並靜音；結束或失敗後恢復。
- 使用 Data 模組時，CrazyGames Build 不再另外使用自己的 `localStorage` 存檔。
- 平台 `muteAudio` 優先於玩家自己的音效設定。
- CrazyGames Build 不可呼叫 Looty Gateway、錢包、下注、派彩或退款。

## 與 Looty 共用遊戲的架構

```text
Shared Game
  -> Platform Client
    -> Looty Client
    -> CrazyGames Client
    -> Local Client
```

CrazyGames Client 負責：

- CrazyGames SDK 初始化與 environment 驗證。
- Gameplay start / stop。
- Data 存檔。
- Midgame / Rewarded / Banner 廣告。
- 平台靜音與聊天設定。
- 適用時的 User、多人房間、邀請與內購。

CrazyGames Client 不負責：

- Looty session。
- Looty launch code / gateway token。
- Looty Gateway。
- Looty 玩家帳號。
- Looty 錢包、下注、派彩、退款或 Round 結算。

平台 Client 必須先完成 `init()`，遊戲才可執行平台存檔、廣告或其他平台操作。平台功能用 capabilities 表示；不支援的功能要安全停用，不可偷偷改用另一個平台的實作。

Local Client 只供本機開發測試，不是第三個正式發布平台。CrazyGames Build 初始化失敗時要停用平台功能並顯示錯誤，不可自動降級成 Local Client。

## 發布方式

建議：

- 同一個 Git 專案。
- 同一套遊戲本體與素材。
- 同一個遊戲版本號。
- Looty 與 CrazyGames 各自有發布入口或平台設定。
- CrazyGames 上傳自己的 Build。
- Looty 繼續載入自己的獨立網址。

不建議讓兩個平台硬共用同一個正式 URL。兩邊可以使用完全相同的遊戲程式版本，但平台 SDK、設定與發布產物應分開。

平台應由發布設定選定，runtime 偵測只做第二層驗證。不要只靠 query string、hostname 或 iframe 狀態猜測平台。

## 上架流程

### Basic Launch

- 先通過基本 QA，以有限玩家測試。
- CrazyGames SDK 為選用。
- 若已接 SDK，玩家真正進入可玩狀態時要送出 Gameplay start。
- 廣告與內購停用，不會產生廣告分潤。
- 沒有廣告時，所有遊戲流程仍要正常。
- 平台主要觀察平均遊玩時間、進入遊戲比例與留存。

官方指南中的平均遊玩時間、次日留存與轉換率只能當參考方向，不是保證通過的固定門檻。

### Full Launch

- 通過 Basic Launch 並獲平台選中後進入。
- 必須完成 CrazyGames SDK 與完整 QA。
- 必須正確送出 Gameplay start / stop。
- 有持續進度時，要使用 CrazyGames 允許的存檔方式。
- 有帳號或玩家身分時，要接 User 模組。
- 廣告與分潤才會啟用。
- 遊戲內購買只適用於受邀遊戲。

## 技術與檔案限制

- 遊戲總容量最多 250 MB。
- 檔案總數最多 1,500 個。
- 初始下載量最多 50 MB。
- 要進入手機首頁，初始下載量目標需在 20 MB 以內。
- 未接 SDK 時，平台可能以整包遊戲容量判斷初始下載量。
- 外部載入素材時，原則上需在 20 秒內進入可玩狀態。
- 遊戲包內資源使用相對路徑。
- Chrome 與 Edge 必須正常運作。
- Safari 無法正常運作時，平台可能停用 Safari 版本。
- Chromebook / Chromium OS 需能在約 4 GB RAM 裝置順暢運作。
- 不可有嚴重錯誤、當機、卡死或無法繼續的流程。
- 若使用 sitelock，要允許 CrazyGames 需要的網域。

## 畫面、裝置與操作

- 桌面版需能在橫式畫面正常遊玩。
- 直式遊戲可以上架，桌面版可在左右顯示黑邊或背景。
- 支援手機時必須支援觸控。
- 電腦版需支援合適的滑鼠或鍵盤操作。
- 文字、圖片與按鈕需在手機、16:9 iframe 與 DPR 1 下清楚可讀。
- 手機方向由 CrazyGames 提交設定控制，不自行強制旋轉。
- 手機全螢幕需處理安全區，避免 UI 被瀏海、圓角或系統區域遮住。
- 避免長按、雙擊造成文字選取、放大鏡或系統選單。
- iOS 音訊被中斷後，要能在玩家再次操作時恢復。
- CrazyGames 會提供全螢幕功能，遊戲內不要自行放全螢幕按鈕。

## 遊戲內容與品質

- 遊戲名稱、素材與內容需具原創性。
- 內容需符合 PEGI 12，平台主要面向 13 歲以上玩家。
- 文字與圖片清楚，不可模糊、破圖或明顯像素化。
- 不宣傳其他遊戲平台，也不放外部廣告。
- 不直接放 App Store 或 Google Play 連結。
- 隱私權政策與服務條款可以保留。
- 社群、Discord 或開發者網站連結只能放在選單，不可成為主要按鈕。
- Steam / Epic 等商店連結只適用於電腦遊戲，且只能放主選單或 Demo 結束位置。
- Full Launch 的新玩家應直接進入實際遊玩；若遊戲特性不允許，最多一次點擊後開始。
- 新手教學盡量放進實際遊戲並允許跳過。
- 避免大段說明，優先使用圖像與操作提示。
- 操作反應、畫風、解析度、音效與音量要一致。
- 按鈕不可故意延遲、誤導或誘導玩家點廣告。

## SDK 初始化與事件

HTML5 使用 CrazyGames SDK v3 時：

```js
await window.CrazyGames.SDK.init()
```

初始化完成前不可呼叫 SDK。完成後再檢查：

```js
window.CrazyGames.SDK.environment
```

只有 `local` 與 `crazygames` 可使用 SDK；`disabled` 時停用 CrazyGames 平台功能。

Gameplay 事件原則：

- Gameplay start：玩家真正進入可操作、可遊玩的狀態時送出，不包含主選單與額外載入。
- Gameplay stop：暫停、關卡結束、進入選單或離開實際遊玩狀態時送出。
- 玩家恢復遊玩、復活或進入下一關時，再送 Gameplay start。
- 不因切換瀏覽器焦點自行送 stop，平台會處理頁面焦點。
- Load start / stop 為選用，用於回報額外載入階段。

平台設定：

- `muteAudio = true` 時必須靜音。
- 平台靜音優先於遊戲內音效開關。
- 要監聽 settings change，不能只在初始化時讀一次。
- `disableChat = true` 時，有聊天功能的遊戲必須停用聊天。

## 廣告

只能使用 CrazyGames SDK 廣告。不可串接自己的廣告商、Looty 廣告或其他平台廣告。

### Basic Launch

- 所有廣告會被平台停用。
- 遊戲沒有廣告時仍要完整可玩。
- 不留下按下後沒有反應的獎勵廣告按鈕。
- 不因廣告停用而卡在關卡切換、復活或結算。

### Midgame

- 只放在死亡、關卡完成或階段切換等自然中斷點。
- 不突然打斷玩家操作。
- 不在玩家尚未體驗合理內容前播放。
- 不因點擊首頁、設定、商店或一般導覽按鈕而強制播放。
- 廣告請求與播放期間暫停遊戲並禁止操作。
- 廣告真正開始播放後靜音。
- 沒有廣告或發生錯誤時正常恢復遊戲。

### Rewarded

- 必須由玩家主動選擇。
- 事前清楚說明觀看後的獎勵。
- 不觀看的選項直接可見，不隱藏或延遲。
- 建議提供不看廣告的替代方式。
- 只有完整播放並收到成功結果後才給獎勵。
- 失敗、取消、AdBlock 或沒有廣告時不給獎勵，但遊戲仍可繼續。
- 不要求連續觀看多支廣告才得到一份獎勵。
- 不讓遊戲只能依賴獎勵廣告繼續。
- 同一個轉換點不重複播放 Midgame 並同時要求 Rewarded。

### Banner

- 只放在有實際內容、平均停留至少約 5 秒的頁面。
- 不放在正式遊玩畫面。
- 不遮擋 UI，手機與電腦都要檢查。
- 與遊戲內容清楚區分。
- 同一畫面最多 2 個 Banner。

### AdBlock

- 使用 AdBlock 的玩家仍可進行基本遊玩。
- 不完全封鎖或刻意降低基本能力。
- 可以停用部分廣告型特殊功能，但要清楚說明。
- 不留下無作用的廣告按鈕。

## 存檔、帳號與玩家資料

CrazyGames Build 的存檔由 CrazyGames Client 決定：

- 使用 Data 模組時，完全使用 Data 模組，不再另寫遊戲自己的 `localStorage`。
- Data 模組對 Guest 會使用平台管理的本機資料，登入後由平台處理同步。
- Data 模組上限 1 MB。
- 寫入前先載入既有資料，避免覆蓋玩家進度。
- 提交時要正確開啟 Progress Save / Data Module 選項。
- 如果使用自有後端，要搭配 CrazyGames User 模組。
- Automatic Progress Save 只在符合平台條件時使用；有遊戲內購買時不得使用。

帳號原則：

- Guest 可以直接遊玩，不強迫登入。
- Basic Launch 不提供 Facebook、Google、Email 等外部登入。
- Full Launch 中，已登入 CrazyGames 的玩家應自動登入或建立對應帳號。
- 使用 CrazyGames `userId` 作穩定識別，不用可能變更的 username 當唯一識別。
- 玩家切換 CrazyGames 帳號時，要正確切換進度。
- 登入按鈕不阻擋遊戲，也不自動彈出登入視窗。

若遊戲額外收集 SDK 基本事件以外的個人資料，要提供隱私權政策及／或服務條款。

## 多人、聊天與內購

多人遊戲適用時：

- 向 SDK 回報房間、是否可加入及房間狀態。
- 有好友邀請時接 Invite Link / Instant Multiplayer。
- 回合結束後，原玩家群組應能繼續一起玩。
- 使用 CrazyGames 玩家名稱與頭像。
- 遵守 `disableChat`。
- 聊天與玩家產生內容要有過濾或審核。

遊戲內購買只適用於受邀遊戲：

- Basic Launch 不可使用。
- Full Launch 且受邀後，使用 CrazyGames 指定的 Xsolla 流程。
- 只有已登入玩家可購買，Guest 不可購買。
- 訂單綁定 CrazyGames 使用者。
- 正式提交前關閉 Sandbox / 測試訂單。
- CrazyGames App 不支援的付款流程要隱藏或停用。

## 封面、影片與提交資料

封面圖片：

- 橫式：1920 × 1080，16:9。
- 直式：800 × 1200，2:3。
- 正方形：800 × 800，1:1。
- 三張封面維持一致視覺風格。
- 不模糊、不使用未授權或誤導性素材。
- 不加入 Play Now、New、Updated、App 或社群圖示。

預覽影片：

- 長度 15–20 秒，超過可能被裁切。
- 檔案最多 50 MB。
- 提供 16:9 橫式與 2:3 直式。
- 不可有聲音。
- 不可有黑畫面、Logo 轉場、上下黑邊或預設滑鼠游標。
- 不加入 Play Now、App 或社群圖示。
- 不自行加速影片。

提交資料：

- 可執行的 Web 遊戲 Build。
- 英文遊戲名稱、說明與操作方式。
- 平台 Metadata。
- 三張封面。
- 橫式與直式預覽影片。

## 上架前檢查表

- [ ] 已確認遊戲不是博弈相關產品。
- [ ] CrazyGames 使用獨立 Build 或明確發布設定。
- [ ] CrazyGames Build 不含 Looty Gateway 呼叫。
- [ ] 總容量不超過 250 MB，檔案數不超過 1,500。
- [ ] 初始下載不超過 50 MB；手機首頁目標不超過 20 MB。
- [ ] Chrome、Edge、手機與 4 GB Chromebook 測試通過。
- [ ] 直式 / 橫式、觸控、滑鼠與安全區正常。
- [ ] 沒有自製全螢幕按鈕、外部廣告與禁止連結。
- [ ] 英文文字、教學與操作說明完成。
- [ ] SDK 初始化完成前不呼叫平台功能。
- [ ] Gameplay start / stop 位置正確。
- [ ] Basic Launch 無廣告時所有流程仍正常。
- [ ] Midgame / Rewarded / Banner 位置符合規則。
- [ ] 廣告期間暫停、禁操作、靜音，失敗時正常恢復。
- [ ] Rewarded 只在完整播放成功後發獎。
- [ ] 存檔與帳號方案符合 CrazyGames 規則。
- [ ] 平台靜音與 settings change 已處理。
- [ ] PEGI 12、原創性、外部連結與隱私權檢查完成。
- [ ] 三張封面及兩支預覽影片完成。
- [ ] CrazyGames Preview / QA 工具測試完成。

## 官方來源

- [Requirements Introduction](https://docs.crazygames.com/requirements/intro/)
- [Technical Requirements](https://docs.crazygames.com/requirements/technical/)
- [Gameplay Requirements](https://docs.crazygames.com/requirements/gameplay/)
- [Advertisement Requirements](https://docs.crazygames.com/requirements/ads/)
- [Account Integration](https://docs.crazygames.com/requirements/account-integration/)
- [Multiplayer Requirements](https://docs.crazygames.com/requirements/multiplayer/)
- [Game Covers](https://docs.crazygames.com/requirements/game-covers/)
- [Quality Guidelines](https://docs.crazygames.com/requirements/quality/)
- [SDK Introduction](https://docs.crazygames.com/sdk/intro/)
- [Game Module](https://docs.crazygames.com/sdk/game/)
- [Video Ads](https://docs.crazygames.com/sdk/video-ads/)
- [Data Module](https://docs.crazygames.com/sdk/data/)
- [In-game Purchases](https://docs.crazygames.com/sdk/in-game-purchases/)
