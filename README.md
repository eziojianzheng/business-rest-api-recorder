# Business REST API Recorder - 业务 API 录制与测试脚本生成工具

## 项目简介

Business REST API Recorder 是一个基于 Playwright 的自动化测试工具,专注于 **业务 REST API 录制、语义脚本生成和 API 测试脚本生成**。

### 核心功能

1. **UI 操作录制** - 使用 Playwright Codegen 录制用户操作,生成 UI 自动化脚本
2. **业务 REST API 自动捕获** - 录制过程中自动捕获所有业务相关的 REST API 调用(HAR 格式)
3. **业务语义脚本生成** - 基于 UI 脚本和 API 数据,由 AI 生成业务语义描述
4. **REST API 测试脚本生成** - 自动生成可执行的 Playwright API 测试脚本
5. **脚本调试与回放** - 支持脚本调试、修改和回放验证

## 工作流程

```
1. 录制 UI 操作
   ↓
2. 自动捕获业务 REST API 调用
   ↓
3. 生成业务语义脚本(业务描述)
   ↓
4. 生成 REST API 测试脚本
   ↓
5. 回放验证
```

## 项目结构

```
business-rest-api-recorder/
├── ui-recorder-electron/       # Electron 主程序
│   ├── main-flow.js            # 主进程(核心流程控制)
│   ├── index-main.html         # UI 界面
│   ├── package.json            # 依赖配置
│   └── playwright.config.js    # Playwright 配置
│
├── ui-recorder-workspace/      # 工作区(录制数据和生成的脚本)
│   ├── ui-script.js            # UI 自动化脚本
│   ├── network.har             # 网络请求记录
│   ├── semantic-context.md     # 语义脚本生成请求
│   ├── semantic-script.md      # 生成的语义脚本
│   ├── api-context.md          # API 脚本生成请求
│   └── api-script.spec.js      # 生成的 API 测试脚本
│
├── skills/ui-recorder/         # Kiro AI SKILL(调试工作流)
│   └── SKILL.md                # AI 调试指南
│
├── hooks/                      # Kiro Hooks(自动化触发)
│   ├── ui-recorder-chat.kiro.hook
│   ├── ui-recorder-debug.kiro.hook
│   ├── validate-generated-script.kiro.hook
│   └── validate-semantic-script.kiro.hook
│
└── .kiro/steering/             # Kiro 协作指南
    └── ui-recorder.md          # Business REST API Recorder 使用指南
```

## 快速开始

### 1. 安装依赖

```bash
cd ui-recorder-electron
npm install
```

### 2. (可选) 集成 CETA Skills

如果你需要录制 CETA 平台的操作,可以集成 CETA Skills:

**最简单的方法** - 拖拽集成:
1. 找到你的 CETA Skills 目录
2. 将目录拖拽到 `integrate-ceta-skills.bat` 文件上
3. 选择集成模式 (推荐选择"最小化集成")
4. 完成!

**详细说明**: 查看 [如何集成 CETA Skills](HOW_TO_INTEGRATE_CETA.md)

### 3. 启动工具

```bash
npm start
```

或使用批处理文件:
```bash
start-ui-recorder.bat
```

### 3. 录制流程

1. 在工具中输入目标网站 URL
2. 点击"开始录制"按钮
3. Playwright Inspector 窗口会打开,在浏览器中进行操作
4. 操作完成后关闭 Inspector
5. 工具会自动生成 UI 脚本并捕获 API 调用

### 4. 生成语义脚本

1. 点击"生成语义脚本"按钮
2. 工具会创建 `semantic-context.md` 文件
3. 在 Kiro 中发送该文件,AI 会自动生成语义脚本
4. 生成的脚本会自动显示在工具界面中

### 5. 生成 API 测试脚本

1. 确认语义脚本后,点击"生成 API 脚本"按钮
2. 工具会创建 `api-context.md` 文件
3. 在 Kiro 中发送该文件,AI 会自动生成 API 测试脚本
4. 生成的脚本会自动显示在工具界面中

### 6. 回放验证

1. 点击"回放 UI 脚本"或"回放 API 脚本"按钮
2. 查看回放日志和结果
3. 如有问题,可以在 Kiro 中调试修改

## 与 Kiro AI 协作

Business REST API Recorder 深度集成了 Kiro AI,提供智能化的脚本生成和调试能力:

### 自动触发

当你在 Kiro 中提到以下关键词时,会自动激活 Business REST API Recorder SKILL:
- "Business REST API Recorder"
- "UI Recorder"
- "调试 UI 脚本"
- "调试 API 脚本"
- "semantic-context.md"

### CETA 平台集成 (可选)

如果你安装了 CETA Skills,可以实现 Business REST API Recorder 与 CETA 平台的协同:

**协同场景**:
- 录制 CETA 平台操作 (如创建 PBC、配置表单)
- 生成包含 CETA 业务术语的语义脚本
- 生成符合 CETA API 规范的测试脚本

**触发方式**:
同时提到 CETA 和 Business REST API Recorder 关键词,例如:
- "我录制了 CETA 平台的 PBC 创建流程"
- "帮我为 CETA 项目生成 API 测试脚本"

**详细说明**: 查看 [CETA 集成指南](CETA_INTEGRATION_GUIDE.md)

### 调试工作流

Kiro 提供 4 种调试模式:
1. **增加校验并调试** - 自动修复问题 + 加断言,然后回放验证
2. **生成多种测试案例并调试** - 生成边界案例(错误密码、空输入等)
3. **直接调试** - 只修复已知问题,让脚本能跑起来
4. **自定义** - 描述你的需求,AI 来修改脚本

### Hooks 自动化

项目配置了多个 Hooks,实现自动化工作流:
- `ui-recorder-chat.kiro.hook` - 聊天触发
- `ui-recorder-debug.kiro.hook` - 调试触发
- `validate-generated-script.kiro.hook` - 脚本验证
- `validate-semantic-script.kiro.hook` - 语义脚本验证

## 技术栈

- **Electron** - 桌面应用框架
- **Playwright** - 浏览器自动化和测试
- **Playwright Codegen** - UI 操作录制
- **HAR** - 网络请求记录格式
- **Kiro AI** - 智能脚本生成和调试

## 核心特性

### 1. 无感录制
用户只需正常操作网页,所有 UI 操作和 API 调用都会自动捕获。

### 2. 智能分析
AI 会分析 UI 脚本和 API 数据,自动识别业务场景和流程。

### 3. 业务语义
生成的语义脚本使用自然语言描述业务流程,业务人员也能看懂。

### 4. 可执行脚本
生成的 API 测试脚本可以直接运行,无需手动编写。

### 5. 调试友好
集成 Kiro AI,提供智能调试和修复建议。

## 常见问题

### Q: 录制时打开了多个浏览器窗口?
A: 使用 `restart-clean.bat` 清理所有进程后重新启动。

### Q: 生成的脚本无法运行?
A: 在 Kiro 中发送 "调试 UI 脚本" 或 "调试 API 脚本",AI 会自动修复常见问题。

### Q: 如何修改生成的脚本?
A: 可以直接编辑 `ui-recorder-workspace/` 下的脚本文件,工具会自动检测变化。

### Q: 语义脚本不准确怎么办?
A: 在 Kiro 中告诉 AI 需要修改的地方,AI 会重新生成。

## 文档

- [快速参考](ui-recorder-electron/QUICK_REFERENCE.md) - 常用命令和技巧
- [故障排查](ui-recorder-electron/TROUBLESHOOTING.md) - 常见问题解决
- [更新日志](ui-recorder-electron/CHANGELOG.md) - 版本历史
- [当前状态](ui-recorder-electron/CURRENT_STATUS.md) - 项目进展
- [改进建议](ui-recorder-electron/IMPROVEMENTS.md) - 未来计划
- [CETA 集成指南](CETA_INTEGRATION_GUIDE.md) - CETA Skills 集成说明
- [Skill 管理指南](SKILL_MANAGEMENT.md) - 如何安全地添加新 Skill

## 可用 Skills

### 核心 Skills
- **ui-recorder** - Business REST API Recorder 调试工作流,提供脚本调试和修复功能
- **ceta-api-doc-generator** - CETA API 文档生成器,从 seed data 自动生成完整的 API 文档

### CETA Skills (可选)
如果你复制了 CETA Skills,可以使用:
- **ceta-basic** - CETA 平台基础知识,提供核心概念和术语
- **ceta-api** - CETA API 规范,提供接口调用指南

查看 [CETA 集成指南](CETA_INTEGRATION_GUIDE.md) 了解如何安装和使用。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request!
