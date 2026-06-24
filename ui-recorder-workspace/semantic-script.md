# 业务场景：CRM 完整销售流程 - 从线索到合同

> 录制时间：2026/6/4 13:49:33  
> 系统地址：https://bot.ceta.crm.duxing.cn  
> 测试用户：jinjin.zhang@bizops.com.cn

## 业务流程描述

这是一个完整的 CRM 销售管理流程演示，涵盖了从语音线索生成到最终合同签订的全链路业务操作。用户通过语音管理系统生成销售线索，然后依次完成线索转化、商机管理、报价创建、合同生成等关键业务环节，体现了现代 CRM 系统中销售管道的完整闭环管理。

**核心业务价值**：
- **线索管理**：通过 AI 语音分析自动生成潜在客户线索
- **销售转化**：将线索逐步转化为商机，再转化为销售合同
- **流程标准化**：规范化的审批流程确保业务操作的合规性
- **数据驱动**：通过 AI 预测和分析支持销售决策

## 业务操作步骤

### 第一阶段：用户认证与导航
1. **用户登录系统**
   - 使用企业邮箱 `jinjin.zhang@bizops.com.cn` 登录 CRM 系统
   - **触发 API**：`POST /user-management/api/user/login` - 用户身份验证

2. **进入语音管理模块**
   - 导航到"语音管理（组织树）"功能模块
   - **业务含义**：准备通过语音录音生成销售线索

### 第二阶段：线索生成与管理
3. **语音线索生成**
   - 点击"生成线索"按钮，将历史录音转化为销售线索
   - **触发 API**：`POST /flow/api/flow-rest/meeting-file-to-clue-flow` - AI 语音转线索流程

4. **线索信息完善**
   - 进入线索管理页面，编辑线索详细信息
   - 补充区域信息：`华南`
   - 设置线索类型：`客户介绍`
   - **触发 API**：`PUT /form/api/v2/form-entity-data/.../lead-management-form/edit` - 更新线索数据

### 第三阶段：客户创建
5. **新建客户档案**
   - 从线索中创建新客户：`自动化测试客户`
   - **触发 API**：`POST /form/api/v2/form-entity-data/customer-management/customer-management-form/default` - 创建客户记录
   - **业务含义**：将潜在线索转化为正式客户档案

### 第四阶段：商机转化
6. **线索转化为商机**
   - 将线索转化为销售商机：`自动化测试机会`
   - 设置预期成交金额：`1200` 元
   - 设置成功概率：`56%`
   - **触发 API**：`PUT /flow/api/v2/flow-definition/.../opportunity-conversion-process-flow/.../update-form` - 线索转商机流程

### 第五阶段：报价管理
7. **创建销售报价**
   - 为商机创建正式报价单
   - 关联商机：`自动化测试机会`
   - 指定负责人：`Sales Director`
   - 添加产品：`CetaCRM` 系统，单价 1,788 元/年
   - 设置数量：2 套，折扣：20%，期限：6 个月
   - **触发 API**：`PUT /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/.../update-form` - 报价审批流程

### 第六阶段：商机赢单
8. **商机状态推进**
   - 将商机阶段从"初步判断"推进到"赢单"
   - 录入合同编号：`contract自动化测试编号`
   - **触发 API**：`POST /flow/api/flow-rest/opportunity-stage-transition-process-flow` - 商机阶段变更

9. **生成销售合同**
   - 基于赢单商机自动生成销售合同
   - **触发 API**：`POST /flow/api/flow-rest/convert-to-sales-contract-flow` - 商机转合同流程

### 第七阶段：合同管理
10. **合同信息完善**
    - 编辑合同详细信息
    - 设置乙方名称：`自动化测试乙方`
    - 完善合同条款和交付方式
    - **触发 API**：`PUT /form/api/v2/form-entity-data/.../contract-management-form/edit` - 合同信息更新

11. **合同生效**
    - 提交合同审批并生效
    - **触发 API**：`POST /flow/api/flow-rest/contract-effective-flow` - 合同生效流程
    - **业务含义**：完成整个销售流程，形成有效的销售合同

## 关键业务数据

### 客户信息
- **客户名称**：自动化测试客户
- **所属区域**：华南
- **线索来源**：客户介绍

### 商机信息
- **商机名称**：自动化测试机会
- **预期金额**：1,200 元
- **成功概率**：56%
- **商机阶段**：初步判断 → 赢单

### 产品信息
- **产品名称**：CetaCRM
- **产品价格**：1,788 元/年
- **销售数量**：2 套
- **折扣比例**：20%
- **合同期限**：6 个月

### 合同信息
- **合同编号**：contract自动化测试编号
- **甲方**：系统默认组织
- **乙方**：自动化测试乙方
- **合同状态**：已生效

## 业务流程亮点

### 1. AI 驱动的线索生成
- 通过语音分析技术自动从录音中提取商业线索
- 大大提升了销售线索的发现效率

### 2. 标准化的转化流程
- 线索 → 客户 → 商机 → 报价 → 合同的标准化业务流程
- 每个环节都有明确的审批和确认机制

### 3. 智能化的商机管理
- AI 预测成功概率，辅助销售决策
- 自动化的阶段推进和状态管理

### 4. 完整的合同生命周期
- 从商机自动生成合同模板
- 支持合同编辑、审批和生效的完整流程

## 测试验证要点

### 1. 数据一致性验证
- **线索-客户关联**：验证从线索创建的客户记录包含正确的线索来源信息
- **商机-客户关联**：确保商机正确关联到对应的客户档案
- **报价-商机关联**：验证报价单正确引用商机信息和客户信息
- **合同-商机关联**：确保合同从商机生成时保持所有关键信息的一致性
- **金额计算准确性**：验证从商机金额(1200元)到报价金额(1788*2*0.8*6/12=1430.4元)的计算逻辑

### 2. 流程完整性验证
- **登录流程**：验证用户认证成功，获取到有效的访问令牌
- **线索生成流程**：确认语音文件成功转换为线索，AI 分析结果正确
- **转化流程**：验证线索→客户→商机的每个转化步骤都成功完成
- **审批流程**：确认报价审批和合同审批流程正确触发和完成
- **状态变更流程**：验证商机状态从"初步判断"正确推进到"赢单"

### 3. UI 界面验证
- **页面导航**：验证在不同模块间切换时页面正确加载
- **表单填写**：确认所有表单字段正确填写和保存
- **列表更新**：验证操作完成后相关列表页面数据实时更新
- **状态显示**：确认界面上显示的状态与后端数据状态一致
- **错误处理**：验证网络异常或数据错误时的用户提示

### 4. API 调用验证
- **请求成功率**：192个API调用中应全部返回成功状态码(200)
- **响应时间**：关键业务API响应时间应在可接受范围内(<2秒)
- **数据格式**：验证API响应数据格式符合预期结构
- **错误码处理**：验证失败的API调用(-1状态码)是否有正确的重试机制

### 5. 业务规则验证
- **权限控制**：验证用户只能操作自己权限范围内的数据
- **数据唯一性**：确保客户名称、合同编号等关键字段的唯一性约束
- **必填字段**：验证所有必填字段都正确填写，空值处理正确
- **业务约束**：验证商机金额、折扣比例等业务规则约束
- **审批权限**：确认审批操作需要相应的权限和角色

### 6. 端到端验证场景

#### 场景A：正常业务流程验证
```
前置条件：用户具有完整的CRM操作权限
验证步骤：
1. 登录系统 → 验证登录成功，获取用户信息
2. 语音转线索 → 验证AI分析结果合理，线索信息完整
3. 完善线索 → 验证数据保存成功，字段验证正确
4. 创建客户 → 验证客户档案创建，关联关系建立
5. 转化商机 → 验证转化成功，商机状态正确
6. 创建报价 → 验证报价计算准确，产品信息正确
7. 推进商机 → 验证状态变更，触发相关流程
8. 生成合同 → 验证合同生成，信息传递准确
9. 合同生效 → 验证最终状态，业务闭环完成

预期结果：整个流程顺利完成，所有数据正确保存
```

#### 场景B：异常处理验证
```
异常模拟：
1. 网络中断 → 验证重连机制和数据恢复
2. 服务器错误 → 验证错误提示和用户引导
3. 权限不足 → 验证权限检查和友好提示
4. 数据冲突 → 验证并发操作的数据一致性
5. 表单验证 → 验证必填项和格式校验

预期结果：系统能优雅处理各种异常情况
```

#### 场景C：性能压力验证
```
压力测试：
1. 大量数据加载 → 验证列表分页和查询性能
2. 并发操作 → 验证多用户同时操作的稳定性
3. 长时间会话 → 验证会话超时和续期机制
4. 批量操作 → 验证批量删除等操作的性能

预期结果：系统在压力下保持稳定和响应
```

### 7. 自动化验证脚本建议

#### 关键检查点自动化
```javascript
// 数据一致性检查
async function verifyDataConsistency() {
  const lead = await getLeadById(leadId);
  const customer = await getCustomerById(customerId);
  const opportunity = await getOpportunityById(opportunityId);
  
  assert(customer.leadSource === lead.id, '客户线索来源不匹配');
  assert(opportunity.customerId === customer.id, '商机客户关联不正确');
}

// API 响应时间监控
async function monitorAPIPerformance() {
  const startTime = Date.now();
  const response = await callAPI();
  const responseTime = Date.now() - startTime;
  
  assert(responseTime < 2000, `API响应时间过长: ${responseTime}ms`);
  assert(response.status === 200, `API调用失败: ${response.status}`);
}
```

### 8. 回归测试检查清单

- [ ] **用户登录认证** - 验证登录功能正常
- [ ] **语音线索生成** - 验证AI转换功能正常  
- [ ] **线索信息编辑** - 验证表单保存功能
- [ ] **客户档案创建** - 验证新客户创建流程
- [ ] **线索转商机** - 验证转化流程和数据传递
- [ ] **报价单创建** - 验证产品选择和计算逻辑
- [ ] **商机状态推进** - 验证阶段变更和触发器
- [ ] **合同生成** - 验证自动生成和数据映射
- [ ] **合同编辑保存** - 验证合同信息修改
- [ ] **合同生效** - 验证审批流程和最终状态

### 9. 关键指标监控

| 指标类型 | 关键指标 | 目标值 | 监控方式 |
|---------|---------|--------|----------|
| 性能指标 | 页面加载时间 | <3秒 | 前端监控 |
| 性能指标 | API响应时间 | <2秒 | API监控 |
| 可靠性指标 | 业务流程成功率 | >99% | 端到端监控 |
| 可用性指标 | 系统可用率 | >99.9% | 系统监控 |
| 数据指标 | 数据一致性检查 | 100% | 定期校验 |

## API 调用总览

**核心业务 API（按执行顺序）**：
1. `POST /user-management/api/user/login` - 用户登录
2. `POST /flow/api/flow-rest/meeting-file-to-clue-flow` - 语音转线索
3. `PUT /form/api/v2/form-entity-data/.../lead-management-form/edit` - 线索编辑
4. `POST /form/api/v2/form-entity-data/customer-management/customer-management-form/default` - 客户创建
5. `PUT /flow/api/v2/flow-definition/.../opportunity-conversion-process-flow/.../update-form` - 线索转商机
6. `PUT /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/.../update-form` - 报价创建
7. `POST /flow/api/flow-rest/opportunity-stage-transition-process-flow` - 商机推进
8. `POST /flow/api/flow-rest/convert-to-sales-contract-flow` - 生成合同
9. `PUT /form/api/v2/form-entity-data/.../contract-management-form/edit` - 合同编辑
10. `POST /flow/api/flow-rest/contract-effective-flow` - 合同生效

**辅助查询 API**：
- 各种列表查询：`POST /form/api/v3/form-entity-data/.../list`
- 表单布局获取：`GET /form/api/v2/form-entity-layout/.../schema-json`
- 数据字典查询：`POST /form/api/v3/form-entity-data/basic-system-setting/data-dictionary/list`

总计触发了 **192 个 API 调用**，其中核心业务 API 10 个，辅助查询 API 182 个，体现了现代 CRM 系统复杂的数据交互模式。