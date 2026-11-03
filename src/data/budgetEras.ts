// =============================================================================
// SAISONBUDGET — Einordnung der Epoche durch den Finanzberater
// -----------------------------------------------------------------------------
// Je Zeitraum zwei bis drei Formulierungen (Auswahl deterministisch je Saison).
// Nur belegte Aussagen; Quellen je Eintrag. Platzhalter: {tvPool} = TV-Topf der
// 1. Liga im laufenden Jahr (engine/tvMoney.ts, nach echten Rechteverträgen).
// =============================================================================

export interface BudgetEra { from: number; to: number; lines: string[] }

export const BUDGET_ERAS: BudgetEra[] = [
  // Quellen: docs/recherche/FINANZEN_Recherche_1975.md (Trikotwerbung seit Herbst 1973 zugelassen;
  // TV-Rechte 1975/76 insgesamt 4,8 Mio. DM – Spiegel „TV-Gelder von 1965 bis heute“; Eintritt wichtigste Säule).
  { from: 1975, to: 1977, lines: [
    'Wir leben von den Zuschauern: Eintritt, Würstchen und Programmhefte sind unser wichtigstes Standbein. Trikotwerbung ist erst seit Herbst 1973 erlaubt, und für die Fernsehrechte zahlen ARD und ZDF 1975/76 der ganzen Bundesliga zusammen nur 4,8 Mio. DM.',
    'Das Geld kommt über die Kassenhäuschen. Fernsehgeld ist ein kleiner Zuschuss – die Sender zahlen der ganzen Bundesliga 1975/76 gerade 4,8 Mio. DM –, und Trikotwerbung gibt es erst seit 1973.',
  ] },
  // Quelle: docs/recherche/transferrekorde.md (1976 erster Wechsel für 1 Mio. DM, Roger Van Gool nach Köln).
  { from: 1978, to: 1983, lines: [
    'Der Markt wird teurer: Seit 1976 Roger Van Gool für eine Million DM nach Köln ging, sind Millionen-Ablösen kein Tabu mehr. Unsere Einnahmen wachsen aber weiter vor allem über die Ränge.',
    'Seit dem ersten Millionen-Transfer 1976 (Van Gool nach Köln) ziehen die Ablösen an. Die Kasse füllt sich weiter in erster Linie am Spieltag – das Fernsehen bleibt ein Nebengeschäft.',
  ] },
  // Quellen: engine/economy.ts ATTENDANCE_DEMAND (Zuschauertal Mitte der 1980er, Schnitt rund 19.000);
  // engine/tvMoney.ts (TV-Topf 1984/85 rund 10 Mio. DM für die Bundesliga, basicthinking.de).
  { from: 1984, to: 1987, lines: [
    'Mitte der Achtziger kommen weniger Leute ins Stadion als ein Jahrzehnt zuvor – der Bundesliga-Schnitt fällt unter 20.000. Wer seine Ausgaben nach den Zuschauerzahlen der Siebziger plant, plant zu hoch.',
    'Die Ränge werden leerer, die Ligen-Schnitte sind so niedrig wie lange nicht. Das Fernsehen zahlt mehr als früher, aber noch keine Summen, die einen Verein tragen.',
  ] },
  // Quelle: engine/tvMoney.ts / FINANZEN_SPEC §10.4 (Rechte 1988/89 rund 40 Mio. DM statt zuvor rund 18 Mio.; Privatfernsehen).
  { from: 1988, to: 1991, lines: [
    'Mit dem Privatfernsehen steigt der Preis für die Bundesliga-Rechte sprunghaft: 1988/89 sind es rund 40 Mio. DM für die Liga. Das Fernsehgeld wird zum planbaren Posten.',
    'Das Fernsehen entdeckt den Fußball: Der neue Rechtevertrag 1988/89 bringt der Liga rund 40 Mio. DM – mehr als das Doppelte des alten. Damit können wir erstmals fest planen.',
  ] },
  // Quellen: engine/tvMoney.ts (1992/93 rund 145 Mio. DM); docs/recherche/FINANZEN_Recherche_Entwicklung_1980_heute.md (Sat.1 „ran“).
  { from: 1992, to: 1995, lines: [
    'Seit 1992/93 zahlt das Privatfernsehen rund 145 Mio. DM für die Liga – Sat.1 zeigt „ran“. Die TV-Gelder holen bei uns zu den Zuschauern auf.',
    'Die neuen Fernsehverträge verändern die Rechnung: Rund 145 Mio. DM fließen seit 1992/93 an die Liga. Der Spieltag bleibt wichtig, ist aber nicht mehr alles.',
  ] },
  // Quelle: docs/recherche/FINANZEN_Recherche_Entwicklung_1980_heute.md (Bosman-Urteil 15.12.1995:
  // ablösefrei nach Vertragsende, Gehälter/Handgelder steigen, Vertragslaufzeiten entscheiden).
  { from: 1996, to: 1999, lines: [
    'Seit dem Bosman-Urteil vom Dezember 1995 gehen Spieler nach Vertragsende ablösefrei. Das gesparte Geld wandert in Gehälter und Handgelder – achte auf die Laufzeiten, sonst verlieren wir Werte umsonst.',
    'Bosman hat den Markt gedreht: Ablösen gibt es nur noch für Spieler mit Vertrag, dafür steigen Gehälter und Handgelder. Das Gehaltsbudget ist jetzt der wichtigste Posten.',
  ] },
  // Quelle: engine/tvMoney.ts (Kirch-Vertrag 2000/01: 355 Mio. € für die Bundesliga).
  { from: 2000, to: 2001, lines: [
    'Der Kirch-Vertrag bringt der Bundesliga ab 2000/01 rund 355 Mio. € im Jahr – so viel Fernsehgeld gab es noch nie. Plane trotzdem nicht jede Mark fest ein: Solche Verträge hängen an einem einzigen Geldgeber.',
    'Fernsehgeld in Rekordhöhe: Kirch zahlt der Liga rund 355 Mio. € pro Saison. Das Fernsehen ist jetzt unsere größte planbare Einnahme.',
  ] },
  // Quellen: engine/economy.ts (Euro ab 2002); data/history.ts tvMarketFactor + engine/tvMoney.ts (Kirch-Pleite 2002, TV-Delle).
  { from: 2002, to: 2004, lines: [
    'Seit 2002 rechnen wir in Euro. Und die Kirch-Pleite zeigt, wie schnell Fernsehgeld wegbrechen kann: Die Liga bekommt weniger als im Vertrag stand. Der Vorstand will deshalb mehr Reserve sehen.',
    'Neue Währung, alte Sorgen: Nach der Pleite der Kirch-Gruppe 2002 sind die TV-Gelder gesunken. Eine ordentliche Reserve ist jetzt Pflicht, nicht Kür.',
  ] },
  // Quelle: docs/recherche/FINANZEN_Recherche_Entwicklung_1980_heute.md (2000er/2010er: Ausgliederungen,
  // Mehrsäulenmodell, Sponsoring/Hospitality/Merchandising gewinnen gegenüber Eintritt).
  { from: 2005, to: 2012, lines: [
    'Wir stehen inzwischen auf mehreren Säulen: Fernsehen, Sponsoring und Hospitality tragen mehr als der Eintritt. Logen und Business-Seats sind kein Luxus mehr, sondern Einnahmequelle.',
    'Vermarktung ist zur zweiten großen Säule geworden. Wer Logen, Partner und Fanartikel im Griff hat, ist weniger abhängig vom Tabellenplatz.',
  ] },
  // Quelle: engine/tvMoney.ts (2013/14 rund 628 Mio. € für die Bundesliga).
  { from: 2013, to: 2016, lines: [
    'Der Fernsehvertrag ab 2013/14 bringt der Bundesliga rund 628 Mio. € pro Saison. Das hebt alle Etats – auch die der Konkurrenz, die damit Gehälter treibt.',
    'TV-Geld steigt kräftig: Seit 2013/14 sind es rund 628 Mio. € für die Liga. Mehr Geld heißt aber auch höhere Gehaltsforderungen.',
  ] },
  // Quellen: engine/tvMoney.ts (2017/18: 1,16 Mrd. € + Auslandsvermarktung; Verteilung nach vier Säulen);
  // FINANZEN_Recherche_Entwicklung_1980_heute.md (Ärmelsponsoring seit 2017/18).
  { from: 2017, to: 2019, lines: [
    'Ab 2017/18 fließt rund 1,16 Mrd. € nationales Fernsehgeld plus Auslandsvermarktung. Der Tabellenplatz entscheidet stärker über unseren Anteil, und seit dieser Saison lässt sich auch der Ärmel vermarkten.',
    'Fernsehgeld in Milliardenhöhe: Rund 1,16 Mrd. € pro Saison national, dazu das Ausland. Ein guter Tabellenplatz zahlt sich jetzt direkt aus.',
  ] },
  // Quellen: data/timeline.ts (Unterbrechung März 2020); FINANZEN_Recherche_Entwicklung_1980_heute.md
  // (DFL Wirtschaftsreport 2023: 2021/22 noch unter Vorkrisenniveau).
  { from: 2020, to: 2022, lines: [
    'Seit der Unterbrechung im März 2020 wissen wir, wie verletzlich der Spieltag ist. Die Liga lag 2021/22 noch unter dem Umsatz vor der Krise – ich plane die Spieltagserlöse vorsichtig.',
    'Nach der Pandemie-Pause erholen sich die Umsätze nur langsam. Der Spieltag ist das unsicherste Standbein; TV und Sponsoring tragen uns.',
  ] },
  // Quellen: FINANZEN_Recherche_Entwicklung_1980_heute.md (DFL 2023/24: 4,80 Mrd. € Umsatz, Medien 31,95 %,
  // Spielbetrieb 10,91 %; nationaler Zyklus 2025/26–2028/29 Ø 1,121 Mrd. € je Saison).
  { from: 2023, to: 2100, lines: [
    'Die Bundesliga setzt inzwischen fast fünf Milliarden Euro um; Medien sind mit rund einem Drittel der größte Posten, der Spieltag bringt nur noch gut ein Zehntel. Der nationale Rechtezyklus ab 2025/26 bringt im Schnitt 1,121 Mrd. € pro Saison.',
    'Heute sind Medien mit rund einem Drittel des Liga-Umsatzes die wichtigste Säule; Ticketing liegt bei gut zehn Prozent. Wer planen will, plant vom TV-Geld aus.',
  ] },
];

export function eraLines(year: number): string[] {
  return (BUDGET_ERAS.find((e) => year >= e.from && year <= e.to) ?? BUDGET_ERAS[BUDGET_ERAS.length - 1]).lines;
}
