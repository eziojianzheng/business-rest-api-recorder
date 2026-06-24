@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 检查是否已安装
if not exist "node_modules" (
    echo 首次运行，正在安装依赖...
    call npm install
)

:: 启动应用
start "" npm start
