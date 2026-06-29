@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   CRM 自动化测试平台                 ║
echo  ║   http://localhost:3030              ║
echo  ╚══════════════════════════════════════╝
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo        下载地址: https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [提示] 首次启动，正在安装依赖...
    npm install
    echo.
)

echo [启动中] 正在启动服务器...
start "" http://localhost:3030
node server.js

if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器启动失败，请查看上方错误信息
)
pause
