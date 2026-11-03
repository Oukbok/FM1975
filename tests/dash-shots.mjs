// Screenshots der Zentrale (Newscenter-Aufbau, src/views/zentrale/dash/).
//   npm run build && node tests/dash-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“ (public/saves/test-3-jahre.txt); anderer mit SAVE=…,
//   Präfix der Dateinamen mit PREFIX=… (z. B. PREFIX=2012).
// Je Auflösung 1920×1080 und 1366×768: Zentrale, Nachricht gewählt, Übersicht aufgeklappt.
// Meldet JS-Fehler, Seiten-Scroll und Boxen, deren Inhalt über den Rand ragt.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/dash';
const prefix = process.env.PREFIX ? process.env.PREFIX + '_' : '';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
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
  // Offene Popups (Briefing u. a.) schließen.
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
  await page.waitForTimeout(500);

  const check = async (n) => {
    const r = await page.evaluate(() => {
      const out = [];
      const m = document.querySelector('.app-main');
      if (m && m.scrollHeight - m.clientHeight > 2) out.push(`Seite scrollt (${m.scrollHeight - m.clientHeight}px)`);
      const d = document.querySelector('.dz');
      if (d) {
        const b = d.getBoundingClientRect();
        if (b.right > window.innerWidth + 1) out.push('Zentrale breiter als das Fenster');
        for (const el of d.querySelectorAll('.dz-col, .dz-news, .dz-w')) {
          if (el.scrollWidth - el.clientWidth > 2) out.push(`${el.className}: waagrechter Überlauf ${el.scrollWidth - el.clientWidth}px`);
        }
      } else out.push('Zentrale (.dz) fehlt');
      return out;
    });
    for (const x of r) errors.push(`${w} ${n}: ${x}`);
  };
  const shot = async (n) => { await page.waitForTimeout(300); await check(n); await page.screenshot({ path: `${outDir}/${prefix}${n}_${w}.png` }); };

  const step = async (n, fn) => { try { await fn(); } catch (e) { errors.push(`${w} ${n}: ${e.message.split('\n')[0]}`); } };
  await shot('zentrale');
  // Zweite Nachricht wählen (Lesebereich), dann ggf. eine mit Spielergesicht.
  await step('nachricht', async () => {
    const rows = page.locator('.dz-msg');
    if (await rows.count() > 1) { await rows.nth(1).click(); await shot('nachricht'); }
    const withFace = page.locator('.dz-msg[data-player="1"]');
    if (await withFace.count()) { await withFace.first().click(); await shot('nachricht_spieler'); }
  });
  // Übersicht: alle Abschnitte aufklappen.
  await step('uebersicht', async () => {
    const heads = page.locator('.dz-ov-head');
    for (let i = 0; i < await heads.count(); i++) { const el = heads.nth(i); if ((await el.getAttribute('aria-expanded')) === 'false') await el.click(); }
    await shot('uebersicht');
    // Klick in der Übersicht → Statistiken mit Auswahl.
    const cupLink = page.locator('.dz-ov-item:has-text("Pokal")');
    if (await cupLink.count()) {
      await cupLink.first().click(); await page.waitForTimeout(500);
      await page.screenshot({ path: `${outDir}/${prefix}uebersicht_ziel_${w}.png` });
      await page.locator('.hd-nav-item:has-text("Zentrale")').first().click(); await page.waitForTimeout(300);
    }
  });
  // Zeitlauf kurz an: Kalender-Überblendung erscheint über der Zentrale.
  await step('zeitlauf', async () => {
  const go = page.locator('button:has-text("Weiter")').first();
  if (await go.count()) {
    await go.click(); await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/${prefix}zeitlauf_${w}.png` });
    const pause = page.locator('button:has-text("Pause")').first();
    if (await pause.count()) await pause.click();
    await page.waitForTimeout(800);
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
    await page.locator('.hd-nav-item:has-text("Zentrale")').first().click().catch(() => {});
    await shot('nach_zeitlauf');
  }
  });
  await page.close();
}

await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
console.log(`Screenshots: ${outDir}`);
