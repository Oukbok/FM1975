// Screenshots der Gesichtsbilder (PlayerAvatar mit Foto aus public/assets/faces):
// Spielerprofil, Zentrale (Newscenter), Presse, Budget-Berater (Mitarbeiter-Foto).
//   npm run build && node tests/faces-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; anderer mit SAVE=…; VIEW=1366x768;
//   ONLY=text nur Textmodus, TEXT=0 ohne Textmodus.
// Zählt je Ansicht Foto-Boxen (.pa-photo) und geladene Fotos; meldet JS-Fehler und
// Größensprünge (Box-Größe vor/nach dem Laden). Ohne Bilder im Register gibt es
// keine .pa-photo – dann zeigt der Bericht 0 (gezeichnete Gesichter).
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/faces';
await mkdir(outDir, { recursive: true });
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const tag = `${vw}`;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
const missing = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
page.on('response', (r) => { if (r.status() === 404 && r.url().includes('/faces/')) missing.push(r.url()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);

const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }

const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(350); }
};

const report = [];
async function shoot(name, clip) {
  // Größe der Foto-Boxen sofort und nach dem Laden – darf sich nicht ändern.
  const before = await page.evaluate(() => [...document.querySelectorAll('.pa-photo')].map((e) => `${e.clientWidth}x${e.clientHeight}`));
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => [...document.querySelectorAll('.pa-photo')].map((e) => `${e.clientWidth}x${e.clientHeight}`));
  const info = await page.evaluate(() => ({
    boxes: document.querySelectorAll('.pa-photo').length,
    loaded: document.querySelectorAll('.pa-photo.loaded').length,
    kits: document.querySelectorAll('.pa-photo .pa-kit').length,
    srcs: [...new Set([...document.querySelectorAll('.pa-photo img')].map((i) => i.getAttribute('src')))].slice(0, 6),
  }));
  if (before.join() !== after.slice(0, before.length).join()) errors.push(`${name}: Box-Größe ändert sich beim Laden (${before.join()} → ${after.join()})`);
  report.push(`${name.padEnd(16)} Fotos ${info.loaded}/${info.boxes}, Trikot-Masken ${info.kits}  ${info.srcs.join(' ')}`);
  const el = clip ? page.locator(clip).first() : null;
  if (el && await el.count()) await el.screenshot({ path: `${outDir}/${tag}_${name}_ausschnitt.png` });
  await page.screenshot({ path: `${outDir}/${tag}_${name}.png` });
}

if (process.env.ONLY !== 'text') try {
  await nav('Kader', 'Übersicht');
  await page.locator('.dtable tbody tr').nth(3).click();
  await shoot('profil', '.pp2-face');
  await page.locator('.pp-modal .pp2-nav-next').first().click().catch(() => {});
  await shoot('profil2', '.pp2-face');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
} catch (e) { errors.push('profil: ' + e.message.split('\n')[0]); }

if (process.env.ONLY !== 'text') try { await nav('Zentrale', 'Zentrale'); await shoot('zentrale'); } catch (e) { errors.push('zentrale: ' + e.message.split('\n')[0]); }
if (process.env.ONLY !== 'text') try { await nav('Zentrale', 'Presse'); await shoot('presse'); } catch (e) { errors.push('presse: ' + e.message.split('\n')[0]); }
if (process.env.ONLY !== 'text') try { await nav('Finanzen', 'Budget'); await shoot('budget', '.bud-adv-face'); } catch (e) { errors.push('budget: ' + e.message.split('\n')[0]); }

// Textmodus: bis zum nächsten eigenen Spiel weiterspielen, Wechsel-Bildschirm öffnen (Gesichter auf dem Feld).
if (process.env.TEXT !== '0') try {
  const closeModals = async () => {
    for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', 'button:has-text("Übernehmen")', 'button:has-text("Bestätigen")', '.modal-close', '.dr-root button:has-text("Ergebnis sofort zeigen")']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    }
  };
  let found = false;
  for (let i = 0; i < 260 && !found; i++) {
    if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) { found = true; break; }
    await closeModals();
    const w = page.locator('.hd-continue').first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  if (!found) { await page.screenshot({ path: `${outDir}/${tag}_textmodus_nicht_erreicht.png` }); throw new Error('Textmodus nicht erreicht'); }
  await shoot('vorschau');
  await page.click('button:has-text("Textmodus")');
  await page.waitForTimeout(1500);
  const sw = page.locator('button:has-text("Wechsel / Taktik")').first();
  if (await sw.count()) { await sw.click(); await page.waitForTimeout(900); }
  await shoot('textmodus');
} catch (e) { errors.push('textmodus: ' + e.message.split('\n')[0]); }

console.log(report.join('\n'));
if (missing.length) console.log('Fehlende Bilder (404):\n  ' + [...new Set(missing)].join('\n  '));
console.log(errors.length ? 'Probleme:\n  ' + errors.join('\n  ') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
