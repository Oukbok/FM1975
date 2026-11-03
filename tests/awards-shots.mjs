// Screenshots der Ehrungen: Popup „Die Besten der Saison“, Seite Statistiken › Auszeichnungen
// und die Gala zum Goldenen Ball (alle Schritte), je 1920×1080 und 1366×768.
//   npm run build && node tests/awards-shots.mjs [ordner]
// Spielstände (SAVES=name:pfad,…; Name mit „gala“ = Gala, sonst Saisonehrung), z. B.:
//   CLUB=fra DUMP=a.txt UNTIL=1979-06-10 node scripts/sim.mjs 3
//   node scripts/run-ts.mjs tests/awards-prep.ts a.txt s1979.txt
//   CLUB=fra DUMP=b.txt UNTIL=1979-12-19 node scripts/sim.mjs 4
//   MODE=gala node scripts/run-ts.mjs tests/awards-prep.ts b.txt gala1979.txt
//   SAVES=s1979:s1979.txt,gala1979:gala1979.txt node tests/awards-shots.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/awards';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const saves = (process.env.SAVES || '').split(',').filter(Boolean).map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; });
if (!saves.length) { console.error('SAVES=name:pfad,… fehlt'); process.exit(2); }
const browser = await chromium.launch();
const errors = [];

for (const [vw, vh] of [[1920, 1080], [1366, 768]]) {
  for (const [name, file] of saves) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh } });
    page.on('pageerror', (e) => errors.push(`${name} ${vw}: JS-Fehler ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    const raw = await readFile(file, 'utf8');
    await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
    await page.reload();
    await page.click('text=Spiel laden');
    await page.click('button:has-text("Laden") >> nth=0');
    const pre = `${outDir}/${name}_${vw}`;
    const over = async (sel, what) => {
      const o = await page.evaluate((s) => { const b = document.querySelector(s); return b ? Math.max(b.scrollWidth - b.clientWidth, 0) : -1; }, sel);
      if (o > 2) errors.push(`${name} ${vw}: ${what} waagerechter Überlauf ${o}px`);
    };
    if (name.includes('gala')) {
      await page.waitForSelector('.gb-root', { timeout: 15000 });
      for (let s = 0; s <= 4; s++) {
        await page.waitForTimeout(s === 0 ? 2000 : 1100);
        await page.screenshot({ path: `${pre}_gala_${s}.png` });
        if (s < 4) await page.locator('.gb-foot .btn-primary').click();
      }
      await over('.gb-root', 'Gala');
      await page.locator('.gb-foot .btn-primary').click();
      await page.waitForTimeout(300);
      if (await page.locator('.gb-root').count()) errors.push(`${name}: Gala schließt nicht`);
    } else {
      await page.waitForSelector('.aw-modal', { timeout: 15000 });
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${pre}_popup.png` });
      await over('.aw-body', 'Popup');
      await page.locator('.aw-foot button:has-text("Alle Jahrgänge")').click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: `${pre}_seite.png` });
      const sc = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
      if (sc > 2) errors.push(`${name} ${vw}: Seite scrollt (${sc}px)`);
    }
    await page.close();
  }
}
await browser.close();
server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Screenshots in', outDir);
