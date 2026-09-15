const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const appDir = path.join(__dirname, '..');
const browsersDir = path.join(appDir, '.playwright-browsers');
const playwrightCli = path.join(appDir, 'node_modules', 'playwright', 'cli.js');

fs.mkdirSync(browsersDir, { recursive: true });
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersDir;

const { chromium } = require('playwright');
let executable = chromium.executablePath();
if (fs.existsSync(executable)) {
  console.log(`Chromium already ready: ${executable}`);
  process.exit(0);
}

const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: browsersDir };
const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium', '--no-shell'], {
  cwd: appDir,
  env,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status || 1);

executable = chromium.executablePath();
if (!fs.existsSync(executable)) {
  console.error(`Chromium installation verification failed: ${executable}`);
  process.exit(1);
}
console.log(`Chromium ready: ${executable}`);
