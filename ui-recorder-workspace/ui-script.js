import { test, expect } from '@playwright/test';

test.use({
  serviceWorkers: 'block'
});

test('test', async ({ page }) => {
  await page.routeFromHAR('C:\\Users\\ADMIN\\Desktop\\CRM自动化\\CRM自动化\\network.har');
  await page.goto('https://bot.ceta.crm.duxing.cn/ui/login/basic?auth=basic');
  await page.getByRole('textbox', { name: '邮箱' }).click();
  await page.getByRole('textbox', { name: '邮箱' }).press('CapsLock');
  await page.getByRole('textbox', { name: '邮箱' }).fill('A');
  await page.getByRole('textbox', { name: '邮箱' }).press('CapsLock');
  await page.getByRole('textbox', { name: '邮箱' }).fill('Admin@bot.com');
  await page.getByRole('textbox', { name: '邮箱' }).press('Tab');
  await page.getByRole('textbox', { name: '密码' }).fill('bot');
  await page.getByRole('button', { name: '登 入' }).click();
});