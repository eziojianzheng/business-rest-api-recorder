@echo off
chcp 65001 >nul
cd ui-recorder-electron
set ELECTRON_RUN_AS_NODE=1
".\node_modules\electron\dist\electron.exe" ".\node_modules\@playwright\test\cli.js" test replay-api-test.spec.js --reporter=list > test-output.txt 2>&1
type test-output.txt
