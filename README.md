# Business REST API Recorder

基于 Electron + Playwright 的业务操作录制工具，可同时生成 UI 脚本、HAR、Trace 和分步前后截图，并与 Kiro 协作生成业务语义脚本。

## 普通用户：下载 EXE

正式制品通过 GitHub Actions 构建：

- **安装版**：`Business REST API Recorder-<version>-x64-nsis.exe`
- **免安装版**：`Business REST API Recorder-<version>-x64-portable.exe`

进入仓库的 **Releases** 页面下载即可。制品内置 Chromium，不需要安装 Node.js、npm 或 Chrome。

## 开发者：源码启动

在仓库根目录双击：

```text
start.bat
```

首次启动会自动准备 Node.js、npm 依赖和 Playwright Chromium。也可进入 `ui-recorder-electron/` 后运行：

```powershell
npm install
npm start
```

## 当前功能

1. 使用 Playwright 录制 UI 操作。
2. 同步捕获业务 API（HAR）。
3. 可选开启 Trace，生成每一步 before/after 截图。
4. 生成 `semantic-context.md`，供 Kiro 进行三源语义分析。
5. 保存、打开和继续会话。
6. UI 脚本回放。

当前界面默认显示“录制”和“语义”两个步骤；“导入配置”和“API 调试”入口暂时隐藏。

## 工作区

开发模式生成文件到：

```text
ui-recorder-workspace/
```

安装版生成文件到：

```text
文档/Business REST API Recorder/ui-recorder-workspace/
```

主要文件：

| 文件 | 说明 |
|---|---|
| `ui-script.js` | Playwright UI 脚本 |
| `network.har` | 网络请求记录 |
| `trace.zip` | Playwright Trace |
| `steps/` | 分步 before/after 截图与 `steps.json` |
| `semantic-context.md` | Kiro 语义分析输入 |
| `semantic-script.md` | 业务语义输出 |

## Kiro 协作

以下内容仅用于开发者/Kiro 协作，不会进入 `.exe`：

- `skills/`：UI Recorder、API、CETA 领域技能。
- `hooks/`：文件变化与调试触发。
- `.kiro/steering/`：工作规则与三源融合要求。

程序生成上下文文件后，Kiro 读取工作区并写回语义脚本；Electron 会监听文件变化并刷新界面。

## CETA 可选集成

CETA Skills 不是桌面程序运行依赖，仅用于增强业务术语与 API 理解：

- [CETA 集成指南](CETA_INTEGRATION_GUIDE.md)
- [集成操作说明](HOW_TO_INTEGRATE_CETA.md)
- [Skill 管理规范](SKILL_MANAGEMENT.md)

## 构建 Windows 制品

本地构建：

```powershell
cd ui-recorder-electron
npm ci
npm run dist:win
```

GitHub：

1. 在 **Actions → Build Windows EXE** 手动运行，下载 Artifact。
2. 推送 `v*` 标签时自动创建 Release 并上传两个 `.exe`。

```powershell
git tag v2.0.0
git push origin v2.0.0
```

## 项目边界

详细说明见 [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)。

## 故障排查

见 [ui-recorder-electron/TROUBLESHOOTING.md](ui-recorder-electron/TROUBLESHOOTING.md)。

## License

MIT
