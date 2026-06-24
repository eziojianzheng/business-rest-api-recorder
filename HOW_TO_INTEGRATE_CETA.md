# 如何集成 CETA Skills

## 🎯 一键集成

只需 3 步,即可完成 CETA Skills 的集成到 Business REST API Recorder!

---

## 📋 方法 1: 拖拽集成 (最简单)

### 步骤 1: 找到 CETA Skills 目录

找到你下载的 CETA Skills 目录,例如:
```
C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills
```

### 步骤 2: 拖拽到集成工具

将 CETA Skills 目录**拖拽**到 `integrate-ceta-skills.bat` 文件上。

### 步骤 3: 选择集成模式

工具会自动扫描可用的 Skills,然后让你选择:
- **1. 最小化集成** (推荐) - 只安装 ceta-basic + ceta-api
- **2. 自定义集成** - 手动选择要安装的 Skills
- **3. 完整集成** (不推荐) - 安装所有 Skills

选择后按 `y` 确认,工具会自动完成集成。

---

## 📋 方法 2: 交互式集成

### 步骤 1: 运行集成工具

双击 `integrate-ceta-skills.bat`

### 步骤 2: 输入路径

工具会提示你输入 CETA Skills 的路径:
```
请输入 CETA Skills 的源目录路径:
示例: C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills

路径: [在这里输入或粘贴路径]
```

### 步骤 3: 选择集成模式

同方法 1 的步骤 3。

---

## 📋 方法 3: 命令行集成 (高级)

### 最小化集成
```powershell
.\integrate-ceta-skills.ps1 -SourcePath "C:\path\to\ceta-skills" -Minimal
```

### 完整集成
```powershell
.\integrate-ceta-skills.ps1 -SourcePath "C:\path\to\ceta-skills" -Full
```

### 交互式集成
```powershell
.\integrate-ceta-skills.ps1 -SourcePath "C:\path\to\ceta-skills"
```

---

## ✅ 验证集成

集成完成后,检查以下目录结构:

```
skills/
├── ui-recorder/
│   └── SKILL.md
└── ceta/
    ├── ceta-basic/
    │   └── SKILL.md
    └── ceta-api/
        └── SKILL.md
```

或者运行验证脚本:
```bash
verify-ceta-integration.bat
```

---

## 🚀 开始使用

集成完成后,在 Kiro 中说:

```
"我要录制 CETA 平台的操作"
```

Kiro 会自动激活 UI Recorder 和 CETA Skills,提供协同工作体验。

---

## 📊 集成模式对比

| 模式 | 安装的 Skills | 优点 | 缺点 | 推荐度 |
|------|--------------|------|------|--------|
| **最小化** | ceta-basic + ceta-api | 简洁、快速、满足大部分需求 | 功能有限 | ⭐⭐⭐⭐⭐ |
| **自定义** | 手动选择 | 灵活、按需安装 | 需要了解各 Skill 功能 | ⭐⭐⭐⭐ |
| **完整** | 所有 Skills | 功能完整 | 项目臃肿、维护困难 | ⭐ |

---

## 🔧 可用的 CETA Skills

### 必需 Skills
- **ceta-basic** - CETA 平台基础知识,提供核心概念和术语

### 推荐 Skills
- **ceta-api** - CETA API 规范,提供接口调用指南

### 可选 Skills
- **ceta-pbc** - PBC (业务组件) 管理
- **ceta-form** - 表单设计
- **ceta-flow** - 流程配置
- **ceta-page** - 页面配置
- **ceta-app-config** - 应用配置
- **ceta-event** - 事件配置
- **ceta-connector** - 连接器管理
- **ceta-extension** - 扩展组件

---

## 🎨 集成效果

### 集成前 (纯 Business REST API Recorder)

**生成的语义脚本**:
```markdown
场景: 用户操作

步骤:
1. 点击按钮
2. 填写表单
3. 提交
```

### 集成后 (Business REST API Recorder + CETA Skills)

**生成的语义脚本**:
```markdown
场景: 创建 PBC (业务组件)

业务背景:
PBC 是 CETA 平台的核心业务组件,用于封装特定领域的业务逻辑和数据模型。

步骤:
1. 用户发起创建 PBC 操作
   **业务含义**: 在 CETA 平台创建新的业务组件
   
2. 用户配置 PBC 基本信息
   **字段说明**:
   - name: PBC 显示名称
   - token: 系统唯一标识符
   - description: 业务用途说明
   
3. 用户提交 PBC 配置
   **触发 API**: POST /form/api/pbc
   **业务含义**: 系统创建 PBC 实例并初始化配置

CETA 平台知识:
- PBC 创建后会自动生成默认的表单布局
- PBC token 在项目内必须唯一
```

---

## ⚠️ 常见问题

### Q1: 集成工具找不到 CETA Skills?

**A**: 确保你提供的路径是正确的,路径应该指向包含 `skills` 目录的根目录。

**正确路径示例**:
```
C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills
```

**错误路径示例**:
```
C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills
```

### Q2: 集成后 Kiro 没有激活 CETA Skills?

**A**: 确保你的消息同时包含 CETA 和 Business REST API Recorder 的关键词,例如:
- ✅ "我要录制 CETA 平台的操作"
- ✅ "帮我为 CETA 项目生成 API 测试脚本"
- ❌ "我要创建一个 PBC" (只会激活 CETA)
- ❌ "我要录制一个网站" (只会激活 Business REST API Recorder)

### Q3: 如何更新已集成的 CETA Skills?

**A**: 重新运行集成工具,选择相同的 Skills,工具会自动覆盖旧版本。

### Q4: 如何卸载 CETA Skills?

**A**: 删除 `skills/ceta` 目录即可:
```powershell
Remove-Item -Recurse -Force "skills\ceta"
```

### Q5: 集成后项目变得很大怎么办?

**A**: 如果你选择了完整集成,可以重新运行工具,选择最小化集成,只保留必要的 Skills。

---

## 📚 相关文档

- [CETA_INTEGRATION_GUIDE.md](CETA_INTEGRATION_GUIDE.md) - 详细的集成指南
- [SKILL_MANAGEMENT.md](SKILL_MANAGEMENT.md) - Skill 管理规范
- [README.md](README.md) - 项目说明
- [.kiro/steering/ceta-ui-recorder-bridge.md](.kiro/steering/ceta-ui-recorder-bridge.md) - 协同工作指南

---

## 🎯 总结

### 推荐流程

1. **运行集成工具**: 双击 `integrate-ceta-skills.bat` 或拖拽目录
2. **选择最小化集成**: 只安装 ceta-basic + ceta-api
3. **验证集成**: 运行 `verify-ceta-integration.bat`
4. **开始使用**: 在 Kiro 中说 "我要录制 CETA 平台的操作"

### 核心原则

- ✅ **保持简洁** - 只安装必要的 Skills
- ✅ **按需扩展** - 需要时再添加其他 Skills
- ✅ **定期清理** - 删除不用的 Skills

---

**准备好了吗?** 运行 `integrate-ceta-skills.bat` 开始集成! 🚀
