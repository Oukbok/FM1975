// =============================================================================
// 1975 – A Football Manager — Epochen-/Timeline-System (Regel- & Feature-Chronik)
// =============================================================================
// Zentrale, LEICHT ERWEITERBARE Datenstruktur aller historischen Meilensteine
// von 1975 bis in die 2030er. Jeder Eintrag wird ausgelöst, sobald die zugehörige
// Saison im Spiel beginnt: dann erscheint eine Meilenstein-Nachricht in der Inbox
// UND – falls hinterlegt – wird ein Spiel-Effekt angewendet (z. B. Umstellung auf
// die 3-Punkte-Regel, Freischalten eines Wettbewerbs/Features).
//
// ERWEITERN: einfach einen weiteren Eintrag ins TIMELINE-Array aufnehmen. Spätere
// Blöcke (Bauten, Personal, Ligareformen) hängen ihre Meilensteine hier an und
// setzen bei Bedarf `effect.unlock` (Feature-Flag) oder eigene Effekt-Felder.
// =============================================================================

import { PointSystem } from '../types';

/** Kategorie eines Meilensteins (steuert Icon & Farbe in der Chronik). */
export type TimelineType =
  | 'rule'        // Spielregel / Wettbewerbsregel
  | 'competition' // neuer Wettbewerb
  | 'law'         // Rechtsprechung / Reglement (Bosman, FFP)
  | 'tech'        // Technik (Torlinie, VAR)
  | 'finance'     // Wirtschaft / Währung
  | 'reform';     // Struktur-/Ligareform (für spätere Blöcke)

/** Ein Spiel-Effekt, der beim Auslösen eines Meilensteins angewendet wird. */
export interface TimelineEffect {
  /** Setzt das aktive Punktesystem (z. B. Umstellung 2 → 3 Punkte 1995/96). */
  pointSystem?: PointSystem;
  /** Schaltet ein benanntes Feature frei (Flag in game.unlockedFeatures). */
  unlock?: string;
}

/** Ein historischer Meilenstein der Fußball-Chronik. */
export interface TimelineEvent {
  /** Eindeutige, stabile ID (für Persistenz „bereits ausgelöst"). */
  id: string;
  /** Saison, zu deren Beginn der Meilenstein wirksam wird (z. B. "1995/96"). */
  season: string;
  /** Anzeigejahr (für Sortierung/Chronik-Beschriftung). */
  year: number;
  type: TimelineType;
  /** Kurztitel des Meilensteins. */
  title: string;
  /** Ausführliche Beschreibung (Chronik + Nachrichtentext). */
  description: string;
  /** Optionaler Spiel-Effekt. */
  effect?: TimelineEffect;
}

/** Deutsche Labels & Icons je Meilenstein-Typ. */
export const TIMELINE_TYPE_META: Record<TimelineType, { label: string; icon: string; color: string }> = {
  rule:        { label: 'Spielregel',   icon: '📏', color: 'var(--accent)' },
  competition: { label: 'Wettbewerb',   icon: '🏆', color: 'var(--yellow)' },
  law:         { label: 'Reglement',    icon: '⚖️', color: 'var(--orange)' },
  tech:        { label: 'Technik',      icon: '🎥', color: 'var(--green)' },
  finance:     { label: 'Wirtschaft',   icon: '💶', color: 'var(--yellow)' },
  reform:      { label: 'Reform',       icon: '🏗️', color: 'var(--accent)' },
};

/**
 * Die zentrale Chronik. Nach Saison aufsteigend gepflegt.
 * `season` = Auslöse-Saison; kalenderjahr-basierte Ereignisse (Bosman Dez. 1995,
 * FFP 2010) werden der Saison zugeordnet, in der sie erstmals spürbar sind.
 */
export const TIMELINE: TimelineEvent[] = [
  {
    id: 'start-1975',
    season: '1975/76', year: 1975, type: 'rule',
    title: '2-Punkte-Regel, drei Absteiger & Trikotwerbung',
    description:
      'Zum Start 1975/76 gilt die klassische 2-Punkte-Regel (Sieg 2, Remis 1). '
      + 'Drei Vereine steigen am Saisonende ab. Die Trikotwerbung hat sich in der '
      + '1. Liga durchgesetzt und wird zur festen Einnahmequelle – der Beginn der '
      + 'Kommerzialisierung des deutschen Profifußballs.',
    effect: { unlock: 'shirt_sponsorship' },
  },
  {
    id: 'staff-pro-1983',
    season: '1983/84', year: 1983, type: 'reform',
    title: 'Professionalisierung der Vereinsstäbe',
    description:
      'Anfang der 1980er professionalisieren sich die 1. Liga-Vereine abseits des '
      + 'Rasens: Co-Trainer, Physiotherapeuten und erste hauptamtliche Geschäftsstellen '
      + 'werden zum Standard. Im Bereich „Mitarbeiter" lassen sich nun neue '
      + 'Fachkräfte verpflichten, und die Werbeflächen im Stadion werden systematisch '
      + 'vermarktet.',
    effect: { unlock: 'staff_wave_1983' },
  },
  {
    id: 'reha-1990',
    season: '1990/91', year: 1990, type: 'reform',
    title: 'Moderne Reha- & Sportmedizin',
    description:
      'Zu Beginn der 1990er hält die moderne Sportmedizin Einzug: eigene Reha-Zentren '
      + 'verkürzen Ausfallzeiten und beschleunigen die Regeneration. Unter '
      + '„Vereinsgelände" lässt sich nun ein Reha-Zentrum errichten.',
    effect: { unlock: 'building_reha_1990' },
  },
  {
    id: 'backpass-1992',
    season: '1992/93', year: 1992, type: 'rule',
    title: 'Rückpassregel eingeführt',
    description:
      'Ab 1992/93 darf der Torwart einen absichtlichen Rückpass mit dem Fuß nicht '
      + 'mehr in die Hand nehmen. Die Regel beschleunigt das Spiel deutlich und '
      + 'zwingt Torhüter zu besserem Fußballspiel.',
    effect: { unlock: 'backpass_rule' },
  },
  {
    id: 'ucl-1992',
    season: '1992/93', year: 1992, type: 'competition',
    title: 'Europa-Verband Meisterliga',
    description:
      'Der Europapokal der Landesmeister wird 1992/93 zur Europa-Verband Meisterliga mit '
      + 'Gruppenphase umgebaut – der prestigeträchtigste und lukrativste Vereins-'
      + 'wettbewerb Europas entsteht.',
    effect: { unlock: 'champions_league' },
  },
  {
    id: 'threepoints-1995',
    season: '1995/96', year: 1995, type: 'rule',
    title: '3-Punkte-Regel',
    description:
      'Ab 1995/96 gibt es drei Punkte für einen Sieg (Remis weiterhin 1). Die Regel '
      + 'belohnt Offensivfußball und verändert die Tabellenrechnung spürbar. Ab sofort '
      + 'werden Siege in dieser Liga mit 3 Punkten gewertet.',
    effect: { pointSystem: '3-point', unlock: 'three_point_rule' },
  },
  {
    id: 'bosman-1995',
    season: '1995/96', year: 1995, type: 'law',
    title: 'Bosman-Urteil',
    description:
      'Im Dezember 1995 kippt der Europäische Gerichtshof mit dem Bosman-Urteil die '
      + 'Ablösesummen für Spieler nach Vertragsende und die Ausländerbeschränkung für '
      + 'EU-Bürger. Ablösefreie Wechsel und ein europäischer Transfermarkt entstehen.',
    effect: { unlock: 'bosman' },
  },
  {
    id: 'nlz-1998',
    season: '1998/99', year: 1998, type: 'reform',
    title: 'Nachwuchsleistungszentren',
    description:
      'Nach dem enttäuschenden Abschneiden der Nationalmannschaft rückt die '
      + 'systematische Talentförderung in den Fokus. Vereine bauen '
      + 'Nachwuchsleistungszentren (NLZ) auf – unter „Vereinsgelände" nun errichtbar – '
      + 'und steigern damit das Wachstum ihrer Jugendspieler.',
    effect: { unlock: 'building_nlz_1998' },
  },
  {
    id: 'staff-media-2003',
    season: '2003/04', year: 2003, type: 'reform',
    title: 'Sportwissenschaft & Medienabteilungen',
    description:
      'Athletiktrainer, Sportwissenschaftler und professionelle Medien- und '
      + 'Marketingabteilungen werden zum Wettbewerbsfaktor. Neue Mitarbeiterrollen und '
      + 'ein Leistungszentrum („Vereinsgelände") stehen zur Verfügung; das Marketing '
      + 'gewinnt an Bedeutung.',
    effect: { unlock: 'staff_wave_2003' },
  },
  {
    id: 'ffp-2010',
    season: '2010/11', year: 2010, type: 'law',
    title: 'Financial Fair Play',
    description:
      'Die Europa-Verband beschließt 2010 das Financial Fair Play: Vereine dürfen langfristig '
      + 'nicht mehr ausgeben als sie einnehmen. Solide Vereinsfinanzen werden zur '
      + 'Voraussetzung für die europäischen Wettbewerbe.',
    effect: { unlock: 'ffp' },
  },
  {
    id: 'data-2013',
    season: '2013/14', year: 2013, type: 'reform',
    title: 'Datenanalyse & Videoscouting',
    description:
      'Datenanalyse, Tracking und Videoscouting revolutionieren die Kaderplanung. '
      + 'Ein Datenanalyse-Zentrum („Vereinsgelände") erhöht die Scouting-Genauigkeit, '
      + 'und neue Analyse-Fachkräfte verstärken den Mitarbeiterstab.',
    effect: { unlock: 'building_data_2013' },
  },
  {
    id: 'goalline-2015',
    season: '2015/16', year: 2015, type: 'tech',
    title: 'Torlinientechnik',
    description:
      'Ab 2015/16 entscheidet in der 1. Liga die Torlinientechnik zweifelsfrei, '
      + 'ob der Ball die Linie vollständig überschritten hat – das Ende der '
      + '„Phantomtore".',
    effect: { unlock: 'goalline_tech' },
  },
  {
    id: 'var-l1-2017',
    season: '2017/18', year: 2017, type: 'tech',
    title: 'Video-Assistent (1. 1. Liga)',
    description:
      'Der Video-Assistent (VAR) hält 2017/18 in der 1. 1. Liga Einzug und '
      + 'überprüft Tore, Elfmeter, Rote Karten und Spielerverwechslungen.',
    effect: { unlock: 'var_league1' },
  },
  {
    id: 'var-l2-2019',
    season: '2019/20', year: 2019, type: 'tech',
    title: 'Video-Assistent (2. 1. Liga)',
    description:
      'Ab 2019/20 kommt der Video-Assistent auch in der 2. 1. Liga zum Einsatz.',
    effect: { unlock: 'var_league2' },
  },
  {
    id: 'staff-digital-2021',
    season: '2021/22', year: 2021, type: 'reform',
    title: 'Digitalisierung & Social Media',
    description:
      'Social-Media-Redaktionen, Datenwissenschaftler und internationale Vermarktung '
      + 'prägen den modernen Profifußball. Der Mitarbeiterstab lässt sich mit '
      + 'spezialisierten Fachkräften erweitern, und das Marketing reicht bis in soziale '
      + 'Netzwerke und internationale Märkte.',
    effect: { unlock: 'staff_wave_2021' },
  },
];

/** Vergleicht zwei Saison-Labels ("1995/96") anhand des Startjahres. */
export function seasonStartYear(season: string): number {
  return parseInt(season.slice(0, 4), 10) || 0;
}

/**
 * Liefert alle Meilensteine, die beim Wechsel in `newSeason` fällig werden,
 * d. h. deren Auslöse-Saison genau `newSeason` ist und die noch nicht in
 * `alreadyFired` stehen.
 */
export function dueTimelineEvents(newSeason: string, alreadyFired: string[]): TimelineEvent[] {
  const fired = new Set(alreadyFired);
  return TIMELINE.filter((e) => e.season === newSeason && !fired.has(e.id));
}

/**
 * Liefert ALLE Meilensteine bis einschließlich `season` (für Retrofit/Erststart:
 * sofort anwenden, ohne Nachricht). Nützlich, wenn ein Spielstand mitten in der
 * Zeitleiste beginnt oder geladen wird.
 */
export function timelineEventsUpTo(season: string): TimelineEvent[] {
  const y = seasonStartYear(season);
  return TIMELINE.filter((e) => seasonStartYear(e.season) <= y);
}
