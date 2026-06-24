# CETA 与 Business REST API Recorder 协同指南

## 🎯 协同目标

当用户同时使用 CETA 和 Business REST API Recorder 时,提供无缝的协同体验。

---

## 🔍 自动激活规则

### 触发条件

当用户消息**同时包含**以下两类关键词时,同时激活两个 Skill:

**CETA 关键词** (任一):
- "CETA"
- "PBC"
- "FormEntity" / "表单实体"
- "CETA 平台"
- "CETA 项目"
- "业务组件"

**Business REST API Recorder 关键词** (任一):
- "录制"
- "Business REST API Recorder"
- "UI Recorder"
- "生成脚本"
- "API 测试"
- "语义脚本"
- "回放"

### 激活示例

✅ **会同时激活**:
- "我录制了 CETA 平台的 PBC 创建流程"
- "帮我为 CETA 项目生成 API 测试脚本"
- "使用 Business REST API Recorder 录制表单实体的操作"

❌ **只激活单个**:
- "我要创建一个 PBC" (只激活 CETA)
- "我要录制一个网站" (只激活 Business REST API Recorder)

---

## 🤝 协同工作模式

### 分工明确

| 功能模块 | 负责内容 |
|---------|---------|
| **Business REST API Recorder** | 录制操作、捕获 API、生成脚本框架 |
| **CETA Skills** | 提供业务术语、解释 API 含义、优化脚本 |
| **协同输出** | 包含 CETA 业务语义的高质量脚本 |

### 工作流程

```
用户录制 CETA 操作
    ↓
Business REST API Recorder 捕获数据
    ↓
CETA Skills 提供领域知识
    ↓
生成包含业务语义的脚本
    ↓
用户回放验证
```

---

## 📝 协同场景

### 场景 1: 录制 CETA 平台操作

**用户输入**:
```
"我录制了 CETA 平台创建 PBC 的流程,帮我生成语义脚本"
```

**Kiro 响应流程**:

1. **识别协同需求**:
   ```
   ✅ 检测到 CETA + UI Recorder 协同场景
   
   已激活:
   - ui-recorder Skill (处理录制数据)
   - ceta-basic Skill (提供 PBC 领域知识)
   ```

2. **读取录制数据**:
   ```
   读取 ui-recorder-workspace/ui-script.js
   读取 ui-recorder-workspace/network.har
   ```

3. **应用 CETA 知识**:
   ```
   识别业务实体:
   - PBC (业务组件)
   - 字段: name, token, description, projectId
   
   识别 API:
   - POST /form/api/pbc (创建 PBC)
   ```

4. **生成增强的语义脚本**:
   ```markdown
   # 业务语义脚本 - 创建 PBC
   
   ## 业务场景
   用户在 CETA 平台创建新的 PBC (业务组件)
   
   ## 业务步骤
   
   ### 1. 访问 PBC 管理页面
   **业务含义**: 用户进入 PBC 管理模块,准备创建新的业务组件
   
   ### 2. 填写 PBC 基本信息
   **业务含义**: 用户配置 PBC 的核心属性
   
   **字段说明**:
   - **name** (PBC 名称): "用户管理" - 业务组件的显示名称
   - **token** (PBC 标识): "user-management" - 系统内唯一标识符
   - **description** (描述): "用户管理业务组件" - 业务用途说明
   - **projectId** (项目 ID): 所属项目的标识
   
   ### 3. 提交创建请求
   **触发的 API**: POST /form/api/pbc
   **业务含义**: 系统创建 PBC 实例,分配 ID,初始化配置
   
   ## CETA 平台知识
   
   **PBC (Platform Business Component)**:
   - CETA 平台的核心概念
   - 用于封装特定领域的业务逻辑
   - 包含表单实体、页面配置、流程定义等
   ```

### 场景 2: 生成 CETA API 测试脚本

**用户输入**:
```
"基于录制的数据,生成 CETA API 测试脚本"
```

**Kiro 响应流程**:

1. **激活协同模式**:
   ```
   ✅ CETA + UI Recorder 协同
   
   已激活:
   - ui-recorder Skill (脚本生成)
   - ceta-api Skill (API 规范)
   ```

2. **生成符合 CETA 规范的测试脚本**:
   ```javascript
   const { test, expect, request } = require('@playwright/test');
   
   const CETA_BASE_URL = 'https://ceta.example.com';
   let apiContext;
   let authToken;
   let projectToken;
   
   test.describe.serial('CETA PBC 管理', () => {
     
     test.beforeAll(async ({ playwright }) => {
       apiContext = await request.newContext({
         baseURL: CETA_BASE_URL,
         ignoreHTTPSErrors: true
       });
     });
   
     test('1. 登录 CETA 平台', async () => {
       const response = await apiContext.post('/user-management/api/user/login', {
         data: {
           username: 'admin@example.com',
           password: 'encrypted_password',
           captcha: 'xxxx',
           captchaId: 'xxxx'
         }
       });
       
       expect(response.status()).toBe(200);
       const body = await response.json();
       authToken = body.data.accessToken;
       projectToken = body.data.projectToken;
     });
   
     test('2. 创建 PBC', async () => {
       const response = await apiContext.post('/form/api/pbc', {
         headers: {
           'Authorization': `Bearer ${authToken}`,
           'project_token': projectToken
         },
         data: {
           name: '用户管理',
           token: 'user-management',
           description: '用户管理业务组件',
           projectId: 1,
           category: 'business'
         }
       });
       
       expect(response.status()).toBe(200);
       const body = await response.json();
       expect(body.data).toHaveProperty('id');
       expect(body.data.name).toBe('用户管理');
       expect(body.data.token).toBe('user-management');
     });
   
     test.afterAll(async () => {
       await apiContext.dispose();
     });
   });
   ```

### 场景 3: 调试 CETA 相关脚本

**用户输入**:
```
"我的 CETA PBC 创建脚本回放失败了,帮我调试"
```

**Kiro 响应流程**:

1. **激活协同调试**:
   ```
   ✅ CETA + Business REST API Recorder 协同调试
   
   已激活:
   - ui-recorder Skill (调试工作流)
   - ceta-basic Skill (CETA 平台知识)
   ```

2. **读取调试上下文**:
   ```
   读取 ui-recorder-workspace/debug-context.md
   读取 ui-recorder-workspace/ui-script.js
   ```

3. **应用 CETA 知识诊断**:
   ```
   常见 CETA 平台问题:
   
   1. 认证问题:
      - Token 过期
      - project_token 缺失
      - 权限不足
   
   2. PBC 创建问题:
      - token 重复 (PBC token 必须唯一)
      - projectId 无效
      - 必填字段缺失
   
   3. API 调用问题:
      - 请求头缺失
      - 参数格式错误
      - 接口版本不匹配
   ```

4. **提供针对性修复建议**:
   ```
   我看到你的脚本在创建 PBC 时返回 500 错误。
   
   可能的原因:
   1. PBC token "user-management" 可能已存在
   2. projectId 可能无效
   
   建议修复:
   1. 先调用 GET /form/api/pbc/list 检查是否已存在
   2. 如果存在,使用不同的 token 或先删除旧的
   3. 验证 projectId 是否正确
   
   需要我帮你修改脚本吗?
   ```

---

## 🎨 语义脚本增强规则

### 标准 Business REST API Recorder 输出

```markdown
场景: 用户操作

步骤:
1. 点击按钮
2. 填写表单
3. 提交
```

### CETA 增强后输出

```markdown
场景: 创建 PBC (业务组件)

业务背景:
PBC 是 CETA 平台的核心业务组件,用于封装特定领域的业务逻辑和数据模型。

步骤:
1. 用户发起创建 PBC 操作
   **业务含义**: 在 CETA 平台创建新的业务组件
   
2. 用户配置 PBC 基本信息
   **业务含义**: 定义业务组件的标识和用途
   **字段说明**:
   - name: PBC 显示名称
   - token: 系统唯一标识符 (kebab-case)
   - description: 业务用途说明
   
3. 用户提交 PBC 配置
   **触发 API**: POST /form/api/pbc
   **业务含义**: 系统创建 PBC 实例并初始化配置

CETA 平台知识:
- PBC 创建后会自动生成默认的表单布局
- PBC token 在项目内必须唯一
- PBC 可以包含多个 FormEntity (表单实体)
```

### 增强要点

1. **添加业务背景** - 解释 CETA 概念
2. **使用 CETA 术语** - PBC、FormEntity、Layout 等
3. **解释字段含义** - 每个字段的业务用途
4. **说明 API 规范** - CETA API 的特点和要求
5. **提供平台知识** - CETA 平台的特性和限制

---

## 🔧 技术细节

### CETA API 特点

1. **认证机制**:
   - 使用 Bearer Token
   - 需要 project_token header
   - Token 有过期时间

2. **API 规范**:
   - RESTful 风格
   - 统一响应格式: `{ code, data, message }`
   - 错误码规范

3. **数据模型**:
   - PBC → FormEntity → Field
   - PBC → Page → Layout
   - PBC → FlowDefinition → Node

### Business REST API Recorder 与 CETA 的数据映射

| Business REST API Recorder 数据 | CETA 概念 | 说明 |
|-----------------|----------|------|
| 表单输入 | FormEntity Field | 表单字段 |
| 页面跳转 | Page Navigation | 页面路由 |
| API 调用 | CETA API | 平台接口 |
| 按钮点击 | Action Trigger | 操作触发 |

---

## 📚 常用 CETA 术语对照

| 中文 | 英文 | 说明 |
|------|------|------|
| 业务组件 | PBC (Platform Business Component) | CETA 核心概念 |
| 表单实体 | FormEntity | 数据模型 |
| 表单字段 | Field | 数据字段 |
| 表单布局 | Layout | 表单 UI 配置 |
| 页面配置 | Page | 页面定义 |
| 流程定义 | FlowDefinition | 工作流 |
| 前端配置 | FrontEndConfig | 菜单、路由等 |

---

## 🚀 快速开始

### 1. 确认 CETA Skills 已安装

检查目录:
```
skills/
├── ui-recorder/
└── ceta/
    ├── ceta-basic/
    └── ceta-api/
```

### 2. 开始录制 CETA 操作

```
在 Kiro 中说: "我要录制 CETA 平台的操作"
```

### 3. 生成增强的语义脚本

```
在 Kiro 中说: "生成 CETA 语义脚本"
```

### 4. 生成 CETA API 测试脚本

```
在 Kiro 中说: "生成 CETA API 测试脚本"
```

---

## ⚠️ 注意事项

### 1. 保持独立性

- Business REST API Recorder 和 CETA Skills 应保持独立
- 通过此桥接文件协调,不要硬编码依赖

### 2. 按需激活

- 只在需要时同时激活两个 Skill
- 避免不必要的复杂性

### 3. 清晰的边界

- Business REST API Recorder 负责录制和脚本生成
- CETA Skills 负责提供领域知识
- 不要混淆职责

---

## 🎯 总结

### 协同价值

通过 CETA Skills 和 Business REST API Recorder 的协同:

1. **更准确的业务描述** - 使用 CETA 业务术语
2. **更高质量的脚本** - 符合 CETA API 规范
3. **更好的可维护性** - 包含业务知识的文档

### 使用原则

1. **自动协同** - 检测到关键词自动激活
2. **保持独立** - 两个模块独立但协同
3. **按需使用** - 只在需要时协同工作

---

**记住**: 这是一个桥接指南,不是硬编码的依赖。保持灵活性和独立性!
