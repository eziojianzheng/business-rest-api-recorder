const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let codegenProcess = null;
let replayProcess = null;

// ── 辅助函数：运行 Node.js 脚本（不依赖系统 Node.js）────────────────────────
function runNodeScript(scriptPath, args, options = {}) {
    // 使用 Electron 内置的 Node.js 运行时
    // 设置 ELECTRON_RUN_AS_NODE=1 让 electron.exe 以 Node.js 模式运行
    const env = { 
        ...process.env, 
        ...options.env,
        ELECTRON_RUN_AS_NODE: '1' 
    };
    
    console.log('[runNodeScript] 启动子进程:');
    console.log('  - execPath:', process.execPath);
    console.log('  - scriptPath:', scriptPath);
    console.log('  - args:', args);
    console.log('  - cwd:', options.cwd || __dirname);
    console.log('  - ELECTRON_RUN_AS_NODE:', env.ELECTRON_RUN_AS_NODE);
    
    const childProcess = spawn(process.execPath, [scriptPath, ...args], {
        cwd: options.cwd || __dirname,
        stdio: options.stdio || ['ignore', 'pipe', 'pipe'],
        windowsHide: options.windowsHide !== false,
        env: env
    });
    
    childProcess.on('error', (err) => {
        console.error('[runNodeScript] 进程启动失败:', err);
    });
    
    return childProcess;
}

// Session data
let session = {
    id: null,
    dir: null,
    url: '',
    uiScript: '',
    harApis: [],
    semanticScript: '',
    apiScript: '',
    step: 'record'  // record | ui-debug | semantic | api-generate | api-debug
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    mainWindow.loadFile('index-main.html');
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    createWindow();
    
    // 自动初始化 session，使用固定的 ui-recorder-workspace 目录
    const workspaceRoot = path.join(__dirname, '..');
    const dir = path.join(workspaceRoot, 'ui-recorder-workspace');
    fs.mkdirSync(dir, { recursive: true });
    
    session = {
        id: `session-auto-${Date.now()}`,
        dir,
        url: '',
        uiScript: '',
        harApis: [],
        semanticScript: '',
        apiScript: '',
        seedData: null,
        step: 'record'
    };
    
    console.log(`[Auto Init] Session initialized, dir: ${dir}`);
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    cleanup();
    if (process.platform !== 'darwin') app.quit();
});

function cleanup() {
    if (codegenProcess) { codegenProcess.kill(); codegenProcess = null; }
    if (replayProcess)  { replayProcess.kill();  replayProcess = null; }
}

// ── Create session ────────────────────────────────────────────────────────────
ipcMain.on('create-session', (event, url) => {
    const id = `session-${Date.now()}`;
    // 固定放在工作区根目录的 ui-recorder-workspace 下，Kiro 可以直接读写
    const workspaceRoot = path.join(__dirname, '..'); // ceta-ai-skills 根目录
    const dir = path.join(workspaceRoot, 'ui-recorder-workspace');
    fs.mkdirSync(dir, { recursive: true });

    session = {
        id,
        dir,
        url,
        uiScript: '',
        harApis: [],
        semanticScript: '',
        apiScript: '',
        seedData: null,
        step: 'record'
    };

    console.log(`Session created: ${id}, dir: ${dir}`);
    event.reply('session-created', { id, dir });
});

// ── Upload seed data ──────────────────────────────────────────────────────────
ipcMain.on('upload-seed-data', (event, data) => {
    if (!session || !session.dir) {
        console.error('[Seed Data] No active session');
        return;
    }

    const seedDataPath = path.join(session.dir, 'seed-data.json');
    fs.writeFileSync(seedDataPath, data.content, 'utf-8');
    
    session.seedData = JSON.parse(data.content);
    console.log(`[Seed Data] Saved to: ${seedDataPath}`);
    
    event.reply('seed-data-saved', { path: seedDataPath });
});

// ── Generate API Documentation ────────────────────────────────────────────────
ipcMain.on('generate-api-doc', (event) => {
    if (!session || !session.dir || !session.seedData) {
        console.error('[API Doc] No seed data available');
        return;
    }

    const contextFile = path.join(session.dir, 'api-doc-context.md');
    const docFile = path.join(session.dir, 'api-documentation.md');

    const lines = [];
    lines.push('# CETA API 文档生成请求');
    lines.push('');
    lines.push(`**时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**输出文件**: \`${docFile}\``);
    lines.push('');
    lines.push('## 项目信息');
    lines.push('');
    
    if (session.seedData.project) {
        lines.push(`**项目名称**: ${session.seedData.project.name || '未命名'}`);
        lines.push(`**项目 Token**: ${session.seedData.project.token || 'N/A'}`);
        if (session.seedData.project.description) {
            lines.push(`**项目描述**: ${session.seedData.project.description}`);
        }
        lines.push('');
    }

    // PBC 信息
    if (session.seedData.pbcs && session.seedData.pbcs.length > 0) {
        lines.push(`## PBC 列表 (${session.seedData.pbcs.length} 个)`);
        lines.push('');
        session.seedData.pbcs.forEach(pbc => {
            lines.push(`### ${pbc.name} (\`${pbc.token}\`)`);
            if (pbc.description) {
                lines.push(`${pbc.description}`);
            }
            lines.push('');
        });
    }

    // 表单实体详细信息
    if (session.seedData.formEntities && session.seedData.formEntities.length > 0) {
        lines.push(`## 表单实体 (${session.seedData.formEntities.length} 个)`);
        lines.push('');
        session.seedData.formEntities.forEach(fe => {
            lines.push(`### ${fe.name} (\`${fe.token}\`)`);
            if (fe.pbcToken) {
                lines.push(`**所属 PBC**: \`${fe.pbcToken}\``);
            }
            if (fe.description) {
                lines.push(`**描述**: ${fe.description}`);
            }
            lines.push('');
            
            if (fe.fields && fe.fields.length > 0) {
                lines.push('**字段列表**:');
                lines.push('');
                lines.push('| 字段名 | Token | 类型 | 必填 | 描述 |');
                lines.push('|--------|-------|------|------|------|');
                fe.fields.forEach(field => {
                    const name = field.name || field.label || '-';
                    const token = field.token || '-';
                    const type = field.type || field.fieldType || '-';
                    const required = field.required ? '是' : '否';
                    const desc = field.description || '-';
                    lines.push(`| ${name} | \`${token}\` | ${type} | ${required} | ${desc} |`);
                });
                lines.push('');
            }
        });
    }

    // 页面配置信息
    if (session.seedData.pages && session.seedData.pages.length > 0) {
        lines.push(`## 页面配置 (${session.seedData.pages.length} 个)`);
        lines.push('');
        session.seedData.pages.forEach(page => {
            lines.push(`### ${page.name} (\`${page.schemaId}\`)`);
            if (page.description) {
                lines.push(`${page.description}`);
            }
            if (page.pbcToken) {
                lines.push(`**所属 PBC**: \`${page.pbcToken}\``);
            }
            lines.push('');
        });
    }

    // 流程定义信息
    if (session.seedData.flowDefinitions && session.seedData.flowDefinitions.length > 0) {
        lines.push(`## 流程定义 (${session.seedData.flowDefinitions.length} 个)`);
        lines.push('');
        session.seedData.flowDefinitions.forEach(flow => {
            lines.push(`### ${flow.name} (\`${flow.token}\`)`);
            if (flow.description) {
                lines.push(`${flow.description}`);
            }
            if (flow.pbcToken) {
                lines.push(`**所属 PBC**: \`${flow.pbcToken}\``);
            }
            lines.push('');
        });
    }

    lines.push('');
    lines.push('## 你的任务');
    lines.push('');
    lines.push('请根据上述 CETA 项目的 Seed Data 信息，生成一份**完整的 API 使用文档**，要求：');
    lines.push('');
    lines.push('### 1. API 端点列表');
    lines.push('');
    lines.push('根据表单实体和页面配置，推断并列出所有可能的 API 端点，包括：');
    lines.push('');
    lines.push('- **CRUD 操作**: 每个表单实体的增删改查接口');
    lines.push('  - `POST /form/api/v2/form-entity-data/{pbcToken}/{formEntityToken}/default` - 创建记录');
    lines.push('  - `GET /form/api/v2/form-entity-data/{pbcToken}/{formEntityToken}/{id}` - 获取单条记录');
    lines.push('  - `PUT /form/api/v2/form-entity-data/{pbcToken}/{formEntityToken}/{id}` - 更新记录');
    lines.push('  - `DELETE /form/api/v2/form-entity-data/{pbcToken}/{formEntityToken}/{id}` - 删除记录');
    lines.push('  - `POST /form/api/v3/form-entity-data/{pbcToken}/{formEntityToken}/list` - 列表查询');
    lines.push('');
    lines.push('- **表单布局接口**: 获取新增/编辑/查看表单的布局配置');
    lines.push('  - `GET /form/api/v2/form-entity-layout/{pbcToken}/{formEntityToken}/{layoutType}/schema-json`');
    lines.push('');
    lines.push('- **页面配置接口**: 获取列表页、详情页的配置');
    lines.push('  - `GET /form/api/form-entity-page/get-by-schema-id/{pbcToken}/{schemaId}`');
    lines.push('');
    lines.push('- **流程接口**: 流程定义、流程实例相关接口');
    lines.push('  - `GET /flow/api/flow-definition/{id}`');
    lines.push('  - `POST /flow/api/flow-instance/start`');
    lines.push('');
    lines.push('### 2. 请求参数详解');
    lines.push('');
    lines.push('对于每个 API，详细说明：');
    lines.push('');
    lines.push('- **路径参数**: `{pbcToken}`, `{formEntityToken}`, `{id}` 等的含义和取值');
    lines.push('- **请求体字段**: 每个字段的名称、类型、是否必填、取值范围');
    lines.push('- **字段来源**: 说明字段值从哪里来');
    lines.push('  - 用户输入的表单字段');
    lines.push('  - 从其他接口获取的 ID（如关联字段）');
    lines.push('  - 前端计算或生成的值');
    lines.push('  - 系统自动填充的值（如当前用户 ID、时间戳）');
    lines.push('');
    lines.push('### 3. 字段依赖关系');
    lines.push('');
    lines.push('说明字段之间的依赖关系，例如：');
    lines.push('');
    lines.push('- 创建订单时，`bom` 字段需要先调用 BOM 列表接口获取可选项，然后传递选中的 BOM 的 `id`');
    lines.push('- `factory` 字段依赖工厂列表接口，需要传递工厂对象的 `id`');
    lines.push('- 关联字段（如 `userField`、`organizationField`）需要传递完整的对象结构，包含 `pbcToken`、`formEntityToken`、`label`、`value` 等');
    lines.push('');
    lines.push('### 4. 典型业务流程');
    lines.push('');
    lines.push('描述常见的业务操作流程，例如：');
    lines.push('');
    lines.push('**新增记录流程**:');
    lines.push('1. 获取表单布局配置（了解需要填写哪些字段）');
    lines.push('2. 加载关联字段的选项列表（如数据字典、主数据）');
    lines.push('3. 用户填写表单');
    lines.push('4. 提交创建请求，传递完整的字段值');
    lines.push('5. 返回列表页，刷新数据');
    lines.push('');
    lines.push('**列表查询流程**:');
    lines.push('1. 获取页面配置（列定义、筛选器配置）');
    lines.push('2. 调用列表接口，传递分页参数和筛选条件');
    lines.push('3. 渲染列表数据');
    lines.push('');
    lines.push('### 5. 常见问题和注意事项');
    lines.push('');
    lines.push('- **关联字段的数据结构**: 说明关联字段（如 `userField`、`factory`、`area`）需要传递的完整对象结构');
    lines.push('- **ID 的获取方式**: 说明各种 ID（表单实体 ID、记录 ID、关联对象 ID）从哪里获取');
    lines.push('- **必填字段**: 列出每个表单实体的必填字段');
    lines.push('- **字段类型转换**: 说明日期、数字等特殊类型的格式要求');
    lines.push('');
    lines.push('### 输出格式');
    lines.push('');
    lines.push('使用 Markdown 格式，结构清晰，包含代码示例。保存到指定的输出文件。');
    lines.push('');

    fs.writeFileSync(contextFile, lines.join('\n'), 'utf-8');
    console.log(`[API Doc] Context written to: ${contextFile}`);

    // 生成触发语
    const triggerMsg = `请读取 ui-recorder-workspace/api-doc-context.md，按照其中的要求生成完整的 CETA API 文档并保存到 ui-recorder-workspace/api-documentation.md`;

    event.reply('api-doc-context-ready', { triggerMsg });

    // 监听文档文件生成
    startWatchingApiDoc(docFile);
});

let apiDocWatcher = null;

function startWatchingApiDoc(filePath) {
    if (apiDocWatcher) { apiDocWatcher.close(); apiDocWatcher = null; }

    const checkInterval = setInterval(() => {
        if (fs.existsSync(filePath)) {
            clearInterval(checkInterval);
            console.log('[API Doc] 文档已生成');
            
            const content = fs.readFileSync(filePath, 'utf-8');
            const preview = content.substring(0, 1000); // 前1000字符作为预览
            
            mainWindow.webContents.send('api-doc-done', { 
                docPath: filePath,
                preview: preview 
            });
        }
    }, 1000);

    // 10分钟后停止轮询
    setTimeout(() => clearInterval(checkInterval), 10 * 60 * 1000);
}


// ── Start recording ───────────────────────────────────────────────────────────
ipcMain.on('start-recording', async (event, url) => {
    session.url = url;
    const outputFile = path.join(session.dir, 'ui-script.js');
    const harFile    = path.join(session.dir, 'network.har');

    if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
    if (fs.existsSync(harFile))    fs.unlinkSync(harFile);

    // 使用 Electron 内置的 Node.js 运行时，不依赖系统 Node.js
    // playwright-core/cli.js 是 Playwright 的 CLI 入口
    const playwrightCli = path.join(__dirname, 'node_modules', 'playwright-core', 'cli.js');
    const args = [
        'codegen',
        '--output',   outputFile,
        '--save-har', harFile,
        '--target',   'playwright-test',
        '--channel',  'chrome',
        url
    ];

    codegenProcess = runNodeScript(playwrightCli, args, {
        cwd: __dirname,
        windowsHide: false
    });

    codegenProcess.stdout.on('data', d => console.log('[Codegen]', d.toString().trim()));
    codegenProcess.stderr.on('data', d => console.error('[Codegen]', d.toString().trim()));

    codegenProcess.on('close', code => {
        console.log('Codegen closed:', code);

        // Read UI script
        if (fs.existsSync(outputFile)) {
            session.uiScript = fs.readFileSync(outputFile, 'utf-8');
        }

        // Parse HAR
        if (fs.existsSync(harFile)) {
            try {
                const har = JSON.parse(fs.readFileSync(harFile, 'utf-8'));
                session.harApis = (har.log?.entries || []).map(e => ({
                    method:    e.request.method,
                    url:       e.request.url,
                    status:    e.response.status,
                    timestamp: e.startedDateTime,
                    postData:  e.request.postData?.text || null,
                    response:  e.response.content?.text || null,
                    mimeType:  e.response.content?.mimeType || ''
                }));
            } catch(e) { console.error('HAR parse error:', e); }
        }

        // Write context file for Kiro AI
        writeKiroContext();

        mainWindow.webContents.send('recording-done', {
            uiScript: session.uiScript,
            apiCount: session.harApis.length
        });
    });

    // Watch UI script file
    let lastSize = 0;
    const watchInterval = setInterval(() => {
        if (!fs.existsSync(outputFile)) return;
        const size = fs.statSync(outputFile).size;
        if (size !== lastSize) {
            lastSize = size;
            const content = fs.readFileSync(outputFile, 'utf-8');
            session.uiScript = content;
            mainWindow.webContents.send('ui-script-updated', content);
        }
    }, 1000);

    codegenProcess.on('close', () => clearInterval(watchInterval));

    await new Promise(r => setTimeout(r, 1500));
    event.reply('recording-started', { status: 'success' });
});

// ── Stop recording ────────────────────────────────────────────────────────────
ipcMain.on('stop-recording', (event) => {
    if (codegenProcess) { codegenProcess.kill(); codegenProcess = null; }
    event.reply('recording-stopped', {});
});

// ── Replay UI script ──────────────────────────────────────────────────────────
ipcMain.on('replay-ui', async (event) => {
    const scriptFile = path.join(session.dir, 'ui-script.js');
    if (!fs.existsSync(scriptFile)) {
        mainWindow.webContents.send('replay-log', { type: 'fail', msg: '✗ 找不到脚本文件，请先录制' });
        mainWindow.webContents.send('replay-result', { success: false, code: 1 });
        return;
    }

    // 读取最新脚本，复制到本地目录运行（避免路径空格问题）
    const script = fs.readFileSync(scriptFile, 'utf-8');
    const testFile = path.join(__dirname, 'replay-test.spec.js');
    fs.writeFileSync(testFile, script, 'utf-8');

    mainWindow.webContents.send('replay-log', { type: 'info', msg: '开始回放...' });
    mainWindow.webContents.send('replay-log', { type: 'info', msg: `脚本: ${scriptFile}` });

    // 使用 Electron 内置的 Node.js 运行时，不依赖系统 Node.js
    const playwrightCli = path.join(__dirname, 'node_modules', '@playwright', 'test', 'cli.js');
    
    replayProcess = runNodeScript(playwrightCli, [
        'test',
        'replay-test.spec.js',
        '--config=playwright.config.js',
        '--reporter=line'
    ], {
        cwd: __dirname,
        env: { FORCE_COLOR: '0' }
    });

    replayProcess.stdout.on('data', d => {
        const msg = d.toString('utf8').trim();
        if (msg) mainWindow.webContents.send('replay-log', { type: 'stdout', msg });
    });

    replayProcess.stderr.on('data', d => {
        const msg = d.toString('utf8').trim();
        if (msg) mainWindow.webContents.send('replay-log', { type: 'stderr', msg });
    });

    replayProcess.on('close', code => {
        // 运行完再删除临时文件
        try { fs.unlinkSync(testFile); } catch(e) {}
        const success = code === 0;
        mainWindow.webContents.send('replay-result', { success, code });
        replayProcess = null;
    });
});

// ── Stop replay ───────────────────────────────────────────────────────────────
ipcMain.on('stop-replay', (event) => {
    if (replayProcess) { replayProcess.kill(); replayProcess = null; }
    event.reply('replay-stopped', {});
});

// ── Update UI script (from Kiro AI edits) ────────────────────────────────────
ipcMain.on('update-ui-script', (event, script) => {
    session.uiScript = script;
    const scriptFile = path.join(session.dir, 'ui-script.js');
    fs.writeFileSync(scriptFile, script, 'utf-8');
    writeKiroContext();
    event.reply('script-updated', {});
});

// ── Generate semantic script（由 Kiro AI 生成）────────────────────────────────
ipcMain.on('generate-semantic', (event) => {
    if (!session.dir) return;

    // 过滤业务 API（去掉静态资源和噪音）
    const businessApis = session.harApis.filter(a => {
        const u = a.url.toLowerCase();
        return (u.includes('/api/') || a.mimeType?.includes('json')) &&
               !u.match(/\.(js|css|png|jpg|svg|ico|woff|ttf|woff2|map)(\?|$)/) &&
               !u.includes('/locales/') && !u.includes('/js/') &&
               !u.includes('/css/') && !u.includes('/img/') &&
               !u.includes('/icons/') && !u.includes('/packages/') &&
               !u.includes('/translation') && !u.includes('/front-end-config') &&
               !u.includes('/pbc/list') && !u.includes('/user/captcha') &&
               !u.includes('/notice-board') && !u.includes('/bot-config') &&
               !u.includes('/user/usage') && !u.includes('/user-profile-config');
    });

    // 写入上下文文件供 Kiro 读取
    const contextFile = path.join(session.dir, 'semantic-context.md');
    const semFile     = path.join(session.dir, 'semantic-script.md');

    const lines = [];
    lines.push('# UI Recorder - 语义脚本生成请求');
    lines.push('');
    lines.push(`**时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**输出文件**: \`${semFile}\``);
    lines.push('');
    
    // 如果有 seed data，添加项目结构信息
    if (session.seedData) {
        lines.push('## 项目结构信息（来自 Seed Data）');
        lines.push('');
        if (session.seedData.project) {
            lines.push(`**项目名称**: ${session.seedData.project.name || '未命名'}`);
            lines.push(`**项目 Token**: ${session.seedData.project.token || 'N/A'}`);
            if (session.seedData.project.description) {
                lines.push(`**项目描述**: ${session.seedData.project.description}`);
            }
            lines.push('');
        }
        
        if (session.seedData.pbcs && session.seedData.pbcs.length > 0) {
            lines.push(`**PBC 数量**: ${session.seedData.pbcs.length}`);
            lines.push('');
            lines.push('**PBC 列表**:');
            session.seedData.pbcs.forEach(pbc => {
                lines.push(`- ${pbc.name} (\`${pbc.token}\`)`);
                if (pbc.description) {
                    lines.push(`  ${pbc.description}`);
                }
            });
            lines.push('');
        }
        
        if (session.seedData.formEntities && session.seedData.formEntities.length > 0) {
            lines.push(`**表单实体数量**: ${session.seedData.formEntities.length}`);
            lines.push('');
            lines.push('**主要表单实体**（前10个）:');
            session.seedData.formEntities.slice(0, 10).forEach(fe => {
                lines.push(`- ${fe.name} (\`${fe.token}\`)`);
                if (fe.fields && fe.fields.length > 0) {
                    const fieldNames = fe.fields.slice(0, 5).map(f => f.name || f.token).join(', ');
                    lines.push(`  字段: ${fieldNames}${fe.fields.length > 5 ? ` ... (共${fe.fields.length}个)` : ''}`);
                }
            });
            lines.push('');
        }
        
        lines.push('> 💡 **提示**: 生成语义脚本时，请结合上述项目结构信息，识别 UI 操作对应的表单实体和字段，提供更准确的业务描述。');
        lines.push('');
    }
    
    lines.push('## UI 脚本');
    lines.push('```javascript');
    lines.push(session.uiScript || '// 暂无脚本');
    lines.push('```');
    lines.push('');
    lines.push('## 业务 API 列表');
    lines.push(`共 ${businessApis.length} 个业务接口：`);
    lines.push('');
    businessApis.forEach((a, i) => {
        let pathname = a.url;
        try { pathname = new URL(a.url).pathname; } catch {}
        lines.push(`${i + 1}. \`${a.method} ${pathname}\` → ${a.status}`);
        if (a.postData) {
            try {
                const data = JSON.parse(a.postData);
                const keys = Object.keys(data).slice(0, 5).join(', ');
                if (keys) lines.push(`   请求体字段: ${keys}`);
            } catch {}
        }
    });
    lines.push('');
    lines.push('## 你的任务');
    lines.push('');
    lines.push('请根据上面的 UI 脚本和业务 API，生成一份**业务语义脚本**，要求：');
    lines.push('');
    lines.push('1. **用自然语言描述业务流程**（不是技术描述，是业务人员能看懂的）');
    lines.push('2. **推断业务场景名称**（如：新增学生信息、用户登录、查询订单等）');
    lines.push('3. **描述每个操作步骤的业务含义**（不是"点击按钮"，而是"用户发起新增操作"）');
    lines.push('4. **关联 UI 操作和 API 调用**（说明哪个操作触发了哪个接口）');
    lines.push('5. **提取测试数据**（录制时用的账号、填写的字段值等）');
    if (session.seedData) {
        lines.push('6. **结合项目结构信息**（识别操作对应的表单实体、字段名称，提供准确的业务术语）');
    }
    lines.push('');
    lines.push('输出格式为 Markdown，保存到：');
    lines.push(`\`${semFile}\``);
    lines.push('');
    lines.push('保存后 Electron 工具会自动检测并显示。');

    fs.writeFileSync(contextFile, lines.join('\n'), 'utf-8');
    console.log('[Semantic] 上下文已写入:', contextFile);

    // 删除旧的确认文件（重新生成时需要重新确认）
    const approvalFile = path.join(session.dir, 'semantic-approved.flag');
    if (fs.existsSync(approvalFile)) {
        fs.unlinkSync(approvalFile);
        console.log('[Semantic] 已清除旧的确认标记');
    }

    // 监听语义文件变化（Kiro 生成后自动更新界面）
    startWatchingSemanticFile(semFile);

    // 监听确认文件（Kiro 确认后解锁下一步）
    startWatchingSemanticApproval(approvalFile);

    event.reply('semantic-context-ready', {
        contextFile,
        semFile,
        triggerMsg: `请读取 ui-recorder-workspace/semantic-context.md，按照其中的要求生成语义脚本并保存到指定文件。`
    });
});

// ── Generate API script ───────────────────────────────────────────────────────
ipcMain.on('generate-api-script', (event) => {
    if (!session.dir) return;

    const businessApis = session.harApis.filter(a => {
        const u = a.url.toLowerCase();
        return (u.includes('/api/') || a.mimeType?.includes('json')) &&
               !u.match(/\.(js|css|png|jpg|svg|ico|woff|ttf|woff2|map)(\?|$)/) &&
               !u.includes('/locales/') && !u.includes('/js/') &&
               !u.includes('/css/') && !u.includes('/img/') &&
               !u.includes('/icons/') && !u.includes('/packages/') &&
               !u.includes('/translation') && !u.includes('/front-end-config') &&
               !u.includes('/pbc/list') && !u.includes('/user/captcha') &&
               !u.includes('/notice-board') && !u.includes('/bot-config') &&
               !u.includes('/user/usage') && !u.includes('/user-profile-config');
    });

    const apiFile = path.join(session.dir, 'api-script.spec.js');
    const contextFile = path.join(session.dir, 'api-context.md');

    // Read semantic script if available
    const semFile = path.join(session.dir, 'semantic-script.md');
    const semanticContent = fs.existsSync(semFile) ? fs.readFileSync(semFile, 'utf-8') : '';

    const lines = [];
    lines.push('# UI Recorder - API 脚本生成请求');
    lines.push('');
    lines.push(`**时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**输出文件**: \`${apiFile}\``);
    lines.push('');
    if (semanticContent) {
        lines.push('## 语义脚本（业务上下文）');
        lines.push(semanticContent);
        lines.push('');
    }
    lines.push('## UI 脚本');
    lines.push('```javascript');
    lines.push(session.uiScript || '// 暂无脚本');
    lines.push('```');
    lines.push('');
    lines.push('## 业务 API 列表');
    lines.push(`共 ${businessApis.length} 个业务接口：`);
    lines.push('');
    businessApis.forEach((a, i) => {
        let pathname = a.url;
        try { pathname = new URL(a.url).pathname; } catch {}
        lines.push(`${i + 1}. \`${a.method} ${pathname}\` → ${a.status}`);
        if (a.postData) {
            try {
                const data = JSON.parse(a.postData);
                const keys = Object.keys(data).slice(0, 5).join(', ');
                if (keys) lines.push(`   请求体字段: ${keys}`);
            } catch {}
            if (typeof a.postData === 'string' && a.postData.length < 500) {
                lines.push(`   请求体: \`${a.postData}\``);
            }
        }
        if (a.response && a.mimeType?.includes('json')) {
            try {
                const resp = JSON.parse(a.response);
                const keys = Object.keys(resp).slice(0, 5).join(', ');
                if (keys) lines.push(`   响应字段: ${keys}`);
            } catch {}
        }
    });
    lines.push('');
    lines.push('## 你的任务');
    lines.push('');
    lines.push('请根据上面的语义脚本、UI 脚本和业务 API，生成一份 **Playwright API 测试脚本**，要求：');
    lines.push('');
    lines.push('1. 使用 `@playwright/test` 的 `request` API（不是 `page`）');
    lines.push('2. 按业务流程顺序组织测试（登录 → 查询 → 创建/更新/删除）');
    lines.push('3. 登录接口需要提取 token，传给后续请求的 Authorization header');
    lines.push('4. 每个接口加状态码断言，关键接口加响应体断言');
    lines.push('5. 使用 `test.describe` 按业务场景分组');
    lines.push('6. 使用 `const { test, expect, request } = require("@playwright/test");`（不用 import）');
    lines.push('');
    lines.push('输出为可直接运行的 Playwright 测试脚本，保存到：');
    lines.push(`\`${apiFile}\``);
    lines.push('');
    lines.push('保存后 Electron 工具会自动检测并显示。');

    fs.writeFileSync(contextFile, lines.join('\n'), 'utf-8');
    console.log('[API Script] 上下文已写入:', contextFile);

    // Watch for Kiro to write the api script file
    startWatchingApiScriptFile(apiFile);

    event.reply('api-context-ready', {
        contextFile,
        apiFile,
        triggerMsg: `请读取 ui-recorder-workspace/api-context.md，按照其中的要求生成 API 测试脚本并保存到指定文件。`
    });
});

// ── Replay API script ─────────────────────────────────────────────────────────
ipcMain.on('replay-api', async (event) => {
    // 确保 session 已初始化
    if (!session.dir) {
        const workspaceRoot = path.join(__dirname, '..');
        session.dir = path.join(workspaceRoot, 'ui-recorder-workspace');
        fs.mkdirSync(session.dir, { recursive: true });
        console.log('[Replay API] Session dir was empty, initialized to:', session.dir);
    }
    console.log('[Replay API] Looking for script at:', path.join(session.dir, 'api-script.spec.js'));
    const apiFile = path.join(session.dir, 'api-script.spec.js');
    if (!fs.existsSync(apiFile)) {
        event.reply('replay-result', { success: false, error: 'No API script found' });
        mainWindow.webContents.send('replay-log', { type: 'fail', msg: '✗ 找不到 API 脚本文件' });
        return;
    }

    // 复制到本地目录运行（避免路径空格问题）
    const script = fs.readFileSync(apiFile, 'utf-8');
    const testFile = path.join(__dirname, 'replay-api-test.spec.js');
    fs.writeFileSync(testFile, script, 'utf-8');

    mainWindow.webContents.send('replay-log', { type: 'info', msg: '开始 API 回放...' });
    mainWindow.webContents.send('replay-log', { type: 'info', msg: `Playwright CLI: ${path.join(__dirname, 'node_modules', '@playwright', 'test', 'cli.js')}` });
    mainWindow.webContents.send('replay-log', { type: 'info', msg: `Electron 路径: ${process.execPath}` });

    // 使用 Electron 内置的 Node.js 运行时，不依赖系统 Node.js
    const playwrightCli = path.join(__dirname, 'node_modules', '@playwright', 'test', 'cli.js');
    
    replayProcess = runNodeScript(playwrightCli, [
        'test',
        'replay-api-test.spec.js',
        '--config=playwright.config.js',
        '--reporter=line'
    ], {
        cwd: __dirname,
        env: { FORCE_COLOR: '0' },
        windowsHide: false
    });

    replayProcess.stdout.on('data', d => {
        const msg = d.toString('utf8').trim();
        if (msg) mainWindow.webContents.send('replay-log', { type: 'stdout', msg });
    });

    replayProcess.stderr.on('data', d => {
        const msg = d.toString('utf8').trim();
        if (msg) mainWindow.webContents.send('replay-log', { type: 'stderr', msg });
    });

    replayProcess.on('close', code => {
        try { fs.unlinkSync(testFile); } catch(e) {}
        const success = code === 0;
        mainWindow.webContents.send('replay-result', { success, code });
        
        // 写入回放结果文件，供 Kiro 检测
        const resultFile = path.join(session.dir, 'api-replay-result.json');
        fs.writeFileSync(resultFile, JSON.stringify({
            success,
            code,
            timestamp: new Date().toISOString(),
            message: success ? 'API 脚本回放通过' : `API 脚本回放失败，退出码: ${code}`
        }, null, 2), 'utf-8');
        console.log(`[API Replay] 结果已写入: ${resultFile}`);
        
        replayProcess = null;
    });
});

// ── Update API script ─────────────────────────────────────────────────────────
ipcMain.on('update-api-script', (event, script) => {
    session.apiScript = script;
    const apiFile = path.join(session.dir, 'api-script.spec.js');
    fs.writeFileSync(apiFile, script, 'utf-8');
    writeKiroContext();
    event.reply('script-updated', {});
});

// ── Start debug: 写入调试上下文，触发 Kiro hook ──────────────────────────────
ipcMain.on('start-debug', (event, { type, script, replayLog }) => {
    if (!session.dir) return;

    const label = type === 'ui' ? 'UI 脚本' : 'API 脚本';
    const filename = type === 'ui' ? 'ui-script.js' : 'api-script.spec.js';
    const scriptFile = path.join(session.dir, filename);

    // 构建发给 Kiro 的上下文提示
    const lines = [];
    lines.push(`# 🤖 UI Recorder - 开始${label}调试`);
    lines.push('');
    lines.push(`**时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**类型**: ${label}调试`);
    lines.push(`**脚本文件**: \`${scriptFile}\``);
    lines.push('');
    lines.push('## 当前脚本');
    lines.push('```javascript');
    lines.push(script || '// 暂无脚本');
    lines.push('```');

    if (replayLog && replayLog.trim()) {
        lines.push('');
        lines.push('## 最近回放日志');
        lines.push('```');
        lines.push(replayLog.trim().substring(0, 1000));
        lines.push('```');
    }

    lines.push('');
    lines.push('## 你的任务');
    lines.push(`用户现在要调试上面的${label}。`);
    lines.push('请等待用户告诉你需要做什么，然后：');
    lines.push(`1. 读取 \`${scriptFile}\``);
    lines.push('2. 根据用户需求修改脚本');
    lines.push('3. 保存文件（工具会自动检测并更新界面）');
    lines.push('');
    lines.push('---');
    lines.push('*此文件由 UI Recorder 自动生成，Kiro 收到后请回复"收到，请告诉我需要做什么"*');

    const debugFile = path.join(session.dir, 'debug-context.md');
    fs.writeFileSync(debugFile, lines.join('\n'), 'utf-8');

    // touch 文件触发 Kiro hook
    try { const now = new Date(); fs.utimesSync(debugFile, now, now); } catch(e) {}

    console.log(`[Debug] 已写入调试上下文: ${type}`);
    event.reply('debug-started', { type });

    // 同时监听脚本文件变化
    startWatchingScript(type, scriptFile);
});
let uiScriptWatcher = null;
let apiScriptWatcher = null;

ipcMain.on('chat-request', (event, { type, message, script }) => {
    if (!session.dir) return;

    // 把用户需求追加到 kiro-prompt.md
    const promptFile = path.join(session.dir, 'kiro-prompt.md');
    const timestamp = new Date().toLocaleString('zh-CN');
    const section = type === 'ui' ? 'UI 脚本调试' : 'API 脚本调试';
    const targetFile = type === 'ui'
        ? path.join(session.dir, 'ui-script.js')
        : path.join(session.dir, 'api-script.spec.js');

    const append = [
        '',
        `---`,
        `## 用户需求 [${timestamp}] - ${section}`,
        '',
        `**需求**: ${message}`,
        '',
        `**目标文件**: \`${targetFile}\``,
        '',
        `**当前脚本**:`,
        '```javascript',
        script.substring(0, 3000),
        script.length > 3000 ? '... (truncated)' : '',
        '```',
        '',
        `**请修改上面的目标文件，满足用户需求，然后保存。**`,
        '',
    ].join('\n');

    fs.appendFileSync(promptFile, append, 'utf-8');
    console.log(`[Chat] 已写入 kiro-prompt.md: ${message.substring(0, 50)}`);

    // 用 touch 触发 Kiro 的文件监听（Kiro 监听 fileEdited 事件）
    try {
        const now = new Date();
        fs.utimesSync(promptFile, now, now);
    } catch(e) {}

    // 监听目标脚本文件变化（Kiro 修改后通知前端）
    startWatchingScript(type, targetFile);
});

let semanticFileWatcher = null;
let semanticApprovalWatcher = null;

function startWatchingSemanticApproval(filePath) {
    if (semanticApprovalWatcher) { semanticApprovalWatcher.close(); semanticApprovalWatcher = null; }

    // 用轮询检查文件是否出现（fs.watch 对不存在的文件不可靠）
    const checkInterval = setInterval(() => {
        if (fs.existsSync(filePath)) {
            clearInterval(checkInterval);
            console.log('[Semantic] 用户已确认语义脚本，解锁下一步');
            mainWindow.webContents.send('semantic-approved');
        }
    }, 1000);

    // 60分钟后停止轮询
    setTimeout(() => clearInterval(checkInterval), 60 * 60 * 1000);
}

let apiScriptFileWatcher = null;

function startWatchingApiScriptFile(filePath) {
    if (apiScriptFileWatcher) { apiScriptFileWatcher.close(); apiScriptFileWatcher = null; }

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8');
    }

    let lastMtime = fs.statSync(filePath).mtimeMs;

    apiScriptFileWatcher = fs.watch(filePath, () => {
        try {
            const mtime = fs.statSync(filePath).mtimeMs;
            if (mtime === lastMtime) return;
            lastMtime = mtime;

            const content = fs.readFileSync(filePath, 'utf-8');
            if (!content.trim()) return;

            session.apiScript = content;
            console.log('[Watch] API 脚本已被 Kiro 更新');
            mainWindow.webContents.send('api-script-done', { apiScript: content });
        } catch(e) {}
    });

    console.log('[Watch] 开始监听 API 脚本文件变化');
}

function startWatchingSemanticFile(filePath) {
    if (semanticFileWatcher) { semanticFileWatcher.close(); semanticFileWatcher = null; }

    // 如果文件不存在先创建空文件，让 watch 能监听
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8');
    }

    let lastMtime = fs.statSync(filePath).mtimeMs;

    semanticFileWatcher = fs.watch(filePath, () => {
        try {
            const mtime = fs.statSync(filePath).mtimeMs;
            if (mtime === lastMtime) return;
            lastMtime = mtime;

            const content = fs.readFileSync(filePath, 'utf-8');
            if (!content.trim()) return;

            session.semanticScript = content;
            console.log('[Watch] 语义脚本已被 Kiro 更新');
            mainWindow.webContents.send('semantic-done', { semantic: content });
        } catch(e) {}
    });

    console.log('[Watch] 开始监听语义脚本文件变化');
}

function startWatchingScript(type, filePath) {
    // 停止旧的监听
    if (type === 'ui' && uiScriptWatcher) { uiScriptWatcher.close(); uiScriptWatcher = null; }
    if (type === 'api' && apiScriptWatcher) { apiScriptWatcher.close(); apiScriptWatcher = null; }

    if (!fs.existsSync(filePath)) return;

    let lastMtime = fs.statSync(filePath).mtimeMs;

    const watcher = fs.watch(filePath, (eventType) => {
        if (eventType !== 'change') return;
        try {
            const mtime = fs.statSync(filePath).mtimeMs;
            if (mtime === lastMtime) return;
            lastMtime = mtime;

            const newScript = fs.readFileSync(filePath, 'utf-8');

            // 更新 session
            if (type === 'ui') {
                session.uiScript = newScript;
            } else {
                session.apiScript = newScript;
            }

            console.log(`[Watch] ${type} 脚本已被 Kiro 更新`);
            mainWindow.webContents.send('script-file-changed', { type, script: newScript });
        } catch (e) {
            console.error('[Watch] 读取文件失败:', e);
        }
    });

    if (type === 'ui') uiScriptWatcher = watcher;
    else apiScriptWatcher = watcher;

    console.log(`[Watch] 开始监听 ${type} 脚本文件变化`);
}

// ── Save session with name + folder picker ────────────────────────────────────
ipcMain.on('save-session', async (event, { name }) => {
    if (!session.dir) return;

    const { dialog } = require('electron');
    const safeName = name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'unnamed';
    const timestamp = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');

    // 弹出文件夹选择对话框
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择保存位置',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '保存到此处',
    });

    if (result.canceled || !result.filePaths[0]) {
        event.reply('session-save-canceled');
        return;
    }

    const savedDir = path.join(result.filePaths[0], `${safeName}_${timestamp}`);
    fs.mkdirSync(savedDir, { recursive: true });

    const savedFiles = saveSessionFiles(session.dir, savedDir, safeName);

    console.log(`[Save] 已保存到: ${savedDir}`);
    event.reply('session-saved', { name: safeName, savedDir, files: savedFiles });
});

// ── Save draft（弹出文件夹选择，保存所有录制数据）────────────────────────────
ipcMain.on('save-draft', async (event, { step }) => {
    if (!session.dir) return;

    const { dialog } = require('electron');

    const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择保存位置',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '保存到此处',
    });

    if (result.canceled || !result.filePaths[0]) {
        event.reply('draft-save-canceled');
        return;
    }

    const destDir = result.filePaths[0];

    // 保存所有录制数据：HAR + UI脚本 + 语义脚本 + API脚本
    const allFiles = [
        { src: 'ui-script.js',       label: '录制脚本' },
        { src: 'semantic-script.md', label: '语义脚本' },
        { src: 'api-script.spec.js', label: 'API 脚本' },
        { src: 'network.har',        label: '网络录制 (HAR)' },
    ];

    const existingFiles = allFiles
        .filter(({ src }) => {
            const srcPath = path.join(session.dir, src);
            const destPath = path.join(destDir, src);
            return fs.existsSync(srcPath) && fs.existsSync(destPath);
        })
        .map(({ label }) => label);

    // 如果目标目录已有文件，询问是否覆盖
    if (existingFiles.length > 0) {
        const confirmResult = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: '文件已存在',
            message: `目标目录已存在以下文件：\n\n${existingFiles.map(f => `  • ${f}`).join('\n')}\n\n是否覆盖？`,
            buttons: ['覆盖', '取消'],
            defaultId: 0,
            cancelId: 1,
        });

        if (confirmResult.response === 1) {
            event.reply('draft-save-canceled');
            return;
        }
    }

    // 执行保存
    const savedFiles = [];
    allFiles.forEach(({ src, label }) => {
        const srcPath = path.join(session.dir, src);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(destDir, src));
            savedFiles.push(label);
        }
    });

    // 保存草稿状态
    const draftState = {
        savedAt:  new Date().toISOString(),
        step,
        url:      session.url,
        semanticApproved: fs.existsSync(path.join(session.dir, 'semantic-approved.flag')),
    };
    fs.writeFileSync(path.join(destDir, 'draft-state.json'), JSON.stringify(draftState, null, 2), 'utf-8');

    console.log(`[Draft] 草稿已保存到: ${destDir}，文件: ${savedFiles.join(', ')}`);
    event.reply('draft-saved', {
        savedAt: draftState.savedAt,
        step,
        destDir,
        files: savedFiles,
    });
});

// ── Open existing session ─────────────────────────────────────────────────────
ipcMain.on('open-session', async (event) => {
    const { dialog } = require('electron');

    const result = await dialog.showOpenDialog(mainWindow, {
        title: '鎵撳紑宸叉湁浼氳瘽',
        properties: ['openDirectory'],
        buttonLabel: '鎵撳紑姝や細璇?,
    });

    if (result.canceled || !result.filePaths[0]) {
        event.reply('session-open-canceled');
        return;
    }

    const dir = result.filePaths[0];

    // 璇诲彇鑽夌鐘舵€?
    const draftFile = path.join(dir, 'draft-state.json');
    let draft = null;
    if (fs.existsSync(draftFile)) {
        try { draft = JSON.parse(fs.readFileSync(draftFile, 'utf-8')); } catch(e) {}
    }

    // 鈹€鈹€ 鍚屾鍒?ui-recorder-workspace 鐩綍 鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€鈹€
    const workspaceRoot = path.join(__dirname, '..');
    const workspaceDir = path.join(workspaceRoot, 'ui-recorder-workspace');
    fs.mkdirSync(workspaceDir, { recursive: true });

    // 瀹氫箟闇€瑕佸悓姝ョ殑鏂囦欢
    const filesToSync = [
        { src: 'ui-script.js',       dest: 'ui-script.js' },
        { src: 'semantic-script.md', dest: 'semantic-script.md' },
        { src: 'api-script.spec.js', dest: 'api-script.spec.js' },
        { src: 'network.har',        dest: 'network.har' },
        { src: 'draft-state.json',   dest: 'draft-state.json' },
        { src: 'semantic-context.md', dest: 'semantic-context.md' },
        { src: 'api-context.md',      dest: 'api-context.md' },
        { src: 'semantic-approved.flag', dest: 'semantic-approved.flag' },
    ];

    // 澶嶅埗鏂囦欢鍒?workspace
    let syncedFiles = [];
    filesToSync.forEach(({ src, dest }) => {
        const srcPath = path.join(dir, src);
        const destPath = path.join(workspaceDir, dest);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            syncedFiles.push(src);
        }
    });

    console.log(`[Open] 鍚屾鏂囦欢鍒?workspace: ${syncedFiles.join(', ')}`);

    // 鎭㈠ session锛堟寚鍚?workspace 鐩綍锛?
    session.dir = workspaceDir;
    session.url = draft?.url || '';
    session.step = draft?.step || 'record';

    // 璇诲彇鍚勮剼鏈枃浠讹紙浠?workspace 鐩綍锛?
    const uiFile  = path.join(workspaceDir, 'ui-script.js');
    const semFile = path.join(workspaceDir, 'semantic-script.md');
    const apiFile = path.join(workspaceDir, 'api-script.spec.js');

    if (fs.existsSync(uiFile))  session.uiScript       = fs.readFileSync(uiFile, 'utf-8');
    if (fs.existsSync(semFile)) session.semanticScript  = fs.readFileSync(semFile, 'utf-8');
    if (fs.existsSync(apiFile)) session.apiScript       = fs.readFileSync(apiFile, 'utf-8');

    // 瑙ｆ瀽 HAR锛堜粠 workspace 鐩綍锛?
    const harFile = path.join(workspaceDir, 'network.har');
    if (fs.existsSync(harFile)) {
        try {
            const har = JSON.parse(fs.readFileSync(harFile, 'utf-8'));
            session.harApis = (har.log?.entries || []).map(e => ({
                method:   e.request.method,
                url:      e.request.url,
                status:   e.response.status,
                timestamp: e.startedDateTime,
                postData: e.request.postData?.text || null,
                response: e.response.content?.text || null,
                mimeType: e.response.content?.mimeType || ''
            }));
        } catch(e) {}
    }

    console.log(`[Open] 宸叉墦寮€浼氳瘽: ${dir}, 姝ラ: ${session.step}, API鏁伴噺: ${session.harApis.length}`);
    console.log(`[Open] Session dir 宸茶缃负: ${session.dir}`);
    
    event.reply('session-opened', {
        dir:               workspaceDir,  // 杩斿洖 workspace 鐩綍
        originalDir:       dir,           // 鍘熷鎵撳紑鐨勭洰褰?
        step:              draft?.step || 1,
        url:               session.url,
        uiScript:          session.uiScript,
        semanticScript:    session.semanticScript,
        apiScript:         session.apiScript,
        apiCount:          session.harApis.length,
        harApis:           session.harApis,  // 鍙戦€佸畬鏁?API 鍒楄〃
        semanticApproved:  fs.existsSync(path.join(workspaceDir, 'semantic-approved.flag')),
    });
});

// ── Open folder in explorer ───────────────────────────────────────────────────
ipcMain.on('open-folder', (event, { folderPath }) => {
    const { shell } = require('electron');
    shell.openPath(folderPath);
});

// ── Helper: copy session files ────────────────────────────────────────────────
function saveSessionFiles(srcDir, destDir, name) {
    const savedFiles = [];

    // 3 个核心脚本 + HAR
    const filesToSave = [
        { src: 'ui-script.js',       label: '录制脚本' },
        { src: 'semantic-script.md', label: '语义脚本' },
        { src: 'api-script.spec.js', label: 'API 脚本' },
        { src: 'network.har',        label: '网络录制 (HAR)' },
        { src: 'draft-state.json',   label: '草稿状态' },
    ];

    filesToSave.forEach(({ src, label }) => {
        const srcPath = path.join(srcDir, src);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(destDir, src));
            savedFiles.push(label);
        }
    });

    const readme = [
        `# ${name}`,
        '',
        `> 保存时间：${new Date().toLocaleString('zh-CN')}`,
        '',
        '## 核心文件',
        '| 文件 | 说明 |',
        '|------|------|',
        '| `ui-script.js` | Playwright UI 录制脚本 |',
        '| `semantic-script.md` | 业务语义描述 |',
        '| `api-script.spec.js` | API 测试脚本（可直接运行） |',
        '| `network.har` | 录制的网络请求 |',
        '',
        '## 恢复会话',
        '在 UI Recorder 中点击「打开会话」，选择此目录即可恢复。',
        '',
        '## 运行 API 测试',
        '```bash',
        'npx playwright test api-script.spec.js --reporter=line',
        '```',
    ].join('\n');

    fs.writeFileSync(path.join(destDir, 'README.md'), readme, 'utf-8');
    savedFiles.push('README.md');
    return savedFiles;
}

ipcMain.on('get-session', (event) => {
    event.reply('session-info', session);
});

// ── Write context file for Kiro AI ───────────────────────────────────────────
function writeKiroContext() {
    if (!session.dir) return;

    const businessApis = session.harApis.filter(a => {
        const u = a.url.toLowerCase();
        return (u.includes('/api/') || a.mimeType.includes('json')) &&
               !u.match(/\.(js|css|png|jpg|svg|ico|woff)(\?|$)/);
    });

    const ctx = {
        sessionId:     session.id,
        url:           session.url,
        step:          session.step,
        uiScriptFile:  path.join(session.dir, 'ui-script.js'),
        harFile:       path.join(session.dir, 'network.har'),
        semanticFile:  path.join(session.dir, 'semantic-script.md'),
        apiScriptFile: path.join(session.dir, 'api-script.spec.js'),
        summary: {
            uiSteps:     countUiSteps(session.uiScript),
            totalApis:   session.harApis.length,
            businessApis: businessApis.length,
            apiList:     businessApis.slice(0, 20).map(a => `${a.method} ${a.url} → ${a.status}`)
        }
    };

    fs.writeFileSync(
        path.join(session.dir, 'kiro-context.json'),
        JSON.stringify(ctx, null, 2),
        'utf-8'
    );

    // Also write a human-readable prompt file for Kiro
    const prompt = buildKiroPrompt(ctx, session);
    fs.writeFileSync(path.join(session.dir, 'kiro-prompt.md'), prompt, 'utf-8');
}

function buildKiroPrompt(ctx, session) {
    const lines = [];
    lines.push('# UI Recorder - Kiro AI Context');
    lines.push('');
    lines.push(`**Session**: ${ctx.sessionId}`);
    lines.push(`**URL**: ${ctx.url}`);
    lines.push(`**Current Step**: ${ctx.step}`);
    lines.push('');
    lines.push('## Files');
    lines.push(`- UI Script: \`${ctx.uiScriptFile}\``);
    lines.push(`- HAR Network: \`${ctx.harFile}\``);
    lines.push(`- Semantic: \`${ctx.semanticFile}\``);
    lines.push(`- API Script: \`${ctx.apiScriptFile}\``);
    lines.push('');
    lines.push('## Summary');
    lines.push(`- UI Steps: ${ctx.summary.uiSteps}`);
    lines.push(`- Total APIs: ${ctx.summary.totalApis}`);
    lines.push(`- Business APIs: ${ctx.summary.businessApis}`);
    lines.push('');
    lines.push('## Business API List');
    ctx.summary.apiList.forEach(a => lines.push(`- ${a}`));
    lines.push('');

    if (session.uiScript) {
        lines.push('## Current UI Script');
        lines.push('```javascript');
        lines.push(session.uiScript.substring(0, 2000));
        if (session.uiScript.length > 2000) lines.push('... (truncated)');
        lines.push('```');
    }

    return lines.join('\n');
}

// ── Semantic script builder ───────────────────────────────────────────────────
function buildSemanticScript(uiScript, apis) {
    if (!uiScript) return '# No UI script recorded';

    const steps = parseUiSteps(uiScript);
    const businessApis = apis.filter(a => {
        const u = a.url.toLowerCase();
        return (u.includes('/api/') || a.mimeType?.includes('json')) &&
               !u.match(/\.(js|css|png|jpg|svg|ico|woff|png|jpg|svg|ico|ttf|woff2|map)(\?|$)/) &&
               !u.includes('/locales/') &&
               !u.includes('/js/') &&
               !u.includes('/css/') &&
               !u.includes('/img/') &&
               !u.includes('/icons/') &&
               !u.includes('/packages/');
    });

    // ── 推断业务场景名称 ──────────────────────────────────────────────────────
    const sceneName = inferSceneNameFromSteps(steps, businessApis);

    // ── 生成人类可读的业务流程描述 ────────────────────────────────────────────
    const businessNarrative = buildBusinessNarrative(steps, businessApis);

    // ── 提取关键操作（去掉噪音） ──────────────────────────────────────────────
    const meaningfulSteps = steps.filter(s => {
        // 过滤掉无意义的操作
        if (s.type === 'click' && s.desc.includes('点击: ')) {
            const label = s.desc.replace('点击: ', '');
            // 过滤掉空 label 或纯符号
            if (!label || label.length < 2) return false;
        }
        return true;
    });

    // ── 对 API 进行分类和注释 ─────────────────────────────────────────────────
    const annotatedApis = businessApis.map(a => {
        let pathname = a.url;
        try { pathname = new URL(a.url).pathname; } catch {}
        const purpose = inferApiPurpose(a, steps);
        return { ...a, pathname, purpose };
    });

    const lines = [];
    lines.push(`# 业务场景：${sceneName}`);
    lines.push('');
    lines.push(`> 录制时间：${new Date().toLocaleString('zh-CN')}`);
    lines.push(`> 系统地址：${(() => { try { const u = new URL(apis[0]?.url || ''); return `${u.protocol}//${u.host}`; } catch { return session?.url || ''; } })()}`);
    lines.push('');

    // 业务流程描述（最重要的部分）
    lines.push('## 业务流程描述');
    lines.push('');
    lines.push(businessNarrative);
    lines.push('');

    // 操作步骤
    lines.push('## 操作步骤');
    lines.push('');
    meaningfulSteps.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.desc}`);
    });
    lines.push('');

    // 业务 API（只列关键的，过滤掉页面配置、翻译等噪音）
    const keyApis = annotatedApis.filter(a => {
        const u = a.url.toLowerCase();
        // 只保留真正的业务操作 API
        return !u.includes('/translation') &&
               !u.includes('/front-end-config') &&
               !u.includes('/pbc/list') &&
               !u.includes('/user/captcha') &&
               !u.includes('/notice-board') &&
               !u.includes('/bot-config') &&
               !u.includes('/user/usage') &&
               !u.includes('/user-profile-config');
    });

    if (keyApis.length > 0) {
        lines.push('## 触发的业务 API');
        lines.push('');
        keyApis.forEach((a, i) => {
            lines.push(`${i + 1}. \`${a.method} ${a.pathname}\` → ${a.status}（${a.purpose}）`);
        });
        lines.push('');
    }

    // 数据摘要
    const inputData = steps.filter(s => s.type === 'fill' && s.value);
    if (inputData.length > 0) {
        lines.push('## 测试数据');
        lines.push('');
        inputData.forEach(s => {
            lines.push(`- ${s.fieldName || extractLabel(s.line?.match(/\.fill\((.+?),/)?.[1] || '')}：\`${s.value}\``);
        });
        lines.push('');
    }

    return lines.join('\n');
}

// 推断 API 的业务用途
function inferApiPurpose(api, steps) {
    const u = api.url.toLowerCase();
    const m = api.method;

    if (u.includes('/login')) return '用户登录认证';
    if (u.includes('/logout')) return '用户登出';
    if (u.includes('/user/info') || u.includes('/user/profile')) return '获取用户信息';

    if (u.includes('/form-entity-data') || u.includes('/form-entity/data')) {
        if (m === 'POST' && u.includes('/list')) return '查询列表数据';
        if (m === 'POST' && !u.includes('/list')) return '创建数据记录';
        if (m === 'PUT') return '更新数据记录';
        if (m === 'DELETE') return '删除数据记录';
        if (m === 'GET') return '获取数据详情';
    }

    if (u.includes('/flow') && m === 'PUT') return '提交表单/流程';
    if (u.includes('/flow') && m === 'POST') return '发起流程';
    if (u.includes('/flow') && m === 'GET') return '获取流程信息';

    if (u.includes('/form-entity-page') || u.includes('/schema-id')) return '加载页面配置';
    if (u.includes('/form-entity-layout')) return '加载表单布局';
    if (u.includes('/form-entity') && m === 'GET') return '获取表单定义';

    if (m === 'GET') return '获取数据';
    if (m === 'POST') return '提交数据';
    if (m === 'PUT' || m === 'PATCH') return '更新数据';
    if (m === 'DELETE') return '删除数据';

    return '业务操作';
}

// 生成人类可读的业务流程描述
function buildBusinessNarrative(steps, apis) {
    const parts = [];

    // 登录信息
    const loginStep = steps.find(s => s.type === 'fill' && s.line?.includes('account'));
    const loginApi = apis.find(a => a.url.toLowerCase().includes('/login'));
    if (loginApi || loginStep) {
        const account = steps.find(s => s.type === 'fill' && (s.line?.includes('#account') || s.line?.includes('account')));
        const accountVal = account?.line?.match(/\.fill\([^,]+,\s*['"`]([^'"]+)['"`]\)/)?.[1];
        if (accountVal) {
            parts.push(`用户使用账号 **${accountVal}** 登录系统。`);
        } else {
            parts.push('用户登录系统。');
        }
    }

    // 导航信息
    const navSteps = steps.filter(s => s.type === 'navigate' || (s.type === 'click' && s.desc.includes('列表')));
    if (navSteps.length > 0) {
        const dest = navSteps[navSteps.length - 1].desc.replace('打开页面: ', '').replace('点击: ', '');
        if (dest && !dest.includes('login')) {
            parts.push(`进入 **${dest}** 页面。`);
        }
    }

    // 主要业务操作
    const fillSteps = steps.filter(s => s.type === 'fill');
    const submitStep = steps.find(s => s.type === 'click' && (
        s.desc.includes('提交') || s.desc.includes('保存') || s.desc.includes('确认') ||
        s.desc.includes('Submit') || s.desc.includes('Save') || s.desc.includes('Confirm')
    ));
    const addStep = steps.find(s => s.type === 'click' && (
        s.desc.includes('新增') || s.desc.includes('Add') || s.desc.includes('创建') || s.desc.includes('新建')
    ));

    if (addStep && fillSteps.length > 0 && submitStep) {
        const fields = fillSteps.map(s => {
            const val = s.line?.match(/\.fill\([^,]+,\s*['"`]([^'"]+)['"`]\)/)?.[1];
            const label = extractLabel(s.line?.match(/\.fill\((.+?),/)?.[1] || '');
            return val ? `${label}="${val}"` : label;
        }).filter(Boolean);
        parts.push(`点击新增按钮，填写表单信息（${fields.join('、')}），提交完成数据创建。`);
    } else if (fillSteps.length > 0 && submitStep) {
        const fields = fillSteps.map(s => {
            const val = s.line?.match(/\.fill\([^,]+,\s*['"`]([^'"]+)['"`]\)/)?.[1];
            const label = extractLabel(s.line?.match(/\.fill\((.+?),/)?.[1] || '');
            return val ? `${label}="${val}"` : label;
        }).filter(Boolean);
        parts.push(`填写表单信息（${fields.join('、')}），提交完成操作。`);
    } else if (fillSteps.length > 0) {
        parts.push(`填写了 ${fillSteps.length} 个字段的信息。`);
    }

    // API 结果摘要
    const writeApis = apis.filter(a => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(a.method) &&
        !a.url.toLowerCase().includes('/login') &&
        !a.url.toLowerCase().includes('/usage'));
    const failedApis = apis.filter(a => a.status >= 400);

    if (writeApis.length > 0) {
        const successWrite = writeApis.filter(a => a.status < 400);
        if (successWrite.length > 0) {
            parts.push(`系统成功处理了 ${successWrite.length} 个数据写入操作。`);
        }
    }

    if (failedApis.length > 0) {
        parts.push(`⚠️ 注意：有 ${failedApis.length} 个接口返回了错误状态码（${failedApis.map(a => a.status).join('、')}）。`);
    }

    return parts.length > 0 ? parts.join('\n\n') : '业务流程已录制，请查看操作步骤和 API 列表。';
}

// ── API script builder ────────────────────────────────────────────────────────
function buildApiScript(uiScript, semanticScript, apis) {
    const businessApis = apis.filter(a => {
        const u = a.url.toLowerCase();
        return (u.includes('/api/') || a.mimeType?.includes('json')) &&
               !u.match(/\.(js|css|png|jpg|svg|ico|woff)(\?|$)/);
    });

    const steps = parseUiSteps(uiScript);
    const sceneName = inferSceneName(steps, businessApis);

    const lines = [];
    lines.push(`// API 业务流脚本 - ${sceneName}`);
    lines.push(`// 生成时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`// 基于: UI脚本 + 语义分析 + HAR 网络录制`);
    lines.push('');
    lines.push("const { test, expect, request } = require('@playwright/test');");
    lines.push('');
    lines.push(`test.describe('${sceneName}', () => {`);
    lines.push('  let apiContext;');
    lines.push('  let authToken;');
    lines.push('');
    lines.push('  test.beforeAll(async () => {');
    lines.push('    apiContext = await request.newContext();');
    lines.push('  });');
    lines.push('');
    lines.push('  test.afterAll(async () => {');
    lines.push('    await apiContext.dispose();');
    lines.push('  });');
    lines.push('');

    // Group APIs by logical flow
    let testIndex = 1;
    businessApis.forEach((api, i) => {
        let pathname = api.url;
        try { pathname = new URL(api.url).pathname; } catch {}

        const testName = inferApiTestName(api, steps);
        lines.push(`  test('${testIndex}. ${testName}', async () => {`);

        // Build request
        const baseUrl = (() => { try { const u = new URL(api.url); return `${u.protocol}//${u.host}`; } catch { return ''; } })();
        lines.push(`    const response = await apiContext.${api.method.toLowerCase()}('${api.url}', {`);

        if (api.postData) {
            try {
                JSON.parse(api.postData);
                lines.push(`      data: ${api.postData},`);
            } catch {
                lines.push(`      data: '${api.postData.replace(/'/g, "\\'")}',`);
            }
        }

        lines.push('      headers: {');
        lines.push("        'Content-Type': 'application/json',");
        lines.push("        // 'Authorization': `Bearer ${authToken}`,  // 如需认证");
        lines.push('      }');
        lines.push('    });');
        lines.push('');
        lines.push(`    // 验证状态码`);
        lines.push(`    expect(response.status()).toBe(${api.status});`);

        if (api.mimeType?.includes('json')) {
            lines.push('');
            lines.push('    // 验证响应格式');
            lines.push('    const body = await response.json();');
            lines.push('    expect(body).toBeDefined();');
            if (api.response) {
                try {
                    const resp = JSON.parse(api.response);
                    const keys = Object.keys(resp).slice(0, 3);
                    if (keys.length > 0) {
                        lines.push(`    // 响应包含字段: ${keys.join(', ')}`);
                    }
                } catch {}
            }
        }

        lines.push('  });');
        lines.push('');
        testIndex++;
    });

    lines.push('});');
    return lines.join('\n');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseUiSteps(uiScript) {
    if (!uiScript) return [];
    const steps = [];
    uiScript.split('\n').forEach(line => {
        const t = line.trim();
        if (t.startsWith('await page.goto(')) {
            const url = t.match(/goto\(['"`](.+?)['"`]\)/)?.[1] || '';
            steps.push({ type: 'navigate', desc: `打开页面: ${url}`, line: t });
        } else if (t.includes('.click(')) {
            const sel = t.match(/\.click\((.+?)\)/)?.[1] || '';
            steps.push({ type: 'click', desc: `点击: ${extractLabel(sel)}`, line: t });
        } else if (t.includes('.fill(')) {
            const m = t.match(/\.fill\((.+?),\s*['"`](.+?)['"`]\)/);
            steps.push({ type: 'fill', desc: `输入 "${m?.[2]||''}" 到: ${extractLabel(m?.[1]||'')}`, line: t });
        } else if (t.includes('.selectOption(')) {
            const m = t.match(/\.selectOption\((.+?),\s*['"`](.+?)['"`]\)/);
            steps.push({ type: 'select', desc: `选择 "${m?.[2]||''}": ${extractLabel(m?.[1]||'')}`, line: t });
        } else if (t.includes('.press(')) {
            const key = t.match(/\.press\(.+?,\s*['"`](.+?)['"`]\)/)?.[1] || '';
            steps.push({ type: 'press', desc: `按键: ${key}`, line: t });
        }
    });
    return steps;
}

function extractLabel(selector) {
    if (!selector) return selector;
    const s = selector.replace(/['"]/g, '');
    const roleMatch = s.match(/getByRole\([^,]+,\s*\{[^}]*name:\s*['"]?([^'"}\s,]+)/);
    if (roleMatch) return roleMatch[1];
    const textMatch = s.match(/getByText\(['"]?([^'"]+)/);
    if (textMatch) return textMatch[1];
    const phMatch = s.match(/getByPlaceholder\(['"]?([^'"]+)/);
    if (phMatch) return phMatch[1];
    const labelMatch = s.match(/getByLabel\(['"]?([^'"]+)/);
    if (labelMatch) return labelMatch[1];
    return s.substring(0, 40);
}

function inferSceneNameFromSteps(steps, apis) {
    // 优先从 UI 操作推断
    const hasLogin = apis.some(a => a.url.toLowerCase().includes('/login'));
    const hasAdd = steps.some(s => s.type === 'click' && (s.desc.includes('新增') || s.desc.includes('Add') || s.desc.includes('创建')));
    const hasSubmit = steps.some(s => s.type === 'click' && (s.desc.includes('提交') || s.desc.includes('Submit') || s.desc.includes('保存')));
    const hasDelete = steps.some(s => s.type === 'click' && (s.desc.includes('删除') || s.desc.includes('Delete')));
    const hasSearch = steps.some(s => s.type === 'click' && (s.desc.includes('搜索') || s.desc.includes('查询') || s.desc.includes('Search')));
    const hasFill = steps.some(s => s.type === 'fill');

    // 从导航推断页面名称
    const navToPage = steps.find(s => s.type === 'click' && s.desc.includes('列表'));
    const pageName = navToPage?.desc.replace('点击: ', '').replace('列表', '').trim();

    if (hasLogin && !hasAdd && !hasSubmit) return '用户登录';
    if (hasAdd && hasSubmit && pageName) return `新增${pageName}`;
    if (hasAdd && hasSubmit) return '新增数据';
    if (hasDelete && pageName) return `删除${pageName}`;
    if (hasDelete) return '删除数据';
    if (hasSearch && pageName) return `查询${pageName}`;
    if (hasSearch) return '数据查询';
    if (hasFill && hasSubmit && pageName) return `编辑${pageName}`;
    if (hasFill && hasSubmit) return '表单提交';
    if (hasLogin) return '登录并操作';

    return '业务操作';
}

function inferApiTestName(api, steps) {
    const u = api.url.toLowerCase();
    if (u.includes('/login')) return '用户登录认证';
    if (u.includes('/logout')) return '用户登出';
    if (u.includes('/list') || u.includes('/search')) return `查询数据列表`;
    if (api.method === 'POST' && u.includes('/create')) return '创建数据';
    if (api.method === 'PUT' || api.method === 'PATCH') return '更新数据';
    if (api.method === 'DELETE') return '删除数据';
    if (api.method === 'GET') return `获取数据`;
    if (api.method === 'POST') return `提交数据`;
    return `${api.method} ${(() => { try { return new URL(api.url).pathname.split('/').pop(); } catch { return ''; } })()}`;
}

function inferBusinessLogic(steps, apis) {
    const parts = [];
    if (steps.length > 0) {
        parts.push(`用户通过 ${steps.length} 个操作步骤完成了业务流程。`);
    }
    const postApis = apis.filter(a => a.method === 'POST');
    const getApis  = apis.filter(a => a.method === 'GET');
    if (postApis.length > 0) parts.push(`过程中提交了 ${postApis.length} 个写操作请求。`);
    if (getApis.length > 0)  parts.push(`读取了 ${getApis.length} 个数据接口。`);
    const failedApis = apis.filter(a => a.status >= 400);
    if (failedApis.length > 0) parts.push(`注意: 有 ${failedApis.length} 个接口返回了错误状态码。`);
    return parts.join(' ') || '业务流程已记录。';
}

function countUiSteps(uiScript) {
    if (!uiScript) return 0;
    return (uiScript.match(/await page\./g) || []).length;
}

// ── Save session files ─────────────────────────────────────────────────────────
function saveSessionFiles(srcDir, destDir, name) {
    const savedFiles = [];
    
    // 核心脚本文件
    const coreFiles = [
        { src: 'ui-script.js',         label: 'UI 脚本' },
        { src: 'semantic-script.md',   label: '语义脚本' },
        { src: 'api-script.spec.js',   label: 'API 脚本' },
        { src: 'network.har',          label: '网络录制' },
    ];
    
    coreFiles.forEach(({ src, label }) => {
        const srcPath = path.join(srcDir, src);
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, path.join(destDir, src));
            savedFiles.push(label);
        }
    });
    
    // 保存会话状态
    const sessionState = {
        savedAt: new Date().toISOString(),
        name: name,
        url: session.url,
        step: session.step,
        semanticApproved: fs.existsSync(path.join(srcDir, 'semantic-approved.flag')),
    };
    fs.writeFileSync(path.join(destDir, 'session-state.json'), JSON.stringify(sessionState, null, 2), 'utf-8');
    savedFiles.push('会话状态');
    
    return savedFiles;
}

// ── Write Kiro context ──────────────────────────────────────────────────────────
function writeKiroContext() {
    if (!session.dir) return;
    
    const ctx = {
        sessionId: session.id,
        url: session.url,
        step: session.step,
        uiScriptFile: path.join(session.dir, 'ui-script.js'),
        harFile: path.join(session.dir, 'network.har'),
        semanticFile: path.join(session.dir, 'semantic-script.md'),
        apiScriptFile: path.join(session.dir, 'api-script.spec.js'),
        summary: {
            uiSteps: countUiSteps(session.uiScript),
            totalApis: session.harApis.length,
            businessApis: session.harApis.filter(a => {
                const u = a.url.toLowerCase();
                return (u.includes('/api/') || a.mimeType?.includes('json')) &&
                       !u.match(/\.(js|css|png|jpg|svg|ico|woff|ttf|woff2|map)(\?|$)/);
            }).length,
            apiList: session.harApis.slice(0, 10).map(a => {
                let pathname = a.url;
                try { pathname = new URL(a.url).pathname; } catch {}
                return `${a.method} ${pathname}`;
            }),
        },
    };
    
    const ctxFile = path.join(session.dir, 'kiro-context.json');
    fs.writeFileSync(ctxFile, JSON.stringify(ctx, null, 2), 'utf-8');
    
    // Also write a human-readable prompt file for Kiro
    const prompt = buildKiroPrompt(ctx, session);
    fs.writeFileSync(path.join(session.dir, 'kiro-prompt.md'), prompt, 'utf-8');
}

// ── Save Semantic Script ─────────────────────────────────────────────────────
ipcMain.on('save-semantic-script', (event, data) => {
    if (!session || !session.dir) {
        console.error('[Semantic] No active session');
        event.reply('semantic-script-saved', { success: false, error: 'No active session' });
        return;
    }
    
    const semanticPath = path.join(session.dir, 'semantic-script.md');
    fs.writeFileSync(semanticPath, data.content, 'utf-8');
    
    session.semanticScript = data.content;
    session.step = 'semantic';
    
    console.log(`[Semantic] Saved to: ${semanticPath}`);
    event.reply('semantic-script-saved', { 
        success: true, 
        path: semanticPath,
        length: data.content.length 
    });
});

// ── Check Semantic Script Status ──────────────────────────────────────────────
ipcMain.on('check-semantic-script', (event) => {
    if (!session || !session.dir) {
        event.reply('semantic-script-status', { exists: false });
        return;
    }
    
    const semanticPath = path.join(session.dir, 'semantic-script.md');
    
    if (fs.existsSync(semanticPath)) {
        const content = fs.readFileSync(semanticPath, 'utf-8');
        session.semanticScript = content;
        
        console.log(`[Semantic] Found existing script: ${semanticPath}`);
        event.reply('semantic-script-status', { 
            exists: true, 
            content: content,
            path: semanticPath
        });
    } else {
        event.reply('semantic-script-status', { exists: false });
    }
});
