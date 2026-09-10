// step-builder.js —— 把用户操作事件 + trace 截图帧，对齐切分为每步前后截图
// ============================================================================
// 取帧规则（修复 before/after 时机问题）：
//   - 一个"操作步骤"= 一次 click 或 一组连续 input（合并为一次"输入"）
//   - before = 该步"开始时刻"之前最近的帧（输入步用第一个 input 的时间；点击步用 click 时间）
//   - after  = 下一步"开始时刻"之前最近的帧；最后一步用录制末尾帧
//     （这样点击跳转类能拿到跳转完成后的画面，而不是转圈中）
//   - 去重：同一元素在极短时间内的重复 click 合并

const fs = require('fs');
const path = require('path');

function parseFrames(traceDir) {
  const tracePath = path.join(traceDir, 'trace.trace');
  const frames = [];
  if (!fs.existsSync(tracePath)) return frames;
  for (const line of fs.readFileSync(tracePath, 'utf-8').split('\n')) {
    if (!line) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    if (e.type === 'screencast-frame' && e.frameSwapWallTime) {
      frames.push({ wallTime: e.frameSwapWallTime, sha1: e.sha1 });
    }
  }
  frames.sort((a, b) => a.wallTime - b.wallTime);
  return frames;
}

// 把细碎事件归并为"操作步骤"
function groupSteps(events) {
  const steps = [];
  let i = 0;
  while (i < events.length) {
    const e = events[i];

    if (e.type === 'input') {
      // 合并同一元素的连续 input，直到出现非 input 或换了元素
      const key = e.name || e.label;
      let j = i;
      let last = e;
      while (j < events.length && events[j].type === 'input' && (events[j].name || events[j].label) === key) {
        last = events[j];
        j++;
      }
      // 跳过紧随其后、值相同的 change（它只是输入结束的确认）
      if (j < events.length && events[j].type === 'change' && (events[j].name || events[j].label) === key) {
        last = events[j];
        j++;
      }
      steps.push({
        kind: 'input',
        startWall: e.wallTime,          // 第一次输入 = 开始时刻（此时输入框还没内容/刚开始）
        element: pickEl(last),
        value: last.value,
        url: last.url,
        description: `输入 "${last.value}" 到 ${last.label}`
      });
      i = j;
      continue;
    }

    if (e.type === 'click') {
      // 去重：与上一步是同元素 click 且间隔 < 1500ms，则并入（重复点击算同一步）
      const prev = steps[steps.length - 1];
      if (prev && prev.kind === 'click' && sameEl(prev.element, e) && (e.wallTime - prev.startWall) < 1500) {
        i++;
        continue;
      }
      steps.push({
        kind: 'click',
        startWall: e.wallTime,
        element: pickEl(e),
        value: null,
        url: e.url,
        description: `点击 ${e.label}`
      });
      i++;
      // 吸收紧随其后、作用于同元素的 change（如点击输入框后触发的值确认），不单独成步
      while (i < events.length && events[i].type === 'change' && sameEl(pickEl(e), events[i])) {
        i++;
      }
      continue;
    }

    // 独立的 change（没有前置 input，少见）——忽略，避免和 input 重复
    i++;
  }
  return steps;
}

function pickEl(e) {
  return { tag: e.tag, id: e.id, name: e.name, inputType: e.inputType, label: e.label };
}
function sameEl(a, e) {
  return (a.name && a.name === e.name) || (a.label && a.label === e.label);
}
function safe(s) { return String(s).replace(/[^\w\u4e00-\u9fa5]+/g, '_').slice(0, 30); }

// finalShotPath：录制停止时主动截的"最终稳定帧"，用作最后一步的 after（可选）
function buildSteps(traceDir, outDir, events, log = () => {}, finalShotPath = null) {
  const resourcesDir = path.join(traceDir, 'resources');
  const frames = parseFrames(traceDir);

  const frameBefore = (t) => {
    let best = null;
    for (const f of frames) { if (f.wallTime <= t) best = f; else break; }
    return best || frames[0] || null;
  };

  const grouped = groupSteps(events);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const lastFrame = frames[frames.length - 1] || null;
  const out = [];

  grouped.forEach((s, idx) => {
    const i = String(idx + 1).padStart(2, '0');
    const next = grouped[idx + 1];
    const isLast = idx === grouped.length - 1;

    // before：本步开始前一帧（尽量贴近"操作前瞬间"）
    // 你的规则：after = 下一步开始前一帧（此时页面已加载完，因为下一步元素可点即证明已加载）
    const bf = frameBefore(s.startWall - 80);
    const af = next ? frameBefore(next.startWall - 80) : lastFrame;

    const label = safe(s.description);
    const step = {
      index: idx + 1,
      type: s.kind,
      description: s.description,
      element: s.element,
      value: s.value,
      url: s.url,
      startWall: s.startWall,
      before: null,
      after: null
    };

    if (bf && fs.existsSync(path.join(resourcesDir, bf.sha1))) {
      const name = `step${i}_${label}_before.jpeg`;
      fs.copyFileSync(path.join(resourcesDir, bf.sha1), path.join(outDir, name));
      step.before = name;
    }

    // 最后一步：优先用录制停止时主动截的"最终稳定帧"（因为没有下一步来当 after）
    if (isLast && finalShotPath && fs.existsSync(finalShotPath)) {
      const name = `step${i}_${label}_after.jpeg`;
      fs.copyFileSync(finalShotPath, path.join(outDir, name));
      step.after = name;
    } else if (af && fs.existsSync(path.join(resourcesDir, af.sha1))) {
      const name = `step${i}_${label}_after.jpeg`;
      fs.copyFileSync(path.join(resourcesDir, af.sha1), path.join(outDir, name));
      step.after = name;
    }
    out.push(step);
  });

  fs.writeFileSync(path.join(outDir, 'steps.json'), JSON.stringify(out, null, 2), 'utf-8');
  log('STEPS_COUNT', String(out.length));
  return out;
}

module.exports = { buildSteps };
