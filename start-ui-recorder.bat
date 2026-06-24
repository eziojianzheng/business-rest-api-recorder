@echo off
echo ========================================
echo   UI Recorder - 启动脚本
echo ========================================
echo.

echo [1/3] 检查 Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ✗ Python 未安装或不在 PATH 中
    echo 请先安装 Python 3.8+
    pause
    exit /b 1
)
echo ✓ Python 已安装

echo.
echo [2/3] 检查依赖...
cd ui-recorder\backend
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo 正在安装依赖...
    pip install fastapi uvicorn playwright websockets
    python -m playwright install chromium
)
echo ✓ 依赖已就绪

echo.
echo [3/3] 启动后端服务...
echo.
echo ========================================
echo   后端服务运行在: http://localhost:8000
echo ========================================
echo.
echo 下一步:
echo 1. 在浏览器打开 ui-recorder-pro.html
echo 2. 安装 Chrome 扩展 (见 chrome-extension/INSTALL.txt)
echo 3. 点击扩展图标开始录制
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

python main.py
