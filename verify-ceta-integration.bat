@echo off
chcp 65001 >nul
echo ========================================
echo   CETA Skills 集成验证
echo ========================================
echo.

echo [1/3] 检查 skills 目录结构...
if exist "skills\ui-recorder\SKILL.md" (
    echo ✓ ui-recorder Skill 存在
) else (
    echo ✗ ui-recorder Skill 缺失
    goto :error
)

if exist "skills\ceta" (
    echo ✓ ceta 目录存在
) else (
    echo ✗ ceta 目录不存在
    echo.
    echo 请先执行以下命令复制 CETA Skills:
    echo.
    echo New-Item -ItemType Directory -Path "skills\ceta" -Force
    echo Copy-Item -Recurse "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta-basic" "skills\ceta\"
    echo Copy-Item -Recurse "C:\Users\jianz\Downloads\ceta-skills-windows-amd64-2.0.39\ceta-ai-skills-windows-amd64\ceta-ai-skills\skills\ceta\ceta-api" "skills\ceta\"
    echo.
    goto :error
)

echo.
echo [2/3] 检查 CETA Skills...
if exist "skills\ceta\ceta-basic\SKILL.md" (
    echo ✓ ceta-basic Skill 存在
) else (
    echo ✗ ceta-basic Skill 缺失
)

if exist "skills\ceta\ceta-api\SKILL.md" (
    echo ✓ ceta-api Skill 存在
) else (
    echo ⚠ ceta-api Skill 缺失 (可选)
)

echo.
echo [3/3] 检查集成文档...
if exist "CETA_INTEGRATION_GUIDE.md" (
    echo ✓ CETA 集成指南存在
) else (
    echo ✗ CETA 集成指南缺失
)

if exist ".kiro\steering\ceta-ui-recorder-bridge.md" (
    echo ✓ 桥接指南存在
) else (
    echo ✗ 桥接指南缺失
)

echo.
echo ========================================
echo   ✓ 集成验证完成!
echo ========================================
echo.
echo 下一步:
echo 1. 在 Kiro 中说: "我要录制 CETA 平台的操作"
echo 2. 开始录制并生成脚本
echo 3. 查看生成的语义脚本是否包含 CETA 业务术语
echo.
pause
exit /b 0

:error
echo.
echo ========================================
echo   ✗ 验证失败
echo ========================================
echo.
pause
exit /b 1
