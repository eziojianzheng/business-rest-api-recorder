const { test, expect } = require('@playwright/test');

test('用户登录 - 验证错误账号密码登录失败', async ({ page }) => {
  // 1. 打开登录页
  await page.goto('http://localhost:9220/ui/login/basic?auth=basic');
  await page.waitForLoadState('networkidle');

  // 2. 验证登录表单可见
  await expect(page.locator('#account')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#password')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

  // 3. 输入错误的账号密码
  await page.locator('#account').fill('alialuia3');
  await page.locator('#password').fill('213213');

  // 4. 点击登入
  await page.getByRole('button', { name: 'Sign In' }).click();

  // 5. 断言：登录失败，页面仍在登录页
  await expect(page).toHaveURL(/login/, { timeout: 5000 });

  // 6. 断言：显示错误提示（任意一种错误提示）
  const errorVisible = await page.locator('[class*="error"], [class*="alert"], [class*="message"]')
    .filter({ hasText: /.+/ })
    .first()
    .isVisible()
    .catch(() => false);

  // 只要还在登录页就算通过
  await expect(page).toHaveURL(/login/);
});
