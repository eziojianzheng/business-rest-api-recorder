---
name: ui-recorder
description: >
  Business REST API Recorder 调试工作流。处理 UI 脚本调试、API 脚本调试、语义脚本生成等任务。
  当用户提到 Business REST API Recorder、UI Recorder、调试脚本、semantic-context.md 时应激活此 SKILL。
license: MIT
metadata:
  version: "1.0.0"
  author: "CETA Team"
  tags: ["business-rest-api-recorder", "ui-recorder", "playwright", "debug", "semantic", "api-testing"]
  triggers:
    - "Business REST API Recorder"
    - "business-rest-api-recorder"
    - "UI Recorder"
    - "ui-recorder"
    - "调试 UI 脚本"
    - "调试 API 脚本"
    - "开始调试"
    - "semantic-context.md"
---

# Business REST API Recorder Debug SKILL

## 触发条件

当用户发送包含以下内容的消息时，激活此 SKILL：
- "我在用 Business REST API Recorder 调试 UI 脚本"
- "我在用 Business REST API Recorder 调试 API 脚本"
- "我在用 UI Recorder 调试 UI 脚本"
- "我在用 UI Recorder 调试 API 脚本"
- "business rest api recorder"、"ui recorder"、"ui-recorder"、"开始调试"

---

## 第一步：读取上下文

收到触发消息后，**立即**读取 `ui-recorder-workspace/debug-context.md`。

然后用以下格式回复（**必须展示全部 4 个选项，不能跳过**）：

```
我看到了你的 [UI/API] 脚本，共 X 个操作步骤。
[简要描述脚本做了什么，例如：登录流程，账号 xxx，密码 xxx]

⚠️ 检测到以下问题需要修复：
- [列出已知问题，如 routeFromHAR 绝对路径、中文选择器等]

你想怎么调试？

【1】增加校验并调试
     自动修复问题 + 加断言，然后回放验证

【2】生成多种测试案例并调试
     基于当前脚本生成边界案例（错误密码、空输入等），逐一回放

【3】直接调试（修复当前问题跑通）
     只修复已知问题，让脚本能跑起来

【4】自定义（告诉我你想做什么）
     描述你的需求，我来修改脚本
```

**等待用户回复选项编号后再执行，不要提前问其他问题。**

---

## 第二步：执行调试

### ⚠️ 环境说明（必读，避免踩坑）

**依赖位置**：`@playwright/test` 安装在 `ui-recorder-electron/node_modules/`，
不在工作区根目录，脚本里必须用：
```javascript
const { test, expect } = require('@playwright/test');
```

**运行方式**：不能直接 `npx playwright test <路径>`，因为路径含空格会失败。
正确做法：把脚本复制到 `ui-recorder-electron/` 目录下运行：
```powershell
Copy-Item "ui-recorder-workspace\ui-script.js" "ui-recorder-electron\test-run.spec.js" -Force
# 运行
cd ui-recorder-electron
node_modules\.bin\playwright test test-run.spec.js --reporter=line
# 清理
Remove-Item "ui-recorder-electron\test-run.spec.js"
```

**playwright.config.js**：`ui-recorder-electron/playwright.config.js` 已配置好，
`testMatch: ['test-run.spec.js']`，直接用即可。

---

### 选项 1：增加校验并调试

**步骤**：

1. 读取 `ui-recorder-workspace/ui-script.js`

2. **先修复常见问题**（见下方"常见坑"）

3. **询问 case 方向**：
   ```
   这个 case 是正向（验证操作成功）还是逆向（验证操作失败/系统拒绝）？
   ```
   - 正向 → 加成功断言（跳转、元素出现等）
   - 逆向 → 加失败断言（仍在原页面、错误提示出现等）

4. 根据回答加入对应断言，保存文件

5. 运行测试（用下方标准运行方式）

6. 根据结果循环修复，直到通过

7. 通过后询问用户是否确认

---

### 选项 2：生成多种测试案例并调试

1. 读取当前脚本，识别输入字段
2. 生成多个 `test()` 块，覆盖：正常流程、错误输入、边界值
3. 保存、运行、修复直到通过
4. 询问是否更新

---

### 选项 3：直接调试

1. 读取脚本，先修复常见问题（见下方）
2. 运行，根据报错修复
3. 循环直到通过
4. 询问是否更新

---

## ⚠️ 常见坑（必须在运行前检查）

### 坑1：routeFromHAR 绝对路径
**症状**：脚本里有 `page.routeFromHAR('C:\\Users\\...')`
**原因**：Playwright Codegen 自动生成的，路径是绝对路径，换机器就失败
**修复**：直接删除这两行
```javascript
// 删除这些
test.use({ serviceWorkers: 'block' });
await page.routeFromHAR('...');
```

### 坑2：选择器用了中文 name，但页面是英文
**症状**：`getByRole('textbox', { name: '邮箱' })` 找不到元素
**原因**：Codegen 录制时用了中文，但实际页面 label 是英文（如 Email）
**修复**：先用以下脚本探测实际元素：
```javascript
const { test } = require('@playwright/test');
test('check elements', async ({ page }) => {
  await page.goto('<URL>');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  // 检查 label
  const labels = await page.locator('label').all();
  for (const l of labels) console.log('Label:', await l.textContent());
  // 检查 input
  const inputs = await page.locator('input').all();
  for (let i = 0; i < inputs.length; i++) {
    const el = inputs[i];
    console.log(`Input[${i}]: id=${await el.getAttribute('id')}, placeholder=${await el.getAttribute('placeholder')}`);
  }
  // 检查按钮
  const btns = await page.locator('button').all();
  for (const b of btns) console.log('Button:', await b.textContent());
});
```
然后用 `#id` 或实际英文 name 替换选择器。

### 坑3：页面加载慢，元素还没出现
**症状**：`toBeVisible()` 超时，但手动看页面元素是存在的
**修复**：在 `goto` 后加等待
```javascript
await page.goto(url);
await page.waitForLoadState('networkidle');  // 等网络空闲
// 或者
await page.waitForTimeout(2000);  // 固定等 2 秒
```

### 坑4：@playwright/test 找不到
**症状**：`Cannot find module '@playwright/test'`
**修复**：在 `ui-recorder-electron` 目录下安装
```powershell
cd ui-recorder-electron
npm install @playwright/test --save-dev
```

### 坑5：测试名称乱码
**症状**：测试名显示为 `鐢ㄦ埛鐧诲綍` 等乱码
**原因**：文件编码问题，Windows 下 PowerShell 写文件默认 UTF-16
**修复**：用 `Out-File -Encoding utf8` 或直接用 Kiro 的 fsWrite 工具写文件

### 坑6：断言方向搞反
**症状**：登录后没有跳转，断言 `not.toHaveURL(/login/)` 失败
**最优路径**：不要直接报错，先问用户 **"这是正向 case 还是逆向 case？"**
- 正向 case（验证登录成功）→ `await expect(page).not.toHaveURL(/login/, { timeout: 10000 })`
- 逆向 case（验证错误账号密码登录失败）→ `await expect(page).toHaveURL(/login/, { timeout: 5000 })`

**经验**：用户录制的脚本很可能是逆向 case（故意用错误账号测试系统拒绝登录），遇到登录没跳转时优先询问而不是报错。

---

## 第三步：运行脚本（标准流程）

```powershell
# 1. 复制脚本到运行目录
Copy-Item "ui-recorder-workspace\ui-script.js" "ui-recorder-electron\test-run.spec.js" -Force

# 2. 运行（有界面）
Set-Location ui-recorder-electron
node_modules\.bin\playwright test test-run.spec.js --reporter=line

# 3. 清理
Remove-Item "ui-recorder-electron\test-run.spec.js" -ErrorAction SilentlyContinue
```

**结果处理**：
- ✅ `1 passed` → 进入第四步
- ❌ 失败 → 看错误信息，对照上方"常见坑"修复，最多尝试 3 次
- 3 次后告知用户当前状态

---

## 第四步：确认更新

```
✅ 脚本已通过！

修改摘要：
- [列出主要修改]

是否将修改后的脚本更新到 UI Recorder？
```

脚本已经保存在 `ui-recorder-workspace/ui-script.js`，Electron 工具会自动检测变化并更新界面。

---

## 快速参考

| 问题 | 解决方案 |
|------|---------|
| routeFromHAR 绝对路径 | 删除 routeFromHAR 和 serviceWorkers 两行 |
| 中文选择器找不到元素 | 运行探测脚本，用 #id 或英文 name 替换 |
| 页面加载慢 | 加 waitForLoadState('networkidle') |
| @playwright/test 找不到 | cd ui-recorder-electron && npm install @playwright/test --save-dev |
| 测试日志乱码 | spawn 时加 `chcp 65001 >nul &&`，并用 `d.toString('utf8')` |
| Playwright params 参数不生效 | 直接把 query string 拼到 URL 里，不用 `params` 选项 |
| 断言方向错误 | 登录失败用 toHaveURL(/login/)，登录成功用 not.toHaveURL(/login/) |

---

## 语义脚本生成流程

### 触发条件
当用户发送包含 `semantic-context.md` 的消息时，执行以下流程。

### 执行步骤

**第一步：读取并生成**

1. 读取 `ui-recorder-workspace/semantic-context.md`
2. 分析 UI 脚本和业务 API，生成语义脚本
3. 保存到 `ui-recorder-workspace/semantic-script.md`（Electron 自动检测并显示）

**第二步：生成完成后，询问用户**

生成并保存后，**必须**用以下格式询问：

```
✅ 语义脚本已生成并保存！

[用 2-3 句话总结：场景名称、核心业务流程、关键发现]

---

你有什么需要修改的吗？例如：
- 场景名称不准确
- 某个步骤的业务描述有误
- 需要补充某些信息
- API 的业务用途描述不对

直接告诉我，我来修改。
```

**第三步：根据用户反馈修改**

如果用户提出修改需求：
1. 理解用户的修改意图
2. 修改 `ui-recorder-workspace/semantic-script.md`
3. 保存文件
4. 回复：**"✅ 已更新语义脚本，[简述修改内容]。还有其他需要调整的吗？"**

如果用户说"没有"/"好的"/"可以"/"没问题"/"不需要修改"等确认语：
1. 写入确认文件 `ui-recorder-workspace/semantic-approved.flag`，内容为当前时间戳
2. 回复：**"✅ 语义脚本已确认！Electron 工具已解锁下一步，可以进入 API 脚本生成了。"**

```javascript
// 写入确认文件的内容格式
已确认时间: 2026/5/21 18:00:00
确认人: 用户
状态: approved
```

### 语义脚本质量要求

- **业务人员能看懂**：不用技术术语，用业务语言描述
- **关联操作和 API**：每个关键操作对应哪个接口
- **提取测试数据**：账号、填写的字段值、注意事项
- **识别异常**：登录失败、接口报错等需要特别标注
- **场景名称准确**：从操作和 API 推断真实的业务场景

---

## API 脚本常见坑

### 坑：密码加密问题
**症状**：登录接口返回 500，明文密码不被接受
**原因**：系统要求密码加密传输（AES/RSA），录制的 HAR 里密码已经是加密后的
**解决**：直接使用 `api-context.md` 里记录的加密密码，不要用明文
```javascript
// ❌ 错误：明文密码
password: 'standardformtest'

// ✅ 正确：使用录制时捕获的加密密码
password: 'pEeuozeupzezoEW6qTiAqN=='  // 从 api-context.md 的请求体里取
```

### 坑：test.describe 里变量无法跨 test 共享
**症状**：登录成功但后续测试 token 为空，返回 401
**原因**：`test.describe` 默认并行执行，`beforeAll` 设置的变量在各 test 里是独立的
**解决**：改用 `test.describe.serial` 确保串行执行
```javascript
// ❌ 错误
test.describe('场景名', () => { ... })

// ✅ 正确
test.describe.serial('场景名', () => { ... })
```

---

## API 脚本生成流程

### 触发条件
当用户发送包含 `api-context.md` 的消息时，执行以下流程。

### 执行步骤

**第一步：读取并生成**

1. 读取 `ui-recorder-workspace/api-context.md`
2. 分析语义脚本、UI 脚本和业务 API，生成 Playwright API 测试脚本
3. 保存到 `ui-recorder-workspace/api-script.spec.js`（Electron 自动检测并显示）

**第二步：生成完成后，询问用户**

生成并保存后，**必须**用以下格式询问：

```
✅ API 测试脚本已生成并保存！

**脚本概述**：
- 场景: [业务场景名称]
- 测试用例: X 个（按业务流程顺序组织）
- 测试框架: Playwright Test (CommonJS)

**核心流程**：
[列出主要测试用例]

**关键设计**：
- 使用 test.describe.serial 确保串行执行（token 共享）
- 登录时使用录制中捕获的加密密码
- 所有请求带上 Authorization 和 project_token header

---

Electron 工具应该已经自动检测到文件变化并显示了。你有什么需要修改的吗？
```

**第三步：根据用户反馈修改**

如果用户提出修改需求：

1. 理解用户的修改意图
2. **判断是否需要同步更新语义脚本**：
   - 如果修改涉及**业务流程变化**（如新增验证步骤、新增接口调用、修改测试数据）：
     - 先修改 `ui-recorder-workspace/semantic-script.md`，更新业务描述
     - 回复：**"✅ 已更新语义脚本，[简述修改内容]。"**
   - 如果修改仅涉及**技术层面**（如修复代码错误、调整等待时间、修改选择器）：
     - 无需更新语义脚本
3. 修改 `ui-recorder-workspace/api-script.spec.js`
4. 保存文件
5. 回复：**"✅ 已更新 API 脚本，[简述修改内容]。还有其他需要调整的吗？"**

**修改类型判断示例**：

| 用户需求 | 是否更新语义脚本 | 原因 |
|---------|----------------|------|
| "增加一个断言验证返回数据" | ✅ 是 | 新增了业务验证点 |
| "修复密码加密问题" | ❌ 否 | 纯技术修复，业务逻辑不变 |
| "增加一个删除数据的测试" | ✅ 是 | 新增了业务流程步骤 |
| "把等待时间从 2 秒改成 5 秒" | ❌ 否 | 纯技术调整 |
| "新增一个错误密码的测试案例" | ✅ 是 | 新增了业务场景（逆向测试）|
| "修复 token 传递问题" | ❌ 否 | 纯技术修复 |

如果用户说"没有"/"好的"/"可以"/"没问题"/"不需要修改"等确认语：
1. 回复以下内容，**引导用户回放脚本**：

```
✅ API 脚本已确认！

现在请在 Electron 工具中点击「回放 API 脚本」按钮，验证脚本能正常运行。

我会自动检测回放结果并继续下一步。
```

**第四步：自动检测回放结果**

用户点击回放后，Electron 会将结果写入 `ui-recorder-workspace/api-replay-result.json`。

**Kiro 需要轮询检查此文件**（每 2 秒检查一次，最多等待 5 分钟）：

```
读取 ui-recorder-workspace/api-replay-result.json
```

**检测到结果后**：

如果 `success: true`（回放通过）：
1. 回复以下内容，**引导用户保存脚本**：

```
🎉 恭喜！API 脚本回放通过！

现在可以在 Electron 工具中保存你的工作成果：
1. 点击「保存草稿」- 保存当前脚本文件到本地
2. 或点击「保存会话」- 保存完整会话（含录制数据）

保存后可以随时打开继续编辑或分享给团队成员。
```

如果 `success: false`（回放失败）：
1. 读取 `ui-recorder-workspace/debug-context.md` 获取详细错误信息
2. 根据错误类型（参见"API 脚本常见坑"）进行修复
3. 保存修改后的脚本
4. 提示用户再次回放验证

### 回放结果文件格式

```json
{
  "success": true,
  "code": 0,
  "timestamp": "2026-05-25T09:00:00.000Z",
  "message": "API 脚本回放通过"
}
```

### API 脚本质量要求

- **按业务流程组织**：登录 → 查询 → 创建/更新 → 验证
- **Token 正确传递**：accessToken 和 projectToken 需要在后续请求中使用
- **断言完整**：每个接口至少有状态码断言，关键接口有响应体断言
- **串行执行**：使用 `test.describe.serial` 确保 token 可跨 test 共享
- **使用加密密码**：登录接口使用录制时捕获的加密密码，不要用明文

### API 脚本生成示例结构

```javascript
const { test, expect, request } = require('@playwright/test');

const BASE_URL = 'https://example.com';
let apiContext;
let accessToken;
let projectToken;

test.describe.serial('业务场景名称', () => {
  
  test.beforeAll(async ({ playwright }) => {
    apiContext = await request.newContext({
      baseURL: BASE_URL,
      ignoreHTTPSErrors: true
    });
  });

  test('1. 登录系统', async () => {
    // 登录并提取 token
  });

  test('2. 查询列表', async () => {
    // 使用 token 查询数据
  });

  test('3. 创建数据', async () => {
    // 提交新数据
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });
});
```
