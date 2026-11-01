// =============================================================================
// SAISON-BRIEFING — „Typisch für diese Spielzeit“: Trainer-Tipps je Epoche
// -----------------------------------------------------------------------------
// Ergänzt die redaktionellen Saison-Texte (seasons1975/2000.ts: was passiert)
// und die Unterschiede zum heutigen Fußball (differences.ts: was anders ist)
// um den dritten Blick: Was sollte ein Trainer in dieser Zeit TUN? Jeder Tipp
// nennt kurz den historischen Hintergrund (`text`) und die Wirkung im Spiel
// (`inGame`) samt Seite (`where` = „Kategorie › Unterpunkt“ aus MENU_STRUCTURE).
// Einzelne Tipps können enger datiert sein (`from`/`to` = Saison-Startjahre).
// Die Epoche steuert auch die Anmutung der Auftakt-Animation (`motif`).
// Verwendet in game/seasonTasks.ts und views/zentrale/briefing/TasksPanel.tsx.
// =============================================================================
import type { BriefingTopic } from './types';

export interface EraTip {
  topic: BriefingTopic;
  title: string;
  /** Hintergrund (ein bis zwei Sätze). */
  text: string;
  /** Was das im Spiel für dich heißt (du-Form, konkret). */
  inGame: string;
  /** Seite im Spiel, z. B. „Spieltag › Taktik“. */
  where?: string;
  /** Engere Gültigkeit innerhalb der Epoche (Saison-Startjahre, einschließlich). */
  from?: number;
  to?: number;
}

/** Bildsprache der Auftakt-Animation (CSS-Klasse `si-motif-…`). */
export type EraMotif = 'tv' | 'video' | 'stripes' | 'digital' | 'grid' | 'future';

export interface EraTipSet {
  from: number;
  to: number;
  /** Kurzname der Epoche für Auftakt und Tipps. */
  label: string;
  motif: EraMotif;
  tips: EraTip[];
}

export const ERA_TIPS: EraTipSet[] = [
  {
    from: 1975, to: 1979, label: 'Die Zeit von Libero und Manndeckung', motif: 'tv',
    tips: [
      { topic: 'taktik', title: 'Libero hinter der Abwehr', where: 'Spieltag › Taktik',
        text: 'Fast jede Mannschaft spielt mit einem freien Mann hinter den Manndeckern, Beckenbauer hat die Rolle berühmt gemacht.',
        inGame: 'Besetze den Libero mit deinem spielstärksten Verteidiger – er hält die Abwehr zusammen und eröffnet das Spiel.' },
      { topic: 'geld', title: 'Der Eintritt zahlt die Gehälter', where: 'Verein › Fans',
        text: 'Fernsehgeld ist ein Taschengeld, der Großteil des Umsatzes kommt von den Zuschauern im Stadion.',
        inGame: 'Volle Ränge sind deine wichtigste Einnahme: Erfolg, Stimmung und vernünftige Eintrittspreise zahlen sich aus.' },
      { topic: 'geld', title: 'Brustwerbung ist Neuland', where: 'Finanzen › Sponsoring',
        text: 'Trikotwerbung ist erst seit 1973 erlaubt; viele Vereine haben noch keinen oder einen kleinen Sponsor.',
        inGame: 'Ein Trikotsponsor ist neben dem Eintritt die größte Einzelquelle – unterschreib früh in der Saison.' },
      { topic: 'regeln', title: 'Unentschieden sind viel wert', where: 'Spieltag › Taktik',
        text: 'Ein Sieg bringt nur zwei Punkte, ein Remis einen – Auswärtspunkte gelten als Erfolg.',
        inGame: 'Auswärts kostet eine vorsichtige Ausrichtung wenig; ein Punkt ist hier halb so viel wie ein Sieg.' },
      { topic: 'geld', title: 'Kein Spieler geht umsonst', where: 'Kader › Verträge',
        text: 'Auch nach Vertragsende muss ein neuer Verein Ablöse zahlen.',
        inGame: 'Auslaufende Verträge sind kein Drama: Die Ablöse bleibt bei dir – verlängere nur, wen du wirklich halten willst.' },
    ],
  },
  {
    from: 1980, to: 1986, label: 'Kraft, Kondition und leere Ränge', motif: 'tv',
    tips: [
      { topic: 'taktik', title: 'Kondition entscheidet', where: 'Training › Trainingsplan',
        text: 'Gewonnen wird über Laufbereitschaft und Zweikampfstärke; das Pressing von Ernst Happels HSV macht Schule.',
        inGame: 'Leg in der Vorbereitung Wert auf Ausdauer – ein Trainingslager im Sommer zahlt sich bis in den Herbst aus.' },
      { topic: 'medien', title: 'Die Zuschauer bleiben weg', where: 'Verein › Fans',
        text: 'Mitte der Achtziger sinkt der Schnitt der Bundesliga auf unter 20 000 – Gewalt in den Kurven schreckt Familien ab.',
        inGame: 'Stimmung und Sicherheit im Umfeld werden wichtiger; achte auf die Fans und das Stadionumfeld.' },
      { topic: 'taktik', title: 'Der Stab wächst', where: 'Training › Trainerteam',
        text: 'Co-Trainer, Masseur und Scout werden in den Profivereinen zur Regel.',
        inGame: 'Gute Mitarbeiter verbessern Training, Medizin und Scouting – besetze die wichtigsten Stellen.', from: 1983 },
      { topic: 'liga', title: 'Europa ohne Engländer', where: 'Statistiken › International',
        text: 'Nach Heysel sind die englischen Vereine ab 1985 von den Europapokalen ausgeschlossen.',
        inGame: 'Die Konkurrenz im Europapokal ist dünner – ein Platz oben in der Liga lohnt doppelt.', from: 1985 },
    ],
  },
  {
    from: 1987, to: 1991, label: 'Das Fernsehen entdeckt die Liga', motif: 'video',
    tips: [
      { topic: 'geld', title: 'Fernsehgeld wird ernst', where: 'Finanzen › Bilanz',
        text: 'Mit dem Privatfernsehen steigen ab 1988 die Rechtekosten sprunghaft, die Bundesliga wird zur Show.',
        inGame: 'Die Fernseheinnahmen wachsen Jahr für Jahr – plane sie ein, aber verlass dich noch nicht allein darauf.', from: 1988 },
      { topic: 'liga', title: 'Hallenmasters im Winter', where: 'Statistiken › Halle',
        text: 'Die Hallentour mit Endrunde füllt die Winterpause, die Profis spielen mit.',
        inGame: 'Hallenturniere bringen Antrittsgeld und Ansehen – aber auch Verletzungsrisiko für deine Stammkräfte.' },
      { topic: 'taktik', title: 'Raumdeckung aus Italien', where: 'Spieltag › Taktik',
        text: 'Sacchis AC Mailand zeigt Viererkette und Pressing; in Deutschland bleibt der Libero vorerst Standard.',
        inGame: 'Wer früh moderne Formationen probiert, braucht schnelle, taktisch kluge Verteidiger.' },
      { topic: 'taktik', title: 'Sportmedizin holt auf', where: 'Verein › Vereinsgelände',
        text: 'Reha-Zentren und moderne Diagnostik verkürzen die Ausfallzeiten.',
        inGame: 'Ein Ausbau der medizinischen Abteilung bringt Verletzte schneller zurück.', from: 1990 },
      { topic: 'politik', title: 'Der Osten öffnet sich', where: 'Transfers › Transfermarkt',
        text: 'Nach dem Mauerfall wechseln die ersten Spieler der DDR-Oberliga in den Westen.',
        inGame: 'Schau dir die Spieler aus dem Osten an – oft gut ausgebildet und günstig.', from: 1989 },
    ],
  },
  {
    from: 1992, to: 1994, label: 'Rückpassregel und Champions League', motif: 'video',
    tips: [
      { topic: 'regeln', title: 'Der Torwart muss mitspielen', where: 'Kader › Übersicht',
        text: 'Seit 1992 darf der Torwart einen absichtlichen Rückpass nicht mehr in die Hand nehmen.',
        inGame: 'Ein Torwart mit sicherem Fuß wird wertvoller; Zeitspiel über den Keeper ist vorbei.' },
      { topic: 'liga', title: 'Die Meisterliga lockt', where: 'Statistiken › International',
        text: 'Aus dem Landesmeister-Pokal wird eine Liga mit Gruppenphase und deutlich höheren Prämien.',
        inGame: 'Die Meisterschaft ist jetzt auch finanziell ein Sprung – der Abstand zu den anderen Wettbewerben wächst.' },
      { topic: 'geld', title: 'Fanartikel werden Geschäft', where: 'Finanzen › Marketing',
        text: 'Trikots und Schals werden zum Massenartikel, die Vereine gründen eigene Vermarktungsabteilungen.',
        inGame: 'Marke und Vermarktung bringen zusätzliches Geld – Erfolg und Ansehen steigern den Wert.' },
    ],
  },
  {
    from: 1995, to: 1999, label: 'Bosman und die Drei-Punkte-Regel', motif: 'stripes',
    tips: [
      { topic: 'geld', title: 'Auslaufende Verträge = ablösefrei', where: 'Kader › Verträge',
        text: 'Seit dem Bosman-Urteil darf ein Spieler nach Vertragsende ohne Ablöse wechseln.',
        inGame: 'Verlängere wichtige Spieler mindestens ein Jahr vor Ablauf – oder verkaufe sie, solange sie noch Geld bringen.' },
      { topic: 'regeln', title: 'Siege zählen dreifach', where: 'Spieltag › Taktik',
        text: 'Ein Sieg bringt jetzt drei Punkte, ein Remis weiter nur einen.',
        inGame: 'Mut wird belohnt: In engen Spielen lohnt es sich, auf Sieg zu spielen statt den Punkt zu verwalten.' },
      { topic: 'regeln', title: 'Drei Wechsel, breiterer Kader', where: 'Spieltag › Aufstellung',
        text: 'Pro Spiel dürfen drei Spieler eingewechselt werden.',
        inGame: 'Ein starker Joker auf der Bank entscheidet Spiele – plane zwei, drei gute Ergänzungsspieler ein.' },
      { topic: 'geld', title: 'Der Markt wird europäisch', where: 'Transfers › Transfermarkt',
        text: 'EU-Spieler zählen nicht mehr als Ausländer, die Kader werden internationaler.',
        inGame: 'Schau dich im Ausland um – die Auswahl wird größer, die Gehälter steigen schneller.' },
      { topic: 'geld', title: 'Kapital für den Verein', where: 'Verein › Vorstand',
        text: 'Ab 1998 dürfen Vereine ihre Profiabteilung in eine Kapitalgesellschaft ausgliedern.',
        inGame: 'Ein Investor bringt frisches Geld, kostet aber Mitsprache – überleg dir den Schritt gut.', from: 1998 },
    ],
  },
  {
    from: 2000, to: 2004, label: 'Euro, Fernsehkrise und Leistungszentren', motif: 'digital',
    tips: [
      { topic: 'taktik', title: 'Viererkette statt Libero', where: 'Spieltag › Taktik',
        text: 'Nach der schwachen EM 2000 stellt der deutsche Fußball um: Raumdeckung und Viererkette werden Standard.',
        inGame: 'Moderne Formationen setzen sich durch – Außenverteidiger mit Tempo werden gefragt.' },
      { topic: 'liga', title: 'Ohne Leistungszentrum keine Lizenz', where: 'Jugend › Akademie',
        text: 'Die Profivereine müssen ein Nachwuchsleistungszentrum betreiben.',
        inGame: 'Prüfe die Mindestausstattung deiner Akademie rechtzeitig – Bauten brauchen Zeit.' },
      { topic: 'geld', title: 'Die Zahlen halbieren sich', where: 'Finanzen › Bilanz',
        text: 'Ab 2002 wird in Euro bezahlt, ein Euro sind knapp zwei Mark.',
        inGame: 'Alle Beträge stehen ab jetzt in Euro – die Werte bleiben gleich, nur die Zahlen werden kleiner.', from: 2001 },
      { topic: 'geld', title: 'Vorsicht bei langen Gehältern', where: 'Kader › Verträge',
        text: 'Mit der Pleite der Kirch-Gruppe brechen 2002 die Fernseheinnahmen ein, viele Vereine geraten in Not.',
        inGame: 'Binde dich nicht mit hohen Gehältern über Jahre – Einnahmen können plötzlich sinken.', from: 2002 },
    ],
  },
  {
    from: 2005, to: 2010, label: 'Arenen und Sommermärchen', motif: 'digital',
    tips: [
      { topic: 'geld', title: 'Das Stadion als Geldquelle', where: 'Verein › Stadion',
        text: 'Rund um die WM 2006 entstehen im ganzen Land moderne Arenen mit Logen und Business-Seats.',
        inGame: 'Logen, Sitzplätze und Namensrechte bringen deutlich mehr pro Zuschauer als früher.' },
      { topic: 'taktik', title: 'Sportwissenschaft im Alltag', where: 'Verein › Mitarbeiter',
        text: 'Leistungsdiagnostik, Ernährung und Belastungssteuerung gehören zur Grundausstattung.',
        inGame: 'Fitness- und Medizinpersonal senken das Verletzungsrisiko – im dichten Terminkalender wichtig.' },
      { topic: 'medien', title: 'Junge Spieler bekommen Chancen', where: 'Jugend › Mannschaften',
        text: 'Die ersten Jahrgänge aus den Leistungszentren drängen in die Profikader.',
        inGame: 'Eigene Talente sind günstig und loyal – gib ihnen Einsätze, damit sie sich entwickeln.' },
    ],
  },
  {
    from: 2011, to: 2019, label: 'Gegenpressing und Fernsehmilliarden', motif: 'grid',
    tips: [
      { topic: 'geld', title: 'Finanzielles Fairplay', where: 'Finanzen › Bilanz',
        text: 'Die UEFA prüft, ob Vereine nicht mehr ausgeben, als sie einnehmen.',
        inGame: 'Im Europapokal zählt eine ausgeglichene Bilanz – Verluste können Auflagen nach sich ziehen.' },
      { topic: 'taktik', title: 'Gegenpressing', where: 'Spieltag › Taktik',
        text: 'Ballverlust heißt sofort angreifen: Dortmund und später viele andere spielen mit extremer Laufintensität.',
        inGame: 'Hohes Pressing braucht frische Spieler – rotiere und achte auf die Belastung.' },
      { topic: 'medien', title: 'Scouting mit Daten', where: 'Transfers › Beobachtung',
        text: 'Videoanalyse und Leistungsdaten ergänzen den Blick des Scouts.',
        inGame: 'Beobachte Spieler länger, bevor du kaufst – die Einschätzung wird mit der Zeit genauer.' },
      { topic: 'geld', title: 'Fernsehgeld ist die Hauptquelle', where: 'Finanzen › Bilanz',
        text: 'Die Medienverträge wachsen in Milliardenhöhe und überholen den Spieltag als Einnahme.',
        inGame: 'Tabellenplätze über mehrere Jahre bringen Geld – Konstanz zahlt sich aus.' },
    ],
  },
  {
    from: 2020, to: 2029, label: 'Fünf Wechsel und volle Terminkalender', motif: 'grid',
    tips: [
      { topic: 'regeln', title: 'Fünf Auswechslungen', where: 'Spieltag › Aufstellung',
        text: 'Seit 2020 darf jede Mannschaft fünfmal wechseln.',
        inGame: 'Die Bank wird zur zweiten Elf – Kadertiefe ist so wichtig wie nie.' },
      { topic: 'medien', title: 'Spiele ohne Publikum', where: 'Finanzen › Bilanz',
        text: 'In der Pandemie fehlen die Zuschauer, die Spieltagseinnahmen brechen weg.',
        inGame: 'Halte Reserven vor – Einnahmen aus dem Stadion können ausfallen.', from: 2020, to: 2021 },
      { topic: 'medien', title: 'Der Verein als Marke', where: 'Finanzen › Marketing',
        text: 'Soziale Medien und Auslandsreisen machen Vereine weltweit bekannt.',
        inGame: 'Marke und internationale Vermarktung steigern Sponsoring und Fanartikel.' },
    ],
  },
  {
    from: 2030, to: 2099, label: 'Ein Blick in die Zukunft', motif: 'future',
    tips: [
      { topic: 'geld', title: 'Gehälter unter Aufsicht', where: 'Kader › Verträge',
        text: 'Lizenzauflagen begrenzen den Anteil der Gehälter am Umsatz (fiktive Entwicklung).',
        inGame: 'Achte auf das Verhältnis von Gehältern zu Einnahmen.', from: 2034 },
      { topic: 'liga', title: 'Nachhaltige Stadien', where: 'Verein › Stadion',
        text: 'Neue Auflagen verlangen klimafreundlichen Betrieb (fiktive Entwicklung).',
        inGame: 'Plane Umbauten langfristig und mit Puffer.', from: 2038 },
      { topic: 'medien', title: 'Die weltweite Bühne', where: 'Finanzen › Marketing',
        text: 'Streaming-Dienste und Auslandsmärkte verteilen das Mediengeld neu (fiktive Entwicklung).',
        inGame: 'Marke und Ansehen bestimmen deine Einnahmen stärker denn je – Erfolg über Jahre zahlt sich aus.' },
      { topic: 'taktik', title: 'Kadertiefe gewinnt', where: 'Kader › Übersicht',
        text: 'Der Terminkalender bleibt voll, die Belastung hoch.',
        inGame: 'Ein breiter, ausgeglichener Kader trägt dich durch die Saison.' },
    ],
  },
];

/** Epoche zum Saison-Startjahr (vor 1975 die erste, danach die letzte). */
export function eraFor(startYear: number): EraTipSet {
  return ERA_TIPS.find((e) => e.from <= startYear && startYear <= e.to)
    ?? (startYear < ERA_TIPS[0].from ? ERA_TIPS[0] : ERA_TIPS[ERA_TIPS.length - 1]);
}

/** Die in dieser Saison geltenden Tipps (Epoche, eingeschränkt auf from/to). */
export function eraTipsFor(startYear: number): EraTip[] {
  return eraFor(startYear).tips.filter((t) => (t.from ?? 0) <= startYear && startYear <= (t.to ?? 9999));
}
