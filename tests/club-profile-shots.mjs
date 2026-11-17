// Screenshots des Vereinsprofils (alle Reiter, Gegner / Sim-Verein / eigener Verein)
// und Prüfung auf waagerechten Überlauf in den Boxen.
//   npm run build && node tests/club-profile-shots.mjs [ausgabeordner]
//   Mit Historie: DUMP=test-output/club/save.txt node scripts/sim.mjs 6
//                 SAVE=test-output/club/save.txt node tests/club-profile-shots.mjs
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';
import { pickOption, optionsOf, valueOf } from './select3.mjs';
import lz from 'lz-string';

const outDir = process.argv[2] || 'test-output/club';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
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
const prefix = process.env.SAVE ? 'save' : 'neu';
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
} else {
  await startNewGame(page);
  await page.waitForTimeout(800);
}
// Begrüßungs-/Ereignisfenster schließen
for (let k = 0; k < 6 && await page.locator('.modal-overlay').count(); k++) {
  const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK")').first();
  if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
  await page.waitForTimeout(300);
}

/** Waagerechter Überlauf / abgeschnittene Boxen im offenen Profil. */
async function overflowReport() {
  return page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll('.cmx-modal .dbox')) {
      const body = b.querySelector('.dbox-body');
      const title = b.querySelector('.dxh-title')?.textContent;
      if (body && body.scrollWidth > body.clientWidth + 2) out.push(`${title}: waagerechter Überlauf ${body.scrollWidth - body.clientWidth}px`);
      if (body && !body.textContent.trim() && !body.querySelector('svg')) out.push(`${title}: leer`);
    }
    return out;
  });
}

async function shootProfile(tag) {
  const tabs = ['Übersicht', 'Kader', 'Jugend', 'Verein', 'Transfers', 'Historie'];
  for (let i = 0; i < tabs.length; i++) {
    await page.locator('.cmx-tabs .tab', { hasText: new RegExp(`^${tabs[i]}$`) }).click();
    await page.waitForTimeout(250);
    const file = `${outDir}/${prefix}_${tag}_${i + 1}_${tabs[i].replace(/[^A-Za-z]/g, '')}.png`;
    await page.screenshot({ path: file });
    const rep = await overflowReport();
    console.log(`${tag} / ${tabs[i]}: ${rep.length ? rep.join('; ') : 'ok'}`);
  }
}
const closeProfile = async () => { await page.locator('.cmx-modal > .mx-head > .modal-close').click(); await page.waitForTimeout(250); };

// 1) Gegner aus der Tabelle
await page.locator('.hd-nav-item:has-text("Statistiken")').click();
await page.waitForTimeout(250);
await page.locator('.tn-sub-item:has-text("Liga")').first().click();
await page.waitForTimeout(300);
// Tabellenzeilen sind nicht mehr klickbar – der Vereinsname ist der Link (ClubLink).
await page.locator('.cmp-table tbody tr:not(.me) .club-link').first().click();
await page.waitForSelector('.cmx-modal');
await shootProfile('gegner');

// Reiter „Jugend“: fremde Jugend meist „?“, Scouten legt einen Auftrag an
let scoutedName = null;
{
  await page.locator('.cmx-tabs .tab', { hasText: /^Jugend$/ }).click();
  await page.waitForTimeout(250);
  const rows = page.locator('.cmx-youth tbody tr');
  const n = await rows.count();
  const unk = await page.locator('.cmx-youth tbody .cmx-unk').count();
  const pids = await rows.evaluateAll((xs) => xs.filter((x) => !x.getAttribute('data-pid')).length);
  console.log(`Gegner / Jugend: ${n} Jugendspieler, ${unk} unbekannte Werte („?“)${pids ? `, ${pids} Zeilen ohne data-pid` : ''}`);
  if (!n) errors.push('Gegner / Jugend: keine Jugendspieler');
  if (pids) errors.push('Gegner / Jugend: Zeilen ohne data-pid');
  const btn = page.locator('.cmx-youth tbody button:has-text("Scouten")').first();
  if (await btn.count()) {
    const row = btn.locator('xpath=ancestor::tr');
    const pid = await row.getAttribute('data-pid');
    scoutedName = (await row.locator('.mk-pname').textContent())?.trim();
    const box = await page.locator('.cmx-modal').boundingBox();
    await btn.click();
    await page.waitForTimeout(250);
    const after = await page.locator(`.cmx-youth tbody tr[data-pid="${pid}"] button`).textContent().catch(() => '');
    const box2 = await page.locator('.cmx-modal').boundingBox();
    if (box && box2 && (Math.abs(box.width - box2.width) > 1 || Math.abs(box.height - box2.height) > 1)) errors.push('Jugend: Fenstergröße hat sich beim Scouten geändert');
    console.log(`Jugend / Scouten: ${scoutedName} → ${after?.trim()} · ${(await page.locator('.cmx-ymsg').textContent().catch(() => ''))}`);
    await page.screenshot({ path: `${outDir}/${prefix}_gegner_jugend_scout.png` });
  } else console.log('Jugend / Scouten: kein Knopf frei');
}

// Spielerprofil aus dem Kader + zurück über den Vereinsnamen
await page.locator('.cmx-tabs .tab').nth(1).click();
{
  const nums = await page.locator('.cmx-modal .dtable tbody tr td:first-child').allTextContents();
  if (nums.some((t) => !/^[1-9][0-9]?$/.test(t.trim())) || new Set(nums).size !== nums.length) errors.push(`Gegner: Rückennummern fehlen/doppelt (${nums.join(',')})`);
  else console.log(`Gegner / Kader: ${nums.length} Rückennummern eindeutig (${nums.join(' ')})`);
}
await page.locator('.cmx-modal .dtable tbody tr').first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${prefix}_gegner_5_Spielerprofil.png` });
await page.locator('.pp2-club .club-link').click();
await page.waitForTimeout(300);
console.log('Spielerprofil → Verein:', (await page.locator('.pp-modal').count()) === 0 ? 'ok (Spielerprofil geschlossen)' : 'Spielerprofil noch offen');
await closeProfile();

// 2) Sim-Verein (andere Liga)
const sel = page.locator('.cmp-select .sel3').nth(1);
const opts = (await sel.count()) ? (await optionsOf(page, sel)).length : 0;
if (opts > 1) {
  await pickOption(page, sel, { index: 1 });
  await page.waitForTimeout(300);
  await page.locator('.cmp-table tbody .club-link').first().click();
  await page.waitForSelector('.cmx-modal');
  await shootProfile('simverein');
  await closeProfile();
  await pickOption(page, sel, { index: 0 });
  await page.waitForTimeout(200);
}

// 2b) Auslandsverein (Weltspieler, Rückennummern): Mailand Rot-Schwarz bzw. der erste Auslandsverein des Spielstands
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  const g = JSON.parse(raw.startsWith('LZ1:') ? lz.decompressFromUTF16(raw.slice(4)) : raw).game;
  const eu = Object.values(g.euroClubs ?? {});
  const foreign = (eu.find((e) => e.id === 'w_esp-barcelona') ?? eu.find((e) => /Mailand Rot/.test(e.name)) ?? eu[0])?.id;
  if (foreign) {
    await page.evaluate((id) => { const d = document.createElement('div'); d.setAttribute('data-club', id); document.body.appendChild(d); d.click(); d.remove(); }, foreign);
    await page.waitForSelector('.cmx-modal');
    await page.locator('.cmx-tabs .tab').nth(1).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/${prefix}_ausland_2_Kader.png` });
    const nums = await page.locator('.cmx-modal .dtable tbody tr td:first-child').allTextContents();
    const bad = nums.filter((t) => !/^[1-9][0-9]?$/.test(t.trim()));
    console.log(`Auslandsverein ${foreign} / Kader: ${nums.length} Spieler, ${bad.length ? `ohne/ungültige Nummer: ${bad.length}` : 'alle mit Rückennummer'}`);
    if (bad.length || new Set(nums).size !== nums.length) errors.push(`Auslandsverein: Rückennummern fehlen/doppelt (${nums.join(',')})`);
    // Wie deutsche Vereine (Wunsch Pascal): Platz/Ansehen im Kopf, Transfers je Saison, komplette Historie
    for (const [i, name, label] of [[1, 'Uebersicht', 'Übersicht'], [4, 'Transfers', 'Transfers'], [5, 'Historie', 'Historie']]) {
      await page.locator('.cmx-tabs .tab', { hasText: label }).first().click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${outDir}/${prefix}_ausland_${i}_${name}.png` });
    }
    const kpis = await page.locator('.cmx-head .mx-kpis').innerText();
    console.log(`Auslandsverein Kopf: ${kpis.replace(/\s+/g, ' ')}`);
    if (/–\s*Ansehen/.test(kpis)) errors.push('Auslandsverein: kein Ansehen im Kopf');
    await page.locator('.cmx-tabs .tab', { hasText: 'Transfers' }).first().click();
    await page.waitForTimeout(200);
    const rows = await page.locator('.cmx-modal .ctr-table tbody tr').count();
    // eine Saison zurück: dort sind Sommer und Winter vollständig
    await page.locator('.ctr-bar button').first().click();
    await page.waitForTimeout(300);
    const prev = await page.locator('.cmx-modal .ctr-table tbody tr').count();
    await page.screenshot({ path: `${outDir}/${prefix}_ausland_4b_Transfers_Vorsaison.png` });
    console.log(`Auslandsverein Transfers: laufende Saison ${rows}, Vorsaison ${prev} Zeilen`);
    await closeProfile();
  }
}

// 3) Eigener Verein
await page.locator('.cmp-table tbody tr.me .club-link').first().click();
await page.waitForSelector('.cmx-modal');
await shootProfile('eigener');
{
  await page.locator('.cmx-tabs .tab', { hasText: /^Jugend$/ }).click();
  await page.waitForTimeout(200);
  const unk = await page.locator('.cmx-youth tbody .cmx-unk').count();
  console.log(`Eigener Verein / Jugend: ${await page.locator('.cmx-youth tbody tr').count()} Spieler, ${unk} „?“`);
  if (unk) errors.push('Eigener Verein / Jugend: eigene Jugendspieler unbekannt');
}
await closeProfile();

// 3b) Gescouteter Jugendspieler erscheint unter Transfers › Scouting
if (scoutedName) {
  await page.locator('.hd-nav-item:has-text("Transfers")').click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Scouting")').first().click();
  await page.waitForTimeout(400);
  const seen = await page.locator('.app-main', { hasText: scoutedName }).count();
  console.log(`Transfers › Scouting: ${scoutedName} ${seen ? 'gefunden' : 'FEHLT'}`);
  if (!seen) errors.push(`Transfers › Scouting: ${scoutedName} fehlt`);
  await page.screenshot({ path: `${outDir}/${prefix}_scouting_jugend.png` });
  await page.locator('.hd-nav-item:has-text("Statistiken")').click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Liga")').first().click();
  await page.waitForTimeout(300);
}

// 4) Aufruf aus der Zentrale (Tabelle) und dem Spielplan
await page.locator('.hd-nav-item').first().click();
await page.waitForTimeout(300);
const zLink = page.locator('.dxt-row, .dash3-left .club-link, [data-club]').nth(1);
if (await zLink.count()) {
  await zLink.click();
  await page.waitForTimeout(300);
  const ok = (await page.locator('.cmx-modal').count()) > 0;
  console.log('Zentrale → Profil:', ok ? 'ok' : 'FEHLT');
  if (ok) await closeProfile();
}
await page.locator('.hd-nav-item:has-text("Aufstellung")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Spielplan")').first().click();
await page.waitForTimeout(300);
const link = page.locator('.dtable .club-link').first();
if (await link.count()) {
  await link.click();
  await page.waitForTimeout(300);
  console.log('Spielplan → Profil:', (await page.locator('.cmx-modal').count()) ? 'ok' : 'FEHLT');
  await page.screenshot({ path: `${outDir}/${prefix}_spielplan.png` });
}

console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
