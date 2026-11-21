# Weltvereine alb – Albanien (Kategoria e Parë / Superiore)

Echte Vereinsnamen stehen **nur hier**. Datenformat: `docs/specs/WELTDATEN_SPEC.md`.
Erfasst: `t1` je Saison, Landespokal (soweit bekannt), Europapokal-Teilnehmer. Keine 2. Liga.

## Quellen

- **1997/98–2024/25:** berechnet aus allen Ligaspielen in `schochastics/football-data` (`games.parquet`, „albania“), 3 Punkte.
  1999/2000 punktgleich, Meister Tirana gesetzt; 2023/24 und 2024/25 Meister über eine Endrunde der ersten Vier (Egnatia beide Male, passt).
  **Aus Datensatz berechnet**; Meister geprüft.
- **1975/76–1996/97:** **aus Wissen, ungeprüft.** Meister gegen die Landesmeister-Teilnahmen der Folgesaison geprüft, soweit Albanien antrat
  (1975–77, 1983, 1992 keine Teilnahme); übrige Plätze = Vereine der Epoche (14 bzw. ab 1990/91 16 Vereine angenommen).
- **2025/26:** Zusammensetzung zu Saisonbeginn; Aufsteiger Vlora und Vora **aus Wissen, ungeprüft** (Datensatz enthält einen namenlosen Aufsteiger).
- **Europapokal:** `schochastics/football-data` (`games.parquet`, alle Spiele Landesmeister/CL, UEFA-Pokal/EL, Conference League
  inkl. Qualifikation, bis Sept. 2025; Saisonwechsel 15. Juni). **Aus Datensatz.**
  Europapokal der Pokalsieger **nicht erfasst**; **Pokal nicht erfasst** (Sieger nicht verlässlich bekannt).

## Zuordnung

- KF Tirana (bis 1991 „17 Nëntori“) = „Tirana Weiß-Blau“, Dinamo Tirana/Dinamo City = „Tirana Blau“, Partizani = „Tirana Rot“.
- Labinoti/KS Elbasani/AF Elbasani = „Elbasan“; Lokomotiva/Teuta Durrës = „Durrës“; Përparimi/FK Kukësi = „Kukës“.
- Sonst Vereine nach ihrer Stadt (albanische Ortsnamen in bestimmter Form: Shkodra, Vlora, Korça …).

## Echter Name → Spielname / ID

| Echter Verein | Spielname | ID | Kürzel | Ort |
|---|---|---|---|---|
| Albpetrol Patos | Patos | `alb-patos` | PAT | Patos |
| Apolonia Fier | Fier | `alb-fier` | FIE | Fier |
| Besa Kavajë | Kavaja | `alb-kavaja` | KAV | Kavaja |
| Besëlidhja Lezhë | Lezha | `alb-lezha` | LEZ | Lezha |
| Bylis Ballsh | Ballsh | `alb-ballsh` | BAL | Ballsh |
| Dajti Kamëz | Kamza | `alb-kamza` | KAM | Kamza |
| Dinamo Tirana / Dinamo City | Tirana Blau | `alb-tirana-blau` | TBL | Tirana |
| Egnatia Rrogozhinë | Rrogozhina | `alb-rrogozhina` | RRO | Rrogozhina |
| Erzeni Shijak | Shijak | `alb-shijak` | SHI | Shijak |
| FK Kukësi (Përparimi Kukës) | Kukës | `alb-kukes` | KUK | Kukës |
| Flamurtari Vlorë | Vlora | `alb-vlora` | VLO | Vlora |
| Gramozi Ersekë | Erseka | `alb-erseka` | ERS | Erseka |
| Kastrioti Krujë | Kruja | `alb-kruja` | KRU | Kruja |
| KF Laçi | Laç | `alb-lac` | LAC | Laç |
| KF Tirana (1949–1991 17 Nëntori) | Tirana Weiß-Blau | `alb-tirana-weiss-blau` | TWB | Tirana |
| KF Vora | Vora | `alb-vora` | VOR | Vora |
| Korabi Peshkopi | Peshkopia | `alb-peshkopia` | PES | Peshkopia |
| KS Burreli | Burrel | `alb-burrel` | BUR | Burrel |
| KS Lushnja (Traktori Lushnjë) | Lushnja | `alb-lushnja` | LUS | Lushnja |
| KS Pogradeci | Pogradec | `alb-pogradec` | POG | Pogradec |
| Labinoti / KS Elbasani / AF Elbasani | Elbasan | `alb-elbasan` | ELB | Elbasan |
| Luftëtari Gjirokastër | Gjirokastra | `alb-gjirokastra` | GJI | Gjirokastra |
| Naftëtari Qyteti Stalin / Kuçova | Kuçova | `alb-kucova` | KUC | Kuçova |
| Partizani Tirana | Tirana Rot | `alb-tirana-rot` | TRO | Tirana |
| Shkumbini Peqin | Peqin | `alb-peqin` | PEQ | Peqin |
| Shqiponja Gjirokastër | Gjirokastra Gelb | `alb-gjirokastra-gelb` | GJG | Gjirokastra |
| Skënderbeu Korçë | Korça | `alb-korca` | KOR | Korça |
| Sopoti Librazhd | Librazhd | `alb-librazhd` | LIB | Librazhd |
| Teuta Durrës (zeitweise Lokomotiva Durrës) | Durrës | `alb-durres` | DUR | Durrës |
| Tomori Berat | Berat | `alb-berat` | BER | Berat |
| Tërbuni Pukë | Puka | `alb-puka` | PUK | Puka |
| Vllaznia Shkodër | Shkodra | `alb-shkodra` | SHK | Shkodra |
