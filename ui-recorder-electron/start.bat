@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: Electron 可执行文件路径
set "ELECTRON=node_modules\electron\dist\electron.exe"

:: 国内镜像（用于在无法访问 GitHub 的网络下下载 Electron / Playwright 运行时）
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/"
set "NPM_MIRROR=https://registry.npmmirror.com"

:: 检查是否已具备运行环境
if exist "%ELECTRON%" goto :launch

:: 检查 Node.js / npm
where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ============================================
echo 首次运行，正在自动安装依赖...
echo ============================================

:: 第一步：尝试默认源安装
echo [1/3] 使用默认源安装依赖...
call npm install
if exist "%ELECTRON%" goto :launch

:: 第二步：默认源失败（常见于无法访问 GitHub），改用国内镜像
echo [2/3] 默认源不可用，切换国内镜像重试...
call npm install --registry=%NPM_MIRROR%
if exist "%ELECTRON%" goto :launch

:: 第三步：依赖已装但 Electron 运行时未下载，单独执行下载脚本
if exist "node_modules\electron\install.js" (
    echo [3/3] 单独下载 Electron 运行时...
    pushd node_modules\electron
    call node install.js
    popd
)
if exist "%ELECTRON%" goto :launch

echo ============================================
echo [错误] 依赖安装失败，请检查网络连接后重试。
echo 如果长期无法访问外网，可手动执行：
echo   set ELECTRON_MIRROR=%ELECTRON_MIRROR%
echo   npm install --registry=%NPM_MIRROR%
echo ============================================
pause
exit /b 1

:launch
echo 启动 Business REST API Recorder...
start "" "%ELECTRON%" "."
