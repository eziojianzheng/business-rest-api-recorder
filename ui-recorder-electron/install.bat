@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║           UI Recorder - 一键安装                        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: ── 检查 Node.js ──────────────────────────────────────────────
echo [1/4] 检查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ✗ 未检测到 Node.js！
    echo.
    echo  请先安装 Node.js v18 或更高版本：
    echo  https://nodejs.org/zh-cn/download
    echo.
    echo  安装完成后重新运行此脚本。
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✓ Node.js %NODE_VER%

:: ── 检查 npm ──────────────────────────────────────────────────
echo [2/4] 检查 npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  ✗ npm 未找到，请重新安装 Node.js
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo  ✓ npm %NPM_VER%

:: ── 安装依赖 ──────────────────────────────────────────────────
echo [3/4] 安装依赖包（首次约需 1-2 分钟）...
echo.
call npm install --prefer-offline 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ✗ 依赖安装失败，尝试清理缓存后重试...
    call npm cache clean --force
    call npm install
    if %errorlevel% neq 0 (
        echo  ✗ 安装失败，请检查网络连接后重试
        pause
        exit /b 1
    )
)
echo.
echo  ✓ npm 依赖安装完成

:: ── 安装 Playwright 浏览器 ────────────────────────────────────
echo [4/4] 安装 Playwright 浏览器（首次约需 2-3 分钟）...
echo.
call npx playwright install chromium --with-deps 2>&1
if %errorlevel% neq 0 (
    echo  ⚠ Playwright chromium 安装失败，尝试安装 chrome...
    call npx playwright install chrome 2>&1
)
echo.
echo  ✓ Playwright 浏览器安装完成

:: ── 创建桌面快捷方式 ──────────────────────────────────────────
echo.
echo 创建桌面快捷方式...
set SCRIPT_DIR=%~dp0
set SHORTCUT=%USERPROFILE%\Desktop\UI Recorder.lnk
set TARGET=%SCRIPT_DIR%start.bat

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'UI Recorder - 测试录制工具'; $s.Save()" 2>nul
if exist "%SHORTCUT%" (
    echo  ✓ 桌面快捷方式已创建
) else (
    echo  ⚠ 快捷方式创建失败（不影响使用）
)

:: ── 完成 ──────────────────────────────────────────────────────
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║  ✓ 安装完成！                                           ║
echo ║                                                          ║
echo ║  使用方式：                                              ║
echo ║  1. 双击桌面的 "UI Recorder" 快捷方式启动工具           ║
echo ║     或运行 start.bat                                     ║
echo ║  2. 在 Kiro 中打开此工作区目录                          ║
echo ║  3. 在工具中录制操作，然后在 Kiro 聊天框调试脚本        ║
echo ╚══════════════════════════════════════════════════════════╝
echo.
set /p LAUNCH=是否现在启动 UI Recorder？(Y/N): 
if /i "%LAUNCH%"=="Y" (
    start "" "%TARGET%"
)
