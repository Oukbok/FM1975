# FINANZEN_SPEC — Tiefes Finanzsystem für „1975 – A Football Manager"

> **Finanzniveau (Sammel-Update v11):** Alle Werte unten sind auf das recherchierte Niveau gebracht (`docs/recherche/FINANZEN_Recherche_1975.md`): Erstligist 1975/76 im Median ≈ **4,5 Mio. DM** Umsatz (Spanne ≈ 2,5–9 Mio.), Marktgehalt `1.400 × 2^((Stärke − 72)/11)` DM/Woche (Stammspieler ≈ 73.000, Star ≈ 230.000 DM/Jahr), TV-Topf 4,2 Mio. DM, Bezugsumsatz `AVG_REVENUE_1975 = 4,5 Mio.` Ablösen/Marktwerte folgen unverändert der Rekordkurve. Zuschauer: Grund-Auslastung × Nachfrage der Epoche (`attendanceDemand`), Preise je Besucher × `matchdayPriceScale = revenueScale('matchday') / attendanceDemand`. Alte Spielstände rechnet `game/financeMigration.ts` einmalig um. Gesamtbild und Kalibrierung: Abschnitt 9.
>
> **Hinweis (Finanzen 2.0):** Die 1975-Werte dieser Spezifikation gelten weiter. Wie die Erlösarten über die Jahrzehnte wachsen (Erlös-Mix, zentrale TV-Verteilung statt Heimspiel-TV, Vermarktung & Hospitality, Marke, KI-Haushalt, Fairplay) regeln `engine/economy.ts` (`revenueScale`) und `engine/clubEconomy.ts`; Beschreibung im In-Game-Wiki (Artikel `finance-epochs`).

Ziel (Pascals Vorgaben): **1.** Spieltag-Einnahmen + monatliche Fixkosten; **existierende Gebaeude bekommen ebenfalls Fixkosten.** **2.** Mikromanagement **sehr tief.** **3.** Wuerstchenbuden/Catering **jetzt** als ausbaubares Gebaeude (3 Betriebsformen). **4.** **Alles andocken** (Finanzen, Sponsoring, Marketing, Stadion, Gelaende, Fans, Stab, Vertraege) und **komplex** gestalten.

Grundregeln des Projekts bleiben: alle Betraege NOMINAL in DM, Anzeige aera-gerecht via `formatMoney/formatMoneyShort` (DM bis 2001, EUR ab 2002). Jede neue Erloes-/Kostengroesse wird mit `economyScale(year)` multipliziert (1975 = 1.0). Keine neuen Emojis in der UI — neue Icons via `<Icon>` aus `iconPaths.ts`. Alte Speicherstaende muessen defensiv weiterladen (neue Felder optional + Migration in `doLoad`).  Footer/Box-Hoehen unveraendert.

Dieses Dokument ist die **verbindliche Formel-Referenz**. Die zwei Beispielbilanzen (Frankfurt Rot, 1975) werden aus genau diesen Formeln gerechnet und muessen daher mit dem Spiel uebereinstimmen.

---

## 1. Datenmodell (types/index.ts)

### 1.1 Neue FinanceCategory-Werte
Ergaenze die Union `FinanceCategory` um:
`'catering' | 'advertising' | 'membership' | 'matchday' | 'facilities'`
(Trikotsponsoring nutzt weiterhin `'sponsorship'`.)

### 1.2 ClubFinances — neue Buckets
`income` erhaelt: `catering`, `advertising`, `membership`, `matchday` (alle `number`, Default 0).
`expenses` erhaelt: `facilities` (`number`, Default 0). `sponsorship`-Bucket im income bleibt und bedeutet ab jetzt **nur Trikotsponsoring**.

Passe an: `INCOME_BUCKET`/`EXPENSE_BUCKET` (finances.ts), `totalIncome`/`totalExpense`, `INCOME_ROWS`/`EXPENSE_ROWS` (App.tsx), Migration in `doLoad` (fehlende Buckets mit 0 nachruesten).

### 1.3 Infrastruktur — Catering-Gebaeude
`FacilityKey` erhaelt `'catering'`. `ClubInfrastructure` erhaelt `catering?: number` (Stufe 1–5, Default 1). Ab 1975 verfuegbar (kein `unlockYear`).

### 1.4 Kommerz-/Vertragsobjekt am Club
```ts
export type CateringMode = 'eigenbetrieb' | 'umsatz' | 'verpachtung';
export interface SponsorContract {
  name: string;        // Sponsor-/Vermarkter-Name
  annualValue: number; // NOMINAL DM/Jahr (bereits era-skaliert beim Abschluss gespeichert? NEIN: 1975-Basis speichern, Buchung skaliert zur Laufzeit)
  yearsTotal: number;  // Laufzeit gesamt (Saisons)
  yearsLeft: number;   // Restlaufzeit (Saisons)
}
export interface SponsorOffer { name: string; annualValue: number; years: number; }
export interface ClubCommerce {
  shirtSponsor?: SponsorContract;   // Trikot
  banden?: SponsorContract;         // Bandenwerbung
  cateringMode: CateringMode;       // Default 'verpachtung'
  shirtOffers?: SponsorOffer[];     // je Saison neu erzeugt (Verhandlung)
  bandenOffers?: SponsorOffer[];
}
```
`Club.commerce?: ClubCommerce;` (optional → Migration erzeugt Default). `annualValue` in Contract/Offer wird in **1975-DM-Basis** gespeichert und bei jeder Buchung mit `economyScale(year)` skaliert (damit ein 5-Jahres-Vertrag ueber die Dekaden real konstant bleibt, nominal aber mitwaechst — konsistent mit dem uebrigen System).

---

## 2. Neue Einnahmen

Alle Formeln liefern DM in 1975-Basis; **jede** wird mit `scale = economyScale(year)` multipliziert (in den Beispielbilanzen 1975 → scale = 1).

### 2.1 Trikotsponsoring (monatlich, bucket `sponsorship`, Kategorie `sponsorship`)
Aus aktivem `commerce.shirtSponsor`: `monat = round(shirtSponsor.annualValue / 12 * scale)`. Ohne Vertrag = 0.
**Vertragsstufen (historische Anker, 1975-DM/Jahr):** Regional 100.000 · National 275.000 · Premium 500.000. Angebote je Saison abhaengig von Reputation & Tabelle. Frankfurt (Ruf 80) erhaelt typ. National-Angebote um 275.000 (histor. Remington-Anker).
Angebots-Generator: `annual = tier * (0.85 + reputation/100 * 0.4)` gerundet auf 5.000; 2–3 Angebote/Saison, Laufzeit 1–5 J.

### 2.2 Bandenwerbung (monatlich, NEUER bucket `advertising`, Kategorie `advertising`)
Aus aktivem `commerce.banden`: `monat = round(banden.annualValue / 12 * scale)`. Ohne Vertrag = 0.
**Wert-Modell (1975-DM/Jahr):** `base = 80.000 + capacity/1000 * 1500 + reputation * 800`, gedeckelt auf 300.000, Boden 100.000. Angebote je Saison (1–3 J.). Frankfurt: 80.000 + 62*1500 + 80*800 = 80.000+93.000+64.000 = **237.000 DM/Jahr** → gerundet 235.000.

### 2.3 Mitgliedsbeitraege (monatlich, NEUER bucket `membership`, Kategorie `membership`)
`jahr = round((30.000 + reputation * 1.000) * scale)` bzw. Mitglieder × 40 DM (Vereinsumfeld); `monat = round(jahr/12)`. Frankfurt: 30.000+80.000 = **110.000/Jahr → 9.167/Monat**.

### 2.4 Catering / Wuerstchenbuden (pro Heimspiel + evtl. monatliche Pacht)
Neuer bucket `catering`, Kategorie `catering`. Abhaengig von `infrastructure.catering` (Stufe) und `commerce.cateringMode`.
**Netto-Erloes je Besucher (DM, 1975-Basis), NETPERHEAD[mode][level]** (level 1..5):
- eigenbetrieb: `[0, 0.60, 0.85, 1.10, 1.35, 1.60]`
- umsatz:       `[0, 0.45, 0.62, 0.80, 0.98, 1.18]`
- verpachtung:  `[0, 0.20, 0.28, 0.36, 0.44, 0.52]`
Pro Heimspiel (Liga & Pokal): `catering = round(attendance * NETPERHEAD[mode][level] * scale)`.
**Zusaetzliche feste Monatspacht** nur bei `verpachtung` (Betreiber zahlt fix): `LEASE[level] = [0, 4.000, 6.000, 8.000, 11.000, 14.000]` → `monat = round(LEASE[level] * scale)`, gebucht im Monatsabschluss als `catering`.
(Design: Eigenbetrieb = hoechster Pro-Kopf-Erloes, aber hoechste Gebaeude-Fixkosten/Risiko; Verpachtung = niedrigster Pro-Kopf, dafuer sichere Pacht + minimale Fixkosten; Umsatzbeteiligung = Mittelweg. Deckt Recherche-Spanne 0,50–1,50 DM/Besucher ab.)

### 2.5 Programmhefte & Spieltagserloese (pro Heimspiel, NEUER bucket `matchday`, Kategorie `matchday`)
`matchday = round(attendance * 0.25 * scale)` je Heimspiel (Liga & Pokal). (17 Heimspiele × Ø 46.500 ≈ 197.000/Jahr → im Recherche-Korridor 50.000–200.000.)

### 2.6 Eintritt, Fanartikel, Prämien
- `ticket = attendance * ticketPrice * ticketFactor * matchdayPriceScale(year)`; Ticketpreis 1975 ≈ 5–11 DM (`3 + Ruf × 0,07 ± 1`).
- `merch = attendance * merchPerHead * revenueScale('commercial') * commercialMultiplier`, `merchPerHead = (0,10 + Ruf/100 × 0,27) × Fanshop-Faktor` (1975 ≈ 0,30 DM).
- Catering und Programmhefte je Besucher ebenfalls × `matchdayPriceScale`.
- Leistungsprämie der Sponsoren: Sieg `6.000 + Ruf × 50`, Remis `2.000` (× Preis-Skala je Besucher). Platzierungsbonus monatlich 9.000 / 4.500 / 2.000 (Platz 1–3 / 4–6 / 7–10).
- TV: zentral, `TV_POOL_1975 = 4,2 Mio.` (1. Liga) × `revenueScale('tv')`; Pokal-Heimspiel `2.500 + Ruf × 50` × TV-Skala.
- Pokal-Preisgeld je Runde 7.500 / 15.000 / 30.000 / 60.000 / 120.000; Europapokal (EC) 15.000–120.000, Startgeld 18.000 / 12.000 / 7.500 (EC/CWC/UEFA), jeweils × scale (× euroMoneyFactor).

---

## 3. Neue/angepasste Ausgaben

### 3.1 Gebaeude-Fixkosten (monatlich, NEUER bucket `facilities`, Kategorie `facilities`) — Pascals Punkt 1
Jede gebaute Einrichtung verursacht monatliche Unterhaltskosten, die mit der Stufe steigen.
`upkeep(key, level) = round(FAC_UPKEEP_BASE[key] * LEVEL_MULT[level] * scale)`
`LEVEL_MULT = [0, 1, 1.4, 1.9, 2.5, 3.2]` (Index = Stufe 1..5).
`FAC_UPKEEP_BASE` (DM/Monat, Stufe-1-Basis, 1975):
- trainingCenter 1.400 · youthAcademy 1.050 · medical 875 · merchandising 700
- rehaCenter 1.050 · nlz 1.400 · performanceCenter 1.575 · dataCenter 1.225
- **stadium: NICHT hier** (bleibt in `stadiumMaintenance`, sonst Doppelzaehlung).
- **catering:** Sonderfall, Fixkosten je Modus (Personal/Ware vs. Pacht):
  `CATERING_UPKEEP[mode][level]`:
  - eigenbetrieb: `[0, 3.000, 4.500, 6.500, 9.000, 12.000]`
  - umsatz:       `[0, 1.500, 2.200, 3.000, 4.200, 5.500]`
  - verpachtung:  `[0, 800, 1.100, 1.500, 2.000, 2.600]`
**Wichtig zur Nicht-Zerstoerung der Balance:** Der bisherige Posten `trainingFacilities` (= `(8.000 + facilitiesQuality*220)*scale`) wird durch die neue Summe `facilities` ERSETZT (nicht zusaetzlich). D.h. `computeMonthly` gibt weiterhin `trainingFacilities` zurueck, aber jetzt als **0** ODER wir entfernen ihn aus der Netto-Rechnung und fuehren `facilities` als eigenen Posten. Konkret: `MonthlyBooking` bekommt Feld `facilities: number`; `trainingFacilities` entfaellt aus der Netto-Summe (auf 0 setzen und im UI durch `facilities` ersetzen). Zukunfts-Einrichtungen zaehlen nur ab Stufe ≥ 2 (Stufe 1 = Grundausbau, noch nicht gebaut).

### 3.2 Uebrige Monatsposten (unveraendert bzw. leicht)
`wages` (Spieler), `staffWages` (Betreuerstab/Stab, 18 % der Gehälter), `stadiumMaintenance` (`capacity*0,3 + (100−Zustand)*250`), `otherFixed`→bucket `other` (Verwaltung/Reisen/Sonstiges: `(2.500 + rep*200)*opScale`) bleiben. `placementBonus` (Sponsor-Erfolgsbonus) bleibt. Neu: **Auflauf-/Siegprämien an die Mannschaft** je Spiel (bucket `wages`): Sieg `0,55 ×`, Remis `0,2 ×` Wochen-Grundgehalt des Kaders (`currentWageBill`) × scale ≈ 15–20 % der Grundgehälter je Saison (Recherche). Gehaltsrahmen und KI-Gehaltsbudget teilen deshalb durch `WAGE_OVERHEAD = 1,36` (Stab + Prämien).
**Skalierung (Finanzen 2.0, Balance 2026):** `stadiumMaintenance` und `otherFixed` werden nicht mit `economyScale`, sondern mit `opScale = revenueScale('matchday', year)` multipliziert (Stadiongeschäft wächst bis 2024 ≈ ×25, der Gesamtmarkt ≈ ×100). Mit `economyScale` überstiegen diese Fixkosten ab den 1990ern die Zuschauererlöse von Dritt-/Viertligisten, die Hälfte der Liga war dauerhaft im Minus. 1975 gilt `opScale = scale = 1`; die Beispielbilanzen bleiben unverändert.

---

## 4. computeMonthly / bookMonthly (finances.ts)

`MonthlyBooking` erweitern:
```
{ wages, staffWages, stadiumMaintenance, facilities, otherFixed,
  sponsorship (=Trikot), advertising (=Banden), membership, cateringLease,
  placementBonus, net }
```
- `facilities` = Summe aller `upkeep(key,level)` inkl. Catering-Fixkosten.
- `sponsorship` = Trikot-Monatsrate (2.1). `advertising` = Banden-Monatsrate (2.2). `membership` (2.3). `cateringLease` = Pacht nur bei Verpachtung (2.4).
- `net = sponsorship + advertising + membership + cateringLease + placementBonus − wages − staffWages − stadiumMaintenance − facilities − otherFixed`.
`bookMonthly` bucht zusaetzlich: `advertising`→`advertising`, `membership`→`membership`, `cateringLease`→`catering`, `facilities`→`facilities`; Trikot weiterhin →`sponsorship`. Die alte Sponsoring-Pauschale `(15000+rep*1400)` entfaellt (durch echte Trikot/Banden/Mitglieder ersetzt).

`bookHomeMatch`/`bookCupHomeMatch` zusaetzlich buchen: `catering` (2.4 pro-Kopf) und `matchday` (2.5).

Migration/Defaults: Vereine ohne `commerce` → Default anlegen (cateringMode 'verpachtung', kein Sponsor/Banden zunaechst, oder KI-Vereine bekommen automatisch passende Vertraege beim Saisonstart). `infrastructure.catering` fehlt → auf `makeInfrastructure`-Default (Ruf-abhaengig, s.u.) bzw. 1.

`makeInfrastructure(reputation)`: ergaenze `catering`: `r>=80?2 : 1`. `makeFinances` ergaenze neue income/expense-Buckets mit 0.

---

## 5. Ticket-Preis-Elastizitaet (Deep Ticketing, match.ts `estimateAttendance`)

Erweitere die Auslastung um Preis- und Ruf-Elastizitaet, damit die Preispolitik wirkt:
```
refPrice = 3 + reputation * 0.07                    // „fairer" Preis (1975-Basis)
priceFactor = clamp(1 - (ticketPrice - refPrice)/refPrice * 0.5, 0.60, 1.15)
opponent = clamp(1 + (awayRep - 70)/120, 0.88, 1.2)
rate = clamp(baseRate * priceFactor * opponent * (derby ? 1.15 : 1) * attendanceDemand(year) + (rng()-0.5)*0.10, 0.12, 1.0)
attendance = round(capacity * rate)
```
`baseRate = stadium.averageAttendanceRate` (1975: `0,17 + Ruf × 0,0036 ± 0,05`, Ø ≈ 0,45 bei Ø 50.000 Plätzen → Ø 23.000 Zuschauer). KI-Vereine: `baseRate` driftet je Saison um 35 % zum Ziel `0,17 + Ruf × 0,0036 + (Platz-Leistung − 0,5) × 0,12 − Liga-Abschlag` (game/seasonFinance.ts). `attendanceDemand`: 1975 1,0 · 1985 0,85 · 1990 0,9 · 1995 1,3 · 2005 1,6 · 2010 1,8 · 2024 1,75. KI-Vereine erweitern ihre Ränge nur bei Auslastung ≥ 85 %. Hoeherer Preis → weniger Zuschauer, niedriger Preis → mehr (bis Kapazitaet). In der StadionView eine Vorschau anzeigen (erwartete Auslastung bei aktuellem Preis). Nicht die displayte attendance/Buchung entkoppeln — dieselbe Zahl gilt fuer alle Match-Buchungen.

---

## 6. Views andocken (App.tsx) — „alles andocken, sehr tief"

- **SponsoringView** (echte Vertraege): aktueller Trikotsponsor + Bandenpartner mit Name, Jahreswert (aera-gerecht), Restlaufzeit; Liste der Saison-Angebote mit „Unterschreiben"-Button (setzt Vertrag, Buchung ab naechstem Monat). Warnung wenn kein Sponsor.
- **MarketingView**: Mitgliedsbeitraege (Wert + Hinweis Ruf-abhaengig), Catering-Betriebsform waehlen (3 Modi mit Netto/Kopf- und Fixkosten-Vergleich), Programmheft-Erloes je Spieltag. Alles mit erwarteten Monats-/Spieltagswerten.
- **StadionView**: Ticketpreis setzen (falls noch nicht editierbar → Slider/Buttons ±1 DM), Vorschau erwartete Auslastung/Erloes je Heimspiel (Elastizitaet §5). Catering-Kurzstatus.
- **FacilitiesView**: Catering-Gebaeude als ausbaubare Einrichtung ergaenzen; je Einrichtung die **monatlichen Fixkosten** (§3.1) einblenden; Catering-Modus-Umschalter. Catering rendert via `<Icon>` (neues Icon `catering`, s.u.), nicht als Emoji.
- **FansView**: Zusammenhang Zuschauer→Eintritt/Catering/Programm sichtbar machen (Auslastung, Ø Zuschauer, erwartete Spieltagseinnahme). Mitglieder-Zahl-Schaetzung.
- **FinancesView**: neue Einnahmen-Zeilen (Catering, Trikotsponsoring, Bandenwerbung, Mitgliedsbeitraege, Programmhefte/Spieltag) und Ausgaben-Zeile (Gebaeude-Fixkosten) in INCOME_ROWS/EXPENSE_ROWS; Monatsabschluss-Nachricht (App.tsx ~Z.1760) um die neuen Posten erweitern.
- **VertraegeView**: bleibt Spielervertraege; nur sicherstellen, dass nichts bricht.

### Icon
`iconPaths.ts`: neues Icon `catering` hinzufuegen (einfache SVG-Silhouette Imbiss/Becher, im Stil der vorhandenen 1-Farb-Pfade, `stroke=currentColor`). `FacilityDef` bekommt optional `iconName?: IconName`; catering setzt `iconName:'catering'`. In FacilitiesView: `def.iconName ? <Icon name={def.iconName}/> : <span>{def.icon}</span>` (bestehende Emoji-Defs unveraendert, kein neues Emoji).

---

## 7. Wiring (processDay / startNextSeason / doLoad)

- **processDay** (~Z.1300): Monatsabschluss nutzt neues `computeMonthly`/`bookMonthly` (automatisch). Heimspiel-Buchung nutzt erweitertes `bookHomeMatch` (automatisch). Monatsnachricht-Text erweitern.
- **startNextSeason** (~Z.2294): Vertrags-Restlaufzeiten `yearsLeft--`; abgelaufene Vertraege entfernen; neue Saison-Angebote (`shirtOffers`, `bandenOffers`) fuer den Manager erzeugen; KI-Vereine automatisch mit passenden Vertraegen versorgen (damit deren Bilanz stimmt). Mitglieder/Reputation ggf. leicht anpassen (optional).
- **doLoad** (~Z.470/510): Migration — `commerce` default; `infrastructure.catering` default; neue income/expense-Buckets 0; SAVE_VERSION erhoehen (auf 9) und Migrationszweig ergaenzen. Alte Staende MUESSEN laden.

Alle 18 Erstliga-Vereine (und weitere Ligen) werden simuliert; die neuen Posten muessen fuer KI-Vereine mitlaufen (zumindest im Monatsabschluss + Heimspiel), damit ihre Konten realistisch bleiben.

---

## 8. Verifikation
`npx tsc --noEmit 2>&1 | grep -c "error TS"` == **7**; `npm run build` ok; live 200 via `curl -s -o /dev/null -w "%{http_code}" -H 'Host: 11c686bb31.vm.internal' http://localhost/`. Alten Speicherstand laden (Migration) testen. Commit: ASCII, deutsch.

---

## 9. Finanzniveau & Kalibrierung (Sammel-Update v11)

Sollwerte aus der Recherche, Median-Umsatz eines Erstligisten (nominal):

| Saison | Soll | Spiel (Sim `AI=1 BAL=1 FIN=1`, Median, Spanne) |
|---|---:|---:|
| 1975/76 | ≈ 4,5 Mio. DM (1,7–8,3) | ≈ 5,5 Mio. DM inkl. Pokal (2,9–8,8) |
| 1984/85 | ≈ 11 Mio. DM | 11–12 Mio. DM (6–22) |
| 1994/95 | ≈ 34 Mio. DM | 28–37 Mio. DM (20–66) |
| 2004/05 | ≈ 50 Mio. € | ≈ 45 Mio. € (33–79) |
| 2014/15 | ≈ 105 Mio. € | ≈ 90 Mio. € (75–177) |
| 2023/24 | ≈ 200 Mio. € | ≈ 227 Mio. € (171–383) |

KI-Kontostand ÷ Umsatz (1. Liga, Median) 0,33–0,43 je Jahrzehnt (vorher 0,7–0,8); Wechsel zwischen Ligavereinen ≈ 21–23 je Saison, generierte Nachrücker ≈ 6 % (1. Liga).

Startwerte (data/generate.ts): Kontostand `Ruf² × 200 + bis 150.000` (Ruf 86 ≈ 1,6 Mio.), Gehaltsrahmen `Ruf² × 8`/Woche.
Umsatz-Schätzung ohne Bilanz (`lastRevenue`): `(400.000 + Ruf² × 700) × scale × Liga-Faktor`.

KI-Haushalt (engine/clubEconomy.ts): Gehälter + Stab + Prämien = `AI_WAGE_QUOTA (0,71) + min(0,25; 0,5 × Polster/Umsatz) + 0,04 ab 1996 (Bosman) − 0,06 bei Schulden` des Vorjahresumsatzes; Reserve `AI_RESERVE = 0,1`, Ausbau-Anteil `AI_BUILD_SHARE = 0,25`; Ränge nur bei Auslastung ≥ 85 %, bei Schulden Rückbau der teuersten Einrichtung, wenn der Unterhalt > 8 % des Umsatzes kostet. Ziel: KI-Kontostand ÷ Umsatz im Median 0,2–0,4.

Kosten (1975-Basis, alle ≈ × 0,3 gegenüber vorher, wo keine Recherche-Anker existieren): Mitarbeiter K1–K5 400/800/1.700/3.500/8.000 DM/Monat; Marketing-Kanäle 750–6.000 DM je Stufe; Einrichtungen (Basiskosten) Trainingszentrum 100.000, Jugend 80.000, Medizin 60.000, Fanshop 55.000, Catering 60.000, Reha 75.000, NLZ 115.000, Leistungszentrum 100.000, Datenzentrum 90.000; Stadionbau (× 0,5, bereits nahe an echten Baupreisen): Stufe 450.000, je Platz Steh 35 / Bank 65 / Schale 120 / Komfort 210 / Business 550 DM, Dach 22/55, VIP 125.000, Loge 55.000, Logen-Erlös 850 DM je Spiel, Namensrechte `Kapazität × 1,3 × Ruf-Faktor`; Trainingslager 2.700/Tag, Teambuilding 1.800/Tag, Freundschaftsspiel +7.000; Fördervertrag Jugend `1.200 + 1.800 je Stern über 3`.

**Liga-Ebene (`tierScale`, engine/economy.ts):** Skalen über 1975 hinaus wachsen je Ebene nur anteilig, `1 + (Skala − 1) × Anteil`. Vermarktung (Trikot, Banden, Fanartikel, Platzierungsbonus): 1. Liga 1 · 2. Liga 0,35 · 3. Liga 0,15 · darunter 0,08 · Amateure 0,04. Stadiongeschäft (Eintritt, Catering, Programm, Logen, Sponsoren-Siegprämie, Stadion-/Verwaltungskosten, Gebäudeunterhalt, Mitglieder, Pacht): 1 · 0,7 · 0,45 · 0,3 · 0,2. Die Ebene steht in `finances.leagueTier` (gesetzt in `openFinancialSeason`/`createNewGame`/Migration; Amateure über die ID).

**Gehaltsniveau je Ebene (`tierWageLevel`, `clubWageLevel`):** Marktgehälter gelten für die 1. Liga. Niveau = Grundniveau 1975 (1 · 0,45 · 0,2 · 0,1 · 0,05) × `(0,6 × Stadion-Skala der Ebene + 0,4 × Vermarktungs-Skala der Ebene) ÷ economyScale`. Wirkt auf Forderungen (contractTalks, playerStance), Wechsel (`transferPlayer`), Untergrenzen der KI (aiClubs, clubEconomy) – nicht auf die Gehaltsanpassung der KI, die sich am Umsatz orientiert.

