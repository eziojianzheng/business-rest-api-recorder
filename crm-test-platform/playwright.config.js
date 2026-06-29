const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['**/crm-full-flow.spec.js'],
  testIgnore: ['**/node_modules/**'],
  timeout: 180000,   // 赢单审批轮询最多需要约 100 秒
  use: {
    headless: true,
  },
  reporter: 'list',
});
