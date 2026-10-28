// =============================================================================
// 1975 – A Football Manager · Desktop-Hülle (Windows/Steam-Vorbereitung)
// -----------------------------------------------------------------------------
// Lädt das gebaute Spiel aus ../dist über ein eigenes Protokoll (app://fm1975/),
// damit Spielstände (localStorage) und Datensätze/Wappen (IndexedDB) einen
// festen Ursprung haben. Sie liegen dann im Benutzerordner von Electron
// (Windows: %APPDATA%\1975 A Football Manager). Kein Server, kein Netzwerk nötig.
// =============================================================================
const { app, BrowserWindow, protocol, net, Menu, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DIST = app.isPackaged ? path.join(process.resourcesPath, 'dist') : path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1600, height: 900, minWidth: 1280, minHeight: 720,
    backgroundColor: '#0b111a', title: '1975 – A Football Manager',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  win.loadURL('app://fm1975/index.html');
  // Externe Links (Wiki-Verweise o. Ä.) im Standardbrowser öffnen.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('app://')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url);
    let rel = decodeURIComponent(pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST)) return new Response('Nicht erlaubt', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Spiel', submenu: [
      { label: 'Datensatz-Editor', click: () => { const w = new BrowserWindow({ width: 1500, height: 900, autoHideMenuBar: true }); w.loadURL('app://fm1975/editor/index.html'); } },
      { label: 'Spielstand-Ordner öffnen', click: () => shell.openPath(app.getPath('userData')) },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Vollbild' },
      { role: 'quit', label: 'Beenden' },
    ] },
  ]));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
