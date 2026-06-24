# UI Recorder

> 录制 UI 操作 → AI 辅助调试 → 生成测试脚本

## 前置要求

| 工具 | 版本 | 下载 |
|------|------|------|
| **Node.js** | v18+ | [nodejs.org](https://nodejs.org/zh-cn/download) |
| **Kiro** | 最新版 | [kiro.dev](https://kiro.dev) |

## 安装（只需一次）

**双击运行 `install.bat`**

脚本会自动：
- 检查 Node.js 环境
- 安装所有依赖
- 安装 Playwright 浏览器
- 创建桌面快捷方式

## 启动

- 双击桌面的 **UI Recorder** 快捷方式
- 或双击 `start.bat`

## 使用流程

```
步骤 1 - 录制
  输入目标网址 → 点击「开始录制」
  在 Playwright Inspector 中操作
  关闭 Inspector 完成录制

步骤 2 - UI 调试（配合 Kiro）
  在 Kiro 聊天框说：
  "帮我在登录后加断言，验证跳转到首页"
  Kiro 修改脚本后，点击「回放」验证

步骤 3 - 语义分析
  点击「生成语义脚本」
  自动分析业务场景

步骤 4 - API 生成
  点击「生成 API 脚本」
  基于录制的网络请求生成 API 测试

步骤 5 - API 调试（配合 Kiro）
  在 Kiro 聊天框说：
  "验证登录接口返回的 token 不为空"
  Kiro 修改脚本后，点击「回放 API」验证
```

## Kiro 配合使用

1. 用 Kiro 打开此工具所在的目录作为工作区
2. 录制完成后，脚本自动保存到 `ui-recorder-workspace/` 目录
3. 在 Kiro 聊天框直接说你想要的修改
4. Kiro 修改并保存文件后，工具界面自动更新

## 生成的文件

录制完成后，所有文件保存在 `ui-recorder-workspace/`：

| 文件 | 说明 |
|------|------|
| `ui-script.js` | Playwright UI 自动化脚本 |
| `api-script.spec.js` | API 测试脚本 |
| `semantic-script.md` | 业务语义描述 |
| `network.har` | 录制的网络请求 |

## 常见问题

**Q: 安装时报错 "npm 不是内部命令"**
A: 请先安装 Node.js，安装后重启命令行

**Q: Playwright 浏览器下载失败**
A: 检查网络，或手动运行：`npx playwright install chromium`

**Q: 回放时找不到元素**
A: 在 Kiro 聊天框说："回放失败，错误是 [粘贴错误]，帮我修复"

**Q: Kiro 修改脚本后界面没有更新**
A: 确认 Kiro 已保存文件（Ctrl+S），工具会在 1 秒内自动检测到变化
