// Oberflächen-Stichprobe der Ausnahmetalente (Teil von npm run test:legends):
//  - Assistent: Schalter „Ausnahmetalente der Geschichte“ vorhanden und an (Screenshot).
//  - Spielstand mit einer Profi- und einer Jugend-Legende im eigenen Verein (tests/legends-prep.ts):
//    Profil (alle Reiter), Kader-Übersicht, Jugend – verdeckte Werte nie als Zahl, kein Hinweis „Legende“.
//   node tests/legends-ui.mjs [ordner]   (VIEW=1366x768; baut dist/ nicht selbst – vorher npm run build)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/legends';
await mkdir(outDir, { recursive: true });
if (!existsSync('dist/index.html')) spawnSync(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' });
const SAVE = 'test-output/legends-save.txt';
spawnSync(process.execPath, ['scripts/run-ts.mjs', 'tests/legends-prep.ts', SAVE], { stdio: 'inherit' });
const info = JSON.parse(await readFile(SAVE + '.json', 'utf8'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const HIDDEN = ['Konstanz', 'Nervenstärke', 'Verletzungsanfälligkeit', 'Entwicklungstempo', 'Trainingsfleiß'];
const errors = [];
/** Text prüfen: hinter einem verdeckten Wert keine Zahl; kein Hinweis auf Legenden. */
function checkText(where, text) {
  for (const h of HIDDEN) {
    for (const m of text.matchAll(new RegExp(`${h}[^\\n]{0,24}`, 'g'))) {
      if (/\d/.test(m[0].slice(h.length))) errors.push(`${where}: Zahl hinter „${h}“: ${m[0].replace(/\s+/g, ' ')}`);
    }
  }
  if (/legende|ausnahmetalent/i.test(text)) errors.push(`${where}: Hinweis auf Legenden im Text`);
}

for (const view of (process.env.VIEW ? [process.env.VIEW] : ['1920x1080', '1366x768'])) {
  const [vw, vh] = view.split('x').map(Number);
  const tag = vw;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  page.on('pageerror', (e) => errors.push(`${tag} JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);

  // 1) Assistent: Schalter
  try {
    await page.click('text=Neues Spiel');
    await page.waitForSelector('.ng-root');
    await page.fill('.ng-field input[placeholder*="Max"]', 'Test');
    await page.fill('.ng-field input[placeholder*="Mustermann"]', 'Tester');
    await page.click('.ng-foot button:has-text("Weiter")');
    await page.waitForSelector('.ng-modes');
    const t = page.locator('.ng-toggle:has-text("Ausnahmetalente der Geschichte")');
    if (!await t.count()) errors.push(`${tag}: Schalter fehlt im Assistenten`);
    else if (await t.getAttribute('aria-checked') !== 'true') errors.push(`${tag}: Schalter nicht standardmäßig an`);
    await page.screenshot({ path: `${outDir}/${tag}_assistent.png` });
  } catch (e) { errors.push(`${tag} Assistent: ${e.message.split('\n')[0]}`); }

  // 2) Spielstand laden
  const raw = await readFile(SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.bf-continue').count()) { await page.locator('.bf-continue').first().click(); await page.waitForTimeout(250); continue; }
    if (await page.locator('.bm-confirm, button:has-text("Budget bestätigen")').count()) { await page.locator('.bm-confirm, button:has-text("Budget bestätigen")').first().click(); await page.waitForTimeout(250); continue; }
    break;
  }
  await page.keyboard.press('Escape');
  const nav = async (main, sub) => {
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400); }
  };
  const profile = async (name, prefix, loc) => {
    await (loc ?? page.locator(`tr:has-text("${name}"), .rl-row:has-text("${name}"), [data-pid]:has-text("${name}")`).first()).click();
    await page.waitForSelector('.pp-modal', { timeout: 5000 });
    await page.waitForTimeout(300);
    const tabs = page.locator('.pp-modal .pp-tabs button');
    const n = await tabs.count();
    for (let i = 0; i < n; i++) {
      await tabs.nth(i).click(); await page.waitForTimeout(200);
      checkText(`${tag} ${prefix} Reiter ${i}`, await page.locator('.pp-modal').innerText());
      await page.screenshot({ path: `${outDir}/${tag}_${prefix}_${i}.png` });
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    if (await page.locator('.pp-modal').count()) { await page.locator('.pp-modal .pp2-close, .pp-modal .modal-close').first().click(); await page.waitForTimeout(200); }
  };
  try {
    await nav('Kader', 'Übersicht');
    checkText(`${tag} Kader`, await page.locator('.app-main').innerText());
    await page.screenshot({ path: `${outDir}/${tag}_kader.png` });
    await profile(info.pro, 'profi');
  } catch (e) { errors.push(`${tag} Profi: ${e.message.split('\n')[0]}`); }
  if (info.youth) try {
    await nav('Jugend', 'Mannschaften');
    checkText(`${tag} Jugend`, await page.locator('.app-main').innerText());
    await page.screenshot({ path: `${outDir}/${tag}_jugend.png` });
    const hit = page.locator(`text=${info.youth}`).filter({ visible: true }).first();
    if (await hit.count()) await profile(info.youth, 'jugend', hit);
    else errors.push(`${tag}: Jugend-Legende ${info.youth} nicht gefunden`);
  } catch (e) { errors.push(`${tag} Jugend: ${e.message.split('\n')[0]}`); }
  await browser.close();
}
server.close();
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Legenden-Oberfläche: keine verdeckten Zahlen, kein Hinweis auf Legenden (${info.pro}${info.youth ? `, ${info.youth}` : ''}). Screenshots: ${outDir}`);
