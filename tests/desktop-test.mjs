// Desktop-Fassung (desktop/, Electron): Datei-Spielstände + gebaute App.
//   npm run test:desktop
// Teil 1 (immer): desktop/saves.cjs ohne Electron – gzip, atomar, Sicherung, Liste, ungültige Slots.
// Teil 2 (nur wenn ein Build oder Electron da ist, sonst übersprungen): App starten (app://), Version,
//   Vollbild-Umschalter, 1280×800, neues Spiel, Tage laufen lassen, speichern, beenden, neu starten
//   (Umzug localStorage/IndexedDB → Dateien), Stand laden, weiterspielen – ohne Konsolenfehler und ohne Netz.
// Vorbereitung für Teil 2: `cd desktop && npm install && npm run dist:dir` (oder `npm run game` für die
// unverpackte App). APP=<pfad zur ausführbaren Datei> wählt einen anderen Build, RUN=<sekunden> den Zeitlauf.
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const fails = [];
const ok = (m) => console.log(`OK   ${m}`);
const fail = (m) => { fails.push(m); console.error(`FEHLER ${m}`); };
const check = (cond, m) => (cond ? ok(m) : fail(m));
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const tmp = mkdtempSync(join(tmpdir(), 'fm1975-desktop-'));

// ---------------------------------------------------------------------------------------------
// Teil 1: Dateiablage
// ---------------------------------------------------------------------------------------------
{
  const { createSaveFiles } = require('../desktop/saves.cjs');
  const dir = join(tmp, 'unit');
  const s = createSaveFiles(dir);
  const big = JSON.stringify({ meta: { slot: 'a', name: 'Eins' }, game: { x: 'ä'.repeat(200000) } });
  await s.write('a', { slot: 'a', name: 'Eins' }, big);
  check((await s.read('a')) === big, 'Dateien: schreiben → lesen identisch (Umlaute)');
  const raw = readFileSync(join(dir, 'a.fm1975save'));
  check(raw[0] === 0x1f && raw[1] === 0x8b && raw.length < big.length / 10, `Dateien: gzip (${big.length} → ${raw.length} Bytes)`);
  const two = JSON.stringify({ meta: { slot: 'a', name: 'Zwei' }, game: { x: 2 } });
  await Promise.all([s.write('a', { slot: 'a', name: 'Zwischen' }, big), s.write('a', { slot: 'a', name: 'Zwei' }, two)]);
  check((await s.read('a')) === two, 'Dateien: gleichzeitige Schreibvorgänge laufen nacheinander (letzter gewinnt)');
  check(existsSync(join(dir, 'a.fm1975save.bak')) && gunzipSync(readFileSync(join(dir, 'a.fm1975save.bak'))).toString() === big, 'Dateien: Sicherung der vorherigen Fassung (.bak)');
  check(!readdirSync(dir).some((f) => f.endsWith('.tmp')), 'Dateien: keine .tmp-Reste');
  writeFileSync(join(dir, 'a.fm1975save'), 'kaputt');
  check((await s.read('a')) === big, 'Dateien: beschädigter Stand → Sicherung wird geladen');
  await s.write('b', { slot: 'b', name: 'B' }, two);
  rmSync(join(dir, 'b.meta.json'));
  const list = await s.list();
  check(list.length === 2 && list.find((m) => m.slot === 'b')?.name === 'Zwei' && existsSync(join(dir, 'b.meta.json')), 'Dateien: Liste, fehlende Meta-Datei wird aus dem Stand neu erzeugt');
  let threw = 0;
  for (const bad of ['../x', 'a/b', '', '..', 'x'.repeat(90), 'a\\b']) { try { await s.read(bad); } catch { threw++; } }
  check(threw === 6, 'Dateien: ungültige Slot-Namen werden abgelehnt');
  await s.remove('a');
  check((await s.read('a')) === null && (await s.list()).length === 1 && !existsSync(join(dir, 'a.fm1975save.bak')), 'Dateien: löschen (inkl. Sicherung)');
  check(spawnSync(process.execPath, ['desktop/sync-version.cjs', '--check']).status === 0, `Version: desktop/package.json = package.json (${version})`);
}

// ---------------------------------------------------------------------------------------------
// Teil 2: App
// ---------------------------------------------------------------------------------------------
function findApp() {
  if (process.env.APP) return { exe: resolve(process.env.APP), args: [], kind: 'APP' };
  const packed = { linux: 'desktop/release/linux-unpacked/fm1975', win32: 'desktop/release/win-unpacked/1975 A Football Manager.exe' }[process.platform];
  if (packed && existsSync(packed)) return { exe: resolve(packed), args: [], kind: 'Build' };
  try {
    const exe = createRequire(resolve('desktop/package.json'))('electron');
    if (typeof exe === 'string' && existsSync(exe) && existsSync('dist/index.html') && existsSync('dist/fonts')) return { exe, args: [resolve('desktop')], kind: 'unverpackt' };
  } catch { /* Electron nicht installiert */ }
  return null;
}
const target = findApp();
const finish = () => {
  rmSync(tmp, { recursive: true, force: true });
  if (fails.length) { console.error(`\n${fails.length} Fehler.`); process.exit(1); }
};
if (!target) {
  console.log('ÜBERSPRUNGEN  App-Test: kein Desktop-Build und kein Electron gefunden (cd desktop && npm install && npm run dist:dir).');
  finish(); console.log('Desktop-Test (nur Dateiablage) bestanden.'); process.exit(0);
}
if (process.platform === 'linux' && !process.env.DISPLAY) {
  // Ohne Bildschirm: unter xvfb-run noch einmal starten.
  if (spawnSync('which', ['xvfb-run']).status !== 0) { console.log('ÜBERSPRUNGEN  App-Test: kein Bildschirm (DISPLAY) und kein xvfb-run.'); finish(); process.exit(0); }
  rmSync(tmp, { recursive: true, force: true });
  const r = spawnSync('xvfb-run', ['-a', '-s', '-screen 0 1920x1080x24', process.execPath, ...process.argv.slice(1)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

const { _electron } = await import('playwright');
const { startNewGame } = await import('./newgame-flow.mjs');
const userData = join(tmp, 'userData');
const savesDir = join(userData, 'saves');
const shots = 'test-output/desktop';
mkdirSync(shots, { recursive: true });
const errors = [];
const dateRe = /\d{1,2}\. \w+ (19|20)\d\d/;

async function launch(label) {
  const app = await _electron.launch({
    executablePath: target.exe,
    args: [...target.args, '--no-sandbox'],
    env: { ...process.env, FM1975_USER_DATA: userData, FM1975_TEST: '1' },
  });
  const page = await app.firstWindow();
  page.on('pageerror', (e) => errors.push(`${label} JS: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label} Konsole: ${m.text()}`); });
  page.on('requestfailed', (r) => errors.push(`${label} Anfrage fehlgeschlagen: ${r.url()}`));
  page.on('request', (r) => { if (!/^(app|data|blob):/.test(r.url())) errors.push(`${label} Anfrage nach außen: ${r.url()}`); });
  await page.waitForSelector('.st-menu', { timeout: 30000 });
  return { app, page };
}
const win = (app, fn) => app.evaluate(({ BrowserWindow }, f) => new Function('w', `return (${f})(w)`)(BrowserWindow.getAllWindows()[0]), fn.toString());
async function closePopups(page) {
  for (let i = 0; i < 6 && await page.locator('.dr-root').count(); i++) {
    await page.locator('.dr-root .dg-go:has-text("Weiter")').first().click({ timeout: 1000 }).catch(() => page.keyboard.press('Escape'));
    await page.waitForTimeout(300);
  }
}
async function runTime(page, seconds) {
  const weiter = page.locator('.hd-continue').first();
  const end = Date.now() + seconds * 1000;
  while (Date.now() < end) {
    await closePopups(page);
    for (const sel of ['button:has-text("Simulieren")', 'button:has-text("Spiel simulieren")', 'button:has-text("Schnell simulieren")', 'button:has-text("Überspringen")', 'button:has-text("Fortsetzen")', 'button:has-text("Zum Spielbericht")', 'button:has-text("Schließen")', 'button:has-text("Weiter zum")', 'button:has-text("OK")', '.modal-close']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) await b.click().catch(() => {});
    }
    if (await weiter.isVisible().catch(() => false)) await weiter.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  // anhalten
  const pause = page.getByRole('button', { name: /^pause$/i }).first();
  if (await pause.isVisible().catch(() => false)) await pause.click().catch(() => {});
  await page.waitForTimeout(600);
  await closePopups(page);
}
const gameDate = async (page) => (await page.locator('body').innerText()).match(dateRe)?.[0];
const readSave = (slot) => JSON.parse(gunzipSync(readFileSync(join(savesDir, `${slot}.fm1975save`))).toString('utf8'));
const saveFiles = () => (existsSync(savesDir) ? readdirSync(savesDir).filter((f) => f.endsWith('.fm1975save')).map((f) => f.replace('.fm1975save', '')) : []);

console.log(`App-Test: ${target.kind} ${target.exe}`);
// --- Lauf 1: Start, Fenster, neues Spiel, speichern ---------------------------------------------
let { app, page } = await launch('Lauf 1');
check(page.url().startsWith('app://fm1975/'), `Start über ${page.url()}`);
const info = await page.evaluate(() => window.fm1975Desktop.info());
check(info.version === version && resolve(info.savesDir) === resolve(savesDir), `Hülle meldet Version ${info.version}, Spielstände in <userData>/saves`);
check((await win(app, (w) => w.getTitle())).includes(`v${version}`), 'Fenstertitel mit Versionsnummer');
check((await page.locator('.st-version').innerText()).includes(`v${version}`), `Hauptmenü zeigt „${(await page.locator('.st-version span').innerText()).trim()}“`);
check(await app.evaluate(({ Menu }) => Menu.getApplicationMenu() === null) === (target.kind !== 'unverpackt'), 'Kein Menüband im Release');
const fonts = await page.evaluate(() => Promise.all(['700 20px Antonio', '600 14px Archivo', '400 14px "Roboto Serif"', 'italic 400 14px "Roboto Serif"'].map((f) => document.fonts.load(f, 'Aäß').then((l) => l.length > 0 && l.every((x) => x.status === 'loaded'), () => false))));
check(fonts.every(Boolean), 'Schriften lokal geladen (Antonio, Archivo, Roboto Serif)');
// Vollbild-Umschalter
// (Tasten als echte Eingabe-Ereignisse des Fensters – Playwright-Tasten umgehen den Hauptprozess.)
await win(app, (w) => { w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'F11' }); w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'F11' }); });
await page.waitForTimeout(700);
const fs1 = await win(app, (w) => w.isFullScreen());
await win(app, (w) => { w.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter', modifiers: ['alt'] }); w.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter', modifiers: ['alt'] }); });
await page.waitForTimeout(700);
const fs2 = await win(app, (w) => w.isFullScreen());
check(fs1 === true && fs2 === false, `Vollbild: F11 an (${fs1}), Alt+Enter aus (${!fs2})`);
// Steam Deck 1280×800
await win(app, (w) => { w.unmaximize(); w.setContentSize(1280, 800); });
await page.waitForTimeout(500);
const vp = await page.evaluate(() => ({ w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
check(vp.w === 1280 && vp.h === 800 && vp.sw <= 1280 && vp.sh <= 800, `1280×800: Hauptmenü ohne Scrollen (${vp.w}×${vp.h}, Inhalt ${vp.sw}×${vp.sh})`);
await page.screenshot({ path: `${shots}/1_hauptmenue_1280x800.png` });

// Shows aus (Auslosung, Bewertung …), damit der Zeitlauf nicht an Fenstern hängt.
await page.evaluate(() => localStorage.setItem('fm1980_settings', JSON.stringify({ drawShow: 'aus', drawShowV: 2, ratingShow: 'aus', awardsShow: 'aus', indoorShow: 'aus', transferWindowShow: false, speedMs: 300, speedV: 1, soundEnabled: false, soundV: 1 })));
await page.reload();
await page.waitForSelector('.st-menu');
await startNewGame(page, { name: 'Desktop' });
await page.waitForTimeout(800);
const d0 = await gameDate(page);
await runTime(page, Number(process.env.RUN ?? 20));
const d1 = await gameDate(page);
check(!!d0 && !!d1 && d0 !== d1, `Neues Spiel, Zeit läuft: ${d0} → ${d1}`);
const vg = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight }));
check(vg.sw <= 1280 && vg.sh <= 800, `1280×800: Spiel ohne Scrollen (Inhalt ${vg.sw}×${vg.sh})`);
await page.screenshot({ path: `${shots}/2_spiel_1280x800.png` });
// Speichern über das Zahnrad-Menü (zweimal → Sicherung)
async function saveViaMenu() {
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(120); }
  await page.locator('.hd-gear').first().click();
  await page.waitForTimeout(200);
  await page.locator('.menu-dd-item', { hasText: 'Speichern' }).first().click();
  await page.waitForTimeout(600);
  if (await page.locator('.modal').count()) {
    const over = page.locator('button:has-text("Überschreiben")').first();
    if (await over.count()) { page.once('dialog', (d) => d.accept()); await over.click(); } else await page.locator('button:has-text("Neu speichern")').first().click();
  }
  await page.waitForTimeout(2500);
}
await saveViaMenu();
const slots1 = saveFiles();
check(slots1.length >= 1, `Gespeichert als Datei: ${slots1.map((s) => `${s}.fm1975save`).join(', ')}`);
const slot = slots1[0];
await saveViaMenu();
const saved = slot ? readSave(slot) : null;
check(!!saved?.meta?.gameDate && !!saved?.game && saved.meta.slot === slot, `Datei lesbar (gzip → JSON): ${saved?.meta?.name}, Stand ${saved?.meta?.gameDate}`);
check(existsSync(join(savesDir, `${slot}.fm1975save.bak`)) && existsSync(join(savesDir, `${slot}.meta.json`)), 'Sicherung (.bak) und Meta-Datei vorhanden');
const dSaved = await gameDate(page);
// Alte Stände für den Umzug hinterlegen: einer in localStorage, einer in IndexedDB.
const tpl = readFileSync('public/saves/test-3-jahre.txt', 'utf8');
await page.evaluate(async ({ tpl, idbJson }) => {
  localStorage.setItem('fm1980_save_altls', tpl);
  localStorage.setItem('fm1980_saves_index', JSON.stringify(['altls']));
  await new Promise((res, rej) => {
    const r = indexedDB.open('fm1975-saves', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('meta'); r.result.createObjectStore('data'); };
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const t = r.result.transaction(['meta', 'data'], 'readwrite'); t.objectStore('data').put(idbJson, 'altidb'); t.objectStore('meta').put(JSON.parse(idbJson).meta, 'altidb'); t.oncomplete = () => { r.result.close(); res(); }; t.onerror = () => rej(t.error); };
  });
}, { tpl, idbJson: JSON.stringify({ meta: { ...saved.meta, slot: 'altidb', name: 'Alt aus IndexedDB' }, game: saved.game }) });
await app.close();
ok('App beendet');

// --- Lauf 2: Neustart, Umzug, Laden ------------------------------------------------------------
({ app, page } = await launch('Lauf 2'));
await page.waitForTimeout(1500);
for (let i = 0; i < 40 && saveFiles().length < slots1.length + 2; i++) await page.waitForTimeout(500);
const slots2 = saveFiles();
check(slots2.includes('altls') && slots2.includes('altidb'), `Umzug localStorage + IndexedDB → Dateien: ${slots2.join(', ')}`);
const left = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('fm1975-saves'); r.onsuccess = () => { const q = r.result.transaction('meta').objectStore('meta').getAllKeys(); q.onsuccess = () => res({ idb: q.result, ls: !!localStorage.getItem('fm1980_save_altls') }); }; }));
check(left.idb.length === 0 && !left.ls, 'Quellen nach dem Umzug geleert');
await page.click('text=Spiel laden');
await page.waitForTimeout(500);
const rows = await page.locator('.card:has(button:has-text("Löschen"))').count();
check(rows === slots2.length, `Liste „Spiel laden“: ${rows} Stände`);
await page.locator(`.card:has(button:has-text("Löschen")):has-text("${saved.meta.name}") button:has-text("Laden")`).first().click();
await page.waitForSelector('.hd-gear', { timeout: 30000 });
await page.waitForTimeout(1200);
for (let i = 0; i < 3 && await page.locator('.bf-continue').count(); i++) { await page.locator('.bf-continue').first().click().catch(() => {}); await page.waitForTimeout(200); }
const dLoaded = await gameDate(page);
check(dLoaded === dSaved, `Stand nach Neustart geladen: ${dLoaded} (gespeichert ${dSaved})`);
await runTime(page, 8);
const d2 = await gameDate(page);
check(!!d2 && d2 !== dLoaded, `Weitergespielt: ${dLoaded} → ${d2}`);
await page.screenshot({ path: `${shots}/3_geladen.png` });
await app.close();

if (errors.length) fail(`Konsole/Netz:\n  ${[...new Set(errors)].slice(0, 20).join('\n  ')}`); else ok('Keine Konsolenfehler, keine Anfragen nach außen');
finish();
console.log('Desktop-Test bestanden.');
