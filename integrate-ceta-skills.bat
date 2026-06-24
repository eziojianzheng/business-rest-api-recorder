@echo off
chcp 65001 >nul
echo ========================================
echo   CETA Skills 自动集成工具
echo ========================================
echo.
echo 此工具将帮助你自动集成 CETA Skills
echo.
echo 使用方法:
echo   1. 直接运行此文件,然后输入 CETA Skills 的路径
echo   2. 或者拖拽 CETA Skills 目录到此文件上
echo.
echo ========================================
echo.

if "%~1"=="" (
    REM 没有参数,交互式运行
    powershell -ExecutionPolicy Bypass -File "integrate-ceta-skills.ps1"
) else (
    REM 有参数,使用提供的路径
    powershell -ExecutionPolicy Bypass -File "integrate-ceta-skills.ps1" -SourcePath "%~1"
)

pause
