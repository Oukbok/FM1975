// Screenshots des Abschluss-Bildschirms nach dem Abstieg aus der untersten Liga (screens/GameOverScreen.tsx).
//   npm run build && ONLY=A DUMP_OVER=test-output/relegation/ende.txt npm run test:relegation
//   SAVE=test-output/relegation/ende.txt node tests/gameover-shots.mjs [ordner]
// Lädt den Stand am Saisonende, klickt „Abschluss“, fotografiert bei 1920×1080 und 1280×800, prüft feste Größe/
// Überlauf, „Letzten Spielstand laden“ (führt zurück vor den Abschluss) und „Hauptmenü“.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const outDir = process.argv[2] || 'test-output/relegation';
await mkdir(outDir, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);
const raw = await readFile(process.env.SAVE || 'test-output/relegation/ende.txt', 'utf8');
const browser = await chromium.launch();
const errors = [];
const sizes = [];
for (const [vw, vh] of [[1920, 1080], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  page.on('pageerror', (e) => errors.push(`${vw}: JS-Fehler: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.evaluate((r) => { localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim'])); }, raw);
  await page.reload();
  const load = async () => {
    await page.click('text=Spiel laden');
    await page.click('.card:has(button:has-text("Löschen")) button:has-text("Laden") >> nth=0');
    await page.waitForSelector('.hd-continue');
    await page.waitForTimeout(800);
  };
  await load();
  const label = (await page.locator('.hd-continue').innerText()).trim();
  if (!/Abschluss/i.test(label)) errors.push(`${vw}: Knopf heißt „${label}“ statt „Abschluss“`);
  await page.screenshot({ path: `${outDir}/abschluss_${vw}x${vh}_0_saisonende.png` });
  await page.locator('.hd-continue').click();
  await page.waitForSelector('.go-sheet');
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${outDir}/abschluss_${vw}x${vh}.png` });
  const m = await page.evaluate(() => {
    const sheet = document.querySelector('.go-sheet');
    const r = sheet.getBoundingClientRect();
    const over = [...sheet.querySelectorAll('*')].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && (b.right > r.right + 1 || b.bottom > r.bottom + 1 || b.left < r.left - 1 || b.top < r.top - 1);
    }).map((el) => el.className);
    const clipped = [...sheet.querySelectorAll('.go-title, .go-lead, .go-text, .go-stat-v, .go-stat-l, .go-btn')].filter((el) => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map((el) => `${el.className}: ${el.textContent}`);
    return { w: sheet.offsetWidth, h: sheet.offsetHeight, inView: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight, over, clipped, shell: !!document.querySelector('.hd-continue'), text: sheet.innerText.replace(/\s+/g, ' ').slice(0, 400) };
  });
  sizes.push(`${m.w}x${m.h}`);
  console.log(`${vw}x${vh}: Blatt ${m.w}×${m.h} – ${m.text}`);
  if (!m.inView) errors.push(`${vw}: Abschluss-Blatt ragt aus dem Fenster`);
  if (m.over.length) errors.push(`${vw}: Überlauf ${m.over.join(', ')}`);
  if (m.clipped.length) errors.push(`${vw}: abgeschnitten ${m.clipped.join(' | ')}`);
  if (m.shell) errors.push(`${vw}: Spiel-Oberfläche noch sichtbar (Weiterspielen möglich)`);
  if (/undefined|NaN/.test(m.text)) errors.push(`${vw}: undefined/NaN im Text`);
  // Kein Weiterspielen über die Leertaste.
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  if (!(await page.locator('.go-sheet').count())) errors.push(`${vw}: Leertaste schließt den Abschluss`);
  // Letzten Spielstand laden → zurück vor den Abschluss.
  await page.locator('.go-btn:has-text("Letzten Spielstand laden")').click();
  await page.waitForSelector('.hd-continue');
  if (await page.locator('.go-sheet').count()) errors.push(`${vw}: nach dem Laden noch Abschluss-Bildschirm`);
  await page.locator('.hd-continue').click();
  await page.waitForSelector('.go-sheet');
  await page.locator('.go-btn:has-text("Hauptmenü")').click();
  await page.waitForSelector('text=Spiel laden');
  await page.close();
}
if (new Set(sizes).size !== 1) errors.push(`Blattgröße nicht fest: ${sizes.join(' / ')}`);
await browser.close();
server.close();
if (errors.length) { console.log('FEHLER:\n' + errors.join('\n')); process.exit(1); }
console.log(`Screenshots in ${outDir}`);
