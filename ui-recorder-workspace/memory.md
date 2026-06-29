# UI Recorder - 项目记忆

> 此文件由 Kiro 自动维护，记录跨会话的关键上下文。
> 每次生成 API 脚本后会自动更新。

---

## 🌐 项目基本信息

| 项目 | 值 |
|------|----|
| 平台 | CETA 低代码平台 |
| 环境 | `https://bot.ceta.crm.duxing.cn` |
| 登录方式 | 邮箱 + 密码（basic 认证） |
| 登录页路径 | `/ui/login/basic?auth=basic` |

---

## 👤 测试账号

| 字段 | 值 | 备注 |
|------|----|------|
| email | `Admin@bot.com` | 管理员账号 |
| username | `Admin@bot.com` | 同 email |
| password | `dzKB` | ⚠️ 录制时为加密值，需确认明文密码 |
| captcha | `""` | 录制时为空，需确认是否必填 |

---

## 📡 已知接口

| 接口 | 方法 | 路径 | 最近状态 | 备注 |
|------|------|------|----------|------|
| 登录页配置 | GET | `/user-management/api/login/config` | ✅ 200 | 无需认证 |
| 用户登录 | POST | `/user-management/api/user/login` | ❌ 500 | 需排查密码/验证码 |

---

## ⚠️ 已知问题

### 2026/6/25 - 登录接口返回 500（已解决）
- **接口**: `POST /user-management/api/user/login`
- **原因**: 密码需要 base64 + ROT13-64 双重加密
- **解决**: 实现 `encryptPassword()` 函数，`Test@123456` → `iTiAqRN+ZwZBagl=`
- **状态**: ✅ 已解决

### 2026/6/25 - 语音线索生成接口（已解决）
- **接口**: `POST /flow/api/flow-rest/meeting-file-to-clue-flow`
- **正确参数**: 传整个语音记录对象（非 `voiceFormEntityDataId`），必须包含 `audioFile`、`id`、`myOrgId`、`myUserId`、`transcriptionContent` 等字段
- **必须 header**: `accept-language: zh-CN`（流程引擎读 `$1.restTrigger.requestHeaders.accept-language`）
- **测试用记录**: id=24787, runzhi.zhang@bizops.com.cn, myOrgId=14313
- **状态**: ✅ 已解决

---

## 🔧 脚本生成历史

| 时间 | 业务场景 | 脚本文件 | 备注 |
|------|----------|----------|------|
| 2026/6/25 10:41 | 用户登录系统 | `api-script.spec.js` | 初始版本 |
| 2026/6/25 18:08 | CRM 完整销售流程 | `api-script.spec.js` | 基于完整录制更新，10/10 passed |

---

## 🔧 脚本生成历史

| 时间 | 业务场景 | 脚本文件 | 备注 |
|------|----------|----------|------|
| 2026/6/25 10:41 | 用户登录系统 | `api-script.spec.js` | 初始版本 |
| 2026/6/25 18:08 | CRM 完整销售流程 | `api-script.spec.js` | 基于完整录制更新，10/10 passed |
| 2026/6/25 18:34 | CRM 完整销售流程 + 双账号审批 | `api-script.spec.js` | 12/12 passed，含审批机制 |

## 💡 经验积累

- 登录接口字段顺序：`email`, `username`, `password`, `captcha`（无 `captchaId`）
- 脚本使用 `require` 语法（非 `import`），兼容 Electron 内置 Node.js
- 运行脚本需设置 `ELECTRON_RUN_AS_NODE=1`
- 密码加密：base64 + ROT13-64，`Test@123456` → `iTiAqRN+ZwZBagl=`
- `customerOwner`/`salesPerson`/`leadOwner` 等关联用户字段均为 ACL 对象数组
- `quoteStatus`/`opportunityStage`/`contractSource` 等字典字段均为对象数组
- 报价提交后由系统**自动审批通过**（status→accepted），不需要手动调审批接口
- 赢单审批：`POST opportunity-stage-transition-process-flow` 后，flowInstanceId 需约 2 分钟才生成（异步）
- 审批接口：先 `GET /flow/api/flow-instance/{id}/get-form` 获取表单，再 `PUT /flow/api/flow-instance/{id}/approval?formPbcToken=xxx`
- `approvalResult: "APPROVAL"`，`approvalComment: "同意"`


### 2026/6/25 - 审批机制验证（待确认）
- **问题**: 用户表示"报价和赢单都需要Sales Manager A审批"，但测试显示报价自动审批通过，赢单审批flowInstanceId为null
- **测试结果**: 
  - 报价创建后状态自动变为`accepted`，可能系统配置为自动审批
  - 赢单审批在100秒内未发现flowInstanceId生成
  - Sales Manager A账号可以正常登录，但无法触发审批流程
- **可能原因**:
  - 系统配置了金额阈值，当前测试金额未触发人工审批
  - 审批流程配置不同，可能针对特定项目或条件
  - 测试账号权限或流程配置问题
- **状态**: ⚠️ 待用户确认系统实际配置

### 2026/6/25 - 合同ID获取问题（待解决）
- **接口**: `POST /flow/api/flow-rest/convert-to-sales-contract-flow`
- **问题**: 合同生成后查询合同列表返回空结果
- **测试发现**:
  - 合同生成接口返回200，但响应可能为空或缺少contractId
  - 合同列表查询需要更长时间等待（异步生成）
  - 可能权限问题：新合同对当前用户不可见
- **临时解决方案**: 
  - 增加等待时间（30-60秒）
  - 优化查询逻辑（按时间倒序，查询所有合同）
  - 创建专门的诊断脚本`contract-fix.js`
- **状态**: 🔧 诊断中

### 2026/6/25 - 合同完善失败问题（待解决）
- **接口**: `PUT /form/api/v2/form-entity-data/{contractId}/contract-management/contract-management-form/edit`
- **错误**: `"For input string: \"null\""`
- **问题**: 参数中存在字符串"null"，需要检查参数格式
- **解决建议**:
  - 确保参数中不传递字符串"null"
  - 使用undefined或空对象替代null
  - 简化参数结构测试
- **状态**: 🔧 诊断中

## 📋 账号信息验证

### 已确认的有效账号
| 角色 | 邮箱 | 密码 | 用户ID | 组织ID | 状态 |
|------|------|------|--------|--------|------|
| Sales Representative A | xuanyu.lu@bizops.com.cn | Test@123456 | 10084 | 14329 | ✅ 有效 |
| Sales Manager A | 593969718@qq.com | 593969718@qq.com | 未知 | 未知 | ✅ 可登录 |

### 测试结果总结
1. **登录**: ✅ 双账号均可正常登录
2. **审批**: ⚠️ 未发现明确的人工审批流程触发
3. **合同**: ⚠️ 合同ID获取和后续操作存在问题

## 🛠️ 创建的分析脚本

### 1. 审批机制验证脚本 (`approval-validation.js`)
- **目的**: 专门验证报价和赢单是否需要Sales Manager A手动审批
- **测试项**:
  - 双账号登录验证
  - 报价审批流程检测
  - 赢单审批流程检测
  - 审批流程执行测试
- **运行命令**: `npx playwright test approval-validation.js --reporter=line`

### 2. 合同问题诊断脚本 (`contract-fix.js`)
- **目的**: 诊断和解决合同ID获取、完善和生效问题
- **测试项**:
  - 多种参数组合生成合同
  - 多种查询策略查找合同
  - 参数格式问题诊断
  - 修复方案验证
- **运行命令**: `npx playwright test contract-fix.js --reporter=line`

## 📝 下一步建议

### 立即行动
1. **运行诊断脚本**: 执行`approval-validation.js`和`contract-fix.js`获取详细诊断信息
2. **确认系统配置**: 询问用户系统实际的审批流程配置
3. **验证测试金额**: 检查是否金额未达到审批阈值

### 脚本改进
1. **增加等待时间**: 合同生成后等待更长时间（建议60秒）
2. **优化查询逻辑**: 改进合同列表查询策略
3. **参数修复**: 解决字符串"null"问题
4. **增加日志**: 添加更详细的流程日志

### 用户沟通
1. **确认审批机制**: 报价和赢单是否真的需要Sales Manager A审批
2. **确认系统行为**: 用户手动操作时的实际系统行为
3. **提供测试结果**: 将诊断结果反馈给用户

## 🔍 重要发现

### 审批流程的矛盾点
- **用户反馈**: "报价和赢单都需要Sales Manager A审批"
- **实际测试**: 报价自动审批通过，赢单未发现审批流程
- **可能解释**: 
  - 系统配置了自动审批规则（如小额报价）
  - 测试数据未满足人工审批触发条件
  - 流程配置可能已变更

### 合同生成的特殊性
- **异步生成**: 合同生成可能需要较长时间
- **权限问题**: 新生成的合同可能对某些用户不可见
- **参数敏感**: 某些参数格式可能导致流程失败

## 💾 记忆更新规则
- 每次重要发现都应记录在此文件中
- 脚本更新后应更新脚本生成历史
- 账号信息变化应及时更新
- 问题解决后更新状态为✅，未解决保持⚠️