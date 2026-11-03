// Durchgang „wie ein Spieler“: eine Saison (oder mehr) nur über die Oberfläche spielen –
// Weiter-Knopf, Vorschau → Simulieren, Spielbericht schließen, jedes Fenster mit dem
// kleinsten nötigen Klick bestätigen. Protokolliert die Fensterfolge mit Datum, zählt
// Pflicht-Klicks je Fenster, meldet übereinanderliegende Fenster, tote Klicks
// (Weiter ohne Fortschritt) und neue Nachrichten je Halt (Doppelungen Nachricht/Popup).
// Fenstergrößen werden beim ersten Auftreten mit popup-probe gemessen (PROBE=0 aus).
//   npm run build && node tests/season-walk.mjs [ordner]
//   Neues Spiel 1975 (Standard) oder SAVE=public/saves/test-3-jahre.txt; UNTIL=JJJJ-MM-TT (Standard: nach dem
//   nächsten Saisonwechsel bis zum ersten Ligaspiel + 14 Tage), SPEED=Millisekunden je Tag (Standard 300).
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, probeWindow, openWindows } from './popup-probe.mjs';
import { startNewGame, skipIntro } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/walk';
await mkdir(outDir, { recursive: true });
const { server, url } = serveDist();
const [W, H] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const PROBE = process.env.PROBE !== '0';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
// Für den Durchgang wie ein echter Spieler: Erstes Training zeigen, Weiter-Sperre bei Entscheidungen an.
await page.addInitScript((rep) => {
  window.__FM_PROMISES__ = true;
  try {
    localStorage.setItem('fmTestMail', '1');
    // REPORT=pokal|nie: Einstellung „Spielbericht nach dem Simulieren“ (Vergleich der Pflicht-Klicks)
    if (rep) { const s = JSON.parse(localStorage.getItem('fm1980_settings') || '{}'); s.matchReport = rep; localStorage.setItem('fm1980_settings', JSON.stringify(s)); }
  } catch { /* egal */ }
}, process.env.REPORT || '');
if (process.env.SAVE) await loadSave(page, url(), process.env.SAVE);
else { await page.goto(url()); await startNewGame(page, { keepBriefing: true, speed: process.env.SPEED || '300' }); }

const dateNow = () => page.evaluate(() => (document.querySelector('.tn-date, .tn-right, .topnav-date')?.textContent || '').trim()).catch(() => '');
const seasonNow = () => page.evaluate(() => (document.querySelector('.dashx-foot-c')?.textContent || '').replace('SAISON', '').trim()).catch(() => '');
const startSeason = await seasonNow();
const log = [];          // { date, what, clicks }
const clicks = {};       // Fensterart → Pflicht-Klicks
const seen = {};         // Fensterart → Anzahl
const sizes = [];        // Messungen
const stacked = [];
let total = 0;
const tap = (kind, n = 1) => { clicks[kind] = (clicks[kind] ?? 0) + n; total += n; };
const progress = `${outDir}/verlauf.txt`;
await writeFile(progress, '');
const note = async (what, extra = '') => { const d = await dateNow(); const l = `${d.padEnd(28)} ${what}${extra ? ' – ' + extra : ''}`; log.push(l); appendFile(progress, l + '\n').catch(() => {}); seen[what] = (seen[what] ?? 0) + 1; };
const shotOnce = async (kind) => { if (seen[kind] === 1) await page.screenshot({ path: `${outDir}/${String(Object.keys(seen).length).padStart(2, '0')}_${kind}.png` }).catch(() => {}); };
const probeOnce = async (kind, sel) => {
  if (!PROBE || seen[kind] !== 1) return;
  const r = await probeWindow(page, kind, sel, null, { max: 16, settle: 200, safe: true });
  sizes.push(r);
};
// Neue Nachrichten (Betreff) zwischen zwei Halten – aus dem Newscenter, wenn die Zentrale offen ist.
let lastSubjects = new Set();
const newsDelta = async () => {
  const subs = await page.evaluate(() => [...document.querySelectorAll('.dz-msg .dz-nsubj span')].map((e) => e.textContent.trim())).catch(() => []);
  const fresh = subs.filter((s) => !lastSubjects.has(s));
  lastSubjects = new Set(subs);
  return fresh;
};

let stopAt = process.env.UNTIL || null;
let seasonChanged = false;
let afterChange = 0;
let idle = 0;
const t0 = Date.now();
for (let step = 0; step < 4000; step++) {
  if (Date.now() - t0 > (Number(process.env.MAXMIN) || 25) * 60000) { log.push('ABBRUCH: Zeitlimit'); break; }
  const wins = await openWindows(page);
  if (wins.length > 1) { const d = await dateNow(); stacked.push(`${d}: ${wins.join(' + ')}`); }
  const has = async (sel) => (await page.locator(sel).count()) > 0 && await page.locator(sel).first().isVisible().catch(() => false);
  const act = async (kind, sel, clickSel, opt = {}) => {
    await note(kind, opt.info);
    await shotOnce(kind);
    await probeOnce(kind, sel);
    for (let k = 0; k < (opt.repeat ?? 1); k++) {
      const b = page.locator(clickSel).first();
      if (!(await b.isVisible().catch(() => false))) break;
      await b.click({ timeout: 3000 }).catch(() => {});
      tap(kind);
      await page.waitForTimeout(opt.wait ?? 350);
      if (!(await has(sel))) break;
    }
  };
  try {
    if (await has('.si-stage')) { await note('Briefing-Auftakt'); await skipIntro(page); tap('Briefing-Auftakt'); continue; }
    if (await has('.bf-modal')) { await act('Briefing', '.si-window', '.bf-modal .bf-continue'); continue; }
    if (await has('.bud-modal')) { await act('Budget', '.bud-modal', '.bud-modal .bud-confirm'); continue; }
    if (await has('.ft-modal')) { await act('Erstes Training', '.ft-modal', '.ft-modal button:has-text("Ohne Versprechen")'); continue; }
    if (await has('.dr-root')) {
      const rnd = await page.locator('.dr-root').getAttribute('aria-label').catch(() => '');
      await note('Auslosung', rnd); await shotOnce('Auslosung');
      await page.keyboard.press('Escape'); tap('Auslosung'); await page.waitForTimeout(500);
      if (await has('.dr-root')) { await page.locator('.dr-root .ms-btn:has-text("Schließen")').first().click().catch(() => page.keyboard.press('Escape')); tap('Auslosung'); }
      await page.waitForTimeout(400); continue;
    }
    if (await has('.rb2-overlay')) {
      await note('Bewertungsrunde', await page.locator('.rb2-overlay').getAttribute('aria-label').catch(() => ''));
      await shotOnce('Bewertungsrunde'); await probeOnce('Bewertungsrunde', '.rb2-panel');
      for (let k = 0; k < 40 && await has('.rb2-overlay'); k++) {
        const ok = page.locator('.rb2-overlay .rb2-ok').first();
        const lbl = (await ok.innerText().catch(() => '')).trim();
        if (lbl === 'OK') { await ok.click(); tap('Bewertungsrunde'); break; }
        // Spieler einzeln weiterklicken? Erst „Bis zum Ende springen“ (Esc), sonst „Spieler vor“.
        const skip = page.locator('.rb2-overlay button:has-text("Bis zum Ende")');
        if (await skip.count()) await skip.first().click(); else await ok.click();
        tap('Bewertungsrunde'); await page.waitForTimeout(500);
      }
      await page.waitForTimeout(300); continue;
    }
    if (await has('.gb-root')) { await act('Goldener Ball', '.gb-root', '.gb-root .btn-primary', { repeat: 20, wait: 500 }); continue; }
    if (await has('.aw-modal')) { await act('Die Besten der Saison', '.aw-modal', '.aw-modal .aw-foot .btn-primary'); continue; }
    if (await has('.tw-panel')) { await act('Transferbilanz', '.tw-panel', '.tw-foot button:has-text("OK"), .tw-foot .btn-primary'); continue; }
    if (await has('.cr-root')) { await note('Trainingslager-Bilanz'); await shotOnce('Trainingslager-Bilanz'); for (let k = 0; k < 4 && await has('.cr-root'); k++) { await page.locator('.cr-root').click({ position: { x: 20, y: 20 } }); tap('Trainingslager-Bilanz'); await page.waitForTimeout(500); } continue; }
    if (await has('.pm-root')) { await act('Vorschau Nächstes Spiel', '.pm-root', '.pm-go-btn:has-text("Simulieren")', { wait: 700 }); continue; }
    if (await has('.mr-modal')) { await act('Spielbericht', '.mr-modal', '.mr-modal .modal-close'); continue; }
    if (await has('.reveal-overlay')) {
      await note('Bewertung (Liste)'); await shotOnce('Bewertung (Liste)');
      const sk = page.locator('.reveal-overlay button:has-text("Überspringen"), .reveal-overlay button:has-text("Alle")').first();
      if (await sk.isVisible().catch(() => false)) { await sk.click(); tap('Bewertung (Liste)'); await page.waitForTimeout(300); }
      const x = page.locator('.reveal-overlay .reveal-close, .reveal-overlay button:has-text("Weiter"), .reveal-overlay button:has-text("Schließen")').first();
      if (await x.isVisible().catch(() => false)) { await x.click(); tap('Bewertung (Liste)'); } else { await page.locator('.reveal-overlay button').last().click().catch(() => {}); tap('Bewertung (Liste)'); }
      await page.waitForTimeout(300); continue;
    }
    if (await has('.modal-overlay')) { const w = await openWindows(page); await note('Sonstiges Fenster', w.join(', ')); await page.keyboard.press('Escape'); tap('Sonstiges'); await page.waitForTimeout(300); continue; }

    // Kein Fenster: Kopfknopf
    const fresh = await newsDelta();
    if (fresh.length) log.push(`${''.padEnd(28)}   neue Nachrichten: ${fresh.slice(0, 8).join(' | ')}`);
    if (await has('.hd-continue.mail')) {
      await note('Weiter gesperrt (Entscheidung)'); await shotOnce('Weiter gesperrt (Entscheidung)');
      await page.locator('.hd-continue.mail').click(); tap('Entscheidung'); await page.waitForTimeout(400);
      // Nachricht mit offener Entscheidung suchen und erste Option wählen
      let done = false;
      const rows = page.locator('.dz-msg');
      const n = Math.min(await rows.count(), 30);
      for (let i = 0; i < n && !done; i++) {
        await rows.nth(i).click(); await page.waitForTimeout(150);
        const c = page.locator('.dz-read .dchip.on');
        if (await c.count()) { const t = await page.locator('.dz-rsubj').innerText().catch(() => ''); await c.first().click(); tap('Entscheidung', 2); log.push(`${''.padEnd(28)}   entschieden: ${t} (Zeile ${i + 1})`); done = true; }
      }
      if (!done) { log.push('   TOTER KLICK: Nachrichten-Knopf ohne auffindbare Entscheidung'); idle++; }
      continue;
    }
    if (await has('.hd-continue.pm-next')) { await note('Vorschau wieder geöffnet'); await page.locator('.hd-continue.pm-next').click(); tap('Vorschau Nächstes Spiel'); await page.waitForTimeout(400); continue; }
    if (await has('.hd-match-btns')) { await page.locator('.hd-match-btns .hd-continue').first().click(); tap('Spiel'); await page.waitForTimeout(600); continue; }
    if (await has('.hd-continue.season')) {
      await note('Saisonende → Neue Saison'); await page.locator('.hd-continue.season').click(); tap('Neue Saison');
      seasonChanged = true; await page.waitForTimeout(1500); continue;
    }
    // Ziel erreicht?
    const d = await dateNow();
    if (stopAt && d && d.includes(stopAt)) break;
    if (seasonChanged && (await seasonNow()) !== startSeason) { afterChange++; if (!stopAt && afterChange > 6) break; }
    // Weiter
    const before = d;
    await page.locator('.hd-continue').first().click(); tap('Weiter');
    // warten, bis die Zeit wieder steht (Pause/Fenster)
    for (let k = 0; k < 600; k++) {
      await page.waitForTimeout(250);
      const running = await page.locator('.hd-continue.running').count();
      if (!running) break;
    }
    const after = await dateNow();
    if (after === before && !(await openWindows(page)).length && !(await has('.hd-continue.pm-next')) && !(await has('.hd-continue.mail')) && !(await has('.hd-continue.season'))) {
      idle++; log.push(`${after.padEnd(28)} TOTER KLICK? Weiter ohne Fortschritt`);
      if (idle > 5) { log.push('ABBRUCH: hängt'); break; }
    } else idle = 0;
  } catch (e) { log.push('Fehler: ' + e.message.split('\n')[0]); idle++; if (idle > 8) break; }
}

const lines = [];
lines.push(`Durchgang ${process.env.SAVE ? 'Spielstand ' + process.env.SAVE : 'Neues Spiel 1975'} – Start Saison ${startSeason}, Ende ${await dateNow()} (${Math.round((Date.now() - t0) / 1000)} s)`);
lines.push('', 'FENSTERFOLGE:', ...log);
lines.push('', 'PFLICHT-KLICKS je Art:', ...Object.entries(clicks).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${k.padEnd(28)} ${v}`), `  SUMME ${total}`);
lines.push('', 'ÜBEREINANDER:', ...(stacked.length ? [...new Set(stacked)].slice(0, 30) : ['  keine']));
lines.push('', 'FENSTERGRÖSSEN (erstes Auftreten):', ...sizes.map((r) => `  ${r.name.padEnd(26)} ${r.base ? r.base.w + '×' + r.base.h : '-'} ${r.issues.length ? 'WÄCHST: ' + r.issues.slice(0, 3).join(' ; ') : 'fest'}`));
lines.push('', 'JS-FEHLER:', ...(errors.length ? errors.slice(0, 10) : ['  keine']));
const txt = lines.join('\n');
await writeFile(`${outDir}/bericht.txt`, txt);
console.log(txt);
await browser.close();
server.close();
