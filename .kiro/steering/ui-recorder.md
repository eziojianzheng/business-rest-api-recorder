# Business REST API Recorder - Kiro 协作指南

## ⚡ 自动激活规则

当用户消息包含以下关键词时，**立即调用 `discloseContext` 加载 Skill**：
- "Business REST API Recorder" 或 "business-rest-api-recorder"
- "UI Recorder" 或 "ui-recorder"
- "调试 UI 脚本" 或 "调试 API 脚本"
- "开始调试"
- "semantic-context.md"

**激活命令**：
```
discloseContext(name: "ui-recorder")
```

> 注意：不要直接读取 SKILL.md 文件，必须通过 discloseContext 工具激活，这样才能正确加载到上下文中。

## 工作区文件

| 文件 | 说明 |
|------|------|
| `ui-recorder-workspace/ui-script.js` | Playwright UI 自动化脚本 |
| `ui-recorder-workspace/api-script.spec.js` | API 测试脚本 |
| `ui-recorder-workspace/debug-context.md` | 当前调试上下文 |
| `ui-recorder-workspace/semantic-context.md` | 语义脚本生成请求（含 UI 脚本和 API 列表） |
| `ui-recorder-workspace/semantic-script.md` | 语义脚本输出文件（Kiro 写入这里） |
| `skills/ui-recorder/SKILL.md` | 调试工作流 SKILL |

## 语义脚本生成

当用户发送包含 `semantic-context.md` 的消息时：
1. 读取 `ui-recorder-workspace/semantic-context.md`
2. 按照文件中的要求生成语义脚本
3. 保存到 `ui-recorder-workspace/semantic-script.md`（Electron 会自动检测并显示）

## 修改脚本的规则

- 修改完**必须保存文件**，Electron 监听文件变化会自动同步到界面
- 保持 Playwright Test 格式（`test()`, `expect()`）
- UI 脚本用 `page` 对象，API 脚本用 `request` 对象
