const path = require('path');
const { defineConfig } = require('@playwright/test');

const replayDir = process.env.PW_REPLAY_DIR || __dirname;

module.exports = defineConfig({
  testDir: replayDir,
  testMatch: /replay.*\.spec\.js$/,
  testIgnore: ['**/sessions/**', '**/node_modules/**', '**/test-results/**'],
  outputDir: path.join(replayDir, 'test-results'),
  timeout: 60000,
  use: {
    headless: false,
    // 统一使用随应用分发的 Playwright Chromium，不依赖系统 Chrome。
  },
  reporter: 'line',
});
