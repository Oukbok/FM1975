// Prüfung „Vereine und Länder überall klickbar“ (Wunsch Pascal): öffnet jede Seite samt Reitern
// (drittes Menü), sammelt Vereinsnamen (aus allen Vereinslinks/Wappen) und Ländernamen
// (data/countryFlags.ts) und meldet Textstellen, die weder Link noch klickbare Zeile sind:
//   - Vereinsname ohne <ClubLink>/data-club (Text gleich einem bekannten Vereinsnamen),
//   - Wappen mit Name daneben, dessen Name nicht klickbar ist,
//   - Ländername ohne Flagge mit data-country in derselben Zeile.
//   npm run build && node tests/link-audit.mjs [ordner]   (SAVE=…, Standard Vorlage Test 20 Jahre)
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serveDist, loadSave, closeAll } from './popup-probe.mjs';

const outDir = process.argv[2] || 'test-output/links';
await mkdir(outDir, { recursive: true });
const SAVE = process.env.SAVE || 'public/saves/test-20-jahre.txt';
const flagsSrc = await readFile('src/data/countryFlags.ts', 'utf8');
const COUNTRIES = [...flagsSrc.matchAll(/\bname: '([^']+)'/g)].map((m) => m[1]);

const { server, url } = serveDist();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`JS-Fehler: ${e.message}`));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await loadSave(page, url(), SAVE);
await closeAll(page);

const names = new Set();
const findings = new Map();

async function audit(where) {
  const r = await page.evaluate(({ countries, known }) => {
    const CLICK = '.club-link, .player-link, .txt-link, button, a, [role="button"], [role="tab"], [role="option"], .clickable, [data-club], input, label, select, .sel3';
    const mods = [...document.querySelectorAll('.modal')].filter((m) => m.getBoundingClientRect().width > 0);
    const root = mods[mods.length - 1] ?? document.querySelector('.app-main') ?? document.body;
    const vis = (el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const found = new Set();
    const out = [];
    for (const l of root.querySelectorAll('.club-link')) { const t = l.textContent.trim(); if (t && t.length < 40) found.add(t); }
    const knownSet = new Set([...known, ...found]);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const rowOf = (el) => el.closest('tr, li, .rl-row, .dxt-row, [class*="row"], [class*="line"], .kv, .dkv') ?? el.parentElement;
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim();
      if (!t || t.length > 60) continue;
      const el = n.parentElement;
      if (!el || !vis(el) || el.closest('svg, .cflag, .dbox-head, h1, h2, h3, .mx-sub, .itip-pop')) continue;
      if (el.closest(CLICK)) continue;
      const desc = (k) => `${k}: „${t}“ in <${el.tagName.toLowerCase()} class="${el.className}"> (${(rowOf(el)?.className || '').toString().slice(0, 60)})`;
      if (knownSet.has(t)) out.push(desc('Verein'));
      else {
        // Vereinsname mitten im Text („· von Bochum ·“): ganze Wörter, mindestens 6 Zeichen.
        const hit = [...knownSet].find((k) => k.length >= 6 && new RegExp(`(^|[\\s·(,])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s·),:])`).test(t));
        if (hit) out.push(desc(`Verein im Text ${hit}`));
      }
      const c = countries.find((x) => t === x || t.startsWith(x + ' ') || t.endsWith(' ' + x) || t.includes(' ' + x + ' ') || t.startsWith(x + ',') || t.includes('· ' + x));
      if (c) {
        const row = rowOf(el);
        if (!row?.querySelector('[data-country]') && !el.closest('[data-country]')) out.push(desc(`Land ${c}`));
      }
    }
    // Wappen mit Namen daneben: Name sollte klickbar sein.
    for (const cr of root.querySelectorAll('[data-club]')) {
      if (!vis(cr) || cr.closest('.club-link, button, a, [role="button"], .clickable, [data-dnd]')) continue;
      const sib = cr.nextElementSibling;
      const t = sib?.textContent?.trim();
      if (sib && t && t.length < 40 && !sib.closest(CLICK) && !sib.querySelector('.club-link, .txt-link')) out.push(`Wappen+Name: „${t}“ (<${sib.tagName.toLowerCase()} class="${sib.className}">)`);
    }
    return { out, found: [...found] };
  }, { countries: COUNTRIES, known: [...names] });
  r.found.forEach((n) => names.add(n));
  if (r.out.length) findings.set(where, [...new Set(r.out)]);
}

async function sweep(pass) {
  const mains = await page.locator('.hd-nav-item').count();
  for (let m = 0; m < mains; m++) {
    await page.locator('.hd-nav-item').nth(m).click();
    await page.waitForTimeout(200);
    const subs = await page.locator('.tn-sub-item').count();
    for (let s = 0; s < subs; s++) {
      const item = page.locator('.tn-sub-item').nth(s);
      const label = `${(await page.locator('.hd-nav-item').nth(m).innerText()).trim()} › ${(await item.innerText()).trim()}`;
      await item.click();
      await page.waitForTimeout(300);
      await closeAll(page).catch(() => {});
      await audit(label);
      const tabs = await page.locator('.sub3-tabs .tab').count();
      for (let t = 1; t < tabs; t++) {
        const tab = page.locator('.sub3-tabs .tab').nth(t);
        const tl = (await tab.innerText()).trim().split('\n')[0];
        await tab.click().catch(() => {});
        await page.waitForTimeout(300);
        await audit(`${label} › ${tl}`);
      }
      if (tabs > 1) await page.locator('.sub3-tabs .tab').first().click().catch(() => {});
    }
  }
  if (pass === 1) findings.clear();
}

async function goto(main, sub) {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(200);
  await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click();
  await page.waitForTimeout(400);
}

/** Fenster über einen Link öffnen und alle Reiter prüfen. */
async function popup(label, main, sub, linkSel, modalSel, tabSel) {
  await closeAll(page);
  await goto(main, sub);
  const l = page.locator(linkSel).first();
  if (!(await l.count())) { errors.push(`${label}: kein Link ${linkSel}`); return; }
  await l.click();
  await page.waitForSelector(modalSel, { timeout: 5000 }).catch(() => errors.push(`${label}: Fenster öffnet nicht`));
  await page.waitForTimeout(400);
  await audit(label);
  const tabs = await page.locator(tabSel).count();
  for (let t = 1; t < tabs; t++) {
    const tab = page.locator(tabSel).nth(t);
    const tl = (await tab.innerText()).trim();
    await tab.click().catch(() => {});
    await page.waitForTimeout(350);
    await audit(`${label} › ${tl}`);
  }
  await closeAll(page);
}

// Erster Durchlauf sammelt Vereinsnamen, zweiter meldet.
await sweep(1);
await sweep(2);
await popup('Vereinsprofil', 'Statistiken', 'Liga', '.app-main .club-link', '.cmx-modal', '.cmx-modal .cmx-tabs .tab');
await popup('Vereinsprofil Ausland', 'Statistiken', 'International', '.app-main .club-link >> nth=-1', '.cmx-modal', '.cmx-modal .cmx-tabs .tab');
await popup('Spielerprofil', 'Kader', 'Übersicht', '.app-main tbody tr[data-pid]', '.modal', '.modal .pp-tabs .tab, .modal [role="tab"]');
await popup('Länderprofil', 'Statistiken', 'Nationalteams', '.app-main .cflag[data-country]', '.cnx-modal', '.cnx-modal .cmx-tabs .tab');

const lines = [];
for (const [k, v] of findings) { lines.push(`## ${k}`); v.forEach((x) => lines.push(`  ${x}`)); }
await writeFile(`${outDir}/bericht.txt`, lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log(`\n${findings.size} Seiten mit Funden, ${names.size} Vereinsnamen bekannt.`);
if (errors.length) { console.log(errors.join('\n')); process.exitCode = 1; }
await browser.close();
server.close();
