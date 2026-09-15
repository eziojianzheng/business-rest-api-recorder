# 项目结构说明

## 用户入口

- `start.bat`：开发源码的一键启动入口；自动转到 Electron 应用目录。
- GitHub Release / Actions Artifact：正式用户下载 `.exe` 制品，无需 Node.js。

## 正式应用代码

- `ui-recorder-electron/`：Electron 桌面应用的唯一源码与构建目录。
  - `main-flow.js`：主进程与录制流程。
  - `index-main.html`：界面。
  - `trace-recorder.js` / `step-builder.js`：Trace 与分步截图。
  - `semantic-input-builder.js`：语义分析输入构建。
  - `package.json`：依赖与 electron-builder 配置。

## Kiro 开发集成（不进入 EXE）

- `.kiro/`：工作区 steering 与 hooks 配置。
- `skills/`：Kiro Skills。
- `hooks/`：UI Recorder 自动化 Hook。
- CETA 集成文档与脚本：`CETA_*.md`、`HOW_TO_INTEGRATE_CETA.md`、`integrate-ceta-skills.*`、`verify-ceta-integration.bat`。

## 运行数据与本地验证（不进入 EXE）

- `ui-recorder-workspace/`：开发模式当前会话数据，已被 Git 忽略。
- 安装版工作区：`文档/Business REST API Recorder/ui-recorder-workspace/`。
- `13点/`、`CETATesing/`：本地录制样本与测试数据，不属于产品代码，也不进入制品。
- CETA 测试产物按工作区规则存放在独立测试项目中，不再放在本仓库。

## 构建产物

- `ui-recorder-electron/dist/`：本地生成的安装版和 Portable `.exe`，已被 Git 忽略。
- `ui-recorder-electron/.playwright-browsers/`：构建时下载的 Chromium，已被 Git 忽略；它只进入 `.exe` 制品，不进入源码仓库。
- `.github/workflows/build-windows.yml`：GitHub Windows 自动构建与 Release 发布。

## 原则

1. 源码仓库不提交 `node_modules`、Chromium、运行会话或构建产物。
2. `.exe` 仅包含 Electron 应用、生产依赖和 Chromium。
3. 历史录制与 CETA/Kiro 资料保留在仓库中，但不进入最终安装包。
