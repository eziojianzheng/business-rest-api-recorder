# API 测试运行指南

## 运行 API 测试的标准步骤

### 1. 复制脚本
```powershell
Copy-Item "ui-recorder-workspace\api-script.spec.js" "ui-recorder-electron\replay-api-test.spec.js" -Force
```

### 2. 运行测试
```powershell
$env:ELECTRON_RUN_AS_NODE = "1"
Set-Location ui-recorder-electron
& ".\node_modules\electron\dist\electron.exe" ".\node_modules\@playwright\test\cli.js" test replay-api-test.spec.js --reporter=line
```

### 3. 或者一行命令
```powershell
Copy-Item "ui-recorder-workspace\api-script.spec.js" "ui-recorder-electron\replay-api-test.spec.js" -Force; $env:ELECTRON_RUN_AS_NODE = "1"; Set-Location ui-recorder-electron; & ".\node_modules\electron\dist\electron.exe" ".\node_modules\@playwright\test\cli.js" test replay-api-test.spec.js --reporter=line
```

## 注意事项

- 必须在 `ui-recorder-electron` 目录下运行
- 必须设置 `ELECTRON_RUN_AS_NODE=1`
- 不需要系统安装 Node.js，使用 Electron 内置的
