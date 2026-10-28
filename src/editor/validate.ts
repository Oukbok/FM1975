// =============================================================================
// Prüfungen des Editors (zusätzlich zu validateDataset aus dem Spiel).
// =============================================================================
import { Dataset, validateDataset } from '../data/dataset/schema';

export interface Issue { level: 'error' | 'warn'; area: string; text: string }

const SLUG = /^[a-z0-9_-]+$/;

export function checkDataset(d: Dataset): Issue[] {
  const out: Issue[] = validateDataset(d).map((t) => ({ level: 'error' as const, area: 'Allgemein', text: t }));
  const err = (area: string, text: string) => out.push({ level: 'error', area, text });
  const warn = (area: string, text: string) => out.push({ level: 'warn', area, text });

  if (d.meta?.id && !SLUG.test(d.meta.id)) err('Allgemein', 'Die Datensatz-ID darf nur Kleinbuchstaben, Ziffern, _ und - enthalten.');
  if (d.meta?.id === 'builtin') err('Allgemein', 'Die ID „builtin“ ist reserviert – vergib eine eigene ID.');

  // Vereine: eindeutige IDs über alle deutschen Ligen, Slug-Form, gerade Ligagrößen.
  const lists: [string, { id: string; name: string }[]][] = [
    ['1. Liga', d.clubs.tier1], ['2. Liga Nord', d.clubs.secondNord], ['2. Liga Süd', d.clubs.secondSued],
    ['DDR-Oberliga', d.clubs.ddrOberliga], ['DDR-Liga', d.clubs.ddrLiga],
  ];
  const all = new Map<string, string>();
  for (const [name, l] of lists) {
    if (l.length % 2 !== 0) err('Vereine', `${name}: ungerade Zahl an Vereinen (${l.length}).`);
    for (const c of l) {
      if (!c.id) { err('Vereine', `${name}: Verein ohne ID.`); continue; }
      if (!SLUG.test(c.id)) err('Vereine', `${name}: ID „${c.id}“ – nur Kleinbuchstaben, Ziffern, _ und -.`);
      if (all.has(c.id)) err('Vereine', `ID „${c.id}“ doppelt (${all.get(c.id)} und ${name}).`);
      all.set(c.id, name);
      if (!c.name?.trim()) err('Vereine', `${name}: Verein „${c.id}“ hat keinen Namen.`);
    }
  }
  for (const c of d.clubs.tier1) {
    if (c.reputation < 1 || c.reputation > 99) warn('Vereine', `${c.name}: Ansehen sollte zwischen 1 und 99 liegen.`);
    if (c.capacity < 1000) warn('Vereine', `${c.name}: Stadion mit unter 1.000 Plätzen.`);
  }

  // Europa: Starter der ersten Saison müssen existieren.
  const fsg = d.europe.firstSeasonGerman;
  for (const k of ['ec', 'cwc', 'uefa'] as const) {
    for (const id of fsg[k]) if (!all.has(id)) err('Europa', `Deutscher Starter „${id}“ (${k}) ist kein Verein des Datensatzes.`);
  }
  const euroIds = new Set<string>();
  for (const c of d.europe.clubs) {
    if (euroIds.has(c.id)) err('Europa', `Europapokal-Verein „${c.id}“ doppelt.`);
    euroIds.add(c.id);
    if (!c.id.startsWith('eu_')) err('Europa', `Europapokal-Verein „${c.id}“: IDs müssen mit eu_ beginnen.`);
    if (!d.europe.countries.some((x) => x.name === c.country)) warn('Europa', `${c.name}: Land „${c.country}“ ist nicht in der Länderliste.`);
  }
  const count = (comp: string) => d.europe.clubs.filter((c) => c.comp === comp).length;
  if (count('ec') + fsg.ec.length !== 16) warn('Europa', `Landesmeister-Pokal: ${count('ec')} + ${fsg.ec.length} deutsche Starter ≠ 16.`);
  if (count('cwc') + fsg.cwc.length !== 16) warn('Europa', `Pokalsieger-Pokal: ${count('cwc')} + ${fsg.cwc.length} deutsche Starter ≠ 16.`);
  if (count('uefa') + fsg.uefa.length !== 32) warn('Europa', `Europa-Pokal: ${count('uefa')} + ${fsg.uefa.length} deutsche Starter ≠ 32.`);
  for (const c of d.europe.countries) {
    if (c.tier1 % 2 || c.tier2 % 2) err('Europa', `${c.name}: Ligagrößen müssen gerade sein.`);
  }

  // Jahre plausibel.
  const yr = (area: string, label: string, y: number | undefined) => {
    if (y != null && (y < 1975 || y > 2100)) warn(area, `${label}: Jahr ${y} liegt außerhalb 1975–2100.`);
  };
  const tl = new Set<string>();
  for (const e of d.timeline) {
    yr('Chronik', e.title, e.year);
    if (!/^\d{4}\/\d{2}$/.test(e.season)) err('Chronik', `${e.title}: Saison „${e.season}“ muss die Form 1995/96 haben.`);
    if (tl.has(e.id)) err('Chronik', `Ereignis-ID „${e.id}“ doppelt.`);
    tl.add(e.id);
  }
  for (const f of d.facilities) {
    yr('Einrichtungen', f.name, f.unlockYear); yr('Einrichtungen', f.name, f.obsoleteYear);
    if (f.unlockYear && f.obsoleteYear && f.obsoleteYear <= f.unlockYear) err('Einrichtungen', `${f.name}: veraltet vor der Freischaltung.`);
  }
  for (const r of d.staff) {
    yr('Mitarbeiter', r.name, r.unlockYear); yr('Mitarbeiter', r.name, r.obsoleteYear);
    if (r.obsoleteYear && r.obsoleteYear <= r.unlockYear) err('Mitarbeiter', `${r.name}: veraltet vor der Freischaltung.`);
  }
  for (const m of d.marketing) {
    yr('Marketing', m.name, m.unlockYear); yr('Marketing', m.name, m.obsoleteYear);
    if (m.obsoleteYear && m.obsoleteYear <= m.unlockYear) err('Marketing', `${m.name}: veraltet vor der Freischaltung.`);
  }
  for (const l of d.legends) if (l.birthYear < 1955 || l.birthYear > 2085) warn('Legenden', `${l.firstName} ${l.lastName}: Geburtsjahr ${l.birthYear} ungewöhnlich.`);

  // Erlös-Mix: Summe der drei Anteile etwa 0,9 (Rest = Prämien/Beiträge).
  for (const m of d.economy.revenueMix) {
    const s = m.matchday + m.tv + m.commercial;
    if (Math.abs(s - 0.9) > 0.06) warn('Wirtschaft', `Erlös-Mix ${m.year}: Summe ${s.toFixed(2)} (erwartet etwa 0,90).`);
  }
  // Namen: Herkünfte der Mischung müssen existieren.
  const origins = new Set(d.names.origins.map((o) => o.id));
  for (const [y, mix] of d.names.mix) for (const k of Object.keys(mix)) if (!origins.has(k)) err('Namen', `Mischung ${y}: Herkunft „${k}“ existiert nicht.`);
  for (const o of d.names.origins) if (!o.first.length || !o.last.length) err('Namen', `Herkunft „${o.id}“ braucht Vor- und Nachnamen.`);
  return out;
}
