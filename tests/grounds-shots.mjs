// Screenshots der Vereinsgelände-Seite (Lage & Wirkung, Bauliste, Details).
//   node tests/grounds-shots.mjs [ausgabeordner] [kürzel]   (SAVE=… lädt einen Spielstand,
//   z. B. aus `DUMP=s.txt node scripts/sim.mjs 15` für 1990)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/grounds';
const tag = process.argv[3] || (process.env.SAVE ? 'save' : '1975');
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
if (process.env.SAVE) {
  const raw = await readFile(process.env.SAVE, 'utf8');
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  await page.click('text=Spiel laden');
  await page.click('button:has-text("Laden") >> nth=0');
  await page.waitForTimeout(1500);
} else { await startNewGame(page); await page.waitForTimeout(800); }
await page.locator('.hd-nav-item:has-text("Verein")').click();
await page.waitForTimeout(200);
await page.locator('.tn-sub-item:has-text("Vereinsgelände")').click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/${tag}_1_lage.png` });
await page.locator('.gp-tabs .seg-btn:has-text("Bauliste")').click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_2_bauliste.png` });
await page.locator('.gp-row:has-text("Parkplätze")').click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_3_parken.png` });
await page.locator('.gd-back').click();
await page.locator('.gp-tabs .seg-btn:has-text("Bauliste")').click();
await page.locator('.gp-row:has-text("Hospitality")').click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_4_hospitality.png` });
// Ein Gebäude in der Zeichnung anklicken (Fanprojekt oder Vereinsheim, sonst irgendeines)
const obj = page.locator('.gr-svg .gr-obj');
await obj.nth(Math.min(5, (await obj.count()) - 1)).click({ force: true });
await page.waitForTimeout(200);
await page.screenshot({ path: `${outDir}/${tag}_5_klick.png` });
// Verschieben, Zoomen
{
  const box = await page.locator('.gr-wrap').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  const b0 = await page.locator('.gr-svg .gr-obj').first().boundingBox();
  await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 120, cy - 260, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(200);
  const b1 = await page.locator('.gr-svg .gr-obj').first().boundingBox();
  if (!b0 || !b1 || Math.abs((b1.y - b0.y) + 260) > 14) errors.push(`Ziehen verschiebt das Gelände nicht wie erwartet: ${b0?.y} → ${b1?.y}`);
  await page.screenshot({ path: `${outDir}/${tag}_6_verschoben.png` });
  await page.mouse.move(cx, cy); for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/${tag}_7_gesamt.png` });
  await page.mouse.move(cx, cy); for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -300);
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${outDir}/${tag}_8_nah.png` });
}
console.log(errors.length ? 'FEHLER:\n' + errors.join('\n') : 'ok, keine JS-Fehler');
await browser.close(); server.close();
process.exit(errors.length ? 1 : 0);
