# 故障排查指南

## 问题：打开了 2 个浏览器窗口

### 原因分析
1. **旧进程未清理**：之前的 Chrome 或 Electron 进程可能还在后台运行
2. **代码残留**：代码中可能有多处启动浏览器的逻辑

### 解决方案

#### 方案 1：使用清理脚本（推荐）
```bash
# Windows
restart-clean.bat

# 这个脚本会：
# 1. 停止所有 Chrome 进程
# 2. 停止所有 Electron 进程
# 3. 等待 2 秒
# 4. 启动 UI Recorder
```

#### 方案 2：手动清理
```bash
# 1. 停止所有 Chrome 进程
taskkill /F /IM chrome.exe

# 2. 停止所有 Electron 进程
taskkill /F /IM electron.exe

# 3. 等待几秒后启动
npm start
```

#### 方案 3：使用任务管理器
1. 按 `Ctrl + Shift + Esc` 打开任务管理器
2. 找到所有 `Chrome` 和 `Electron` 进程
3. 右键 → 结束任务
4. 运行 `npm start`

### 验证修复
启动后应该只看到：
- ✅ **1 个 Electron 窗口**（UI Recorder 主界面）
- ✅ **1 个 Chrome 窗口**（Playwright Inspector + 被测试的网页）

如果还是看到 2 个浏览器窗口，请检查：
1. `main-codegen.js` 中是否有 `chromium.launch()` 调用
2. 是否有其他 `main-*.js` 文件在运行
3. `package.json` 的 `main` 字段是否指向 `main-codegen.js`

## 问题：UI 脚本没有同步到 Electron 窗口

### 原因分析
1. **文件监听未启动**：`fs.watch()` 或 `setInterval()` 可能失败
2. **文件路径错误**：`recorded-script.js` 路径不正确
3. **Codegen 未生成文件**：Playwright Codegen 可能没有写入文件

### 解决方案

#### 检查文件是否生成
```bash
# 查看是否有 recorded-script.js
dir recorded-script.js

# 查看文件内容
type recorded-script.js
```

#### 查看控制台日志
启动时使用 dev 模式查看详细日志：
```bash
npm run dev
```

查找以下日志：
- `[UI Script] 检测到脚本更新` - 表示文件监听正常
- `✓ UI 脚本已生成` - 表示 Codegen 退出时读取到了文件

#### 手动测试文件监听
```javascript
// 在 Electron DevTools Console 中运行
const fs = require('fs');
fs.writeFileSync('recorded-script.js', 'test content');
// 应该看到 UI 窗口更新
```

## 问题：HAR 文件中没有 API 数据

### 原因分析
1. **HAR 文件未生成**：`--save-har` 参数可能失败
2. **Codegen 版本问题**：旧版本 Playwright 可能不支持 `--save-har`
3. **网络请求被过滤**：某些请求类型可能不会记录到 HAR

### 解决方案

#### 检查 Playwright 版本
```bash
npx playwright --version
# 应该是 1.40.0 或更高
```

#### 手动测试 HAR 录制
```bash
npx playwright codegen --save-har test-output.har http://example.com
# 录制一些操作后关闭
# 检查 test-output.har 是否存在且有内容
```

#### 查看 HAR 文件内容
```bash
type recorded-network.har
# 应该看到 JSON 格式的网络请求数据
```

## 问题：Codegen 窗口没有打开

### 原因分析
1. **npx 命令失败**：Node.js 或 Playwright 未正确安装
2. **Chrome 未安装**：`--channel chrome` 需要系统安装 Chrome
3. **端口被占用**：Playwright Inspector 的端口可能被占用

### 解决方案

#### 检查依赖
```bash
# 检查 Node.js
node --version

# 检查 npx
npx --version

# 检查 Playwright
npx playwright --version

# 安装 Playwright 浏览器
npx playwright install chromium
```

#### 手动测试 Codegen
```bash
npx playwright codegen http://example.com
# 应该打开 Inspector 窗口
```

#### 使用 Chromium 而不是 Chrome
如果系统没有 Chrome，修改 `main-codegen.js`：
```javascript
// 将
'--channel', 'chrome',
// 改为
// '--channel', 'chromium',  // 或者直接删除这两行
```

## 调试技巧

### 1. 查看完整日志
```bash
npm run dev
# 会打开 Electron DevTools，查看 Console 输出
```

### 2. 查看 Codegen 进程输出
在 `main-codegen.js` 中已经有：
```javascript
codegenProcess.stdout.on('data', (data) => {
    console.log('[Codegen]', data.toString().trim());
});
```

### 3. 测试单个功能
```bash
# 只测试 Codegen（不启动 Electron）
npx playwright codegen --output test.js --save-har test.har http://example.com

# 检查生成的文件
dir test.js test.har
```

### 4. 检查文件权限
```bash
# 确保当前目录可写
echo test > test-write.txt
del test-write.txt
```

## 常见错误信息

### `Error: spawn npx ENOENT`
**原因**：找不到 npx 命令  
**解决**：确保 Node.js 已正确安装并在 PATH 中

### `browserType.launch: Executable doesn't exist`
**原因**：Playwright 浏览器未安装  
**解决**：运行 `npx playwright install chromium`

### `Error: Target page, context or browser has been closed`
**原因**：浏览器被意外关闭  
**解决**：正常，用户关闭 Inspector 时会触发，不影响功能

### `EACCES: permission denied`
**原因**：文件权限问题  
**解决**：以管理员身份运行，或检查文件权限

## 联系支持
如果以上方案都无法解决问题，请提供：
1. 完整的控制台日志（`npm run dev` 的输出）
2. `recorded-script.js` 和 `recorded-network.har` 是否存在
3. Playwright 版本（`npx playwright --version`）
4. 操作系统版本
