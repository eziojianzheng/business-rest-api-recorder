# Skill 管理指南

## 📋 目录结构规范

### 当前结构
```
skills/
└── ui-recorder/              # UI Recorder 核心 Skill
    └── SKILL.md
```

### 推荐的扩展结构
```
skills/
├── ui-recorder/              # UI Recorder 核心 Skill (必须保留)
│   └── SKILL.md
│
├── [新 Skill 名称]/          # 新增 Skill
│   ├── SKILL.md              # Skill 定义文件
│   ├── README.md             # Skill 说明文档 (可选)
│   └── examples/             # 示例文件 (可选)
│       └── example.md
│
└── [另一个 Skill]/
    └── SKILL.md
```

---

## 🎯 Skill 分类建议

### 1. 核心 Skill (必须保留)
- `ui-recorder/` - Business REST API Recorder 调试工作流

### 2. 工具类 Skill (可扩展)
适合添加通用工具和辅助功能:
- `code-review/` - 代码审查
- `test-generator/` - 测试生成
- `doc-generator/` - 文档生成
- `refactor-helper/` - 重构助手

### 3. 领域类 Skill (可扩展)
适合添加特定领域的知识:
- `api-design/` - API 设计规范
- `database-design/` - 数据库设计
- `security-audit/` - 安全审计
- `performance-optimization/` - 性能优化

### 4. 项目类 Skill (谨慎添加)
⚠️ **不建议添加**,除非是长期维护的项目:
- 避免添加类似 CETA 这样的大型项目 Skill
- 如需添加,请确保与 UI Recorder 有明确的协同关系

---

## ✅ 添加新 Skill 的标准流程

### 步骤 1: 评估必要性

**问自己以下问题**:
1. ✅ 这个 Skill 是否与 UI Recorder 有协同作用?
2. ✅ 这个 Skill 是否会长期使用?
3. ✅ 这个 Skill 是否足够通用,不会频繁变化?
4. ❌ 这个 Skill 是否会引入大量依赖?
5. ❌ 这个 Skill 是否会与现有功能冲突?

**评估标准**:
- ✅ 3 个以上 → 可以添加
- ⚠️ 2 个 → 谨慎添加,考虑替代方案
- ❌ 1 个或更少 → 不建议添加

### 步骤 2: 创建 Skill 目录

```bash
# 在 skills/ 下创建新目录
mkdir skills/[skill-name]

# 创建 SKILL.md 文件
# 使用下方的模板
```

### 步骤 3: 编写 SKILL.md

使用以下模板:

```markdown
---
name: skill-name
description: >
  简短描述这个 Skill 的功能和用途。
  当用户提到相关关键词时应激活此 SKILL。
license: MIT
metadata:
  version: "1.0.0"
  author: "Your Name"
  tags: ["tag1", "tag2", "tag3"]
  triggers:
    - "关键词1"
    - "关键词2"
    - "关键词3"
---

# Skill 名称

## 触发条件

当用户发送包含以下内容的消息时,激活此 SKILL:
- "关键词1"
- "关键词2"

---

## 功能说明

[详细描述 Skill 的功能]

---

## 使用方法

[说明如何使用这个 Skill]

---

## 示例

[提供使用示例]
```

### 步骤 4: 测试 Skill

1. 在 Kiro 中发送触发关键词
2. 验证 Skill 是否正确激活
3. 测试 Skill 的核心功能
4. 检查是否与现有 Skill 冲突

### 步骤 5: 更新文档

在 `README.md` 中添加新 Skill 的说明:

```markdown
## 可用 Skills

### 核心 Skills
- **ui-recorder** - UI Recorder 调试工作流

### 工具类 Skills
- **[新 Skill 名称]** - [简短描述]
```

---

## 🚫 避免的反模式

### ❌ 反模式 1: 添加过于庞大的 Skill
**问题**: 类似之前的 CETA,包含大量子 Skill 和依赖

**解决方案**: 
- 将大型 Skill 拆分为多个小 Skill
- 或者作为独立项目维护,不放在 skills/ 目录

### ❌ 反模式 2: 添加临时性 Skill
**问题**: 为一次性任务创建 Skill

**解决方案**:
- 使用 `.kiro/steering/` 目录存放临时指南
- 或者直接在对话中提供指令

### ❌ 反模式 3: 添加与项目无关的 Skill
**问题**: 添加与 UI Recorder 完全无关的 Skill

**解决方案**:
- 评估是否真的需要
- 考虑在其他项目中使用

### ❌ 反模式 4: 重复功能的 Skill
**问题**: 新 Skill 与现有 Skill 功能重叠

**解决方案**:
- 扩展现有 Skill 而不是创建新的
- 或者合并相关 Skill

---

## 📦 Skill 隔离策略

### 1. 目录隔离
每个 Skill 独立目录,互不干扰:
```
skills/
├── skill-a/
│   └── SKILL.md
└── skill-b/
    └── SKILL.md
```

### 2. 命名空间隔离
使用清晰的命名避免冲突:
- ✅ `ui-recorder-debug`
- ✅ `api-test-generator`
- ❌ `debug` (太通用)
- ❌ `test` (太通用)

### 3. 触发词隔离
确保触发词不重叠:
- `ui-recorder/` 触发词: "UI Recorder", "调试 UI 脚本"
- `api-design/` 触发词: "API 设计", "接口规范"
- ❌ 避免: 两个 Skill 都用 "API" 作为触发词

### 4. 依赖隔离
每个 Skill 的依赖独立管理:
- 如果需要外部工具,在 Skill 的 README 中说明
- 不要在项目根目录添加 Skill 特定的依赖

---

## 🔄 Skill 生命周期管理

### 添加 Skill
1. 评估必要性
2. 创建目录和文件
3. 编写 SKILL.md
4. 测试功能
5. 更新文档

### 更新 Skill
1. 修改 SKILL.md
2. 更新版本号
3. 测试变更
4. 更新 CHANGELOG (如果有)

### 废弃 Skill
1. 在 SKILL.md 顶部添加废弃警告
2. 说明替代方案
3. 保留一段时间后删除
4. 更新文档

### 删除 Skill
1. 确认没有依赖
2. 删除目录
3. 更新 README.md
4. 记录在 CHANGELOG

---

## 📝 Skill 质量检查清单

添加新 Skill 前,请确认:

### 必须项 ✅
- [ ] SKILL.md 文件存在且格式正确
- [ ] 有清晰的触发条件
- [ ] 有详细的功能说明
- [ ] 有使用示例
- [ ] 触发词不与现有 Skill 冲突
- [ ] 已测试基本功能

### 推荐项 ⭐
- [ ] 有 README.md 说明文档
- [ ] 有版本号和更新日志
- [ ] 有示例文件
- [ ] 有故障排查指南
- [ ] 已更新项目 README.md

### 可选项 💡
- [ ] 有单元测试
- [ ] 有性能基准
- [ ] 有贡献指南
- [ ] 有许可证说明

---

## 🎯 推荐的 Skill 添加场景

### ✅ 适合添加的场景

1. **增强 Business REST API Recorder 功能**
   - 例如: `script-optimizer/` - 优化生成的脚本
   - 例如: `assertion-generator/` - 自动生成断言

2. **通用开发工具**
   - 例如: `code-review/` - 代码审查
   - 例如: `doc-generator/` - 文档生成

3. **测试相关工具**
   - 例如: `test-data-generator/` - 测试数据生成
   - 例如: `mock-server/` - Mock 服务器配置

### ⚠️ 谨慎添加的场景

1. **大型框架或平台**
   - 例如: CETA 这样的完整平台
   - 建议: 作为独立项目维护

2. **频繁变化的业务逻辑**
   - 例如: 特定项目的业务规则
   - 建议: 使用 `.kiro/steering/` 存放

3. **实验性功能**
   - 例如: 尚未稳定的新功能
   - 建议: 先在分支中测试

### ❌ 不建议添加的场景

1. **一次性任务**
   - 直接在对话中处理

2. **与项目无关的功能**
   - 在其他项目中使用

3. **重复现有功能**
   - 扩展现有 Skill

---

## 📚 示例: 添加一个新 Skill

### 场景: 添加 API 文档生成 Skill

#### 1. 评估
- ✅ 与 Business REST API Recorder 协同 (可以为录制的 API 生成文档)
- ✅ 长期使用
- ✅ 通用功能
- ✅ 无大量依赖
- ✅ 不冲突

**结论**: 可以添加

#### 2. 创建目录
```bash
mkdir skills/api-doc-generator
```

#### 3. 创建 SKILL.md
```markdown
---
name: api-doc-generator
description: >
  根据 API 录制数据自动生成 API 文档。
  支持 OpenAPI、Markdown 等多种格式。
license: MIT
metadata:
  version: "1.0.0"
  author: "Business REST API Recorder Team"
  tags: ["api", "documentation", "generator"]
  triggers:
    - "生成 API 文档"
    - "API 文档"
    - "api-doc"
---

# API 文档生成器

## 触发条件
当用户发送包含以下内容的消息时,激活此 SKILL:
- "生成 API 文档"
- "API 文档"

## 功能说明
根据 Business REST API Recorder 录制的 API 数据,自动生成结构化的 API 文档。

支持的格式:
- OpenAPI 3.0
- Markdown
- HTML

## 使用方法
1. 完成 API 录制
2. 在 Kiro 中发送 "生成 API 文档"
3. 选择输出格式
4. 文档自动生成到 `ui-recorder-workspace/api-docs/`

## 示例
[提供示例]
```

#### 4. 测试
- 在 Kiro 中发送 "生成 API 文档"
- 验证 Skill 激活
- 测试文档生成功能

#### 5. 更新 README.md
```markdown
## 可用 Skills

### 核心 Skills
- **ui-recorder** - Business REST API Recorder 调试工作流

### 工具类 Skills
- **api-doc-generator** - API 文档自动生成
```

---

## 🛡️ 保护当前架构的原则

### 1. 最小化原则
- 只添加真正需要的 Skill
- 避免"以防万一"的添加

### 2. 隔离原则
- 每个 Skill 独立目录
- 不共享文件或依赖

### 3. 清晰原则
- 明确的命名
- 清晰的触发条件
- 详细的文档

### 5. 可逆原则
- 添加 Skill 不应修改现有文件
- 删除 Skill 不应影响其他功能

### 6. 协同原则
- 新 Skill 应与 Business REST API Recorder 协同
- 避免添加完全独立的功能

---

## 📊 Skill 管理检查表

### 添加前
- [ ] 评估必要性 (3 个以上 ✅)
- [ ] 检查是否与现有 Skill 冲突
- [ ] 确认命名清晰
- [ ] 准备好 SKILL.md 内容

### 添加时
- [ ] 创建独立目录
- [ ] 编写完整的 SKILL.md
- [ ] 添加 README.md (推荐)
- [ ] 测试基本功能

### 添加后
- [ ] 更新项目 README.md
- [ ] 测试与现有功能的协同
- [ ] 记录在 CHANGELOG (如果有)
- [ ] 备份当前状态 (可选)

---

## 🔧 故障排查

### 问题 1: Skill 没有被激活
**原因**: 触发词不匹配或被其他 Skill 覆盖

**解决**:
1. 检查 SKILL.md 中的 triggers 列表
2. 确认触发词唯一性
3. 尝试更具体的触发词

### 问题 2: Skill 与现有功能冲突
**原因**: 功能重叠或触发词冲突

**解决**:
1. 重新评估是否需要新 Skill
2. 考虑扩展现有 Skill
3. 修改触发词避免冲突

### 问题 3: Skill 导致项目混乱
**原因**: 添加了过多或不相关的 Skill

**解决**:
1. 审查所有 Skill 的必要性
2. 删除不常用的 Skill
3. 合并相似功能的 Skill

---

## 📖 总结

### 核心原则
1. **保持简洁** - 只添加必要的 Skill
2. **保持隔离** - 每个 Skill 独立
3. **保持清晰** - 命名和文档清晰
4. **保持协同** - 与 UI Recorder 协同工作

### 推荐做法
- ✅ 添加增强 Business REST API Recorder 的 Skill
- ✅ 添加通用开发工具 Skill
- ✅ 保持 Skill 目录结构清晰
- ✅ 定期审查和清理 Skill

### 避免做法
- ❌ 添加大型平台类 Skill
- ❌ 添加临时性 Skill
- ❌ 添加与项目无关的 Skill
- ❌ 添加重复功能的 Skill

---

**记住**: 好的架构来自于克制,而不是堆砌功能。每次添加 Skill 前,问自己:"这真的必要吗?"
