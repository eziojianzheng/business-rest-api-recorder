#!/usr/bin/env python3
"""
generate_api_doc.py - 从 CETA seed data 生成完整的 API 文档

用法:
  python3 generate_api_doc.py <seed-data-path> [--har <har-path>] [--output <output-dir>]

功能:
  1. 读取 pbc-seed-data.json
  2. 分析 FormEntity 结构
  3. 推导 CRUD API
  4. 分析字段定义生成参数说明
  5. (可选) 从 HAR 文件提取实际参数值
  6. 生成 Markdown/OpenAPI/Postman 文档

输出:
  - README.md - Markdown 格式的 API 文档
  - openapi.yaml - OpenAPI 3.0 规范
  - postman-collection.json - Postman 集合
  - playwright-tests.spec.js - Playwright 测试脚本
"""

import json
import sys
import os
import argparse
from typing import Dict, List, Any
from datetime import datetime

class CETAAPIDocGenerator:
    def __init__(self, seed_data_path: str, har_path: str = None, output_dir: str = None):
        self.seed_data_path = seed_data_path
        self.har_path = har_path
        self.output_dir = output_dir or './ceta-api-docs'
        
        self.seed_data = None
        self.har_data = None
        self.pbc_info = None
        self.entities = []
        
    def load_data(self):
        """加载 seed data 和 HAR 数据"""
        print(f"[1/6] 加载数据...")
        
        # 加载 seed data
        with open(self.seed_data_path, 'r', encoding='utf-8') as f:
            self.seed_data = json.load(f)
        
        self.pbc_info = self.seed_data['pbc']
        print(f"  ✓ PBC: {self.pbc_info['name']} ({self.pbc_info['token']})")
        print(f"  ✓ FormEntities: {len(self.pbc_info['formEntityList'])}")
        
        # 加载 HAR (可选)
        if self.har_path and os.path.exists(self.har_path):
            with open(self.har_path, 'r', encoding='utf-8') as f:
                self.har_data = json.load(f)
            print(f"  ✓ HAR 数据已加载")
    
    def analyze_entities(self):
        """分析 FormEntity 结构"""
        print(f"\n[2/6] 分析 FormEntity 结构...")
        
        for entity in self.pbc_info['formEntityList']:
            entity_info = {
                'token': entity['token'],
                'name': entity['name'],
                'pbcToken': entity['pbcToken'],
                'fields': entity['fields'],
                'layouts': entity['layouts'],
                'apis': self.generate_crud_apis(entity)
            }
            self.entities.append(entity_info)
            print(f"  ✓ {entity['name']} ({entity['token']}): {len(entity['fields'])} 字段, {len(entity_info['apis'])} API")
    
    def generate_crud_apis(self, entity: Dict) -> List[Dict]:
        """根据 FormEntity 生成 CRUD API"""
        pbc_token = entity['pbcToken']
        entity_token = entity['token']
        entity_name = entity['name']
        
        return [
            {
                'method': 'POST',
                'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}',
                'description': f'创建{entity_name}',
                'operation': 'create',
                'summary': f'在系统中创建新的{entity_name}记录'
            },
            {
                'method': 'GET',
                'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/list',
                'description': f'查询{entity_name}列表',
                'operation': 'list',
                'summary': f'分页查询{entity_name}列表，支持筛选和排序'
            },
            {
                'method': 'GET',
                'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
                'description': f'查询{entity_name}详情',
                'operation': 'get',
                'summary': f'根据 ID 查询{entity_name}的详细信息'
            },
            {
                'method': 'PUT',
                'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
                'description': f'更新{entity_name}',
                'operation': 'update',
                'summary': f'根据 ID 更新{entity_name}的信息'
            },
            {
                'method': 'DELETE',
                'path': f'/form/api/pbc/{pbc_token}/entity/{entity_token}/{{id}}',
                'description': f'删除{entity_name}',
                'operation': 'delete',
                'summary': f'根据 ID 删除{entity_name}记录'
            }
        ]
    
    def analyze_fields(self):
        """分析字段定义，生成参数信息"""
        print(f"\n[3/6] 分析字段定义...")
        
        for entity in self.entities:
            for field in entity['fields']:
                param = self.analyze_field(field)
                field['param_info'] = param
            print(f"  ✓ {entity['name']}: {len(entity['fields'])} 字段已分析")
    
    def analyze_field(self, field: Dict) -> Dict:
        """分析单个字段，推导参数信息"""
        return {
            'name': field['token'],
            'type': self.map_field_type(field['type']),
            'required': field.get('required', False),
            'description': field.get('name', field['token']),
            'source': self.infer_source(field),
            'example': self.generate_example(field)
        }
    
    def map_field_type(self, ceta_type: str) -> str:
        """映射 CETA 字段类型到 API 参数类型"""
        type_map = {
            'text': 'string',
            'textarea': 'string',
            'number': 'integer',
            'decimal': 'number',
            'date': 'string (ISO 8601)',
            'datetime': 'string (ISO 8601)',
            'select': 'string',
            'multiSelect': 'array',
            'reference': 'integer (ID)',
            'boolean': 'boolean',
            'file': 'string (URL)',
            'image': 'string (URL)'
        }
        return type_map.get(ceta_type, 'string')
    
    def infer_source(self, field: Dict) -> str:
        """推断参数来源"""
        token = field['token'].lower()
        field_type = field['type']
        
        # 常见模式识别
        if token in ['projectid', 'project_id']:
            return '全局状态 (getCurrentProject())'
        elif token in ['tenantid', 'tenant_id']:
            return '全局状态 (getCurrentTenant())'
        elif token in ['createdby', 'created_by', 'userid', 'user_id']:
            return '登录用户信息 (getUserId())'
        elif token in ['updatedby', 'updated_by']:
            return '登录用户信息 (getUserId())'
        elif token in ['createdat', 'created_at', 'updatedat', 'updated_at']:
            return '系统生成 (服务端自动填充)'
        elif field_type == 'reference':
            return '关联数据 (下拉选择或前一个 API 响应)'
        elif field_type in ['file', 'image']:
            return '文件上传 (先调用上传接口获取 URL)'
        else:
            return '用户输入 (表单字段)'
    
    def generate_example(self, field: Dict) -> Any:
        """生成示例值"""
        field_type = field['type']
        token = field['token'].lower()
        
        # 根据字段名推断示例值
        if 'name' in token and 'user' not in token:
            return '张三'
        elif 'phone' in token or 'mobile' in token:
            return '13800138000'
        elif 'email' in token:
            return 'zhangsan@example.com'
        elif 'address' in token:
            return '北京市朝阳区'
        elif 'company' in token:
            return '示例公司'
        elif 'title' in token:
            return '示例标题'
        elif 'description' in token or 'remark' in token:
            return '这是一个示例描述'
        elif field_type == 'number':
            return 123
        elif field_type == 'decimal':
            return 123.45
        elif field_type == 'date':
            return '2026-05-27'
        elif field_type == 'datetime':
            return '2026-05-27T10:00:00Z'
        elif field_type == 'boolean':
            return True
        elif field_type == 'select':
            return '选项1'
        elif field_type == 'multiSelect':
            return ['选项1', '选项2']
        else:
            return f'示例{field.get("name", token)}'
    
    def extract_from_har(self):
        """从 HAR 文件提取实际参数值"""
        if not self.har_data:
            print(f"\n[4/6] 跳过 HAR 分析 (未提供 HAR 文件)")
            return
        
        print(f"\n[4/6] 从 HAR 提取实际参数值...")
        
        api_calls = []
        for entry in self.har_data['log']['entries']:
            request = entry['request']
            response = entry['response']
            
            if '/form/api/pbc/' in request['url']:
                api_call = {
                    'method': request['method'],
                    'url': request['url'],
                    'headers': {h['name']: h['value'] for h in request['headers']},
                    'request_body': None,
                    'response_body': None,
                    'status': response['status']
                }
                
                # 提取请求体
                if request.get('postData'):
                    try:
                        api_call['request_body'] = json.loads(request['postData']['text'])
                    except:
                        pass
                
                # 提取响应体
                if response['content'].get('text'):
                    try:
                        api_call['response_body'] = json.loads(response['content']['text'])
                    except:
                        pass
                
                api_calls.append(api_call)
        
        print(f"  ✓ 提取了 {len(api_calls)} 个 API 调用")
        self.api_calls = api_calls
    
    def generate_markdown(self):
        """生成 Markdown 文档"""
        print(f"\n[5/6] 生成 Markdown 文档...")
        
        doc = []
        doc.append(f"# CETA API 文档 - {self.pbc_info['name']}\n\n")
        doc.append(f"## 概述\n\n")
        doc.append(f"- **PBC Token**: `{self.pbc_info['token']}`\n")
        doc.append(f"- **PBC 名称**: {self.pbc_info['name']}\n")
        doc.append(f"- **描述**: {self.pbc_info.get('description', '暂无描述')}\n")
        doc.append(f"- **生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        doc.append(f"## 通用说明\n\n")
        doc.append(f"### 认证\n\n")
        doc.append(f"所有 API 请求都需要在请求头中包含以下信息：\n\n")
        doc.append(f"| 请求头 | 类型 | 必填 | 说明 | 获取方式 |\n")
        doc.append(f"|--------|------|------|------|----------|\n")
        doc.append(f"| Authorization | string | 是 | Bearer Token | 登录后从响应中获取 `accessToken` |\n")
        doc.append(f"| project_token | string | 是 | 项目标识 | 登录后从响应中获取 `projectToken` |\n\n")
        
        doc.append(f"### 响应格式\n\n")
        doc.append(f"所有 API 响应都遵循统一格式：\n\n")
        doc.append(f"```json\n")
        doc.append(f"{{\n")
        doc.append(f'  "code": 200,\n')
        doc.append(f'  "message": "success",\n')
        doc.append(f'  "data": {{}}\n')
        doc.append(f"}}\n")
        doc.append(f"```\n\n")
        
        doc.append(f"## API 列表\n\n")
        
        # 为每个 entity 生成文档
        for entity in self.entities:
            doc.append(f"### {entity['name']}\n\n")
            
            for api in entity['apis']:
                doc.append(f"#### {api['description']}\n\n")
                doc.append(f"**端点**: `{api['method']} {api['path']}`\n\n")
                doc.append(f"**业务场景**: {api['summary']}\n\n")
                
                # 请求参数
                if api['operation'] in ['create', 'update', 'list']:
                    doc.append(f"**请求参数**:\n\n")
                    doc.append(f"| 参数 | 类型 | 必填 | 说明 | 获取方式 | 示例值 |\n")
                    doc.append(f"|------|------|------|------|----------|--------|\n")
                    
                    for field in entity['fields']:
                        param = field['param_info']
                        required = '是' if param['required'] else '否'
                        example = json.dumps(param['example'], ensure_ascii=False) if isinstance(param['example'], (list, dict)) else str(param['example'])
                        doc.append(f"| {param['name']} | {param['type']} | {required} | {param['description']} | {param['source']} | `{example}` |\n")
                    
                    doc.append(f"\n")
                
                # Playwright 示例
                doc.append(f"**Playwright 示例**:\n\n")
                doc.append(f"```javascript\n")
                doc.append(self.generate_playwright_example(entity, api))
                doc.append(f"```\n\n")
                
                doc.append(f"---\n\n")
        
        # 保存文档
        os.makedirs(self.output_dir, exist_ok=True)
        output_path = os.path.join(self.output_dir, 'README.md')
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(''.join(doc))
        
        print(f"  ✓ Markdown 文档已生成: {output_path}")
    
    def generate_playwright_example(self, entity: Dict, api: Dict) -> str:
        """生成 Playwright 示例代码"""
        lines = []
        
        if api['operation'] == 'create':
            lines.append(f"// 创建{entity['name']}\n")
            lines.append(f"const response = await apiContext.post('{api['path']}', {{\n")
            lines.append(f"  headers: {{\n")
            lines.append(f"    'Authorization': `Bearer ${{accessToken}}`,\n")
            lines.append(f"    'project_token': projectToken\n")
            lines.append(f"  }},\n")
            lines.append(f"  data: {{\n")
            
            for field in entity['fields'][:5]:  # 只显示前5个字段
                param = field['param_info']
                example = json.dumps(param['example'], ensure_ascii=False)
                lines.append(f"    {param['name']}: {example},\n")
            
            lines.append(f"  }}\n")
            lines.append(f"}});\n\n")
            lines.append(f"expect(response.status()).toBe(200);\n")
            lines.append(f"const body = await response.json();\n")
            lines.append(f"expect(body.data).toHaveProperty('id');\n")
        
        elif api['operation'] == 'list':
            lines.append(f"// 查询{entity['name']}列表\n")
            lines.append(f"const response = await apiContext.get('{api['path']}?page=1&pageSize=20', {{\n")
            lines.append(f"  headers: {{\n")
            lines.append(f"    'Authorization': `Bearer ${{accessToken}}`,\n")
            lines.append(f"    'project_token': projectToken\n")
            lines.append(f"  }}\n")
            lines.append(f"}});\n\n")
            lines.append(f"expect(response.status()).toBe(200);\n")
            lines.append(f"const body = await response.json();\n")
            lines.append(f"expect(body.data).toHaveProperty('list');\n")
        
        return ''.join(lines)
    
    def generate_openapi(self):
        """生成 OpenAPI 3.0 规范"""
        print(f"\n[6/6] 生成 OpenAPI 规范...")
        
        # TODO: 实现 OpenAPI 生成
        print(f"  ⚠ OpenAPI 生成功能待实现")
    
    def run(self):
        """执行完整流程"""
        self.load_data()
        self.analyze_entities()
        self.analyze_fields()
        self.extract_from_har()
        self.generate_markdown()
        self.generate_openapi()
        
        print(f"\n✅ API 文档生成完成！")
        print(f"\n输出目录: {self.output_dir}")
        print(f"  - README.md - Markdown 格式的 API 文档")

def main():
    parser = argparse.ArgumentParser(description='从 CETA seed data 生成 API 文档')
    parser.add_argument('seed_data', help='pbc-seed-data.json 文件路径')
    parser.add_argument('--har', help='network.har 文件路径（可选）')
    parser.add_argument('--output', help='输出目录（默认: ./ceta-api-docs）')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.seed_data):
        print(f"错误: 文件不存在: {args.seed_data}", file=sys.stderr)
        sys.exit(1)
    
    generator = CETAAPIDocGenerator(
        seed_data_path=args.seed_data,
        har_path=args.har,
        output_dir=args.output
    )
    
    generator.run()

if __name__ == '__main__':
    main()
