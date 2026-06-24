# UI Recorder Improvements - Playwright-Style Selectors

## 改进内容

### 1. 真正的 Playwright 风格选择器

之前的实现使用 CSS 选择器（如 `#id`, `.class`, `[placeholder="..."]`），现在改为 Playwright 推荐的 Locator API：

**之前**:
```javascript
await page.click('#login-button');
await page.fill('[placeholder="Username"]', 'admin');
```

**现在**:
```javascript
await page.getByRole('button', { name: 'Login' }).click();
await page.getByPlaceholder('Username').fill('admin');
```

### 2. 选择器优先级（符合 Playwright 最佳实践）

1. **data-testid** - `getByTestId('submit-btn')` - 最稳定，推荐用于测试
2. **role** - `getByRole('button', { name: 'Submit' })` - 语义化，可访问性好
3. **text** - `getByText('Click me')` - 适用于按钮、链接、标签
4. **placeholder** - `getByPlaceholder('Enter email')` - 适用于输入框
5. **label** - `getByLabel('Email address')` - 适用于表单字段
6. **id** - `locator('#email')` - 传统方式
7. **name** - `locator('[name="email"]')` - 表单字段
8. **CSS** - `locator('button.primary')` - 最后的备选方案

### 3. 输入防抖（Debouncing）

**问题**: 之前每次按键都会记录一次，导致生成的脚本像这样：
```javascript
await page.fill('#username', 'a');
await page.fill('#username', 'ad');
await page.fill('#username', 'adm');
await page.fill('#username', 'admi');
await page.fill('#username', 'admin');
```

**解决**: 现在使用 1 秒防抖，只记录最终值：
```javascript
await page.getByPlaceholder('Username').fill('admin');
```

### 4. 点击去重

**问题**: 500ms 内对同一元素的重复点击会被记录多次

**解决**: 现在会自动忽略 500ms 内的重复点击

### 5. 智能合并连续输入

**问题**: 同一个输入框的多次输入会生成多条记录

**解决**: 现在会自动合并同一输入框的连续输入，只保留最后一次

## 技术实现

### ARIA Role 映射

实现了完整的 HTML 标签到 ARIA role 的映射：

```javascript
const tagRoleMap = {
    'BUTTON': 'button',
    'A': 'link',
    'INPUT': getInputRole(element),  // 根据 type 动态判断
    'TEXTAREA': 'textbox',
    'SELECT': 'combobox',
    'IMG': 'img',
    'H1-H6': 'heading',
    'NAV': 'navigation',
    'MAIN': 'main',
    'ASIDE': 'complementary',
    'FOOTER': 'contentinfo',
    'HEADER': 'banner'
};
```

### Accessible Name 提取

按优先级提取元素的可访问名称：

1. `aria-label` 属性
2. `aria-labelledby` 引用的元素
3. 关联的 `<label>` 元素
4. 按钮/链接的文本内容
5. `placeholder` 属性
6. `title` 属性

### 输入防抖实现

```javascript
const inputTimers = new Map();

document.addEventListener('input', (e) => {
    const element = e.target;
    const selector = generatePlaywrightSelector(element);
    
    // 清除之前的定时器
    if (inputTimers.has(selector)) {
        clearTimeout(inputTimers.get(selector));
    }
    
    // 设置新的定时器：1 秒后记录最终值
    const timer = setTimeout(() => {
        recordAction({
            name: 'fill',
            selector: selector,
            value: element.value
        });
        inputTimers.delete(selector);
    }, 1000);
    
    inputTimers.set(selector, timer);
});
```

## 生成的脚本示例

### 登录场景

```javascript
import { test, expect } from '@playwright/test';

test('recorded scenario', async ({ page }) => {
  // 导航到页面
  await page.goto('https://example.com/login');

  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password').fill('your_password');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // 验证登录成功
  await page.getByRole('heading', { name: 'Dashboard' }).click();
});
```

### 表单填写场景

```javascript
test('fill form', async ({ page }) => {
  await page.goto('https://example.com/register');

  await page.getByLabel('Email address').fill('user@example.com');
  await page.getByLabel('Full name').fill('John Doe');
  await page.getByRole('combobox', { name: 'Country' }).selectOption('US');
  await page.getByTestId('terms-checkbox').check();
  await page.getByRole('button', { name: 'Sign up' }).click();
});
```

## 与 Playwright Codegen 的对比

### Playwright Codegen (CLI)
- ✅ 官方工具，100% 原生
- ✅ 生成的选择器最优
- ❌ 无法嵌入到 Electron 应用
- ❌ 无法关联 API 调用
- ❌ 无法生成语义脚本

### 我们的实现
- ✅ 可嵌入到 Electron 应用
- ✅ 可关联 API 调用
- ✅ 可生成语义脚本
- ✅ 使用 Playwright 推荐的选择器策略
- ✅ 生成的脚本与 Playwright Codegen 风格一致
- ⚠️ 选择器生成逻辑是自己实现的（但遵循 Playwright 最佳实践）

## 注意事项

虽然我们的实现使用了 Playwright 的选择器风格和最佳实践，但它不是 Playwright Codegen 的直接嵌入。Playwright Codegen 是一个 CLI 工具，无法直接嵌入到 Electron 应用中。

我们的实现：
1. 使用 Playwright 的 `page.addInitScript()` 注入录制脚本
2. 使用 Playwright 的 `page.exposeFunction()` 接收录制事件
3. 遵循 Playwright 的选择器优先级和命名规范
4. 生成的脚本可以直接在 Playwright 中运行

这是目前在 Electron 应用中实现 Playwright 风格录制的最佳方案。
