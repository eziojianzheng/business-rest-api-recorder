@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: Electron 路径
set ELECTRON=node_modules\electron\dist\electron.exe

:: 检查 Electron 是否存在
if not exist "%ELECTRON%" (
    echo 首次运行，正在安装依赖...
    echo 注意：需要系统安装 Node.js/npm
    call npm install
)

:: 启动应用
if exist "%ELECTRON%" (
    echo 启动 Business REST API Recorder...
    start "" "%ELECTRON%" "."
) else (
    echo 错误：Electron 未找到，请先安装依赖
    pause
)
