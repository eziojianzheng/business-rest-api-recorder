# UI Recorder 常见问题排查指南

## 启动问题

### 问题：点击启动 Electron 没有反应

**原因**：系统缺少 Node.js/npm

**解决方案**：直接使用 Electron 可执行文件

```powershell
# 方法 1：直接运行 Electron
Start-Process -FilePath "ui-recorder-electron\node_modules\electron\dist\electron.exe" -ArgumentList "ui-recorder-electron"
```

### 问题：脚本文件显示乱码

**原因**：PowerShell 编码不匹配

**解决方案**：设置 UTF-8 编码

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Get-Content "ui-recorder-workspace/api-script.spec.js" -Encoding UTF8
```

---

## Hook 配置

### 自动调试 Hook

位置：`hooks/ui-recorder-debug.kiro.hook`

功能：当 `debug-context.md` 被修改时自动触发，Kiro 会读取实际脚本文件

配置内容：
```json
{
  "enabled": true,
  "name": "UI Recorder: 开始调试",
  "when": {
    "type": "fileEdited",
    "patterns": ["**/debug-context.md"]
  }
}
```

---

## 工作流程

### 1. 启动 Electron
```
ui-recorder-electron\node_modules\electron\dist\electron.exe ui-recorder-electron
```

### 2. 调试 API 脚本
1. 在 Electron 中点击"开始调试"按钮
2. Hook 自动触发
3. Kiro 读取 `api-script.spec.js` 并回复

### 3. 修改脚本
- Kiro 修改并保存文件后，Electron 自动检测并更新界面
- 文件位置：`ui-recorder-workspace/api-script.spec.js`

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `ui-recorder-workspace/api-script.spec.js` | API 测试脚本（实际文件） |
| `ui-recorder-workspace/debug-context.md` | 调试上下文（Hook 触发文件） |
| `ui-recorder-workspace/ui-script.js` | UI 录制脚本 |
| `hooks/ui-recorder-debug.kiro.hook` | 自动调试 Hook |

---

## 编码问题

所有工作区文件使用 **UTF-8 编码**。

如果看到乱码，在 PowerShell 中执行：
```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```
