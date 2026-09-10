// semantic-input-builder.js
// 生成"语义分析输入"：每一步都融合三源证据（脚本 + HAR API + before/after 图片）
// 这是团队约定的硬规则：语义步骤必须经过 HAR + 脚本 + 图片 三源交叉验证才算准确。
//
// 导出 buildSemanticInput(sessionDir) -> { markdown, steps, stats }

const fs = require('fs');
const path = require('path');

function isBizApi(url, mime) {
  const u = (url || '').toLowerCase();
  if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|ttf|woff2|map|webp)(\?|$)/.test(u)) return false;
  if (/\/(js|css|img|images|icons|fonts|packages|locales|static|assets)\//.test(u)) return false;
  return u.includes('/api/') || (mime || '').includes('json');
}

function shortUrl(u) {
  try { const x = new URL(u); return x.pathname + (x.search ? x.search.slice(0, 60) : ''); }
  catch { return u; }
}

function loadBizApis(harPath) {
  if (!fs.existsSync(harPath)) return [];
  let har;
  try { har = JSON.parse(fs.readFileSync(harPath, 'utf-8')); } catch { return []; }
  return (har.log?.entries || [])
    .map(e => ({
      method: e.request.method,
      url: e.request.url,
      status: e.response.status,
      mime: e.response.content?.mimeType || '',
      ms: Date.parse(e.startedDateTime),
      reqBody: e.request.postData?.text || null
    }))
    .filter(a => isBizApi(a.url, a.mime))
    .sort((a, b) => a.ms - b.ms);
}

// 把脚本按行拆出可读操作（用于给每步附上对应脚本行的参考）
function loadScriptLines(scriptPath) {
  if (!fs.existsSync(scriptPath)) return [];
  return fs.readFileSync(scriptPath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('await ') || l.startsWith('const '));
}

function buildSemanticInput(sessionDir) {
  const stepsPath = path.join(sessionDir, 'steps', 'steps.json');
  const harPath = path.join(sessionDir, 'network.har');
  const scriptPath = path.join(sessionDir, 'ui-script.js');
  const stepsImgDir = path.join(sessionDir, 'steps');

  const hasSteps = fs.existsSync(stepsPath);
  const steps = hasSteps ? JSON.parse(fs.readFileSync(stepsPath, 'utf-8')) : [];
  const apis = loadBizApis(harPath);
  const scriptLines = loadScriptLines(scriptPath);

  // 为每步关联 API：窗口 = [本步 startWall, 下一步 startWall)
  const enriched = steps.map((s, i) => {
    const start = s.startWall;
    const end = i + 1 < steps.length ? steps[i + 1].startWall : s.startWall + 8000;
    const hitApis = apis.filter(a => a.ms >= start - 200 && a.ms < end);
    // 只保留"写操作/关键"API 作为重点，其余计数
    const keyApis = hitApis.filter(a => a.method !== 'GET');
    const beforeImg = s.before ? path.join(stepsImgDir, s.before) : null;
    const afterImg = s.after ? path.join(stepsImgDir, s.after) : null;
    return {
      index: s.index,
      type: s.type,
      description: s.description,
      element: s.element,
      value: s.value,
      url: s.url,
      keyApis: keyApis.map(a => `${a.method} ${shortUrl(a.url)} -> ${a.status}`),
      apiCount: hitApis.length,
      beforeImg,
      afterImg
    };
  });

  // 生成 Markdown 分析输入
  const L = [];
  L.push('# 语义步骤分析输入（三源融合）');
  L.push('');
  L.push('> **强制规则**：每一步的语义描述，必须综合以下三源交叉验证后得出，缺一不可：');
  L.push('> 1. **录制脚本**（Playwright 选择器 —— 精确的定位与操作类型）');
  L.push('> 2. **HAR 网络**（该步触发的后端 API —— 证明服务端实际发生了什么）');
  L.push('> 3. **前后截图**（before/after 图片 —— 用视觉确认画面变化，尤其画布/拖拽等无语义元素的操作）');
  L.push('>');
  L.push('> 对每一步：先看脚本知道"点/填了什么"，再看 API 知道"服务端做了什么"，最后**必须打开 before/after 图片用视觉核对画面变化**，三者一致后再下结论。');
  L.push('> 若三源冲突或图片显示的与脚本/API 不符，以**截图所见为准**并在描述中标注差异。');
  L.push('');
  L.push(`**统计**：共 ${enriched.length} 步；业务 API ${apis.length} 个；脚本行 ${scriptLines.length}。`);
  L.push('');
  if (!hasSteps) {
    L.push('⚠️ 未找到 steps/steps.json（本次录制可能未开启 Trace 录屏）。请开启"🎬 录屏(Trace)"后重新录制，才能获得每步的前后截图用于三源融合。');
    L.push('');
  }
  L.push('---');
  L.push('');

  enriched.forEach(s => {
    L.push(`## 步骤 ${s.index}：${s.description}`);
    L.push('');
    L.push('**① 脚本证据（操作/定位）**');
    L.push(`- 类型: ${s.type}　元素: <${s.element?.tag || '?'}> ` +
      `${s.element?.id ? 'id=' + s.element.id + ' ' : ''}` +
      `${s.element?.name ? 'name=' + s.element.name + ' ' : ''}` +
      `label="${(s.element?.label || '').replace(/\n/g, ' ').slice(0, 40)}"`);
    if (s.value != null) L.push(`- 输入值: \`${s.value}\``);
    L.push(`- 页面 URL: ${s.url}`);
    L.push('');
    L.push('**② HAR 证据（服务端行为）**');
    if (s.keyApis.length) {
      s.keyApis.forEach(a => L.push(`- 🔑 ${a}`));
      if (s.apiCount > s.keyApis.length) L.push(`- （另有 ${s.apiCount - s.keyApis.length} 个 GET 读取类请求）`);
    } else if (s.apiCount) {
      L.push(`- 本步窗口内有 ${s.apiCount} 个 GET 读取类请求（无写操作）`);
    } else {
      L.push('- 无后端请求（纯前端交互，如聚焦、展开面板、画布操作）');
    }
    L.push('');
    L.push('**③ 图片证据（必须查看）**');
    L.push(`- before: ${s.beforeImg || '(无)'}`);
    L.push(`- after : ${s.afterImg || '(无)'}`);
    L.push('- 👁 请打开上面两张图，对比画面变化，确认这一步实际产生的界面效果。');
    L.push('');
    L.push('**→ 综合三源，写出该步的精确语义描述：**（在此填写）');
    L.push('');
    L.push('---');
    L.push('');
  });

  return {
    markdown: L.join('\n'),
    steps: enriched,
    stats: { steps: enriched.length, bizApis: apis.length, scriptLines: scriptLines.length }
  };
}

module.exports = { buildSemanticInput };
