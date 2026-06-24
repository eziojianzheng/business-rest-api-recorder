# UI Recorder - 语义脚本生成请求

**时间**: 2026/6/5 15:30:42
**输出文件**: `C:\Users\ADMIN\Desktop\CRM自动化\CRM自动化\semantic-script.md`

## UI 脚本
```javascript
import { test, expect } from '@playwright/test';

test.use({
  serviceWorkers: 'block'
});

test('test', async ({ page }) => {
  await page.routeFromHAR('C:\\Users\\ADMIN\\Desktop\\CRM自动化\\CRM自动化\\network.har');
  await page.goto('https://bot.ceta.crm.duxing.cn/ui/login/basic?auth=basic');
  await page.getByRole('textbox', { name: '邮箱' }).click();
  await page.getByRole('textbox', { name: '邮箱' }).click();
  await page.getByRole('textbox', { name: '邮箱' }).fill('jinjin.zhang@bizops.com.cn');
  await page.getByRole('textbox', { name: '密码' }).click();
  await page.getByRole('textbox', { name: '密码' }).fill('Test@123456');
  await page.getByRole('button', { name: '登 入' }).click();
  await page.getByRole('link', { name: '语音管理（组织树）' }).click();
  await page.getByRole('button', { name: '新增' }).click();
  await page.getByRole('link', { name: '历史录音' }).click();
  await page.getByRole('button', { name: '生成线索' }).click();
  await page.getByRole('link', { name: '商机管理' }).click();
  await page.getByRole('button').nth(5).click();
  await page.locator('#cell-ACTION_COLUMN-179').getByRole('button', { name: '编辑' }).click();
});
```

## 业务 API 列表
共 45 个业务接口：

1. `GET /user-management/api/login/config` → 200
2. `POST /user-management/api/user/login` → 200
   请求体字段: password, username, email, captcha
3. `GET /user-management/api/user/get-user-info` → 200
4. `GET /form/api/v2/form-entity-data/user-management-new/system-user-form/163` → 200
5. `GET /flow/api/flow-rest/general-ai-agent/greeting` → 200
6. `GET /form/api/form-entity-page/get-by-schema-id/dashboard/standard-dashboard` → 200
7. `POST /form/api/v3/form-entity-data/dashboard/banner-form/list` → 200
8. `GET /flow/api/flow-rest/activity-count-statistics-flow` → 200
9. `GET /flow/api/flow-rest/customer-statistics-flow` → 200
10. `GET /flow/api/flow-rest/contact-statistics-flow` → 200
11. `GET /flow/api/flow-rest/opportunity-statistics-flow` → 200
12. `POST /flow/api/flow-rest/annual-business-line-chart-flow` → 200
13. `POST /flow/api/flow-rest/opportunity-stage-distribution-flow` → 200
14. `GET /form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
15. `GET /form/api/v2/form-entity-data/basic-system-setting/self-organization-info-form/list` → 200
16. `GET /form/api/v2/form-entity-data/product-management/product-management-form/list` → 200
17. `GET /form/api/v2/form-entity-data/basic-system-setting/data-dictionary/list` → 200
18. `GET /form/api/v2/form-entity-data/lead-management/lead-management-form/list` → 200
19. `GET /form/api/v2/form-entity-data/quotation-management/opportunity-product-management-subform-form/list` → 200
20. `GET /form/api/form-entity-page/get-by-schema-id/crm/tianbang-voice-summary-table-form-list-flow` → 200
21. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow
22. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-page` → 200
23. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-mobile-page` → 200
24. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow, filterModel, selectColId
25. `POST /flow/api/flow-rest/meeting-file-to-clue-flow` → 200
   请求体字段: audioFile, myOrgId, title, voiceType, flowInstanceId
26. `GET /form/api/form-entity-page/get-by-schema-id/opportunity-management/opportunity-management-form-list` → 200
27. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
28. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
29. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
30. `GET /form/api/v2/form-entity-layout/opportunity-management/opportunity-management-form/edit/schema-json` → 200
31. `GET /form/api/v2/form-entity/opportunity-management/opportunity-management-form` → 200
32. `GET /form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/20210` → 200
33. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, needCount
34. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
35. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
36. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
37. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
38. `POST /form/api/v3/form-entity-data/contact-management/contact-management-form/list` → 200
   请求体字段: needCount
39. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
40. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
41. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
42. `POST /form/api/v3/form-entity-data/opportunity-management/meddic-analysis-form/list` → 200
   请求体字段: filterModel
43. `POST /form/api/v3/form-entity-data/opportunity-management/ai-suggestion-form/list` → 200
   请求体字段: filterModel
44. `POST /form/api/v3/form-entity-data/opportunity-management/risk-factor-form/list` → 200
   请求体字段: filterModel
45. `POST /flow/api/flow-rest/quotation-amount-calculation-flow` → 200
   请求体字段: formDataId

## 你的任务

请根据上面的 UI 脚本和业务 API，生成一份**业务语义脚本**，要求：

1. **用自然语言描述业务流程**（不是技术描述，是业务人员能看懂的）
2. **推断业务场景名称**（如：新增学生信息、用户登录、查询订单等）
3. **描述每个操作步骤的业务含义**（不是"点击按钮"，而是"用户发起新增操作"）
4. **关联 UI 操作和 API 调用**（说明哪个操作触发了哪个接口）
5. **提取测试数据**（录制时用的账号、填写的字段值等）

输出格式为 Markdown，保存到：
`C:\Users\ADMIN\Desktop\CRM自动化\CRM自动化\semantic-script.md`

保存后 Electron 工具会自动检测并显示。