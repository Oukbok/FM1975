// =============================================================================
// SPIELPLAN & TERMINE – Rahmenterminkalender je Epoche (Wunsch Pascal: „klare Regeln,
// von wann bis wann Spiele sind, wann Winterpausen, wann Hallenturniere, über die
// Jahrzehnte angepasst, mit Verschiebungen und Ausweichterminen“).
//
// Eine Quelle für alle Terminregeln; angewendet in engine/fixtureRules.ts (reine
// Rechnung: Wochentage, Abstände, Ausweichtermine, Spielausfall) und game/fixtureWatch.ts
// (Spielablauf: Verlegungen, Nachholspiele, Nachrichten). Saisonrahmen und Winterpause
// je Saison stehen weiter mit Quellen in data/winterBreaks.ts, Europapokal-Wochentage je
// Wettbewerb/Saison in data/euroFormats.ts, Hallensaison in data/indoorHistory.ts.
//
// Quellen (Recherche Oktober/November 2026):
//  [RS] RSSSF „Germany <saison>“ (Spieltage mit Datum, s. data/winterBreaks.ts): bis Anfang
//       der 90er nahezu alle Bundesligaspiele am Samstag, englische Wochen mittwochs.
//  [DFL] DFL-Spielordnung/Spielplanrichtlinien (bundesliga.com „Anstoßzeiten“): seit 1992/93
//       Freitag/Samstag/Sonntag (Fernsehvertrag Premiere/SAT.1), seit 2006/07 1 Fr / 6 Sa / 2 So,
//       2017–2020 zusätzlich bis zu fünf Montagsspiele, 2. Bundesliga seit 1993/94 mit Montagsspiel
//       (DSF), seit 2009 Fr/Sa/So/Mo. Erster und die letzten zwei Spieltage zeitgleich
//       (Wettbewerbsgleichheit), letzter Spieltag immer Samstag 15.30 Uhr.
//  [DFB] DFB-Pokal: Runden unter der Woche (Di/Mi) in eigenen „Pokalwochen“ ohne Europapokal;
//       bis 1990/91 Wiederholungsspiel bei Remis nach Verlängerung (data/euroFormats.ts
//       `cupReplay`); Endspiel seit 1985 in Berlin am Samstag nach dem letzten Spieltag.
//  [UEFA] Europapokal-Spieltage: bis 1990er Mittwoch (alle drei Wettbewerbe), Champions League
//       Di/Mi, UEFA-Cup ab 1999 Do, Europa League (2009) Do, Conference League (2021) Do.
//       Vereine mit Donnerstagsspiel spielen am folgenden Wochenende sonntags
//       (DFL-Spielplanrichtlinie „Europa-League-Teilnehmer“).
//  [WX] Spielausfälle durch Schnee, Frost und Nebel: kicker/RSSSF – z. B. Winter 1978/79
//       (Schneechaos, zahlreiche Absagen im Januar/Februar), Nebelabbruch-/Nebelabsagen der 70er/80er;
//       seit den 2000ern Ausnahme (Rasenheizung). Häufigkeiten unten = Annahme, abgestimmt auf
//       „in den 70ern jeden Winter mehrere Nachholspiele, heute fast keine“.
//  [RH] Rasenheizung: in den 70ern nur in wenigen Stadien (u. a. Neubauten zur WM 1974),
//       in den 80ern/90ern allmählich Standard; in der Bundesliga heute Lizenzauflage,
//       3. Liga seit 2023/24 (DFB-Saisonreport 3. Liga 2023/24, dfb.de „Rasenheizung,
//       Flutlicht, Nachhaltigkeit – Anpassungen beschlossen“). Anteile je Jahr = Annahme.
// =============================================================================

/** Wochentage (UTC, 0 = Sonntag … 6 = Samstag). */
export const WD = { so: 0, mo: 1, di: 2, mi: 3, do: 4, fr: 5, sa: 6 } as const;
export const WD_NAME = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Mindestabstand zweier Pflichtspiele eines Vereins in Tagen (Anstoß zu Anstoß):
 * hart 2 Tage (≥ 48 h – nie an aufeinanderfolgenden Tagen), Ziel 3 Tage (zwei Ruhetage, ≈ 72 h).
 */
export const MIN_GAP_DAYS = 2;
export const WANT_GAP_DAYS = 3;
/** Hallenturnier: nie am Tag vor oder nach einem Pflichtspiel (Abstand ≥ 2 Tage). */
export const INDOOR_GAP_DAYS = 2;
/** Nachholspiele spätestens vor den letzten zwei Spieltagen (Saisonfinale zeitgleich). */
export const MAKEUP_BEFORE_LAST = 2;
/** Ein Spiel wird höchstens so oft abgesagt; danach findet es statt (Ausweichstadion, Schneeräumung). */
export const MAX_POSTPONEMENTS = 2;

/** Verteilung eines normalen Spieltags auf Fr/Sa/So/Mo (Anteile, Summe 1). */
export type WeekendSplit = [fr: number, sa: number, so: number, mo: number];

export interface CalendarEra {
  from: number;
  to: number;
  label: string;
  /** Kurzregeln für Wiki/i-Hilfe. */
  league: string;
  league2: string;
  cup: string;
  euro: string;
  winter: string;
  indoor: string;
  weather: string;
  /** Spieltags-Verteilung 1. und 2. Liga (Spielklasse ≥ 3 wie 2. Liga ab 2008, sonst Samstag). */
  split1: WeekendSplit;
  split2: WeekendSplit;
  /** Wochentage für englische Wochen und Nachholspiele. */
  midweek: number[];
  /** Wochentage der Landespokal-Runden. */
  cupDays: number[];
}

const SAT: WeekendSplit = [0, 1, 0, 0];

export const CALENDAR_ERAS: CalendarEra[] = [
  {
    from: 1975, to: 1985, label: '1975–1985',
    league: 'Alle Spiele samstags 15.30 Uhr, englische Wochen mittwochs.',
    league2: '2. Liga (Nord/Süd) samstags, vereinzelt freitags.',
    cup: 'Landespokal mittwochs in spielfreien Wochen, Wiederholungsspiel eine Woche später; Endspiel im Juni.',
    euro: 'Alle drei Europapokale mittwochs.',
    winter: 'Pause von Mitte Dezember bis Mitte/Ende Januar (4–6 Wochen).',
    indoor: 'Einladungsturniere in der Winterpause, nie am Tag vor oder nach einem Pflichtspiel.',
    weather: 'Kaum Rasenheizungen: Schnee, Frost und Nebel sagen jeden Winter mehrere Spiele ab.',
    split1: SAT, split2: SAT, midweek: [WD.mi], cupDays: [WD.mi],
  },
  {
    from: 1986, to: 1991, label: '1986–1991',
    league: 'Samstags, englische Wochen mittwochs; lange Winterpause.',
    league2: '2. Bundesliga samstags, Wochenspieltage dienstags/mittwochs.',
    cup: 'Landespokal dienstags/mittwochs, bis 1990/91 mit Wiederholungsspiel; Endspiel samstags in Berlin.',
    euro: 'Alle drei Europapokale mittwochs.',
    winter: 'Lange Pause von Anfang Dezember bis Ende Februar (bis zu 11 Wochen).',
    indoor: 'Hallen-Masters mit Qualifikationsturnieren im Dezember/Januar.',
    weather: 'Rasenheizungen breiten sich aus; im Februar trotzdem regelmäßig Absagen.',
    split1: SAT, split2: SAT, midweek: [WD.di, WD.mi], cupDays: [WD.di, WD.mi],
  },
  {
    from: 1992, to: 2005, label: '1992–2005',
    league: 'Fernsehspieltag: Freitag, Samstag (Hauptspieltag) und Sonntag.',
    league2: '2. Bundesliga freitags, sonntags und montags (Montagsspiel ab 1993/94).',
    cup: 'Landespokal dienstags/mittwochs ohne Wiederholung; Endspiel samstags nach dem letzten Spieltag.',
    euro: 'Champions League Di/Mi, Pokalsieger-Cup Do (bis 1999), UEFA-Pokal Di/Mi, ab 1999 Do.',
    winter: 'Pause von Mitte Dezember bis Ende Januar (≈ 6 Wochen).',
    indoor: 'Hallen-Masters bis 2001, danach letzte Hallenturniere bis 2004.',
    weather: 'Die meisten Erstligastadien sind beheizt; Absagen werden selten.',
    split1: [2 / 9, 5 / 9, 2 / 9, 0], split2: [2 / 9, 2 / 9, 4 / 9, 1 / 9], midweek: [WD.di, WD.mi], cupDays: [WD.di, WD.mi],
  },
  {
    from: 2006, to: 2016, label: '2006–2016',
    league: '1 Spiel freitags, 6 samstags, 2 sonntags.',
    league2: '2. Bundesliga Fr/Sa/So/Mo.',
    cup: 'Landespokal dienstags/mittwochs in Pokalwochen.',
    euro: 'Champions League Di/Mi, UEFA-Pokal/Europa League donnerstags – Teilnehmer spielen danach sonntags.',
    winter: 'Pause von Weihnachten bis Ende Januar (4–6 Wochen).',
    indoor: 'Keine Hallenturniere mehr.',
    weather: 'Rasenheizung in der Bundesliga Pflicht: Absagen nur noch bei extremem Wetter.',
    split1: [1 / 9, 6 / 9, 2 / 9, 0], split2: [3 / 9, 2 / 9, 3 / 9, 1 / 9], midweek: [WD.di, WD.mi], cupDays: [WD.di, WD.mi],
  },
  {
    from: 2017, to: 9999, label: 'ab 2017',
    league: '1 Spiel freitags, 5–6 samstags, 2–3 sonntags.',
    league2: '2. Bundesliga Fr/Sa/So (Montagsspiele bis 2020/21).',
    cup: 'Landespokal dienstags/mittwochs in Pokalwochen.',
    euro: 'Champions League Di/Mi, Europa League und Conference League donnerstags – Teilnehmer spielen danach sonntags.',
    winter: 'Kurze Pause von kurz vor Weihnachten bis Mitte Januar (≈ 3 Wochen).',
    indoor: 'Keine Hallenturniere mehr.',
    weather: 'Absagen sind die Ausnahme.',
    split1: [1 / 9, 5 / 9, 3 / 9, 0], split2: [3 / 9, 3 / 9, 3 / 9, 0], midweek: [WD.di, WD.mi], cupDays: [WD.di, WD.mi],
  },
];

export function calendarEra(y0: number): CalendarEra {
  return CALENDAR_ERAS.find((e) => y0 >= e.from && y0 <= e.to) ?? CALENDAR_ERAS[CALENDAR_ERAS.length - 1];
}

/** Spieltags-Verteilung einer Spielklasse (West; DDR samstags). */
export function weekendSplit(y0: number, tier: number, ddr = false): WeekendSplit {
  if (ddr) return SAT;
  const e = calendarEra(y0);
  if (tier <= 1) return e.split1;
  if (tier === 2) return e.split2;
  return y0 >= 2008 ? [1 / 10, 6 / 10, 3 / 10, 0] : SAT; // 3. Liga ab 2008/09, darunter samstags
}

// -----------------------------------------------------------------------------
// Rasenheizung und Spielausfall (Annahme nach [WX]/[RH])
// -----------------------------------------------------------------------------
const lerp = (pts: [number, number][], x: number) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
};

/** Anteil der Stadien mit Rasenheizung je Spielklasse und Jahr. */
export function heatingShare(year: number, tier: number): number {
  if (tier <= 1) return lerp([[1975, 0.15], [1985, 0.4], [1995, 0.75], [2002, 1]], year);
  if (tier === 2) return lerp([[1975, 0.03], [1990, 0.2], [2000, 0.5], [2010, 0.9], [2014, 1]], year);
  return lerp([[1975, 0], [1995, 0.1], [2010, 0.3], [2023, 1]], year);
}

/** Absagegründe (Anzeige in Nachricht, Kalender, Presse). */
export type PostponeReason = 'schnee' | 'frost' | 'nebel' | 'regen';
export const POSTPONE_TEXT: Record<PostponeReason, { short: string; long: string }> = {
  schnee: { short: 'Schnee', long: 'Der Platz ist nach starkem Schneefall unbespielbar.' },
  frost: { short: 'Frost', long: 'Der Boden ist gefroren und steinhart – Verletzungsgefahr, der Schiedsrichter sagt ab.' },
  nebel: { short: 'Nebel', long: 'Dichter Nebel: Der Schiedsrichter sieht nicht von Tor zu Tor und sagt das Spiel ab.' },
  regen: { short: 'Unwetter', long: 'Nach Dauerregen steht der Platz unter Wasser.' },
};

/**
 * Absage-Wahrscheinlichkeit bei gegebenem Spielwetter (game/matchWeather.ts) und Monat.
 * `heated` = Stadion mit Rasenheizung. Gefrorener Boden ohne Schnee nur Dezember–Februar.
 */
export function postponeOdds(weather: string, month: number, heated: boolean, year: number): { p: number; reason: PostponeReason } | null {
  const winter = month === 12 || month <= 2;
  const cold = winter || month === 11 || month === 3;
  if (!cold) return null;
  const fog = year < 1990 ? 0.22 : year < 2005 ? 0.12 : 0.05; // bessere Flutlichtanlagen, mehr Schiedsrichter-Spielraum
  switch (weather) {
    case 'schnee': return { p: heated ? 0.07 : 0.6, reason: 'schnee' };
    case 'nebel': return { p: fog, reason: 'nebel' };
    case 'regen': return { p: heated ? 0.004 : year < 1990 ? 0.03 : 0.015, reason: 'regen' };
    default: return winter && !heated ? { p: 0.06, reason: 'frost' } : null;
  }
}
