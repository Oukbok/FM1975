// Screenshots + Kontrast der 20 Styles „Ruhig – neu“ (styles/31-themes-ruhig.css, Wunsch Pascal)
//   npm run build && node tests/theme2-shots.mjs [ordner]
// Seiten: Zentrale, Kalender (Knopfleiste Raster|Liste ‹ Heute ›), Kader, Spielerprofil, Trainingsplan.
// Je Seite ein Kontaktbogen (Referenz „Abendhimmel ruhig“ + 20 Styles), dazu ein Bogen mit der
// Kalender-Knopfleiste in Großaufnahme (aktueller Monat = „Heute“ gesperrt, Folgemonat = frei).
// Hintergrund: provisorisches klares Testfoto (PHOTO=assets/start-tribuene.jpg Standard, PHOTO=0 =
// eingebaute Fotos), damit „Foto klar sichtbar“ beurteilt werden kann.
// Kontrast: Text gegen die TATSÄCHLICH gerenderte Boxfläche (Foto + Glas): Text ausgeblendet,
// Fläche abfotografiert, hellste 2 % der Pixel = ungünstigster Grund für hellen Text (WCAG-Formel).
// Ausgabe kontrast.txt (+ Konsole). ONLY=ruhig-glas,ruhig-hart · VIEW=1920x1080 · SAVE=…
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';

const outDir = process.argv[2] || 'test-output/themes2';
await mkdir(outDir, { recursive: true });
const [VW, VH] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const PHOTO = process.env.PHOTO ?? 'assets/start-tribuene.jpg';

// Liste aus ui/themes.ts lesen (eine Quelle)
const src = await readFile('src/ui/themes.ts', 'utf8');
const ALLDEF = [...src.matchAll(/\{ id: '([\w-]+)', name: '([^']+)'[^\n]*group: '(\w+)'/g)].map((m) => ({ id: m[1], name: m[2], group: m[3] }));
let LIST = [ALLDEF.find((t) => t.id === 'ruhig'), ...ALLDEF.filter((t) => t.group === 'ruhig')];
if (process.env.ONLY) LIST = LIST.filter((t) => process.env.ONLY.split(',').includes(t.id));
const num = (t) => (t.id === 'ruhig' ? 'Ref' : String(ALLDEF.filter((x) => x.group === 'ruhig').indexOf(t) + 1).padStart(2, '0'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.endsWith('/')) path += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(await readFile(join('dist', path))); }
  catch { res.writeHead(404).end(); }
}).listen(0);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: VW, height: VH } });
const errors = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => {
  localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
  localStorage.setItem('fm1980_settings', JSON.stringify({ indoorShow: 'aus', drawShow: 'aus', awardsShow: 'aus', ratingShow: 'aus', transferWindowShow: false, matchReport: 'nie' }));
}, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);
if (PHOTO !== '0') {
  await page.addStyleTag({ content: `:root, :root[data-theme] { --photo-url: url('/${PHOTO}') !important; --photo-url-zentrale: url('/${PHOTO}') !important; --photo-pos: center center !important; }` });
}

const setTheme = async (id) => {
  await page.evaluate((id) => { document.documentElement.dataset.theme = id; document.documentElement.dataset.tone = 'dark'; }, id);
  await page.waitForTimeout(220);
};
const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(450); }
};

// ---- Kontrast-Messung ------------------------------------------------------------
const LUM = `const lum=([r,g,b])=>{const f=(x)=>{x/=255;return x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4};return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)};`;
/** Fläche eines Elements ohne Text/Bilder abfotografieren → Leuchtdichte-Perzentile. */
async function surface(sel, core = false, keepText = false) {
  const el = page.locator(sel).first();
  if (!(await el.count())) return null;
  const box = await el.boundingBox();
  if (!box || box.width < 4) return null;
  const tag = keepText ? null : await page.addStyleTag({ content: `${sel}, ${sel} * { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; }
    ${sel} img, ${sel} svg, ${sel} canvas, ${sel} .game-icon { visibility: hidden !important; }` });
  await page.waitForTimeout(60);
  // Knöpfe (core): nur die Mitte (ohne Rand/Ecken) – die Fläche hinter der Schrift
  const px = core ? box.width * 0.18 : 3, py = core ? box.height * 0.28 : 3;
  const buf = await page.screenshot({ clip: { x: box.x + px, y: box.y + py, width: Math.max(2, box.width - 2 * px), height: Math.max(2, box.height - 2 * py) } });
  if (tag) await tag.evaluate((n) => n.remove());
  return page.evaluate(async ([b64, LUMSRC]) => {
    const lum = new Function(LUMSRC + 'return lum;')();
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const L = []; for (let i = 0; i < d.length; i += 16) L.push(lum([d[i], d[i + 1], d[i + 2]]));
    L.sort((a, b) => a - b);
    const q = (p) => L[Math.min(L.length - 1, Math.floor(p * L.length))];
    return { p02: q(0.02), p50: q(0.5), p98: q(0.98) };
  }, [buf.toString('base64'), LUM]);
}
const colorLum = (expr) => page.evaluate(([expr, LUMSRC]) => {
  const lum = new Function(LUMSRC + 'return lum;')();
  const c = document.createElement('div'); c.style.color = expr; document.body.appendChild(c);
  const m = getComputedStyle(c).color.match(/[\d.]+/g).map(Number); c.remove();
  return lum(m);
}, [expr, LUM]);
/** Ungünstigster Kontrast: heller Text gegen die hellsten 2 %, dunkler Text gegen die dunkelsten 2 %. */
const mid = (lt, s) => (s ? (Math.max(lt, s.p50) + 0.05) / (Math.min(lt, s.p50) + 0.05) : NaN);
const worst = (lt, s) => {
  if (!s) return NaN;
  const r = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return lt >= s.p50 ? r(lt, s.p98) : r(lt, s.p02);
};
const fx = (v) => (Number.isFinite(v) ? v.toFixed(1) : '–');

// ---- Seiten ------------------------------------------------------------------------
const shots = {}; // seite -> [{t, file}]
const add = (p, t, file) => { (shots[p] ||= []).push({ t, file }); };
const contrast = {}; // id -> {...}
const strips = {}; // id -> [fileA, fileB]

async function shootAll(name, prep) {
  for (const t of LIST) {
    await setTheme(t.id);
    if (prep) await prep(t);
    const f = `${outDir}/${name}_${num(t)}_${t.id}.png`;
    await page.screenshot({ path: f });
    add(name, t, f);
  }
}

try { await nav('Zentrale', null); await shootAll('zentrale', async (t) => {
  const s = await surface('.dz-news');
  (contrast[t.id] ||= {}).news = s;
}); } catch (e) { errors.push('zentrale: ' + e.message.split('\n')[0]); }

try {
  await nav('Zentrale', 'Kalender');
  const row = '.cal-box .dbtnrow';
  await shootAll('kalender', async (t) => {
    const C = (contrast[t.id] ||= {});
    C.box = await surface('.cal-box');
    // Knöpfe: gewählt / frei / gesperrt (Heute im laufenden Monat)
    await page.waitForTimeout(250); // Übergänge (Hover/Fokus vom vorigen Style) abklingen lassen
    C.on = await surface(`${row} .b3.on`, true);
    C.off = await surface(`${row} .b3:not(.on):not(:disabled):not(.b3-icon)`, true);
    // gesperrt: so gemessen, wie es auf dem Schirm steht (Schrift sichtbar): hellste 2 % = Schrift, Median = Fläche
    C.dis = await surface(`${row} .b3:disabled`, true, true);
    C.lt = {
      text: await colorLum('var(--text)'), text2: await colorLum('var(--text-2)'), text3: await colorLum('var(--text-3)'),
      on: await colorLum('var(--btn-on-text)'), btn: await colorLum('var(--btn-text)'),
      pink: await colorLum('var(--primary-ink)'), prim: await colorLum('var(--primary)'),
    };
    // Großaufnahme der Knopfleiste: aktueller Monat (Heute gesperrt) + Folgemonat (Heute frei)
    const r = await page.locator(row).first().boundingBox();
    const clip = { x: r.x - 14, y: r.y - 12, width: r.width + 28, height: r.height + 24 };
    const fa = `${outDir}/knoepfe_${num(t)}_${t.id}_a.png`;
    await page.screenshot({ path: fa, clip });
    await page.locator(`${row} button[aria-label="Folgemonat"]`).click();
    await page.locator(`${row} .b3:has-text("Liste")`).hover();
    await page.waitForTimeout(150);
    const fb = `${outDir}/knoepfe_${num(t)}_${t.id}_b.png`;
    await page.screenshot({ path: fb, clip });
    await page.locator(`${row} .b3:has-text("Heute")`).click();
    await page.mouse.move(5, VH - 5);
    await page.waitForTimeout(120);
    strips[t.id] = [fa, fb];
  });
} catch (e) { errors.push('kalender: ' + e.message.split('\n')[0]); }

try { await nav('Kader', 'Übersicht'); await shootAll('kader', async (t) => {
  (contrast[t.id] ||= {}).kader = await surface('.sub3-page .dbox');
}); } catch (e) { errors.push('kader: ' + e.message.split('\n')[0]); }

try {
  await page.locator('.dtable tbody tr').first().click();
  await page.waitForTimeout(700);
  await shootAll('profil');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
} catch (e) { errors.push('profil: ' + e.message.split('\n')[0]); }

try { await nav('Training', 'Trainingsplan'); await shootAll('training'); } catch (e) { errors.push('training: ' + e.message.split('\n')[0]); }
await setTheme('abendhimmel');

// ---- Kontrast-Bericht -------------------------------------------------------------
const lines = ['Kontrast (WCAG) gegen die gerenderte Fläche mit Testfoto, ungünstigste 2 % der Pixel',
  'Style                     | Text  Text2 Text3 (Kalender-Box) | Text  Text2 (Kader-Box) | Text (Newscenter) | Knopf gewählt | Knopf frei | Knopf gesperrt | Hauptknopf',
  '-'.repeat(160)];
const rows = [];
for (const t of LIST) {
  const C = contrast[t.id]; if (!C || !C.lt) continue;
  const L = C.lt;
  // gesperrt: Schrift (hellste 2 %) gegen Knopffläche (Median), beides gerendert
  const dis = C.dis ? (C.dis.p98 + 0.05) / (C.dis.p50 + 0.05) : NaN;
  const r = {
    id: t.id, name: t.name,
    t1: worst(L.text, C.box), t2: worst(L.text2, C.box), t3: worst(L.text3, C.box),
    k1: worst(L.text, C.kader), k2: worst(L.text2, C.kader), n1: worst(L.text, C.news),
    on: mid(L.on, C.on), off: mid(L.btn, C.off), dis,
    prim: (Math.max(L.pink, L.prim) + 0.05) / (Math.min(L.pink, L.prim) + 0.05),
  };
  rows.push(r);
  lines.push(`${(num(t) + ' ' + t.name).padEnd(26)}| ${fx(r.t1).padStart(4)}  ${fx(r.t2).padStart(4)}  ${fx(r.t3).padStart(4)}                  | ${fx(r.k1).padStart(4)}  ${fx(r.k2).padStart(4)}             | ${fx(r.n1).padStart(4)}              | ${fx(r.on).padStart(5)}         | ${fx(r.off).padStart(5)}      | ${fx(r.dis).padStart(5)}          | ${fx(r.prim).padStart(5)}`);
  const warn = [];
  if (r.t1 < 7 || r.k1 < 7) warn.push('Text < 7:1');
  if (r.t2 < 4.5 || r.k2 < 4.5) warn.push('Text2 < 4,5:1');
  if (r.on < 4.5 || r.off < 4.5) warn.push('Knopf < 4,5:1');
  if (warn.length) lines.push(`   ! ${warn.join(', ')}`);
}
await writeFile(`${outDir}/kontrast.txt`, lines.join('\n') + '\n');
await writeFile(`${outDir}/kontrast.json`, JSON.stringify(rows, null, 1));

// ---- Kontaktbögen ----------------------------------------------------------------------
const sheet = await browser.newPage({ viewport: { width: 3000, height: 1100 } });
const b64 = async (f) => 'data:image/png;base64,' + (await readFile(f)).toString('base64');
const CSS = `body{margin:0;background:#3a3e45;font:600 16px system-ui,sans-serif;color:#eef1f5}
  h1{margin:0;padding:12px 16px 4px;font-size:21px;letter-spacing:1px;text-transform:uppercase}
  .g{display:grid;gap:12px;padding:10px 16px 16px} figure{margin:0} img{width:100%;display:block;border:1px solid #666}
  figcaption{padding:5px 2px 0} figcaption small{color:#b9c0c9;font-weight:500;margin-left:6px}`;
const cap = (t) => { const r = rows.find((x) => x.id === t.id); return `${num(t)} · ${t.name}${r ? `<small>Text ${fx(Math.min(r.t1, r.k1))} · Text2 ${fx(Math.min(r.t2, r.k2))} · Knopf ${fx(r.on)}/${fx(r.off)}</small>` : ''}`; };
for (const [p, list] of Object.entries(shots)) {
  const tiles = await Promise.all(list.map(async ({ t, file }) => `<figure><img src="${await b64(file)}"><figcaption>${cap(t)}</figcaption></figure>`));
  await sheet.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}.g{grid-template-columns:repeat(5,1fr)}</style><h1>${p} – Ruhig, neue Styles (Testfoto)</h1><div class="g">${tiles.join('')}</div>`);
  await sheet.waitForTimeout(300);
  await sheet.screenshot({ path: `${outDir}/kontaktbogen_${p}.png`, fullPage: true });
  console.log(`Kontaktbogen: ${resolve(outDir, `kontaktbogen_${p}.png`)}`);
}
const stripTiles = await Promise.all(LIST.filter((t) => strips[t.id]).map(async (t) => `<figure><img src="${await b64(strips[t.id][0])}"><img src="${await b64(strips[t.id][1])}" style="margin-top:4px"><figcaption>${cap(t)}</figcaption></figure>`));
await sheet.setViewportSize({ width: 2400, height: 1000 });
await sheet.setContent(`<!doctype html><meta charset="utf-8"><style>${CSS}.g{grid-template-columns:repeat(3,1fr)}</style><h1>Kalender-Knopfleiste – oben aktueller Monat (Heute gesperrt), unten Folgemonat (Hover auf „Liste“)</h1><div class="g">${stripTiles.join('')}</div>`);
await sheet.waitForTimeout(300);
await sheet.screenshot({ path: `${outDir}/kontaktbogen_knoepfe.png`, fullPage: true });
console.log(`Kontaktbogen: ${resolve(outDir, 'kontaktbogen_knoepfe.png')}`);

console.log(lines.join('\n'));
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
