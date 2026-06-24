@echo off
echo ========================================
echo 清理旧进程并重启 UI Recorder
echo ========================================
echo.

echo [1/3] 停止所有 Chrome 进程...
taskkill /F /IM chrome.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Chrome 进程已停止
) else (
    echo ℹ 没有运行中的 Chrome 进程
)

echo.
echo [2/3] 停止所有 Electron 进程...
taskkill /F /IM electron.exe 2>nul
if %errorlevel% equ 0 (
    echo ✓ Electron 进程已停止
) else (
    echo ℹ 没有运行中的 Electron 进程
)

echo.
echo [3/3] 等待 2 秒后启动...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo 启动 UI Recorder
echo ========================================
npm start
