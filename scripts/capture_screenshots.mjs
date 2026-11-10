import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screensDir = path.join(rootDir, 'docs', 'screens');

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

const routes = [
  { path: '', slug: 'overview' },
  { path: 'accounts', slug: 'accounts' },
  { path: 'accounts/new', slug: 'create-account' },
  { path: 'accounts/1', slug: 'account-detail' },
  { path: 'accounts/1/spend', slug: 'request-spend' },
  { path: 'spends/1', slug: 'spend-detail' },
  { path: 'gate', slug: 'spendgate' },
  { path: 'credits', slug: 'credits' },
  { path: 'evidence', slug: 'evidence' },
  { path: 'limits', slug: 'limits' },
  { path: '404', slug: 'not-found' },
];

const viewports = [
  { name: '1280', width: 1280, height: 900 },
  { name: '360', width: 360, height: 740 },
];

const BASE_URL = 'http://localhost:4173/agent-allowance-app/';

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return true;
    } catch {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  return false;
}

async function main() {
  console.log('Starting preview server for screenshot capture...');
  const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
    cwd: rootDir,
    stdio: 'ignore',
    shell: true,
  });

  const ready = await waitForServer(BASE_URL);
  if (!ready) {
    server.kill();
    throw new Error('Preview server failed to start within timeout.');
  }

  console.log('Capturing screenshots for all routes...');
  const browser = await chromium.launch();

  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      for (const route of routes) {
        const fullUrl = `${BASE_URL}${route.path}`;
        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 8000 });
        } catch {
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
        }

        // Apply theme
        if (theme === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          });
        } else {
          await page.evaluate(() => {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          });
        }
        await page.waitForTimeout(300);

        const filename = `${route.slug}-${vp.name}-${theme}.png`;
        const filePath = path.join(screensDir, filename);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved: ${filename}`);
      }
      await context.close();
    }
  }

  await browser.close();
  server.kill();
  console.log(`\nScreenshot capture complete! All screens stored in docs/screens/`);
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});

