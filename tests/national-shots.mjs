// Screenshots Nationaltrainer (Wunsch Pascal): Assistent mit „Zusätzlich Nationaltrainer“,
// Kopfleiste (Land ausgegraut / Hover / aktiv), beide Sichten (Verein, Nationalteam), Seite
// Nationalteam (Übersicht, Aufgebot mit Vorschlag, Spiele & Turniere, Rücktritt-Dialog),
// Statistiken › Nationalteams. Prüft: Seite scrollt nicht, Boxen laufen nicht über, JS-Fehler.
//   npm run build && node scripts/run-ts.mjs tests/national-prep.ts test-output/national/nt-sep.txt
//   node tests/national-shots.mjs [ordner]   (VIEW=1366x768 für eine Größe, SAVE=…)
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/national';
await mkdir(out, { recursive: true });
const SAVE = process.env.SAVE || 'test-output/national/nt-sep.txt';
const VIEWS = process.env.VIEW ? [process.env.VIEW] : ['1920x1080', '1366x768'];
const { server, url } = serveDist();
const browser = await chromium.launch();
const errors = [];

async function checkLayout(page, label) {
  const bad = await page.evaluate(() => {
    const out = [];
    const main = document.querySelector('.app-main');
    if (main && main.scrollHeight > main.clientHeight + 2) out.push(`Seite scrollt (${main.scrollHeight} > ${main.clientHeight})`);
    for (const b of document.querySelectorAll('.app-main .dbox-body, .dz-w')) {
      if (b.scrollWidth > b.clientWidth + 2) out.push(`Box läuft seitlich über: ${b.closest('.dbox, .dz-w')?.querySelector('.dxh-title, .dz-wt')?.textContent ?? '?'}`);
    }
    for (const sel of ['.hd-bar', '.hd-nav']) { const hd = document.querySelector(sel); if (hd && hd.scrollWidth > hd.clientWidth + 2) out.push(`Kopfleiste läuft über (${sel} ${hd.scrollWidth} > ${hd.clientWidth})`); }
    return out;
  });
  for (const b of bad) errors.push(`${label}: ${b}`);
}
const shot = async (page, name, label) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}.png` }); await checkLayout(page, label ?? name); };
const sub = (page, t) => page.locator(`.tn-sub-item:has-text("${t}")`).first().click();
const cat = (page, t) => page.locator(`.hd-nav-item:has-text("${t}")`).first().click();
const tab = (page, t) => page.locator(`.sub3-tabs .tab:has-text("${t}")`).first().click();

for (const view of VIEWS) {
  const [W, H] = view.split('x').map(Number);
  // 1) Assistent + Spielstart
  {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    page.on('pageerror', (e) => errors.push(`${view} JS-Fehler: ${e.message}`));
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    await page.goto(url());
    await startNewGame(page, { national: 'NED', shots: async (n) => { if (n === '2_spielmodus') await page.screenshot({ path: `${out}/${W}_assistent.png` }); } });
    await page.waitForTimeout(800);
    await closeAll(page);
    if (!(await page.locator('.hd-nat').count())) errors.push(`${view}: Kopfleiste ohne Land nach Spielstart mit Nationalteam`);
    await shot(page, `${W}_start_verein`);
    await page.locator('.hd-nat').hover();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/${W}_kopf_hover.png`, clip: { x: 0, y: 0, width: W, height: 110 } });
    await page.locator('.hd-nat').click();
    await shot(page, `${W}_start_nationalteam`);
    await cat(page, 'Zentrale');
    await shot(page, `${W}_start_zentrale_nt`);
    await page.close();
  }
  // 2) Stand mit offenem Aufgebot
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => errors.push(`${view} JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await loadSave(page, url(), SAVE);
  await closeAll(page);
  await shot(page, `${W}_verein_zentrale`);
  await page.screenshot({ path: `${out}/${W}_kopf_verein.png`, clip: { x: 0, y: 0, width: W, height: 110 } });
  await cat(page, 'Statistiken'); await sub(page, 'Nationalteams');
  await shot(page, `${W}_verein_nationalteams`);
  await page.locator('.hd-nat').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${W}_kopf_national.png`, clip: { x: 0, y: 0, width: W, height: 110 } });
  await shot(page, `${W}_nt_uebersicht`);
  await tab(page, 'Aufgebot');
  await shot(page, `${W}_nt_aufgebot`);
  await page.locator('.ntj-table tbody tr .ntj-check:not(.xi)').nth(3).click();
  await page.locator('.ntj-table tbody tr:not(.ntj-in) .ntj-check:not(.xi)').first().click();
  await shot(page, `${W}_nt_aufgebot_geaendert`);
  await page.locator('.ntj-form .sel3, .ntj-form button').first().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${W}_nt_formation.png` });
  await page.keyboard.press('Escape');
  await tab(page, 'Spiele');
  await shot(page, `${W}_nt_spiele`);
  await tab(page, 'Übersicht');
  await page.locator('button:has-text("Zurücktreten")').first().click();
  await shot(page, `${W}_nt_ruecktritt`);
  const r = await page.evaluate(() => { const e = document.querySelector('.ntj-confirm'); const b = e?.getBoundingClientRect(); return b ? [Math.round(b.width), Math.round(b.height), e.scrollHeight > e.clientHeight + 1] : null; });
  if (!r || r[2]) errors.push(`${view}: Rücktritt-Dialog fehlt oder Inhalt läuft über (${r})`);
  await page.locator('.ntj-confirm button:has-text("Abbrechen")').click();
  await cat(page, 'Zentrale');
  await shot(page, `${W}_nt_zentrale`);
  await cat(page, 'Statistiken');
  await shot(page, `${W}_nt_statistiken`);
  await cat(page, 'Beobachten');
  await shot(page, `${W}_nt_spielerpool`);
  await page.locator('.hd-switch.hd-club').click();
  await page.waitForTimeout(400);
  if (await page.locator('.hd-nav-item:has-text("Finanzen")').count() === 0) errors.push(`${view}: Zurückschalten auf den Verein zeigt nicht das Vereinsmenü`);
  await shot(page, `${W}_zurueck_verein`);
  await cat(page, 'Zentrale'); await sub(page, 'Kalender');
  await shot(page, `${W}_verein_kalender`);
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Nationaltrainer-Screenshots: keine Fehler.');
