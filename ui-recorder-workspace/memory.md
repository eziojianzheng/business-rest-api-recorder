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
