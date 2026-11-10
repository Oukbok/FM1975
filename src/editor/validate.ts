// =============================================================================
// Prüfungen des Editors (zusätzlich zu validateDataset aus dem Spiel).
// =============================================================================
import { Dataset, validateDataset } from '../data/dataset/schema';
import { LEGEND_TYPES } from '../data/legends/types';
import { ALL_POSITIONS } from '../types';

/** `find` = ID/Text zum Hinspringen, `year` = Saison (Weltdaten). */
export interface Issue { level: 'error' | 'warn'; area: string; text: string; find?: string; year?: number }

const SLUG = /^[a-z0-9_-]+$/;

export function checkDataset(d: Dataset): Issue[] {
  const out: Issue[] = validateDataset(d).map((t) => ({ level: 'error' as const, area: 'Allgemein', text: t }));
  const err = (area: string, text: string, find?: string, year?: number) => out.push({ level: 'error', area, text, find, year });
  const warn = (area: string, text: string, find?: string, year?: number) => out.push({ level: 'warn', area, text, find, year });

  if (d.meta?.id && !SLUG.test(d.meta.id)) err('Allgemein', 'Die Datensatz-ID darf nur Kleinbuchstaben, Ziffern, _ und - enthalten.');
  if (d.meta?.id === 'builtin') err('Allgemein', 'Die ID „builtin“ ist reserviert – vergib eine eigene ID.');

  // Amateur-Pool: Städte eindeutig, gültige Region, nicht leer.
  if (d.poolTowns) {
    const seen = new Set<string>();
    for (const t of d.poolTowns) {
      const town = (t.town ?? '').trim();
      if (!town) { err('Amateur-Pool', 'Eine Zeile hat keine Stadt.'); continue; }
      if (seen.has(town.toLowerCase())) warn('Amateur-Pool', `Stadt doppelt: ${town}`, town);
      seen.add(town.toLowerCase());
      if (!['nord', 'west', 'sued', 'nordost'].includes(t.group)) err('Amateur-Pool', `${town}: unbekannte Region „${t.group}“.`, town);
    }
    if (d.poolTowns.length < 12) warn('Amateur-Pool', 'Weniger als 12 Städte – nach großen Reformen kann der Pool leerlaufen.');
  }

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
      if (!SLUG.test(c.id)) err('Vereine', `${name}: ID „${c.id}“ – nur Kleinbuchstaben, Ziffern, _ und -.`, c.id);
      if (all.has(c.id)) err('Vereine', `ID „${c.id}“ doppelt (${all.get(c.id)} und ${name}).`, c.id);
      all.set(c.id, name);
      if (!c.name?.trim()) err('Vereine', `${name}: Verein „${c.id}“ hat keinen Namen.`, c.id);
    }
  }
  for (const [id, eras] of Object.entries(d.crestEras ?? {})) {
    const nm = all.has(id) ? id : `${id} (unbekannte ID)`;
    const years = eras.map((e) => e.from);
    for (const e of eras) {
      if (!Number.isInteger(e.from) || e.from < 1975 || e.from > 2100) warn('Vereine', `Wappen ${nm}: Jahr ${e.from} liegt außerhalb 1975–2100.`, id);
      if (!e.crest?.startsWith('data:image/')) err('Vereine', `Wappen ${nm} ab ${e.from}: kein Bild.`, id);
    }
    if (new Set(years).size !== years.length) warn('Vereine', `Wappen ${nm}: zwei Wappen mit demselben Jahr – nur eines gilt.`, id);
  }
  for (const c of d.clubs.tier1) {
    if (c.reputation < 1 || c.reputation > 99) warn('Vereine', `${c.name}: Ansehen sollte zwischen 1 und 99 liegen.`, c.id);
    if (c.capacity < 1000) warn('Vereine', `${c.name}: Stadion mit unter 1.000 Plätzen.`, c.id);
  }

  // Europa: Starter der ersten Saison müssen existieren.
  const fsg = d.europe.firstSeasonGerman;
  for (const k of ['ec', 'cwc', 'uefa'] as const) {
    for (const id of fsg[k]) if (!all.has(id)) err('Europa', `Deutscher Starter „${id}“ (${k}) ist kein Verein des Datensatzes.`);
  }
  const euroIds = new Set<string>();
  for (const c of d.europe.clubs) {
    if (euroIds.has(c.id)) err('Europa', `Europapokal-Verein „${c.id}“ doppelt.`, c.id);
    euroIds.add(c.id);
    if (!c.id.startsWith('eu_')) err('Europa', `Europapokal-Verein „${c.id}“: IDs müssen mit eu_ beginnen.`, c.id);
    if (!d.europe.countries.some((x) => x.name === c.country)) warn('Europa', `${c.name}: Land „${c.country}“ ist nicht in der Länderliste.`, c.id);
  }
  const count = (comp: string) => d.europe.clubs.filter((c) => c.comp === comp).length;
  if (count('ec') + fsg.ec.length !== 16) warn('Europa', `Landesmeister-Pokal: ${count('ec')} + ${fsg.ec.length} deutsche Starter ≠ 16.`);
  if (count('cwc') + fsg.cwc.length !== 16) warn('Europa', `Pokalsieger-Pokal: ${count('cwc')} + ${fsg.cwc.length} deutsche Starter ≠ 16.`);
  if (count('uefa') + fsg.uefa.length !== 32) warn('Europa', `Europa-Pokal: ${count('uefa')} + ${fsg.uefa.length} deutsche Starter ≠ 32.`);
  for (const c of d.europe.countries) {
    if (c.tier1 % 2 || c.tier2 % 2) err('Europa', `${c.name}: Ligagrößen müssen gerade sein.`, c.name);
  }

  // Jahre plausibel.
  const yr = (area: string, label: string, y: number | undefined) => {
    if (y != null && (y < 1975 || y > 2100)) warn(area, `${label}: Jahr ${y} liegt außerhalb 1975–2100.`);
  };
  const tl = new Set<string>();
  for (const e of d.timeline) {
    yr('Chronik', e.title, e.year);
    if (!/^\d{4}\/\d{2}$/.test(e.season)) err('Chronik', `${e.title}: Saison „${e.season}“ muss die Form 1995/96 haben.`, e.id);
    if (tl.has(e.id)) err('Chronik', `Ereignis-ID „${e.id}“ doppelt.`, e.id);
    tl.add(e.id);
  }
  for (const f of d.facilities) {
    yr('Einrichtungen', f.name, f.unlockYear); yr('Einrichtungen', f.name, f.obsoleteYear);
    if (f.unlockYear && f.obsoleteYear && f.obsoleteYear <= f.unlockYear) err('Einrichtungen', `${f.name}: veraltet vor der Freischaltung.`, f.key);
  }
  for (const r of d.staff) {
    yr('Mitarbeiter', r.name, r.unlockYear); yr('Mitarbeiter', r.name, r.obsoleteYear);
    if (r.obsoleteYear && r.obsoleteYear <= r.unlockYear) err('Mitarbeiter', `${r.name}: veraltet vor der Freischaltung.`, r.id);
  }
  for (const m of d.marketing) {
    yr('Marketing', m.name, m.unlockYear); yr('Marketing', m.name, m.obsoleteYear);
    if (m.obsoleteYear && m.obsoleteYear <= m.unlockYear) err('Marketing', `${m.name}: veraltet vor der Freischaltung.`, m.id);
  }

  // Erlös-Mix: Summe der drei Anteile etwa 0,9 (Rest = Prämien/Beiträge).
  for (const m of d.economy.revenueMix) {
    const s = m.matchday + m.tv + m.commercial;
    if (Math.abs(s - 0.9) > 0.06) warn('Wirtschaft', `Erlös-Mix ${m.year}: Summe ${s.toFixed(2)} (erwartet etwa 0,90).`);
  }
  // Namen: Herkünfte der Mischung müssen existieren.
  const origins = new Set(d.names.origins.map((o) => o.id));
  for (const [y, mix] of d.names.mix) for (const k of Object.keys(mix)) if (!origins.has(k)) err('Namen', `Mischung ${y}: Herkunft „${k}“ existiert nicht.`);
  for (const o of d.names.origins) if (!o.first.length || !o.last.length) err('Namen', `Herkunft „${o.id}“ braucht Vor- und Nachnamen.`, o.id);
  for (const o of d.names.origins) {
    const eras = o.firstByEra ?? [];
    for (let i = 0; i < eras.length; i++) {
      if (!eras[i][1]?.length) warn('Namen', `Herkunft „${o.id}“: Jahrgangsstufe ${eras[i][0]} hat keine Vornamen.`);
      if (i > 0 && eras[i][0] <= eras[i - 1][0]) warn('Namen', `Herkunft „${o.id}“: Jahrgangsstufen nicht aufsteigend (${eras[i - 1][0]} → ${eras[i][0]}).`);
    }
  }

  // Legenden (Ausnahmetalente): Pflichtfelder, Wertebereiche, Verein passend zum Land.
  const lids = new Set<string>(), lnames = new Set<string>();
  const west = new Set([...d.clubs.tier1, ...d.clubs.secondNord, ...d.clubs.secondSued].map((c) => c.id));
  const east = new Set([...d.clubs.ddrOberliga, ...d.clubs.ddrLiga].map((c) => c.id));
  for (const l of d.legendsV2 ?? []) {
    const nm = `${l.firstName ?? ''} ${l.lastName ?? ''}`.trim() || l.id || '?';
    const A = 'Legenden';
    if (!l.id || !SLUG.test(l.id)) err(A, `${nm}: ID „${l.id ?? ''}“ – nur Kleinbuchstaben, Ziffern, _ und -.`, l.id);
    if (lids.has(l.id)) err(A, `ID „${l.id}“ doppelt.`, l.id);
    lids.add(l.id);
    if (!l.firstName?.trim() || !l.lastName?.trim()) err(A, `${l.id}: Vor- und Nachname fehlen.`, l.id);
    if (lnames.has(nm)) warn(A, `Name „${nm}“ doppelt.`, l.id);
    lnames.add(nm);
    const bt = Date.parse(`${l.birth}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l.birth ?? '') || !Number.isFinite(bt) || new Date(bt).toISOString().slice(0, 10) !== l.birth) err(A, `${nm}: Geburtsdatum „${l.birth ?? ''}“ muss ein gültiges Datum JJJJ-MM-TT sein.`, l.id);
    else {
      const y = Number(l.birth.slice(0, 4));
      if (y < 1940 || y > 2085) warn(A, `${nm}: Geburtsjahr ${y} – vor 1941 Geborene erscheinen nicht (1975 älter als 34).`, l.id);
    }
    if (!ALL_POSITIONS.includes(l.pos)) err(A, `${nm}: unbekannte Position „${l.pos}“.`, l.id);
    for (const p of l.pos2 ?? []) if (!ALL_POSITIONS.includes(p)) err(A, `${nm}: unbekannte Nebenposition „${p}“.`, l.id);
    if (!LEGEND_TYPES.some((t) => t.id === l.type)) err(A, `${nm}: unbekannter Spielertyp „${l.type}“.`, l.id);
    if (!(l.potential >= 50 && l.potential <= 99)) err(A, `${nm}: Potenzial ${l.potential} muss zwischen 50 und 99 liegen.`, l.id);
    else if (l.potential < 80) warn(A, `${nm}: Potenzial unter 80 – kein Ausnahmetalent.`, l.id);
    for (const k of ['maturity', 'longevity'] as const) if (!(l[k] >= -1 && l[k] <= 1)) err(A, `${nm}: ${k === 'maturity' ? 'Frühreife' : 'Langlebigkeit'} muss zwischen −1 und 1 liegen.`, l.id);
    for (const [k, v] of Object.entries(l.hidden ?? {})) if (!(typeof v === 'number' && v >= 0 && v <= 100)) err(A, `${nm}: verdeckter Wert „${k}“ muss zwischen 0 und 100 liegen.`, l.id);
    if (!l.hidden) err(A, `${nm}: verdeckte Werte fehlen.`, l.id);
    if (l.club) {
      const ok = l.country === 'GER' ? west.has(l.club) : l.country === 'DDR' ? west.has(l.club) || east.has(l.club) : false;
      if (!ok) err(A, `${nm}: Jugendverein „${l.club}“ gehört nicht zu den Vereinen seines Landes im Datensatz.`, l.id);
    }
  }

  // Weltdaten: IDs eindeutig, jede Saison nur bekannte Vereine, gerade Ligagrößen.
  for (const [cc, w] of Object.entries(d.worldData ?? {})) {
    const A = `Weltdaten ${cc}`;
    const ids = new Set<string>();
    for (const c of w.clubs ?? []) {
      if (!c.id || !SLUG.test(c.id)) err(A, `Vereins-ID „${c.id ?? ''}“ – nur Kleinbuchstaben, Ziffern, _ und -.`, c.id);
      if (ids.has(c.id)) err(A, `ID „${c.id}“ doppelt.`, c.id);
      ids.add(c.id);
      if (!c.name?.trim()) err(A, `Verein „${c.id}“ hat keinen Namen.`, c.id);
    }
    // Deutschland nutzt ab 1991/92 die IDs der DDR-Vereine (und umgekehrt).
    const partner = cc === 'ger' ? 'gdr' : cc === 'gdr' ? 'ger' : '';
    const known = new Set([...ids, ...(partner ? (d.worldData?.[partner]?.clubs ?? []).map((c) => c.id) : [])]);
    for (const [y, r] of Object.entries(w.seasons ?? {})) {
      const lists: [string, string[] | undefined][] = [['1. Liga', r.t1], ['2. Liga', r.t2], ['2. Liga (2. Staffel)', r.t2b]];
      const seen = new Set<string>();
      for (const [nm, l] of lists) {
        if (!l) continue;
        if (l.length % 2) warn(A, `${y}: ${nm} mit ungerader Zahl (${l.length}) – der Letzte fällt im Spiel weg.`, undefined, Number(y));
        for (const id of l) {
          if (!known.has(id)) err(A, `${y}: ${nm} – unbekannte ID „${id}“.`, id, Number(y));
          if (seen.has(id)) err(A, `${y}: „${id}“ steht in mehreren Ligen.`, id, Number(y));
          seen.add(id);
        }
      }
      for (const id of [r.cup, r.cupFinalist, ...Object.values(r.euro ?? {}).flat()]) if (id && !known.has(id)) err(A, `${y}: Pokal/Europapokal – unbekannte ID „${id}“.`, id, Number(y));
    }
  }

  // Leere Listen ersetzt das Spiel beim Anwenden durch den Standard.
  const empties: [string, unknown[]][] = [
    ['DDR-Oberliga', d.clubs.ddrOberliga], ['DDR-Liga', d.clubs.ddrLiga], ['Europa: Teilungen', d.europe.splits],
    ['Europa: Sperren', d.europe.exclusions], ['Chronik', d.timeline], ['Ligareformen', d.leagues.reforms],
    ['Mitarbeiter', d.staff], ['Marketing', d.marketing],
  ];
  for (const [area, list] of empties) if (!list.length) warn(area, 'Leere Liste – das Spiel verwendet dafür die Einträge des Standards.');
  return out;
}
