// =============================================================================
// Stützwerte der Weltrangliste (data/eloAnchors.ts) aus echten Länderspiel-
// ergebnissen nachrechnen – Verfahren wie die World Football Elo Ratings
// (Quellen und Formel: docs/research/weltrangliste.md).
// Aufruf: node scripts/elo-anchors.mjs <pfad/zu/results.csv>
//   (CSV = öffentlicher Ergebnisdatensatz „international_results“, Spalten
//    date,home_team,away_team,home_score,away_score,tournament,city,country,neutral)
// Ausgabe: TypeScript-Zeilen `CODE: [1975, 1985, 1995, 2005, 2015, 2025],` – Wert je
// Stichtag 1. Juli (Saisonstart); 0 = Nation bestand an dem Tag nicht.
// =============================================================================
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) { console.error('Pfad zur results.csv fehlt'); process.exit(1); }

// Spielkürzel → Name im Datensatz (Sowjetunion steht dort als „Russia“, die BRD als „Germany“).
const NAMES = {
  GER: 'Germany', GDR: 'German DR', ENG: 'England', SCO: 'Scotland', WAL: 'Wales', NIR: 'Northern Ireland', IRL: 'Republic of Ireland',
  NED: 'Netherlands', BEL: 'Belgium', FRA: 'France', ESP: 'Spain', POR: 'Portugal', ITA: 'Italy', AUT: 'Austria', SUI: 'Switzerland',
  SWE: 'Sweden', DEN: 'Denmark', NOR: 'Norway', FIN: 'Finland', ISL: 'Iceland', POL: 'Poland', HUN: 'Hungary', TCH: 'Czechoslovakia',
  CZE: 'Czech Republic', SVK: 'Slovakia', YUG: 'Yugoslavia', SRB: 'Serbia', CRO: 'Croatia', SVN: 'Slovenia', BIH: 'Bosnia and Herzegovina',
  MKD: 'North Macedonia', URS: 'Russia', RUS: 'Russia', UKR: 'Ukraine', ROU: 'Romania', BUL: 'Bulgaria', GRE: 'Greece', TUR: 'Turkey',
  ALB: 'Albania', ISR: 'Israel', BRA: 'Brazil', ARG: 'Argentina', URU: 'Uruguay', CHI: 'Chile', COL: 'Colombia', PER: 'Peru',
  PAR: 'Paraguay', ECU: 'Ecuador', MEX: 'Mexico', USA: 'United States', CAN: 'Canada', CRC: 'Costa Rica', NGA: 'Nigeria',
  CMR: 'Cameroon', GHA: 'Ghana', CIV: 'Ivory Coast', SEN: 'Senegal', MAR: 'Morocco', ALG: 'Algeria', TUN: 'Tunisia', EGY: 'Egypt',
  RSA: 'South Africa', JPN: 'Japan', KOR: 'South Korea', IRN: 'Iran', KSA: 'Saudi Arabia', QAT: 'Qatar', CHN: 'China', AUS: 'Australia',
  NZL: 'New Zealand',
};
// Fortsetzung wie bei eloratings: Nachfolger übernimmt die Punkte des Vorgängers.
const INHERIT = { 'Czech Republic': 'Czechoslovakia', Serbia: 'Yugoslavia' };
// Bestehen im Spiel (Stichtag zählt nur, wenn die Nation im Spiel besteht).
const SPAN = { GDR: [0, 1990], TCH: [0, 1992], CZE: [1993, 9999], SVK: [1993, 9999], YUG: [0, 1991], SRB: [1992, 9999], CRO: [1992, 9999], SVN: [1992, 9999], BIH: [1995, 9999], MKD: [1993, 9999], URS: [0, 1991], RUS: [1992, 9999], UKR: [1992, 9999], RSA: [1992, 9999] };

function kOf(t) {
  if (t === 'FIFA World Cup') return 60;
  if (/qualification/i.test(t)) return 40;
  if (['UEFA Euro', 'Copa América', 'African Cup of Nations', 'AFC Asian Cup', 'Gold Cup', 'CONCACAF Championship', 'Confederations Cup', 'Oceania Nations Cup'].includes(t)) return 50;
  if (t === 'UEFA Nations League' || t === 'CONCACAF Nations League') return 40;
  if (t === 'Friendly') return 20;
  return 30;
}
const gdMul = (n) => (n <= 1 ? 1 : n === 2 ? 1.5 : (11 + n) / 8);

const rows = readFileSync(file, 'utf8').split('\n').slice(1).filter(Boolean).map((l) => l.split(','));
rows.sort((a, b) => a[0].localeCompare(b[0]));
const R = new Map();
const get = (t) => {
  if (!R.has(t)) R.set(t, INHERIT[t] && R.has(INHERIT[t]) ? R.get(INHERIT[t]) : 1500);
  return R.get(t);
};
const YEARS = [1975, 1985, 1995, 2005, 2015, 2025];
const snaps = [];
let yi = 0;
for (const r of rows) {
  const [date, home, away, hs, as, tour, , , neutral] = r;
  while (yi < YEARS.length && date >= `${YEARS[yi]}-07-01`) { snaps.push(new Map(R)); yi++; }
  const gh = parseInt(hs, 10), ga = parseInt(as, 10);
  if (Number.isNaN(gh) || Number.isNaN(ga)) continue;
  const rh = get(home), ra = get(away);
  const dr = rh - ra + (neutral === 'TRUE' ? 0 : 100);
  const we = 1 / (10 ** (-dr / 400) + 1);
  const w = gh > ga ? 1 : gh < ga ? 0 : 0.5;
  const p = kOf(tour) * gdMul(Math.abs(gh - ga)) * (w - we);
  R.set(home, rh + p); R.set(away, ra - p);
}
while (yi < YEARS.length) { snaps.push(new Map(R)); yi++; }

for (const [code, name] of Object.entries(NAMES)) {
  const span = SPAN[code] ?? [0, 9999];
  const vals = YEARS.map((y, i) => (y >= span[0] && y <= span[1] && snaps[i].has(name) ? Math.round(snaps[i].get(name)) : 0));
  console.log(`  ${code}: [${vals.join(', ')}],`);
}
