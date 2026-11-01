// =============================================================================
// SAISON-BRIEFING — „Neu im Spiel“: automatisch aus den Spieldaten abgeleitet
// -----------------------------------------------------------------------------
// Was ändert sich zur Saison IM SPIEL? Nicht redaktionell, sondern aus denselben
// Tabellen, die die Mechaniken steuern:
//   Chronik-Meilensteine (data/timeline.ts) · Ligareformen (data/reforms.ts) ·
//   Trainingslager-Ziele (data/campDestinations.ts) · Hallenfußball
//   (data/indoorHistory.ts) · Nachwuchs-Bausteine + NLZ-Pflicht
//   (engine/youthAcademy.ts) · Stadionumfeld + Lizenzauflagen
//   (data/groundsCatalog.ts) · Einrichtungen (engine/infrastructure.ts) ·
//   Währung DM → EUR (engine/economy.ts).
// Diese Liste ersetzt die früheren Einzel-Nachrichten der Chronik zum
// Saisonstart; die Vorschau am 2. Januar (game/ruleNotice.ts) bleibt.
// =============================================================================
import { CAMP_DESTINATIONS, CAMP_REGION_LABEL, CAMP_REGION_ORDER, CampDestination, CampRegion } from '../data/campDestinations';
import { GROUNDS_BY_KEY, GROUNDS_MODULES, licenseMin } from '../data/groundsCatalog';
import { indoorPhase } from '../data/indoorHistory';
import { LEAGUE_REFORMS } from '../data/reforms';
import { TIMELINE, TimelineType, seasonStartYear } from '../data/timeline';
import { currencyForYear, DM_PER_EUR } from '../engine/economy';
import { LED_YEAR, SPONSOR_SLOTS } from '../data/sponsorCatalog';
import { FACILITIES } from '../engine/infrastructure';
import { YOUTH_BLOCKS, nlzDutyYear } from '../engine/youthAcademy';

export type GameChangeKind = 'regel' | 'liga' | 'wettbewerb' | 'geld' | 'technik' | 'training' | 'halle' | 'jugend' | 'umfeld' | 'einrichtung';

export interface GameChange {
  kind: GameChangeKind;
  /** Name eines <Icon>. */
  icon: string;
  title: string;
  text: string;
  /** Herkunft (Chronik, Ligareform …) – kleine Beschriftung. */
  source: string;
  /** Wo du es im Spiel findest (z. B. „Kader › Trainingslager“). */
  where?: string;
  /** Wichtig für den Überblick (Regeln, Reformen, Währung). */
  major?: boolean;
}

export const CHANGE_KIND_META: Record<GameChangeKind, { label: string; icon: string }> = {
  regel: { label: 'Spielregeln', icon: 'whistle' },
  liga: { label: 'Ligasystem', icon: 'dashTabelle' },
  wettbewerb: { label: 'Wettbewerbe', icon: 'trophy' },
  geld: { label: 'Geld & Recht', icon: 'finances' },
  technik: { label: 'Technik', icon: 'stats' },
  training: { label: 'Trainingslager', icon: 'weather' },
  halle: { label: 'Hallenfußball', icon: 'trophy' },
  jugend: { label: 'Nachwuchs', icon: 'youth' },
  umfeld: { label: 'Stadionumfeld', icon: 'facilities' },
  einrichtung: { label: 'Einrichtungen', icon: 'stadium' },
};

/** Sonderregeln ohne eigenen Chronik-Eintrag (auch in der Vorschau am 2. Januar). */
export const SPECIAL_RULE_CHANGES: { startYear: number; title: string; text: string }[] = [
  { startYear: 1998, title: 'Europapokal nur mit Sitzplätzen', text: 'Stehränge werden bei Europapokal-Heimspielen bestuhlt und fassen nur noch die Hälfte.' },
];

const TIMELINE_KIND: Record<TimelineType, GameChangeKind> = {
  rule: 'regel', competition: 'wettbewerb', law: 'geld', tech: 'technik', finance: 'geld', reform: 'liga',
};

const seasonOf = (y: number) => `${y}/${String((y + 1) % 100).padStart(2, '0')}`;

/** Kleinste Ansehens-Schwelle, ab der ein Ziel im Jahr buchbar ist (null = gar nicht). */
function campMinRep(d: CampDestination, year: number): number | null {
  if (year < d.access[0].from || d.closed?.includes(year)) return null;
  return [...d.access].reverse().find((a) => a.from <= year)!.minRep;
}
/** Sommerlager liegen im Juli des Startjahres, Winterlager im Januar danach. */
function campSeasonRep(d: CampDestination, startYear: number): number | null {
  const reps = d.seasons.map((s) => campMinRep(d, s === 'summer' ? startYear : startYear + 1)).filter((r): r is number => r != null);
  return reps.length ? Math.min(...reps) : null;
}
const campWhen = (d: CampDestination) => d.seasons.length === 2 ? 'Sommer & Winter' : d.seasons[0] === 'summer' ? 'Sommer' : 'Winter';

function campChanges(y: number, first: boolean): GameChange[] {
  const out: GameChange[] = [];
  const base = { kind: 'training' as const, icon: 'weather', source: 'Trainingslager', where: 'Kader › Trainingslager' };
  if (first) {
    const open = CAMP_DESTINATIONS.filter((d) => campSeasonRep(d, y) != null);
    const regions = CAMP_REGION_ORDER.filter((r) => open.some((d) => d.region === r)).map((r) => CAMP_REGION_LABEL[r]);
    out.push({
      ...base, title: `${open.length} Trainingslager-Ziele buchbar`,
      text: `${regions.join(', ')} – je Ziel mehrere Unterkünfte und ein frei wählbarer Schwerpunkt. Der Süden kommt mit den Jahren dazu, Fernreisen erst viel später.`,
    });
    return out;
  }
  // Je Region höchstens eine Meldung (sonst überflutet die Vielzahl der Ziele das Briefing).
  const added = new Map<CampRegion, { d: CampDestination; rep: number; again: boolean }[]>();
  const wider: { d: CampDestination; now: number; prev: number }[] = [];
  const shut: CampDestination[] = [];
  for (const d of CAMP_DESTINATIONS) {
    const now = campSeasonRep(d, y);
    const prev = campSeasonRep(d, y - 1);
    if (now != null && prev == null) {
      const again = d.access[0].from < y - 1 && !!d.closed?.length;
      added.set(d.region, [...(added.get(d.region) ?? []), { d, rep: now, again }]);
    } else if (now != null && prev != null && now < prev) wider.push({ d, now, prev });
    else if (now == null && prev != null) shut.push(d);
  }
  for (const r of CAMP_REGION_ORDER) {
    const list = added.get(r);
    if (!list) continue;
    if (list.length === 1) {
      const { d, rep, again } = list[0];
      out.push({ ...base, title: again ? `Wieder buchbar: ${d.name}` : `Neues Ziel: ${d.name}`,
        text: `${d.place} (${d.country}), ${campWhen(d)}.${rep > 0 ? ` Zunächst nur für Vereine ab Ansehen ${rep}.` : ''}` });
    } else {
      const again = list.every((x) => x.again);
      out.push({ ...base, title: `${again ? 'Wieder buchbar' : 'Neue Ziele'} (${CAMP_REGION_LABEL[r]}): ${list.map((x) => x.d.name).join(', ')}`,
        text: list.map((x) => `${x.d.place} (${x.d.country})${x.rep > 0 ? `, ab Ansehen ${x.rep}` : ''}`).join(' · ') + '.' });
    }
  }
  if (wider.length) {
    out.push({ ...base, title: wider.length === 1 ? `${wider[0].d.name} für mehr Vereine` : `Mehr Vereine können reisen: ${wider.map((x) => x.d.name).join(', ')}`,
      text: wider.map((x) => x.now > 0 ? `${x.d.place} jetzt ab Ansehen ${x.now} (bisher ${x.prev})` : `${x.d.place} steht jetzt allen Vereinen offen`).join(' · ') + '.' });
  }
  if (shut.length) {
    out.push({ ...base, title: `Nicht buchbar: ${shut.map((d) => d.name).join(', ')}`,
      text: `${shut.map((d) => d.place).join(', ')} – in dieser Saison nicht verfügbar (Reisebeschränkungen).` });
  }
  return out;
}

const INDOOR_TEXT: Record<string, { title: string; text: string }> = {
  invitational: { title: 'Hallenturniere im Winter', text: 'In der Winterpause laden Veranstalter zu Hallenturnieren ein – Antrittsgeld, Prämien und Spielpraxis, aber auch Verletzungsrisiko.' },
  masters: { title: 'Hallen-Masters', text: 'Der Verband richtet ein offizielles Hallen-Masters aus: Über die Turniere der Tour qualifizieren sich acht Teams für die Endrunde im Januar.' },
  regional: { title: 'Hallen-Masters eingestellt', text: 'Das Hallen-Masters gibt es nicht mehr. Im Winter laufen nur noch einzelne regionale Hallenturniere.' },
  none: { title: 'Keine Profi-Hallenturniere mehr', text: 'Die Profis bleiben im Winter draußen: Statt Hallenturnieren gibt es nur noch Trainingslager im Süden.' },
};

function indoorChanges(y: number, first: boolean): GameChange[] {
  const now = indoorPhase(y + 1);
  const prev = first ? 'none' : indoorPhase(y);
  if (now === prev) return [];
  const t = INDOOR_TEXT[now];
  return [{ kind: 'halle', icon: 'trophy', source: 'Hallenfußball', where: 'Statistiken › Halle', ...t }];
}

function youthChanges(y: number, tier: number): GameChange[] {
  const out: GameChange[] = [];
  for (const b of YOUTH_BLOCKS) {
    for (const lv of b.levels) {
      if (lv.from !== y || y <= 1975) continue;
      out.push({ kind: 'jugend', icon: 'youth', source: 'Nachwuchs', where: 'Kader › Akademie', title: `${b.name}: ${lv.name}`, text: lv.desc });
    }
  }
  const duty = nlzDutyYear(tier);
  if (duty === y) {
    out.push({
      kind: 'jugend', icon: 'youth', source: 'Lizenz', where: 'Kader › Akademie', major: true,
      title: 'Leistungszentrum ist Pflicht',
      text: `Ab dieser Saison bekommt in deiner Liga nur noch eine Lizenz, wer ein Nachwuchsleistungszentrum betreibt.`,
    });
  }
  return out;
}

function groundsChanges(y: number, tier: number): GameChange[] {
  const out: GameChange[] = [];
  if (y > 1975) {
    for (const m of GROUNDS_MODULES) {
      for (const lv of m.levels) {
        if (lv.unlock !== y) continue;
        const short = lv.name.toLowerCase().includes(m.name.split(/[ &]/)[0].toLowerCase());
        out.push({ kind: 'umfeld', icon: 'facilities', source: 'Stadionumfeld', where: 'Verein › Vereinsgelände', title: short ? lv.name : `${m.name}: ${lv.name}`, text: `Neu im Stadionumfeld (${m.name}) – ab jetzt baubar.` });
      }
    }
  }
  for (const key of ['floodlight', 'press'] as const) {
    const now = licenseMin(key, tier, y);
    const prev = licenseMin(key, tier, y - 1);
    if (now <= prev || y <= 1975) continue;
    const mod = GROUNDS_BY_KEY[key];
    out.push({
      kind: 'umfeld', icon: 'facilities', source: 'Lizenzauflage', where: 'Verein › Vereinsgelände',
      title: `Lizenz: ${mod.name} „${mod.levels[now - 1]?.name ?? `Stufe ${now}`}“`,
      text: 'Die Lizenz verlangt diese Mindeststufe. Fehlt sie, droht eine Geldstrafe je Saison.',
    });
  }
  return out;
}

function facilityChanges(y: number): GameChange[] {
  const out: GameChange[] = [];
  for (const f of FACILITIES) {
    if (f.unlockYear === y) out.push({ kind: 'einrichtung', icon: f.iconName ?? 'facilities', source: 'Einrichtungen', where: 'Verein › Vereinsgelände', title: `Neu baubar: ${f.name}`, text: f.desc });
    if (f.obsoleteYear === y) out.push({ kind: 'einrichtung', icon: 'facilities', source: 'Einrichtungen', where: 'Verein › Vereinsgelände', title: `Veraltet: ${f.name}`, text: 'Nicht mehr bau- oder ausbaubar.' });
  }
  return out;
}

/** Sponsoring 2.0: neue Werbeflächen, Verbote, LED-Banden (data/sponsorCatalog.ts). */
function sponsorChanges(y: number, tier: number, first: boolean): GameChange[] {
  const out: GameChange[] = [];
  const where = 'Finanzen › Sponsoring';
  const add = (title: string, text: string, major = false) => out.push({ kind: 'geld', icon: 'sponsoring', source: 'Sponsoring', where, title, text, major });
  if (first) { add('Werbeflächen 1975: Brust, Ausrüster, Banden, Regionalpartner', 'Trikotwerbung ist seit 1973 erlaubt. Angebote liegen unter Finanzen › Sponsoring – annehmen oder nachverhandeln.'); return out; }
  for (const sl of SPONSOR_SLOTS) {
    if (sl.unlock === y && sl.count(y, tier) > 0) add(`Neue Werbefläche: ${sl.name}`, sl.desc);
    if (sl.until != null && sl.until + 1 === y) add(`Vorbei: ${sl.name}`, 'Die Fläche wird nicht mehr vermarktet.');
  }
  if (y === LED_YEAR) add('LED-Banden', 'Wechselnde Motive auf LED-Banden: Die Bandenwerbung ist rund 20 % mehr wert.');
  if (y === 2000) add('Keine Spirituosen mehr auf dem Trikot', 'Werbung für Hochprozentiges verschwindet von der Spielkleidung (Banden bleiben).');
  if (y === 2006) add('Werbeverbot für private Wettanbieter', 'Wettpartner müssen von Trikot und Bande – laufende Verträge enden (wie bwin 2006).', true);
  if (y === 2007) add('Tabakwerbung verboten', 'Die EU-Tabakwerberichtlinie beendet Tabak-Sponsoring auch auf den Banden.');
  if (y === 2011) add('Sponsoren vom Golf', 'Staatsfonds und Fluggesellschaften aus Katar und den Emiraten suchen Partner – oft mit Pflicht-Trainingslager im Winter.');
  if (y === 2012) add('Wettanbieter wieder erlaubt', 'Mit dem Glücksspieländerungsstaatsvertrag dürfen lizenzierte Wettanbieter wieder werben.');
  return out;
}

function currencyChanges(y: number, first: boolean): GameChange[] {
  if (first) {
    return [{ kind: 'geld', icon: 'finances', source: 'Währung', title: `Gerechnet wird in ${currencyForYear(y) === 'DM' ? 'D-Mark' : 'Euro'}`, text: 'Alle Preise, Gehälter und Ablösen erscheinen in der Währung ihrer Zeit.' }];
  }
  if (currencyForYear(y + 1) !== currencyForYear(y)) {
    return [{
      kind: 'geld', icon: 'finances', source: 'Währung', major: true, title: 'Der Euro kommt',
      text: `Zum 1. Januar ${y + 1} stellt das Spiel auf Euro um (1 EUR = ${String(DM_PER_EUR).replace('.', ',')} DM). Kontostand und Preise werden umgerechnet.`,
    }];
  }
  if (currencyForYear(y) !== currencyForYear(y - 1)) {
    return [{ kind: 'geld', icon: 'finances', source: 'Währung', major: true, title: 'Erste ganze Saison in Euro', text: 'Alle Beträge – Gehälter, Ablösen, Eintritt – laufen jetzt in Euro.' }];
  }
  return [];
}

/**
 * Alle Änderungen im Spiel zur Saison mit Startjahr `y`.
 * `first` = Spielbeginn (statt „neu“ wird der Startzustand beschrieben),
 * `tier` = Liga-Ebene des eigenen Vereins (Lizenzauflagen, NLZ-Pflicht).
 */
export function gameChangesFor(y: number, opts: { first?: boolean; tier?: number } = {}): GameChange[] {
  const first = !!opts.first;
  const tier = opts.tier ?? 1;
  const out: GameChange[] = [];
  for (const e of TIMELINE) {
    if (seasonStartYear(e.season) !== y) continue;
    const kind = TIMELINE_KIND[e.type];
    out.push({ kind, icon: CHANGE_KIND_META[kind].icon, source: 'Chronik', title: e.title, text: e.description, major: e.type === 'rule' || e.type === 'reform' || !!e.effect?.pointSystem });
  }
  for (const r of LEAGUE_REFORMS) {
    if (seasonStartYear(r.effectiveSeason) !== y) continue;
    out.push({ kind: 'liga', icon: 'dashTabelle', source: 'Ligareform', where: 'Statistiken › Liga', title: r.title, text: `${r.description} ${r.qualificationRule}`.trim(), major: true });
  }
  for (const s of SPECIAL_RULE_CHANGES) if (s.startYear === y) out.push({ kind: 'regel', icon: 'whistle', source: 'Reglement', title: s.title, text: s.text, major: true });
  out.push(...currencyChanges(y, first));
  out.push(...indoorChanges(y, first));
  out.push(...campChanges(y, first));
  out.push(...youthChanges(y, tier));
  out.push(...groundsChanges(y, tier));
  out.push(...facilityChanges(y));
  out.push(...sponsorChanges(y, tier, first));
  return out;
}

export { seasonOf as briefingSeasonLabel };
