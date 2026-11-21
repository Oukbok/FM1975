// =============================================================================
// Spielstände als Dateien (Desktop-Fassung, Grundlage für Steam-Cloud)
// -----------------------------------------------------------------------------
// Ordner: <userData>/saves/
//   <slot>.fm1975save        gzip-komprimiertes JSON { meta, game }
//   <slot>.fm1975save.bak    vorherige Fassung (Sicherung, wird beim Lesen als Rückfall genutzt)
//   <slot>.meta.json         Metadaten für die schnelle Liste (lässt sich aus dem Stand neu erzeugen)
// Schreiben ist atomar: erst <datei>.tmp vollständig schreiben + fsync, alte Datei nach .bak,
// dann umbenennen. gzip/gunzip laufen asynchron im Thread-Pool von Node – weder Hauptprozess
// noch Oberfläche warten darauf. Schreibvorgänge je Slot laufen nacheinander.
// =============================================================================
const fs = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');
const { promisify } = require('node:util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const EXT = '.fm1975save';
const SLOT_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

function createSaveFiles(dir) {
  const queues = new Map();
  let ready = null;
  const ensure = () => (ready ??= fs.mkdir(dir, { recursive: true }));
  const file = (slot, suffix = EXT) => {
    if (typeof slot !== 'string' || !SLOT_RE.test(slot)) throw new Error(`Ungültiger Slot: ${slot}`);
    return path.join(dir, slot + suffix);
  };
  // Nacheinander je Slot (Autosave und Handspeichern dürfen sich nicht überholen).
  const queued = (slot, job) => {
    const next = (queues.get(slot) ?? Promise.resolve()).catch(() => {}).then(job);
    queues.set(slot, next);
    next.finally(() => { if (queues.get(slot) === next) queues.delete(slot); }).catch(() => {});
    return next;
  };
  async function writeAtomic(target, data, backup) {
    const tmp = `${target}.tmp`;
    const fh = await fs.open(tmp, 'w');
    try { await fh.writeFile(data); await fh.sync(); } finally { await fh.close(); }
    if (backup) { try { await fs.copyFile(target, `${target}.bak`); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
    await fs.rename(tmp, target);
  }
  async function readJson(target) {
    return (await gunzip(await fs.readFile(target))).toString('utf8');
  }

  /** Stand lesen; ist die Datei beschädigt oder fehlt sie, die Sicherung nehmen. */
  async function read(slot) {
    await ensure();
    const target = file(slot);
    try { return await readJson(target); } catch (e) {
      try { return await readJson(`${target}.bak`); } catch { if (e.code === 'ENOENT') return null; throw e; }
    }
  }
  function write(slot, meta, json) {
    const target = file(slot);
    if (typeof json !== 'string' || !json) throw new Error('Leerer Spielstand');
    return queued(slot, async () => {
      await ensure();
      await writeAtomic(target, await gzip(Buffer.from(json, 'utf8'), { level: 6 }), true);
      await writeAtomic(file(slot, '.meta.json'), JSON.stringify(meta ?? null), false);
    });
  }
  function remove(slot) {
    const target = file(slot);
    return queued(slot, async () => {
      for (const f of [target, `${target}.bak`, `${target}.tmp`, file(slot, '.meta.json')]) await fs.rm(f, { force: true });
    });
  }
  /** Metadaten aller Stände; fehlt die Meta-Datei (z. B. aus der Cloud nur der Stand), wird sie neu erzeugt. */
  async function list() {
    await ensure();
    const out = [];
    for (const name of await fs.readdir(dir)) {
      if (!name.endsWith(EXT)) continue;
      const slot = name.slice(0, -EXT.length);
      if (!SLOT_RE.test(slot)) continue;
      let meta = null;
      try { meta = JSON.parse(await fs.readFile(file(slot, '.meta.json'), 'utf8')); } catch { /* neu erzeugen */ }
      if (!meta || typeof meta !== 'object') {
        try {
          meta = JSON.parse(await read(slot))?.meta ?? null;
          if (meta) await writeAtomic(file(slot, '.meta.json'), JSON.stringify(meta), false);
        } catch { meta = null; }
      }
      if (meta && typeof meta === 'object') out.push({ ...meta, slot });
    }
    return out;
  }
  return { dir, list, read, write, remove };
}

module.exports = { createSaveFiles, EXT };
