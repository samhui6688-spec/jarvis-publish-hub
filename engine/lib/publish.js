// Jarvis 發布引擎 · lib/publish.js（v0 誠實骨架）
//
// 現況：ADAPTERS 係空物件，即係冇任何平台適配器。
// hub（src/driver.mjs）會用 ADAPTERS 判斷邊啲平台有適配：冇適配的平台會被跳過並標「異常」。
// 呢個係刻意的誠實狀態——骨架階段唔扮做到填寫，run() 只會逐個平台回報「適配器未完成」，
// 唔會開任何頁面、唔會掂任何帳號。
//
// 之後逐個平台加適配器（次序：YouTube → TikTok → Facebook → 其餘），
// 每加一個就喺 ADAPTERS 加返個 id，並用真帳戶試發一條先算完成。

export const ADAPTERS = {};

// hub 呼叫方式（src/driver.mjs runBatch）：
//   pub.run(project, { rootPath, platforms, onChange, shouldStop })
//   project 係成個 publish.json 物件；回傳值係 { 平台id: state }，
//   state = { id, status, logs: [{ kind, msg }], tabId }，狀態變化經 onChange 回報。
export async function run(project, { rootPath, platforms = [], onChange, shouldStop } = {}) {
  const states = {};
  for (const id of platforms) {
    const st = {
      id,
      status: '異常',
      logs: [{ kind: 'err', msg: `Jarvis 發布引擎 v0 骨架：${id} 適配器未完成，今次冇做任何填寫` }],
      tabId: null,
    };
    states[id] = st;
    if (onChange) onChange(st);
    if (shouldStop && shouldStop()) break;
  }
  return states;
}

// hub 查登入用（src/driver.mjs checkLogin）：pub.preflight(ids, { keepTabs })
// 回 { 平台id: { ok, reason } }。骨架階段一律回報未完成，唔扮已登入。
export async function preflight(ids = [], { keepTabs = false } = {}) {
  const r = {};
  for (const id of ids) r[id] = { ok: false, reason: 'Jarvis 發布引擎 v0 骨架：適配器未完成，未能檢查登入' };
  return r;
}

// hub 取已發布連結用（src/driver.mjs links）：pub.collectLinks(project, ids, {})
// 骨架階段未實作，擲出清楚錯誤，等 hub 上層如實報失敗，唔好靜默回假連結。
export async function collectLinks(project, ids = [], opts = {}) {
  throw new Error('Jarvis 發布引擎 v0 骨架：collectLinks 未實作（適配器未完成，未能取連結）');
}
