// Spielstände in IndexedDB (engine/saveStore.ts): Umzug aus localStorage, Speichern, Neuladen, Laden.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': T[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { if (!res.headersSent) res.writeHead(404).end(); } }).listen(0);
const fail = (m) => { console.error('FEHLER', m); process.exitCode = 1; };
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('pageerror', (e) => fail(`JS ${e.message}`));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
const url = `http://127.0.0.1:${server.address().port}/`;
await page.goto(url);
await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
await page.reload(); await page.waitForTimeout(1500);
const st = await page.evaluate(() => ({ ls: !!localStorage.getItem('fm1980_save_sim'), idx: localStorage.getItem('fm1980_saves_index') }));
if (st.ls) fail('localStorage-Stand nicht umgezogen'); else console.log('OK   Umzug localStorage → IndexedDB');
const metas = () => page.evaluate(() => new Promise((res) => { const r = indexedDB.open('fm1975-saves'); r.onsuccess = () => { const q = r.result.transaction('meta').objectStore('meta').getAll(); q.onsuccess = () => res(q.result.map((m) => m.slot + '|' + m.gameDate)); }; }));
const m1 = await metas();
if (!m1.includes(m1.find((x) => x.startsWith('sim|')))) fail(`Meta fehlt: ${m1}`);
await page.click('text=Spiel laden'); await page.click('button:has-text("Laden") >> nth=0'); await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
const date0 = (m1.find((x) => x.startsWith('sim|')) ?? '').split('|')[1];
console.log(`OK   geladen (${date0})`);
// Speichern über das Zahnrad-Menü
await page.locator('.hd-gear, button[aria-label*="Menü"], button[title*="Menü"]').first().click().catch(() => {});
await page.waitForTimeout(200);
await page.locator('.menu-dd-item', { hasText: 'Speichern' }).first().click();
await page.waitForTimeout(800);
const saveUi = await page.locator('.modal').count();
if (saveUi) { await page.locator('button:has-text("Neu speichern")').first().click(); await page.waitForTimeout(1500); }
const m2 = await metas();
if (m2.length < 2 && !saveUi) fail(`Speichern: ${m2}`); else console.log(`OK   gespeichert (${m2.join(', ')})`);
await page.reload(); await page.waitForTimeout(1500);
await page.click('text=Spiel laden'); await page.waitForTimeout(400);
const n = await page.locator('button:has-text("Laden")').count();
if (n < m2.length) fail(`Liste nach Neuladen: ${n} statt ${m2.length}`); else console.log(`OK   Liste nach Neuladen: ${n} Stände`);
await browser.close(); server.close();
if (!process.exitCode) console.log('Speicher-Test bestanden.');
