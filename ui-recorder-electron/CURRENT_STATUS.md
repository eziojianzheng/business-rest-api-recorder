# UI Recorder - 当前状态

## ✅ 已完成的功能

### 1. Playwright 原生 Codegen 集成
- ✅ 使用 `npx playwright codegen` 启动原生 Inspector
- ✅ 生成 100% 原生质量的 UI 脚本
- ✅ 脚本自动输出到 `recorded-script.js` 文件
- ✅ 实时监听文件变化（每秒检查 + fs.watch）
- ✅ UI 脚本自动同步到 Electron 窗口

### 2. HAR 网络录制
- ✅ 使用 `--save-har` 参数录制所有网络请求
- ✅ 捕获完整的 HTTP 请求和响应
- ✅ 解析 HAR 文件提取 API 调用
- ✅ 按资源类型分类（XHR, Fetch, Doc, CSS, JS, Img, Other）
- ✅ 在 Electron 窗口显示 API 列表

### 3. Electron UI
- ✅ 现代化的深色主题界面
- ✅ 三栏布局：Network 面板 + 语义脚本 + UI 脚本 + API 脚本
- ✅ 可调整大小的面板
- ✅ API 过滤器（按类型和 URL）
- ✅ 实时状态显示

## 🔧 技术实现

### 核心命令
```bash
npx playwright codegen \
  --output recorded-script.js \
  --save-har recorded-network.har \
  --target playwright-test \
  --channel chrome \
  http://example.com
```

### 文件监听机制
```javascript
// 方案 1: 定时检查（每秒）
setInterval(() => {
    if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
        if (content !== lastContent) {
            // 发送更新到 Electron 窗口
            mainWindow.webContents.send('ui-script-updated', content);
        }
    }
}, 1000);

// 方案 2: fs.watch（更快响应）
fs.watch(outputFile, (eventType) => {
    if (eventType === 'change') {
        // 读取并发送更新
    }
});
```

### HAR 解析
```javascript
const harContent = JSON.parse(fs.readFileSync(harFile, 'utf-8'));
const entries = harContent.log.entries || [];

const apis = entries.map(entry => ({
    method: entry.request.method,
    url: entry.request.url,
    status: entry.response.status,
    timestamp: entry.startedDateTime,
    resourceType: guessResourceType(entry.request.url, entry.response.content.mimeType)
}));
```

## 🎯 当前问题

### 问题：打开了 2 个浏览器窗口

**现象**：点击"打开 Playwright 工具"后，看到 2 个 Chrome 窗口

**可能原因**：
1. ❌ 代码中有 `chromium.launch()` 调用 → **已修复**（已删除）
2. ⚠️ 旧的 Chrome/Electron 进程还在后台运行
3. ⚠️ 可能有缓存的浏览器实例

**解决方案**：
```bash
# 方案 1: 使用清理脚本
restart-clean.bat

# 方案 2: 手动清理
taskkill /F /IM chrome.exe
taskkill /F /IM electron.exe
npm start

# 方案 3: 使用任务管理器
# Ctrl + Shift + Esc → 结束所有 Chrome 和 Electron 进程
```

## 📋 测试步骤

### 1. 清理环境
```bash
# 停止所有相关进程
taskkill /F /IM chrome.exe
taskkill /F /IM electron.exe
```

### 2. 启动应用
```bash
cd ui-recorder-electron
npm start
```

### 3. 开始录制
1. 在 URL 输入框输入网址（默认：`http://localhost:9220/ui/login/basic?auth=basic`）
2. 点击"打开 Playwright 工具"按钮
3. 等待 Playwright Inspector 窗口打开（应该只有 1 个窗口）

### 4. 录制操作
1. 在 Inspector 中点击"Record"按钮（红色圆点）
2. 在浏览器中进行操作（点击、输入、导航等）
3. 观察 Electron 窗口的变化：
   - **Network 面板**：实时显示捕获的 API 调用（需要等 Codegen 关闭后才会显示）
   - **UI 脚本面板**：实时显示 Playwright 生成的脚本

### 5. 停止录制
1. 在 Inspector 中点击"Stop"按钮
2. 关闭 Inspector 窗口
3. 查看 Electron 窗口的最终结果

### 6. 验证结果
检查以下文件是否生成：
```bash
dir recorded-script.js
dir recorded-network.har
```

查看文件内容：
```bash
type recorded-script.js
type recorded-network.har
```

## 🧪 独立测试

如果想单独测试 Codegen（不启动 Electron），可以运行：

```bash
node test-codegen-only.js
```

这会：
1. 启动 Playwright Codegen
2. 生成 `test-codegen-output.js` 和 `test-codegen-output.har`
3. 在 Codegen 关闭后显示统计信息

## 📁 文件结构

```
ui-recorder-electron/
├── main-codegen.js              # 主进程（使用 Codegen）
├── index-playwright.html        # Electron UI
├── package.json                 # 依赖配置
├── recorded-script.js           # Codegen 生成的 UI 脚本
├── recorded-network.har         # HAR 网络录制文件
├── restart-clean.bat            # 清理脚本
├── test-codegen-only.js         # 独立测试脚本
├── CURRENT_STATUS.md            # 当前状态（本文件）
├── TROUBLESHOOTING.md           # 故障排查指南
└── IMPROVEMENTS.md              # 改进建议
```

## 🚀 下一步计划

### 1. 语义脚本生成（待实现）
根据 UI 脚本 + API 数据生成业务场景描述：
```javascript
// 输入：
// - UI Script: page.click('button:has-text("登录")')
// - API: POST /api/auth/login

// 输出：
// 场景：用户登录
// 1. 用户点击"登录"按钮
// 2. 系统调用登录 API (POST /api/auth/login)
// 3. 验证登录成功
```

### 2. API 测试脚本生成（待实现）
从 HAR 文件生成 API 测试脚本：
```javascript
// 输入：HAR 中的 POST /api/auth/login

// 输出：
test('登录 API', async () => {
    const response = await fetch('http://localhost:9220/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '123456' })
    });
    expect(response.status).toBe(200);
});
```

### 3. 业务 API 识别
从所有网络请求中识别业务相关的 API：
- ✅ 过滤静态资源（CSS, JS, 图片）
- ✅ 识别 XHR/Fetch 请求
- ⚠️ 识别 RESTful API 模式（/api/*, /graphql）
- ⚠️ 关联 UI 操作和 API 调用

### 4. 优化和增强
- ⚠️ 实时显示 API（不等 Codegen 关闭）
- ⚠️ API 请求/响应详情查看
- ⚠️ 导出功能（保存脚本到文件）
- ⚠️ 历史记录管理
- ⚠️ 配置持久化

## 📝 已知限制

1. **HAR 数据延迟**：HAR 文件只在 Codegen 关闭后才能读取，无法实时显示 API
2. **单浏览器实例**：Codegen 使用独立的浏览器实例，无法直接注入监听代码
3. **手动复制脚本**：Inspector 生成的脚本需要手动复制（虽然会自动同步到 Electron，但 Inspector 的脚本质量更高）

## 🎓 使用建议

1. **优先使用 Inspector 的脚本**：Inspector 窗口显示的脚本质量最高（100 分），Electron 窗口的脚本是备用
2. **关注业务 API**：使用过滤器只显示 XHR/Fetch 类型的请求，忽略静态资源
3. **完整录制流程**：从登录到完成业务操作，一次性录制完整流程
4. **验证 HAR 文件**：录制完成后检查 `recorded-network.har` 是否包含预期的 API 调用

## 🐛 调试技巧

### 查看详细日志
```bash
npm run dev
# 会打开 Electron DevTools，查看 Console 输出
```

### 查看生成的文件
```bash
# 查看 UI 脚本
type recorded-script.js

# 查看 HAR 文件（格式化）
type recorded-network.har | python -m json.tool
```

### 测试单个功能
```bash
# 只测试 Codegen
npx playwright codegen --output test.js --save-har test.har http://example.com

# 只测试 HAR 解析
node -e "const fs = require('fs'); const har = JSON.parse(fs.readFileSync('recorded-network.har', 'utf-8')); console.log(har.log.entries.length + ' requests');"
```

## ✅ 验收标准

当前实现应该满足：
- ✅ 只打开 **1 个浏览器窗口**（Playwright Inspector + 被测试网页）
- ✅ UI 脚本自动同步到 Electron 窗口
- ✅ HAR 文件成功生成并解析
- ✅ API 列表正确显示在 Network 面板
- ✅ 可以按类型过滤 API
- ✅ 可以按 URL 搜索 API

## 📞 需要帮助？

如果遇到问题，请查看：
1. `TROUBLESHOOTING.md` - 故障排查指南
2. 控制台日志（`npm run dev`）
3. 生成的文件（`recorded-script.js`, `recorded-network.har`）

---

**最后更新**: 2026-05-21  
**版本**: 1.0.0  
**状态**: 🔧 修复中（2 个浏览器窗口问题）
