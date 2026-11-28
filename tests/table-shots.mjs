// Screenshots und Messwerte der wichtigsten Tabellen (Regel docs/research/table-rules.md).
//   node tests/table-shots.mjs [ordner]            Screenshots nach <ordner>/<auflösung>/<nn-name>.png
//   DIST=alter-build node tests/table-shots.mjs vorher   (für vorher/nachher, Montage: tests/table-montage.py)
//   VIEWS=1280x800,1920x1080 SAVE=liga1-2025 ONLY=kader MEASURE=1 (Breiten je Tabelle auf die Konsole)
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';
import { startNewGame } from './newgame-flow.mjs';

const OUT = process.argv[2] || 'test-output/table-shots';
const SAVE = process.env.SAVE || 'liga1-2025';
const VIEWS = (process.env.VIEWS || '1280x800').split(',').map((v) => { const [w, h] = v.split('x').map(Number); return { w, h, tag: v }; });
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY, 'i') : null;
const MEASURE = process.env.MEASURE === '1';

const clubTab = (name) => async (p) => { await p.locator('.app-main .club-link >> nth=3').click(); await p.waitForSelector('.cmx-modal'); await p.locator(`.cmx-modal .cmx-tabs .tab:has-text("${name}")`).first().click(); };
const countryTab = (name) => async (p) => { await p.locator('.app-main .cflag[data-country]').first().click(); await p.waitForSelector('.cnx-modal'); await p.locator(`.cnx-modal .cmx-tabs .tab:has-text("${name}")`).first().click(); };

/** Ziel: Menü › Unterpunkt, optional Reiter (Text) und ein Fenster (open). */
const TARGETS = [
  { id: '01-aufstellung-kaderliste', nav: ['Aufstellung', 'Aufstellung'] },
  { id: '02-kader-uebersicht', nav: ['Kader', 'Kader'] },
  { id: '03-kader-kabine', nav: ['Kader', 'Kabine'] },
  { id: '04-kader-vertraege', nav: ['Kader', 'Verträge'] },
  { id: '05-finanzen-budget', nav: ['Finanzen', 'Budget'] },
  { id: '06-transfers-beobachtung', nav: ['Transfermarkt', 'Beobachtung'] },
  { id: '07-transfers-transfermarkt', nav: ['Transfermarkt', 'Transfermarkt'] },
  { id: '08-verein-mitarbeiter-markt', nav: ['Verein', 'Mitarbeiter'] },
  { id: '09-verein-kartenverkauf', nav: ['Verein', 'Kartenverkauf'] },
  { id: '10-jugend-2-mannschaft', nav: ['Jugend', '2. Mannschaft'] },
  { id: '11-vereinsprofil-kader', nav: ['Statistiken', 'Liga'], open: clubTab('Kader') },
  { id: '12-laenderprofil-nationalkader', nav: ['Statistiken', 'Nationalteams'], open: countryTab('Nationalkader') },
  { id: '13-spieler-infokarte', nav: ['Aufstellung', 'Aufstellung'], open: async (p) => { await p.locator('.lu-row .pc-ibtn').nth(3).hover(); await p.waitForSelector('.pc-float'); } },
  { id: '14-verein-erfolge-vitrine', nav: ['Verein', 'Erfolge'] },
  { id: '15-statistiken-liga', nav: ['Statistiken', 'Liga'] },
  { id: '16-vereinsprofil-jugend', nav: ['Statistiken', 'Liga'], open: clubTab('Jugend') },
  { id: '17-vereinsprofil-transfers', nav: ['Statistiken', 'Liga'], open: clubTab('Transfers') },
  { id: '18-laenderprofil-laenderspiele', nav: ['Statistiken', 'Nationalteams'], open: countryTab('Länderspiele') },
  { id: '19-zentrale', nav: ['Zentrale', 'Zentrale'] },
  { id: '20-chronik', nav: ['Zentrale', 'Zentrale'], open: async (p) => { await p.locator('.dashx-foot-link').first().click(); await p.waitForSelector('.modal'); } },
  { id: '21-statistiken-ligensystem', nav: ['Statistiken', 'Ligensystem'] },
  { id: '22-statistiken-international', nav: ['Statistiken', 'International'] },
  { id: '23-jugendwettbewerbe', nav: ['Jugend', 'Jugendwettbewerbe'] },
  { id: '24-finanzen-sponsoring', nav: ['Finanzen', 'Sponsoring'] },
  { id: '25-verhandlungstisch', nav: ['Kader', 'Verträge'], open: async (p) => { const pid = await p.locator('.app-main tbody tr[data-pid]').nth(2).getAttribute('data-pid'); await p.evaluate((id) => window.dispatchEvent(new CustomEvent('fm:contract-screen', { detail: { kind: 'renew', pid: id } })), pid); await p.waitForSelector('.vt-root'); } },
  { id: '26-transfers-verhandlungen', nav: ['Transfermarkt', 'Verhandlungen'] },
  { id: '27-training-trainerteam', nav: ['Training', 'Trainerteam'] },
];

/** Wer scrollt waagerecht – und welches innerste Kind ragt hinaus? (WHY=1) */
function why() {
  const out = [];
  for (const el of document.querySelectorAll('.app-shell *, .modal *, .display-content > * *')) {
    if (el instanceof SVGElement) continue;
    const s = getComputedStyle(el);
    if (!el.clientWidth || el.scrollWidth <= el.clientWidth + 3) continue;
    if (s.textOverflow === 'ellipsis' || s.overflowX === 'visible') continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const k = r.width / el.offsetWidth;
    const kids = [...el.querySelectorAll('*')].filter((c) => { const cr = c.getBoundingClientRect(); return cr.width > 0 && cr.right > r.right + 2 && ![...c.children].some((x) => x.getBoundingClientRect().right > r.right + 2); });
    if (!kids.length) { const lim = r.left + (el.clientLeft + el.clientWidth) * k + 0.5; for (const c of el.querySelectorAll('*')) { const cr = c.getBoundingClientRect(); if (cr.width > 0 && cr.right > lim && ![...c.children].some((x) => x.getBoundingClientRect().right > lim)) kids.push(c); } }
    out.push(`${s.overflowX} ${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} ${el.scrollWidth}>${el.clientWidth} ← ${kids.slice(0, 3).map((c) => `${c.tagName.toLowerCase()}.${String(c.className).split(' ').slice(0, 2).join('.')} „${c.textContent.trim().slice(0, 24)}“ +${Math.round((c.getBoundingClientRect().right - r.right) / k)}`).join(' | ')}`);
  }
  return out;
}

/** Jede Tabelle der Ansicht: Breite gegen den Rahmen, Spaltenköpfe. */
function measure() {
  const out = [];
  for (const t of document.querySelectorAll('table')) {
    if (!t.offsetWidth) continue;
    let box = t.parentElement;
    while (box && getComputedStyle(box).overflowX === 'visible') box = box.parentElement;
    const heads = [...(t.tHead?.rows[0]?.cells ?? [])].filter((c) => c.offsetWidth).map((c) => `${c.textContent.trim() || '·'}:${c.offsetWidth}`);
    out.push(`${t.className.split(' ').slice(0, 3).join('.')} ${t.offsetWidth}/${box?.clientWidth ?? '?'}${box && box.scrollWidth > box.clientWidth + 2 ? ' SCROLLT' : ''}${t.dataset.fit ? ` fit=${t.dataset.fit}` : ''}${t.dataset.drop ? ` drop=${t.dataset.drop}` : ''}${t.dataset.dbg ? ` dbg=${t.dataset.dbg}` : ''} | ${heads.join(' ')}`);
  }
  return out;
}

const { server, url } = serveDist();
const browser = await chromium.launch();
for (const view of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: view.w, height: view.h } });
  const page = await ctx.newPage();
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (SAVE === 'neu') { await page.goto(url()); await startNewGame(page); } else await loadSave(page, url(), `public/saves/${SAVE}.txt`);
  await page.waitForSelector('.app-main', { timeout: 20000 });
  await page.waitForTimeout(800);
  const dir = `${OUT}/${view.tag}`;
  await mkdir(dir, { recursive: true });
  const report = [];
  for (const t of TARGETS) {
    if (ONLY && !ONLY.test(t.id)) continue;
    try {
      for (let k = 0; k < 3; k++) { await page.keyboard.press('Escape'); await page.waitForTimeout(120); }
      await closeAll(page).catch(() => {});
      await page.locator(`.hd-nav-item:has-text("${t.nav[0]}")`).first().click();
      await page.waitForTimeout(200);
      await page.locator(`.tn-sub-item:has-text("${t.nav[1]}")`).first().click();
      await page.waitForFunction(() => !document.querySelector('.lazy-overlay, .lazy-page'), null, { timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(500);
      if (t.open) { await t.open(page); await page.waitForTimeout(700); }
      await page.screenshot({ path: `${dir}/${t.id}.png` });
      const m = await page.evaluate(measure);
      report.push({ id: t.id, tables: m });
      if (process.env.WHY === '1') for (const l of await page.evaluate(why)) console.log(`  WHY ${t.id}: ${l}`);
      if (MEASURE) { console.log(`\n== ${view.tag} ${t.id}`); for (const l of m) console.log('  ' + l); }
    } catch (e) { console.log(`${view.tag} ${t.id}: ${e.message.split('\n')[0]}`); }
  }
  await writeFile(`${dir}/tables.json`, JSON.stringify(report, null, 1));
  await ctx.close();
  console.log(`${view.tag}: ${report.length} Ansichten → ${dir}`);
}
await browser.close();
server.close();
