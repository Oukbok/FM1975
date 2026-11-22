# Währungen je Land (1975 bis heute)

Daten: `src/data/currencies.ts` (spielbare Länder) + `src/data/currencySuccessors.ts` (Nachfolgestaaten nach Stadt des Vereins), Bausteine `src/data/currencyParts.ts`. Anzeige-Schicht: `src/engine/economy.ts` (`currencyAt`, `formatMoney`, `setHomeCurrency(cc, stadt)`), feste Texte `src/engine/moneyText.ts`. Test `npm run test:currency` (ohne UI), Rundgang im Browser `npm run build && npm run test:currency-ui`.

## Modell
- Das Spiel rechnet intern in nominalen DM. Angezeigt wird in der Währung des Heimatlands an diesem Tag.
- Je Land eine Folge von Währungsepochen ab Stichtag (ISO-Datum). Eine Umstellung greift taggenau, auch mitten in der Saison.
- Je Epoche Kurs-Stützwerte `[Jahr, DM je Einheit]` als Jahresmittel; zwischen Stützwerten geometrisch interpoliert, nach dem letzten Wert fortgeschrieben.
- Ab 1999 sind DM-Werte aus Euro-Kursen abgeleitet (1 € = 1,95583 DM). Euro-Länder haben ab dem Beitritt den festen Wert.
- Bei Auslandsablösen zeigt die Verhandlung zusätzlich den Betrag in der Währung des Verkäufers.
- **Euro einheitlich ab Bargeld:** Gründerländer und Griechenland wechseln am 1.1.2002. 1999–2001 war der Euro Buchgeld; Preise, Gehälter und Ablösen wurden weiter in Landeswährung genannt, das Spiel zeigt sie deshalb so (zum unwiderruflichen Umrechnungskurs). Spätere Beitritte am Beitrittstag.
- **Aufgelöste Staaten:** Das Heimatland eines Spielstands bleibt `tch`/`urs`/`yug`. Die Währung folgt nach der Auflösung dem Staat, in dem der eigene Verein liegt (`homeCurrencyKey(cc, stadt)` → Schlüssel wie `tch:svk`, `urs:ukr`, `yug:cro`); unbekannte Stadt = größter Nachfolger (Tschechien, Russland, BR Jugoslawien/Serbien). Gesetzt in `applyHomeModules` (game/ddrHome.ts) beim Spielstart und beim Laden.
- **Feste Texte:** Finanzberater (`data/budgetEras.ts`), Briefing (Fußball-Themen, Unterschiede zu heute, Epochen-Tipps), Chronik-Nachrichten, i-Hilfen, Trainingslager-Hinweise und Wiki nennen Beträge in D-Mark/Euro. Für ein anderes Heimatland rechnet `localMoneyText` jeden Betrag in die Währung um, die dort im genannten Jahr galt (letzte Jahreszahl davor in der Zeile, sonst Jahr des Textes; im Wiki für D-Mark 1975). `localCurrencyText` lässt zusätzlich Sätze weg, die von der deutschen Währung selbst handeln. Deutschland bleibt unverändert. Ausnahmen: Formeln im Wiki (Rechenwerte in D-Mark von 1975) und die Zeitgeschichte im Briefing (Politik/Alltag/Kultur: deutsche Nachrichten mit deutschen Beträgen). Ein Wortverbinder U+2060 zwischen Zahl und Einheit nimmt einen Betrag von der Umrechnung aus.

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
| Malta | Malta-Pfund, ab 13.9.1983 Maltesische Lira (nur der Name), Euro 1.1.2008 |
| Türkei (Zusatz) | 1.1.2009 heißt die Neue Türkische Lira wieder Türkische Lira |
| Ukraine (Zusatz) | 1992 bis 11.11. gilt der Rubel weiter |

## Nachfolgestaaten nach Stadt des Vereins
| Start in | Stadt (Beispiele) | Währungen nach der Auflösung |
|---|---|---|
| Tschechoslowakei | Prag, Brünn, Ostrava … | Tschechische Krone 8.2.1993 |
| | Bratislava, Košice, Trnava … | Slowakische Krone 8.2.1993, Euro 1.1.2009 |
| Sowjetunion | Moskau, Leningrad … | Rubel 1992, neuer Rubel 1.1.1998 |
| | Kiew, Donezk, Odessa … | Rubel, Karbowanez 12.11.1992, Hrywnja 2.9.1996 |
| | Wilna | Talonas 1.10.1992, Litas 25.6.1993, Euro 1.1.2015 |
| | Riga | Lettischer Rubel 7.5.1992, Lats 5.3.1993, Euro 1.1.2014 |
| | Tallinn | Estnische Krone 20.6.1992 (8 = 1 DM), Euro 1.1.2011 |
| | Minsk | Belarussischer Rubel 25.5.1992, 1.1.2000 (1.000 : 1), 1.7.2016 (10.000 : 1) |
| | Tiflis, Kutaissi | Kupon 5.4.1993, Lari 2.10.1995 |
| | Jerewan | Dram 22.11.1993 |
| | Baku | Manat 15.8.1992, neuer Manat 1.1.2006 (5.000 : 1) |
| | Alma-Ata | Tenge 15.11.1993 |
| | Taschkent | Sum-Kupon 15.11.1993, Sum 1.7.1994 |
| | Duschanbe | Tadschikischer Rubel 10.5.1995, Somoni 30.10.2000 |
| Jugoslawien | Belgrad, Novi Sad, Niš … | Dinar-Reformen 1.7.1992 und 24.1.1994 |
| | Zagreb, Split, Rijeka … | Kroatischer Dinar 23.12.1991, Kuna 30.5.1994, Euro 1.1.2023 |
| | Ljubljana | Tolar 8.10.1991, Euro 1.1.2007 |
| | Sarajevo, Mostar, Tuzla … | BiH-Dinar 1.7.1992, neuer Dinar 15.8.1994, Konvertible Mark 22.6.1998 |
| | Skopje, Bitola | Denar 26.4.1992, neuer Denar 10.5.1993 |
| | Titograd/Podgorica | Dinar, D-Mark 2.11.1999, Euro 1.1.2002 |
| | Priština | Dinar, D-Mark 3.9.1999, Euro 1.1.2002 |
| England, Schottland, Wales, Nordirland | Pfund Sterling durchgehend |

## Quellen
- Deutsche Bundesbank, Devisenkursstatistik: Jahresdurchschnitte der amtlichen Mittelkurse Frankfurt 1975–1998.
- EZB-Referenzkurse ab 1999; unwiderrufliche Umrechnungskurse der Euro-Länder (Rat der EU).
- Nationalbanken zu Währungsreformen und Redenominierungen (Stichtage und Umstellungskurse).
- IWF, International Financial Statistics (Jahresmittel je US-Dollar) für die Nachfolgestaaten der Sowjetunion und Jugoslawiens.

## Näherungen
- Kurse sind gerundet und Jahresmittel; Schwankungen innerhalb eines Jahres fehlen.
- RGW-Währungen vor 1990 waren nicht frei konvertierbar: verwendet sind offizielle Handels- bzw. Touristenkurse.
- Hochinflationsphasen (Jugoslawien 1989–1994, Türkei, Ukraine, Russland 1992–1997) nur in groben Jahresstufen; die Hyperinflation 1993 in Serbien ist stark geglättet.
- Kurse nach dem letzten Stützjahr (2025) werden fortgeschrieben; bei Währungen mit hoher Inflation (Türkei) altert das schnell.
- Nachfolgestaaten: Kurse aus IWF-Jahresmitteln je US-Dollar über den DM- bzw. Euro-Dollarkurs, grob gerundet; Übergangswährungen 1992–1995 (Kupon, Talonas, BiH-Dinar) nur als Größenordnung.
- Spielinterne Beträge bleiben an die deutsche Preisentwicklung gekoppelt; die Umrechnung ändert die Anzeige, nicht die Kaufkraft im Spiel.
