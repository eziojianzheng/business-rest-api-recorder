# 语义脚本编辑器使用指南

## 📖 功能简介

语义脚本编辑器是 Business REST API Recorder 的核心功能之一，允许你在 Electron 工具内直接编辑和预览语义脚本，无需切换到外部编辑器。

**主要特性**：
- ✏️ **实时编辑**：在左侧编辑区直接修改语义脚本
- 👁️ **实时预览**：右侧自动渲染 Markdown 预览
- 💾 **快速保存**：一键保存到 `ui-recorder-workspace/semantic-script.md`
- 🔄 **自动加载**：进入 Step 2 时自动加载已有脚本
- 🎨 **语法高亮**：支持 Markdown 基本语法渲染

---

## 🚀 快速开始

### 1. 生成语义脚本

在 **Step 2（语义分析）** 页面：

1. 点击 **"🧠 生成语义脚本"** 按钮
2. Kiro 会根据录制的 UI 脚本和 API 列表生成业务语义描述
3. 生成完成后，脚本自动显示在编辑区

### 2. 编辑语义脚本

在左侧 **"📄 语义脚本（可编辑）"** 区域：

- 直接在文本框中编辑 Markdown 内容
- 支持标准 Markdown 语法：
  - `# 标题` - 一级标题
  - `## 标题` - 二级标题
  - `**粗体**` - 粗体文本
  - \`代码\` - 行内代码
  - `- 列表项` - 无序列表
  - `1. 列表项` - 有序列表

右侧预览会**实时更新**，所见即所得。

### 3. 保存修改

编辑完成后：

1. 点击 **"💾 保存修改"** 按钮
2. 系统保存到 `ui-recorder-workspace/semantic-script.md`
3. 状态提示显示 **"✅ 已保存"**
4. 自动弹窗询问是否进入下一步（API 调试）

---

## 💡 使用场景

### 场景 1：修正 Kiro 生成的内容

Kiro 生成的语义脚本可能包含一些不准确的描述，你可以直接修改：

**示例修改**：

```markdown
<!-- Kiro 生成的原始内容 -->
### 2. 用户填写表单
用户填写了 5 个字段...

<!-- 你可以修改为 -->
### 2. 填写客户基本信息
销售人员录入客户的公司名称、联系人、手机号等关键信息...
```

### 场景 2：添加业务背景说明

为测试脚本添加更多业务上下文：

```markdown
## 业务背景

本场景用于测试 CRM 系统的"线索转商机"核心流程。
在实际业务中，销售人员需要：

1. 对线索进行初步评估
2. 确认客户预算和决策周期
3. 填写 SPIN 销售分析
4. 最终转化为正式商机

**注意**：转化时必须填写预计成交金额和成交概率。
```

### 场景 3：标注测试数据来源

说明测试数据的获取方式：

```markdown
## 测试数据

| 字段 | 值 | 说明 |
|------|----|----|
| 客户名称 | test线索新建客户 | 测试环境预置数据 |
| 商机金额 | 1200 | 手动输入 |
| 成交概率 | 56% | 系统推荐值 |
| 商机阶段 | 报价 | 从下拉列表选择 |
```

### 场景 4：记录业务规则

文档化发现的业务规则：

```markdown
## 业务规则

1. **Admin 账户无需审批**
   - Admin 创建的报价自动通过
   - 普通用户需要提交审批流程

2. **线索评分机制**
   - 预算评分 (leadScoringBudget)
   - SPIN 分析得分
   - 综合评分决定是否可转化

3. **商机阶段流转**
   - 初步接触 → 需求确认 → 方案报价 → 商务谈判 → 赢单/输单
   - 不允许跳过中间阶段
```

---

## 🎨 Markdown 渲染支持

编辑器支持以下 Markdown 语法的实时预览：

### 标题

```markdown
# 一级标题
## 二级标题
### 三级标题
```

### 文本样式

```markdown
**粗体文本**
`行内代码`
```

### 列表

```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

### 代码块

使用反引号包裹行内代码：\`代码\`

### 引用

```markdown
> 这是一段引用文本
> 可以跨多行
```

---

## 🔧 技术实现细节

### 文件位置

- **编辑器保存路径**：`ui-recorder-workspace/semantic-script.md`
- **Kiro 读取路径**：同上（工作区根目录下的固定位置）

### 保存机制

当你点击"💾 保存修改"按钮时：

1. 前端发送 IPC 消息：`save-semantic-script`
2. 主进程写入文件：`ui-recorder-workspace/semantic-script.md`
3. 更新 session 状态：`session.semanticScript = content`
4. 回复前端：`semantic-script-saved` 事件

### 自动加载机制

当你进入 Step 2（语义分析）页面时：

1. 前端发送 IPC 消息：`check-semantic-script`
2. 主进程检查文件是否存在
3. 如果存在，读取内容并发送回前端
4. 前端自动填充到编辑区和预览区

### 实时预览实现

编辑区绑定 `oninput` 事件：

```javascript
function onSemanticScriptEdit() {
  semanticScriptDirty = true;
  document.getElementById('btn-save-semantic').disabled = false;
  
  const script = document.getElementById('semantic-script-edit').value;
  const preview = document.getElementById('semantic-preview');
  
  if (script.trim()) {
    preview.innerHTML = renderMarkdown(script);
  } else {
    preview.innerHTML = '<div class="empty-state">编辑左侧脚本，预览将实时更新</div>';
  }
}
```

---

## 🤝 与 Kiro 的协作

### Kiro 生成语义脚本

**触发方式**：点击"🧠 生成语义脚本"按钮

**Kiro 执行的操作**：
1. 读取 `ui-recorder-workspace/semantic-context.md`（包含 UI 脚本和 API 列表）
2. 分析业务场景和操作步骤
3. 生成 Markdown 格式的语义脚本
4. 保存到 `ui-recorder-workspace/semantic-script.md`

**Electron 工具的响应**：
- 文件监听器检测到文件变化
- 自动加载新内容到编辑区
- 更新预览区

### 你编辑后 Kiro 可以读取

**场景**：你在编辑器中修改了语义脚本并保存

**后续操作**：
1. 进入 Step 3（API 调试）
2. Kiro 生成 API 测试脚本时会读取你修改后的语义脚本
3. 你的修改会反映在生成的 API 测试脚本的注释和结构中

**示例**：

如果你在语义脚本中标注了：

```markdown
## 步骤 3：创建报价单（需要提取 token）

**业务含义**：销售人员为商机创建正式报价
**API**：POST /form/api/v2/form-entity-data/quotation-management/quotation-form/new
**关键参数**：
- client: 需要从客户列表获取客户 ID
- opportunity: 需要从商机列表获取商机 ID
```

Kiro 生成的 API 脚本会包含类似的注释：

```javascript
test('3. 创建报价单', async () => {
  // 销售人员为商机创建正式报价
  // client 参数需要从客户列表获取
  // opportunity 参数需要从商机列表获取
  
  const response = await apiContext.post('/form/api/v2/form-entity-data/quotation-management/quotation-form/new', {
    data: {
      client: clientId,  // 从之前步骤获取
      opportunity: opportunityId,  // 从之前步骤获取
      ...
    }
  });
  
  expect(response.status()).toBe(200);
});
```

---

## 📝 最佳实践

### 1. 保持结构清晰

使用标题层次组织内容：

```markdown
# 业务场景名称

## 场景概述
...

## 业务流程
...

## 详细步骤

### 步骤 1：...
### 步骤 2：...
### 步骤 3：...

## 关键业务概念
...

## 技术实现要点
...
```

### 2. 标注 API 与步骤的对应关系

```markdown
### 步骤 2：用户登录

**操作**：输入用户名和密码，点击登录

**触发的 API**：
- `POST /user-management/api/user/login` - 用户认证
- `GET /user-management/api/user/get-user-info` - 获取用户信息

**返回值**：
- `accessToken` - 用于后续请求的 Authorization header
- `projectToken` - 用于 project_token header
```

### 3. 记录测试数据

```markdown
## 测试数据清单

| 数据类型 | 字段 | 值 | 来源 |
|---------|------|----|----|
| 登录凭证 | username | jinjin.zhang@bizops.com.cn | 测试账号 |
| 登录凭证 | password | Test@123456 | 测试密码 |
| 客户信息 | name | test线索新建客户 | 手动创建 |
| 商机信息 | amount | 1200 | 手动输入 |
```

### 4. 说明业务规则和约束

```markdown
## 业务规则

### 字段验证规则
- **商机名称**：必填，最大长度 100 字符
- **预计成交金额**：必填，必须大于 0
- **成交概率**：必填，范围 0-100

### 关联字段要求
- **客户字段**：必须选择已存在的客户，不能手动输入
- **商机字段**：必须选择状态为"进行中"的商机
```

### 5. 补充 Kiro 遗漏的信息

Kiro 可能无法推断的信息，你可以手动补充：

```markdown
## 注意事项

1. **环境依赖**
   - 测试账号：jinjin.zhang@bizops.com.cn
   - 测试环境：https://bot.ceta.crm.duxing.cn
   - 需要预置数据：test线索新建客户

2. **前置条件**
   - 客户"test线索新建客户"已存在
   - 线索状态为"未转化"
   - 用户有线索转化权限

3. **已知问题**
   - 商机金额输入框偶尔会失去焦点，需要重新点击
   - 报价审批人必须是不同于创建人的用户
```

---

## 🔄 工作流示例

### 完整流程

1. **录制操作**
   - 在 Step 1 录制 UI 操作
   - 捕获 API 请求

2. **生成初稿**
   - 进入 Step 2
   - 点击"生成语义脚本"
   - Kiro 生成初始版本

3. **人工优化**
   - 阅读生成的语义脚本
   - 在编辑器中修改：
     - 补充业务背景
     - 修正不准确的描述
     - 添加测试数据说明
     - 标注业务规则

4. **保存确认**
   - 点击"保存修改"
   - 确认预览效果

5. **生成 API 脚本**
   - 进入 Step 3
   - 点击"生成 API 脚本"
   - Kiro 结合你优化后的语义脚本生成测试代码

6. **API 调试**
   - 回放 API 脚本
   - 根据需要继续优化

---

## 🛠️ 故障排除

### 问题 1：保存按钮无响应

**症状**：点击"💾 保存修改"后没有反应

**解决方案**：
1. 检查编辑区是否有内容（空内容会提示）
2. 查看控制台是否有错误（按 F12 打开开发者工具）
3. 检查 `ui-recorder-workspace` 目录是否有写入权限

### 问题 2：预览区不更新

**症状**：编辑脚本后右侧预览不变化

**解决方案**：
1. 检查是否在编辑区输入了内容
2. 尝试删除一个字符再重新输入（触发 `oninput` 事件）
3. 刷新页面（按 F5）

### 问题 3：保存后 Kiro 读不到

**症状**：保存了语义脚本，但 Kiro 生成 API 脚本时没有使用

**解决方案**：
1. 确认文件已保存到 `ui-recorder-workspace/semantic-script.md`
2. 检查文件内容是否正确（用外部编辑器打开验证）
3. 重新点击"生成 API 脚本"按钮

### 问题 4：Markdown 语法不生效

**症状**：输入的 Markdown 语法在预览区显示为纯文本

**解决方案**：
- 检查语法是否正确（注意空格、换行）
- 当前编辑器支持基础 Markdown，复杂语法可能不支持
- 已支持的语法：标题、粗体、代码、列表、引用

---

## 📚 相关文档

- **README.md** - Business REST API Recorder 总体介绍
- **QUICK_REFERENCE.md** - 快速参考指南
- **CURRENT_STATUS.md** - 当前功能状态
- **START_HERE.md** - 新手入门指南

---

## 🎯 总结

语义脚本编辑器是连接"录制操作"和"生成测试脚本"的桥梁：

1. **Kiro 生成初稿** - 基于技术数据（UI 脚本、API 列表）
2. **你添加业务知识** - 补充业务背景、规则、数据来源
3. **Kiro 生成代码** - 结合技术和业务信息生成高质量测试脚本

**记住**：
- ✅ 编辑器支持实时预览，编辑体验流畅
- ✅ 保存后 Kiro 可以立即读取你的修改
- ✅ 你的业务知识会反映在最终的 API 测试脚本中

**建议工作流**：
Kiro 生成 → 你优化 → Kiro 再生成 → 你继续优化 → 迭代直到满意

享受高效的测试脚本生成体验！🚀
