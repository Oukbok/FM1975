// Oberflächentest Aufstellung/Taktik (Spieltag › Aufstellung):
//   Liste → Feld ziehen, Tausch auf dem Feld, Formation wechseln, Position einrasten
//   und frei verschieben, Bank, Auto, Kapitän/Standards; danach prüft er im Textmodus,
//   dass das nächste Spiel genau diese Aufstellung verwendet.
//   Screenshots je Spielstand in 1920×1080 und 1366×768.
//   node tests/lineup-ui.mjs [ausgabeordner]      (SAVES=pfad1,pfad2 → zusätzliche Spielstände, z. B. 1976 und 2010)
// Voraussetzung: npm run build
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, basename } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/lineup';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? 'ok  ' : 'FEHL'} ${msg}`); };

async function openPage(vp) {
  const page = await browser.newPage({ viewport: vp });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url);
  return page;
}
async function loadSave(page, file) {
  const raw = await readFile(file, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const bf = page.locator('.bf-modal .bf-continue');
  if (await bf.isVisible().catch(() => false)) await bf.click();
}
async function goto(page, sub) {
  await page.locator('.hd-nav-item:has-text("Spieltag")').click();
  await page.waitForTimeout(200);
  await page.locator(`.tn-sub-item:has-text("${sub}")`).click();
  await page.waitForTimeout(400);
}
const center = async (loc) => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
async function fieldPoint(page, px, py) {
  const b = await page.locator('.lu-field').boundingBox();
  return { x: b.x + (b.width * px) / 100, y: b.y + (b.height * py) / 100 };
}
async function drag(page, from, to, { hold } = {}) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 8, from.y + 8, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: 12 });
  if (hold) await hold();
  await page.mouse.up();
  await page.waitForTimeout(150);
}
const slot = (page, id) => page.locator(`.lu-slot[data-slot="${id}"]`);
const slotPid = (page, id) => slot(page, id).getAttribute('data-pid');
const slotPos = (page, id) => slot(page, id).locator('.lu-card-pos').innerText();

// ---------------------------------------------------------------- 1) Bedienung (neues Spiel 1975)
{
  const page = await openPage({ width: 1920, height: 1080 });
  await startNewGame(page);
  await page.waitForTimeout(800);
  await goto(page, 'Aufstellung');
  check(await page.locator('.lu-slot').count() === 11, '11 Positionsfelder auf dem Spielfeld');
  check((await page.locator('.lu-formation').inputValue()).startsWith('libero'), 'Startformation 1975 ist ein Libero-System');
  await page.screenshot({ path: `${outDir}/1975_start_1920.png` });

  // Liste → Feld: erster einsatzfähiger Reservespieler auf Slot s10
  const res = page.locator('tbody[data-lu-drop="reserve"] tr.lu-row:not(.out)').first();
  const resPid = await res.getAttribute('data-pid');
  await drag(page, await center(res), await center(slot(page, 's10')));
  check(await slotPid(page, 's10') === resPid, 'Reservespieler aus der Liste auf das Feld gezogen');

  // Tausch auf dem Feld: s3 ↔ s6
  const [a, b] = [await slotPid(page, 's3'), await slotPid(page, 's6')];
  await drag(page, await center(slot(page, 's3')), await center(slot(page, 's6')));
  check(await slotPid(page, 's3') === b && await slotPid(page, 's6') === a, 'Tausch zweier Spieler auf dem Feld');

  // Einrasten: s11 in die Mitte vor den Strafraum (→ OM), Zwischenbild mit hervorgehobenem Rasterpunkt
  const target = await fieldPoint(page, 52, 36);
  await drag(page, await center(slot(page, 's11')), target, { hold: async () => {
    check(await page.locator('.lu-gp.on').count() === 1, 'Einrast-Ziel wird beim Ziehen hervorgehoben');
    await page.screenshot({ path: `${outDir}/1975_einrasten_ziehen_1920.png` });
  } });
  check(await slotPos(page, 's11') === 'OM', `Eingerastet auf OM (ist ${await slotPos(page, 's11')})`);

  // Frei verschieben: Haken aus, s10 nach rechts vorne (→ nächster Punkt Rechtsaußen = RA)
  await page.locator('.lu-check input').uncheck();
  const free = await fieldPoint(page, 79, 31);
  await drag(page, await center(slot(page, 's10')), free, { hold: async () => {
    check(await page.locator('.lu-live-pos').count() === 1, 'Live-Anzeige der Position beim freien Ziehen');
    await page.screenshot({ path: `${outDir}/1975_frei_ziehen_1920.png` });
  } });
  const left = await slot(page, 's10').evaluate((el) => parseFloat(el.style.left));
  check(await slotPos(page, 's10') === 'RA' && Math.abs(left - 79) < 1.5, `Frei gesetzt bei x≈79 % als RA (ist ${await slotPos(page, 's10')}, x=${left})`);

  // Bank: Reservespieler auf Bankplatz 1
  const res2 = page.locator('tbody[data-lu-drop="reserve"] tr.lu-row:not(.out)').first();
  const res2Pid = await res2.getAttribute('data-pid');
  await drag(page, await center(res2), await center(page.locator('.lu-bslot[data-lu-drop="bench:0"]')));
  check(await page.locator('.lu-bslot[data-lu-drop="bench:0"]').getAttribute('data-pid') === res2Pid, 'Reservespieler auf die Bank gezogen');

  // ---- Drag & Drop auf Bank/Reserve (Wunsch Pascal)
  const bslot = (i) => page.locator(`.lu-bslot[data-lu-drop="bench:${i}"]`);
  const benchPids = () => page.locator('.lu-bslot').evaluateAll((els) => els.map((e) => e.getAttribute('data-pid')).filter(Boolean));
  const inReserve = async (pid) => await page.locator(`tbody[data-lu-drop="reserve"] tr.lu-row[data-pid="${pid}"]`).count() === 1;
  const benchHead = page.locator('.lu-bench .lu-bench-head');
  const reserveBox = page.locator('.lu-reserve-box');
  const benchSize = await page.locator('.lu-bslot').count();
  // Feld → Reserve: Platz wird frei
  const p7 = await slotPid(page, 's7');
  await drag(page, await center(slot(page, 's7')), await center(reserveBox), { hold: async () => {
    check(await page.locator('.lu-reserve.over').count() === 1, 'Reserve-Zone leuchtet beim Ziehen');
    check(await page.locator('.lu-ghost').count() === 1, 'Geister-Karte folgt dem Zeiger');
    await page.screenshot({ path: `${outDir}/1975_dnd_reserve_ziehen_1920.png` });
  } });
  check(!(await slotPid(page, 's7')) && await inReserve(p7), 'Feld → Reserve: Platz frei, Spieler in der Reserve');
  check((await page.locator('.lu-page').innerText()).includes('Aufstellung unvollständig (10/11)'), 'Hinweis „Aufstellung unvollständig“');
  // Bank voll: Ablage auf die Bank wird abgewiesen
  check((await benchPids()).length === benchSize, `Bank ist voll (${benchSize})`);
  const p8 = await slotPid(page, 's8');
  await drag(page, await center(slot(page, 's8')), await center(benchHead), { hold: async () => {
    check(await page.locator('.lu-bench.full').count() === 1 && await page.locator('.lu-ghost.no').count() === 1, 'Bank voll wird beim Ziehen rot angezeigt');
    await page.screenshot({ path: `${outDir}/1975_dnd_bank_voll_1920.png` });
  } });
  check(await slotPid(page, 's8') === p8 && await page.locator('.lu-zone-note').count() === 1, 'Bank voll: Spieler bleibt auf dem Feld, Hinweis erscheint');
  // Bank → Reserve
  const b0 = await bslot(0).getAttribute('data-pid');
  await drag(page, await center(bslot(0)), await center(reserveBox));
  check((await benchPids()).length === benchSize - 1 && await inReserve(b0), 'Bank → Reserve');
  // Feld → Bank: Platz frei, Spieler auf dem freien Bankplatz
  await drag(page, await center(slot(page, 's8')), await center(benchHead), { hold: () => page.screenshot({ path: `${outDir}/1975_dnd_bank_ziehen_1920.png` }) });
  check(!(await slotPid(page, 's8')) && (await benchPids()).includes(p8), 'Feld → Bank: Platz frei, Spieler auf der Bank');
  // Feld → Bankspieler: Tausch
  const [p6, b1] = [await slotPid(page, 's6'), await bslot(1).getAttribute('data-pid')];
  await drag(page, await center(slot(page, 's6')), await center(bslot(1)));
  check(await slotPid(page, 's6') === b1 && await bslot(1).getAttribute('data-pid') === p6, 'Feld → Bankspieler: Tausch');
  await page.screenshot({ path: `${outDir}/1975_dnd_zwei_frei_1920.png` });
  // Liste → freier Platz
  const r7 = page.locator('tbody[data-lu-drop="reserve"] tr.lu-row:not(.out)').first();
  const r7Pid = await r7.getAttribute('data-pid');
  await drag(page, await center(r7), await center(slot(page, 's7')));
  check(await slotPid(page, 's7') === r7Pid, 'Liste (Reserve) → freier Platz');
  // Bank-Zeile der Liste → freier Platz
  const lb = page.locator('tbody[data-lu-drop="bench:end"] tr.lu-row').first();
  const lbPid = await lb.getAttribute('data-pid');
  await drag(page, await center(lb), await center(slot(page, 's8')));
  check(await slotPid(page, 's8') === lbPid && !(await benchPids()).includes(lbPid), 'Liste (Bank) → freier Platz');
  // Liste (Startelf-Zeile) → Reserve-Abschnitt der Liste und zurück per Liste → Startelf-Abschnitt
  const x9 = await slotPid(page, 's9');
  await drag(page, await center(page.locator(`tr.lu-row[data-pid="${x9}"]`)), await center(page.locator('tbody[data-lu-drop="reserve"] .lu-sec-head')));
  check(!(await slotPid(page, 's9')) && await inReserve(x9), 'Liste: Startelf → Reserve-Abschnitt');
  await drag(page, await center(page.locator(`tr.lu-row[data-pid="${x9}"]`)), await center(page.locator('tbody[data-lu-drop="xi"] .lu-sec-head')));
  check(await slotPid(page, 's9') === x9, 'Liste: Reserve → Startelf-Abschnitt (freier Platz)');
  // Escape bricht ab
  const [e3, e4] = [await slotPid(page, 's3'), await slotPid(page, 's4')];
  await drag(page, await center(slot(page, 's3')), await center(slot(page, 's4')), { hold: async () => { await page.keyboard.press('Escape'); } });
  check(await slotPid(page, 's3') === e3 && await slotPid(page, 's4') === e4 && await page.locator('.lu-ghost').count() === 0, 'Escape bricht das Ziehen ab');

  // Kapitän + Elfmeter setzen
  const capSel = page.locator('select[data-role="captainId"]');
  const capVal = await capSel.locator('option').nth(3).getAttribute('value');
  await capSel.selectOption(capVal);
  const penSel = page.locator('select[data-role="penaltyTakerId"]');
  const penVal = await penSel.locator('option').nth(2).getAttribute('value');
  await penSel.selectOption(penVal);
  check(await page.locator(`.lu-slot[data-pid="${capVal}"] .lu-cap`).count() === 1, 'Kapitänsbinde auf der Karte');
  check(await penSel.inputValue() === penVal, 'Elfmeterschütze gesetzt');

  // Klick öffnet das Spielerprofil
  await slot(page, 's1').click();
  await page.waitForTimeout(300);
  check(await page.locator('.pp-modal').count() === 1, 'Klick auf Karte öffnet das Spielerprofil');
  await page.keyboard.press('Escape');
  if (await page.locator('.pp-modal').count()) await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } });
  await page.screenshot({ path: `${outDir}/1975_bearbeitet_1920.png` });

  // Formation wechseln und zurück: Elf bleibt vollständig, eigene Lagen werden verworfen
  await page.locator('.lu-formation').selectOption('4-4-2');
  await page.waitForTimeout(200);
  const filled = await page.locator('.lu-slot').evaluateAll((els) => els.filter((e) => e.getAttribute('data-pid')).length);
  check(filled === 11 && await slotPos(page, 's2') === 'LV', 'Formation 4-4-2 gesetzt, 11 Spieler besetzt');
  await page.screenshot({ path: `${outDir}/1975_442_1920.png` });
  await page.locator('.lu-formation').selectOption('libero-1-4-3-2');
  await page.locator('button.dchip:has-text("Auto")').click();
  await page.waitForTimeout(200);
  const filled2 = await page.locator('.lu-slot').evaluateAll((els) => els.filter((e) => e.getAttribute('data-pid')).length);
  check(filled2 === 11, 'Auto-Aufstellung besetzt alle 11 Plätze');

  // Erkennbare Aufstellung für das nächste Spiel: Reservespieler auf s10, frei als RA rechts vorne
  const res3 = page.locator('tbody[data-lu-drop="reserve"] tr.lu-row:not(.out)').first();
  const res3Pid = await res3.getAttribute('data-pid');
  const res3Name = (await res3.locator('.lu-name').innerText()).split(' ').pop();
  await drag(page, await center(res3), await center(slot(page, 's10')));
  await drag(page, await center(slot(page, 's10')), await fieldPoint(page, 80, 30));
  check(await slotPid(page, 's10') === res3Pid && await slotPos(page, 's10') === 'RA', `Testaufstellung: ${res3Name} als RA`);
  // Einstellung „Fest einrasten“ bleibt erhalten (Seite verlassen und zurück)
  await goto(page, 'Taktik');
  await page.screenshot({ path: `${outDir}/1975_taktik_1920.png` });
  await goto(page, 'Aufstellung');
  check(!(await page.locator('.lu-check input').isChecked()), '„Fest einrasten“ bleibt aus (gespeichert in der Taktik)');

  // Bis zum ersten eigenen Spiel, Textmodus öffnen und Aufstellung prüfen
  let due = false;
  for (let i = 0; i < 150 && !due; i++) {
    // Vorschau „Nächstes Spiel“ geschlossen → Kopfknopf öffnet sie wieder.
    { const pn = page.locator('.hd-continue.pm-next'); if (await pn.isVisible().catch(() => false)) { await pn.click().catch(() => {}); await page.waitForTimeout(600); } }
    if (await page.locator('button:has-text("Textmodus")').isVisible().catch(() => false)) { due = true; break; }
    for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("OK")', '.modal-close', '.bf-modal .bf-continue']) {
      const bt = page.locator(sel).first();
      if (await bt.isVisible().catch(() => false)) await bt.click().catch(() => {});
    }
    const w = page.getByRole('button', { name: /weiter/i }).first();
    if (await w.isVisible().catch(() => false)) await w.click().catch(() => {});
    await page.waitForTimeout(600);
  }
  check(due, 'Erstes eigenes Spiel erreicht');
  if (due) {
    await page.click('button:has-text("Textmodus")');
    await page.waitForTimeout(2500);
    const rows = await page.locator('.tm-lineup .tm-lt-body > .tm-lt-row:not(.avg):not(.bench)').allInnerTexts();
    const mine = rows.find((r) => r.includes(res3Name));
    check(!!mine && /\bRA\b/.test(mine), `Textmodus: ${res3Name} steht als RA in der Startelf (${(mine ?? '–').replace(/\s+/g, ' ')})`);
    await page.screenshot({ path: `${outDir}/1975_textmodus_1920.png` });
  }
  await page.close();
}

// ---------------------------------------------------------------- 1b) Drag & Drop in beiden Größen (Vorlage „Test 3 Jahre“)
for (const vp of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
  const page = await openPage(vp);
  await loadSave(page, 'public/saves/test-3-jahre.txt');
  for (const sel of ['button:has-text("Schließen")']) { const b = page.locator(sel).first(); if (await b.isVisible().catch(() => false)) await b.click().catch(() => {}); }
  await goto(page, 'Aufstellung');
  const tag = `vorlage_${vp.width}`;
  const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
  check(scroll <= 2, `${tag}: Seite scrollt nicht (${scroll}px)`);
  await page.screenshot({ path: `${outDir}/${tag}_aufstellung.png` });
  const pid = await slotPid(page, 's7');
  await drag(page, await center(slot(page, 's7')), await center(page.locator('.lu-reserve-box')), { hold: () => page.screenshot({ path: `${outDir}/${tag}_reserve_ziehen.png` }) });
  check(!(await slotPid(page, 's7')), `${tag}: Feld → Reserve`);
  await drag(page, await center(slot(page, 's8')), await center(page.locator('.lu-bench .lu-bench-head')), { hold: () => page.screenshot({ path: `${outDir}/${tag}_bank_ziehen.png` }) });
  await page.screenshot({ path: `${outDir}/${tag}_nach_ablage.png` });
  const r = page.locator(`tr.lu-row[data-pid="${pid}"]`);
  await drag(page, await center(r), await center(slot(page, 's7')));
  check(await slotPid(page, 's7') === pid, `${tag}: Liste → freier Platz`);
  await page.close();
}

// ---------------------------------------------------------------- 2) Screenshots späterer Spielstände
const saves = (process.env.SAVES ?? '').split(',').filter(Boolean);
for (const file of saves) {
  for (const vp of [{ width: 1920, height: 1080 }, { width: 1366, height: 768 }]) {
    const page = await openPage(vp);
    await loadSave(page, file);
    const tag = `${basename(file).replace(/\.[a-z]+$/, '')}_${vp.width}`;
    await goto(page, 'Aufstellung');
    // Spätere Epoche: modernes System zeigen (FORM_<jahr>=… überschreibt)
    const year = (basename(file).match(/(19|20)\d\d/) ?? [''])[0];
    const form = process.env[`FORM_${year}`] ?? (Number(year) >= 1995 ? '4-2-3-1' : '');
    if (form) { await page.locator('.lu-formation').selectOption(form); await page.waitForTimeout(200); }
    check(await page.locator('.lu-slot').count() === 11, `${tag}: 11 Positionsfelder`);
    const scroll = await page.evaluate(() => { const m = document.querySelector('.app-main'); return m ? m.scrollHeight - m.clientHeight : 0; });
    check(scroll <= 2, `${tag}: Seite scrollt nicht (${scroll}px)`);
    await page.screenshot({ path: `${outDir}/${tag}_aufstellung.png` });
    await drag(page, await center(slot(page, 's9')), await fieldPoint(page, 50, 40), { hold: () => page.screenshot({ path: `${outDir}/${tag}_ziehen.png` }) });
    await goto(page, 'Taktik');
    await page.screenshot({ path: `${outDir}/${tag}_taktik.png` });
    await page.close();
  }
}

console.log(errors.length ? 'JS-FEHLER:\n' + errors.join('\n') : 'keine JS-Fehler');
console.log(fails.length ? `${fails.length} Prüfung(en) fehlgeschlagen` : 'alle Prüfungen bestanden');
await browser.close(); server.close();
process.exit(errors.length || fails.length ? 1 : 0);
