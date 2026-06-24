---
name: ceta-basic
description: >
  CETA 低代码平台基础入口。提供平台上下文、SKILL 关系导航和通用约定。
  所有 CETA 相关任务都应首先加载此 SKILL。
license: MIT
metadata:
  openclaw:
    requires:
      env: ["CETA_API_BASE", "CETA_API_TOKEN"]
    version: "1.0.0"
    author: "CETA Team"
    tags: ["ceta", "platform", "entry-point"]
    layer: "entry"
---

# CETA 低代码平台

## 平台概述

CETA 是一个企业级低代码开发平台。平台的核心数据模型是层级结构：

```
Project（项目/应用）
├── frontEndConfig（前端配置）
│   └── config
│       ├── appConfig（主题、模板、i18n 等）
│       └── routers（全局路由：desktop / mobile）
├── sdkDefinitionList（SDK 定义：可复用的脚本/函数）
├── connectorTypeV2List（连接器类型：外部系统集成定义）
├── actionList（动作定义：连接器的具体操作）
└── pbcList（业务组件列表）
    └── PBC（业务组件，功能模块的最小发布单元）
        ├── formEntityList（表单实体列表）
        │   └── FormEntity
        │       ├── fields（字段定义）
        │       └── layouts（表单布局，含 schemaJson）
        ├── formEntityPageList（页面配置列表）
        ├── flowDefinitionList（工作流定义列表）
        ├── permissionList（权限定义列表）
        ├── formDashboardLayoutList（仪表盘布局列表）
        ├── uiPluginList（UI 插件列表）
        ├── routesJson（PBC 级前端路由配置）
        └── config（PBC 级菜单配置）
```

### 核心概念

| 概念           | 说明                                 | 标识方式                 |
| -------------- | ------------------------------------ | ------------------------ |
| Project        | 顶层应用容器                         | projectId / projectToken |
| frontEndConfig | 前端全局配置（主题、路由）           | projectId                |
| sdkDefinition  | 可复用的脚本/函数定义                | uuid / name              |
| connectorType  | 连接器类型（如 PostgreSQL、S3）      | uuid / name              |
| action         | 连接器的具体操作                     | uuid / identifier        |
| PBC            | 业务组件，功能模块的最小发布单元     | pbcId / pbcToken         |
| FormEntity     | 数据模型（表单），定义字段和布局     | formEntityId / token     |
| Layout         | 表单的不同交互方式（不同流程阶段/角色） | layoutId / token         |
| FormEntityPage | 页面配置（列表页、详情页等）         | pageId / schemaId        |
| FlowDefinition | 工作流定义（嵌套在 PBC 内）          | flowDefinitionId / token |
| Permission     | 权限定义（CRUD 操作权限）            | permissionId / token     |

### 标识符约定

CETA 中大多数资源同时有 `id`（数字）和 `token`（字符串）两种标识：

- `id` 是数据库自增主键
- `token` 是业务标识符，跨环境稳定，推荐使用
- API 路径中 v2 版本通常使用 `{pbcToken}/{entityToken}` 格式
- token 使用 kebab-case（如 `user-management`、`leave-application`）
- 字段 token 使用 camelCase（如 `userName`、`birthDate`）

## SKILL 导航

根据任务类型，按需加载对应的 SKILL。不要一次性全部加载。

| 需要做什么                | 加载哪个 SKILL                         |
| ------------------------- | -------------------------------------- |
| 管理项目/应用             | `skills/ceta/ceta-project/SKILL.md`    |
| 管理 PBC（业务组件）      | `skills/ceta/ceta-pbc/SKILL.md`        |
| 创建/修改表单和字段       | `skills/ceta/ceta-form/SKILL.md`       |
| 设计流程/审批流           | `skills/ceta/ceta-flow/SKILL.md`       |
| 构建页面/列表/仪表盘      | `skills/ceta/ceta-page/SKILL.md`       |
| 配置菜单/主题/路由        | `skills/ceta/ceta-app-config/SKILL.md` |
| 配置事件/触发器           | `skills/ceta/ceta-event/SKILL.md`      |
| 集成外部系统（连接器）    | `skills/ceta/ceta-connector/SKILL.md`  |
| 通用 API 调用 / Seed Data | `skills/ceta/ceta-api/SKILL.md`        |
| 生成 PBC 业务信息文档     | `skills/ceta-biz/ceta-pbc-requirement/SKILL.md` |

#### 输入源分析器（Input Source Analyzers）

以下 SKILL 负责将不同格式的输入解析为结构化数据，再调度上面的核心 SKILL 生成 CETA JSON。
核心 SKILL（ceta-form、ceta-page 等）不关心输入来源，只关心 CETA JSON 的纯粹定义。

| 输入来源       | 加载哪个 SKILL                        | 状态      |
| -------------- | ------------------------------------- | --------- |
| HTML 原型/页面 | `skills/ceta-html-analyzer/SKILL.md`  | ✅ 可用   |
| 设计图片/截图  | `skills/ceta-image-analyzer/SKILL.md` | 🔜 规划中 |
| 需求文档/PRD   | `skills/ceta-doc-analyzer/SKILL.md`   | 🔜 规划中 |

### 参考资料

| 资料                  | 路径                                                                |
| --------------------- | ------------------------------------------------------------------- |
| 项目级 seed data 示例 | `seed-data-examples/secret-base-project-seed-data.json`             |
| PBC 级 seed data 示例 | `seed-data-examples/user-management-new-pbc.json`                   |
| frontEndConfig 模板   | `skills/ceta/ceta-project/references/frontend-config-template.json` |
| 列表页模板            | `skills/ceta/ceta-page/references/list-page-template.json`          |

## 通用约定

### 组件名称规范

统一使用新版组件名：

| 旧名（仍兼容） | 新名（必须使用） |
| -------------- | ---------------- |
| CardLayout     | Card             |
| FlowLayout     | Stack            |
| GridLayout     | Grid             |
| NormalLayout   | Box              |
| Tab            | Tabs             |
| NavTab         | NavTabs          |

### 多语言（i18n）约定

默认只生成三种语言：`zh-CN`（中文）、`en-US`（英文）、`ja-JP`（日文）。
除非用户明确要求其他语言，否则不要生成额外的语言翻译。

- frontEndConfig 的 `allowedLanguages` 默认设为 `["zh-CN", "en-US", "ja-JP"]`
- seed data 中的 name 等字段如需多语言，同样只提供中/英/日三种

### 字段类型映射（component → Field API type）

| component     | Field type    |
| ------------- | ------------- |
| Input         | TEXT_BOX      |
| Textarea      | TEXTAREA      |
| NumberPicker  | NUMBER        |
| Password      | PASSWORD      |
| Select        | SELECT        |
| Radio         | RADIO         |
| Checkbox      | CHECKBOX      |
| Switch        | SWITCH        |
| DatePicker    | DATE          |
| TimePicker    | TIME          |
| Upload        | UPLOAD        |
| ACL           | ACL           |
| Cascader      | CASCADER      |
| TreeSelect    | TREE_SELECT   |
| RichText      | RICH_TEXT     |
| Rate          | RATE          |
| EditableTable | EDITABLE_GRID |

### schemaJson 概述

CETA 平台的 UI 结构通过 schemaJson 描述，统一使用 `{ form, fields }` 结构：

```json
{
  "form": { ... },
  "fields": [ ... ]
}
```

schemaJson 有两种用途：

- **表单布局**（Layout schemaJson）— 用于 FormEntity 的 Layout，描述新建/编辑/查看表单的 UI
- **列表页**（FormEntityPage schemaJson）— 用于 FormEntityPage，描述列表页、仪表盘等页面的 UI

schemaJson 最终在平台中存储为 JSON 字符串（`JSON.stringify`），但生成时输出为格式化的 JSON 对象（2 空格缩进）。

### 安全规则：先查后建，避免误覆盖

**这是最重要的规则。** CETA 是多人共享的平台，操作前必须确认不会覆盖他人的数据。

#### 创建资源前必须检查是否已存在

- 创建 Project 前：调用 `form__project__get_by_token` 检查 token 是否已被占用
- 创建 PBC 前：调用 `form__pbc__list_by_project_id` 检查同名/同 token 的 PBC 是否已存在
- 创建 FormEntity 前：调用 `form__form_entity__list_by_pbc_id` 检查
- 创建 FlowDefinition 前：调用 `flow__flow_definition__list` 检查

#### 如果资源已存在

- **默认行为：停止并告知用户**，说明已存在同名/同 token 的资源，询问是否要更新
- **只有用户明确确认"更新"或"覆盖"时**，才执行 update 操作
- **绝不自动覆盖**已有资源

#### Seed Data 导入的特殊注意

- `project_seed_data_import_json_file` 如果 targetProjectToken 指向已有项目，会覆盖该项目的配置
- `pbc_seed_data_import_json_file` 会覆盖目标 PBC 的配置
- `import-pbc` 会**完全覆盖**目标 PBC 的所有配置（表单、字段、布局、页面）
- **导入前必须告知用户目标项目/PBC 已存在，并获得确认**
- 首次创建 PBC 时可以直接导入，无需备份
- 如果 PBC 已存在且有用户数据，导入前必须先 `export-pbc` 备份
- 建议先用 `project_seed_data_export_json` 或 `pbc_seed_data_export_json_file` 备份现有配置

### API 路径规则

- Form 模块：`/form/api/...`（表单、PBC、项目、页面、布局）
- Flow 模块：`/flow/api/...`（工作流、事件、数据源、连接器、seed data）
- Connector 模块：`/connector/api/...`（连接器类型、操作定义、连接器实例）

### project_token Header

- 大多数 API 需要 `project_token` header 来确定操作的项目上下文
- MCP Server 默认注入 `project_token: ceta`（平台级操作）
- 操作具体项目下的资源时，需要通过 `_headers` 参数传入该项目的 token 覆盖默认值
- 示例：`{ "projectId": 123, "_headers": { "project_token": "my-project" } }`
- 需要 `project_token` 的典型 API：frontEndConfig 的获取和更新

### API 调用规范

- 所有 CETA API 通过 MCP 工具调用，不要直接发 HTTP 请求
- 创建资源后必须用查询接口验证结果
- 如果没有专用工具，使用 `ceta_http_request` 通用工具

### 错误处理

- 4xx 错误：检查参数，修正后重试
- 5xx 错误：等待后重试，最多 3 次（MCP Server 已内置重试）
- 401 错误：Token 无效，任务应终止

### 资源创建策略（重要 — 必须遵守）

创建 CETA 资源有两种方式，**必须根据场景选择正确的方式**：

| 场景                                     | 推荐方式                                  | 原因                                         |
| ---------------------------------------- | ----------------------------------------- | -------------------------------------------- |
| 修改单个字段/更新单个布局                | MCP API 逐个调用                          | 改动小，API 够用                             |
| 创建完整 PBC（含多个表单+页面）          | **本地生成 JSON → assemble → import-pbc** | 页面 schemaJson 通常很大，MCP API 参数会截断 |
| 从外部输入源生成完整项目                 | **本地生成 JSON → assemble → import-pbc** | 保证 schemaJson 完整性                       |
| 只创建一个简单表单（≤6字段，无复杂页面） | MCP API 逐个调用                          | 数据量小，不会截断                           |

**核心规则：当需要创建包含复杂 schemaJson 的页面时，禁止使用 `form__form_entity_page__create` 等 MCP API 直接创建。**
MCP 工具调用的参数有大小限制，复杂页面的 schemaJson 会被截断，导致页面渲染异常。

#### 标准流程：本地生成 → assemble → import-pbc

```
1. 在 ceta-workspace/{project}/pbcs/{pbc}/ 下生成零散 JSON 文件
   ├── {entity}-form.json     （表单布局 schemaJson）
   ├── {entity}-form.json     （表单布局 schemaJson，单 layout 时 token 为 default）
   ├── {entity}-{layoutToken}-form.json （多 layout 时，每个文件对应一个 layout）
   └── {page}-page.json       （页面 schemaJson）

2. 运行 assemble-pbc 拼装 pbc-seed-data.json
   $ ceta_sync.sh assemble-pbc {project} {pbc}
   （根据文件数量生成对应 layout，自动读取 pbc-config.json）

3. 运行 import-pbc 导入到平台
   $ ceta_sync.sh import-pbc {project} {pbc}

4. 更新 frontEndConfig（菜单、路由、主题）
   通过 MCP API form__front_end_config__update 或 ceta_sync.sh update-frontend
```

注意：当 entity token 和文件名前缀不一致时（如 token 是 `customer-form` 但文件名是 `customer-form.json`），
需要在 fields 文件中使用对象格式显式声明 `entityToken`。详见 `skills/ceta/ceta-api/SKILL.md`。

详细的 assemble + import 流程 → 读取 `skills/ceta/ceta-api/SKILL.md`

### 构建完整业务模块的顺序

#### 阶段一：设计确认（新建项目/PBC 时必须）

当用户要求新建项目或新建包含多个表单/页面的 PBC 时，必须先生成设计文档让用户确认，再开始实施。

1. 分析用户需求，在 `ceta-workspace/{projectToken}/` 下创建项目目录
2. 生成 `design.md` 设计文档（见下方模板），列出所有 PBC、表单、字段、页面、流程的设计
3. **暂停，请用户确认设计文档**。等用户确认或提出修改意见
4. 如果用户有修改意见，更新 design.md 后再次确认
5. 用户确认后，进入实施阶段

**跳过设计确认的场景：**
- 给现有 PBC 添加/修改单个字段
- 给现有 PBC 添加/修改单个页面
- 修改 frontEndConfig（菜单/主题）
- 创建/修改流程
- 其他小范围改动

#### 阶段二：实施

1. 确认/创建 Project（tags 不能为空）— MCP API
2. 在 `ceta-workspace/{projectToken}/pbcs/{pbcToken}/` 下创建 PBC 目录
3. 在 PBC 目录下生成所有 JSON 文件（form/fields/page/pbc-config）
4. 运行 `assemble-pbc` 拼装 pbc-seed-data.json
5. 运行 `import-pbc` 导入到平台
6. **【必须】更新 Project 的 frontEndConfig — 配置 navbar 菜单**
7. 创建 FlowDefinition 流程（如需审批流）— MCP API
8. 配置权限 — MCP API

#### 阶段三：文档同步

1. 同步更新 `{projectToken}-app-config.json`
2. 生成/更新 `README.md`（项目级和 PBC 级）
3. 在 `CHANGELOG.md` 中追加本次变更记录

### frontEndConfig 与菜单的关系（重要）

CETA 的菜单系统有两层，必须都配置才能正常显示：

1. **PBC 级 config** — PBC 自身的菜单元数据（routesJson + config）
2. **项目级 frontEndConfig** — 控制前端实际渲染的全局菜单（navbar.items）

**仅设置 PBC 的 config 不会让菜单出现在前端。** 必须在项目的 frontEndConfig 的 `templateConfig.navbar.items` 中注册菜单项。

菜单项路径格式：`/{pbcToken}/page/{schemaId}`

### 批量操作（推荐：PBC 级增量模式）

日常开发只操作 PBC 级别，不要用项目级导入（会覆盖其他 PBC 的改动）。

#### Workspace 目录结构（必须维护）

创建或管理 CETA 项目时，必须在 `ceta-workspace/` 下同步维护对应的目录结构。这是项目的本地工作空间，所有 JSON 文件、配置和文档都存放在这里。不同 session 的 AI 通过这些文件快速理解项目上下文。

```
ceta-workspace/
└── {projectToken}/
    ├── design.md                          # 设计文档（新建项目时首先生成，用户确认后才实施）
    ├── README.md                          # 项目现状文档（实施完成后生成/更新）
    ├── CHANGELOG.md                       # 变更记录（每次修改时追加）
    ├── {projectToken}-app-config.json     # frontEndConfig 配置
    ├── pbcs/
    │   ├── {pbcToken1}/
    │   │   ├── README.md                  # PBC 说明
    │   │   ├── pbc-config.json            # PBC 路由和菜单配置
    │   │   ├── pbc-seed-data.json         # 拼装后的完整 seed data
    │   │   ├── {entity}-form.json         # 表单布局 schemaJson
    │   │   └── {page}-page.json           # 页面 schemaJson
    │   └── {pbcToken2}/
    │       └── ...
    └── project-seed-data.json             # 项目级 seed data（备份用）
```

#### 文档职责划分

| 文档 | 职责 | 何时创建 | 何时更新 |
|------|------|----------|----------|
| `design.md` | 设计蓝图，描述"要做什么" | 新建项目/PBC 前，用户确认后才实施 | 需求变更时更新 |
| `README.md` | 项目现状，描述"做了什么、现在有什么" | 实施完成后生成 | 每次添加/修改资源后更新 |
| `CHANGELOG.md` | 变更历史 | 首次实施完成后创建 | 每次修改时追加条目 |

#### design.md 模板

新建项目时，首先生成此文档让用户确认：

```markdown
# {项目名称} — 设计文档

## 项目概述
{一句话描述项目目标}

## PBC 划分

### {pbc-token} — {PBC 名称}
{PBC 职责描述}

#### 表单实体

**{entity-token}（{表单名称}）**
| 字段 | Token | 类型 | 说明 |
|------|-------|------|------|
| 字段名 | fieldToken | TEXT_BOX | 字段说明 |
| ... | ... | ... | ... |

#### 页面
- `{schema-id}` — {页面名称}（{页面类型：列表页/详情页/自定义页}）

#### 流程
- `{flow-token}` — {流程名称}（{流程类型：审批流/自动化流程}）

## 菜单结构
- {菜单项1}
  - {子菜单项1}
  - {子菜单项2}
```

#### README.md 模板

实施完成后生成，反映项目当前状态：

```markdown
# {项目名称}

## 项目概述
{项目描述}

## PBC 列表
- `{pbc-token}` — {PBC 名称}

## 表单实体
- `{entity-token}` — {表单名称}（{字段数}个字段）

## 页面
- `{schema-id}` — {页面名称}

## 流程
- `{flow-token}` — {流程名称}
```

#### CHANGELOG.md 模板

```markdown
# 变更记录

## {YYYY-MM-DD} — {变更摘要}
- {具体变更内容1}
- {具体变更内容2}
```

每次修改项目时，在文件顶部（标题下方）追加新的变更条目，最新的在最前面。

#### 关键规则

- 新建项目时 → 先创建目录和 `design.md`，用户确认后再实施，实施后生成 `README.md` 和 `CHANGELOG.md`
- 新建 PBC 时 → 先在 design.md 中补充 PBC 设计（如果是大改动），实施后更新 README.md 和 CHANGELOG.md
- 小范围修改时 → 直接实施，更新 README.md 和 CHANGELOG.md
- 每次修改后 → 必须在 CHANGELOG.md 追加变更记录

#### 首次创建项目

```bash
./skills/ceta/ceta-api/scripts/ceta_sync.sh init-project my-project "我的项目" "项目描述"
./skills/ceta/ceta-api/scripts/ceta_sync.sh list-pbcs my-project
```

#### 添加业务 PBC

```bash
./skills/ceta/ceta-api/scripts/ceta_sync.sh import-pbc my-project leave-management
./skills/ceta/ceta-api/scripts/ceta_sync.sh update-frontend my-project
```

#### 修改已有 PBC

```bash
./skills/ceta/ceta-api/scripts/ceta_sync.sh export-pbc my-project leave-management
# 本地修改 pbc-seed-data.json
./skills/ceta/ceta-api/scripts/ceta_sync.sh import-pbc my-project leave-management
```

#### 关于 id 和 token

- seed data 导入按 `token` 匹配，首次创建不需要 id
- 修改时先导出（获取系统 id），再修改，再导入

#### 禁止操作

- **不要用项目级 seed data 导入**（会覆盖所有 PBC 的改动）
- 项目级导出只用于备份：`ceta_sync.sh backup-project`
