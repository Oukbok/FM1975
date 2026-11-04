// Screenshots aller 10 Styles (ui/themes.ts, styles/30-themes.css) auf 5 typischen Seiten
// + je Seite ein Kontaktbogen mit 10 Kacheln für den Vergleich.
//   npm run build && node tests/theme-shots.mjs [ordner]
//   Spielstand: Vorlage „Test 3 Jahre“ (SAVE=…), Auflösung VIEW=1920x1080 (Standard).
//   ONLY=papier,graphit – nur diese Styles; NOTEXT=1 – Textmodus auslassen.
// Prüft außerdem: Auswahlliste oben rechts wechselt den Style (data-theme), Kopfleiste
// läuft nicht über, Lesbarkeit (Kontrast Text/Fläche nach WCAG) je Style.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { closeBriefing } from './newgame-flow.mjs';
import { pickOption } from './select3.mjs';

const outDir = process.argv[2] || 'test-output/themes';
await mkdir(outDir, { recursive: true });
const [VW, VH] = (process.env.VIEW || '1920x1080').split('x').map(Number);
const ALL = ['abendhimmel', 'ruhig', 'schiefer', 'stadionnacht', 'papier', 'hellkuehl', 'kontrast', 'retro', 'modern', 'graphit'];
const NAMES = ['Abendhimmel', 'Abendhimmel ruhig', 'Schiefer kühl', 'Stadion-Nacht', 'Papier hell', 'Hell kühl', 'Hell Kontrast', 'Retro 1975', 'Modern 2025', 'Graphit monochrom'];
const THEMES = process.env.ONLY ? ALL.filter((t) => process.env.ONLY.split(',').includes(t)) : ALL;
const TONE = { papier: 'light', hellkuehl: 'light', kontrast: 'light' };

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
const notes = [];
page.on('pageerror', (e) => errors.push('JS-Fehler: ' + e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
await page.goto(`http://127.0.0.1:${server.address().port}/`);
const raw = await readFile(process.env.SAVE || 'public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate((r) => {
  localStorage.setItem('fm1980_save_sim', r); localStorage.setItem('fm1980_saves_index', JSON.stringify(['sim']));
  // Shows aus, damit der Weg zum nächsten Spiel nicht an Hallen-/Auslosungs-/Ehrungsfenstern hängt.
  localStorage.setItem('fm1980_settings', JSON.stringify({ indoorShow: 'aus', drawShow: 'aus', awardsShow: 'aus', ratingShow: 'aus', transferWindowShow: false, matchReport: 'nie' }));
}, raw);
await page.reload();
await page.click('text=Spiel laden');
await page.click('button:has-text("Laden") >> nth=0');
await page.waitForTimeout(1500);
await closeBriefing(page);

// --- Auswahlliste oben rechts: wechselt sie wirklich? -------------------------
const picker = page.locator('.hd-right .thm-pick');
if (!(await picker.count())) errors.push('Style-Auswahl in der Kopfleiste fehlt');
else {
  await pickOption(page, picker, 'papier');
  await page.waitForTimeout(200);
  const t = await page.evaluate(() => document.documentElement.dataset.theme);
  if (t !== 'papier') errors.push(`Auswahl wirkt nicht (data-theme=${t})`);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fm1980_settings') || '{}').theme);
  if (stored !== 'papier') errors.push(`Style nicht gespeichert (${stored})`);
  const ov = await page.evaluate(() => { const h = document.querySelector('.hd-bar'); return h ? h.scrollWidth - h.clientWidth : 0; });
  if (ov > 2) errors.push(`Kopfleiste läuft über (${ov}px)`);
  const hidden = await page.evaluate(() => [...document.querySelectorAll('.hd-nav-item')].filter((b) => { const r = b.getBoundingClientRect(); const n = b.parentElement.getBoundingClientRect(); return r.right > n.right + 1 || r.width < 5; }).map((b) => b.textContent));
  if (hidden.length) errors.push(`Menüpunkte abgeschnitten: ${hidden.join(', ')}`);
  await pickOption(page, picker, 'abendhimmel');
}

const setTheme = async (id) => {
  await page.evaluate(([id, tone]) => { document.documentElement.dataset.theme = id; document.documentElement.dataset.tone = tone; }, [id, TONE[id] || 'dark']);
  await page.waitForTimeout(250);
};

// Kontrast: Text gegen den tatsächlichen Boxgrund (Tokens auslesen, gemischt auf --bg).
const contrast = async () => page.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const hex = (v) => { const c = document.createElement('div'); c.style.color = v; document.body.appendChild(c); const m = getComputedStyle(c).color.match(/[\d.]+/g).map(Number); c.remove(); return m; };
  const lum = ([r, g, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const panel = hex(cs.getPropertyValue('--panel'));
  const out = {};
  for (const k of ['--text', '--text-2', '--text-3', '--accent']) out[k] = ratio(hex(cs.getPropertyValue(k)), panel).toFixed(1);
  out['--primary-ink'] = ratio(hex(cs.getPropertyValue('--primary-ink')), hex(cs.getPropertyValue('--primary'))).toFixed(1);
  return out;
});

const nav = async (main, sub) => {
  await page.locator(`.hd-nav-item:has-text("${main}")`).first().click();
  await page.waitForTimeout(250);
  if (sub) { await page.locator(`.tn-sub-item:has-text("${sub}")`).first().click(); await page.waitForTimeout(400); }
};
const PAGES = [['Zentrale', null, 'zentrale'], ['Kader', 'Übersicht', 'kader'], ['Training', 'Trainingsplan', 'trainingsplan'], ['Finanzen', 'Budget', 'budget']];
const shots = {}; // seite -> [{theme, file}]
const add = (p, theme, file) => { (shots[p] ||= []).push({ theme, file }); };

for (const [m, s, n] of PAGES) {
  try { await nav(m, s); } catch (e) { errors.push(`${n}: ${e.message.split('\n')[0]}`); continue; }
  for (const t of THEMES) {
    await setTheme(t);
    const f = `${outDir}/${n}_${String(ALL.indexOf(t) + 1).padStart(2, '0')}_${t}.png`;
    await page.screenshot({ path: f });
    add(n, t, f);
    if (n === 'zentrale') notes.push(`${t}: Kontrast ${JSON.stringify(await contrast())}`);
  }
  await setTheme('abendhimmel');
}

// --- Textmodus -------------------------------------------------------------------
if (!process.env.NOTEXT) {
  const closeModals = async () => {
    for (const sel of ['button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Schließen")', 'button:has-text("Fertig")', 'button:has-text("OK")', '.reveal-close', '.modal:not(.pm-root) .modal-close', '.dr-root button:has-text("Ergebnis sofort zeigen")']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) await b.click({ timeout: 1500 }).catch(() => {});
    }
  };
  await nav('Zentrale', null);
  for (let i = 0; i < 160; i++) {
    if (await page.locator('.pm-go-btn:has-text("Textmodus")').first().isVisible().catch(() => false)) break;
    await closeModals();
    // Zeit laufen lassen (nur starten, wenn sie steht – ein zweiter Klick hielte sie an)
    const lbl = (await page.locator('.hd-continue').first().innerText({ timeout: 1000 }).catch(() => '')).trim().toUpperCase();
    if (lbl === 'WEITER' || lbl === 'NEUE SAISON') await page.locator('.hd-continue').first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(700);
    if (i === 12) await page.screenshot({ path: outDir + '/_debug.png' });
    if (i % 5 === 0) console.log('Textmodus-Suche', i, await page.locator('.hd-continue').first().innerText().catch(() => '?'), await page.locator('.hd-date, .tn-date').first().innerText().catch(() => ''));
  }
  try {
    await page.locator('.pm-go-btn:has-text("Textmodus")').first().click();
    await page.waitForTimeout(1500);
    for (let i = 0; i < 60; i++) {
      const min = await page.locator('.tm-clock-txt b').innerText().catch(() => '0');
      if (parseInt(min, 10) >= 20) break;
      if (await page.locator('.tm-cs-ok').isVisible().catch(() => false)) await page.click('.tm-cs-ok').catch(() => {});
      await page.waitForTimeout(500);
    }
    await page.click('.tm-rbtn >> nth=0').catch(() => {}); // anhalten
    await page.waitForTimeout(300);
    for (const t of THEMES) {
      await setTheme(t);
      const f = `${outDir}/textmodus_${String(ALL.indexOf(t) + 1).padStart(2, '0')}_${t}.png`;
      await page.screenshot({ path: f });
      add('textmodus', t, f);
    }
    await setTheme('abendhimmel');
  } catch (e) { errors.push('textmodus: ' + e.message.split('\n')[0]); }
}

// --- Kontaktbögen: je Seite 10 Kacheln (5 × 2) ---------------------------------
const sheet = await browser.newPage({ viewport: { width: 2000, height: 760 } });
for (const [p, list] of Object.entries(shots)) {
  const tiles = await Promise.all(list.map(async ({ theme, file }) => ({
    theme, src: 'data:image/png;base64,' + (await readFile(file)).toString('base64'),
  })));
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#2a2d33;font:600 15px system-ui,sans-serif;color:#eef1f5}
    h1{margin:0;padding:12px 16px 4px;font-size:20px;letter-spacing:1px;text-transform:uppercase}
    .g{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:10px 16px 16px}
    figure{margin:0} img{width:100%;display:block;border:1px solid #555}
    figcaption{padding:5px 2px 0}</style>
    <h1>${p} – 10 Styles</h1><div class="g">${tiles.map((t) => `<figure><img src="${t.src}"><figcaption>${ALL.indexOf(t.theme) + 1} · ${NAMES[ALL.indexOf(t.theme)]}</figcaption></figure>`).join('')}</div>`;
  await sheet.setContent(html);
  await sheet.waitForTimeout(300);
  await sheet.screenshot({ path: `${outDir}/kontaktbogen_${p}.png`, fullPage: true });
  console.log(`Kontaktbogen: ${resolve(outDir, `kontaktbogen_${p}.png`)}`);
}

console.log(notes.join('\n'));
console.log(errors.length ? errors.join('\n') : 'Keine Fehler.');
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
