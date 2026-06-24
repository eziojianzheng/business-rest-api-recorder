# UI Recorder - Kiro AI Context

**Session**: session-1780543411416
**URL**: https://bot.ceta.crm.duxing.cn/ui/login/
**Current Step**: record

## Files
- UI Script: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\ui-script.js`
- HAR Network: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\network.har`
- Semantic: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\semantic-script.md`
- API Script: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\api-script.spec.js`

## Summary
- UI Steps: 86
- Total APIs: 383
- Business APIs: 260

## Business API List
- GET /ui/login/
- GET /ui/bot-config.js
- GET /ui/js/main.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/css/main.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.css
- GET /ui/packages/ag-grid@33.3.2/ag-grid.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/js/aiAgentV2.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js
- GET /ui/js/aiAgent.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js
- GET /ui/packages/reactflow@11.8.3/reactflow.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/packages/@wangeditor@5.0.1/@wangeditor.a88ee666-33f2-4bd7-af60-8bd72c85da4a.bundle.js
- GET /ui/js/markdown.a88ee666-33f2-4bd7-af60-8bd72c85da4a.chunk.js

## Current UI Script
```javascript
import { test, expect } from '@playwright/test';

test.use({
  serviceWorkers: 'block'
});

test('test', async ({ page }) => {
  await page.routeFromHAR('C:\\Users\\jianz\\OneDrive - 知微行易（上海）智能科技有限公司\\桌面\\CETATest\\ceta-skills-windows-amd64-2.0.27\\ceta-ai-skills-windows-amd64\\ceta-ai-skills\\ui-recorder-workspace\\network.har');
  await page.goto('https://bot.ceta.crm.duxing.cn/ui/login/basic?auth=basic');
  await page.getByRole('textbox', { name: '邮箱' }).click();
  await page.getByRole('textbox', { name: '邮箱' }).fill('jinjin.zhang@bizops.com.cn');
  await page.getByRole('textbox', { name: '密码' }).click();
  await page.getByRole('textbox', { name: '密码' }).fill('Test@123456');
  await page.getByRole('button', { name: '登 入' }).click();
  await page.getByRole('button', { name: '登 入' }).click();
  await page.locator('path').first().click();
  await page.getByRole('link', { name: '语音管理（组织树）' }).click();
  await page.getByRole('button', { name: '新增' }).click();
  await page.getByRole('link', { name: '历史录音' }).click();
  await page.getByRole('button', { name: '生成线索' }).click();
  await page.getByRole('link', { name: '线索管理' }).click();
  await page.getByRole('button', { name: '编 辑' }).click();
  await page.locator('#region').click();
  await page.locator('#region').fill('华南');
  await page.locator('.ant-select-selection-overflow').click();
  await page.locator('#rc_select_2').fill('客户');
  await page.getByText('客户介绍').click();
  await page.getByRole('button', { name: '新建客户' }).click();
  await page.locator('#customerNameSearch').click();
  await page.locator('#customerNameSearch').fill('自动化测试客户');
  await page.getByRole('dialog').getByRole('button', { name: '提 交' }).click();
  await page.getByRole('button', { name: '转化为商机' }).click();
  await page.locator('#opportunityName').click();
  await page.locator('#opportunityName').fill('自动化测试机会');
  await page.getByRole('textbox', { name: '请选择日期' }).click();
  await page.getByText('1', { exact: true }).first().click();
  await p
... (truncated)
```