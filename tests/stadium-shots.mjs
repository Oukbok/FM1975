// Screenshots der Stadionseite: Übersicht, Planungsmodus „Stadion ausbauen“ (Block-Popover,
// mehrere geplante Blöcke inkl. ganzer Seite, Summe, nach „Bauen“), Kartenverkauf,
// Umfeld-Popover (Würstchenbuden), Neubau, Verschieben/Zoomen.
//   node tests/stadium-shots.mjs [ausgabeordner] [kürzel]   (SAVE=… lädt einen Spielstand, VIEW=1366x768)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/stadium';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const [VW, VH] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const tag = process.argv[3] || (process.env.SAVE ? 'late' : 'new');
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
  const close = page.locator('.modal button:has-text("Los geht")');
  if (await close.count()) await close.first().click().catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
} else { await startNewGame(page); await page.waitForTimeout(800); }
await page.locator('.hd-nav-item:has-text("Verein")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Stadion")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/${tag}_1_uebersicht.png` });
// Planungsmodus „Stadion ausbauen“: Knopf öffnet die Entwurfs-Box, Blöcke anklicken und umplanen
const blk = (id) => page.locator(`.gr-svg g[data-block="${id}"]`);
const capOf = async () => Number((await page.locator('.sv-kpis > div').nth(1).locator('b').innerText()).replace(/\D/g, ''));
const cap0 = await capOf();
await page.locator('.sv-bar .sv-plan-btn').click();
await page.waitForTimeout(300);
if (!(await page.locator('.spl').count())) errors.push('„Stadion ausbauen“ öffnet keine Entwurfs-Box');
await page.screenshot({ path: `${outDir}/${tag}_2_planung_leer.png` });
const spl0 = await page.locator('.spl').boundingBox();
// 1) Haupttribüne Mitte: Rang aufstocken + volles Dach
await blk('main_m').click({ force: true }); await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_3_block.png` });
const pop0 = await page.locator('.sv-pop').boundingBox();
const add = page.locator('.sv-pop button[title="Rang aufstocken"]');
if (await add.isVisible() && await add.isEnabled()) await add.click();
const roof = page.locator('.sv-pop .bc-roofs button:has-text("volles Dach")');
if (await roof.count()) await roof.first().click();
await page.waitForTimeout(200);
// 2) Nordtribüne West: ganze Seite, Rang aufstocken
await blk('north_w').click({ force: true }); await page.waitForTimeout(300);
await page.locator('.sv-pop .bc-scope button').nth(1).click();
if (await add.isVisible() && await add.isEnabled()) await add.click();
await page.waitForTimeout(200);
// 3) Kurve Südost: Dach
await blk('curve_se').click({ force: true }); await page.waitForTimeout(300);
const half = page.locator('.sv-pop .bc-roofs button:has-text("Teildach")');
if (await half.count()) await half.first().click();
await page.waitForTimeout(300);
const pop1 = await page.locator('.sv-pop').boundingBox();
if (pop0 && pop1 && (Math.abs(pop0.height - pop1.height) > 1 || Math.abs(pop0.width - pop1.width) > 1)) errors.push(`Block-Popover ändert die Größe: ${pop0.width}×${pop0.height} → ${pop1.width}×${pop1.height}`);
await page.screenshot({ path: `${outDir}/${tag}_4_planung_bloecke.png` });
// Popover zu → Summe und Szene mit allen geplanten Blöcken
await page.locator('.sv-pop .bc-done').click(); await page.waitForTimeout(300);
const rows = await page.locator('.spl-row').count();
if (rows < 4) errors.push(`Entwurf hat nur ${rows} Blöcke (erwartet ≥ 4)`);
const ghosts = await page.locator('.gr-svg g.sv-ghost').count();
if (ghosts !== rows) errors.push(`Szene markiert ${ghosts} geplante Blöcke, Entwurf hat ${rows}`);
if ((await capOf()) !== cap0) errors.push('Planen hat die Kapazität verändert – es darf noch nichts gebaut sein');
const spl1 = await page.locator('.spl').boundingBox();
if (spl0 && spl1 && (Math.abs(spl0.height - spl1.height) > 1 || Math.abs(spl0.width - spl1.width) > 1)) errors.push(`Entwurfs-Box ändert die Größe: ${spl0.width}×${spl0.height} → ${spl1.width}×${spl1.height}`);
const over = await page.evaluate(() => { const e = document.querySelector('.spl-scroll'); return e && e.scrollWidth > e.clientWidth + 1 ? `${e.scrollWidth} > ${e.clientWidth}` : ''; });
if (over) errors.push(`Entwurfs-Box: Inhalt läuft seitlich über (${over})`);
await page.screenshot({ path: `${outDir}/${tag}_5_planung_summe.png` });
await page.locator('.spl-scroll').evaluate((e) => { e.scrollTop = e.scrollHeight; }); await page.waitForTimeout(150);
await page.screenshot({ path: `${outDir}/${tag}_6_planung_pruefung.png` });
// Planung schließen und wieder öffnen: Entwurf bleibt
await page.locator('.spl .bc-x').click(); await page.waitForTimeout(200);
if (await page.locator('.gr-svg g.sv-ghost').count()) errors.push('Nach „Planung schließen“ zeigt die Szene noch den Entwurf');
await page.locator('.sv-bar .sv-plan-btn').click(); await page.waitForTimeout(300);
if ((await page.locator('.spl-row').count()) !== rows) errors.push('Entwurf ging beim Schließen verloren');
// Bauen (Kredit, falls die Kasse nicht reicht)
const build = page.locator('.spl .bc-build');
if (!(await build.isEnabled())) { // Kasse oder Saisonbudget reichen nicht → Kredit
  console.log('Bar nicht möglich:', await page.locator('.spl .bc-fine').innerText(), '|', await page.locator('.spl-check.bad small').allInnerTexts());
  await page.locator('.spl .bc-fin button:has-text("Kredit 20")').click(); await page.waitForTimeout(200);
}
if (await build.isEnabled()) {
  await build.click(); await page.waitForTimeout(150); await build.click(); await page.waitForTimeout(500);
  if (await page.locator('.spl').count()) errors.push(`Bauen hat nicht gestartet: ${await page.locator('.spl .bc-fine').innerText()}`);
  const kb = page.locator('.sv-kpis .sv-kpi-build');
  if (!(await kb.count())) errors.push('Nach „Bauen“ kein laufender Umbau in den Kennzahlen');
  await page.screenshot({ path: `${outDir}/${tag}_7_gebaut.png` });
} else {
  console.log('Bauen nicht möglich:', await page.locator('.spl .bc-fine').innerText());
  await page.screenshot({ path: `${outDir}/${tag}_7_gesperrt.png` });
  await page.locator('.spl .bc-reset').click();
}
// Kartenverkauf (eigene Seite, Verein › Kartenverkauf) und zurück
await page.locator('.sv-bar button:has-text("Kartenverkauf")').click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${outDir}/${tag}_8_tickets.png` });
await page.locator('.tn-sub-item:has-text("Stadion")').click();
await page.waitForTimeout(400);
// Gastronomie-Filter + Würstchenbuden
await page.locator('.sv-modes button:has-text("Gastronomie")').click();
await page.waitForTimeout(200);
await page.locator('.gr-svg g[data-venue=catering]').click({ force: true });
await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_9_buden.png` });
// Bausubstanz & Neubau: Popover öffnen, Neubau planen (Vorschau in der Szene), Zuschauer aus
await page.locator('.sv-modes button:has-text("Alles")').click();
const nb = page.locator('.sv-bar .sv-rebuild');
if (await nb.count()) {
  await nb.click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/${tag}_10_bausubstanz.png` });
  const h0 = await page.locator('.sv-pop').boundingBox();
  await page.locator('.sv-pop button:has-text("Neubau planen")').click(); await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${tag}_11_neubau.png` });
  const h1 = await page.locator('.sv-pop').boundingBox();
  if (Math.abs(h0.height - h1.height) > 1 || Math.abs(h0.width - h1.width) > 1) errors.push(`Popover ändert die Größe beim Planen: ${h0.width}×${h0.height} → ${h1.width}×${h1.height}`);
  await page.locator('.sv-pop .bc-x').click();
}
await page.locator('.sv-bar .sv-crowd').click(); await page.waitForTimeout(300);
await page.screenshot({ path: `${outDir}/${tag}_12_leer.png` });
await page.locator('.sv-bar .sv-crowd').click();
// Verschieben mit der linken Maustaste, Zoomen mit dem Mausrad, Zentrieren
{
  const pos = async () => (await page.locator('[data-venue="catering"]').boundingBox());
  const p0 = await pos();
  await page.mouse.move(900, 600); await page.mouse.down(); await page.mouse.move(1150, 480, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(200);
  const p1 = await pos();
  if (!p0 || !p1 || Math.abs((p1.x - p0.x) - 250) > 12) errors.push(`Ziehen verschiebt die Szene nicht wie erwartet: ${p0?.x} → ${p1?.x}`);
  if (await page.locator('.sv-pop').count()) errors.push('Ziehen hat ein Gebäude angeklickt');
  await page.screenshot({ path: `${outDir}/${tag}_13_verschoben.png` });
  await page.mouse.move(900, 600); for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/${tag}_14_gesamt.png` });
  await page.locator('.pz-ctl button:has-text("Zentrieren")').click(); await page.waitForTimeout(200);
  const p2 = await pos();
  if (!p0 || !p2 || Math.abs(p2.x - p0.x) > 2) errors.push('Zentrieren stellt die Ausgangslage nicht her');
}
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
