#!/usr/bin/env python3
"""
ceta_assemble.py — 从零散 JSON 拼装 pbc-seed-data.json

用法:
  python3 ceta_assemble.py <project-token> <pbc-token>

从 ceta-workspace/{projectToken}/pbcs/{pbcToken}/ 下读取：
  - *-form.json     → FormEntity 的 layout schemaJson
  - *-fields.json   → FormEntity 的字段定义
  - *-page.json     → FormEntityPage 的 schemaJson

拼装为 pbc-seed-data.json（ExportedPbcSeedData 格式），可直接用 ceta_sync.sh import-pbc 导入。

特性：
  - Layout 数量由文件决定，不硬编码
  - 支持通过 pbc-config.json 自定义 PBC 名称、描述、routesJson、config

Layout 文件命名规则：
  - {entity}-form.json → 单个 layout，token 为 "default"，defaultLayout: true
  - {entity}-{layoutToken}-form.json → 多个 layout，token 从文件名中提取
    例如：passenger-info-new-form.json → entity=passenger-info, layoutToken=new
          passenger-info-edit-form.json → entity=passenger-info, layoutToken=edit
          passenger-info-view-form.json → entity=passenger-info, layoutToken=view
  - 多 layout 时，第一个（sortIndex 最小）为 defaultLayout: true

Entity Token 解析规则（兼容两种命名风格）：
  1. 如果 fields 文件是对象格式且包含 "entityToken" 字段 → 使用声明的 token
  2. 如果 form.json 的 schemaJson 中包含 "entityToken" 字段 → 使用声明的 token
  3. 否则从文件名推导：去掉 -form.json 后缀作为 token

  示例：
  - customer-form.json + customer-fields.json（fields 声明 entityToken: "customer-form"）→ token = "customer-form"
  - passenger-info-form.json + passenger-info-fields.json（无声明）→ token = "passenger-info"
  - customer-form.json + customer-fields.json（无声明）→ token = "customer"

Fields 文件支持两种格式：
  - 纯数组（向后兼容）：[{ "name": "...", "token": "...", "type": "..." }, ...]
  - 对象格式（新）：{ "entityToken": "customer-form", "fields": [{ ... }, ...] }
"""
import json, sys, os, glob

def load_fields_file(filepath):
    """加载 fields 文件，返回 (entity_token_override, fields_list)。
    
    entity_token_override 为 None 表示文件中没有显式声明 token，需要从文件名推导。
    """
    with open(filepath) as fh:
        data = json.load(fh)
    
    if isinstance(data, list):
        # 纯数组格式（向后兼容）
        return None, data
    elif isinstance(data, dict):
        # 对象格式：{ "entityToken": "...", "fields": [...] }
        entity_token = data.get("entityToken")
        fields = data.get("fields", [])
        return entity_token, fields
    else:
        return None, []

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 ceta_assemble.py <project-token> <pbc-token>")
        sys.exit(1)

    project_token = sys.argv[1]
    pbc_token = sys.argv[2]
    workspace = os.environ.get("CETA_WORKSPACE", "./ceta-workspace")
    pbc_dir = os.path.join(workspace, project_token, "pbcs", pbc_token)

    if not os.path.isdir(pbc_dir):
        print(f"Error: Directory not found: {pbc_dir}", file=sys.stderr)
        sys.exit(1)

    # Collect form JSONs
    form_files = sorted(glob.glob(os.path.join(pbc_dir, "*-form.json")))
    fields_files = sorted(glob.glob(os.path.join(pbc_dir, "*-fields.json")))
    page_files = sorted(glob.glob(os.path.join(pbc_dir, "*-page.json")))

    # Build fields lookup: file_prefix -> (entity_token_override, fields_list)
    # file_prefix is the part before -fields.json (e.g. "customer" from "customer-fields.json")
    fields_map = {}
    for f in fields_files:
        prefix = os.path.basename(f).replace("-fields.json", "")
        entity_token_override, fields_list = load_fields_file(f)
        fields_map[prefix] = (entity_token_override, fields_list)

    # Load optional pbc-config.json for PBC metadata
    pbc_config_file = os.path.join(pbc_dir, "pbc-config.json")
    pbc_config = {}
    if os.path.exists(pbc_config_file):
        with open(pbc_config_file) as fh:
            pbc_config = json.load(fh)

    # Group form files by entity prefix to detect single vs multi-layout
    # Single layout: {entity}-form.json → one layout with token "default"
    # Multi layout: {entity}-{layoutToken}-form.json → multiple layouts
    #
    # Strategy: first collect all fields prefixes as known entity prefixes.
    # Then for each form file, check if its prefix matches a fields prefix exactly (single layout)
    # or if a fields prefix is a prefix of the form file prefix (multi layout).
    
    known_entity_prefixes = set(fields_map.keys())
    
    # Also detect entity prefixes from form files:
    # If we have passenger-info-form.json → entity = passenger-info (single layout)
    # If we have passenger-info-new-form.json → entity = passenger-info, layout = new
    # We determine this by checking if the form file prefix matches a fields file prefix.
    
    # Build entity -> list of (layout_token, form_file_path, schema)
    entity_layouts = {}  # entity_prefix -> [(layout_token, filepath)]
    
    for f in form_files:
        file_prefix = os.path.basename(f).replace("-form.json", "")
        
        # Check if this prefix exactly matches a known entity (from fields files)
        if file_prefix in known_entity_prefixes:
            # Single layout: {entity}-form.json
            entity_layouts.setdefault(file_prefix, []).append(("default", f))
        else:
            # Try to find a matching entity prefix (multi-layout case)
            # e.g. file_prefix = "passenger-info-new", entity = "passenger-info", layout = "new"
            matched = False
            for entity_prefix in sorted(known_entity_prefixes, key=len, reverse=True):
                if file_prefix.startswith(entity_prefix + "-"):
                    layout_token = file_prefix[len(entity_prefix) + 1:]
                    entity_layouts.setdefault(entity_prefix, []).append((layout_token, f))
                    matched = True
                    break
            
            if not matched:
                # No matching fields file — treat the whole prefix as entity with single layout
                entity_layouts.setdefault(file_prefix, []).append(("default", f))

    # Build form entities
    form_entity_list = []
    for entity_prefix, layout_entries in entity_layouts.items():
        # Resolve entity token and fields
        entity_token = entity_prefix  # default: derive from prefix
        fields = []

        if entity_prefix in fields_map:
            token_override, fields = fields_map[entity_prefix]
            if token_override:
                entity_token = token_override

        # Add required seed data fields to each field
        for field in fields:
            field.setdefault("autoLock", False)
            field.setdefault("forbidToUpdate", False)

        # Also check schema-level entityToken declaration (from first form file)
        first_schema = None
        for _, fp in layout_entries:
            with open(fp) as fh:
                first_schema = json.load(fh)
            break
        
        if first_schema:
            schema_token = first_schema.get("entityToken")
            if schema_token:
                entity_token = schema_token

        entity_name = first_schema.get("form", {}).get("title", entity_token) if first_schema else entity_token

        # Build layouts from form files
        layouts = []
        for sort_index, (layout_token, filepath) in enumerate(sorted(layout_entries, key=lambda x: x[0])):
            with open(filepath) as fh:
                schema = json.load(fh)
            
            # Remove entityToken from schema before serializing (it's metadata, not part of schemaJson)
            schema_for_output = {k: v for k, v in schema.items() if k != "entityToken"}
            schema_str = json.dumps(schema_for_output, ensure_ascii=False)

            layout_name = schema.get("form", {}).get("title", layout_token)

            layouts.append({
                "name": layout_name,
                "token": layout_token,
                "defaultLayout": sort_index == 0,
                "sortIndex": sort_index,
                "schemaJson": schema_str
            })

        form_entity = {
            "name": entity_name,
            "token": entity_token,
            "pbcToken": pbc_token,
            "permissionTarget": entity_token,
            "isInnerEntity": 0,
            "isMasterData": 0,
            "isAutoLock": 0,
            "isDeletableWhenReferenced": 1,
            "standalone": 0,
            "enableForbidUpdateSomeFieldsValueWhenReferenced": 0,
            "fields": fields,
            "layouts": layouts
        }
        form_entity_list.append(form_entity)

        # Log token resolution for debugging
        if entity_token != entity_prefix:
            print(f"  [token-override] {entity_prefix} → entity token: {entity_token} (from {'fields' if fields_map.get(entity_prefix, (None,))[0] else 'schema'} declaration)")

    # Build pages
    page_list = []
    for f in page_files:
        basename = os.path.basename(f).replace("-page.json", "")
        with open(f) as fh:
            schema = json.load(fh)

        page = {
            "schemaId": basename,
            "name": schema.get("form", {}).get("title", basename),
            "schemaJson": json.dumps(schema, ensure_ascii=False)
        }
        page_list.append(page)

    # PBC metadata
    pbc_name = pbc_config.get("name", pbc_token.replace("-", " ").title())
    pbc_description = pbc_config.get("description", "")

    # Assemble pbc-seed-data.json
    seed_data = {
        "projectToken": project_token,
        "pbc": {
            "name": pbc_name,
            "token": pbc_token,
            "category": pbc_config.get("category", "BUSINESS"),
            "description": pbc_description,
            "formEntityList": form_entity_list,
            "formEntityPageList": page_list,
            "flowDefinitionList": [],
            "permissionList": [],
            "formDashboardLayoutList": [],
            "uiPluginList": []
        }
    }

    # Add routesJson if provided in pbc-config.json
    if "routesJson" in pbc_config:
        if isinstance(pbc_config["routesJson"], str):
            seed_data["pbc"]["routesJson"] = pbc_config["routesJson"]
        else:
            seed_data["pbc"]["routesJson"] = json.dumps(pbc_config["routesJson"], ensure_ascii=False)

    # Add config (menu) if provided in pbc-config.json
    if "config" in pbc_config:
        if isinstance(pbc_config["config"], str):
            seed_data["pbc"]["config"] = pbc_config["config"]
        else:
            seed_data["pbc"]["config"] = json.dumps(pbc_config["config"], ensure_ascii=False)

    output_file = os.path.join(pbc_dir, "pbc-seed-data.json")
    with open(output_file, "w") as fh:
        json.dump(seed_data, fh, indent=2, ensure_ascii=False)

    print(f"Assembled pbc-seed-data.json:")
    print(f"  PBC: {pbc_name} ({pbc_token})")
    print(f"  FormEntities: {len(form_entity_list)}")
    for e in form_entity_list:
        layout_tokens = [l['token'] for l in e['layouts']]
        print(f"    - {e['token']}: {len(e['fields'])} fields, {len(e['layouts'])} layout(s) ({', '.join(layout_tokens)})")
    print(f"  Pages: {len(page_list)}")
    for p in page_list:
        print(f"    - {p['schemaId']}: {p['name']}")
    if "routesJson" in seed_data["pbc"]:
        print(f"  routesJson: included")
    else:
        print(f"  routesJson: NOT included (add pbc-config.json to include)")
    if "config" in seed_data["pbc"]:
        print(f"  config (menu): included")
    else:
        print(f"  config (menu): NOT included (add pbc-config.json to include)")
    print(f"  Output: {output_file}")

if __name__ == "__main__":
    main()
