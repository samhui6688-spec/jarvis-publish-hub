# Jarvis 發布引擎（自家擁有）

`jarvis-publish-hub` 的發布引擎，完全自己寫，唔用 Chrome 商店「麥田發布助手」的任何代碼。
hub 用 `config.plugin = "local"` + `config.pluginDir = <呢個目錄>` 就會改用呢件引擎。

## 結構

| 檔案 | 做咩 | 狀態 |
|---|---|---|
| `lib/bundle.js` | 平台欄位規格 `PLATFORMS`、`validate(bundle, files)`、`len(str)` | v0 已實作（規格來源：hub 倉內 SKILL.md／make-publish.mjs；標「暫定」的上限待真帳戶驗證） |
| `lib/publish.js` | `ADAPTERS` + `run()` + `preflight()` + `collectLinks()` | v0 誠實骨架：未有適配器，run 只回報「適配器未完成」 |
| `lib/cdp.js` | `evaluate`／`click`／`send` | v0 骨架：簽名齊全，呼叫即擲清楚錯誤 |

## 平台

已有規格：bilibili、xhs（小紅書）、douyin、channels（視頻號）、youtube、x、instagram
新增規格（適配未做）：tiktok、facebook、threads

## 下一步

YouTube 適配器先行，詳見上層 `../VERIFY.md` 尾段的先決條件清單。
