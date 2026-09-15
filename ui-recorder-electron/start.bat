@echo off
chcp 65001 >nul
cd /d "%~dp0"
setlocal enabledelayedexpansion

:: ============================================================
::  Business REST API Recorder - 一键安装并启动
::  完全干净的 Windows 也能双击直接跑：
::    没有 Node.js -> 自动下载便携版 Node（免安装/免管理员）
::    没有依赖     -> 自动 npm install（带国内镜像回退）
::    没有浏览器   -> 自动下载 Playwright Chromium
::  唯一前提：能联网。
:: ============================================================

:: 便携 Node 版本与本地目录
set "NODE_VER=v20.18.0"
set "NODE_ARCH=win-x64"
set "NODE_PKG=node-%NODE_VER%-%NODE_ARCH%"
set "NODE_DIR=%~dp0.node\%NODE_PKG%"

:: Electron 可执行文件路径
set "ELECTRON=node_modules\electron\dist\electron.exe"

:: Playwright 浏览器安装标记（避免每次启动都重复安装）
set "PW_FLAG=node_modules\.playwright-installed"

:: 国内镜像
set "ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/"
set "PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/"
set "NPM_MIRROR=https://registry.npmmirror.com"
set "NODE_MIRROR=https://npmmirror.com/mirrors/node"

:: 已完全就绪则直接启动（启动 Electron 不需要 Node，跳过所有安装）
if exist "%ELECTRON%" if exist "%PW_FLAG%" goto :launch

:: ============================================================
::  步骤 0：确保有可用的 Node.js
:: ============================================================
where node >nul 2>nul
if not errorlevel 1 goto :have_node

:: 本地便携 Node 已存在？
if exist "%NODE_DIR%\node.exe" (
    echo [Node] 使用本地便携 Node: %NODE_DIR%
    set "PATH=%NODE_DIR%;%PATH%"
    goto :have_node
)

echo ============================================
echo 未检测到 Node.js，正在自动下载便携版（免安装）...
echo 版本：%NODE_PKG%
echo ============================================

if not exist "%~dp0.node" mkdir "%~dp0.node"
set "NODE_ZIP=%~dp0.node\%NODE_PKG%.zip"

:: 下载（优先国内镜像；失败回退官方源）
echo [Node 1/2] 从国内镜像下载...
powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%NODE_MIRROR%/%NODE_VER%/%NODE_PKG%.zip' -OutFile '%NODE_ZIP%' -UseBasicParsing } catch { exit 1 }"
if not exist "%NODE_ZIP%" (
    echo [Node 2/2] 镜像失败，尝试官方源...
    powershell -NoProfile -Command "try { [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/%NODE_VER%/%NODE_PKG%.zip' -OutFile '%NODE_ZIP%' -UseBasicParsing } catch { exit 1 }"
)
if not exist "%NODE_ZIP%" (
    echo [错误] 便携 Node 下载失败，请检查网络后重试。
    pause
    exit /b 1
)

echo [Node] 解压中...
powershell -NoProfile -Command "try { Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%~dp0.node' -Force } catch { exit 1 }"
if not exist "%NODE_DIR%\node.exe" (
    echo [错误] 便携 Node 解压失败。
    pause
    exit /b 1
)
del "%NODE_ZIP%" >nul 2>nul
set "PATH=%NODE_DIR%;%PATH%"
echo [Node] 便携 Node 就绪。

:have_node
for /f "delims=" %%v in ('node -v 2^>nul') do set "NODEVER_DETECTED=%%v"
echo [Node] 当前 Node 版本：!NODEVER_DETECTED!

:: 已就绪（含浏览器）则直接启动
if exist "%ELECTRON%" if exist "%PW_FLAG%" goto :launch

echo ============================================
echo 正在准备运行环境（首次较慢，请耐心等待）...
echo ============================================

:: ============================================================
::  步骤 1：安装 npm 依赖
:: ============================================================
if exist "%ELECTRON%" goto :install_browser

echo [1/4] 使用默认源安装依赖...
call npm install
if exist "%ELECTRON%" goto :install_browser

echo [2/4] 默认源不可用，切换国内镜像重试...
call npm install --registry=%NPM_MIRROR%
if exist "%ELECTRON%" goto :install_browser

if exist "node_modules\electron\install.js" (
    echo [3/4] 单独下载 Electron 运行时...
    pushd node_modules\electron
    call node install.js
    popd
)
if exist "%ELECTRON%" goto :install_browser

echo ============================================
echo [错误] 依赖安装失败，请检查网络连接后重试。
echo ============================================
pause
exit /b 1

:install_browser
:: ============================================================
::  步骤 2：下载 Playwright Chromium（录制必需）
:: ============================================================
if exist "%PW_FLAG%" goto :launch

echo [4/4] 下载 Playwright Chromium 浏览器（首次较慢）...
call npx playwright install chromium
if errorlevel 1 (
    echo [警告] 浏览器下载失败，使用镜像重试...
    call npx playwright install chromium
)
echo installed at %date% %time% > "%PW_FLAG%"
goto :launch

:launch
echo.
echo 启动 Business REST API Recorder...
start "" "%ELECTRON%" "."
endlocal
