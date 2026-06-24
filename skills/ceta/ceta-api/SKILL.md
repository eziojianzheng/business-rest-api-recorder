---
name: ceta-api
description: >
  CETA 通用 API 调用能力。提供认证管理、通用 HTTP 请求和 Seed Data 导入导出。
  当需要调用没有专用工具的 CETA API 或批量导入导出配置时使用。
  **创建完整 PBC 时，必须使用本 SKILL 的 assemble + import 流程，禁止逐个 API 创建。**
license: MIT
metadata:
  openclaw:
    requires:
      env: ["CETA_API_BASE", "CETA_API_TOKEN"]
    version: "1.0.0"
    author: "CETA Team"
    tags: ["api", "ceta", "auth", "seed-data"]
    source: "builtin"
---

# CETA API 通用调用

## API 路径规则

- Form 模块：`/form/api/...`（表单、PBC、项目、页面、布局）
- Flow 模块：`/flow/api/...`（工作流、事件、数据源、连接器、seed data）

## MCP 工具

### 通用请求
- `ceta_http_request` — 通用 HTTP 请求（兜底工具）

### Seed Data 导入导出

项目级（ProjectController）：
- `project_seed_data_export_json` — 导出项目 seed data 为 JSON（支持控制是否含 flow/connector/UM）
- `project_seed_data_export_json_file` — 导出项目 seed data 为 JSON 文件下载
- `project_seed_data_import_json_file` — 从 JSON 文件导入项目 seed data（支持选择性导入指定 PBC）

PBC 级（PbcController）：
- `pbc_seed_data_export_json_file` — 导出 PBC seed data 为 JSON 文件下载
- `pbc_seed_data_import_json_file` — 从 JSON 文件导入到已有 PBC
- `pbc_seed_data_import_to_project` — 从 JSON 文件导入 PBC 到指定项目

## 认证说明

MCP Server 自动注入 `Authorization: Bearer {token}`。
部分接口需要 `project_token` header。

### 自动登录流程

当 CETA API 返回认证错误（token 为空、过期或被服务端拒绝）时，MCP Server 会返回包含 "ceta_login" 的错误提示。
**遇到此类错误时，必须立即调用 `ceta_login` 工具触发浏览器登录授权，获取新 token 后再重试之前失败的操作。**

- `ceta_login` — 打开浏览器到 CETA 授权页面，用户授权后自动获取 token
- 登录成功后 token 会缓存到本地（`~/.ceta/`），下次启动无需重新登录
- 如果任何 CETA tool 返回 "Not authenticated" 或 "token has expired" 或 "token is invalid"，都应调用 `ceta_login`

---

## 推荐工作流：本地生成 → assemble → import（重要）

**这是创建完整 PBC 的标准流程。** 禁止对包含复杂 schemaJson 的资源逐个调用 MCP API 创建。

### 为什么必须用 seed data 导入？

MCP 工具调用的参数有大小限制。复杂页面的 schemaJson 通常有几千字节，
通过 `form__form_entity_page__create` 的 `schemaJson` 参数传递时会被截断，导致页面渲染异常。
seed data 导入通过文件上传，没有参数大小限制。

### 完整流程

```
Step 1: 在本地生成零散 JSON 文件
  ceta-workspace/{project}/pbcs/{pbc}/
  ├── {entity}-form.json           ← 单 layout（token: default）
  ├── {entity}-{layout}-form.json  ← 多 layout 时每个文件一个 layout
  └── {page}-page.json             ← 页面 schemaJson

Step 2: 运行 assemble-pbc 拼装
  $ ceta_sync.sh assemble-pbc {project-token} {pbc-token}
  → 生成 pbc-seed-data.json

Step 3: 修正 pbc-seed-data.json（post-assemble 修正）
  → 见下方「post-assemble 修正」章节

Step 4: 运行 import-pbc 导入
  $ ceta_sync.sh import-pbc {project-token} {pbc-token}

Step 5: 验证
  → 通过 MCP API 查询页面列表确认 schemaJson 完整
```

### ceta_sync.sh 脚本用法

脚本位置：`skills/ceta/ceta-api/scripts/ceta_sync.sh`

需要的环境变量（从 `.kiro/settings/mcp.json` 的 ceta server env 中获取）：
- `CETA_API_BASE` — API 地址（如 `http://localhost:8888`）
- `CETA_API_TOKEN` — JWT Token
- `CETA_UI_BASE` — UI 地址（可选）

```bash
# 拼装 seed data
CETA_API_BASE="..." CETA_API_TOKEN="..." \
  bash skills/ceta/ceta-api/scripts/ceta_sync.sh assemble-pbc {project} {pbc}

# 导入到平台
CETA_API_BASE="..." CETA_API_TOKEN="..." \
  bash skills/ceta/ceta-api/scripts/ceta_sync.sh import-pbc {project} {pbc}
```

### assemble 脚本的特性

`ceta_assemble.py` 从零散 JSON 拼装 pbc-seed-data.json，具备以下能力：

1. **Layout 数量由文件决定** — 不硬编码生成固定数量的 layout
   - `{entity}-form.json` → 单个 layout，token 为 `default`
   - `{entity}-{layoutToken}-form.json` → 多个 layout，token 从文件名提取
2. **支持 pbc-config.json** — 自动读取 PBC 名称、描述、routesJson、config
3. **支持 entity token 显式声明** — fields 文件或 form.json 中可声明 `entityToken`
4. **FormEntity 的 name 取自 form.json 的 form.title** — 可能需要修正

### Entity Token 解析规则

assemble 脚本按以下优先级确定 FormEntity 的 token：

1. **fields 文件中的 `entityToken` 字段**（最高优先级）
2. **form.json 中的 `entityToken` 字段**
3. **从文件名推导**：去掉 `-form.json` 后缀（最低优先级）

### Layout 文件命名规则

Layout 数量由文件决定，不硬编码。只有当同一份数据在不同业务场景下需要不同交互方式时才创建多个 layout。

| 文件命名 | 生成的 layout |
|---------|--------------|
| `{entity}-form.json` | 单个 layout，token = `default`，defaultLayout = true |
| `{entity}-log-time-form.json` + `{entity}-approve-form.json` | 两个 layout，token 分别为 `approve`、`log-time` |

判断逻辑：
- 如果 form 文件的前缀（去掉 `-form.json`）**精确匹配**某个 fields 文件的前缀 → 单 layout
- 如果 form 文件的前缀以某个 fields 文件前缀开头（如 `timesheet-log-time` 以 `timesheet` 开头）→ 多 layout，layout token 为剩余部分（`log-time`）
- 多 layout 时，按 token 字母排序，第一个为 defaultLayout

示例：

| entity token | form 文件名 | fields 文件名 | 结果 |
|-------------|------------|--------------|------|
| `passenger-info` | `passenger-info-form.json` | `passenger-info-fields.json` | 1 个 layout（token: default） |
| `timesheet` | `timesheet-log-time-form.json` + `timesheet-approve-form.json` | `timesheet-fields.json` | 2 个 layout（token: approve, log-time） |
| `customer-form` | `customer-form.json` | `customer-fields.json`（对象格式，声明 entityToken） | 1 个 layout（token: default） |

### Fields 文件的两种格式

**纯数组格式**（向后兼容，token 从文件名推导）：
```json
[
  { "name": "姓名", "token": "name", "type": "TEXT_BOX" },
  { "name": "邮箱", "token": "email", "type": "TEXT_BOX" }
]
```

**对象格式**（推荐，显式声明 entity token）：
```json
{
  "entityToken": "customer-form",
  "fields": [
    { "name": "客户名称", "token": "customerName", "type": "TEXT_BOX" },
    { "name": "客户编号", "token": "customerCode", "type": "TEXT_BOX" }
  ]
}
```

当 entity token 和文件名前缀不一致时（如 token 是 `customer-form` 但文件名前缀是 `customer`），**必须使用对象格式显式声明**。

### post-assemble 修正

assemble 脚本已自动处理大部分工作（layout 生成、routesJson、config），通常不需要手动修正。
只有以下情况需要手动调整 pbc-seed-data.json：

- FormEntity 的 name 需要修正（默认取自 form.json 的 form.title）
- 需要添加 permissionList（assemble 不生成权限）
- 需要添加 flowDefinitionList（assemble 不生成流程）
- 需要调整 layout 的 defaultLayout 或 sortIndex

---

## pbc-seed-data.json 完整结构

```json
{
  "projectToken": "my-project",
  "pbc": {
    "name": "PBC显示名",
    "token": "pbc-token",
    "category": "BUSINESS",
    "description": "PBC描述",
    "routesJson": "{\"desktop\":{\"/\":{\"pageTitle\":\"首页\",\"schemaId\":\"entry\"}}}",
    "config": "{\"menu\":[{\"label\":\"菜单项\",\"to\":\"/pbc-token/page/entry\",\"icon\":\"oct:home\"}]}",
    "formEntityList": [
      {
        "name": "表单名",
        "token": "entity-token",
        "pbcToken": "pbc-token",
        "isInnerEntity": 0,
        "isMasterData": 0,
        "isAutoLock": 0,
        "isDeletableWhenReferenced": 1,
        "standalone": 0,
        "enableForbidUpdateSomeFieldsValueWhenReferenced": 0,
        "fields": [
          {
            "name": "字段名",
            "token": "fieldToken",
            "type": "TEXT_BOX",
            "maxLength": 200,
            "autoLock": false,
            "forbidToUpdate": false
          }
        ],
        "layouts": [
          {
            "name": "默认表单",
            "token": "default",
            "defaultLayout": true,
            "sortIndex": 0,
            "schemaJson": "{...}"
          }
        ]
      }
    ],
    "formEntityPageList": [
      {
        "schemaId": "page-schema-id",
        "name": "页面名",
        "schemaJson": "{...}"
      }
    ],
    "flowDefinitionList": [],
    "permissionList": [],
    "formDashboardLayoutList": [],
    "uiPluginList": []
  }
}
```

### 关键字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `pbc.routesJson` | string (JSON) | PBC 级路由配置，JSON 字符串 |
| `pbc.config` | string (JSON) | PBC 级菜单配置，JSON 字符串 |
| `formEntity.isInnerEntity` 等 | int (0/1) | 布尔字段用 0/1，不能用 true/false |
| `field.autoLock` | boolean | 字段级布尔用 true/false |
| `layout.schemaJson` | string (JSON) | 布局 UI 结构，JSON 字符串 |
| `layout.defaultLayout` | boolean | 是否默认布局，用 true/false |
| `page.schemaJson` | string (JSON) | 页面 UI 结构，JSON 字符串 |

### seed data 导入按 token 匹配

- 导入时按 `token` 匹配已有资源，首次创建不需要 `id`
- 如果 PBC 已存在（同 token），导入会**完全覆盖**该 PBC 的所有配置
- FormEntity 按 `token` 匹配，Layout 按 `token` 匹配，Page 按 `schemaId` 匹配

---

## 什么时候用 MCP API vs seed data 导入

| 操作 | 用 MCP API | 用 seed data 导入 |
|------|-----------|------------------|
| 检查项目/PBC 是否存在 | ✅ | |
| 创建项目 | ✅ | |
| 创建完整 PBC（多表单+多页面） | ❌ | ✅ |
| 修改单个字段属性 | ✅ | |
| 更新单个布局的 schemaJson | ✅（如果 JSON 不大） | ✅（如果 JSON 很大） |
| 更新 frontEndConfig | ✅ | |
| 查询/验证资源 | ✅ | |
| 导出备份 | | ✅ |

## 注意事项
- 所有 API 调用通过 MCP 工具，不要直接发 HTTP 请求
- 创建资源后用查询接口验证
- v2 版本 API 通常使用 token 而非 id 作为路径参数
- ceta_sync.sh 脚本需要环境变量，从 `.kiro/settings/mcp.json` 获取