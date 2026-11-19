// Jarvis 發布引擎 · lib/cdp.js（v0 骨架，簽名齊全，未實作）
//
// hub 在 direct 模式下（src/driver.mjs）靠呢度三個函數操作專用 Chrome：
//   evaluate(tabId, expr)          在頁面執行 JS 並回傳值
//   click(tabId, expr)             對 expr 選到的元素做真滑鼠點擊
//   send(tabId, method, params)    直發 CDP 指令（hub 用嚟截圖 Page.captureScreenshot）
//
// 實作方向（適配器階段先做）：經 hub 的 src/chrome-shim.mjs 提供的 CDP 通道
// （專用 Chrome 的 remote debugging port）轉發，唔好另起一套連線。
// 骨架階段一律擲出清楚錯誤，等呼叫方如實失敗，唔好靜默扮成功。

const notImplemented = (name) => {
  throw new Error(`Jarvis 發布引擎 v0 骨架：cdp.${name} 未實作——適配器階段先接 chrome-shim 的 CDP 通道`);
};

export async function evaluate(tabId, expr, timeout) { notImplemented('evaluate'); }

export async function click(tabId, expr) { notImplemented('click'); }

export async function send(tabId, method, params) { notImplemented('send'); }
