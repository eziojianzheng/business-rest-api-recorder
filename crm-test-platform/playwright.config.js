const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: /crm-full-flow\.spec\.js$/,
  testIgnore: ['**/node_modules/**'],
  timeout: 120000,   // 赢单审批轮询需要较长时间
  use: {
    headless: true,
  },
  reporter: 'list',
});
