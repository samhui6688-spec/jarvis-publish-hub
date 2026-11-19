# 引擎 v0 骨架驗證紀錄（2026-11-19）

## 環境

- 本地 VM，Node v24.22.1
- hub 底本：`/tmp/maitian-inspect` 複製到 `engine-build/hub/`（同 Founder fork `samhui6688-spec/jarvis-publish-hub` 同一 HEAD `575e299`，複製時剔除 `.git`）
- 引擎位置：`engine-build/engine/`，hub 用 `plugin=local` + `pluginDir` 指過去（設定見 `verify-config.json`，經環境變數 `MAITIAN_CONFIG` 傳入，冇改 hub 本身任何檔案）
- 紅線遵守：冇用、冇攞、冇抄 Chrome 商店「麥田發布助手」的任何代碼；平台規格全部由 hub 倉內文件推導（`skills/maitian-publish/SKILL.md`、`src/make-publish.mjs`、`src/db.mjs`、`src/hub.mjs`）

## 驗證 1：hub 認到我哋件引擎（pluginInfo）

命令：

```bash
cd engine-build/hub
MAITIAN_CONFIG=$HOME/workspace/maitian-office/engine-build/verify-config.json \
  node -e "import('./src/plugin.mjs').then(m => { console.log(JSON.stringify(m.pluginInfo())); console.log('pluginDir():', m.pluginDir()); })"
```

輸出：

```
{"source":"local","dir":"/home/hatch/workspace/maitian-office/engine-build/engine","version":"0.0.1"}
pluginDir(): /home/hatch/workspace/maitian-office/engine-build/engine
```

結論：hub 的 `src/plugin.mjs` 成功以 `source: "local"` 認到我哋件引擎（版本讀自引擎 `manifest.json` 的 0.0.1），即係「可用」判定（目錄有 `lib/publish.js`）通過。

## 驗證 2：hub 的 validate 流程用我哋 bundle.js 跑得通（合格示範工程）

`demo-project/` 係一個齊 10 個平台欄位的示範工程（publish.json + ffmpeg 生成的 faststart 成片 + 三張封面）。

命令：

```bash
cd engine-build/hub
MAITIAN_CONFIG=$HOME/workspace/maitian-office/engine-build/verify-config.json \
  node src/validate.mjs $HOME/workspace/maitian-office/engine-build/demo-project
```

輸出（exit=0）：

```
工程：引擎骨架示範 · 第一期（demo-project）
  B站：title 20/80，desc 36/2000，tags 3/10；封面 封面/cover-4x3.png
  視頻號：shortTitle 8/16，body 22/1000，topics 2/10；封面 封面/cover-4x3.png
  抖音：title 8/30，body 34/1000，topics 3/5；封面 封面/cover-4x3.png
  Facebook：text 39/5000；封面 无
  Instagram：caption 43/2200；封面 封面/cover-16x9.jpg
  Threads：text 31/500；封面 无
  TikTok：caption 57/2200，topics 3/30；封面 封面/cover-3x4.png
  X：text 54/280；封面 无
  小紅書：title 12/20，body 57/1000，topics 3/10；封面 封面/cover-3x4.png
  YouTube：title 23/100，desc 42/5000，tags 3/15；封面 封面/cover-16x9.jpg
✅ 校验通过
```

（報告版式同「校验通过」字樣係 hub `validate.mjs` 本身的字串；平台名同每欄上限數字來自我哋 `PLATFORMS`。）

結論：hub 成功載入我哋 `lib/bundle.js` 的 `validate／PLATFORMS／len`，10 個平台逐欄出到字數報告而且全數通過；成片 faststart 檢查（hub 自己做嗰部分）亦冇報錯。

## 驗證 3：驗證唔係齋放行——故意出錯版要捉到錯

`demo-project-bad/` 同合格版同一套檔案，只改 4 處：小紅書標題 26 字（上限 20）、YouTube 簡介含 `< >`、視頻號內文放連結、B站第一個標籤唔係 requiredTags。

命令：同上，目錄換 `demo-project-bad`。輸出（exit=1）：

```
（逐欄報告同合格版相若，略）
❌ B站：第一個標籤係「其他標籤」，唔係 requiredTags 要求的「Jarvis測試號」
❌ 視頻號：唔可以放連結（SKILL.md：國內三家不引流）
❌ 小紅書：「title」26 字，超過上限 20
❌ YouTube：簡介唔可以有 < >（SKILL.md）
校验未通过：4 个问题
```

結論：4 個預設錯誤全部捉中，證明 validate 係真做檢查，唔係空殼。

## 驗證 4：publish.js 骨架行為（誠實回報，唔扮做到）

命令：

```bash
node -e "import('.../engine/lib/publish.js').then(async m => { ... await m.run({id:'demo-project'}, { platforms:['youtube','tiktok'], onChange }) })"
```

輸出重點：

```
ADAPTERS: {}
onChange: {"id":"youtube","status":"異常","logs":[{"kind":"err","msg":"Jarvis 發布引擎 v0 骨架：youtube 適配器未完成，今次冇做任何填寫"}],"tabId":null}
onChange: {"id":"tiktok","status":"異常","logs":[{ ... 同上，換 tiktok ... }],"tabId":null}
```

另 `lib/cdp.js` 三個函數（evaluate／click／send）已實測：一呼叫即擲
`Jarvis 發布引擎 v0 骨架：cdp.<name> 未實作——適配器階段先接 chrome-shim 的 CDP 通道`，唔會靜默扮成功。

## 規格邊啲係實證、邊啲係暫定

實證（倉內文件寫明）：平台 id 全套；各平台欄位形狀（make-publish.mjs）；小紅書標題 ≤20、抖音標題 ≤30、抖音話題 ≤5、視頻號短標題 6–16、YouTube 標題 ≤100、YouTube 簡介禁 `< >`、X 280（中文加權）、Instagram 配文 ≤2200＋標籤 ≤30；國內三家禁連結／微信號／引導句／海外廠商名；requiredTags 第一標籤檢查。

暫定（倉內推導唔到，已喺 bundle.js 註解逐個標明）：B站標題 80／簡介 2000／標籤 10 個；小紅書正文 1000／話題 10 個；抖音正文 1000；視頻號正文 1000／話題 10 個；YouTube 簡介 5000／標籤 15 個；TikTok、Facebook、Threads 全部數值（新平台，hub 原本冇）。

## 下一步：YouTube 適配器——先決條件

1. **Founder 本人線（登入）**：專用 Chrome 要先登入一個 YouTube 頻道帳號。登入／密碼／驗證碼係 Founder 本人親手做嗰條線，我哋唔代登入；hub 本身有 `hub login` 流程開專用 Chrome 俾佢登入。未登入，適配器寫好都試唔到真發。
2. **cdp.js 先要實作**：適配器靠 evaluate／click 操作 YouTube Studio 頁面，而 hub 在 direct 模式係經我哋 `lib/cdp.js` 落去的。要做的是將 cdp.js 接去 hub `src/chrome-shim.mjs` 已有的 CDP 通道（專用 Chrome remote debugging port，預設 9333），唔另起一套。
3. **真頁面採樣**：YouTube Studio 上載頁的 DOM 會不時改版，適配器唔靠估——要喺裝咗引擎嗰部機（荔枝角部機）開一次真上載頁，採樣實際 DOM 結構先落手寫選擇器。呢步要等第 1 點登入完成先做到。
4. **試發策略**：第一次真發用「私人／不公開」可見度試一條短片，確認「上載→填標題簡介→揀封面→設定→提交→回讀連結」成條鏈通晒，先計 YouTube 適配器完成；唔好第一次就公開發。
5. **測試素材**：`demo-project` 的成片同 publish.json 可以直接改嚟用，但要換返真片同真文案，先好上真帳號。
