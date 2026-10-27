# FINANZEN_SPEC — Tiefes Finanzsystem für „1975 – A Football Manager"

Ziel (Pascals Vorgaben): **1.** Spieltag-Einnahmen + monatliche Fixkosten; **existierende Gebaeude bekommen ebenfalls Fixkosten.** **2.** Mikromanagement **sehr tief.** **3.** Wuerstchenbuden/Catering **jetzt** als ausbaubares Gebaeude (3 Betriebsformen). **4.** **Alles andocken** (Finanzen, Sponsoring, Marketing, Stadion, Gelaende, Fans, Stab, Vertraege) und **komplex** gestalten.

Grundregeln des Projekts bleiben: alle Betraege NOMINAL in DM, Anzeige aera-gerecht via `formatMoney/formatMoneyShort` (DM bis 2001, EUR ab 2002). Jede neue Erloes-/Kostengroesse wird mit `economyScale(year)` multipliziert (1975 = 1.0). Keine neuen Emojis in der UI — neue Icons via `<Icon>` aus `iconPaths.ts`. Alte Speicherstaende muessen defensiv weiterladen (neue Felder optional + Migration in `doLoad`). TS-Fehleranzahl bleibt **exakt 7** (App.tsx 5 + LineupView.tsx 2 — nicht anfassen). Footer/Box-Hoehen unveraendert.

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
`jahr = round((30.000 + reputation * 1.000) * scale)`; `monat = round(jahr/12)`. Frankfurt: 30.000+80.000 = **110.000/Jahr → 9.167/Monat**.

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

### 2.6 Eintritt & Fanartikel (unveraendert)
`ticket = attendance * ticketPrice * scale`; `merch = attendance * merchPerHead(club) * scale` (bestehende Logik). TV-Geld bleibt bestehend.

---

## 3. Neue/angepasste Ausgaben

### 3.1 Gebaeude-Fixkosten (monatlich, NEUER bucket `facilities`, Kategorie `facilities`) — Pascals Punkt 1
Jede gebaute Einrichtung verursacht monatliche Unterhaltskosten, die mit der Stufe steigen.
`upkeep(key, level) = round(FAC_UPKEEP_BASE[key] * LEVEL_MULT[level] * scale)`
`LEVEL_MULT = [0, 1, 1.4, 1.9, 2.5, 3.2]` (Index = Stufe 1..5).
`FAC_UPKEEP_BASE` (DM/Monat, Stufe-1-Basis, 1975):
- trainingCenter 4.000 · youthAcademy 3.000 · medical 2.500 · merchandising 2.000
- rehaCenter 3.000 · nlz 4.000 · performanceCenter 4.500 · dataCenter 3.500
- **stadium: NICHT hier** (bleibt in `stadiumMaintenance`, sonst Doppelzaehlung).
- **catering:** Sonderfall, Fixkosten je Modus (Personal/Ware vs. Pacht):
  `CATERING_UPKEEP[mode][level]`:
  - eigenbetrieb: `[0, 3.000, 4.500, 6.500, 9.000, 12.000]`
  - umsatz:       `[0, 1.500, 2.200, 3.000, 4.200, 5.500]`
  - verpachtung:  `[0, 800, 1.100, 1.500, 2.000, 2.600]`
**Wichtig zur Nicht-Zerstoerung der Balance:** Der bisherige Posten `trainingFacilities` (= `(8.000 + facilitiesQuality*220)*scale`) wird durch die neue Summe `facilities` ERSETZT (nicht zusaetzlich). D.h. `computeMonthly` gibt weiterhin `trainingFacilities` zurueck, aber jetzt als **0** ODER wir entfernen ihn aus der Netto-Rechnung und fuehren `facilities` als eigenen Posten. Konkret: `MonthlyBooking` bekommt Feld `facilities: number`; `trainingFacilities` entfaellt aus der Netto-Summe (auf 0 setzen und im UI durch `facilities` ersetzen). Zukunfts-Einrichtungen zaehlen nur ab Stufe ≥ 2 (Stufe 1 = Grundausbau, noch nicht gebaut).

### 3.2 Uebrige Monatsposten (unveraendert bzw. leicht)
`wages` (Spieler), `staffWages` (Betreuerstab/Stab), `stadiumMaintenance` (Stadionunterhalt), `otherFixed`→bucket `other` (Verwaltung/Reisen/Sonstiges: `(6.000 + rep*500)*scale`) bleiben. `placementBonus` (Sponsor-Erfolgsbonus) bleibt.

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
refPrice = round(8 + reputation * 0.12)            // „fairer" Preis
priceFactor = clamp(1 - (ticketPrice - refPrice)/refPrice * 0.5, 0.60, 1.15)
rate = clamp(baseRate * priceFactor + (rng()-0.5)*0.10, 0.30, 1.0)
attendance = round(capacity * rate)
```
`baseRate = stadium.averageAttendanceRate`. Hoeherer Preis → weniger Zuschauer, niedriger Preis → mehr (bis Kapazitaet). In der StadionView eine Vorschau anzeigen (erwartete Auslastung bei aktuellem Preis). Nicht die displayte attendance/Buchung entkoppeln — dieselbe Zahl gilt fuer alle Match-Buchungen.

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
