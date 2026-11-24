// Screenshots: Cheftrainer eines Auslandsgegners (game/worldCoaches.ts) – Vorschau „Nächstes Spiel“,
// Aufstellung › Gegner („So spielt der Gegner – Trainer“), Textmodus („Trainer: …“), Vereinsprofil
// (Übersicht + Reiter Verein mit Trainer & Stab). Läuft bis zum nächsten eigenen Europapokalspiel.
//   npm run build && SAVE=public/saves/test-3-jahre.txt node tests/worldcoach-shots.mjs [ordner] [präfix]
// Prüft: Textmodus und Gegner-Seite zeigen einen Trainernamen (nicht „–“), JS-Fehler.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/worldcoach';
const prefix = process.argv[3] || 'wc';
const MAX = Number(process.env.MAX || 30);
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);

const shot = (name) => page.screenshot({ path: `${outDir}/${prefix}_${name}.png` });
const closeModals = async () => {
  for (const sel of ['button:has-text("Zum Spielbericht")', '.dr-root:not(.rt-root) .dg-skip', '.dr-root:not(.rt-root) .dg-go:has-text("Weiter")', '.dr-root button:has-text("Bis zum Ende springen")', '.dr-root button:has-text("Schließen")', 'button:has-text("Schließen")', '.modal-overlay .modal-close', '.bf-modal .bf-continue']) {
    const b = page.locator(sel).first();
    if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
  }
  for (const sh of ['.gb-root', '.rb2-overlay']) if (await page.locator(sh).count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  for (let k = 0; k < 20 && await page.locator('.ix-root').count(); k++) {
    const close = page.locator('.ix-root .ix-btn:has-text("Schließen")').first();
    const all = page.locator('.ix-root .ix-btn:has-text("Alles simulieren"):not([disabled])').first();
    if (await close.isVisible().catch(() => false)) await close.click().catch(() => {});
    else if (await all.isVisible().catch(() => false)) await all.click().catch(() => {});
    await page.waitForTimeout(700);
  }
};

// Bis zur Vorschau eines Europapokalspiels (Liga/Pokal werden simuliert).
let found = false;
const t0 = Date.now();
for (let n = 0; n < MAX && Date.now() - t0 < 10 * 60_000;) {
  if (await page.locator('.pm-root').isVisible().catch(() => false)) {
    const comp = (await page.locator('.pm-comp').innerText()).trim();
    n++;
    console.log(`Spiel ${n}: ${comp} · ${(await page.locator('.pm-bar').innerText()).replace(/\s+/g, ' ')}`);
    if (!/^(Liga|Pokal(?! der ))/.test(comp)) { found = true; break; }
    await page.click('.pm-go-btn:has-text("Simulieren")');
    await page.waitForTimeout(900);
  }
  await closeModals();
  if (!(await page.locator('.pm-root').count())) {
    const w = page.locator('button.hd-continue').filter({ hasText: /^\s*Weiter\s*$/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForSelector('.pm-root, .modal-overlay, .dr-root', { timeout: 20_000 }).catch(() => {});
  }
  await page.waitForTimeout(300);
}
if (!found) { errors.push('kein Europapokalspiel erreicht'); await shot('debug'); }
else {
  await page.waitForTimeout(500);
  await shot('1_vorschau');
  const oppId = await page.locator('.pm-bar-side:not(.mine) [data-club]').first().getAttribute('data-club').catch(() => null);
  console.log('Gegner-ID:', oppId);
  const coachRow = await page.locator('.pm-frow:has(.pm-fc:has-text("Trainer"))').innerText().catch(() => '');
  console.log('Vorschau Trainer:', coachRow.replace(/\s+/g, ' '));
  if (!coachRow || /–\s*$/.test(coachRow.trim())) errors.push('Vorschau: kein Trainer des Gegners');
  // Gegner-Seite
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.click('.hd-nav-item:has-text("Aufstellung")'); await page.waitForTimeout(400);
  await page.locator('.tn-sub-item:has-text("Gegner")').click(); await page.waitForTimeout(900);
  await shot('2_gegner');
  const kv = await page.locator('.opx-plays').innerText().catch(() => '');
  const trainer = (kv.match(/Trainer\s*\n?\s*([^\n]+)/) ?? [])[1]?.trim();
  console.log('Gegner-Seite Trainer:', trainer);
  if (!trainer || trainer === '–') errors.push('Gegner-Seite: Trainer –');
  // Vereinsprofil: Gegner (Übersicht) und ein Auslandsverein ohne vollen Kader (Reiter Verein: Trainer & Stab)
  const openClub = async (id) => {
    await page.evaluate((cid) => { const el = document.createElement('span'); el.setAttribute('data-club', cid); el.id = 'wc-probe'; document.querySelector('.display-content')?.appendChild(el); el.click(); el.remove(); }, id);
    await page.waitForTimeout(900);
  };
  if (oppId) { await openClub(oppId); await shot('4_profil_gegner'); await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
  await openClub(process.env.OTHER || 'w_eng-liverpool-rot');
  await page.click('.cmx-tabs .tab:has-text("Verein")').catch(() => errors.push('Profil: Reiter Verein fehlt'));
  await page.waitForTimeout(600);
  await shot('5_profil_ausland_verein');
  const box = await page.locator('.cmx-body .dbox:has-text("Trainer")').last().innerText().catch(() => '');
  console.log('Profil Ausland:', box.replace(/\s+/g, ' ').slice(0, 200));
  if (!box || /unbekannt/.test(box)) errors.push('Profil Ausland: kein Trainer');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  // Textmodus
  await page.click('.hd-continue.pm-next'); await page.waitForTimeout(600);
  await page.click('button:has-text("Textmodus")'); await page.waitForTimeout(2500);
  for (let k = 0; k < 6 && !(await page.locator('.tm-root, .ms-root').count()); k++) { await closeModals(); await page.waitForTimeout(800); }
  await shot('3_textmodus');
  const tm = await page.evaluate(() => [...document.querySelectorAll('.ms-root div, .tm-root div')].map((d) => d.textContent ?? '').filter((t) => /^Trainer: /.test(t)).slice(0, 2));
  console.log('Textmodus:', tm.join(' | '));
  if (tm.length < 2 || tm.some((t) => /Trainer: –/.test(t))) errors.push(`Textmodus: ${tm.join(' | ') || 'keine Trainerzeile'}`);
}
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
