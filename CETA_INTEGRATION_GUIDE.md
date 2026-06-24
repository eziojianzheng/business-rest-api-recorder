# CETA Skills 与 Business REST API Recorder 集成指南

## 📋 集成目标

将 CETA Skills 与 Business REST API Recorder 结合使用,实现:
- 使用 Business REST API Recorder 录制 CETA 平台的操作
- 为 CETA 项目生成 API 测试脚本
- 利用 CETA Skills 的领域知识优化脚本生成

---

## 🏗️ 推荐的目录结构

```
项目根目录/
├── skills/
│   ├── ui-recorder/              # Business REST API Recorder 核心 (保留)
│   │   └── SKILL.md
│   │
│   └── ceta/                     # CETA Skills (新增)
│       ├── ceta-basic/           # CETA 基础
│       │   └── SKILL.md
│       ├── ceta-api/             # CETA API
│       │   └── SKILL.md
│       └── ceta-test/            # CETA 测试 (可选)
│           └── SKILL.md
│
├── ui-recorder-electron/         # Electron 工具
├── ui-recorder-workspace/        # 工作区
└── .kiro/steering/
    ├── ui-recorder.md            # Business REST API Recorder 指南
    └── ceta-ui-recorder-bridge.md  # 集成桥接指南 (新增)
```

---

## 🔗 集成方案

### 方案 1: 最小化集成 (推荐 ⭐⭐⭐)

**只引入必要的 CETA Skills**

#### 步骤 1: 手动复制必要的 Skills

你需要从外部目录复制以下文件:

```powershell
# 1. 创建 CETA 目录
New-Item -ItemType Directory -Path "skills\ceta" -Force

# 2. 复制 ceta-basic (必需)
Copy-Item -Recurse "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta-basic" "skills\ceta\"

# 3. 复制 ceta-api (推荐)
Copy-Item -Recurse "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta\ceta-api" "skills\ceta\"

# 4. 根据需要复制其他 Skills
# Copy-Item -Recurse "外部路径\skills\ceta\ceta-xxx" "skills\ceta\"
```

#### 步骤 2: 创建集成桥接文件

我会帮你创建一个桥接指南,说明如何协同使用。

---

### 方案 2: 符号链接集成 (快速但不推荐)

**创建符号链接指向外部 CETA Skills**

```powershell
# 创建符号链接
New-Item -ItemType SymbolicLink -Path "skills\ceta" -Target "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta"
```

**优点**: 自动同步外部更新  
**缺点**: 引入所有 CETA Skills,可能过于庞大

---

## 🎯 协同使用场景

### 场景 1: 录制 CETA 平台操作

**工作流**:
```
1. 启动 Business REST API Recorder
   ↓
2. 录制 CETA 平台操作 (如创建 PBC、配置表单)
   ↓
3. 生成 UI 脚本 + 捕获 API
   ↓
4. 激活 CETA Skills (提供领域知识)
   ↓
5. 生成语义脚本 (结合 CETA 业务术语)
   ↓
6. 生成 API 测试脚本 (使用 CETA API 规范)
```

**示例**:
```
用户: "我录制了一个创建 PBC 的流程"

Kiro (自动激活):
- ui-recorder Skill → 处理录制数据
- ceta-basic Skill → 提供 PBC 概念和术语
- ceta-api Skill → 提供 API 规范

生成的语义脚本会包含:
- 业务描述: "用户创建了一个新的 PBC (业务组件)"
- API 说明: "调用 POST /form/api/pbc 创建 PBC"
- 字段说明: "pbcToken、name、description 等字段"
```

### 场景 2: 为 CETA 项目生成测试脚本

**工作流**:
```
1. 录制 CETA 项目的完整流程
   ↓
2. 使用 CETA Skills 识别业务实体
   ↓
3. 生成符合 CETA 规范的 API 测试脚本
   ↓
4. 包含 CETA 特定的断言和验证
```

### 场景 3: CETA 平台自动化测试

**工作流**:
```
1. 录制 CETA 平台的各种操作
   ↓
2. 生成测试套件
   ↓
3. 使用 CETA API 知识优化测试
   ↓
4. 回放验证 CETA 平台功能
```

---

## 🔧 集成配置

### 1. 更新 Steering 文件

创建 `.kiro/steering/ceta-ui-recorder-bridge.md`:

```markdown
# CETA 与 Business REST API Recorder 协同指南

## 自动激活规则

当用户消息同时包含以下内容时,同时激活两个 Skill:

**CETA 相关关键词**:
- "CETA"、"PBC"、"FormEntity"、"表单实体"
- "CETA 平台"、"CETA 项目"

**Business REST API Recorder 相关关键词**:
- "录制"、"Business REST API Recorder"、"UI Recorder"、"生成脚本"
- "API 测试"、"语义脚本"

## 协同工作模式

1. **Business REST API Recorder 负责**:
   - 录制操作
   - 捕获 API
   - 生成脚本框架

2. **CETA Skills 负责**:
   - 提供业务术语
   - 解释 API 含义
   - 优化脚本质量

3. **协同输出**:
   - 包含 CETA 业务语义的脚本
   - 符合 CETA API 规范的测试
   - 准确的字段和实体描述
```

### 2. 更新 README.md

在项目 README 中添加 CETA 集成说明。

---

## 📝 使用示例

### 示例 1: 录制创建 PBC 流程

**用户操作**:
```
1. 启动 Business REST API Recorder
2. 打开 CETA 平台
3. 录制创建 PBC 的操作
4. 在 Kiro 中说: "我录制了创建 PBC 的流程,帮我生成语义脚本"
```

**Kiro 响应**:
```
✅ 已激活:
- ui-recorder Skill (处理录制数据)
- ceta-basic Skill (提供 PBC 知识)

我看到你录制了以下操作:
1. 访问 PBC 管理页面
2. 点击"新建 PBC"按钮
3. 填写 PBC 信息:
   - name: "用户管理"
   - token: "user-management"
   - description: "用户管理业务组件"
4. 提交创建

捕获的 API:
- POST /form/api/pbc (创建 PBC)

正在生成语义脚本...
```

### 示例 2: 生成 CETA API 测试脚本

**用户操作**:
```
在 Kiro 中说: "基于录制的数据,生成 CETA API 测试脚本"
```

**Kiro 响应**:
```
✅ 已激活:
- ui-recorder Skill (脚本生成)
- ceta-api Skill (API 规范)

生成的测试脚本将包含:
1. CETA 认证流程
2. 创建 PBC 的 API 调用
3. 验证 PBC 创建成功
4. 清理测试数据

正在生成...
```

---

## ⚠️ 注意事项

### 1. 避免过度集成

**不要**:
- ❌ 复制所有 CETA Skills (会导致项目臃肿)
- ❌ 修改 Business REST API Recorder 核心代码
- ❌ 在 Business REST API Recorder 中硬编码 CETA 逻辑

**应该**:
- ✅ 只复制必要的 CETA Skills
- ✅ 通过 Steering 文件协调
- ✅ 保持两个功能模块独立

### 2. 保持目录清晰

```
✅ 推荐:
skills/
├── ui-recorder/
└── ceta/
    ├── ceta-basic/
    └── ceta-api/

❌ 避免:
skills/
├── ui-recorder/
├── ceta-basic/
├── ceta-pbc/
├── ceta-form/
├── ceta-flow/
├── ceta-page/
└── ... (太多了!)
```

### 3. 版本管理

如果外部 CETA Skills 更新:
```powershell
# 手动同步更新
Copy-Item -Recurse -Force "外部路径\skills\ceta\ceta-basic" "skills\ceta\"
```

---

## 🚀 快速开始

### 最小化集成 (推荐新手)

**只需 3 步**:

1. **复制 ceta-basic**:
   ```powershell
   New-Item -ItemType Directory -Path "skills\ceta" -Force
   Copy-Item -Recurse "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta-basic" "skills\ceta\"
   ```

2. **创建桥接指南** (我会帮你创建)

3. **开始使用**:
   ```
   在 Kiro 中说: "我要录制 CETA 平台的操作"
   ```

---

## 📊 集成效果对比

### 集成前 (纯 Business REST API Recorder)

**生成的语义脚本**:
```
场景: 用户操作表单

步骤:
1. 用户点击"新建"按钮
2. 用户填写表单字段
3. 用户点击"提交"按钮
4. 调用 POST /form/api/pbc 接口
```

### 集成后 (Business REST API Recorder + CETA Skills)

**生成的语义脚本**:
```
场景: 创建 PBC (业务组件)

步骤:
1. 用户发起创建 PBC 操作
2. 用户配置 PBC 基本信息:
   - PBC 名称 (name): "用户管理"
   - PBC 标识 (token): "user-management"
   - PBC 描述 (description): "用户管理业务组件"
3. 用户提交 PBC 配置
4. 系统调用 CETA PBC 创建接口 (POST /form/api/pbc)
5. 验证 PBC 创建成功,返回 PBC ID

业务价值:
PBC 是 CETA 平台的核心业务组件,用于封装特定领域的业务逻辑和数据模型。
```

**差异**:
- ✅ 使用 CETA 业务术语
- ✅ 解释字段含义
- ✅ 说明业务价值
- ✅ 更易于业务人员理解

---

## 🎯 总结

### 推荐方案

**最小化集成 (方案 1)**:
- 只复制 `ceta-basic` 和 `ceta-api`
- 创建桥接指南
- 保持项目结构清晰

### 核心原则

1. **独立但协同** - 两个功能模块独立,通过 Steering 协调
2. **按需引入** - 只引入必要的 CETA Skills
3. **保持简洁** - 避免过度集成导致项目臃肿

### 下一步

告诉我你想:
1. **最小化集成** (只要 ceta-basic + ceta-api)
2. **选择性集成** (告诉我需要哪些具体的 CETA Skills)
3. **完整集成** (复制所有 CETA Skills,不推荐)

我会根据你的选择,帮你完成集成! 🚀
