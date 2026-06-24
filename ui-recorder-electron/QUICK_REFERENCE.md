# UI Recorder 快速参考

## 🎯 核心改进

### 1. Playwright 风格选择器

| 之前 | 现在 |
|------|------|
| `page.click('#login')` | `page.getByRole('button', { name: 'Login' }).click()` |
| `page.fill('[placeholder="Email"]', 'test@example.com')` | `page.getByPlaceholder('Email').fill('test@example.com')` |
| `page.click('button.primary')` | `page.getByRole('button', { name: 'Submit' }).click()` |

### 2. 输入防抖（1 秒）

| 之前 | 现在 |
|------|------|
| 记录每次按键（10+ 行） | 只记录最终值（1 行） |
| `fill('a')` → `fill('ad')` → `fill('adm')` → ... | `fill('admin')` |

### 3. 点击去重（500ms）

| 之前 | 现在 |
|------|------|
| 记录所有点击 | 忽略重复点击 |
| `click()` → `click()` → `click()` | `click()` |

## 📋 选择器优先级

```
1. data-testid    → getByTestId('submit-btn')
2. role + name    → getByRole('button', { name: 'Submit' })
3. text           → getByText('Click me')
4. placeholder    → getByPlaceholder('Enter email')
5. label          → getByLabel('Email address')
6. id             → locator('#email')
7. name           → locator('[name="email"]')
8. CSS            → locator('button.primary')
```

## 🚀 快速开始

```bash
# 1. 启动工具
cd ui-recorder-electron
npm start

# 2. 输入 URL 并点击"开始录制"

# 3. 在浏览器中操作

# 4. 点击"停止录制"查看脚本
```

## 📝 生成的脚本示例

### UI 测试脚本（Playwright）

```javascript
import { test, expect } from '@playwright/test';

test('login', async ({ page }) => {
  await page.goto('https://example.com/login');
  
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByRole('button', { name: 'Login' }).click();
  
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

### API 测试脚本（Python）

```python
import requests

def test_login():
    response = requests.post(
        'https://example.com/api/auth/login',
        json={'username': 'admin', 'password': 'password123'}
    )
    assert response.status_code == 200
    assert 'token' in response.json()
```

### 语义脚本（Markdown）

```markdown
## 场景 1: 用户登录

#### 步骤 1: 输入用户名
**UI 操作**: `page.getByPlaceholder('Username').fill("admin")`

#### 步骤 2: 输入密码
**UI 操作**: `page.getByPlaceholder('Password').fill("password123")`

#### 步骤 3: 点击登录按钮
**UI 操作**: `page.getByRole('button', { name: 'Login' }).click()`

**触发的 API 调用**:
- `POST /api/auth/login`
  - 状态: 200
```

## 🎨 窗口布局

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  浏览器窗口 (60%)          │  Electron 窗口 (40%)           │
│                             │                                 │
│  [用户操作的页面]          │  [录制控制面板]                │
│                             │  - URL 输入                     │
│                             │  - 开始/停止按钮                │
│                             │  - 脚本预览                     │
│                             │    • UI 测试脚本                │
│                             │    • API 测试脚本               │
│                             │    • 语义脚本                   │
│                             │                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 配置选项

### 调整输入防抖延迟

在 `main-playwright.js` 中修改：

```javascript
const timer = setTimeout(() => {
    recordAction({ ... });
}, 1000);  // 改为你想要的毫秒数
```

### 调整点击去重延迟

在 `main-playwright.js` 中修改：

```javascript
if ((now - new Date(lastAction.timestamp).getTime()) < 500) {
    // 改为你想要的毫秒数
    return;
}
```

## 📊 性能对比

| 指标 | 之前 | 现在 | 改进 |
|------|------|------|------|
| 脚本行数（输入场景） | 50+ | 3 | **94% ↓** |
| 选择器稳定性 | 低（CSS 类名） | 高（语义化） | **显著提升** |
| 可读性 | 差 | 优秀 | **显著提升** |
| 录制响应 | 即时 | 即时 | 相同 |

## 🎓 最佳实践

### 1. 为测试添加 data-testid

```html
<!-- 推荐 -->
<button data-testid="submit-btn">Submit</button>

<!-- 生成的选择器 -->
page.getByTestId('submit-btn')
```

### 2. 使用语义化 HTML

```html
<!-- 推荐 -->
<button>Login</button>
<input placeholder="Email" />
<label>Password <input type="password" /></label>

<!-- 不推荐 -->
<div class="btn" onclick="login()">Login</div>
<input class="input-field" />
```

### 3. 等待输入完成

录制时，输入完成后等待 1 秒再进行下一步操作，确保输入被正确记录。

### 4. 避免快速重复点击

如果需要记录多次点击，每次点击之间间隔至少 500ms。

## 🐛 常见问题

### Q: 为什么有些选择器还是 `locator()`？

A: 当元素没有语义属性时，会降级使用 CSS 选择器。建议添加 `data-testid`。

### Q: 输入没有被记录？

A: 等待 1 秒让防抖完成。如果还是没有，检查元素是否是 `<input>` 或 `<textarea>`。

### Q: 点击被忽略了？

A: 检查是否在 500ms 内重复点击了同一个元素。

### Q: 这是真正的 Playwright Codegen 吗？

A: 不是，但遵循 Playwright 的规范和最佳实践。详见 `PLAYWRIGHT_NATIVE_EXPLANATION.md`。

## 📚 相关文档

- `IMPROVEMENTS.md` - 详细的改进说明
- `TESTING_GUIDE.md` - 完整的测试指南
- `PLAYWRIGHT_NATIVE_EXPLANATION.md` - 与 Playwright Codegen 的对比
- `PLAYWRIGHT-CHANNELS.md` - 使用系统浏览器的说明

## 🔗 有用的链接

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Codegen](https://playwright.dev/docs/codegen)
- [ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

## 💡 提示

- 录制前先规划好操作流程
- 使用有意义的 URL 和操作
- 录制完成后检查生成的脚本
- 必要时手动优化选择器
- 结合 API 脚本进行快速测试

## 🎉 核心价值

1. **快速**: 自动生成测试脚本，无需手写
2. **准确**: 使用 Playwright 推荐的选择器
3. **完整**: UI + API + 语义，三合一
4. **高效**: API 测试比 UI 测试快 20 倍
