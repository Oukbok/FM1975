import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const root = 'dist';
const srv = createServer(async (q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'; try { r.writeHead(200, { 'Content-Type': T[extname(p)] || 'application/octet-stream' }).end(await readFile(join(root, p))); } catch { r.writeHead(404).end(); } }).listen(0);
const out = process.argv[2];
const b = await chromium.launch();
const errs = [];
for (const [w, h, tag] of [[1920, 1080, 'fhd'], [1280, 800, 'small'], [2560, 1080, 'wide']]) {
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/`);
  await pg.waitForTimeout(1200);
  await pg.screenshot({ path: `${out}/menu_${tag}.png` });
  if (tag === 'fhd') {
    await pg.click('.st-era button:has-text("1975")'); await pg.waitForTimeout(700);
    await pg.screenshot({ path: `${out}/menu_1975.png` });
    await pg.click('.st-era button:has-text("2025")'); await pg.waitForTimeout(700);
    await pg.screenshot({ path: `${out}/menu_2025.png` });
    await pg.click('.st-btn:has-text("Einstellungen")'); await pg.waitForTimeout(400);
    await pg.screenshot({ path: `${out}/menu_settings.png` });
  }
  await pg.close();
}
console.log(errs.length ? errs.join('\n') : 'ok');
await b.close(); srv.close();
