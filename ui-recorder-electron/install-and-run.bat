@echo off
echo ========================================
echo UI Recorder - Electron 版本
echo ========================================
echo.

echo [1/3] 检查 Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js 已安装
node --version
echo.

echo [2/3] 安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 安装失败
    pause
    exit /b 1
)

echo.
echo ✓ 依赖安装完成
echo.

echo [3/3] 启动应用...
echo.
call npm start
