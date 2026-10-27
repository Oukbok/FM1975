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
  /** Hebt die Grund-Auslastung aller Stadien einmalig an (z. B. Heim-WM). */
  attendanceBoost?: number;
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
  /** Fiktive Zukunft (ab 2027/28) statt echter Geschichte. */
  fictional?: boolean;
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
      'Anfang der 1980er professionalisieren sich die Erstligisten abseits des '
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
    title: 'Meisterliga',
    description:
      'Der Pokal der Landesmeister wird 1992/93 zur Meisterliga mit '
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
    title: 'Finanzielles Fairplay',
    description:
      'Der europäische Verband beschließt 2010 das Finanzielle Fairplay (wirksam ab 2011/12): Vereine dürfen langfristig '
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
    title: 'Video-Assistent (1. Liga)',
    description:
      'Der Video-Assistent hält 2017/18 in der 1. Liga Einzug und '
      + 'überprüft Tore, Elfmeter, Rote Karten und Spielerverwechslungen.',
    effect: { unlock: 'var_league1' },
  },
  {
    id: 'var-l2-2019',
    season: '2019/20', year: 2019, type: 'tech',
    title: 'Video-Assistent (2. Liga)',
    description:
      'Ab 2019/20 kommt der Video-Assistent auch in der 2. Liga zum Einsatz.',
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
  {
    id: 'privatetv-1988',
    season: '1988/89', year: 1988, type: 'finance',
    title: 'Privatfernsehen kauft die Liga',
    description:
      'Ein privater Fernsehsender sichert sich die Übertragungsrechte der 1. Liga. Die '
      + 'TV-Gelder vervielfachen sich in wenigen Jahren – der Beginn des Fernsehzeitalters '
      + 'im Fußball. Fernsehgeld wird zur zweiten Säule neben den Zuschauereinnahmen.',
  },
  {
    id: 'heysel-1985',
    season: '1985/86', year: 1985, type: 'competition',
    title: 'Englische Vereine gesperrt',
    description:
      'Nach der Katastrophe beim Pokal-der-Landesmeister-Finale 1985 werden englische Vereine '
      + 'für fünf Jahre von den europäischen Wettbewerben ausgeschlossen. Stadionsicherheit wird '
      + 'überall zum Thema.',
  },
  {
    id: 'subs3-1995',
    season: '1995/96', year: 1995, type: 'rule',
    title: 'Drei Auswechslungen',
    description: 'Ab 1995/96 dürfen pro Spiel drei statt zwei Spieler eingewechselt werden.',
  },
  {
    id: 'cwc-end-1999',
    season: '1999/00', year: 1999, type: 'competition',
    title: 'Ende des Pokals der Pokalsieger',
    description:
      'Der Pokal der Pokalsieger wird nach 1998/99 eingestellt. Die nationalen Pokalsieger '
      + 'spielen fortan im Europa-Pokal, der dadurch größer und wichtiger wird.',
  },
  {
    id: 'tvcrisis-2002',
    season: '2002/03', year: 2002, type: 'finance',
    title: 'Krise des TV-Marktes',
    description:
      'Die Insolvenz eines großen Rechtehändlers erschüttert die Liga: Die TV-Gelder sinken '
      + 'für zwei Spielzeiten spürbar, mehrere Vereine geraten in finanzielle Schwierigkeiten. '
      + 'Gleichzeitig zahlt man ab 2002 in Euro.',
  },
  {
    id: 'homeworldcup-2006',
    season: '2006/07', year: 2006, type: 'competition',
    title: 'Sommermärchen: Weltmeisterschaft im eigenen Land',
    description:
      'Die Heim-WM 2006 löst eine Fußballbegeisterung aus, wie es sie lange nicht gab. Neue und '
      + 'modernisierte Stadien, volle Ränge, mehr Familien im Publikum – die Zuschauerzahlen '
      + 'steigen in der ganzen Liga.',
    effect: { attendanceBoost: 0.06 },
  },
  {
    id: 'europa-group-2009',
    season: '2009/10', year: 2009, type: 'competition',
    title: 'Europa-Pokal wird reformiert',
    description:
      'Der Europa-Pokal erhält ein neues Format mit Gruppenphase und mehr Spielen. Die Prämien '
      + 'steigen, bleiben aber weit hinter der Meisterliga zurück.',
  },
  {
    id: 'ghostgames-2020',
    season: '2019/20', year: 2020, type: 'law',
    title: 'Geisterspiele',
    description:
      'Im März 2020 wird der Spielbetrieb wegen einer Pandemie unterbrochen und später ohne '
      + 'Zuschauer fortgesetzt. Bis ins Frühjahr 2022 bleiben die Stadien leer oder nur halb '
      + 'gefüllt – Spieltagseinnahmen brechen weg.',
  },
  {
    id: 'subs5-2020',
    season: '2020/21', year: 2020, type: 'rule',
    title: 'Fünf Auswechslungen',
    description: 'Wegen der dichten Terminpläne sind ab 2020/21 fünf Wechsel (in drei Unterbrechungen) erlaubt – die Regel bleibt dauerhaft.',
  },
  {
    id: 'swissmodel-2024',
    season: '2024/25', year: 2024, type: 'competition',
    title: 'Meisterliga mit Ligaphase',
    description:
      'Die Meisterliga spielt ab 2024/25 mit einer großen Ligaphase statt Gruppen. Mehr Spiele, '
      + 'mehr Geld – und eine noch größere Kluft zwischen Europas Spitze und dem Rest.',
  },
  {
    id: 'semiauto-2027',
    season: '2027/28', year: 2027, type: 'tech', fictional: true,
    title: 'Halbautomatisches Abseits',
    description:
      'Kameras und Sensoren im Ball entscheiden Abseitsstellungen in Sekunden. Die Diskussionen '
      + 'verlagern sich vom Abseits zu Handspielen.',
  },
  {
    id: 'superleague-debate-2030',
    season: '2030/31', year: 2030, type: 'competition', fictional: true,
    title: 'Streit um eine geschlossene Europaliga',
    description:
      'Mehrere europäische Großvereine drohen mit einer eigenen, geschlossenen Liga. Am Ende '
      + 'einigt man sich auf eine erweiterte Meisterliga mit festen Startplätzen für die besten '
      + 'Nationen – die Kluft zu kleineren Ligen wächst weiter.',
  },
  {
    id: 'wagecap-2034',
    season: '2034/35', year: 2034, type: 'law', fictional: true,
    title: 'Gehaltsquote als Lizenzauflage',
    description:
      'Der europäische Verband ersetzt das Finanzielle Fairplay durch eine feste Gehaltsquote: '
      + 'Spieler- und Stabsgehälter dürfen höchstens 70 % des Umsatzes betragen. Wer darüber '
      + 'liegt, wird verwarnt und im Wiederholungsfall mit einer Transfersperre belegt.',
  },
  {
    id: 'climate-2038',
    season: '2038/39', year: 2038, type: 'reform', fictional: true,
    title: 'Klimaauflagen für Stadien',
    description:
      'Neue Auflagen verlangen klimaneutrale Stadien. Die Betriebskosten steigen, Vereine mit '
      + 'modernen Anlagen sind im Vorteil.',
  },
  {
    id: 'globalbroadcast-2042',
    season: '2042/43', year: 2042, type: 'finance', fictional: true,
    title: 'Weltweite Streaming-Rechte',
    description:
      'Die Liga vermarktet ihre Rechte weltweit direkt über eigene Streamingdienste. Die TV-Gelder '
      + 'steigen erneut, internationale Bekanntheit wird noch wertvoller.',
  },
];
// Chronologisch sortiert halten (echte Geschichte und fiktive Zukunft gemischt gepflegt).
TIMELINE.sort((a, b) => seasonStartYear(a.season) - seasonStartYear(b.season) || a.year - b.year);

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
