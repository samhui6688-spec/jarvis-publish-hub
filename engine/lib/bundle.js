// Jarvis 發布引擎 · lib/bundle.js
// 平台欄位規格（PLATFORMS）＋ publish.json 驗證（validate）＋ 字數計算（len）
//
// 規格來源（全部來自 jarvis-publish-hub 倉內文件，冇用商店插件任何代碼）：
//   - 平台 id：src/db.mjs 的 NAMES、src/hub.mjs 的 ALL（bilibili/xhs/douyin/channels/youtube/x/instagram）
//   - 欄位形狀：src/make-publish.mjs 生成 publish.json 的寫法
//   - 字數上限與內容規則：skills/maitian-publish/SKILL.md
//   - 標明「暫定」的上限數值 = 倉內文件推導唔到，係暫定值，待真帳戶驗證後修正，唔好當真規格用。
//
// fields 格式：{ 欄位名: [最少, 最多] }
//   hub 的 src/validate.mjs 只讀 [1]（上限）嚟出每平台字數報告；[0] 是下限，本引擎 validate 用
//   （目前只有視頻號短標題有真下限：6–16 字，來源 SKILL.md）。
//   字串欄位的數字是字數；陣列欄位（tags/topics）的數字是元素個數。

export const PLATFORMS = {
  bilibili: {
    name: 'B站',
    fields: {
      title: [1, 80],   // 上限暫定，待真帳戶驗證（SKILL.md 冇寫 B站標題上限）
      desc: [0, 2000],  // 上限暫定，待真帳戶驗證
      tags: [0, 10],    // 個數上限暫定，待真帳戶驗證
    },
  },
  xhs: {
    name: '小紅書',
    fields: {
      title: [1, 20],   // SKILL.md：標題 ≤20 字
      body: [0, 1000],  // 上限暫定，待真帳戶驗證
      topics: [0, 10],  // 個數上限暫定，待真帳戶驗證
    },
  },
  douyin: {
    name: '抖音',
    fields: {
      title: [1, 30],   // SKILL.md：標題 ≤30 字
      body: [0, 1000],  // 上限暫定，待真帳戶驗證
      topics: [0, 5],   // SKILL.md：話題最多 5 個
    },
  },
  channels: {
    name: '視頻號',
    fields: {
      shortTitle: [6, 16], // SKILL.md：短標題 6–16 字
      body: [0, 1000],     // 上限暫定，待真帳戶驗證
      topics: [0, 10],     // 個數上限暫定，待真帳戶驗證
    },
  },
  youtube: {
    name: 'YouTube',
    fields: {
      title: [1, 100],  // SKILL.md：標題 ≤100 字
      desc: [0, 5000],  // 上限暫定，待真帳戶驗證；另有「簡介不能有 < >」規則（SKILL.md）
      tags: [0, 15],    // 個數上限暫定，待真帳戶驗證
    },
  },
  x: {
    name: 'X',
    fields: {
      text: [1, 280],   // SKILL.md：280，中文按 2 字符計（加權檢查在 validate 另外做）
    },
  },
  instagram: {
    name: 'Instagram',
    fields: {
      caption: [0, 2200], // SKILL.md：配文 ≤2200 字；話題標籤 ≤30 個（在 validate 另外數）
    },
  },
  // ---- 以下係我哋新增的平台，hub 原本冇；全部數值暫定，待真帳戶驗證 ----
  tiktok: {
    name: 'TikTok',
    fields: {
      caption: [0, 2200], // 暫定，待真帳戶驗證
      topics: [0, 30],    // 暫定，待真帳戶驗證
    },
  },
  facebook: {
    name: 'Facebook',
    fields: {
      text: [0, 5000],    // 暫定，待真帳戶驗證
    },
  },
  threads: {
    name: 'Threads',
    fields: {
      text: [0, 500],     // 暫定，待真帳戶驗證
    },
  },
};

// 字數計算：字串按 Unicode code point 計（一個 emoji 算 1）；陣列按元素個數計；null/undefined 算 0。
// hub 的 validate.mjs 用同一個 len 對所有平台出報告，所以呢度唔做平台加權；
// X 的「中文按 2 字符計」係加權規則，validate 會對 x.text 另外檢查並出警告。
export function len(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.length;
  return [...String(v)].length;
}

// X 加權字數：CJK／全形字元按 2 計，其餘按 1 計（SKILL.md：中文按 2 字符計，超過 280 需要 Premium）
function weightedLen(s) {
  let n = 0;
  for (const ch of String(s || '')) n += /[\u1100-\u11FF\u2E80-\u9FFF\uA000-\uA4FF\uAC00-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1;
  return n;
}

const hashtags = (s) => (String(s || '').match(/#[^\s#]+/g) || []).map(t => t.slice(1));

// 國內三家（小紅書／抖音／視頻號）內容攔截，規則來自 SKILL.md「校验会拦」一段：
// 不放連結、不放微信號、不寫引導去主頁／評論區／私訊的句子、不寫海外模型和廠商名。
const CN_GUARDED = ['xhs', 'douyin', 'channels'];
const GUIDE_PHRASES = ['去主頁', '去主页', '主頁領', '主页领', '評論區領', '评论区领', '私訊我', '私信我', '點主頁', '点主页', '主頁有', '主页有'];
const VENDOR_NAMES = ['claude', 'chatgpt', 'gemini', 'openai'];

// 有封面概念、冇封面要出警告的平台（x 的 covers 在 make-publish 固定是空陣列，唔警告）
const COVER_PLATFORMS = ['bilibili', 'xhs', 'douyin', 'channels', 'youtube', 'instagram', 'tiktok'];
// 標籤以 # 形式寫在內文、requiredTags 要喺內文搵的平台（其餘平台用 tags/topics 陣列檢查第一個）
const INLINE_TAG_PLATFORMS = ['x', 'instagram'];

export function validate(b, files) {
  const errors = [], warnings = [];
  files = files || new Set();

  // ---- 工程基本 ----
  if (!b || typeof b !== 'object') return { errors: ['publish.json 唔係一個物件'], warnings };
  if (!b.video) errors.push('冇設定成片（video）');
  else if (!files.has(b.video)) errors.push(`成片 ${b.video} 唔喺工程目錄入面`);
  for (const [k, p] of Object.entries(b.covers || {})) {
    if (!['3x4', '4x3', '16x9'].includes(k)) warnings.push(`封面比例 ${k} 唔係 3x4／4x3／16x9 其中之一`);
    else if (!files.has(p)) errors.push(`封面 ${k}（${p}）唔喺工程目錄入面`);
  }

  const platforms = b.platforms || {};
  if (!Object.keys(platforms).length) warnings.push('publish.json 冇任何平台');

  for (const [id, p] of Object.entries(platforms)) {
    const spec = PLATFORMS[id];
    if (!spec) { warnings.push(`平台 ${id}：引擎未有呢個平台的規格，跳過驗證`); continue; }
    if (!p || p.skip) continue;
    const label = spec.name;

    // ---- 欄位字數／個數 ----
    for (const [field, [min, max]] of Object.entries(spec.fields)) {
      const v = p[field];
      const n = len(v);
      if (n === 0 && min > 0) { errors.push(`${label}：缺「${field}」`); continue; }
      if (n > max) errors.push(`${label}：「${field}」${Array.isArray(v) ? `有 ${n} 個` : `${n} 字`}，超過上限 ${max}`);
      else if (n > 0 && n < min) errors.push(`${label}：「${field}」得 ${n} 字，少過下限 ${min}`);
    }

    // ---- 封面檔案 ----
    for (const c of p.covers || []) if (!files.has(c)) errors.push(`${label}：封面 ${c} 唔喺工程目錄入面`);
    if (COVER_PLATFORMS.includes(id) && !(p.covers || []).length) warnings.push(`${label}：冇揀封面`);

    // ---- 平台個別規則 ----
    if (id === 'youtube' && /[<>]/.test(p.desc || '')) errors.push('YouTube：簡介唔可以有 < >（SKILL.md）');
    if (id === 'x') {
      const w = weightedLen(p.text);
      if (w > 280) warnings.push(`X：內文加權 ${w} 字（中文按 2 計），超過 280 需要 X Premium 先發到`);
    }
    if (id === 'instagram') {
      const tags = hashtags(p.caption);
      if (tags.length > 30) errors.push(`Instagram：話題標籤有 ${tags.length} 個，超過上限 30（SKILL.md）`);
    }
    if (CN_GUARDED.includes(id)) {
      const text = [p.title, p.shortTitle, p.body].filter(Boolean).join('\n');
      if (/https?:\/\/|www\./i.test(text)) errors.push(`${label}：唔可以放連結（SKILL.md：國內三家不引流）`);
      if (/微信[號号]/.test(text)) errors.push(`${label}：唔可以放微信號（SKILL.md）`);
      for (const g of GUIDE_PHRASES) if (text.includes(g)) errors.push(`${label}：唔可以寫引導句「${g}」（SKILL.md）`);
      const low = text.toLowerCase();
      for (const v of VENDOR_NAMES) if (low.includes(v)) errors.push(`${label}：唔可以寫海外廠商名「${v}」，用 AI／Agent 代稱（SKILL.md）`);
    }

    // ---- requiredTags：每個平台標籤第一個要係指定標籤（make-publish --require 的檢查） ----
    const required = b.requiredTags || [];
    if (required.length) {
      let first = null;
      if (Array.isArray(p.tags) && p.tags.length) first = p.tags[0];
      else if (Array.isArray(p.topics) && p.topics.length) first = p.topics[0];
      else if (INLINE_TAG_PLATFORMS.includes(id)) { const t = hashtags(p.caption || p.text); if (t.length) first = t[0]; }
      if (first != null && !required.includes(first)) errors.push(`${label}：第一個標籤係「${first}」，唔係 requiredTags 要求的「${required.join('／')}」`);
    }
  }

  return { errors, warnings };
}
