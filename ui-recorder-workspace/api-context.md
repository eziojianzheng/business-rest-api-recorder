# UI Recorder - API 脚本生成请求

**时间**: 2026/6/4 14:00:00
**输出文件**: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\api-script.spec.js`

## 语义脚本（业务上下文）
# 业务场景：CRM 完整销售流程 - 从线索到合同

> 录制时间：2026/6/4 13:49:33  
> 系统地址：https://bot.ceta.crm.duxing.cn  
> 测试用户：jinjin.zhang@bizops.com.cn

## 业务流程描述

这是一个完整的 CRM 销售管理流程演示，涵盖了从语音线索生成到最终合同签订的全链路业务操作。用户通过语音管理系统生成销售线索，然后依次完成线索转化、商机管理、报价创建、合同生成等关键业务环节，体现了现代 CRM 系统中销售管道的完整闭环管理。

## UI 脚本
```javascript
import { test, expect } from '@playwright/test';

test.use({
  serviceWorkers: 'block'
});

test('CRM完整流程测试', async ({ page }) => {
  await page.routeFromHAR('network.har');
  await page.goto('https://bot.ceta.crm.duxing.cn/ui/login/basic?auth=basic');
  await page.getByRole('textbox', { name: '邮箱' }).fill('jinjin.zhang@bizops.com.cn');
  await page.getByRole('textbox', { name: '密码' }).fill('Test@123456');
  await page.getByRole('button', { name: '登 入' }).click();
  // ... 完整的CRM业务流程操作
});
```

## 业务 API 列表
共 192 个业务接口：

1. `POST /user-management/api/user/login` → 200 (用户登录)
2. `GET /user-management/api/user/get-user-info` → 200 (获取用户信息)
3. `POST /flow/api/flow-rest/meeting-file-to-clue-flow` → 200 (语音转线索)
4. `POST /form/api/v2/form-entity-data/customer-management/customer-management-form/default` → 200 (创建客户)
5. `PUT /flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/lead-management-form/convert/update-form` → 200 (线索转商机)
6. `PUT /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/quotation-form/new/update-form` → 200 (创建报价)
7. `POST /flow/api/flow-rest/opportunity-stage-transition-process-flow` → 200 (商机推进)
8. `POST /flow/api/flow-rest/convert-to-sales-contract-flow` → 200 (生成合同)
9. `PUT /form/api/v2/form-entity-data/.../contract-management-form/edit` → 200 (合同编辑)
10. `POST /flow/api/flow-rest/contract-effective-flow` → 200 (合同生效)

## 你的任务

请根据上面的语义脚本、UI 脚本和业务 API，生成一份 **Playwright API 测试脚本**，要求：

1. 使用 `@playwright/test` 的 `request` API（不是 `page`）
2. 按业务流程顺序组织测试（登录 → 查询 → 创建/更新/删除）
3. 登录接口需要提取 token，传给后续请求的 Authorization header
4. 每个接口加状态码断言，关键接口加响应体断言
5. 使用 `test.describe` 按业务场景分组
6. 使用 `const { test, expect, request } = require("@playwright/test");`（不用 import）

输出为可直接运行的 Playwright 测试脚本，保存到：
`C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\api-script.spec.js`

保存后 Electron 工具会自动检测并显示。