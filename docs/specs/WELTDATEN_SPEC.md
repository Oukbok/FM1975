# Weltdaten 1975–2025 (Wunsch Pascal)

Ziel: Alle Europapokal-Länder mit echten, **verfremdeten** Vereinen; Start in **jedem Jahr** 1975–2025
(Standard 1975). Dafür braucht jede Saison die echte Zusammensetzung der Ligen und die
Europapokal-Teilnehmer. Dieses Dokument legt das gemeinsame Datenformat fest – Recherche
(viele Länder parallel) und Spiellogik (ein Strang) arbeiten dagegen.

## Dateien (nur Daten, keine Logik)

- `src/data/world/clubs/<cc>.ts` – alle Vereine eines Landes, die 1975–2025 in den erfassten
  Ligen gespielt haben: `export const CLUBS_<CC>: RealClub[]`.
- `src/data/world/seasons/<cc>.ts` – je Saison die Ligen: `export const SEASONS_<CC>: Record<number, SeasonRow>`
  (Schlüssel = Startjahr: `1975` = Saison 1975/76).
- `docs/recherche/weltvereine_<cc>.md` – Quellen, **echte Namen** ↔ verfremdete Namen/IDs, Unsicherheiten.
  Echte Vereinsnamen stehen **nur** hier, nie im Code/Spiel.
- `<cc>` = dreistelliger Ländercode klein (FIFA/IOC-Stil): `ger`, `gdr`, `eng`, `sco`, `ita`, `esp`,
  `fra`, `ned`, `por`, `bel`, `aut`, `sui`, `tur`, `gre`, `urs`, `rus`, `ukr`, `yug`, `srb`, `cro`, `tch`,
  `cze`, `svk`, `pol`, `hun`, `rou`, `bul`, `swe`, `nor`, `den`, `fin`, `isl`, `irl`, `nir`, `wal`, `alb`,
  `cyp`, `mlt`, `lux`, `isr`, … (Nachfolgestaaten ab ihrem ersten Europapokal-Jahr).

## Typen (werden in `src/data/world/types.ts` definiert)

```ts
export interface RealClub {
  id: string;            // `<cc>-<slug>` aus dem verfremdeten Namen, z. B. 'eng-liverpool-rot'; nie ändern
  name: string;          // verfremdet, s. u.
  short: string;         // 3 Großbuchstaben, z. B. 'LIR'
  city: string;          // deutscher Ortsname, wo üblich (Mailand, Rom, Lissabon, Moskau)
  colors: { primary: string; secondary: string };  // Hex, Vereinsfarben
  rename?: [number, string][];  // optionale spätere Namen (verfremdet) ab Jahr
}
export interface SeasonRow {
  t1: string[];          // 1. Liga in Abschlusstabellen-Reihenfolge (Platz 1 = Meister)
  t2?: string[];         // 2. Liga (nur Top-8-Länder + Deutschland/DDR), Reihenfolge wenn bekannt
  t2b?: string[];        // zweite Staffel der 2. Liga (z. B. 2. Bundesliga Nord/Süd bis 1980/81, DDR-Liga-Staffeln zusammengefasst ok)
  cup?: string;          // Landespokalsieger
  cupFinalist?: string;
  euro?: Partial<Record<'ec' | 'cwc' | 'uefa' | 'cl' | 'el' | 'ecl', string[]>>; // Teilnehmer des Landes in DIESER Saison
  note?: string;         // Besonderheiten (Punktabzug, Zwangsabstieg, Ligareform)
}
```

## Verfremdung der Namen (rechtlich unbedenklich, aber erkennbar)

- Schema wie heute im Spiel: **Stadt** (deutscher Name, wo üblich), bei mehreren Vereinen einer
  Stadt **+ Vereinsfarbe(n)**: „Liverpool Rot“, „Liverpool Blau“, „Mailand Rot-Schwarz“,
  „Mailand Blau-Schwarz“, „Madrid Weiß“, „Madrid Rot-Weiß“, „Lissabon Rot“, „Lissabon Grün“.
- Ein Verein allein in seiner Stadt heißt nur nach der Stadt („Bremen“, „Porto Blau“ nur wenn nötig).
- **Keine** Markenbestandteile: kein „Real“, „AC“, „Inter“, „United“, „City“, „Ajax“, „Benfica“,
  „Celtic“, „Rangers“, „Juventus“, „Borussia“, „Bayern“, Sponsornamen (Bayer, PSV-Philips …),
  keine Wappen-/Spitznamen-Anspielungen. Stadtteile sind erlaubt, wenn nötig („London Nord“,
  „London Ost“, „Istanbul Gelb-Rot“).
- Deutschland: **vorhandene IDs und Namen im Spiel weiterverwenden** (`data/generate.ts`,
  `data/history/historicClubs.ts`, `data/ddr.ts`); neue Vereine im gleichen Stil.
- Bestehende Namen der Hintergrund-Simulation (`data/worldSeed.ts`, `data/europe.ts`) nach
  Möglichkeit übernehmen, damit alte Spielstände wiedererkennbar bleiben.
- `npm run test:names` (Sperrliste + Levenshtein) muss grün bleiben.

## Umfang je Land

- Deutschland (`ger`): Bundesliga + 2. Bundesliga (Nord/Süd bis 1980/81) jede Saison; ab 2008/09
  zusätzlich 3. Liga als `t3`? – nein: nur t1/t2, tiefere Ligen bleiben Pool. DDR (`gdr`) 1975–1990/91:
  Oberliga (t1) + DDR-Liga (t2, Staffeln zusammen in `t2`).
- Top 8 (`ger`, `eng`, `ita`, `esp`, `fra`, `ned`, `por`, `bel`): t1 + t2, jede Saison 1975–2025.
- Übrige Europapokal-Länder: t1 jede Saison, in der das Land existiert; dazu `cup` und `euro`.
- `euro` immer füllen (welche Vereine des Landes in welchem Wettbewerb der Saison spielten) –
  daraus bauen sich die Europapokal-Felder beim Start in einem beliebigen Jahr.
- Wo etwas unsicher ist: Eintrag trotzdem, Unsicherheit in der Recherche-Datei notieren.
