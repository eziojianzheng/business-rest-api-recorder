// trace-recorder.js —— 真人 codegen 录制 + trace + 旁路操作打点（无回放）
// ============================================================================
// 由 main-flow.js 以 "ELECTRON_RUN_AS_NODE" 子进程方式启动。
//
// 三件事同时进行，全部基于真人一次操作，无回放：
//   1) recorder（context._enableRecorder）  -> 生成高质量 codegen 脚本
//   2) tracing（context.tracing）            -> 连续截图帧 + DOM 快照
//   3) 旁路 DOM 监听（addInitScript+binding）-> 给每个用户操作打 wallTime 时间戳
//
// 为什么需要 (3)：recording 模式下用户操作被直接翻译成脚本，不经过 API，
// 所以 trace 里没有"每个操作的时间点"。旁路监听补上这个时间戳，
// 录制结束后就能把操作和 trace 截图帧按 wallTime 对齐，切出每步前后截图。
//
// 参数（process.argv）：
//   [2] url  [3] outputFile(.js)  [4] harFile  [5] traceFile(.zip)
//   [6] shotsDir(trace解压目录)   [7] stepsDir(分步产物目录，可选)
//
// 停止：主进程向 stdin 写 "STOP\n"。

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { buildSteps } = require('./step-builder');

const url        = process.argv[2];
const outputFile = process.argv[3];
const harFile    = process.argv[4];
const traceFile  = process.argv[5];
const shotsDir   = process.argv[6];
const stepsDir   = process.argv[7] || path.join(path.dirname(shotsDir), 'steps');

function log(tag, msg) { console.log(`[trace-recorder] ${tag}${msg ? ' ' + msg : ''}`); }

// 收集到的用户操作（带 wallTime 时间戳）
const userEvents = [];

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--start-maximized']
  });

  const context = await browser.newContext({
    viewport: null,
    ignoreHTTPSErrors: true,
    recordHar: { path: harFile, mode: 'full', content: 'embed' }
  });

  // ── 旁路监听：页面通过此 binding 上报交互 ──
  await context.exposeBinding('__recordEvent', (source, data) => {
    userEvents.push({ ...data, wallTime: Date.now() });
  });
  await context.addInitScript(() => {
    const report = (type, e) => {
      try {
        const el = e.target;
        if (!el || !el.tagName) return;
        // 生成一个可读标签
        const label =
          (el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name'))) ||
          (el.innerText || el.value || '').trim().slice(0, 40) || el.id || el.tagName.toLowerCase();
        window.__recordEvent({
          type,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          name: el.getAttribute ? el.getAttribute('name') : null,
          inputType: el.getAttribute ? el.getAttribute('type') : null,
          value: (el.value !== undefined ? String(el.value) : '').slice(0, 100),
          label: String(label),
          url: location.href
        });
      } catch (err) {}
    };
    // 捕获阶段监听，只读不阻断，不干扰 recorder
    document.addEventListener('click', e => report('click', e), true);
    document.addEventListener('change', e => report('change', e), true);
    document.addEventListener('input', e => {
      // input 高频，做去抖：只在停止输入后由 change 记录最终值，这里记一次起点
      report('input', e);
    }, true);
  });

  // ① 先开 trace
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });

  // ② 开启 codegen 录制器
  await context._enableRecorder({
    language: 'playwright-test',
    mode: 'recording',
    outputFile,
    handleSIGINT: false
  });

  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(e => log('GOTO_WARN', e.message));

  log('READY');

  let stopping = false;
  async function stop(reason) {
    if (stopping) return;
    stopping = true;
    log('STOPPING', reason || '');

    // 最后一步没有"下一步"来当 after，这里在浏览器关闭前主动等页面稳定并截一张，
    // 作为最后一步的 after（存到 shotsDir，buildSteps 会优先使用）。
    let finalShotPath = null;
    try {
      const activePage = context.pages().find(p => !p.isClosed()) || page;
      if (activePage && !activePage.isClosed()) {
        await activePage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {});
        finalShotPath = path.join(path.dirname(traceFile), 'final-after.jpeg');
        await activePage.screenshot({ path: finalShotPath, type: 'jpeg', quality: 60 });
        log('FINAL_SHOT', finalShotPath);
      }
    } catch (e) { log('FINAL_SHOT_ERR', e.message); finalShotPath = null; }

    try {
      await context.tracing.stop({ path: traceFile });
      log('TRACE_SAVED', traceFile);
    } catch (e) { log('TRACE_STOP_ERR', e.message); }

    try { await context.close(); } catch (e) {}
    try { if (browser.isConnected()) await browser.close(); } catch (e) {}

    // 解压 trace
    try {
      if (fs.existsSync(traceFile)) {
        fs.rmSync(shotsDir, { recursive: true, force: true });
        fs.mkdirSync(shotsDir, { recursive: true });
        execSync(
          `powershell -NoProfile -Command "Expand-Archive -Force -LiteralPath '${traceFile}' -DestinationPath '${shotsDir}'"`,
          { stdio: 'ignore' }
        );
        log('TRACE_EXTRACTED', shotsDir);
      }
    } catch (e) { log('EXTRACT_ERR', e.message); }

    // 保存原始操作事件
    try {
      fs.writeFileSync(
        path.join(shotsDir, 'user-events.json'),
        JSON.stringify(userEvents, null, 2), 'utf-8'
      );
    } catch (e) {}

    // 对齐操作与截图帧，生成分步产物（最后一步 after 用主动截的 finalShot）
    try {
      buildSteps(shotsDir, stepsDir, userEvents, log, finalShotPath);
      log('STEPS_BUILT', stepsDir);
    } catch (e) { log('STEPS_ERR', e.stack || e.message); }

    log('DONE');
    process.exit(0);
  }

  process.stdin.on('data', d => { if (d.toString().includes('STOP')) stop('stdin'); });
  process.stdin.resume();
  browser.on('disconnected', () => { if (!stopping) { log('BROWSER_CLOSED'); process.exit(0); } });
})().catch(e => { log('FATAL', e.stack || e.message); process.exit(1); });
