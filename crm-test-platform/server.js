const express = require('express');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const { runTests, getHistory, isRunning, currentRunId, emitter } = require('./test-runner');

const app = express();
const PORT = 3030;

const SCHEDULE_FILE = path.join(__dirname, 'schedule.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── 获取 testcase 信息 ──
app.get('/api/testcase', (req, res) => {
  res.json({
    id: 'crm-full-flow',
    name: 'CRM 完整销售流程',
    description: '语音线索 → 客户 → 商机 → 报价（审批）→ 赢单（审批）→ 合同生效',
    steps: 10,
    accounts: ['xuanyu.lu@bizops.com.cn (执行)', '593969718@qq.com (审批)']
  });
});

// ── 立即运行 ──
app.post('/api/run', (req, res) => {
  if (isRunning()) {
    return res.status(409).json({ error: '测试正在运行中，请等待完成' });
  }
  const result = runTests();
  res.json(result);
});

// ── SSE 实时日志推送 ──
app.get('/api/stream/:runId', (req, res) => {
  const { runId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // 先把历史日志补发
  const history = getHistory();
  const run = history.find(r => r.id === runId);
  if (run && run.logs.length > 0) {
    run.logs.forEach(line => send('log', { line }));
    if (run.status !== 'running') {
      send('done', { status: run.status, duration: run.duration, passed: run.passed, failed: run.failed });
      return res.end();
    }
  }

  // 实时监听新日志
  const onLog = ({ runId: rid, line }) => {
    if (rid === runId) send('log', { line });
  };
  const onDone = ({ runId: rid, ...stats }) => {
    if (rid === runId) {
      send('done', stats);
      cleanup();
    }
  };

  emitter.on('log', onLog);
  emitter.on('done', onDone);

  const cleanup = () => {
    emitter.off('log', onLog);
    emitter.off('done', onDone);
    res.end();
  };

  req.on('close', cleanup);
});

// ── 获取运行历史 ──
app.get('/api/history', (req, res) => {
  const history = getHistory();
  // 列表不带完整 logs（节省传输）
  res.json(history.map(r => ({ ...r, logs: undefined, logCount: r.logs?.length || 0 })));
});

// ── 获取某次 run 的完整 report ──
app.get('/api/history/:runId', (req, res) => {
  const history = getHistory();
  const run = history.find(r => r.id === req.params.runId);
  if (!run) return res.status(404).json({ error: 'run not found' });
  res.json(run);
});

// ── 当前运行状态 ──
app.get('/api/status', (req, res) => {
  res.json({ running: isRunning(), currentRunId: currentRunId() });
});

// ── 获取定时配置 ──
app.get('/api/schedule', (req, res) => {
  if (!fs.existsSync(SCHEDULE_FILE)) return res.json({ enabled: false, cron: '0 8 * * *', desc: '每天 08:00' });
  res.json(JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8')));
});

// ── 保存定时配置 ──
let scheduledJob = null;

app.post('/api/schedule', (req, res) => {
  const { enabled, cron: cronExpr, desc } = req.body;

  if (enabled && !cron.validate(cronExpr)) {
    return res.status(400).json({ error: '无效的 cron 表达式' });
  }

  // 停掉旧的
  if (scheduledJob) {
    scheduledJob.stop();
    scheduledJob = null;
  }

  const config = { enabled, cron: cronExpr, desc: desc || cronExpr };
  fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(config, null, 2));

  if (enabled) {
    scheduledJob = cron.schedule(cronExpr, () => {
      console.log(`[定时任务] 触发运行 (${cronExpr})`);
      if (!isRunning()) runTests();
    });
    console.log(`[定时任务] 已启用: ${cronExpr}`);
  }

  res.json({ ok: true, config });
});

// 启动时恢复定时任务
function restoreSchedule() {
  if (!fs.existsSync(SCHEDULE_FILE)) return;
  try {
    const config = JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
    if (config.enabled && cron.validate(config.cron)) {
      scheduledJob = cron.schedule(config.cron, () => {
        console.log(`[定时任务] 触发运行 (${config.cron})`);
        if (!isRunning()) runTests();
      });
      console.log(`[定时任务] 已恢复: ${config.cron}`);
    }
  } catch (e) {
    console.error('[定时任务] 恢复失败:', e.message);
  }
}

const server = app.listen(PORT, () => {
  restoreSchedule();
  console.log(`\n🚀 CRM 自动化测试平台已启动`);
  console.log(`   访问地址: http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ 端口 ${PORT} 已被占用，请先关闭其他占用该端口的程序后重试。`);
    console.error(`   可在任务管理器中查找占用 ${PORT} 端口的进程并结束它。\n`);
  } else {
    console.error('\n❌ 服务器启动失败:', err.message);
  }
  process.exit(1);
});
