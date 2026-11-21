// =============================================================================
// 1975 – A Football Manager · Desktop-Hülle (Windows/Linux, Ziel Steam inkl. Steam Deck)
// -----------------------------------------------------------------------------
// Lädt das gebaute Spiel aus ../dist über ein eigenes Protokoll (app://fm1975/),
// damit Einstellungen (localStorage) und Datensätze/Wappen (IndexedDB) einen festen
// Ursprung haben. Spielstände liegen als Dateien in <userData>/saves (saves.cjs),
// die Oberfläche erreicht sie über preload.cjs. Kein Server, kein Netzwerk nötig.
// =============================================================================
const { app, BrowserWindow, protocol, net, Menu, shell, ipcMain, dialog, screen, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSaveFiles } = require('./saves.cjs');

const ORIGIN = 'app://fm1975/';
const TITLE = `1975 – A Football Manager · v${app.getVersion()}`;
const DIST = app.isPackaged ? path.join(process.resourcesPath, 'dist') : path.join(__dirname, '..', 'dist');

// Tests (tests/desktop-test.mjs) nutzen einen eigenen Benutzerordner und keine Rückfrage beim Beenden.
if (process.env.FM1975_USER_DATA) app.setPath('userData', path.resolve(process.env.FM1975_USER_DATA));
const TEST = process.env.FM1975_TEST === '1';

protocol.registerSchemesAsPrivileged([
  // corsEnabled: ES-Module (app.js + nachgeladene Stücke in chunks/, Code-Splitting) laden im CORS-Modus.
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } },
]);

let mainWin = null;
let inGame = false;

const toggleFullscreen = (win) => win.setFullScreen(!win.isFullScreen());

/** F11 und Alt+Enter schalten Vollbild/Fenster um (das Menüband gibt es im Release nicht). */
function bindKeys(win) {
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    if (input.key === 'F11' || (input.key === 'Enter' && input.alt && !input.control && !input.meta)) {
      e.preventDefault();
      toggleFullscreen(win);
    }
  });
  // Fenstertitel mit Versionsnummer behalten (die Seite setzt sonst ihren eigenen <title>).
  win.on('page-title-updated', (e) => e.preventDefault());
}

function createWindow() {
  const area = screen.getPrimaryDisplay().workAreaSize;
  const small = area.width < 1600 || area.height < 900; // z. B. Steam Deck 1280×800
  const win = new BrowserWindow({
    width: Math.min(1600, area.width), height: Math.min(900, area.height),
    minWidth: Math.min(1280, area.width), minHeight: Math.min(720, area.height),
    useContentSize: true, show: false,
    backgroundColor: '#0b111a', title: TITLE,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, preload: path.join(__dirname, 'preload.cjs') },
  });
  mainWin = win;
  bindKeys(win);
  win.once('ready-to-show', () => { if (small) win.maximize(); win.show(); });
  win.loadURL(`${ORIGIN}index.html`);
  // Editor (app://) in eigenem Fenster, alles andere im Standardbrowser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(ORIGIN)) return { action: 'allow', overrideBrowserWindowOptions: { width: 1500, height: 900, autoHideMenuBar: true, backgroundColor: '#0b111a', webPreferences: { contextIsolation: true, sandbox: true } } };
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ORIGIN)) e.preventDefault(); });
  // Rückfrage nur, wenn gerade ein Spiel läuft.
  win.on('close', (e) => {
    if (TEST || !inGame) return;
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question', buttons: ['Beenden', 'Abbrechen'], defaultId: 1, cancelId: 1, noLink: true,
      title: 'Spiel beenden', message: 'Spiel wirklich beenden?', detail: 'Nicht gespeicherter Fortschritt geht verloren.',
    });
    if (choice !== 0) e.preventDefault();
  });
  win.on('closed', () => { if (mainWin === win) mainWin = null; });
}

/** IPC nur vom Spiel selbst (app://fm1975/) annehmen. */
function handle(channel, fn) {
  ipcMain.handle(channel, (e, ...args) => {
    const url = e.senderFrame?.url ?? '';
    if (!url.startsWith(ORIGIN)) throw new Error('Nicht erlaubt');
    return fn(e, ...args);
  });
}

function registerIpc() {
  const saves = createSaveFiles(path.join(app.getPath('userData'), 'saves'));
  handle('fm:info', () => ({ version: app.getVersion(), platform: process.platform, savesDir: saves.dir, electron: process.versions.electron }));
  handle('fm:saves:list', () => saves.list());
  handle('fm:saves:read', (_e, slot) => saves.read(slot));
  handle('fm:saves:write', (_e, slot, meta, json) => saves.write(slot, meta, json));
  handle('fm:saves:remove', (_e, slot) => saves.remove(slot));
  handle('fm:saves:openFolder', () => shell.openPath(saves.dir));
  handle('fm:fullscreen', (e, on) => { BrowserWindow.fromWebContents(e.sender)?.setFullScreen(!!on); });
  handle('fm:inGame', (_e, on) => { inGame = !!on; });
  handle('fm:quit', () => { mainWin?.close(); });
}

function registerProtocol() {
  protocol.handle('app', async (req) => {
    const { pathname } = new URL(req.url);
    let rel = decodeURIComponent(pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(DIST, rel));
    if (file !== DIST && !file.startsWith(DIST + path.sep)) return new Response('Nicht erlaubt', { status: 403 });
    let res;
    try { res = await net.fetch(pathToFileURL(file).toString()); } catch { return new Response('Nicht gefunden', { status: 404 }); }
    // Module-Skripte verlangen einen JavaScript-MIME-Typ – nicht auf die Erkennung verlassen.
    if (res.ok && /\.m?js$/.test(file)) {
      return new Response(res.body, { status: 200, headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
    }
    return res;
  });
}

/** Release: kein Menüband. Entwicklung (`npm start`): kleines Menü mit Werkzeugen. */
function buildMenu() {
  if (app.isPackaged) { Menu.setApplicationMenu(null); return; }
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Spiel', submenu: [
      { label: 'Spielstand-Ordner öffnen', click: () => shell.openPath(path.join(app.getPath('userData'), 'saves')) },
      { label: 'Vollbild (F11)', click: () => mainWin && toggleFullscreen(mainWin) },
      { type: 'separator' },
      { role: 'reload', label: 'Neu laden' },
      { role: 'toggleDevTools', label: 'Entwicklerwerkzeuge' },
      { role: 'quit', label: 'Beenden' },
    ] },
  ]));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (mainWin) { if (mainWin.isMinimized()) mainWin.restore(); mainWin.focus(); } });
  app.whenReady().then(() => {
    // Das Spiel braucht kein Netz (Schriften liegen lokal, siehe offline-fonts.cjs) – nichts geht nach draußen.
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_d, cb) => cb({ cancel: true }));
    registerProtocol();
    registerIpc();
    buildMenu();
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
}
