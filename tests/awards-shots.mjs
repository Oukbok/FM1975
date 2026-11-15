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
    await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
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
      // Seite Statistiken › Auszeichnungen: Goldener Ball oben, Wahl einer Auslandsliga, Pfeile.
      await page.locator('.hd-nav-item:has-text("Statistiken")').first().click().catch(() => {});
      await page.waitForTimeout(400);
      await page.locator('.tn-sub-item:has-text("Auszeichnungen")').first().click().catch(() => {});
      await page.waitForTimeout(900);
      if (await page.locator('.aw-page').count()) {
        await page.screenshot({ path: `${pre}_seite_gb.png` });
        await page.locator('.aw-pick button[aria-label="Vorige Saison"]').click();
        await page.waitForTimeout(300);
        await page.locator('.aw-pick-league').click();
        await page.waitForTimeout(300);
        await page.locator('.sel3-pop [role="option"]:has-text("Italien"), .sel3-menu [role="option"]:has-text("Italien")').first().click().catch(() => {});
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${pre}_seite_liga.png` });
        await over('.aw-page', 'Seite');
        // Weitere Auszeichnungen über dieselbe Wahl: Goldener Schuh, Trainer des Jahres, Elf der Saison (eigene Liga + Ausland).
        // label: Text des Eintrags oder RegExp (erster Treffer zählt).
        const pick = async (label, file, sel) => {
          await page.locator('.aw-pick-league').click();
          await page.waitForTimeout(250);
          const opt = page.locator('.sel3-pop [role="option"], .sel3-menu [role="option"]').filter({ hasText: label }).first();
          if (!(await opt.count())) { errors.push(`${name} ${vw}: Eintrag „${label}“ fehlt in der Auswahl`); await page.keyboard.press('Escape'); return; }
          await opt.click();
          await page.waitForTimeout(900);
          await page.screenshot({ path: `${pre}_seite_${file}.png` });
          if (!(await page.locator(sel).count())) errors.push(`${name} ${vw}: ${label} zeigt nichts (${sel})`);
          await over('.aw-page', label);
          const box = await page.evaluate((s2) => { const b = document.querySelector(s2)?.closest('.dbox-body'); return b ? [b.scrollHeight - b.clientHeight, b.scrollWidth - b.clientWidth] : [0, 0]; }, sel);
          if (box[0] > 2 || box[1] > 2) errors.push(`${name} ${vw}: ${label} läuft in der Box über (${box.join('/')} px)`);
        };
        await pick('Goldener Schuh', 'schuh', '.gs-table');
        await pick('Trainer des Jahres', 'trainer', '.tdj-grid');
        // Elf der eigenen Liga steht zuerst in der Gruppe – je nach Spielstand 1. oder 2. Liga.
        await pick(/Elf der Saison · .*(Liga|liga)/, 'elf', '.tos-pitch');
        await pick('Elf der Saison · England', 'elf_ausland', '.tos-pitch');
        const chips = await page.locator('.tos-chip').count();
        if (chips && chips !== 11) errors.push(`${name} ${vw}: Elf der Saison zeigt ${chips} statt 11 Spieler`);
        // Chips dürfen nicht aus dem Spielfeld ragen
        const outside = await page.evaluate(() => { const f = document.querySelector('.tos-pitch')?.getBoundingClientRect(); if (!f) return 0; return [...document.querySelectorAll('.tos-chip')].filter((c) => { const r = c.getBoundingClientRect(); return r.left < f.left - 1 || r.right > f.right + 1 || r.top < f.top - 1 || r.bottom > f.bottom + 1; }).length; });
        if (outside) errors.push(`${name} ${vw}: ${outside} Namen ragen aus dem Spielfeld`);
      } else errors.push(`${name}: Seite Auszeichnungen nicht erreicht`);
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
