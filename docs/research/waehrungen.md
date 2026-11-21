# Währungen je Land (1975 bis heute)

Daten: `src/data/currencies.ts`, Anzeige-Schicht: `src/engine/economy.ts` (`currencyAt`, `formatMoney`).

## Modell
- Das Spiel rechnet intern in nominalen DM. Angezeigt wird in der Währung des Heimatlands an diesem Tag.
- Je Land eine Folge von Währungsepochen ab Stichtag (ISO-Datum). Eine Umstellung greift taggenau, auch mitten in der Saison.
- Je Epoche Kurs-Stützwerte `[Jahr, DM je Einheit]` als Jahresmittel; zwischen Stützwerten geometrisch interpoliert, nach dem letzten Wert fortgeschrieben.
- Ab 1999 sind DM-Werte aus Euro-Kursen abgeleitet (1 € = 1,95583 DM). Euro-Länder haben ab dem Beitritt den festen Wert.
- Bei Auslandsablösen zeigt die Verhandlung zusätzlich den Betrag in der Währung des Verkäufers.

## Stichtage
| Land | Umstellung |
|---|---|
| Deutschland | D-Mark, ab 1.1.2002 Euro |
| DDR | Mark der DDR, ab 1.7.1990 D-Mark (Währungsunion, Löhne 1 : 1) |
| Euro-Gründer (u. a. ITA, ESP, POR, FRA, NED, BEL, LUX, AUT, FIN, IRL) | Bargeld 1.1.2002 (Buchgeld 1999 wird für die Anzeige nicht unterschieden) |
| Griechenland | Drachme, ab 1.1.2002 Euro |
| Zypern, Malta | 1.1.2008 Euro |
| Slowakei | Slowakische Krone ab 8.2.1993, Euro ab 1.1.2009 |
| Kroatien | Jug. Dinar, Kroatischer Dinar 23.12.1991, Kuna 30.5.1994, Euro 1.1.2023 |
| Bulgarien | Lew, neuer Lew 5.7.1999 (1.000 : 1), Euro 1.1.2026 |
| Island | neue Krone 1.1.1981 (100 : 1) |
| Türkei | neue Lira 1.1.2005 (1.000.000 : 1) |
| Polen | neuer Złoty 1.1.1995 (10.000 : 1) |
| Rumänien | neuer Leu 1.7.2005 (10.000 : 1) |
| Russland | Sowjetrubel bis 1991, russischer Rubel 1992, neuer Rubel 1.1.1998 (1.000 : 1) |
| Ukraine | Karbowanez 12.11.1992, Hrywnja 2.9.1996 (100.000 : 1) |
| Jugoslawien / Serbien | Dinar, neuer Dinar 1.1.1990 (10.000 : 1), Reformen 1.7.1992 und 24.1.1994 |
| Tschechoslowakei | Kčs, ab 8.2.1993 tschechische bzw. slowakische Krone |
| Israel | Neuer Schekel (im Spiel ab 1992) |
| England, Schottland, Wales, Nordirland | Pfund Sterling durchgehend |

## Quellen
- Deutsche Bundesbank, Devisenkursstatistik: Jahresdurchschnitte der amtlichen Mittelkurse Frankfurt 1975–1998.
- EZB-Referenzkurse ab 1999; unwiderrufliche Umrechnungskurse der Euro-Länder (Rat der EU).
- Nationalbanken zu Währungsreformen und Redenominierungen (Stichtage und Umstellungskurse).

## Näherungen
- Kurse sind gerundet und Jahresmittel; Schwankungen innerhalb eines Jahres fehlen.
- RGW-Währungen vor 1990 waren nicht frei konvertierbar: verwendet sind offizielle Handels- bzw. Touristenkurse.
- Hochinflationsphasen (Jugoslawien 1989–1994, Türkei, Ukraine, Russland 1992–1997) nur in groben Jahresstufen; die Hyperinflation 1993 in Serbien ist stark geglättet.
- Spielinterne Beträge bleiben an die deutsche Preisentwicklung gekoppelt; die Umrechnung ändert die Anzeige, nicht die Kaufkraft im Spiel.
