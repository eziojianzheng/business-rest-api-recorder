# 业务语义脚本

**生成时间**: 2026/6/25（基于完整录制更新）
**业务场景**: CRM 完整销售流程 — 从语音线索到合同生效
**系统地址**: https://bot.ceta.crm.duxing.cn
**测试用户**: jinjin.zhang@bizops.com.cn

---

## 业务场景说明

本场景描述销售人员使用 CETA CRM 系统完成一次完整销售闭环的全流程：从 AI 语音转线索开始，经过线索培育、客户建档、商机转化、报价审批、赢单推进，最终生成并生效销售合同。

---

## 业务步骤

### 第 1 步：用户登录系统
- **业务含义**: 销售人员使用企业邮箱登录 CRM 系统，完成身份认证
- **测试账号**: `jinjin.zhang@bizops.com.cn` / `Test@123456`
- **触发 API**: `POST /user-management/api/user/login`
- **注意**: 密码需经过 base64 + ROT13-64 双重加密后传输

---

### 第 2 步：获取当前用户信息
- **业务含义**: 系统加载当前登录用户的个人信息和权限配置
- **触发 API**: `GET /user-management/api/user/get-user-info`

---

### 第 3 步：语音线索生成
- **业务含义**: 销售人员选择一条历史录音，点击"生成线索"按钮，由 AI 分析语音内容并自动生成销售线索
- **触发 API**: `POST /flow/api/flow-rest/meeting-file-to-clue-flow`
- **关键参数**:
  - 需传入**完整的语音记录对象**（含 `audioFile`、`transcriptionContent` 等字段）
  - 必须携带请求头 `accept-language: zh-CN`（流程引擎读取此值决定语言模板）
- **测试数据**: 使用 id=24787 的录音记录（有完整转录文本）

---

### 第 4 步：创建客户档案
- **业务含义**: 销售人员为线索对应的潜在客户创建正式的客户档案，建立客户关系
- **触发 API**: `POST /form/api/v2/form-entity-data/customer-management/customer-management-form/default`
- **关键参数**:
  - `customerOwner` 必须是对象数组（ACL 格式），例：`[{value: "10115", label: "用户名", uid: "10115"}]`
  - `myOrgId`: 组织 ID（`"14313"`）
- **测试数据**:
  - 客户名称: `自动化测试客户`
  - 所属区域: `华南`

---

### 第 5 步：线索转化为商机
- **业务含义**: 销售人员判断线索具备成交潜力，将线索正式转化为销售商机，进入商机管理流程
- **触发 API**: `PUT /flow/api/v2/flow-definition/lead-management/opportunity-conversion-process-flow/lead-management-form/convert/update-form`
- **响应说明**: 返回 `formEntityDataId`（线索 ID），需额外查询商机列表获取真实商机 ID
- **测试数据**:
  - 商机名称: `自动化测试机会`
  - 预期成交金额: `1200` 元
  - 成功概率: `56%`

---

### 第 6 步：创建销售报价
- **业务含义**: 销售人员为商机创建正式报价单，填写产品信息和价格，提交审批
- **触发 API**: `PUT /flow/api/v2/flow-definition/quotation-management/new-quote-approval-flow/quotation-form/new/update-form`
- **关键参数**（基于录制的真实结构）:
  - `quoteStatus` 是对象数组，非字符串
  - `productSubtable` 使用 `{inserted, updated, deleted}` 结构
  - `salesPerson` 是对象数组（ACL 格式）
- **测试数据**:
  - 产品: `CetaCRM`，单价 1788 元/年，数量 2，折扣 0
  - 报价有效期: 30 天

---

### 第 7 步：商机推进到赢单
- **业务含义**: 客户确认购买意向，销售人员将商机阶段推进到"赢单"，触发赢单审批流程
- **触发 API**: `POST /flow/api/flow-rest/opportunity-stage-transition-process-flow`
- **关键参数**（基于录制）:
  - `opportunityStage` 是对象数组，包含完整的字典值对象
  - 赢单状态 code: `"Winning Orders"`，id: `17211`

---

### 第 8 步：生成销售合同
- **业务含义**: 商机赢单后，系统自动基于商机信息生成销售合同草稿
- **触发 API**: `POST /flow/api/flow-rest/convert-to-sales-contract-flow`
- **关键参数**:
  - `id`: 商机 ID
  - `myOrgId`: 组织 ID
  - `creationTime`: 当前时间（格式：`"yyyy-MM-dd HH:mm:ss"`）
  - `expectedTransactionAmount`: 预期成交金额
- **响应**: 合同生成后需查询合同列表获取真实合同 ID

---

### 第 9 步：完善合同信息
- **业务含义**: 合同经办人填写乙方信息、合同类型等必要字段，完善合同内容
- **触发 API**: `PUT /form/api/v2/form-entity-data/{contractId}/contract-management/contract-management-form/edit`
- **关键参数**（基于录制的真实结构）:
  - `contractSource` 是对象数组（字典值）
  - `contractType` 是对象数组（字典值）
  - `approvalDocument` 是资源对象结构
- **测试数据**:
  - 乙方名称: `自动化测试乙方`
  - 合同来源: `从商机转化`
  - 合同类型: `销售合同`

---

### 第 10 步：合同生效
- **业务含义**: 合同双方签署完毕，经办人触发合同生效操作，完成整个销售流程闭环
- **触发 API**: `POST /flow/api/flow-rest/contract-effective-flow`
- **关键参数**: 只需传 `{id: contractId}`，无需其他字段

---

## 测试数据汇总

| 数据项 | 值 |
|--------|-----|
| 登录邮箱 | `jinjin.zhang@bizops.com.cn` |
| 登录密码（明文）| `Test@123456` |
| 登录密码（加密）| `iTiAqRN+ZwZBagl=` |
| 用户 ID | `10115` |
| 组织 ID | `14313` |
| 客户名称 | `自动化测试客户` |
| 商机名称 | `自动化测试机会` |
| 预期金额 | `1200` 元 |
| 产品 | `CetaCRM`，1788 元/年 |
| 乙方名称 | `自动化测试乙方` |
| 语音记录 ID | `24787`（张润之，有完整转录文本） |

---

## API 调用时序

```
1. POST /user-management/api/user/login          ← 登录获取 token
2. GET  /user-management/api/user/get-user-info  ← 获取用户信息
3. POST /flow/api/flow-rest/meeting-file-to-clue-flow   ← 语音转线索（需 accept-language: zh-CN）
4. POST /form/api/v2/.../customer-management-form/default  ← 创建客户
5. PUT  /flow/api/v2/.../opportunity-conversion-process-flow/.../update-form  ← 线索转商机
   GET  /form/api/v3/.../opportunity-management-form/list  ← 查询商机 ID
6. PUT  /flow/api/v2/.../new-quote-approval-flow/.../update-form  ← 创建报价
7. POST /flow/api/flow-rest/opportunity-stage-transition-process-flow  ← 商机赢单
8. POST /flow/api/flow-rest/convert-to-sales-contract-flow  ← 生成合同
   POST /form/api/v3/.../contract-management-form/list  ← 查询合同 ID
9. PUT  /form/api/v2/{contractId}/.../contract-management-form/edit  ← 完善合同
10. POST /flow/api/flow-rest/contract-effective-flow  ← 合同生效
```

---

## 关键技术说明

### 密码加密
服务端使用 base64 + ROT13-64 加密：
```javascript
function encryptPassword(plain) {
  const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  return Buffer.from(plain).toString('base64')
    .split('').map(c => { const i = map.indexOf(c); return i !== -1 ? map[(i+13)%64] : c; }).join('');
}
```

### ACL 字段格式
`customerOwner`、`salesPerson`、`leadOwner` 等关联用户字段均为对象数组：
```json
[{"value": "10115", "label": "用户名", "uid": "10115"}]
```

### 字典值字段格式
`quoteStatus`、`opportunityStage`、`contractSource` 等字典字段均为对象数组：
```json
[{"id": 14413, "code": "draft", "label": "草稿", "value": 14413, "handle": "quoteStatus-draft"}]
```
