#!/bin/bash
# ceta_sync.sh — CETA Seed Data 同步工具
#
# 日常开发工作流（PBC 级增量）：
#   1. init-project    — 通过 API 创建项目，导出项目元数据和 frontEndConfig
#   2. export-pbc      — 导出某个 PBC 的 seed data
#   3. import-pbc      — 导入某个 PBC 的 seed data
#   4. update-frontend  — 更新项目的 frontEndConfig（菜单、路由、主题）
#
# 备份/迁移（项目级，慎用）：
#   5. backup-project   — 导出完整项目 seed data（仅备份用）
#
# 注意：不提供项目级导入命令，避免覆盖 PBC 层的改动。

set -e

CETA_API_BASE="${CETA_API_BASE:-http://localhost:8888}"
CETA_API_TOKEN="${CETA_API_TOKEN}"
CETA_UI_BASE="${CETA_UI_BASE:-$CETA_API_BASE}"
WORKSPACE_DIR="${CETA_WORKSPACE:-./ceta-workspace}"

if [ -z "$CETA_API_TOKEN" ]; then
  echo "Error: CETA_API_TOKEN environment variable is required" >&2
  exit 1
fi

AUTH="Authorization: Bearer $CETA_API_TOKEN"

case "$1" in
  init-project)
    # 通过 API 创建项目，然后导出元数据
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh init-project <project-token> <project-name> [description]}"
    PROJECT_NAME="${3:?Usage: ceta_sync.sh init-project <project-token> <project-name> [description]}"
    DESCRIPTION="${4:-$PROJECT_NAME}"
    DIR="$WORKSPACE_DIR/$PROJECT_TOKEN"
    mkdir -p "$DIR/pbcs"

    echo "Creating project '$PROJECT_TOKEN' ..."
    RESULT=$(curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" -H "project_token: ceta" \
      -d "{\"name\":\"$PROJECT_NAME\",\"token\":\"$PROJECT_TOKEN\",\"description\":\"$DESCRIPTION\",\"tags\":\"$PROJECT_NAME\"}" \
      "$CETA_API_BASE/form/api/project")

    echo "$RESULT" | python3 -m json.tool > "$DIR/project.json" 2>/dev/null || echo "$RESULT" > "$DIR/project.json"

    # Check if creation succeeded
    PROJECT_ID=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
    if [ -z "$PROJECT_ID" ]; then
      echo "Error creating project. Response:"
      cat "$DIR/project.json"
      exit 1
    fi

    echo "Project created (id=$PROJECT_ID). Exporting frontEndConfig ..."

    # Export frontEndConfig
    curl -s -H "$AUTH" -H "project_token: $PROJECT_TOKEN" \
      "$CETA_API_BASE/form/api/front-end-config/project-id/$PROJECT_ID" \
      | python3 -m json.tool > "$DIR/frontend-config.json" 2>/dev/null || true

    echo "Done. Workspace: $DIR/"
    echo "  project.json         — 项目元数据"
    echo "  frontend-config.json — 前端配置（菜单、路由、主题）"
    echo "  pbcs/                — PBC seed data 目录"
    echo ""
    echo "  UI: $CETA_UI_BASE/icp-ui/center/project/$PROJECT_ID/basic"
    ;;

  export-pbc)
    # 导出 PBC seed data 到本地
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh export-pbc <project-token> <pbc-token>}"
    PBC_TOKEN="${3:?Usage: ceta_sync.sh export-pbc <project-token> <pbc-token>}"
    DIR="$WORKSPACE_DIR/$PROJECT_TOKEN/pbcs/$PBC_TOKEN"
    mkdir -p "$DIR"

    # Get project ID and PBC ID
    echo "Looking up project '$PROJECT_TOKEN' ..."
    PROJECT_INFO=$(curl -s -H "$AUTH" "$CETA_API_BASE/form/api/project/get-activated-by-token/$PROJECT_TOKEN")
    PROJECT_ID=$(echo "$PROJECT_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    if [ -z "$PROJECT_ID" ]; then
      echo "Error: Project '$PROJECT_TOKEN' not found" >&2
      exit 1
    fi

    echo "Looking up PBC '$PBC_TOKEN' in project $PROJECT_ID ..."
    PBC_LIST=$(curl -s -H "$AUTH" -H "project_token: $PROJECT_TOKEN" \
      "$CETA_API_BASE/form/api/pbc/list-by-project-id/$PROJECT_ID")
    PBC_ID=$(echo "$PBC_LIST" | python3 -c "
import json,sys
data = json.load(sys.stdin)
for p in data:
    if p.get('token') == '$PBC_TOKEN':
        print(p['id'])
        break
" 2>/dev/null)

    if [ -z "$PBC_ID" ]; then
      echo "Error: PBC '$PBC_TOKEN' not found in project '$PROJECT_TOKEN'" >&2
      exit 1
    fi

    echo "Exporting PBC $PBC_ID to $DIR/pbc-seed-data.json ..."
    curl -s -H "$AUTH" \
      "$CETA_API_BASE/form/api/pbc/seed-data/export-with-json-file/$PBC_ID" \
      > "$DIR/pbc-seed-data.json"

    echo "Done. File: $DIR/pbc-seed-data.json"
    ;;

  import-pbc)
    # 导入 PBC seed data
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh import-pbc <project-token> <pbc-token>}"
    PBC_TOKEN="${3:?Usage: ceta_sync.sh import-pbc <project-token> <pbc-token>}"
    FILE="$WORKSPACE_DIR/$PROJECT_TOKEN/pbcs/$PBC_TOKEN/pbc-seed-data.json"

    if [ ! -f "$FILE" ]; then
      echo "Error: File not found: $FILE" >&2
      exit 1
    fi

    # Get project ID
    PROJECT_INFO=$(curl -s -H "$AUTH" "$CETA_API_BASE/form/api/project/get-activated-by-token/$PROJECT_TOKEN")
    PROJECT_ID=$(echo "$PROJECT_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    if [ -z "$PROJECT_ID" ]; then
      echo "Error: Project '$PROJECT_TOKEN' not found" >&2
      exit 1
    fi

    echo "Importing PBC '$PBC_TOKEN' to project $PROJECT_ID from $FILE ..."
    RESULT=$(curl -s -X POST -H "$AUTH" \
      -F "file=@$FILE" \
      "$CETA_API_BASE/form/api/pbc/seed-data/import-with-json-file/project-id/$PROJECT_ID?pbcToken=$PBC_TOKEN")

    echo "$RESULT"
    echo ""
    echo "  Project UI: $CETA_UI_BASE/icp-ui/center/project/$PROJECT_ID/basic"
    ;;

  assemble-pbc)
    # 从零散 JSON 拼装 pbc-seed-data.json
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh assemble-pbc <project-token> <pbc-token>}"
    PBC_TOKEN="${3:?Usage: ceta_sync.sh assemble-pbc <project-token> <pbc-token>}"
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

    CETA_WORKSPACE="$WORKSPACE_DIR" python3 "$SCRIPT_DIR/ceta_assemble.py" "$PROJECT_TOKEN" "$PBC_TOKEN"
    ;;

  update-frontend)
    # 更新项目的 frontEndConfig
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh update-frontend <project-token>}"
    FILE="$WORKSPACE_DIR/$PROJECT_TOKEN/frontend-config.json"

    if [ ! -f "$FILE" ]; then
      echo "Error: File not found: $FILE" >&2
      exit 1
    fi

    # Get project ID and frontEndConfig ID
    PROJECT_INFO=$(curl -s -H "$AUTH" "$CETA_API_BASE/form/api/project/get-activated-by-token/$PROJECT_TOKEN")
    PROJECT_ID=$(echo "$PROJECT_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    FEC_INFO=$(curl -s -H "$AUTH" -H "project_token: $PROJECT_TOKEN" \
      "$CETA_API_BASE/form/api/front-end-config/project-id/$PROJECT_ID")
    FEC_ID=$(echo "$FEC_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    echo "Updating frontEndConfig (id=$FEC_ID) for project '$PROJECT_TOKEN' ..."
    curl -s -X PUT -H "$AUTH" -H "Content-Type: application/json" -H "project_token: $PROJECT_TOKEN" \
      -d @"$FILE" \
      "$CETA_API_BASE/form/api/front-end-config/$FEC_ID"

    echo ""
    echo "Done."
    ;;

  export-frontend)
    # 导出项目的 frontEndConfig
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh export-frontend <project-token>}"
    DIR="$WORKSPACE_DIR/$PROJECT_TOKEN"
    mkdir -p "$DIR"

    PROJECT_INFO=$(curl -s -H "$AUTH" "$CETA_API_BASE/form/api/project/get-activated-by-token/$PROJECT_TOKEN")
    PROJECT_ID=$(echo "$PROJECT_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    echo "Exporting frontEndConfig for project '$PROJECT_TOKEN' ..."
    curl -s -H "$AUTH" -H "project_token: $PROJECT_TOKEN" \
      "$CETA_API_BASE/form/api/front-end-config/project-id/$PROJECT_ID" \
      | python3 -m json.tool > "$DIR/frontend-config.json" 2>/dev/null

    echo "Done. File: $DIR/frontend-config.json"
    ;;

  backup-project)
    # 完整项目导出（仅备份用，不用于日常开发）
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh backup-project <project-token>}"
    DIR="$WORKSPACE_DIR/$PROJECT_TOKEN"
    mkdir -p "$DIR"

    echo "WARNING: This exports the full project seed data. For daily work, use export-pbc instead."
    echo "Exporting project '$PROJECT_TOKEN' ..."
    curl -s -m 120 -H "$AUTH" \
      "$CETA_API_BASE/form/api/project/seed-data/export/project-token/$PROJECT_TOKEN?needFlowSeedData=true&needConnectorSeedData=true" \
      | python3 -m json.tool > "$DIR/project-seed-data.json" 2>/dev/null

    echo "Done. File: $DIR/project-seed-data.json (backup only)"
    ;;

  list-pbcs)
    # 列出项目下的所有 PBC
    PROJECT_TOKEN="${2:?Usage: ceta_sync.sh list-pbcs <project-token>}"

    PROJECT_INFO=$(curl -s -H "$AUTH" "$CETA_API_BASE/form/api/project/get-activated-by-token/$PROJECT_TOKEN")
    PROJECT_ID=$(echo "$PROJECT_INFO" | python3 -c "import json,sys; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

    curl -s -H "$AUTH" -H "project_token: $PROJECT_TOKEN" \
      "$CETA_API_BASE/form/api/pbc/list-by-project-id/$PROJECT_ID" \
      | python3 -c "
import json,sys
data = json.load(sys.stdin)
for p in data:
    print(f'  {p[\"name\"]} (token={p[\"token\"]}, id={p[\"id\"]}, category={p.get(\"category\",\"?\")})')
"
    echo ""
    echo "  Project UI: $CETA_UI_BASE/icp-ui/center/project/$PROJECT_ID/basic"
    ;;

  *)
    echo "CETA Seed Data Sync Tool"
    echo ""
    echo "日常开发（PBC 级增量）："
    echo "  init-project <token> <name> [desc]   创建项目并导出元数据"
    echo "  list-pbcs <project-token>            列出项目下所有 PBC"
    echo "  export-pbc <project-token> <pbc>     导出 PBC seed data"
    echo "  import-pbc <project-token> <pbc>     导入 PBC seed data"
    echo "  assemble-pbc <project-token> <pbc>   从零散 JSON 拼装 pbc-seed-data.json"
    echo "  export-frontend <project-token>      导出 frontEndConfig"
    echo "  update-frontend <project-token>      更新 frontEndConfig"
    echo ""
    echo "备份/迁移（慎用）："
    echo "  backup-project <project-token>       导出完整项目（仅备份）"
    echo ""
    echo "环境变量："
    echo "  CETA_API_BASE    (default: http://localhost:8888)"
    echo "  CETA_API_TOKEN   (required)"
    echo "  CETA_UI_BASE     (default: same as CETA_API_BASE)"
    echo "  CETA_WORKSPACE   (default: ./ceta-workspace)"
    exit 1
    ;;
esac
