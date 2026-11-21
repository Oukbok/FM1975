// Brücke Oberfläche ↔ Hauptprozess (contextIsolation + sandbox): nur diese Funktionen sind im Spiel sichtbar.
// Gegenstück: src/engine/saveStore.ts (DesktopApi) und desktop/main.cjs (ipcMain.handle).
const { contextBridge, ipcRenderer } = require('electron');

const call = (ch) => (...args) => ipcRenderer.invoke(ch, ...args);

contextBridge.exposeInMainWorld('fm1975Desktop', {
  /** { version, platform, savesDir } */
  info: call('fm:info'),
  saves: {
    list: call('fm:saves:list'),
    read: call('fm:saves:read'),
    write: call('fm:saves:write'),
    remove: call('fm:saves:remove'),
    openFolder: call('fm:saves:openFolder'),
  },
  setFullscreen: call('fm:fullscreen'),
  /** Läuft gerade ein Spiel? (Rückfrage beim Schließen des Fensters) */
  setInGame: call('fm:inGame'),
  quit: call('fm:quit'),
});
