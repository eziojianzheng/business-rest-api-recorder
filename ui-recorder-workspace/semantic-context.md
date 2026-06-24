# UI Recorder - 语义脚本生成请求

**时间**: 2026/6/4 13:49:33
**输出文件**: `C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\semantic-script.md`

## UI 脚本
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
  await page.locator('#expectedAmount').click();
  await page.locator('#expectedAmount').fill('1200');
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('56');
  await page.getByLabel('线索管理').getByRole('button', { name: '提 交' }).click();
  await page.getByRole('button').nth(5).click();
  await page.locator('#cell-ACTION_COLUMN-686 > .table-action-cell > a > .ant-btn').first().click();
  await page.getByRole('menuitem', { name: 'ellipsis' }).click();
  await page.getByRole('link', { name: '报价管理' }).click();
  await page.getByRole('button', { name: '新增' }).click();
  await page.locator('input[name="quoteDate"]').click();
  await page.getByText('1', { exact: true }).nth(1).click();
  await page.locator('input[name="validUntil"]').click();
  await page.getByText('1', { exact: true }).nth(3).click();
  await page.locator('#rc_select_33').click();
  await page.locator('#rc_select_33_list_0').getByText('自动化测试机会').click();
  await page.locator('#rc_select_35').click();
  await page.locator('#rc_select_35').fill('sales');
  await page.locator('#rc_select_35_list_0').getByText('Sales Director').click();
  await page.getByRole('button', { name: '新增行' }).click();
  await page.locator('#productSubtable').getByRole('combobox').click();
  await page.locator('#rc_select_36').press('CapsLock');
  await page.locator('#rc_select_36').fill('CRM');
  await page.locator('#rc_select_36').press('CapsLock');
  await page.getByText('CetaCRM', { exact: true }).click();
  await page.locator('.ag-row-even.ag-row.ag-row-level-0.ag-row-position-absolute.ag-row-first.ag-row-last > div:nth-child(7)').click();
  await page.getByRole('row', { name: 'CetaCRM 1,788 人民币 按年 Increase' }).getByRole('spinbutton').fill('2');
  await page.locator('div').filter({ hasText: /^CetaCRM1,788人民币按年$/ }).nth(1).click();
  await page.getByRole('gridcell').filter({ hasText: /^$/ }).nth(5).dblclick();
  await page.getByRole('gridcell', { name: 'Increase Value Decrease Value' }).getByRole('spinbutton').fill('1');
  await page.locator('div').filter({ hasText: /^CetaCRM1,788%人民币按年20$/ }).nth(1).click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').click();
  await page.getByRole('spinbutton').fill('6');
  await page.getByRole('button', { name: '提交审批' }).click();
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(2).click();
  await page.getByRole('link', { name: '商机管理' }).click();
  await page.locator('#cell-ACTION_COLUMN-783').getByRole('button', { name: '编辑' }).click();
  await page.getByRole('tab', { name: '相关' }).click();
  await page.getByRole('button', { name: '报价' }).click();
  await page.getByRole('tab', { name: '基本信息' }).click();
  await page.getByTitle('初步判断').click();
  await page.getByText('赢单', { exact: true }).click();
  await page.locator('#contractNumber').click();
  await page.locator('#contractNumber').fill('contract自动化测试编号');
  await page.getByRole('button', { name: '提交审批' }).click();
  await page.getByRole('button').nth(5).click();
  await page.getByRole('button').nth(5).click();
  await page.locator('#cell-ACTION_COLUMN-1056').getByRole('button', { name: '生成销售合同' }).click();
  await page.locator('.anticon > svg').click();
  await page.getByRole('link', { name: '合同管理' }).click();
  await page.locator('#cell-ACTION_COLUMN-1297').getByRole('button', { name: '查看' }).click();
  await page.getByRole('button', { name: '取 消' }).first().click();
  await page.locator('#cell-ACTION_COLUMN-1505').getByRole('button', { name: '编辑' }).click();
  await page.locator('#partyBName').click();
  await page.locator('#partyBName').fill('自动化测试乙方');
  await page.getByRole('button', { name: '生 效' }).click();
});
```

## 业务 API 列表
共 192 个业务接口：

1. `GET /user-management/api/login/config` → 200
2. `POST /user-management/api/user/login` → -1
   请求体字段: password, username, email, captcha
3. `POST /user-management/api/user/login` → 200
   请求体字段: password, username, email, captcha
4. `GET /user-management/api/user/get-user-info` → 200
5. `GET /form/api/v2/form-entity-data/user-management-new/system-user-form/163` → 200
6. `GET /flow/api/flow-rest/general-ai-agent/greeting` → 200
7. `GET /form/api/form-entity-page/get-by-schema-id/dashboard/standard-dashboard` → 200
8. `POST /form/api/v3/form-entity-data/dashboard/banner-form/list` → 200
9. `GET /flow/api/flow-rest/activity-count-statistics-flow` → 200
10. `GET /flow/api/flow-rest/customer-statistics-flow` → 200
11. `GET /flow/api/flow-rest/contact-statistics-flow` → 200
12. `GET /flow/api/flow-rest/opportunity-statistics-flow` → 200
13. `POST /flow/api/flow-rest/annual-business-line-chart-flow` → 200
14. `POST /flow/api/flow-rest/opportunity-stage-distribution-flow` → 200
15. `GET /form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
16. `GET /form/api/v2/form-entity-data/basic-system-setting/self-organization-info-form/list` → 200
17. `GET /form/api/v2/form-entity-data/product-management/product-management-form/list` → 200
18. `GET /form/api/v2/form-entity-data/basic-system-setting/data-dictionary/list` → 200
19. `GET /form/api/v2/form-entity-data/lead-management/lead-management-form/list` → 200
20. `GET /form/api/v2/form-entity-data/quotation-management/opportunity-product-management-subform-form/list` → 200
21. `GET /form/api/form-entity-page/get-by-schema-id/crm/tianbang-voice-summary-table-form-list-flow` → 200
22. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow
23. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-page` → 200
24. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-mobile-page` → 200
25. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow, filterModel, selectColId
26. `POST /flow/api/flow-rest/meeting-file-to-clue-flow` → 200
   请求体字段: audioFile, myOrgId, title, voiceType, flowInstanceId
27. `GET /form/api/form-entity-page/get-by-schema-id/lead-management/lead-management-form-list` → 200
28. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
29. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
30. `DELETE /form/api/v2/form-entity-data/lead-management/lead-management-form/19881` → 200
31. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
32. `DELETE /form/api/v2/form-entity-data/lead-management/lead-management-form/19885` → 200
33. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
34. `DELETE /form/api/v2/form-entity-data/lead-management/lead-management-form/19887` → 200
35. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
36. `DELETE /form/api/v2/form-entity-data/lead-management/lead-management-form/19890` → 200
37. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
38. `DELETE /form/api/v2/form-entity-data/lead-management/lead-management-form/19848` → 200
39. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
40. `GET /form/api/form-entity-page/get-by-schema-id/crm/tianbang-voice-summary-table-form-list-flow` → 200
41. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow
42. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-page` → 200
43. `GET /form/api/form-entity-page/get-by-schema-id/crm/record-mobile-page` → 200
44. `POST /form/api/v3/form-entity-data/crm/voice-summary-table-form/list` → 200
   请求体字段: startRow, endRow, filterModel, selectColId
45. `POST /flow/api/flow-rest/meeting-file-to-clue-flow` → 200
   请求体字段: audioFile, myOrgId, title, voiceType, flowInstanceId
46. `GET /form/api/form-entity-page/get-by-schema-id/lead-management/lead-management-form-list` → 200
47. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
48. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, selectColId
49. `GET /form/api/v2/form-entity-layout/lead-management/lead-management-form/edit/schema-json` → 200
50. `GET /form/api/v2/form-entity/lead-management/lead-management-form` → 200
51. `GET /form/api/v2/form-entity-data/lead-management/lead-management-form/19892` → 200
52. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
53. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
54. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
55. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
56. `POST /form/api/v3/form-entity-data/lead-management/campaign-form/list` → 200
   请求体字段: needCount
57. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: needCount
58. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
59. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
60. `GET /flow/api/flow-rest/lead-recent-interaction-time-flow` → 200
61. `POST /form/api/v3/form-entity-data/lead-management/spin-sales-analysis-form/list` → 200
   请求体字段: filterModel
62. `POST /form/api/v3/form-entity-data/lead-management/ai-suggestion-form/list` → 200
   请求体字段: filterModel
63. `POST /form/api/v3/form-entity-data/lead-management/clue-tag-form/list` → 200
   请求体字段: filterModel
64. `GET /form/api/v2/form-entity-layout/customer-management/customer-management-form/default/schema-json` → 200
65. `GET /form/api/v2/form-entity/customer-management/customer-management-form` → 200
66. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
67. `GET /form/api/v2/form-entity-data/get-tree-form-data/ORG` → 200
68. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
69. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
70. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
71. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: filterModel, needCount
72. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
73. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
74. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
75. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → -1
   请求体字段: filterModel, needCount
76. `POST /flow/api/flow-rest/fuzzy-search-flow` → -1
   请求体字段: customerNameSearch
77. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → -1
   请求体字段: filterModel, needCount
78. `POST /flow/api/flow-rest/fuzzy-search-flow` → 200
   请求体字段: customerNameSearch
79. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: filterModel, needCount
80. `POST /form/api/v2/form-entity-data/customer-management/customer-management-form/default` → 200
   请求体字段: customerOwner, creator, myUserId, myOrgId, customerName
81. `PUT /form/api/v2/form-entity-data/19892/lead-management/lead-management-form/edit` → 200
   请求体字段: leadOwner, leadScoring, myOrgId, leadScoringBudget, spinCorrectionDetails
82. `GET /flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/get-form` → 200
83. `GET /form/api/v2/form-entity-layout/lead-management/lead-management-form/convert/schema-json` → 200
84. `GET /form/api/v2/form-entity/lead-management/lead-management-form` → 200
85. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
86. `GET /flow/api/flow-rest/sdk-default-settings-flow` → 200
87. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
88. `PUT /flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/lead-management-form/convert/update-form` → 200
   请求体字段: convertToOpportunity, myOrgId, leadScoringBudget, spinCorrectionDetails, nReason
89. `GET /form/api/form-entity-page/get-by-schema-id/opportunity-management/opportunity-management-form-list` → 200
90. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
91. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
92. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
93. `GET /form/api/v2/form-entity-layout/opportunity-management/opportunity-management-form/edit/schema-json` → 200
94. `GET /form/api/v2/form-entity/opportunity-management/opportunity-management-form` → 200
95. `GET /form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/19895` → 200
96. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, needCount
97. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
98. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
99. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
100. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
101. `POST /form/api/v3/form-entity-data/contact-management/contact-management-form/list` → 200
   请求体字段: needCount
102. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
103. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
104. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
105. `POST /form/api/v3/form-entity-data/opportunity-management/meddic-analysis-form/list` → 200
   请求体字段: filterModel
106. `POST /form/api/v3/form-entity-data/opportunity-management/ai-suggestion-form/list` → 200
   请求体字段: filterModel
107. `POST /form/api/v3/form-entity-data/opportunity-management/risk-factor-form/list` → 200
   请求体字段: filterModel
108. `POST /flow/api/flow-rest/quotation-amount-calculation-flow` → 200
   请求体字段: formDataId
109. `GET /form/api/form-entity-page/get-by-schema-id/quotation-management/quotation-form-list` → 200
110. `POST /form/api/v3/form-entity-data/quotation-management/quotation-form/list` → 200
   请求体字段: startRow, endRow
111. `GET /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/get-form` → 200
112. `GET /form/api/v2/form-entity-layout/quotation-management/quotation-form/new/schema-json` → 200
113. `GET /form/api/v2/form-entity/quotation-management/quotation-form` → 200
114. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow, needCount
115. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
116. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
117. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
118. `POST /form/api/v3/form-entity-data/product-management/product-management-form/list` → 200
   请求体字段: needCount
119. `POST /flow/api/flow-rest/check-duplicate-opportunity-flow` → 200
   请求体字段: businessOpportunity
120. `PUT /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/quotation-form/new/update-form` → 200
   请求体字段: quoteStatus, discountOffer, taxRate, totalPriceNoTax, totalPriceWithTax
121. `POST /form/api/v3/form-entity-data/quotation-management/quotation-form/list` → 200
   请求体字段: startRow, endRow
122. `POST /form/api/v3/form-entity-data/quotation-management/quotation-form/list` → 200
   请求体字段: startRow, endRow
123. `GET /form/api/form-entity-page/get-by-schema-id/opportunity-management/opportunity-management-form-list` → 200
124. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
125. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
126. `GET /form/api/v2/form-entity-layout/opportunity-management/opportunity-management-form/edit/schema-json` → 200
127. `GET /form/api/v2/form-entity/opportunity-management/opportunity-management-form` → 200
128. `GET /form/api/v2/form-entity-data/opportunity-management/opportunity-management-form/19895` → 200
129. `POST /form/api/v3/form-entity-data/lead-management/lead-management-form/list` → 200
   请求体字段: startRow, endRow, needCount
130. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
131. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
132. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
133. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
134. `POST /form/api/v3/form-entity-data/contact-management/contact-management-form/list` → 200
   请求体字段: needCount
135. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
136. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
137. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
138. `POST /form/api/v3/form-entity-data/opportunity-management/meddic-analysis-form/list` → 200
   请求体字段: filterModel
139. `POST /form/api/v3/form-entity-data/opportunity-management/ai-suggestion-form/list` → 200
   请求体字段: filterModel
140. `POST /form/api/v3/form-entity-data/opportunity-management/risk-factor-form/list` → 200
   请求体字段: filterModel
141. `POST /flow/api/flow-rest/quotation-amount-calculation-flow` → 200
   请求体字段: formDataId
142. `POST /form/api/v3/form-entity-data/quotation-management/opportunity-product-management-subform-form/list` → 200
   请求体字段: startRow, endRow, filterModel
143. `POST /form/api/v3/form-entity-data/quotation-management/quotation-form/list` → 200
   请求体字段: startRow, endRow, filterModel
144. `PUT /form/api/v2/form-entity-data/19895/opportunity-management/opportunity-management-form/edit` → 200
   请求体字段: expectedTransactionAmount, aiWinRatePrediction, myOrgId, creationTime, flowInstanceId
145. `POST /flow/api/flow-rest/business-ai-win-rate-update-flow` → 200
   请求体字段: id
146. `POST /flow/api/flow-rest/opportunity-stage-transition-process-flow` → 200
   请求体字段: id, opportunityStage
147. `GET /form/api/form-entity-page/get-by-schema-id/opportunity-management/opportunity-management-form-list` → 200
148. `GET /flow/api/flow-rest/fetch-system-file-by-id-flow` → 200
149. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
150. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
151. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: startRow, endRow
152. `POST /flow/api/flow-rest/convert-to-sales-contract-flow` → 200
   请求体字段: myOrgId, creationTime, expectedTransactionAmount, flowInstanceId, myUserId
153. `GET /form/api/form-entity-page/get-by-schema-id/contract-management/contract-management-list` → 200
154. `POST /form/api/v3/form-entity-data/contract-management/contract-management-form/list` → 200
   请求体字段: startRow, endRow
155. `GET /form/api/v2/form-entity-data/contract-management/contract-management-form/19900/view` → 200
156. `GET /form/api/v2/form-entity-layout/contract-management/contract-management-form/view/schema-json` → 200
157. `GET /form/api/v2/form-entity/contract-management/contract-management-form` → 200
158. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
159. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
160. `GET /form/api/v2/form-entity-data/get-tree-form-data/ORG` → 200
161. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
162. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
163. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: needCount
164. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
165. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
166. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
167. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
168. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
169. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
170. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
171. `GET /form/api/form-entity-page/get-by-schema-id/contract-management/contract-management-list` → 200
172. `POST /form/api/v3/form-entity-data/contract-management/contract-management-form/list` → 200
   请求体字段: startRow, endRow
173. `GET /form/api/v2/form-entity-layout/contract-management/contract-management-form/edit/schema-json` → 200
174. `GET /form/api/v2/form-entity/contract-management/contract-management-form` → 200
175. `GET /form/api/v2/form-entity-data/contract-management/contract-management-form/19900` → 200
176. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
177. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
178. `GET /form/api/v2/form-entity-data/get-tree-form-data/ORG` → 200
179. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
180. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
181. `POST /form/api/v3/form-entity-data/opportunity-management/opportunity-management-form/list` → 200
   请求体字段: needCount
182. `POST /form/api/v3/form-entity-data/customer-management/customer-management-form/list` → 200
   请求体字段: needCount
183. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
184. `POST /form/api/v3/form-entity-data/user-management-new/system-user-form/list` → 200
   请求体字段: filterModel, needCount
185. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
186. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
187. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
188. `POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list` → 200
   请求体字段: filterModel, needCount
189. `PUT /form/api/v2/form-entity-data/19900/contract-management/contract-management-form/edit` → 200
   请求体字段: isTaxIncluded, approvalDocument, myOrgId, contractSource, deliveryMethod
190. `POST /flow/api/flow-rest/contract-effective-flow` → 200
   请求体字段: id
191. `GET /form/api/form-entity-page/get-by-schema-id/contract-management/contract-management-list` → 200
192. `POST /form/api/v3/form-entity-data/contract-management/contract-management-form/list` → 200
   请求体字段: startRow, endRow

## 你的任务

请根据上面的 UI 脚本和业务 API，生成一份**业务语义脚本**，要求：

1. **用自然语言描述业务流程**（不是技术描述，是业务人员能看懂的）
2. **推断业务场景名称**（如：新增学生信息、用户登录、查询订单等）
3. **描述每个操作步骤的业务含义**（不是"点击按钮"，而是"用户发起新增操作"）
4. **关联 UI 操作和 API 调用**（说明哪个操作触发了哪个接口）
5. **提取测试数据**（录制时用的账号、填写的字段值等）

输出格式为 Markdown，保存到：
`C:\Users\jianz\OneDrive - 知微行易（上海）智能科技有限公司\桌面\CETATest\ceta-skills-windows-amd64-2.0.27\ceta-ai-skills-windows-amd64\ceta-ai-skills\ui-recorder-workspace\semantic-script.md`

保存后 Electron 工具会自动检测并显示。