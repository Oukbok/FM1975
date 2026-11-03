// Screenshots des Spielerprofils (PlayerModal, Aufbau „Profil 2“): Feldspieler, Torwart,
// Jugendspieler, fremder Spieler, Vertragsverhandlung – je Reiter ein Bild.
//   npm run build && node tests/profile-shots.mjs [ordner]
//   Standard-Spielstand: Vorlage „Test 3 Jahre“; anderer mit SAVE=…; VIEW=1366x768 für kleinere Fenster;
//   ONLY=kader|vertrag|jugend|fremd nur einen Teil.
// Meldet JS-Fehler, äußeres Scrollen des Fensters und Überläufe der festen Bereiche.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/profile';
await mkdir(outDir, { recursive: true });
const only = process.env.ONLY;
const want = (k) => !only || only === k;
const [vw, vh] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: vw, height: vh } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
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

/** Prüft das offene Profil: äußeres Scrollen, Überlauf fester Bereiche. */
async function check(name) {
  const r = await page.evaluate(() => {
    const out = [];
    const m = document.querySelector('.pp-modal');
    if (!m) return ['kein Profil offen'];
    if (m.scrollHeight - m.clientHeight > 2) out.push(`Fenster scrollt (${m.scrollHeight - m.clientHeight}px)`);
    for (const sel of ['.pp2-top', '.pp2-id', '.pp2-topright', '.pp2-tabs', '.pp2-skills-head']) {
      const el = document.querySelector(sel);
      if (el && (el.scrollHeight - el.clientHeight > 2 || el.scrollWidth - el.clientWidth > 2)) out.push(`${sel} läuft über`);
    }
    // waagrechter Überlauf im Reiterinhalt
    const body = document.querySelector('.pp2-tabbody');
    if (body && body.scrollWidth - body.clientWidth > 2) out.push(`Reiterinhalt waagrecht zu breit (${body.scrollWidth - body.clientWidth}px)`);
    return out;
  });
  for (const x of r) errors.push(`${name}: ${x}`);
}

async function shoot(prefix) {
  await page.waitForTimeout(350);
  await check(prefix);
  await page.screenshot({ path: `${outDir}/${prefix}.png` });
  const tabs = page.locator('.pp-modal .pp-tabs button');
  const n = await tabs.count();
  for (let i = 0; i < n; i++) {
    const label = (await tabs.nth(i).innerText()).trim().toLowerCase().replace(/[^a-zäöü]+/g, '_');
    await tabs.nth(i).click();
    await page.waitForTimeout(250);
    await check(`${prefix}_${label}`);
    await page.screenshot({ path: `${outDir}/${prefix}_${i}_${label}.png` });
  }
}
const close = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(150); if (await page.locator('.pp-modal').count()) { await page.locator('.pp-modal .pp2-close, .pp-modal .modal-close').first().click(); await page.waitForTimeout(200); } };

// 1) Feldspieler + Torwart aus dem eigenen Kader (Übersicht, mit Vertragsverhandlung)
if (want('kader')) try {
  await nav('Kader', 'Übersicht');
  const rows = page.locator('.dtable tbody tr');
  const cnt = await rows.count();
  let gk = -1, field = -1;
  for (let i = 0; i < cnt && (gk < 0 || field < 0); i++) {
    const pos = (await rows.nth(i).locator('.pos-badge').first().innerText().catch(() => '')).trim();
    if (pos === 'TW' && gk < 0) gk = i; else if (pos !== 'TW' && field < 0 && i > 2) field = i;
  }
  await rows.nth(field).click(); await shoot('feldspieler');
  // Fähigkeiten: nur wichtige + Trainingsfortschritt, andere Position über das Feld
  await page.locator('.pp2-seg .dchip').nth(1).click();
  const prog = page.locator('.pp2-check input');
  if (await prog.count()) await prog.check();
  const spot = page.locator('.pp2-spot').nth(2);
  await spot.click(); await page.waitForTimeout(250); await check('fortschritt');
  await page.screenshot({ path: `${outDir}/feldspieler_wichtig_fortschritt.png` });
  await page.locator('.pp2-seg .dchip').nth(0).click();
  // Vor/Zurück im Kader
  const next = page.locator('.pp-modal .pp2-nav-next');
  if (await next.count()) { await next.click(); await page.waitForTimeout(300); await check('weiter'); await page.screenshot({ path: `${outDir}/feldspieler_weiter.png` }); }
  await close();
  await rows.nth(gk).click(); await shoot('torwart'); await close();
} catch (e) { errors.push('eigener Kader: ' + e.message.split('\n')[0]); }

// 2) Vertragsverhandlung (Kader › Verträge, öffnet auf dem Vertrags-Reiter)
if (want('vertrag')) try {
  await nav('Kader', 'Verträge');
  await page.locator('.dtable tbody tr').first().click();
  await page.waitForTimeout(400);
  await check('vertrag'); await page.screenshot({ path: `${outDir}/vertrag.png` });
  await close();
} catch (e) { errors.push('vertrag: ' + e.message.split('\n')[0]); }

// 3) Jugendspieler (Jugend › Mannschaften)
if (want('jugend')) try {
  await nav('Jugend', 'Mannschaften');
  await page.locator('.dtable tbody tr.clickable').first().click();
  await page.waitForTimeout(400);
  await shoot('jugend'); await close();
} catch (e) { errors.push('jugend: ' + e.message.split('\n')[0]); }

// 4) Fremder Spieler (Transfermarkt)
if (want('fremd')) try {
  await nav('Transfers', 'Transfermarkt');
  await page.locator('.dtable tbody tr.clickable, .dtable tbody tr').first().click();
  await page.waitForTimeout(400);
  if (await page.locator('.pp-modal').count()) { await shoot('fremd'); await close(); }
  else errors.push('fremd: kein Profil geöffnet');
} catch (e) { errors.push('fremd: ' + e.message.split('\n')[0]); }

console.log(errors.length ? errors.join('\n') : 'ok – keine Fehler');
await browser.close(); server.close();
