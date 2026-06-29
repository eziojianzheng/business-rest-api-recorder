# CRM 自动化测试平台

基于 Playwright 的 CRM 完整销售流程自动化测试，提供 Web 界面管理测试运行。

## 前置条件

- 已安装 `ui-recorder-electron/node_modules`（在 `ui-recorder-electron` 目录下运行过 `npm install`）

## 启动

```bash
cd crm-test-platform
npm install
npm start
# 或者双击 start.bat
```

浏览器访问：http://localhost:3030

## 功能

- **立即运行**：触发 CRM 完整流程测试，实时查看日志
- **定时运行**：配置 cron 表达式定期自动运行
- **运行历史**：记录每次运行的时间、结果、完整日志
- **点击历史**：弹出详细报告

## 测试用例

**CRM 完整销售流程**（`crm-full-flow.spec.js`）

| 步骤 | 内容 |
|------|------|
| 1 | 双账号登录（执行人 + 审批人） |
| 2 | 获取用户信息 |
| 3 | 语音线索生成（AI） |
| 4 | 创建客户档案 |
| 5 | 线索转化为商机 |
| 6 | 创建销售报价 |
| 6b | 报价审批（Sales Manager A） |
| 7 | 商机推进到赢单 |
| 7b | 赢单审批（Sales Manager A） |
| 8 | 生成销售合同 |
| 9 | 完善合同信息 |
| 10 | 合同生效 |

## 目录结构

```
crm-test-platform/
├── server.js               # Express 服务器（端口 3030）
├── test-runner.js          # 测试执行器 + 历史管理
├── playwright.config.js    # Playwright 配置
├── crm-full-flow.spec.js   # 测试用例
├── package.json
├── start.bat               # Windows 快捷启动
├── public/
│   └── index.html          # Web 界面
├── run-history.json        # 运行历史（自动生成，不提交 git）
└── schedule.json           # 定时配置（自动生成，不提交 git）
```

## 账号信息

| 角色 | 邮箱 | 说明 |
|------|------|------|
| Sales Representative A | xuanyu.lu@bizops.com.cn | 执行销售操作 |
| Sales Manager A | 593969718@qq.com | 审批报价和赢单 |

## 系统环境

- 目标系统：`https://bot.ceta.crm.duxing.cn`
- 组织：知微行易销售部东区（ID: 14329）
