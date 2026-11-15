// Screenshots KI-Angebot für einen eigenen Spieler: Nachricht im Newscenter (Wahlknöpfe
// sichtbar?), Knopf „Angebot verhandeln“ → Transfers › Verhandlungen (Abschnitt
// „Angebote für deine Spieler“), dazu eine fremde Transfermeldung ohne „Verhandlungen“.
//   npm run build && node scripts/run-ts.mjs tests/aioffer-prep.ts public/saves/test-20-jahre.txt <stand.txt>
//   SAVE=<stand.txt> node tests/aioffer-shots.mjs [ordner]
// 1920×1080 + 1366×768; meldet JS-Fehler und fehlende/verdeckte Wahlknöpfe.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/aioffer';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-20-jahre.txt', 'utf8');
const browser = await chromium.launch();
const errors = [];

for (const [w, h] of [[1920, 1080], [1366, 768]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('pageerror', (e) => errors.push(`${w}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  await page.waitForTimeout(600);
  const shot = async (n) => { await page.waitForTimeout(300); await page.screenshot({ path: `${outDir}/${n}_${w}.png` }); };
  const step = async (n, fn) => { try { await fn(); } catch (e) { errors.push(`${w} ${n}: ${e.message.split('\n')[0]}`); } };

  await step('angebot', async () => {
    await page.locator('.dz-msg:has-text("bietet")').first().click();
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const box = document.querySelector('.dz-read')?.getBoundingClientRect();
      const btns = [...document.querySelectorAll('.dz-read .ev-choice')].map((b) => b.getBoundingClientRect());
      const vis = btns.filter((b) => b.height > 20 && box && b.top >= box.top - 1 && b.bottom <= box.bottom + 1).length;
      return { n: btns.length, vis };
    });
    if (!r.n) errors.push(`${w} angebot: keine Wahlknöpfe`);
    else if (r.vis < r.n) errors.push(`${w} angebot: nur ${r.vis} von ${r.n} Wahlknöpfen ohne Scrollen sichtbar`);
    await shot('angebot');
  });
  await step('verhandlungen', async () => {
    await page.locator('.dz-rlinks button:has-text("Angebot verhandeln")').first().click({ timeout: 5000 });
    await page.waitForTimeout(600);
    if (!(await page.locator('text=Angebote für deine Spieler').count())) errors.push(`${w} verhandlungen: Abschnitt fehlt`);
    await shot('verhandlungen');
    // Gegenangebot +10 % → Ergebnis steht im Abschnitt, Angebot ist erledigt.
    await page.locator('.ioff-counter button:has-text("+10 %")').first().click({ timeout: 5000 });
    await page.waitForTimeout(300);
    if (!(await page.locator('.ioff-done').count())) errors.push(`${w} verhandlungen: kein Ergebnis nach dem Gegenangebot`);
    await shot('verhandlungen_ergebnis');
  });
  await step('fremd', async () => {
    await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
    await page.waitForTimeout(500);
    const rows = page.locator('.dz-msg:has-text("wechselt")');
    if (!(await rows.count())) return;
    await rows.first().click();
    await page.waitForTimeout(300);
    const labels = await page.locator('.dz-rlinks button').allInnerTexts();
    if (labels.some((t) => /Verhandlungen/i.test(t))) errors.push(`${w} fremd: Knopf „Verhandlungen“ bei fremdem Transfer (${labels.join(', ')})`);
    await shot('fremd');
  });
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Auffälligkeiten.');
