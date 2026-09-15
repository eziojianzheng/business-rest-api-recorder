# Business REST API Recorder Desktop

Electron 桌面应用源码目录。普通用户应从 GitHub Releases 下载安装版或 Portable `.exe`。

## 源码启动

推荐在仓库根目录双击 `start.bat`。也可以在本目录执行：

```powershell
npm install
npm start
```

本目录的 `start.bat` 支持干净 Windows：缺少 Node.js 时自动下载便携版 Node，并准备依赖与 Chromium。

## 当前界面流程

1. **录制**：输入 URL，选择普通录制、Trace 录制或仅 HAR。
2. **语义**：生成三源语义上下文，交给 Kiro 写回语义脚本。

“导入配置”和“API 调试”入口当前已隐藏。

## 工作区

- 开发模式：仓库根目录 `ui-recorder-workspace/`
- 安装版：用户“文档/Business REST API Recorder/ui-recorder-workspace/”

应用不会向安装目录或 `app.asar` 写入运行数据。

## 构建 EXE

```powershell
npm ci
npm run dist:win
```

输出位于 `dist/`：

- NSIS 安装版
- Portable 免安装版

构建脚本会准备 `.playwright-browsers/`，并将 Chromium 打进制品；浏览器目录不会提交到 Git。

## GitHub 构建

`.github/workflows/build-windows.yml` 支持：

- Actions 手动构建并下载 Artifact。
- 推送 `v*` Tag 后自动创建 Release 并上传 `.exe`。

## 主要源码

| 文件 | 说明 |
|---|---|
| `main-flow.js` | Electron 主进程、录制、会话和回放 |
| `index-main.html` | 应用界面 |
| `trace-recorder.js` | Trace 录制子进程 |
| `step-builder.js` | 分步截图生成 |
| `semantic-input-builder.js` | 三源语义输入生成 |
| `playwright.config.js` | 回放配置 |
| `scripts/prepare-browser.js` | 构建前 Chromium 准备与校验 |

## 故障排查

见 `TROUBLESHOOTING.md`。
