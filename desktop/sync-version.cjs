// Eine Quelle für die Versionsnummer: ../package.json. Vor jedem Desktop-Build wird sie hierher übernommen
// (Fenstertitel, Installer-Name, Windows-Dateieigenschaften). `--check` prüft nur (Test).
const fs = require('node:fs');
const path = require('node:path');
const root = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version;
const file = path.join(__dirname, 'package.json');
const text = fs.readFileSync(file, 'utf8');
const own = JSON.parse(text).version;
if (own === root) { console.log(`Version ${root}`); process.exit(0); }
if (process.argv.includes('--check')) { console.error(`desktop/package.json hat ${own}, package.json hat ${root} – „npm run sync“ in desktop/ ausführen.`); process.exit(1); }
fs.writeFileSync(file, text.replace(/("version":\s*")[^"]+(")/, `$1${root}$2`));
console.log(`Version ${own} → ${root}`);
