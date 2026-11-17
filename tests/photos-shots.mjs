// Screenshots: eigene Spielerfotos aus dem Datensatz im Newscenter und in der Zeitung (Wunsch Pascal).
//   npm run build && node scripts/run-ts.mjs tests/photos-prep.ts test-output/photos-prep.json
//   node tests/photos-shots.mjs [ordner]   (PREP=… anderer Vorbereitungsstand)
// Legt den Datensatz „fototest“ in die IndexedDB des Spiels, lädt die Vorlage mit diesem Datensatz,
// wählt die Nachricht mit Spielerbezug und prüft, dass ihr Foto das Datensatz-Bild ist (Data-URL);
// dann Zeitung + Artikel mit Foto.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/photos';
await mkdir(outDir, { recursive: true });
const prep = JSON.parse(await readFile(process.env.PREP || 'test-output/photos-prep.json', 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
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
await page.evaluate(async ({ save, ds }) => {
  localStorage.setItem('fm1980_save_sim', save);
  localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
  await new Promise((res, rej) => {
    const r = indexedDB.open('fm1975-datasets', 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('datasets')) r.result.createObjectStore('datasets'); };
    r.onsuccess = () => { const t = r.result.transaction('datasets', 'readwrite'); t.objectStore('datasets').put(ds, ds.meta.id); t.oncomplete = res; t.onerror = rej; };
    r.onerror = rej;
  });
}, { save: prep.save, ds: prep.dataset });
await page.reload();
await page.waitForTimeout(600);
await page.click('text=Spiel laden');
await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').click(); await page.waitForTimeout(200); }
for (let i = 0; i < 4; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
for (let k = 0; k < 6 && await page.locator('.modal-overlay').count(); k++) {
  const x = page.locator('.modal-close, button:has-text("Schließen"), button:has-text("OK"), button:has-text("Weiter")').first();
  if (await x.isVisible().catch(() => false)) await x.click().catch(() => {}); else break;
  await page.waitForTimeout(300);
}
await page.locator('.hd-nav-item:has-text("Zentrale")').first().click();
await page.waitForTimeout(500);
await page.locator(`.dz-msg:has-text("${prep.subject}")`).first().click();
await page.waitForTimeout(400);
const src = await page.locator('.dz-rphoto').getAttribute('src').catch(() => null);
if (!src?.startsWith('data:image/webp')) errors.push(`Newscenter: kein Datensatz-Foto bei „${prep.subject}“ (${(src ?? 'kein Bild').slice(0, 40)})`);
await page.screenshot({ path: `${outDir}/1_newscenter.png` });
await page.locator('.tn-sub-item:has-text("Presse")').click().catch(async () => {
  await page.locator('.hd-nav-item:has-text("Zentrale")').click();
  await page.waitForTimeout(250);
  await page.locator('.tn-sub-item:has-text("Presse")').click();
});
await page.waitForTimeout(600);
const n = await page.locator('.np-photo').count();
if (!n) errors.push(`Zeitung: kein Datensatz-Foto (Artikel „${prep.story}“)`);
await page.screenshot({ path: `${outDir}/2_zeitung.png` });
if (n) {
  await page.locator('.np-photo').first().evaluate((el) => el.closest('.np-lead, .np-teaser')?.click());
  await page.waitForTimeout(500);
  if (!await page.locator('.np-article .np-photo').count()) errors.push('Artikel: kein Foto');
  await page.screenshot({ path: `${outDir}/3_artikel.png` });
}
await browser.close();
server.close();
console.log(`Nachricht „${prep.subject}“ (${prep.player}), Artikel „${prep.story}“ (${prep.storyPlayer}), Fotos in der Zeitung: ${n}`);
if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log('Spielerfoto-Screenshots fertig.');
