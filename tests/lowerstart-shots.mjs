// Screenshots „Start in einer unteren Liga“ (Wunsch Pascal): Ligenwahl 1995 mit Regionalligen,
// Vereinswahl Regionalliga, Spiel in der Regionalliga (Zentrale, Tabelle, Statistiken › Liga),
// 3. Liga 2010 und Karrieremodus mit Länderspalte.
//   node tests/lowerstart-shots.mjs [ausgabeordner]
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';
import { startNewGame } from './newgame-flow.mjs';

const out = process.argv[2] || 'test-output/lowerstart';
await mkdir(out, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json', '.txt': 'text/plain' };
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(join('dist', p))); } catch { res.writeHead(404).end(); }
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();
const errors = [];
const runs = [
  { tag: '1995-rl', w: 1920, h: 1080, year: 1995, league: 'Regionalliga West', clubIndex: 2 },
  { tag: '2010-3liga', w: 1366, h: 768, year: 2010, league: '3. Liga', clubIndex: 5 },
  { tag: 'karriere', w: 1366, h: 768, year: 1995, career: true, clubIndex: 1 },
];
for (const r of runs) {
  const page = await browser.newPage({ viewport: { width: r.w, height: r.h } });
  page.on('pageerror', (e) => errors.push(`${r.tag}: ${e.message}`));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (x) => x.abort());
  await page.goto(url);
  const keep = ['4a_liga', '4_verein', '6_willkommen'];
  await startNewGame(page, {
    year: r.year, league: r.league, clubIndex: r.clubIndex, career: r.career,
    shots: async (n) => {
      if (r.career && n === '4_verein') {
        // Land wechseln (England) und zurück: Angebote werden neu erzeugt.
        await page.click('.ng-countries [data-cc="eng"]').catch(() => {});
        await page.waitForTimeout(300);
        await page.screenshot({ path: `${out}/${r.tag}_4_verein_england.png` });
        await page.click('.ng-countries [data-cc="ger"]').catch(() => {});
        await page.click('.ng-offer >> nth=1');
        await page.waitForTimeout(300);
      }
      if (keep.includes(n)) await page.screenshot({ path: `${out}/${r.tag}_${n}.png` });
    },
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/${r.tag}_7_spiel.png` });
  if (!r.career) {
    await page.click('.hd-nav-item:has-text("Statistiken"), .tn-cat:has-text("Statistiken")').catch(() => {});
    await page.click('.tn-sub-item:has-text("Liga")').catch(() => {});
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/${r.tag}_8_statistik_liga.png` });
  }
  await page.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'Keine JS-Fehler.');
