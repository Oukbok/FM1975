// Seiten-Check (Wunsch Pascal: „jede Seite ansehen und auf alle Fehler prüfen“, Prüfliste
// docs/pruefliste.md, Punkte A). Öffnet in mehreren Spielständen jede Seite aus MENU_STRUCTURE
// samt drittem Menü und die wichtigsten Fenster bei 1920×1080, 1366×768 und 1280×800
// (Steam Deck), prüft sie automatisch (tests/audit-checks.mjs), legt Screenshots nach
// test-output/audit/<auflösung>/<stand>/ und schreibt den Bericht docs/research/audit-bericht.md.
//   npm run test:audit
//   SAVES=neu,liga1-2025 VIEWS=1366x768 ONLY=Kader SHOTS=0 POPUPS=0 node tests/audit.mjs
//   REPORT=pfad.md (Standard docs/research/audit-bericht.md, REPORT=0 = keiner)
// Stände: neu = neues Spiel 1975; Dateinamen aus public/saves/ (ohne .txt); sim20 = 20 Saisons
// (`DUMP=… node scripts/sim.mjs 20`, wird bei Bedarf erzeugt). Schwere Funde → Exit 1.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serveDist, closeAll as closeWindows } from './popup-probe.mjs';
import { startNewGame } from './newgame-flow.mjs';
import { pageChecks, tokenColors, scanColors, KINDS } from './audit-checks.mjs';
import { writeReport } from './audit-report.mjs';

const OUT = process.env.AUDIT_OUT || 'test-output/audit';
const SIM20 = 'test-output/audit-saves/sim-20.txt';
const SAVES = (process.env.SAVES || 'neu,sim20,liga1-2025,england-1992,ddr-1980').split(',');
const VIEWS = (process.env.VIEWS || '1920x1080,1366x768,1280x800').split(',').map((v) => { const [w, h] = v.split('x').map(Number); return { w, h, tag: v }; });
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY, 'i') : null;
const SHOTS = process.env.SHOTS !== '0';
const POPUPS = process.env.POPUPS !== '0';
const MIN_FONT = 11;

const saveFile = async (name) => {
  if (name === 'neu') return null;
  if (name === 'sim20') {
    try { await access(SIM20); } catch {
      console.log('Erzeuge Stand nach 20 Saisons …');
      await mkdir('test-output/audit-saves', { recursive: true });
      spawnSync(process.execPath, ['scripts/sim.mjs', '20'], { env: { ...process.env, DUMP: SIM20 }, stdio: 'ignore' });
    }
    return SIM20;
  }
  return `public/saves/${name}.txt`;
};

/** Fenster schließen – auch die Vorschau „Nächstes Spiel“ (Spieltag im Stand) und das Briefing. */
async function closeAll(page) {
  for (let k = 0; k < 4; k++) {
    const pm = await page.locator('.pm-root, .bf-modal, .bud-modal').first().isVisible().catch(() => false);
    if (!pm) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const bf = page.locator('.bf-continue, .bud-confirm').first();
    if (await bf.isVisible().catch(() => false)) await bf.click({ timeout: 1000 }).catch(() => {});
  }
  await closeWindows(page);
}

const { server, url } = serveDist();
const browser = await chromium.launch();
const findings = []; // { save, view, where, k, d }
const stats = { pages: 0, popups: 0, shots: 0 };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

async function session(saveName, view) {
  const ctx = await browser.newContext({ viewport: { width: view.w, height: view.h } });
  const page = await ctx.newPage();
  const here = { where: 'Start' };
  const add = (k, d) => findings.push({ save: saveName, view: view.tag, where: here.where, k, d });
  page.on('pageerror', (e) => add('js', e.message.split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_FAILED|net::/.test(m.text())) add('js', 'Konsole: ' + m.text().slice(0, 140)); });
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon|fonts\./.test(r.url())) add('net', `${r.status()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 90)}`); });
  await page.addInitScript(() => {
    let a = 1975;
    Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const file = await saveFile(saveName);
  await page.goto(url());
  if (file) {
    const raw = await (await import('node:fs/promises')).readFile(file, 'utf8');
    await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
    await page.reload();
    await page.click('text=Spiel laden');
    await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
    await page.waitForSelector('.app-main', { timeout: 20000 });
    await page.waitForTimeout(1200);
  } else {
    await startNewGame(page);
    await page.waitForTimeout(800);
  }
  await closeAll(page);
  const tokens = await page.evaluate(tokenColors);
  const dir = `${OUT}/${view.tag}/${saveName}`;
  await mkdir(dir, { recursive: true });

  const settle = async () => {
    await page.waitForFunction(() => !document.querySelector('.lazy-overlay, .lazy-page'), null, { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(350);
  };
  const check = async (where, file) => {
    here.where = where;
    const r = await page.evaluate(pageChecks, { minFont: view.w < 1600 ? MIN_FONT : 0, tokens }).catch((e) => ({ out: [{ k: 'js', d: 'Prüfung: ' + e.message.split('\n')[0] }] }));
    for (const f of r.out) add(f.k, f.d);
    if (SHOTS && file) { await page.screenshot({ path: `${dir}/${file}.png` }); stats.shots++; }
  };

  // ---- Alle Seiten samt drittem Menü
  const mains = await page.locator('.hd-nav-item').count();
  for (let m = 0; m < mains; m++) {
    const mainLbl = (await page.locator('.hd-nav-item').nth(m).innerText()).trim();
    await page.locator('.hd-nav-item').nth(m).click();
    await settle();
    const subs = await page.locator('.tn-sub-item').count();
    for (let s = 0; s < subs; s++) {
      const item = page.locator('.tn-sub-item').nth(s);
      const subLbl = (await item.innerText()).trim();
      const label = `${mainLbl} › ${subLbl}`;
      if (ONLY && !ONLY.test(label)) continue;
      here.where = label;
      await item.click().catch(() => add('nav', 'Menüpunkt nicht klickbar'));
      await settle();
      await closeAll(page).catch(() => {});
      const base = `${m}${String(s).padStart(2, '0')}`;
      await check(label, `${base}_${slug(label)}`);
      stats.pages++;
      const tabs = await page.locator('.app-main .sub3-tabs .tab').count();
      for (let t = 1; t < tabs; t++) {
        const tab = page.locator('.app-main .sub3-tabs .tab').nth(t);
        const tl = (await tab.innerText().catch(() => '?')).trim().split('\n')[0];
        await tab.click().catch(() => add('nav', `Reiter ${tl} nicht klickbar`));
        await settle();
        await check(`${label} › ${tl}`, `${base}_${t}_${slug(label + '_' + tl)}`);
        stats.pages++;
      }
      if (tabs > 1) await page.locator('.app-main .sub3-tabs .tab').first().click().catch(() => {});
    }
  }

  // ---- Fenster
  if (POPUPS) {
    const goto = async (main, sub) => {
      await closeAll(page);
      await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
      await page.waitForTimeout(200);
      await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
      await settle();
    };
    const popup = async (label, main, sub, open, frame, tabSel) => {
      if (ONLY && !ONLY.test(label)) return;
      here.where = label;
      try {
        await goto(main, sub);
        const opened = await open();
        if (opened === 'skip') return;
        if (!opened) { add('nav', 'Auslöser nicht gefunden'); return; }
        const ok = await page.waitForSelector(frame, { timeout: 6000 }).then(() => true).catch(() => false);
        if (!ok) { add('nav', `Fenster ${frame} öffnet nicht`); return; }
        await settle();
        await check(label, `p_${slug(label)}`);
        stats.popups++;
        const tabs = tabSel ? await page.locator(tabSel).count() : 0;
        for (let t = 1; t < tabs; t++) {
          const tab = page.locator(tabSel).nth(t);
          const tl = (await tab.innerText().catch(() => '?')).trim().split('\n')[0];
          await tab.click().catch(() => {});
          await settle();
          await check(`${label} › ${tl}`, `p_${slug(label)}_${t}_${slug(tl)}`);
          stats.popups++;
        }
        // Escape schließt das Fenster
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        if (await page.locator(frame).count() && await page.locator(frame).first().isVisible().catch(() => false)) add('nav', 'Escape schließt das Fenster nicht');
      } catch (e) { add('nav', 'Fehler: ' + e.message.split('\n')[0].slice(0, 120)); }
      await closeAll(page).catch(() => {});
    };
    const click = (sel) => async () => { const l = page.locator(sel).first(); if (!(await l.count())) return false; await l.click(); return true; };
    await popup('Spielerprofil', 'Kader', 'Übersicht', click('.app-main tbody tr[data-pid]'), '.modal', '.modal .pp-tabs .tab, .modal [role="tab"]');
    await popup('Vereinsprofil', 'Statistiken', 'Liga', click('.app-main .club-link >> nth=3'), '.cmx-modal', '.cmx-modal .cmx-tabs .tab');
    // Ohne Europapokal-Teilnehmer auf der Seite (z. B. DDR-Stand) gibt es keinen Auslöser – kein Fehler.
    await popup('Vereinsprofil Ausland', 'Statistiken', 'International', async () => (await click('.app-main .club-link >> nth=-1')()) || 'skip', '.cmx-modal', null);
    await popup('Länderprofil', 'Statistiken', 'Nationalteams', click('.app-main .cflag[data-country]'), '.cnx-modal', '.cnx-modal .cmx-tabs .tab');
    await popup('Spieler-Infokarte', 'Aufstellung', 'Aufstellung', async () => {
      const b = page.locator('.lu-row .pc-ibtn').nth(3);
      if (!(await b.count())) return false;
      await b.hover(); await page.waitForTimeout(450); return true;
    }, '.pc-float', null);
    await popup('Verhandlungstisch Verlängerung', 'Kader', 'Verträge', async () => {
      const pid = await page.locator('.app-main tbody tr[data-pid]').nth(2).getAttribute('data-pid').catch(() => null);
      if (!pid) return false;
      await page.evaluate((id) => window.dispatchEvent(new CustomEvent('fm:contract-screen', { detail: { kind: 'renew', pid: id } })), pid);
      return true;
    }, '.vt-root', null);
    await popup('Verhandlungstisch Transfer', 'Transfers', 'Transfermarkt', async () => {
      const rows = page.locator('.app-main tr[data-pid]');
      for (let i = 1; i < Math.min(8, await rows.count()); i++) {
        await rows.nth(i).click({ button: 'right' });
        const it = page.locator('.pcm-item:has-text("Transferverhandlung")').first();
        if (await it.count()) { await it.click(); return true; }
        await page.keyboard.press('Escape');
      }
      return false;
    }, '.vt-root', null);
    await popup('Chronik', 'Zentrale', 'Zentrale', click('.dashx-foot-link'), '.modal', null);
  }
  await ctx.close();
}

const t0 = Date.now();
for (const view of VIEWS) {
  for (const s of SAVES) {
    const t1 = Date.now();
    try { await session(s, view); } catch (e) { findings.push({ save: s, view: view.tag, where: 'Ablauf', k: 'nav', d: e.message.split('\n')[0].slice(0, 160) }); }
    console.log(`${view.tag} ${s}: ${Math.round((Date.now() - t1) / 1000)} s, bisher ${findings.length} Funde`);
  }
}
const colors = await scanColors();
await browser.close();
server.close();

await mkdir(OUT, { recursive: true });
await writeFile(`${OUT}/findings.json`, JSON.stringify({ stats, findings, colors }, null, 1));
const reportPath = process.env.REPORT ?? 'docs/research/audit-bericht.md';
// BEFORE=findings.json eines früheren Laufs (z. B. DIST=alter Build) → Tabelle vorher/nachher im Bericht.
let before;
if (process.env.BEFORE) {
  const { readFile } = await import('node:fs/promises');
  before = JSON.parse(await readFile(process.env.BEFORE, 'utf8'));
}
if (reportPath !== '0') await writeReport(reportPath, { stats, findings, colors, saves: SAVES, views: VIEWS.map((v) => v.tag), secs: Math.round((Date.now() - t0) / 1000), before });
const hard = findings.filter((f) => KINDS[f.k]?.hard);
console.log(`Seiten ${stats.pages}, Fenster ${stats.popups}, Screenshots ${stats.shots}, Funde ${findings.length} (schwer ${hard.length})`);
for (const f of hard.slice(0, 40)) console.log(`  [${f.k}] ${f.view} ${f.save} ${f.where}: ${f.d}`);
process.exit(hard.length ? 1 : 0);
