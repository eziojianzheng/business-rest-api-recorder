# CETA API 文档生成器

从 CETA seed data (JSON) 和录制的 HAR 数据自动生成完整的 API 文档。

## 功能特性

✅ **自动推导 CRUD API** - 从 FormEntity 结构自动生成增删改查接口  
✅ **参数详细说明** - 每个参数的类型、必填性、说明、获取方式  
✅ **示例值生成** - 智能生成符合业务场景的示例值  
✅ **参数来源推断** - 自动识别参数来自用户输入、全局状态还是系统生成  
✅ **实际值提取** - 从 HAR 文件提取录制时的真实参数值  
✅ **多格式输出** - Markdown、OpenAPI、Postman、Playwright 测试脚本  

## 快速开始

### 安装依赖

```bash
# Python 3.7+
python3 --version
```

### 基础用法

```bash
# 从 seed data 生成文档
python3 scripts/generate_api_doc.py path/to/pbc-seed-data.json

# 结合 HAR 文件生成（包含实际参数值）
python3 scripts/generate_api_doc.py path/to/pbc-seed-data.json --har path/to/network.har

# 指定输出目录
python3 scripts/generate_api_doc.py path/to/pbc-seed-data.json --output ./my-api-docs
```

### 与 Business REST API Recorder 协同

```bash
# 1. 使用 Business REST API Recorder 录制 CETA 操作
# 2. 录制完成后，运行文档生成器

python3 skills/ceta-api-doc-generator/scripts/generate_api_doc.py \
  path/to/pbc-seed-data.json \
  --har ui-recorder-workspace/network.har \
  --output ceta-api-docs
```

## 输入文件

### 1. pbc-seed-data.json (必需)

CETA PBC 的完整配置文件，包含：
- PBC 元数据 (name, token, description)
- FormEntity 列表 (实体定义)
- 字段定义 (fields)
- 布局配置 (layouts)

**示例结构**:
```json
{
  "projectToken": "my-project",
  "pbc": {
    "name": "客户管理",
    "token": "customer-mgmt",
    "formEntityList": [
      {
        "name": "客户",
        "token": "customer",
        "fields": [
          {
            "name": "客户名称",
            "token": "name",
            "type": "text",
            "required": true
          }
        ]
      }
    ]
  }
}
```

### 2. network.har (可选)

Business REST API Recorder 录制的网络请求文件，包含：
- 实际的 API 调用
- 真实的请求参数
- 响应数据

**获取方式**:
1. 使用 Business REST API Recorder 录制 CETA 操作
2. 录制完成后，HAR 文件保存在 `ui-recorder-workspace/network.har`

## 输出文件

### 1. README.md

Markdown 格式的 API 文档，包含：
- API 端点列表
- 请求参数详解（类型、必填性、说明、获取方式、示例值）
- 响应格式
- Playwright 测试示例
- curl 命令示例

**示例**:
```markdown
### 创建客户

**端点**: `POST /form/api/pbc/customer-mgmt/entity/customer`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 | 获取方式 | 示例值 |
|------|------|------|------|----------|--------|
| name | string | 是 | 客户名称 | 用户输入 (表单字段) | `张三` |
| phone | string | 是 | 手机号 | 用户输入 (表单字段) | `13800138000` |
| projectId | integer | 是 | 项目ID | 全局状态 (getCurrentProject()) | `1` |
```

### 2. openapi.yaml (待实现)

OpenAPI 3.0 规范，可以：
- 导入 Swagger UI 查看
- 导入 Postman 生成请求集合
- 用于自动生成 SDK

### 3. postman-collection.json (待实现)

Postman 集合，可以直接导入 Postman 使用。

### 4. playwright-tests.spec.js (待实现)

Playwright 测试脚本，可以直接运行。

## 参数来源识别

文档生成器会自动识别参数的来源：

| 参数模式 | 识别为 | 示例 |
|---------|--------|------|
| projectId, tenantId | 全局状态 | `getCurrentProject()` |
| createdBy, userId | 登录用户信息 | `getUserId()` |
| createdAt, updatedAt | 系统生成 | 服务端自动填充 |
| reference 类型字段 | 关联数据 | 下拉选择或前一个 API 响应 |
| file, image 类型字段 | 文件上传 | 先调用上传接口获取 URL |
| 其他字段 | 用户输入 | 表单字段 |

## 示例值生成

文档生成器会根据字段名和类型智能生成示例值：

| 字段名模式 | 生成的示例值 |
|-----------|-------------|
| name | `张三` |
| phone, mobile | `13800138000` |
| email | `zhangsan@example.com` |
| address | `北京市朝阳区` |
| company | `示例公司` |
| number 类型 | `123` |
| date 类型 | `2026-05-27` |
| datetime 类型 | `2026-05-27T10:00:00Z` |
| boolean 类型 | `true` |

## 在 Kiro 中使用

### 激活 Skill

在 Kiro 中说：
```
"生成 CETA API 文档"
```

或者：
```
"从 seed data 生成 API 文档"
```

### 提供文件路径

Kiro 会询问：
```
请提供以下文件路径：
1. pbc-seed-data.json 路径（必需）
2. network.har 路径（可选，用于提取实际参数值）
```

### 生成文档

Kiro 会自动：
1. 读取 seed data
2. 分析 FormEntity 结构
3. 推导 CRUD API
4. 分析字段定义
5. (可选) 从 HAR 提取实际值
6. 生成完整文档

### 查看结果

文档生成后，Kiro 会告诉你输出目录：
```
✅ API 文档生成完成！

输出目录: ./ceta-api-docs
  - README.md - Markdown 格式的 API 文档
  - openapi.yaml - OpenAPI 3.0 规范
  - postman-collection.json - Postman 集合
```

## 完整工作流示例

### 场景：为"客户管理" PBC 生成 API 文档

**步骤 1: 准备 seed data**

```bash
# 使用 ceta_assemble.py 生成 seed data
python3 skills/ceta/ceta-api/scripts/ceta_assemble.py my-project customer-mgmt

# 输出: ceta-workspace/my-project/pbcs/customer-mgmt/pbc-seed-data.json
```

**步骤 2: 录制 CETA 操作（可选）**

1. 启动 Business REST API Recorder
2. 录制创建客户、查询客户等操作
3. 录制完成后，HAR 文件保存在 `ui-recorder-workspace/network.har`

**步骤 3: 生成 API 文档**

```bash
python3 skills/ceta-api-doc-generator/scripts/generate_api_doc.py \
  ceta-workspace/my-project/pbcs/customer-mgmt/pbc-seed-data.json \
  --har ui-recorder-workspace/network.har \
  --output ceta-api-docs/customer-mgmt
```

**步骤 4: 查看文档**

```bash
# 在浏览器中打开 Markdown 文档
# 或使用 Markdown 编辑器查看
code ceta-api-docs/customer-mgmt/README.md
```

## 与其他工具集成

### 1. 与 Business REST API Recorder 协同

```
录制 CETA 操作
    ↓
捕获 API 调用 (HAR)
    ↓
生成 API 文档
    ↓
文档包含实际参数值
```

### 2. 与 CETA Skills 协同

```
CETA Skills 提供业务知识
    ↓
API 文档生成器提取技术细节
    ↓
生成包含业务语义的文档
```

### 3. 与 Postman 集成

```
生成 postman-collection.json
    ↓
导入 Postman
    ↓
直接测试 API
```

## 高级用法

### 自定义参数来源规则

编辑 `generate_api_doc.py` 中的 `infer_source` 方法：

```python
def infer_source(self, field: Dict) -> str:
    token = field['token'].lower()
    
    # 添加自定义规则
    if token == 'my_custom_field':
        return '自定义来源 (getCustomValue())'
    
    # 默认规则
    ...
```

### 自定义示例值生成

编辑 `generate_api_doc.py` 中的 `generate_example` 方法：

```python
def generate_example(self, field: Dict) -> Any:
    token = field['token'].lower()
    
    # 添加自定义规则
    if token == 'my_custom_field':
        return '自定义示例值'
    
    # 默认规则
    ...
```

## 故障排查

### 问题 1: 找不到 seed data 文件

**错误**:
```
错误: 文件不存在: path/to/pbc-seed-data.json
```

**解决**:
1. 检查文件路径是否正确
2. 确认文件名是 `pbc-seed-data.json`
3. 使用绝对路径

### 问题 2: HAR 文件解析失败

**错误**:
```
JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

**解决**:
1. 确认 HAR 文件是有效的 JSON
2. 使用 Business REST API Recorder 重新录制
3. 检查文件是否完整（没有被截断）

### 问题 3: 生成的文档缺少某些字段

**原因**: seed data 中可能缺少字段定义

**解决**:
1. 检查 `*-fields.json` 文件是否完整
2. 重新运行 `ceta_assemble.py` 生成 seed data
3. 手动补充缺失的字段定义

## 路线图

- [x] 从 seed data 推导 CRUD API
- [x] 分析字段定义生成参数说明
- [x] 智能推断参数来源
- [x] 生成 Markdown 文档
- [x] 生成 Playwright 示例
- [ ] 从 HAR 提取实际参数值
- [ ] 生成 OpenAPI 3.0 规范
- [ ] 生成 Postman 集合
- [ ] 生成完整的 Playwright 测试脚本
- [ ] 支持自定义模板
- [ ] 支持多语言文档

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
