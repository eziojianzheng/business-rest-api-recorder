@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Business REST API Recorder
echo ========================================
echo.

:: Electron 路径
set ELECTRON=ui-recorder-electron\node_modules\electron\dist\electron.exe

:: 检查 Electron 是否存在
if not exist "%ELECTRON%" (
    echo [错误] Electron 未找到！
    echo.
    echo 请先安装依赖：
    echo   cd ui-recorder-electron
    echo   npm install
    echo.
    pause
    exit /b 1
)

echo 启动应用...
start "" "%ELECTRON%" "ui-recorder-electron"

echo.
echo ✓ 应用已启动！
echo 如果窗口没有显示，请检查任务栏。
echo.
timeout /t 2 >nul
