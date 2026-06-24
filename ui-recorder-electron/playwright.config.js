const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  // 匹配 replay-test.spec.js 和 replay-api-test.spec.js
  testMatch: /replay.*\.spec\.js$/,
  testIgnore: ['**/sessions/**', '**/node_modules/**', '**/test-results/**'],
  timeout: 60000,
  use: {
    headless: false,
    // 不指定 channel，使用 Playwright 自带的 Chromium
  },
  reporter: 'line',
});
