# Ausnahmetalente der Fußballgeschichte („Legenden 2.0“) – Recherche

Stilles Feature (Wunsch Pascal): Die 100 besten und berühmtesten Spieler, die zwischen 1975 und 2026 auf dem
Platz standen, laufen in jedem Spielstand unbemerkt mit (Option beim Spielstart, Standard „an“). Im Spiel und in
allen UI-sichtbaren Daten stehen **nur verfremdete Namen**; diese Datei ist die einzige Stelle mit den Vorbildern.
Daten: `src/data/legends/` (Format `types.ts`), Ablauf `src/game/legendsGame.ts`, Erzeugung `src/game/legendFactory.ts`.

## Auswahlkriterien
1. **Aktiv 1975–2026**: mindestens eine Saison als Profi in diesem Zeitraum (Zoff, Maier, Beckenbauer, Cruyff,
   G. Müller spielten bis 1979–1984; Yamal, Musiala, Wirtz, Bellingham sind die jüngsten).
2. **Rang**: Ballon d'Or (Sieger/Podium), FIFA-Weltfußballer, WM-/EM-Titel als prägender Spieler,
   Europapokal-Sieger mit tragender Rolle, Torschützenkönig großer Turniere, IFFHS-/„FIFA 100“-Listen,
   Ballon-d'Or-Dream-Team 2020.
3. **Schwerpunkt Deutschland/Europa** (30 Deutsche inkl. 2 aus der DDR), dazu die Weltstars Südamerikas
   (Brasilien 8, Argentinien 3, Uruguay 1) und Afrikas (Liberia, Kamerun, Elfenbeinküste, Ägypten).
4. **Gestaffelte Potenziale**: 99 nur für Maradona/Messi, 97–98 für die prägenden Weltstars
   (Beckenbauer, Cruyff, Platini, van Basten, Zidane, Ronaldo, C. Ronaldo, G. Müller), 88–96 für den Rest.
5. **Verdeckte Werte nach der echten Karriere**: Konstanz (Leistungsschwankung), Nervenstärke (Endspiele,
   Elfmeter), Verletzungsanfälligkeit (van Basten, Ronaldo Nazário, Robben, Sammer hoch; C. Ronaldo,
   Lewandowski sehr niedrig), Entwicklungstempo (frühe Durchbrüche: Yamal, Mbappé, Rooney, Ronaldo),
   Professionalität (C. Ronaldo, Lewandowski, Lahm, Kimmich hoch; Sócrates, Romário, Ronaldinho niedrig),
   Frühreife/Langlebigkeit (Spätentwickler Klose, Drogba, van Dijk; lange Karrieren Maldini, Zoff, Modrić,
   Ibrahimović; früher Abbau van Basten, Sammer).

Quellen: Ballon-d'Or-Ergebnislisten 1975–2025 (France Football), FIFA-Weltfußballer 1991–2025,
Kader der WM/EM-Sieger 1974–2024, Torjägerlisten Bundesliga/WM, Spielerbiografien (Wikipedia, kicker-Archiv,
Transfermarkt für Verletzungshistorie und Einsatzjahre). Geburtsdaten nach Wikipedia.

## Verfremdung der Namen
- Nachname mindestens 3 Änderungen (Levenshtein, ohne Akzente) vom echten Nachnamen entfernt und enthält ihn nicht.
- Vorname weicht ab (mindestens 2 Änderungen); kein echtes Namenspaar.
- Geprüft in `tests/legends-test.ts` gegen die Tabelle unten (Spalte „Vorbild“).

## Liste (ID | Vorbild | Name im Spiel | Geburt | Land | Position | Potenzial)
| ID | Vorbild | Name im Spiel | Geburt | Land | Pos | Pot |
|---|---|---|---|---|---|---|
| brueckenhauer | Franz Beckenbauer | Ferdl Brückenhauer | 1945-09-11 | GER | LIB | 98 |
| muellner | Gerd Müller | Gerold Möllinger | 1945-11-03 | GER | MS | 97 |
| meierling | Sepp Maier | Hias Meierling | 1944-02-28 | GER | TW | 91 |
| breitwieser | Paul Breitner | Bertl Breitwieser | 1951-09-05 | GER | ZM | 92 |
| rummenhoff | Karl-Heinz Rummenigge | Kalle Rummenhoff | 1955-09-25 | GER | RA | 95 |
| schusterle | Bernd Schuster | Benno Schustrow | 1959-12-22 | GER | OM | 92 |
| schuhmeister | Toni Schumacher | Hartl Schuhmeister | 1954-03-06 | GER | TW | 90 |
| littbaske | Pierre Littbarski | Piet Littbaskow | 1960-04-16 | GER | RA | 88 |
| matthesius | Lothar Matthäus | Lutz Matthesius | 1961-03-21 | GER | ZM | 95 |
| vellmer | Rudi Völler | Rolf Völlrath | 1960-04-13 | GER | MS | 89 |
| brehmker | Andreas Brehme | Anselm Brehmhorst | 1960-11-09 | GER | LV | 89 |
| klinsberger | Jürgen Klinsmann | Jörg Klinsberger | 1964-07-30 | GER | MS | 90 |
| kohlhaas | Jürgen Kohler | Jochen Kohlhaas | 1965-10-06 | GER | IV | 89 |
| haeslinger | Thomas Häßler | Timo Häslinger | 1966-05-30 | GER | OM | 88 |
| sammler | Matthias Sammer | Mattes Sambrecht | 1967-09-05 | DDR | LIB | 91 |
| moerlein | Andreas Möller | Achim Mörlein | 1967-09-02 | GER | OM | 88 |
| kirschtner | Ulf Kirsten | Udo Kirschtner | 1965-12-04 | DDR | MS | 87 |
| kahnert | Oliver Kahn | Ole Kahrmann | 1969-06-15 | GER | TW | 92 |
| ballacher | Michael Ballack | Marek Ballacher | 1976-09-26 | DDR | ZM | 91 |
| klosinski | Miroslav Klose | Mirko Klosinski | 1978-06-09 | GER | MS | 89 |
| lahmberg | Philipp Lahm | Pit Lammert | 1983-11-11 | GER | RV | 92 |
| schweinsberger | Bastian Schweinsteiger | Benni Schwanstetter | 1984-08-01 | GER | ZM | 91 |
| neuerer | Manuel Neuer | Emil Neuhauer | 1986-03-27 | GER | TW | 94 |
| muellerheim | Thomas Müller | Tobi Möllerath | 1989-09-13 | GER | HS | 91 |
| kroske | Toni Kroos | Tilo Krosnik | 1990-01-04 | GER | ZM | 93 |
| oezilhan | Mesut Özil | Mert Özkilan | 1988-10-15 | GER | OM | 90 |
| huemmler | Mats Hummels | Max Hümmler | 1988-12-16 | GER | IV | 90 |
| kimmerich | Joshua Kimmich | Jonas Kimmerling | 1995-02-08 | GER | DM | 91 |
| musalla | Jamal Musiala | Jamiro Mosallek | 2003-02-26 | GER | OM | 93 |
| wuertzner | Florian Wirtz | Falk Würtzner | 2003-05-03 | GER | OM | 93 |
| kruijfken | Johan Cruyff | Joop Kruijfken | 1947-04-25 | NED | HS | 98 |
| krolsma | Ruud Krol | Rinus Kroolman | 1949-03-24 | NED | LIB | 89 |
| gullitsen | Ruud Gullit | Ruben Gulliksen | 1962-09-01 | NED | OM | 94 |
| bastelen | Marco van Basten | Mauro van Bastijnsen | 1964-10-31 | NED | MS | 97 |
| rijkhaart | Frank Rijkaard | Floris Rijkhaven | 1962-09-30 | NED | DM | 92 |
| bergkamper | Dennis Bergkamp | Daan Bergkemper | 1969-05-10 | NED | HS | 92 |
| robbema | Arjen Robben | Arno Robbertsma | 1984-01-23 | NED | RA | 92 |
| dijkhuis | Virgil van Dijk | Vincent van Deikhuizen | 1991-07-08 | NED | IV | 92 |
| platanis | Michel Platini | Marcel Platanier | 1955-06-21 | FRA | OM | 97 |
| papinaud | Jean-Pierre Papin | Jean-Luc Pappineau | 1963-11-05 | FRA | MS | 90 |
| cantonelli | Éric Cantona | Émile Cantonelli | 1966-05-24 | FRA | HS | 90 |
| zidaneau | Zinédine Zidane | Zinou Zadirane | 1972-06-23 | FRA | OM | 97 |
| henrion | Thierry Henry | Thibault Henrion | 1977-08-17 | FRA | MS | 94 |
| riberac | Franck Ribéry | Frédo Ribérault | 1983-04-07 | FRA | LA | 91 |
| benzemal | Karim Benzema | Kamel Benzemoun | 1987-12-19 | FRA | MS | 93 |
| mbappou | Kylian Mbappé | Kelyan Mbabanté | 1998-12-20 | FRA | MS | 96 |
| zoffoli | Dino Zoff | Elio Zaffetti | 1942-02-28 | ITA | TW | 91 |
| rossari | Paolo Rossi | Pino Rossetto | 1956-09-23 | ITA | MS | 90 |
| baresini | Franco Baresi | Fulvio Baressano | 1960-05-08 | ITA | LIB | 94 |
| maldinetti | Paolo Maldini | Pietro Maldinetti | 1968-06-26 | ITA | LV | 95 |
| baggiani | Roberto Baggio | Rodolfo Baggiani | 1967-02-18 | ITA | HS | 94 |
| pierro | Alessandro Del Piero | Alessio Dal Pierotti | 1974-11-09 | ITA | HS | 91 |
| cannavelli | Fabio Cannavaro | Flavio Cannavelli | 1973-09-13 | ITA | IV | 90 |
| pirlotti | Andrea Pirlo | Amedeo Pirlanti | 1979-05-19 | ITA | DM | 92 |
| buffari | Gianluigi Buffon | Gianpaolo Buffardi | 1978-01-28 | ITA | TW | 93 |
| gonzalvo | Raúl González | Rubén Garzalvo | 1977-06-27 | ESP | MS | 92 |
| hernando | Xavi Hernández | Ivo Hermandaro | 1980-01-25 | ESP | ZM | 94 |
| iniestra | Andrés Iniesta | Adrián Iniestrada | 1984-05-11 | ESP | ZM | 94 |
| casillero | Iker Casillas | Ibai Casillero | 1981-05-20 | ESP | TW | 92 |
| ramoso | Sergio Ramos | Sebas Rambosio | 1986-03-30 | ESP | IV | 92 |
| cascanto | Rodrigo Cascante | Rodolfo Escalante | 1996-06-22 | ESP | DM | 92 |
| yamali | Lamine Yamal | Lamar Yamarou | 2007-07-13 | ESP | RA | 96 |
| keeghan | Kevin Keegan | Kieran Keighley | 1951-02-14 | ENG | HS | 91 |
| dalgleash | Kenny Dalglish | Kendall Dalgreave | 1951-03-04 | SCO | HS | 91 |
| linacre | Gary Lineker | Garth Linacre | 1960-11-30 | ENG | MS | 89 |
| shearwood | Alan Shearer | Alec Shearwood | 1970-08-13 | ENG | MS | 90 |
| beckford | David Beckham | Darren Beckwell | 1975-05-02 | ENG | RM | 89 |
| gerrardson | Steven Gerrard | Stewart Garradine | 1980-05-30 | ENG | ZM | 91 |
| rooneham | Wayne Rooney | Warren Rooneham | 1985-10-24 | ENG | HS | 91 |
| kaneford | Harry Kane | Harvey Kaynesford | 1993-07-28 | ENG | MS | 93 |
| bellingworth | Jude Bellingham | Jed Bellingworth | 2003-06-29 | ENG | OM | 93 |
| figueiro | Luís Figo | Lucas Figueiró | 1972-11-04 | POR | RA | 93 |
| ronalvo | Cristiano Ronaldo | Cristóvão Ronalves | 1985-02-05 | POR | LA | 98 |
| zicao | Arthur Zico | Arturzinho Zicardo | 1953-03-03 | BRA | OM | 94 |
| sofocles | Sócrates Brasileiro | Doutor Sófocles | 1954-02-19 | BRA | OM | 91 |
| romarinho | Romário Faria | Romarinho Sousela | 1966-01-29 | BRA | MS | 94 |
| ronaldao | Ronaldo Nazário | Reinaldão Nazarbes | 1976-09-18 | BRA | MS | 98 |
| rivalto | Rivaldo Ferreira | Rivaldinho Pereirinha | 1972-04-19 | BRA | OM | 93 |
| ronaldelo | Ronaldinho Gaúcho | Rodolfinho Gaudério | 1980-03-21 | BRA | OM | 96 |
| kaquinho | Ricardo Kaká | Ricardinho Kaquinho | 1982-04-22 | BRA | OM | 93 |
| neimarcos | Neymar Santos | Neimarcos Santinho | 1992-02-05 | BRA | LA | 94 |
| kempelli | Mario Kempes | Marcelo Kempelli | 1954-07-15 | ARG | MS | 90 |
| maradano | Diego Maradona | Dario Maradorro | 1960-10-30 | ARG | OM | 99 |
| messini | Lionel Messi | Leandro Mesquino | 1987-06-24 | ARG | RA | 99 |
| weahson | George Weah | Gordon Wehabo | 1966-10-01 | LBR | MS | 92 |
| schewtschenkow | Andrij Schewtschenko | Oleh Schewtschuk | 1976-09-29 | UKR | MS | 93 |
| laudrupsen | Michael Laudrup | Mogens Laudsgaard | 1964-06-15 | DEN | OM | 92 |
| simonsgaard | Allan Simonsen | Arne Simonsgaard | 1952-12-15 | DEN | HS | 89 |
| bonialek | Zbigniew Boniek | Zdzisław Bonieczko | 1956-03-03 | POL | OM | 89 |
| lewadowiak | Robert Lewandowski | Radosław Lewadowiak | 1988-08-21 | POL | MS | 94 |
| stoitschew | Hristo Stoitschkow | Kiril Stoikanow | 1966-02-08 | BUL | LA | 91 |
| modrinic | Luka Modrić | Lovro Modrovac | 1985-09-09 | CRO | ZM | 93 |
| ibrahimagic | Zlatan Ibrahimović | Zoran Ibrahimbegić | 1981-10-03 | SWE | MS | 91 |
| nedvidek | Pavel Nedvěd | Petr Nedvídek | 1972-08-30 | CZE | LM | 91 |
| haalvik | Erling Haaland | Eirik Haalvik | 2000-07-21 | NOR | MS | 95 |
| salahi | Mohamed Salah | Mahmoud Selhawi | 1992-06-15 | EGY | RA | 92 |
| bruynck | Kevin De Bruyne | Kasper De Bruyckere | 1991-06-28 | BEL | OM | 93 |
| etoumbe | Samuel Eto'o | Salomon Etoumbé | 1981-03-10 | CMR | MS | 91 |
| drogbeni | Didier Drogba | Désiré Drogbeni | 1978-03-11 | CIV | MS | 90 |
| suarte | Luis Suárez | Lucio Soarelli | 1987-01-24 | URU | MS | 93 |
