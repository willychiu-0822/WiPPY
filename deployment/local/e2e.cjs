#!/usr/bin/env node
// Local acceptance entrypoint. Uses the same full assertions and evidence reporter
// as npm run test:e2e, including LINE empty states and approval without groups.
// Run without arguments for desktop + mobile; additional Playwright CLI arguments
// are forwarded unchanged (filtered runs do not mark UAT ready).
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const child = spawn(process.execPath, [
  path.join(root, 'frontend/node_modules/@playwright/test/cli.js'),
  'test', '--config', path.join(root, 'frontend/playwright.config.ts'),
  ...process.argv.slice(2),
], { cwd: path.join(root, 'frontend'), stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', error => {
  console.error(`Cannot start local UAT: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
