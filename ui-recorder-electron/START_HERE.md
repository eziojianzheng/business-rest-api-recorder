# 🚀 快速开始

## 问题：为什么打开了 2 个浏览器？

**答案**：可能是旧的进程还在运行。

## ✅ 解决方案（3 步）

### 步骤 1: 清理旧进程

**Windows 用户（推荐）**：
```bash
restart-clean.bat
```

**或者手动清理**：
```bash
# 停止所有 Chrome 进程
taskkill /F /IM chrome.exe

# 停止所有 Electron 进程
taskkill /F /IM electron.exe

# 等待 2 秒
timeout /t 2

# 启动应用
npm start
```

### 步骤 2: 启动应用

```bash
cd ui-recorder-electron
npm start
```

### 步骤 3: 开始录制

1. 在 URL 输入框输入网址
2. 点击 **"打开 Playwright 工具"** 按钮
3. 等待 Playwright Inspector 窗口打开

**✅ 正确状态**：应该只看到 **1 个浏览器窗口**（Inspector + 网页）

**❌ 如果还是 2 个窗口**：
1. 关闭所有窗口
2. 打开任务管理器（Ctrl + Shift + Esc）
3. 结束所有 `chrome.exe` 和 `electron.exe` 进程
4. 重新运行 `npm start`

## 📝 录制操作

1. 在 Inspector 中点击 **Record** 按钮（红色圆点）
2. 在浏览器中进行操作：
   - 点击按钮
   - 输入文本
   - 导航页面
3. 观察 Electron 窗口：
   - **UI 脚本**会实时更新
   - **Network 面板**会在录制结束后显示 API

## ⏹ 停止录制

1. 在 Inspector 中点击 **Stop** 按钮
2. 关闭 Inspector 窗口
3. 查看 Electron 窗口的最终结果

## 📊 查看结果

### Electron 窗口显示：
- **语义脚本**：业务场景描述（待实现）
- **UI 脚本**：Playwright 原生脚本（实时同步）
- **API 脚本**：API 测试脚本（待实现）
- **Network 面板**：所有捕获的 API 调用

### 生成的文件：
```bash
# UI 脚本
type recorded-script.js

# 网络请求（HAR 格式）
type recorded-network.har
```

## 🧪 测试是否正常

运行独立测试（不启动 Electron）：
```bash
node test-codegen-only.js
```

这会启动 Codegen 并在结束后显示统计信息。

## 🐛 还是有问题？

查看详细的故障排查指南：
```bash
# 查看故障排查文档
type TROUBLESHOOTING.md

# 查看当前状态
type CURRENT_STATUS.md
```

或者使用开发模式查看日志：
```bash
npm run dev
# 会打开 DevTools，查看 Console 输出
```

## 📞 常见问题

### Q: 为什么 Network 面板是空的？
**A**: HAR 文件只在 Codegen 关闭后才能读取。请完成录制并关闭 Inspector 窗口。

### Q: UI 脚本没有更新？
**A**: 检查 `recorded-script.js` 文件是否存在。如果不存在，说明 Codegen 没有生成文件。

### Q: 如何只看业务 API？
**A**: 使用 Network 面板的过滤器，只勾选 **XHR** 和 **Fetch**。

### Q: Inspector 窗口没有打开？
**A**: 检查 Playwright 是否正确安装：
```bash
npx playwright --version
npx playwright install chromium
```

---

**需要更多帮助？** 查看 `TROUBLESHOOTING.md` 或 `CURRENT_STATUS.md`
