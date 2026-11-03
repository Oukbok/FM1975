// Feste Fenstergrößen (Wunsch Pascal): öffnet jedes erreichbare Fenster, misst den Rahmen
// (getBoundingClientRect), bedient Reiter/Auswahl/Häkchen/Regler/Hover und meldet jede
// Größen- oder Lageänderung > 1 px. Dazu Seiten-Boxen (DashBox) beim Bedienen.
//   npm run build && node tests/popup-size.mjs [ordner]      (npm run test:popups)
//   Spielstand: Vorlage „Test 3 Jahre“, anderer mit SAVE=…; nur eine Größe mit VIEW=1366x768
//   Nur einzelne Fenster: ONLY=profil,verein,…
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, probeWindow, closeAll, rectOf } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/popups';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const SAVE = process.env.SAVE || 'public/saves/test-3-jahre.txt';
const VIEWS = process.env.VIEW ? [process.env.VIEW] : ['1920x1080', '1366x768'];
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const browser = await chromium.launch();
const results = [];
const report = (r) => {
  const b = r.base && typeof r.base === 'object' ? `${r.base.w}×${r.base.h}` : r.base ?? '-';
  const st = !r.issues.length ? 'fest' : r.issues[0].startsWith('nicht') ? r.issues[0] : 'WÄCHST';
  console.log(`${r.view} ${r.name.padEnd(30)} ${String(b).padEnd(12)} ${st}`);
  if (st === 'WÄCHST') for (const i of r.issues.slice(0, 6)) console.log('    ' + i);
};
const errors = [];

for (const view of VIEWS) {
  const [W, H] = view.split('x').map(Number);
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  page.on('pageerror', (e) => errors.push(`${view} JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await loadSave(page, url(), SAVE);
  await closeAll(page);

  const nav = async (main, sub) => {
    await closeAll(page);
    await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
    await page.waitForTimeout(250);
    if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400); }
  };
  const click = (sel, o) => page.locator(sel).first().click({ timeout: 3000, ...o });

  /** [kürzel, Rahmen, Öffnen, Optionen] */
  const CASES = [
    ['profil', '.pp2', async () => { await nav('Kader', 'Übersicht'); await page.locator('.app-main tbody tr[data-pid]').nth(3).click(); }],
    ['profil-fremd', '.pp2', async () => { await nav('Transfers', 'Transfermarkt'); await page.locator('.app-main tr[data-pid], .app-main .rl-row[data-pid]').nth(2).click(); }],
    ['kontextmenue', '.pcm', async () => { await nav('Kader', 'Übersicht'); await page.locator('.app-main tbody tr[data-pid]').nth(3).click({ button: 'right' }); }, { max: 0 }],
    ['verein', '.cmx-modal', async () => { await nav('Statistiken', 'Liga'); await page.locator('.app-main .club-link').nth(2).click(); }],
    ['gespraech', '.ptk-book', async () => { await nav('Kader', 'Übersicht'); await page.locator('.app-main tbody tr .ptk-open').nth(2).click(); }],
    ['verhandlung', '.modal', async () => {
      await nav('Transfers', 'Transfermarkt');
      await page.locator('.app-main tr[data-pid], .app-main .rl-row[data-pid]').nth(2).click({ button: 'right' });
      await page.locator('.pcm-item:has-text("Verhandl"), .pcm-item:has-text("Transfer")').first().click();
    }],
    ['spielersuche', '.ps-panel', async () => { await nav('Transfers', 'Transfermarkt'); await click('.dchip:has-text("Spieler suchen")'); }],
    ['transferbilanz', '.tw-panel', async () => { await nav('Transfers', 'Transfermarkt'); await click('.dchip:has-text("Transferbilanz")'); }],
    ['budget', '.bud-modal', async () => { await nav('Finanzen', 'Budget'); await click('.dchip:has-text("Budget anpassen")'); }],
    ['briefing', '.si-window', async () => { await nav('Zentrale', 'Briefing'); await click('button:has-text("Briefing öffnen")'); }],
    ['chronik', '.chm-modal', async () => { await closeAll(page); await click('.dashx-foot-link'); }],
    ['gala', '.gb-root', async () => { await nav('Statistiken', 'Auszeichnungen'); await page.locator('.app-main button.rl-row[title*="Gala"]').first().click(); }, { max: 0 }],
    ['auslosung', '.dr-root', async () => { await nav('Statistiken', 'Pokal'); await click('.app-main .dchip:has-text("Auslosung")'); await page.waitForTimeout(600); }],
    ['trainingslager', '.cp-modal', async () => { await nav('Kader', 'Trainingslager').catch(() => nav('Training', 'Trainingslager')); await click('button:has-text("Trainingslager planen")'); }],
    ['sponsor-karte', '.sp3-card', async () => { await nav('Finanzen', 'Sponsoring'); await page.locator('.app-main [data-deal], .app-main .sp3-logo, .app-main .sp3-slot').first().click(); }],
    ['spielbericht', '.mr-modal', async () => { await nav('Spieltag', 'Spielplan'); await page.locator('.app-main tr.clickable, .app-main .rl-row.clickable').first().click(); }],
    ['presse-artikel', '.np-article', async () => { await nav('Zentrale', 'Presse'); await click('.np-lead, .np-teaser'); }],
    ['nachricht', '.modal', async () => { await nav('Zentrale', 'Nachrichten'); await page.locator('.app-main tr.clickable, .app-main .rl-row, .app-main .news-item').first().click(); }],
    ['einstellungen', '.modal', async () => { await closeAll(page); await click('.hd-gear, button[aria-label*="Menü"], .hd-menu-btn'); await click('.menu-dd-item:has-text("Einstellungen")'); }],
    ['speichern', '.modal', async () => { await closeAll(page); await click('.hd-gear, button[aria-label*="Menü"], .hd-menu-btn'); await click('.menu-dd-item:has-text("Speichern")'); }],
    ['vereinseditor', '.ce-modal', async () => { await closeAll(page); await click('.hd-gear, button[aria-label*="Menü"], .hd-menu-btn'); await click('.menu-dd-item:has-text("Verein")'); }],
    ['trainerteam', '.tt-modal', async () => { await nav('Training', 'Trainerteam'); await page.locator('.app-main .clickable, .app-main tr.clickable, .app-main .rl-row').first().click(); }],
    ['stadion-block', '.sv-pop', async () => { await nav('Verein', 'Stadion'); await page.locator('.app-main .sb-block, .app-main [data-block]').nth(1).click(); }],
    ['vorschau', '.pm-root', async () => { await closeAll(page); if (await page.locator('.hd-continue.pm-next').count()) await click('.hd-continue.pm-next'); }, { max: 12 }],
  ];

  for (const [name, frame, open, opts] of CASES) {
    if (ONLY && !ONLY.includes(name)) continue;
    let res;
    try {
      res = await probeWindow(page, name, frame, open, opts ?? {});
      if (res.base) await page.screenshot({ path: `${outDir}/${view}_${name}.png` });
    } catch (e) { res = { name, base: null, issues: ['nicht geöffnet: ' + e.message.split('\n')[0]] }; }
    results.push({ view, ...res });
    report({ view, ...res });
    await closeAll(page);
  }

  // Seiten-Boxen: Chips/Reiter in DashBoxen dürfen die Box nicht wachsen lassen.
  const PAGES = [['Kader', 'Übersicht'], ['Kader', 'Kabine'], ['Finanzen', 'Budget'], ['Finanzen', 'Sponsoring'], ['Statistiken', 'Liga'], ['Statistiken', 'Pokal'],
    ['Transfers', 'Transfermarkt'], ['Training', 'Trainingsplan'], ['Jugend', 'Jugendwettbewerbe'], ['Verein', 'Kartenverkauf'], ['Finanzen', 'Fanartikel'], ['Verein', 'Erfolge']];
  if (!ONLY || ONLY.includes('seiten')) for (const [m, s] of PAGES) {
    const issues = [];
    try {
      await nav(m, s);
      const boxes = () => page.evaluate(() => [...document.querySelectorAll('.app-main .dbox')].map((b) => { const r = b.getBoundingClientRect(); return `${Math.round(r.width)}×${Math.round(r.height)}`; }).join(' '));
      const base = await boxes();
      const chips = page.locator('.app-main .dbox .dchip, .app-main .dbox .tab, .app-main .dbox .seg-btn, .app-main .dbox input[type=checkbox]');
      const n = Math.min(await chips.count(), 14);
      for (let i = 0; i < n; i++) {
        const c = chips.nth(i);
        const txt = (await c.innerText().catch(() => '')).trim().slice(0, 24);
        if (/anpassen|suchen|bilanz|planen|auslosung|öffnen/i.test(txt)) continue;
        await c.click({ timeout: 1200 }).catch(() => {});
        await page.waitForTimeout(150);
        if (await page.locator('.modal-overlay, .pcm-layer, .dr-root').count()) { await closeAll(page); continue; }
        const now = await boxes();
        if (now !== base) issues.push(`„${txt}“: Boxen ${base} → ${now}`);
      }
    } catch (e) { issues.push('nicht erreichbar: ' + e.message.split('\n')[0]); }
    results.push({ view, name: `seite ${m} › ${s}`, base: 'Boxen', issues });
    report(results[results.length - 1]);
  }
  await page.close();
}

let bad = 0;
for (const r of results) if (r.issues.length && !r.issues[0].startsWith('nicht')) bad++;
console.log('\nNicht geöffnet: ' + (results.filter((r) => r.issues[0]?.startsWith('nicht')).map((r) => r.view + ' ' + r.name).join(', ') || 'keine'));
for (const e of errors.slice(0, 10)) console.log(e);
console.log(`\n${bad} Fenster/Seiten mit Größenänderung, ${errors.length} JS-Fehler. Screenshots: ${outDir}/`);
await browser.close();
server.close();
process.exit(bad || errors.length ? 1 : 0);
