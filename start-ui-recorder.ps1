# Business REST API Recorder 启动脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Business REST API Recorder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$electronPath = "ui-recorder-electron\node_modules\electron\dist\electron.exe"
$appPath = "ui-recorder-electron"

# 检查 Electron 是否存在
if (-not (Test-Path $electronPath)) {
    Write-Host "错误: Electron 未安装！" -ForegroundColor Red
    Write-Host "请先运行: cd ui-recorder-electron && npm install" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "启动 Electron 应用..." -ForegroundColor Green
Write-Host ""

# 启动 Electron
Start-Process -FilePath $electronPath -ArgumentList $appPath -WorkingDirectory $PSScriptRoot

Write-Host "应用已启动！" -ForegroundColor Green
Write-Host "如果窗口没有显示，请检查任务栏。" -ForegroundColor Yellow
Write-Host ""

Start-Sleep -Seconds 2
