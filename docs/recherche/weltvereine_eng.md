# Weltvereine England (`eng`) – Recherche

Umfang: 1. Liga (t1) und 2. Liga (t2) jeder Saison 1975/76–2025/26, FA-Cup-Sieger/-Finalist, englische
Europapokal-Teilnehmer je Saison. Vereine aus Wales, die in der englischen Liga spielen (Cardiff, Swansea,
Wrexham), stehen hier unter `eng`.

## Quellen
- Tabellen 1. und 2. Liga, FA-Cup-Finale: englische Wikipedia „<Saison> in English football“
  (z. B. https://en.wikipedia.org/wiki/1975%E2%80%9376_in_English_football), wo dort die 2. Liga fehlte:
  „<Saison> Football League“ (1983/84, 1986/87, 1988/89, 1989/90, 1991/92) bzw. Kiwix-Spiegel
  (1992/93: https://iiab.live/kiwix/content/wikipedia_en_all_maxi_2023-05/A/1992-93_Football_League,
  2024/25: wiki.krisyotam.com-Spiegel von „2024–25 in English football“), 1992/93 Eliteliga zusätzlich
  statcity.co.uk (https://www.statcity.co.uk/Seasons/1992/93).
- 2025/26 (abgeschlossen, Stand Nov. 2026): RSSSF https://rsssf.org/tablese/eng2026.html (Eliteliga,
  Championship, FA Cup) und https://en.wikipedia.org/wiki/2025%E2%80%9326_EFL_Championship.
- Europapokal: Teilnehmer nach Qualifikationsregeln je Saison (Meister/Titelverteidiger → EC/CL,
  Pokalsieger → CWC, Liga-/Ligapokal-/Fair-Play-/Intertoto-Plätze → UEFA/EL/ECL) zusammengestellt und mit
  den Saison- und Vereinsartikeln abgeglichen; Qualifikationsrunden zählen, Absteiger aus der CL-Gruppe
  zusätzlich unter uefa/el, aus der EL-Gruppe zusätzlich unter ecl.

## Ligareformen / Besonderheiten
- 1985/86–1989/90: englische Vereine nach Heysel vom Europapokal ausgeschlossen (Liverpool bis 1990/91).
- 1986/87: erste Play-offs; 1987/88 Übergang 1. Liga 21 / 2. Liga 23 Vereine; 1988/89–1990/91 20/24;
  ab 1991/92 wieder 22 in der 1. Liga.
- 1989/90: Play-off-Sieger der 2. Liga (Swindon Town) wegen Finanzvergehen nicht aufgestiegen, blieb in
  der 2. Liga; Sunderland (unterlegener Finalist) stieg auf.
- 1992/93: Gründung der Premier League (t1), die alte First Division wird zweite Liga (t2);
  1995/96 Premier League auf 20 Vereine; 2004/05 zweite Liga heißt „Championship“.
- 2003/04: Wimbledon FC zieht nach Milton Keynes, ab 2004 „Milton Keynes Dons“ – im Spiel zwei getrennte
  Einträge (`eng-london-merton` bis 2003/04, `eng-milton-keynes` ab 2015/16 in t2); Wimbledon spielte
  2000/01–2003/04 in t2, MK Dons nur 2015/16 in t2.
- „Orient“ hieß 1966–1987 so, danach wieder „Leyton Orient“ (nur 1975–1981 in t2).
- 2019/20: Saison nach Pandemie-Unterbrechung zu Ende gespielt (keine Quotientenwertung).
- 2025/26: Saison bereits abgeschlossen → `t1`/`t2` = Abschlusstabelle (nicht Startaufstellung).

## Unsicherheiten
- Europapokal 2000/01: Aston Villa schied im UI-Cup aus und erscheint daher nicht unter uefa (UI-Cup zählt
  nicht als Teilnahme). Bei allen anderen UI-Cup-Siegern (Aston Villa 2001, Fulham 2002, Newcastle 2006,
  Blackburn 2007, Aston Villa 2008) ist die anschließende UEFA-Pokal-Teilnahme eingetragen.
- Reihenfolgen der 2. Liga stammen aus der Wikipedia-Zusammenfassung; Punktgleichheiten ggf. nach
  Torverhältnis/-differenz der jeweiligen Saison.

## Verfremdung
Schema Stadt (+ Farbe/Stadtteil). London: Big Four behalten die bisherigen Spielnamen (London Rot/Nord/
West/Ost), übrige Londoner Vereine nach Himmelsrichtung oder Stadtteil. Bestehende Namen übernommen aus
`src/data/europe.ts` (Liverpool Rot/Blau, Derby, London Ost, Leeds, Ipswich, London Nord, Stoke) und
`src/data/history/finals.ts` (Manchester Rot/Blau, London West, London Rot, Wolverhampton, Newcastle).

| Echter Name | ID | Spielname |
|---|---|---|
| Arsenal | `eng-london-rot` | London Rot |
| Aston Villa | `eng-birmingham-weinrot` | Birmingham Weinrot |
| Barnsley | `eng-barnsley` | Barnsley |
| Birmingham City | `eng-birmingham-blau` | Birmingham Blau |
| Blackburn Rovers | `eng-blackburn` | Blackburn |
| Blackpool | `eng-blackpool` | Blackpool |
| Bolton Wanderers | `eng-bolton` | Bolton |
| Bournemouth | `eng-bournemouth` | Bournemouth |
| Bradford City | `eng-bradford` | Bradford |
| Brentford | `eng-london-brentford` | London Brentford |
| Brighton & Hove Albion | `eng-brighton` | Brighton |
| Bristol City | `eng-bristol-rot` | Bristol Rot |
| Bristol Rovers | `eng-bristol-blau` | Bristol Blau |
| Burnley | `eng-burnley` | Burnley |
| Burton Albion | `eng-burton` | Burton |
| Bury | `eng-bury` | Bury |
| Cambridge United | `eng-cambridge` | Cambridge |
| Cardiff City | `eng-cardiff` | Cardiff |
| Carlisle United | `eng-carlisle` | Carlisle |
| Charlton Athletic | `eng-london-suedost` | London Südost |
| Chelsea | `eng-london-west` | London West |
| Colchester United | `eng-colchester` | Colchester |
| Coventry City | `eng-coventry` | Coventry |
| Crewe Alexandra | `eng-crewe` | Crewe |
| Crystal Palace | `eng-london-sued` | London Süd |
| Derby County | `eng-derby` | Derby |
| Doncaster Rovers | `eng-doncaster` | Doncaster |
| Everton | `eng-liverpool-blau` | Liverpool Blau |
| Fulham | `eng-london-suedwest` | London Südwest |
| Gillingham | `eng-gillingham` | Gillingham |
| Grimsby Town | `eng-grimsby` | Grimsby |
| Hereford United | `eng-hereford` | Hereford |
| Huddersfield Town | `eng-huddersfield` | Huddersfield |
| Hull City | `eng-hull` | Hull |
| Ipswich Town | `eng-ipswich` | Ipswich |
| Leeds United | `eng-leeds` | Leeds |
| Leicester City | `eng-leicester` | Leicester |
| Liverpool | `eng-liverpool-rot` | Liverpool Rot |
| Luton Town | `eng-luton` | Luton |
| Manchester City | `eng-manchester-blau` | Manchester Blau |
| Manchester United | `eng-manchester-rot` | Manchester Rot |
| Mansfield Town | `eng-mansfield` | Mansfield |
| Middlesbrough | `eng-middlesbrough` | Middlesbrough |
| Millwall | `eng-london-bermondsey` | London Bermondsey |
| Milton Keynes Dons | `eng-milton-keynes` | Milton Keynes |
| Newcastle United | `eng-newcastle` | Newcastle |
| Norwich City | `eng-norwich` | Norwich |
| Nottingham Forest | `eng-nottingham-rot` | Nottingham Rot |
| Notts County | `eng-nottingham-schwarz-weiss` | Nottingham Schwarz-Weiß |
| Oldham Athletic | `eng-oldham` | Oldham |
| Orient | `eng-london-leyton` | London Leyton |
| Oxford United | `eng-oxford` | Oxford |
| Peterborough United | `eng-peterborough` | Peterborough |
| Plymouth Argyle | `eng-plymouth` | Plymouth |
| Port Vale | `eng-burslem` | Burslem |
| Portsmouth | `eng-portsmouth` | Portsmouth |
| Preston North End | `eng-preston` | Preston |
| Queens Park Rangers | `eng-london-blau-weiss` | London Blau-Weiß |
| Reading | `eng-reading` | Reading |
| Rotherham United | `eng-rotherham` | Rotherham |
| Scunthorpe United | `eng-scunthorpe` | Scunthorpe |
| Sheffield United | `eng-sheffield-rot-weiss` | Sheffield Rot-Weiß |
| Sheffield Wednesday | `eng-sheffield-blau-weiss` | Sheffield Blau-Weiß |
| Shrewsbury Town | `eng-shrewsbury` | Shrewsbury |
| Southampton | `eng-southampton` | Southampton |
| Southend United | `eng-southend` | Southend |
| Stockport County | `eng-stockport` | Stockport |
| Stoke City | `eng-stoke` | Stoke |
| Sunderland | `eng-sunderland` | Sunderland |
| Swansea City | `eng-swansea` | Swansea |
| Swindon Town | `eng-swindon` | Swindon |
| Tottenham Hotspur | `eng-london-nord` | London Nord |
| Tranmere Rovers | `eng-birkenhead` | Birkenhead |
| Walsall | `eng-walsall` | Walsall |
| Watford | `eng-watford` | Watford |
| West Bromwich Albion | `eng-west-bromwich` | West Bromwich |
| West Ham United | `eng-london-ost` | London Ost |
| Wigan Athletic | `eng-wigan` | Wigan |
| Wimbledon | `eng-london-merton` | London Merton |
| Wolverhampton Wanderers | `eng-wolverhampton` | Wolverhampton |
| Wrexham | `eng-wrexham` | Wrexham |
| Wycombe Wanderers | `eng-wycombe` | Wycombe |
| Yeovil Town | `eng-yeovil` | Yeovil |
| York City | `eng-york` | York |
