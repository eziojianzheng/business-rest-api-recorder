---
name: ceta-api-doc-generator
description: >
  从 CETA seed data (JSON) 和内部 JS 代码中提取 API 信息，生成完整的 API 文档。
  包括每个参数的详细说明、获取方式、示例值等。
license: MIT
metadata:
  version: "1.0.0"
  author: "CETA Team"
  tags: ["ceta", "api", "documentation", "seed-data", "openapi"]
  triggers:
    - "生成 CETA API 文档"
    - "CETA API 文档"
    - "从 seed data 生成文档"
    - "ceta-api-doc"
---

# CETA API 文档生成器

## 触发条件

当用户发送包含以下内容的消息时，激活此 SKILL：
- "生成 CETA API 文档"
- "从 seed data 生成 API 文档"
- "CETA API 文档"

---

## 功能概述

从 CETA 的 seed data (JSON) 和内部 JS 代码中提取 API 信息，生成完整的 API 文档，包括：

1. **API 端点列表** - 所有可用的 API 接口
2. **请求参数详解** - 每个参数的类型、必填性、说明、获取方式
3. **响应格式** - 返回数据结构和字段说明
4. **示例请求** - 可直接使用的 curl/Playwright 示例
5. **业务场景** - API 的使用场景和业务含义

---

## 工作流程

### Stage 1: 分析 Seed Data

**输入**:
- `pbc-seed-data.json` - PBC 的完整配置
- `*-fields.json` - FormEntity 字段定义
- `*-form.json` - FormEntity 布局配置
- `pbc-config.json` - PBC 元数据

**分析内容**:
1. **FormEntity 结构** → 推导 CRUD API
2. **字段定义** → 推导请求参数和响应字段
3. **字段类型** → 推导参数验证规则
4. **关联关系** → 推导级联查询 API

**输出**:
```json
{
  "entities": [
    {
      "token": "customer",
      "name": "客户",
      "apis": [
        {
          "method": "POST",
          "path": "/form/api/pbc/{pbcToken}/entity/{entityToken}",
          "description": "创建客户",
          "parameters": [...]
        }
      ]
    }
  ]
}
```

### Stage 2: 分析 JS 代码

**输入**:
- 前端代码 (React/Vue 组件)
- API 调用代码 (axios/fetch)
- 业务逻辑代码

**分析内容**:
1. **API 调用点** → 识别实际使用的 API
2. **参数构造逻辑** → 理解参数如何获取和组装
3. **错误处理** → 识别可能的错误码
4. **业务流程** → 理解 API 调用顺序

**输出**:
```javascript
// 示例：从代码中提取的 API 调用模式
const createCustomer = async (formData) => {
  // 参数来源：表单输入
  const params = {
    name: formData.name,           // 来源：用户输入
    phone: formData.phone,         // 来源：用户输入
    projectId: getCurrentProject(), // 来源：全局状态
    createdBy: getUserId()         // 来源：登录用户信息
  };
  
  return await api.post('/form/api/pbc/customer-mgmt/entity/customer', params);
};
```

### Stage 3: 生成完整文档

**输出格式**:
- **Markdown** - 人类可读的文档
- **OpenAPI 3.0** - 机器可读的 API 规范
- **Postman Collection** - 可导入 Postman 的集合

---

## 使用方法

### 方法 1: 从 Seed Data 生成

```
在 Kiro 中说: "从 seed data 生成 CETA API 文档"

然后提供:
1. pbc-seed-data.json 文件路径
2. 或者 ceta-workspace 目录路径
```

Kiro 会自动:
1. 读取 seed data
2. 分析 FormEntity 结构
3. 推导 CRUD API
4. 生成文档

### 方法 2: 从录制数据生成

```
在 Kiro 中说: "从录制数据生成 CETA API 文档"
```

Kiro 会:
1. 读取 `ui-recorder-workspace/network.har`
2. 提取 CETA API 调用
3. 分析请求参数和响应
4. 生成文档

### 方法 3: 结合 Seed Data 和录制数据

```
在 Kiro 中说: "生成完整的 CETA API 文档"
```

Kiro 会:
1. 从 seed data 获取字段定义
2. 从录制数据获取实际参数值
3. 从 JS 代码获取参数来源
4. 生成最完整的文档

---

## 文档结构

### Markdown 文档

```markdown
# CETA API 文档 - {PBC 名称}

## 概述
- PBC Token: customer-mgmt
- PBC 名称: 客户管理
- 版本: 1.0.0

## API 列表

### 1. 创建客户

**端点**: `POST /form/api/pbc/customer-mgmt/entity/customer`

**业务场景**: 在系统中创建新的客户记录

**请求头**:
| 参数 | 类型 | 必填 | 说明 | 获取方式 |
|------|------|------|------|---------|
| Authorization | string | 是 | Bearer Token | 登录后从响应中获取 accessToken |
| project_token | string | 是 | 项目标识 | 登录后从响应中获取 projectToken |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 获取方式 | 示例值 |
|------|------|------|------|---------|--------|
| name | string | 是 | 客户名称 | 用户输入 | "张三" |
| phone | string | 是 | 手机号 | 用户输入 | "13800138000" |
| email | string | 否 | 邮箱 | 用户输入 | "zhangsan@example.com" |
| projectId | number | 是 | 项目ID | 从全局状态获取 getCurrentProject() | 1 |
| createdBy | number | 是 | 创建人ID | 从登录用户信息获取 getUserId() | 123 |

**响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 456,
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "projectId": 1,
    "createdBy": 123,
    "createdAt": "2026-05-27T10:00:00Z"
  }
}
```

**Playwright 示例**:
```javascript
const { test, expect, request } = require('@playwright/test');

test('创建客户', async ({ playwright }) => {
  const apiContext = await request.newContext({
    baseURL: 'https://ceta.example.com',
    ignoreHTTPSErrors: true
  });

  // 1. 登录获取 token
  const loginRes = await apiContext.post('/user-management/api/user/login', {
    data: {
      username: 'admin@example.com',
      password: 'encrypted_password'
    }
  });
  const { accessToken, projectToken } = (await loginRes.json()).data;

  // 2. 创建客户
  const response = await apiContext.post('/form/api/pbc/customer-mgmt/entity/customer', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'project_token': projectToken
    },
    data: {
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      projectId: 1,
      createdBy: 123
    }
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.data).toHaveProperty('id');
  expect(body.data.name).toBe('张三');
});
```

**curl 示例**:
```bash
# 1. 登录
curl -X POST https://ceta.example.com/user-management/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@example.com","password":"encrypted_password"}'

# 2. 创建客户（使用上一步获取的 token）
curl -X POST https://ceta.example.com/form/api/pbc/customer-mgmt/entity/customer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -H "project_token: {projectToken}" \
  -d '{
    "name": "张三",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "projectId": 1,
    "createdBy": 123
  }'
```

---

### 2. 查询客户列表

**端点**: `GET /form/api/pbc/customer-mgmt/entity/customer/list`

**业务场景**: 分页查询客户列表，支持筛选和排序

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 获取方式 | 示例值 |
|------|------|------|------|---------|--------|
| page | number | 否 | 页码（从1开始） | 用户翻页操作 | 1 |
| pageSize | number | 否 | 每页数量 | 固定值或用户选择 | 20 |
| name | string | 否 | 客户名称（模糊查询） | 用户输入搜索框 | "张" |
| phone | string | 否 | 手机号（精确查询） | 用户输入搜索框 | "13800138000" |

**响应格式**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 100,
    "list": [
      {
        "id": 456,
        "name": "张三",
        "phone": "13800138000",
        "email": "zhangsan@example.com"
      }
    ]
  }
}
```

---

## 参数获取方式详解

### 1. 用户输入
- **来源**: 表单字段、搜索框、输入框
- **示例**: name, phone, email
- **代码模式**: `formData.fieldName` 或 `event.target.value`

### 2. 全局状态
- **来源**: Redux/Vuex store、Context API
- **示例**: projectId, tenantId
- **代码模式**: `store.getState().project.id` 或 `getCurrentProject()`

### 3. 登录用户信息
- **来源**: 登录后存储的用户信息
- **示例**: createdBy, userId, username
- **代码模式**: `getUserInfo().id` 或 `localStorage.getItem('userId')`

### 4. URL 参数
- **来源**: 路由参数、查询字符串
- **示例**: id (详情页), entityId (编辑页)
- **代码模式**: `useParams().id` 或 `$route.params.id`

### 5. 关联数据
- **来源**: 前一个 API 的响应
- **示例**: 创建后返回的 id 用于后续更新
- **代码模式**: `createResponse.data.id`

### 6. 系统生成
- **来源**: 前端或后端自动生成
- **示例**: timestamp, uuid, token
- **代码模式**: `Date.now()` 或 `uuidv4()`

---

## OpenAPI 3.0 规范

生成的 OpenAPI 文档可以:
- 导入 Swagger UI 查看
- 导入 Postman 生成请求集合
- 用于自动生成 SDK

```yaml
openapi: 3.0.0
info:
  title: CETA API - 客户管理
  version: 1.0.0
  description: 客户管理 PBC 的 API 文档

servers:
  - url: https://ceta.example.com
    description: 生产环境

paths:
  /form/api/pbc/customer-mgmt/entity/customer:
    post:
      summary: 创建客户
      tags:
        - 客户管理
      security:
        - bearerAuth: []
        - projectToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
                - phone
                - projectId
                - createdBy
              properties:
                name:
                  type: string
                  description: 客户名称（来源：用户输入）
                  example: "张三"
                phone:
                  type: string
                  description: 手机号（来源：用户输入）
                  example: "13800138000"
                email:
                  type: string
                  description: 邮箱（来源：用户输入）
                  example: "zhangsan@example.com"
                projectId:
                  type: integer
                  description: 项目ID（来源：getCurrentProject()）
                  example: 1
                createdBy:
                  type: integer
                  description: 创建人ID（来源：getUserId()）
                  example: 123
      responses:
        '200':
          description: 创建成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                    example: 200
                  message:
                    type: string
                    example: "success"
                  data:
                    type: object
                    properties:
                      id:
                        type: integer
                        example: 456
                      name:
                        type: string
                        example: "张三"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    projectToken:
      type: apiKey
      in: header
      name: project_token
```

---

## 实现步骤

### 步骤 1: 读取 Seed Data

```python
import json

def parse_seed_data(seed_data_path):
    with open(seed_data_path) as f:
        data = json.load(f)
    
    pbc = data['pbc']
    entities = []
    
    for entity in pbc['formEntityList']:
        entity_info = {
            'token': entity['token'],
            'name': entity['name'],
            'fields': entity['fields'],
            'apis': generate_crud_apis(entity)
        }
        entities.append(entity_info)
    
    return entities

def generate_crud_apis(entity):
    """根据 FormEntity 生成 CRUD API"""
    pbc_token = entity['pbcToken']
    entity_token = entity['token']
    
    return [
        {
            'method': 'POST',
            'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}',
            'description': f'创建{entity["name"]}',
            'operation': 'create'
        },
        {
            'method': 'GET',
            'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/list',
            'description': f'查询{entity["name"]}列表',
            'operation': 'list'
        },
        {
            'method': 'GET',
            'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
            'description': f'查询{entity["name"]}详情',
            'operation': 'get'
        },
        {
            'method': 'PUT',
            'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
            'description': f'更新{entity["name"]}',
            'operation': 'update'
        },
        {
            'method': 'DELETE',
            'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
            'description': f'删除{entity["name"]}',
            'operation': 'delete'
        }
    ]
```

### 步骤 2: 分析字段定义

```python
def analyze_field(field):
    """分析字段，推导参数信息"""
    param = {
        'name': field['token'],
        'type': map_field_type(field['type']),
        'required': field.get('required', False),
        'description': field.get('name', field['token']),
        'source': infer_source(field),
        'example': generate_example(field)
    }
    return param

def map_field_type(ceta_type):
    """映射 CETA 字段类型到 API 参数类型"""
    type_map = {
        'text': 'string',
        'number': 'integer',
        'decimal': 'number',
        'date': 'string (ISO 8601)',
        'datetime': 'string (ISO 8601)',
        'select': 'string',
        'multiSelect': 'array',
        'reference': 'integer (ID)',
        'boolean': 'boolean'
    }
    return type_map.get(ceta_type, 'string')

def infer_source(field):
    """推断参数来源"""
    token = field['token']
    
    # 常见模式识别
    if token in ['projectId', 'tenantId']:
        return '全局状态 (getCurrentProject())'
    elif token in ['createdBy', 'updatedBy', 'userId']:
        return '登录用户信息 (getUserId())'
    elif token in ['createdAt', 'updatedAt']:
        return '系统生成 (服务端自动填充)'
    elif field.get('type') == 'reference':
        return '关联数据 (前一个 API 响应或下拉选择)'
    else:
        return '用户输入 (表单字段)'

def generate_example(field):
    """生成示例值"""
    field_type = field['type']
    token = field['token']
    
    if 'name' in token.lower():
        return '张三'
    elif 'phone' in token.lower():
        return '13800138000'
    elif 'email' in token.lower():
        return 'zhangsan@example.com'
    elif field_type == 'number':
        return 123
    elif field_type == 'date':
        return '2026-05-27'
    elif field_type == 'datetime':
        return '2026-05-27T10:00:00Z'
    elif field_type == 'boolean':
        return True
    else:
        return f'示例{field.get("name", token)}'
```

### 步骤 3: 从录制数据提取实际值

```python
import json

def extract_from_har(har_path):
    """从 HAR 文件提取 API 调用信息"""
    with open(har_path) as f:
        har = json.load(f)
    
    api_calls = []
    for entry in har['log']['entries']:
        request = entry['request']
        response = entry['response']
        
        if '/form/api/pbc/' in request['url']:
            api_call = {
                'method': request['method'],
                'url': request['url'],
                'headers': {h['name']: h['value'] for h in request['headers']},
                'request_body': json.loads(request['postData']['text']) if request.get('postData') else None,
                'response_body': json.loads(response['content']['text']) if response['content'].get('text') else None,
                'status': response['status']
            }
            api_calls.append(api_call)
    
    return api_calls
```

### 步骤 4: 生成文档

```python
def generate_markdown_doc(entities, api_calls):
    """生成 Markdown 文档"""
    doc = []
    doc.append(f"# CETA API 文档\n")
    doc.append(f"## API 列表\n")
    
    for entity in entities:
        doc.append(f"### {entity['name']}\n")
        
        for api in entity['apis']:
            doc.append(f"#### {api['description']}\n")
            doc.append(f"**端点**: `{api['method']} {api['path']}`\n")
            doc.append(f"**请求参数**:\n")
            doc.append("| 参数 | 类型 | 必填 | 说明 | 获取方式 | 示例值 |\n")
            doc.append("|------|------|------|------|---------|--------|\n")
            
            # 从 entity fields 生成参数表
            for field in entity['fields']:
                param = analyze_field(field)
                doc.append(f"| {param['name']} | {param['type']} | {'是' if param['required'] else '否'} | {param['description']} | {param['source']} | {param['example']} |\n")
            
            doc.append("\n")
    
    return ''.join(doc)
```

---

## 输出示例

生成的文档会保存到:
- `ceta-api-docs/{pbcToken}/README.md` - Markdown 文档
- `ceta-api-docs/{pbcToken}/openapi.yaml` - OpenAPI 规范
- `ceta-api-docs/{pbcToken}/postman-collection.json` - Postman 集合
- `ceta-api-docs/{pbcToken}/playwright-tests.spec.js` - Playwright 测试脚本

---

## 与 Business REST API Recorder 协同

当同时使用 Business REST API Recorder 和 CETA API 文档生成器时:

1. **录制阶段**: 使用 Business REST API Recorder 录制 CETA 平台操作
2. **分析阶段**: 从录制数据提取实际 API 调用和参数值
3. **增强阶段**: 结合 seed data 补充字段定义和业务含义
4. **生成阶段**: 生成完整的 API 文档

**工作流**:
```
录制 CETA 操作
    ↓
捕获 API 调用 (HAR)
    ↓
读取 seed data (JSON)
    ↓
分析字段定义和参数来源
    ↓
生成完整 API 文档
```

---

## 总结

CETA API 文档生成器可以:
- ✅ 从 seed data 自动推导 CRUD API
- ✅ 分析字段定义生成参数说明
- ✅ 推断参数来源和获取方式
- ✅ 从录制数据提取实际参数值
- ✅ 生成多种格式的文档 (Markdown, OpenAPI, Postman)
- ✅ 生成可执行的测试脚本

**核心价值**:
1. **自动化** - 无需手动编写 API 文档
2. **准确性** - 基于实际代码和数据生成
3. **完整性** - 包含参数来源和示例
4. **可用性** - 生成可直接使用的测试脚本

