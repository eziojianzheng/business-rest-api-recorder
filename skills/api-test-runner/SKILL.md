---
name: api-test-runner
description: >
  API 测试执行助手。帮助用户正确运行 Playwright API 测试脚本，
  自动检测并修复常见问题（编码、密码加密、语法错误等）。
license: MIT
metadata:
  version: "1.0.0"
  author: "UI Recorder Team"
  tags: ["api-testing", "playwright", "test-runner", "debug"]
triggers:
  - "运行 API 测试"
  - "跑一下 API 脚本"
  - "执行测试"
  - "回放 API 脚本"
  - "调试 API 脚本"
---

# API 测试执行助手

## 触发条件

当用户说以下内容时激活此 Skill：
- "运行 API 测试"
- "跑一下 API 脚本"
- "执行测试"
- "回放 API 脚本"

---

## 执行流程

### 第一步：读取脚本并检查

1. 读取 `ui-recorder-workspace/api-script.spec.js`
2. 自动检查以下问题：
   - ✅ 语法错误（非法字符、乱码等）
   - ✅ 编码问题（UTF-8 BOM、乱码日期等）
   - ✅ 密码加密（是否使用明文密码）
   - ✅ BASE_URL 是否正确

### 第二步：修复常见问题

#### 问题 1：乱码日期字符串

**症状**：脚本中有类似 `2026年6月4日 14:01:56` 的独立行
**修复**：删除这些行

#### 问题 2：密码未加密

**症状**：`password: "Test@123456"` 使用明文
**修复**：
```javascript
// ❌ 错误
password: "Test@123456"

// ✅ 正确（使用录制时捕获的加密密码）
password: "pEeuozeupzezoEW6qTiAqN=="
```

**如何获取加密密码**：
1. 检查 `ui-recorder-workspace/semantic-context.md` 中的密码
2. 或从 HAR 文件中提取

#### 问题 3：语法错误

**症状**：`SyntaxError: Identifier directly after number`
**修复**：检查文件末尾是否有非法字符串

### 第三步：运行测试

**标准运行命令**：

```powershell
# 1. 复制脚本到运行目录
Copy-Item "ui-recorder-workspace\api-script.spec.js" "ui-recorder-electron\replay-api-test.spec.js" -Force

# 2. 设置环境变量并运行
$env:ELECTRON_RUN_AS_NODE = "1"
Set-Location ui-recorder-electron
& ".\node_modules\electron\dist\electron.exe" ".\node_modules\@playwright\test\cli.js" test replay-api-test.spec.js --reporter=line
```

**重要**：
- 必须在 `ui-recorder-electron` 目录下运行
- 必须设置 `ELECTRON_RUN_AS_NODE=1`
- 不需要系统安装 Node.js

### 第四步：分析结果

根据测试结果：
- **全部通过** → 告知用户成功
- **部分失败** → 分析错误原因并修复
- **登录失败** → 检查密码是否加密

---

## 常见错误对照表

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Illegal base64 character` | 密码未加密 | 使用加密后的密码 |
| `Identifier directly after number` | 语法错误（乱码） | 删除非法字符 |
| `connect ECONNREFUSED` | 服务器未运行 | 检查 BASE_URL |
| `Cannot find module '@playwright/test'` | 在错误目录运行 | 在 ui-recorder-electron 下运行 |
| `No tests found` | 文件名不匹配 | 使用 replay-api-test.spec.js |

---

## 密码加密说明

CETA 系统要求密码加密传输：

**加密方式**：Base64 + 字符偏移

```javascript
function encryptPassword(inputString) {
  const char_map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const encoded = Buffer.from(inputString, 'utf-8').toString('base64');
  const result = [];
  for (const char of encoded) {
    const idx = char_map.indexOf(char);
    result.push(idx !== -1 ? char_map[(idx + 13) % 64] : char);
  }
  return result.join('');
}

// 示例
encryptPassword("Test@123456") // 输出加密后的密码
```

**最佳实践**：直接使用录制时捕获的加密密码，不要用明文。

---

## 快速检查清单

运行测试前，确认以下事项：

- [ ] 脚本文件无语法错误
- [ ] 密码已加密（不是明文）
- [ ] BASE_URL 指向正确的服务器
- [ ] 在 ui-recorder-electron 目录下运行
- [ ] 已设置 ELECTRON_RUN_AS_NODE=1

---

## 示例对话

**用户**：跑一下 API 脚本

**AI**：
```
我来帮你运行 API 测试脚本。

首先检查脚本... 
✅ 语法检查通过
⚠️ 发现问题：密码未加密

修复中... 已将明文密码替换为加密密码。

正在运行测试...

结果：
✅ 10 passed
⏭️ 2 skipped

测试通过！
```

---

## 注意事项

1. **永远不要直接运行未检查的脚本** - 先检查语法和编码
2. **密码必须加密** - CETA 系统不接受明文密码
3. **在正确目录运行** - 必须在 ui-recorder-electron 下
4. **使用 Electron 内置 Node** - 不依赖系统 Node.js
