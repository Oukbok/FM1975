// =============================================================================
// Namenspools, fünfte Stufe – Teil Süd 2 (Wunsch Pascal: „immer noch zu viele
// doppelte Namen – vervierfache die Anzahl der verfügbaren Namen“). Aufbau wie
// data/namePoolsXL.ts; über XL4_SOUTH (data/namePoolsXL4South.ts) per Spread
// eingemischt, in data/origins.ts über `mergeXL`.
// Ost- und Südosteuropa + Familien dieser Herkunft in Deutschland:
// Polen (Großpolen, Masowien, Schlesien, Kaschubei, Podhale, Lublin/Podlasie),
// Tschechoslowakei (Böhmen, Mähren, Slowakei), Ungarn, UdSSR (Russland, Ukraine,
// Belarus, Baltikum, Kaukasus, Zentralasien, Tataren – Umschrift wie bisher
// deutsch), Jugoslawien (alle Teilrepubliken inkl. Slowenien, Bosnien,
// Montenegro, Makedonien, Kosovo), Kroatien, Serbien.
// Nachnamen nach den Rangfolgen der häufigsten Familiennamen (PESEL/GUS, ČSÚ,
// KSH, Volkszählungen der Nachfolgestaaten), Vornamen nach Geburtsjahrzehnt
// (GUS/PESEL-Ranglisten, ČSÚ, KSH, Rosstat-Auswertungen, DZS/RZS-Statistiken).
// Keine Nachnamen, die fast nur durch einen Fußballer bekannt sind; keine
// Namen mit belasteter Bedeutung.
// =============================================================================
import { w, type XLNames } from './namePoolsXL';

/** Listen zusammenführen, ohne Dubletten. */
const u = (...l: string[][]): string[] => [...new Set(l.flat())];
/** Polnische Sonderzeichen weglassen (Schreibweise vieler Familien in Deutschland). */
const plain = (n: string): string => n.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '');

// --- Polen -----------------------------------------------------------------------
const PL_ALL = w(`Wójtowicz, Kowalik, Kozieł, Kurek, Sowa, Wrona, Kruk, Bielecki, Bielawski, Gajewski, Kubacki, Przybylski, Wilk, Wilczek,
  Szulc, Szymczak, Baranowski, Laskowski, Brzeziński, Kaczmarczyk, Wasilewski, Sobczyk, Czerwiński, Andrzejewski, Cieślak, Zakrzewski,
  Kołodziejczyk, Sikorski, Szczepaniak, Wróblewski, Domański, Kozak, Urbański, Kasprzak, Markowski, Sawicki, Borowski, Czajkowski,
  Chojnacki, Leśniak, Mikołajczyk, Wilczyński, Kaczor, Konieczny, Ryba, Wawrzyniak, Lipiński, Pietrzyk, Stachowiak, Wojtczak, Kopeć,
  Rogalski, Kurowski, Maciejewski, Mroczek, Pawlik, Bąk, Kowalczuk, Michalak, Piasecki, Tomczak, Jaworski, Rakowski, Przybyła, Kuczyński,
  Mazurek, Gołębiowski, Kaźmierczak, Pająk, Dziedzic, Kasprzyk, Nowacki, Gutowski, Zawada, Stankiewicz, Szwed, Dudziak, Wolski, Kotowski,
  Sobolewski, Witek, Matusiak, Gałązka, Bednarek, Wrzesiński, Cichocki, Siwiec, Rogowski, Kowal, Chmiel, Fijałkowski, Bartczak, Banaś,
  Kaczmarski, Wojtasik, Sowiński, Szczepanik, Kruszewski, Krupa, Bielak, Adamski, Bednarczyk, Bogusz, Drozd, Gawroński, Grzybowski, Hajduk,
  Iwański, Janik, Jarosz, Kania, Kędzierski, Klimek, Kmieć, Kos, Kosiński, Krawiec, Kucharski, Kuc, Kulesza, Kwiatek, Lach, Lasota,
  Leszczyński, Łuczak, Łukasik, Majchrzak, Malec, Marszałek, Michałowski, Milczarek, Molenda, Mucha, Nawrocki, Niemiec, Orłowski, Owczarek,
  Pałka, Pawełczyk, Piekarski, Pietras, Piwowarczyk, Pokora, Polak, Popławski, Przybysz, Puchała, Rybak, Rybicki, Siwek, Skiba, Skowron,
  Słowik, Sobota, Sokół, Sosnowski, Stasiak, Stępniak, Szczygieł, Szostak, Szwarc, Tomczyk, Trojanowski, Walczyk, Węgrzyn, Włodarczyk,
  Wojtas, Wójcicki, Zaręba, Zawisza, Zych, Żurek, Żukowski, Gruszka, Jagielski, Andrzejak, Jankowiak, Przybylak, Ratajczak, Nowaczyk,
  Mikołajczak, Frankowski, Matuszewski, Wojciechowicz, Grzesiak, Kubiaczyk, Szymkowiak, Waligóra, Bartkowiak, Marciniec, Jasiak, Wieczorkiewicz,
  Kowalewicz, Sienkiewicz, Szewczuk, Romaniuk, Maksymiuk, Ostapczuk, Hawryluk, Litwiniuk, Prokopiuk, Siemieniuk, Waszkiewicz, Kondracki,
  Andruszkiewicz, Dmowski, Wasiak, Mazurkiewicz, Józefowicz, Kalinowicz, Kaczyna, Pyka, Gawlik, Kandzia, Mrozek, Morcinek, Respondek, Kowol,
  Pawlas, Pośpiech, Gajda, Kokot, Bugla, Jendrysik, Mainka, Niestrój, Kuczera, Skrzypczyk, Malcher, Sobik, Chudoba, Pientka, Labuda, Kreft,
  Formela, Gruchała, Mielewczyk, Kiedrowski, Hinc, Bigus, Okoń, Bachleda, Gąsienica, Chowaniec, Pitoń, Krzeptowski, Kępa, Kuchta, Galica,
  Bafia, Zubek, Wojtaszek, Bielski, Ciesielski, Czapla, Dobrowolski, Filipek, Florczak, Gąsior, Górniak, Gołąb, Grabarczyk, Gromek,
  Jędrzejczak, Kowalczewski, Kozik, Kubica, Lisowski, Madej, Maj, Mikulski, Mielczarek, Nowik, Pawlicki, Pluta, Przybył, Pyrek, Radomski,
  Rudnicki, Sadło, Serafin, Skrzypek, Smoliński, Sobieraj, Stefański, Strzelecki, Sujka, Szydłowski, Tkaczyk, Trzciński, Turek, Wach,
  Wawrzyniec, Wiatr, Wierzbicki, Wolak, Woźny, Zaborowski, Zalewa, Ziemba, Żmijewski, Bujak, Ciszewski, Dziuba, Gil, Godlewski, Jurek,
  Kalisz`);
const PL_E0 = w(`Adam, Alfred, Aleksander, Alojzy, Augustyn, Bogusław, Bolesław, Bronisław, Edmund, Emil, Eugeniusz, Feliks, Franciszek, Gerard,
  Hieronim, Hubert, Ignacy, Jakub, Jarosław, Julian, Juliusz, Karol, Konrad, Krzysztof, Leon, Leonard, Leszek, Lucjan, Ludwik, Maciej, Marek,
  Mieczysław, Michał, Mirosław, Paweł, Piotr, Romuald, Rudolf, Sławomir, Sylwester, Szczepan, Teodor, Tomasz, Wacław, Waldemar, Walenty,
  Wiesław, Wiktor, Witold, Włodzimierz, Wojciech, Zenon, Zygmunt, Bernard, Bogumił, Eryk, Florian, Gustaw, Izydor, Klemens, Lech, Longin,
  Marcin, Marceli, Norbert, Oskar, Seweryn, Wawrzyniec, Wincenty, Benedykt, Cezary, Remigiusz, Ireneusz, Eligiusz, Albin, Bernard, Dominik,
  Ernest, Fryderyk, Gabriel, Hilary, Kajetan, Kornel, Lesław, Wit, Zdzisław, Bonifacy, Kamil, Ryszard, Jerzy`);
const PL_E1960 = w(`Adam, Artur, Arkadiusz, Bogdan, Bogusław, Cezary, Daniel, Edward, Henryk, Hubert, Ireneusz, Jan, Jerzy, Józef, Kazimierz,
  Lech, Maciej, Marcin, Mariusz, Michał, Norbert, Przemysław, Rafał, Remigiusz, Sławomir, Stanisław, Tadeusz, Zenon, Zdzisław, Witold,
  Aleksander, Damian, Ernest, Emil, Eugeniusz, Igor, Julian, Karol, Konrad, Lucjan, Marian, Mieczysław, Radosław, Romuald, Sebastian, Sylwester,
  Wacław, Zygmunt, Bartłomiej, Bartosz, Dawid, Kamil, Adrian, Antoni, Czesław, Dominik, Edmund, Eryk, Feliks, Gerard, Ignacy, Jakub, Kornel,
  Lesław, Mirosław, Robert, Roman, Seweryn, Szymon, Waldemar, Wiktor, Wojciech, Zbigniew, Łukasz, Bronisław, Leon, Teodor, Benedykt, Florian,
  Henryk, Janusz`);
const PL_E1980 = w(`Adrian, Aleksander, Arkadiusz, Bartłomiej, Daniel, Dominik, Emil, Filip, Hubert, Jacek, Jan, Jarosław, Karol, Konrad, Krzysztof,
  Marek, Mateusz, Mikołaj, Norbert, Patryk, Remigiusz, Robert, Szymon, Tomasz, Wiktor, Kacper, Oskar, Igor, Ernest, Marcel, Maksymilian,
  Miłosz, Krystian, Kornel, Kevin, Andrzej, Dariusz, Cezary, Eryk, Fabian, Gabriel, Ireneusz, Jędrzej, Julian, Kajetan, Leszek, Mirosław,
  Seweryn, Stanisław, Tymoteusz, Witold, Waldemar, Antoni, Borys, Damian, Daniel, Franciszek, Gracjan, Hieronim, Ignacy, Jerzy, Józef,
  Juliusz, Kamil, Kazimierz, Leon, Lucjan, Marcin, Mariusz, Michał, Przemysław, Radosław, Roman, Ryszard, Sebastian, Sławomir, Tadeusz,
  Wojciech, Zbigniew, Adam, Albert, Alan, Bogdan, Denis`);
const PL_E1998 = w(`Adam, Alan, Aleks, Amadeusz, Borys, Bruno, Daniel, Emil, Fabian, Franciszek, Gabriel, Gustaw, Ignacy, Jędrzej, Julian, Juliusz,
  Kajetan, Konrad, Kornel, Krystian, Leon, Leonard, Maciej, Maksymilian, Marcel, Marcin, Marek, Miłosz, Natan, Nikodem, Oliwer, Olaf, Piotr,
  Paweł, Radosław, Robert, Sebastian, Stanisław, Stefan, Tomasz, Tymon, Tymoteusz, Wojciech, Witold, Ksawery, Iwo, Teodor, Tobiasz, Henryk,
  Arkadiusz, Artur, Łukasz, Damian, Ernest, Eryk, Gracjan, Hugo, Jacek, Jerzy, Józef, Marceli, Mateusz, Norbert, Przemysław, Rafał, Roch,
  Seweryn, Sylwester, Wincenty, Albert, Alex, Bartłomiej, Błażej, Cyprian, Dariusz, Denis, Dorian, Fryderyk, Grzegorz, Kevin, Kamil, Krzysztof,
  Lucjan, Mariusz, Remigiusz, Sławomir, Tadeusz, Wit, Konstanty`);
const PL_E2010 = w(`Antoni, Jan, Aleksander, Franciszek, Szymon, Jakub, Filip, Mikołaj, Wojciech, Kacper, Adam, Michał, Marcel, Stanisław, Wiktor,
  Piotr, Igor, Leon, Nikodem, Mateusz, Tymon, Ignacy, Tymoteusz, Oliwer, Bartosz, Hubert, Maksymilian, Józef, Julian, Tadeusz, Ksawery, Henryk,
  Alan, Natan, Leonard, Gustaw, Kazimierz, Teodor, Witold, Borys, Bruno, Iwo, Krzysztof, Maciej, Oskar, Dominik, Jędrzej, Kajetan, Konrad,
  Fabian, Gabriel, Daniel, Miłosz, Kornel, Olaf, Emil, Dawid, Krystian, Sebastian, Tobiasz, Lucjan, Feliks, Fryderyk, Roch, Jerzy, Eryk, Hugo,
  Juliusz, Karol, Patryk, Bartłomiej, Kamil, Łukasz, Paweł, Tomasz, Wincenty, Tytus, Konstanty, Marceli, Ryszard, Adrian, Albert, Aleks,
  Cyprian, Damian, Ernest, Gracjan, Kryspin, Leszek, Lew, Ludwik, Mieszko, Norbert, Remigiusz, Seweryn, Stefan, Sylwester, Teofil, Wit`);

// Familien aus Polen in Deutschland: Ruhrpolen (eingedeutschte Schreibweise),
// Oberschlesier/Spätaussiedler (schlesische Namen), Zuwanderer seit 1980/2004.
const GPL_LAST = u(PL_ALL.map(plain), w(`Schimanski, Koslowski, Stanislawski, Kolodziej, Pawlowski, Wolinski, Schikowski, Lisowski, Matuszak,
  Gorski, Jablonski, Mrozek, Pollak, Wilczek, Klimek, Wrobel, Kotzur, Pyka, Gawlik, Kandzia, Respondek, Lukoschek, Kokott, Gaida, Bugla,
  Pollok, Pawlas, Wollny, Pientka, Chudoba, Malcher, Mainka, Sobik, Niestroj, Kuczera, Swoboda, Skrzypczyk, Stawarz, Paschek, Sobotta,
  Wosnitza, Kotulla, Matuschek, Kaschner, Kowalke, Pietrzik, Kubitza, Schymik, Machnik, Golombek, Pischel, Mazurkiewitz, Nowotny,
  Wojtek, Sowa, Prus, Sliwa, Musiol, Grabowsky, Zielke, Jankowsky, Kalinowsky, Lewandowsky, Majewsky, Michalsky, Dombrowski`));
const GPL_E0 = w(`Krzysztof, Andrzej, Jerzy, Ryszard, Zbigniew, Tadeusz, Janusz, Jan, Józef, Stanisław, Henryk, Bernhard, Herbert, Georg, Joachim,
  Johann, Paul, Peter, Richard, Robert, Roman, Michael, Martin, Norbert, Hubert, Rafał, Tomasz, Jacek, Mariusz, Grzegorz, Marcin, Paweł,
  Wojciech, Leszek, Jarosław, Werner, Klaus, Manfred, Dieter, Horst, Günter, Heinz, Jürgen, Alfred, Gerhard, Reinhold, Ewald, Rudolf, Alois,
  Waldemar, Eduard, Erich, Wolfgang`);
const GPL_E1988 = w(`Michael, Tobias, Marcel, Robert, Marcin, Michał, Paweł, Łukasz, Bartosz, Jakub, Damian, Dawid, Krystian, Artur, Adam, Martin,
  Philipp, Florian, Fabian, Jan, Simon, Julian, Benjamin, Alexander, Mario, Tim, Nico, Rafael, Tomasz, Konrad, Matthias, Stefan, Andreas,
  Thomas, Oliver, René, Sascha, Marek, Piotr, Krzysztof, Norbert, Dennis, Kevin, Maximilian, David, Felix, Niklas, Jonas, Marvin, Robin`);
const GPL_E2003 = w(`Antoni, Jan, Aleksander, Mikołaj, Wiktor, Igor, Franciszek, Maksymilian, Ben, Paul, Finn, Elias, Jonas, Luis, Felix, Henry, Emil,
  Anton, Oliver, Tim, Niklas, Lukas, Leo, Milan, David, Daniel, Fabian, Marcel, Dominik, Damian, Mateusz, Dawid, Tymon, Olaf, Bruno, Theo,
  Liam, Moritz, Jonathan, Samuel, Gabriel, Alexander, Maximilian, Marlon, Mika, Oskar, Kacper, Szymon, Filip, Nikodem, Paweł`);

// --- Tschechoslowakei (Böhmen, Mähren, Slowakei) -----------------------------------
const CZ_ALL = w(`Blažek, Musil, Staněk, Dostál, Šťastný, Moravec, Pešek, Kubát, Janda, Vacek, Hora, Holý, Kozák, Mach, Hanák, Hladík, Hlaváček,
  Hudec, Hrdlička, Hron, Janoušek, Kalina, Klíma, Kocourek, Koubek, Kovařík, Křížek, Kubík, Kupka, Kvasnička, Macek, Mašek, Matějka, Mikeš,
  Mráz, Mrázek, Müller, Němeček, Pavlík, Pech, Petrů, Pilař, Rada, Řezníček, Richter, Rybář, Řehák, Sedlák, Skála, Slavík, Smola, Sobotka,
  Stejskal, Strnad, Suchý, Svatoš, Šebek, Šindelář, Šmíd, Šulc, Švec, Tesař, Toman, Trnka, Urbánek, Vaníček, Vašíček, Vondra, Vondráček,
  Votava, Vrba, Vrána, Vybíral, Zedník, Zelenka, Zíka, Zima, Žák, Žižka, Adámek, Bednář, Beran, Bílek, Brabec, Brož, Burian, Cibulka, Čapek,
  Charvát, Chalupa, Dvořáček, Fišer, Formánek, Hanzlík, Hašek, Havlíček, Hejduk, Holeček, Horáček, Hořejší, Hubáček, Jaroš, Jeřábek, Jež,
  Kaplan, Kašpar, Klement, Kopřiva, Kořínek, Koudelka, Koutný, Kozel, Krátký, Kulhánek, Kunc, Lacina, Linhart, Lorenc, Malík, Matějíček,
  Melichar, Michálek, Mikula, Mlejnek, Nekola, Neumann, Ondráček, Pátek, Pavlíček, Pazdera, Peroutka, Pešta, Plachý, Polívka, Prokop, Roubal,
  Rybka, Rys, Severa, Sklenář, Skopal, Skořepa, Sládek, Sochor, Souček, Spáčil, Štěpán, Šafránek, Šimůnek, Šrámek, Tomášek, Topinka, Trojan,
  Tuček, Uher, Válek, Vaněček, Večeřa, Veverka, Vítek, Vlach, Vodička, Volf, Vondrák, Vrabec, Zahradník, Zapletal, Zelinka, Zemánek, Zikmund,
  Bárta, Barták, Doubrava, Fuchs, Hampl, Hendrych, Hofman, Jirásek, Kalous, Kotek, Kratochvíl, Kubeš, Langer, Machala, Novák, Nováček,
  Petržela, Pokorný, Říha, Slanina, Šimáček, Šustr, Tůma, Valášek, Vaculík, Zbořil, Bajer, Bauer, Duda, Hála, Hrbek, Jakeš, Kohoutek,
  Horváth, Kováč, Baláž, Lukáč, Kollár, Oravec, Hudák, Gajdoš, Kováčik, Rusnák, Šimko, Mihalik, Krajčovič, Mikuš, Gašpar, Lacko, Danko,
  Jakubík, Kmeť, Kocúr, Majer, Macko, Sloboda, Sokol, Tomko, Vaško, Jurík, Kollár, Bielik, Čierny, Hanus, Hlavatý, Hrnčiar, Kuchár, Kubala,
  Lysý, Medvecký, Pavlovič, Polák, Sedlár, Smolár, Šuster, Tóth, Urban, Valach, Varga, Vavrinec, Zelený, Žiak, Bystrický, Ondruška`);
const CZ_E0 = w(`Adolf, Alois, Arnošt, Augustin, Bedřich, Bohuslav, Bořivoj, Břetislav, Čestmír, Dalibor, Emil, Ervín, Evžen, Ferdinand, Hynek,
  Ignác, Ivan, Jan, Jaromír, Jindřich, Jiří, Josef, Kamil, Karel, Kazimír, Lubomír, Ludvík, Lumír, Marek, Milan, Miloš, Miroslav, Oldřich,
  Otakar, Ota, Otto, Pavel, Petr, Přemysl, Radim, Radomír, Richard, Rostislav, Rudolf, Svatopluk, Štefan, Tomáš, Václav, Viktor, Vilém,
  Vladimír, Vlastimil, Vojtěch, Vratislav, Zbyněk, Zdeněk, Ján, Jozef, Ladislav, Ľudovít, Michal, Ondrej, Peter, Juraj, Anton, Imrich,
  Ernest, Gustáv, Viliam, Eduard, Arnold, Bohumír, Dušan, Ľubomír, Rudolf, František, Antonín, Bohumil, Stanislav, Miloslav, Jaroslav`);
const CZ_E1965 = w(`Aleš, Daniel, David, Jan, Jaroslav, Jiří, Libor, Luboš, Marek, Martin, Michal, Miroslav, Pavel, Petr, Radek, Roman, Tomáš,
  Vladimír, Zdeněk, Vratislav, Antonín, Bohumil, Dalibor, Dušan, Ivan, Ivo, Jindřich, Josef, Karel, Kamil, Ladislav, Lubomír, Milan, Miloš,
  Ondřej, Oldřich, Patrik, Radim, René, Robert, Rostislav, Stanislav, Václav, Viktor, Vít, Vlastimil, Vojtěch, Zbyněk, Igor, Jakub,
  Lukáš, Filip, Richard, Ján, Jozef, Peter, Marián, Ľubomír, Juraj, Pavol, Róbert, Rastislav, Branislav, Ľuboš, Štefan, Matej, Norbert,
  Vladimír, Roman, Miroslav, Mário, Erik, Tibor, Gabriel, Emil, Jaromír, Leoš, Luděk, Bohuslav, Přemysl,
  Otakar, Vladislav, Marcel, Bronislav, Ludvík, Hynek`);
const CZ_E1988 = w(`Adam, Dominik, Filip, Jakub, Jan, Jiří, Josef, Lukáš, Matěj, Michal, Ondřej, Patrik, Petr, Tomáš, Vojtěch, Václav, David, Daniel,
  Šimon, Martin, Marek, Pavel, Radek, Roman, Antonín, František, Karel, Jaroslav, Miroslav, Vít, Štěpán, Tadeáš, Matyáš, Kryštof, Mikuláš,
  Prokop, Vítězslav, Hynek, Lubomír, Libor, Aleš, Denis, Erik, Kevin, Robin, Sebastian, Richard, Viktor, Oliver, Samuel, Matouš, Eduard,
  Ladislav, Radim, Zdeněk, Matúš, Tobiáš, Andrej, Juraj, Peter, Marián, Branislav, Ján, Jozef, Róbert, Lukas, Adrián, Alex, Tibor, Teodor,
  Jonáš, Ludvík, Hugo, Ondrej, Damián, Kristián`);

// --- Ungarn ------------------------------------------------------------------------
const HU_ALL = w(`Bíró, Balla, Barta, Bárány, Benkő, Bencze, Csonka, Csordás, Dobos, Dudás, Erdélyi, Erdős, Fábián, Fehér, Fejes, Fülöp, Gáspár,
  Gergely, Győri, Hegedűs, Hegyi, Hornyák, Hajdú, Illés, Jakab, Jónás, Kalmár, Kántor, Kerekes, Kertész, Kozma, Kun, Kurucz, Lengyel, Lőrincz,
  Magyar, Máté, Mátyás, Mezei, Nemes, Novák, Pap, Pataki, Pethő, Pető, Polgár, Pongrácz, Sárközi, Sebestyén, Sipos, Soós, Szalay, Szántó,
  Szarka, Szénási, Szőke, Tamás, Vass, Végh, Veres, Vida, Vígh, Virág, Zsigmond, Zsoldos, Ács, Ágoston, Albert, Bakos, Bene, Bernáth, Bodor,
  Bogdán, Borbély, Botos, Csányi, Csiszár, Dénes, Dobó, Domokos, Egri, Erdei, Ferenczi, Forgács, Földi, Gombos, Gyenes, Halmi, Hegedüs,
  Herczeg, Hollósi, Huszár, Jenei, Józsa, Kálmán, Kása, Keresztes, Kollár, Kónya, Kormos, Kozák, Kulcsár, Lantos, Lázár, Makai, Márton,
  Mihály, Miklós, Muhi, Nyári, Nyitrai, Ötvös, Pálinkás, Pálfi, Pozsgai, Rigó, Rostás, Sallai, Schmidt, Szemes, Szép, Szigeti, Tihanyi,
  Ujvári, Vadász, Vajda, Varró, Zentai, Zámbó, Zsiga, Bacsó, Baranyi, Bartos, Csapó, Deli, Dósa, Gyurkó, Horvát, Lovas, Mándoki, Medve,
  Mikó, Nyerges, Oravecz, Pálffy, Rózsa, Sólyom, Szakács, Szolnoki, Szegedi, Vámos, Varjú, Zana, Wágner, Kocsis, Czakó, Csizmár,
  Dancs, Deák, Dombi, Éles, Fazekas, Fenyvesi, Hajós, Hámori, Kecskés, Kerényi, Király, Kiss, Kovacsics, Kolompár,
  Lakatos, Mag, Majoros, Marosi, Mohácsi, Nádasdi, Orsós, Pásztor, Pál, Pallagi, Rab, Radics, Rácz, Révész, Sárosi, Simon, Somogyi, Szentes,
  Szilágyi, Szücs, Takács, Tarr, Tót, Turi, Vadas, Vincze, Zsiros, Antal, Babos, Bajusz, Balog, Berényi, Bogár, Bokor, Bolla, Bódi, Borsos,
  Buzás, Cseh, Csóka, Danyi, Dávid, Dorogi, Fehérvári, Fekete, Fodor, Gál, Gönczi, Gyöngyösi, Halász, Hevesi, Jakus, Juhász, Kardos,
  Katona, Kelemen, Kis, Kovács, László, Lukács, Major, Molnár, Nagy, Németh, Oláh, Orosz, Papp, Pintér, Rajki, Sándor, Szabó, Szalai,
  Szekeres, Tóth, Török, Varga, Vörös, Simonyi, Bánki, Kristóf, Faragó, Rédei, Benedek, Bujdosó, Szőllősi, Tasnádi`);
const HU_E0 = w(`Béla, Dezső, Elemér, Endre, Jenő, Kálmán, Lőrinc, Pál, Rezső, Tivadar, Vilmos, Árpád, Bertalan, Ödön, Ottó, Rudolf, Szilveszter,
  Tamás, Péter, Attila, Csaba, Albert, Alajos, Ambrus, Dénes, Dömötör, Elek, Emil, Ervin, Frigyes, Gáspár, Gusztáv, Győző, Henrik, Ignác, Iván,
  Jakab, Kornél, Márton, Máté, Mátyás, Menyhért, Nándor, Oszkár, Richárd, Róbert, Sámuel, Simon, Szabolcs, Viktor, Vince, Zsigmond, Benedek,
  Bálint, Balázs, Gergely, Aladár, Barnabás, Boldizsár, Ákos, Andor, Bódog, Dániel, Egon, Erik, Gedeon, Gerő, Imre, Jenő, Kristóf, László,
  Lénárd, Tihamér, Ferenc, István, József, János, Sándor`);
const HU_E1965 = w(`Ákos, András, Antal, Árpád, Balázs, Béla, Botond, Dénes, Ervin, Ernő, Endre, Géza, Győző, Iván, Jenő, Kálmán, Krisztián, Lajos,
  Levente, Lóránt, Lőrinc, Mihály, Miklós, Norbert, Nándor, Ottó, Pál, Richárd, Roland, Szabolcs, Szilárd, Szilveszter, Tihamér, Viktor,
  Vilmos, Zsigmond, Barnabás, Bálint, Dániel, Dávid, Ádám, Kornél, Lénárd, Máté, Mátyás, Rudolf, Sebestyén, Csongor, Gusztáv, Aladár, Gergely,
  Imre, Márton, Benedek, Ferenc, Gyula, Henrik, Ottó, Kristóf, Emil, Albert, Alfréd, Elemér, Frigyes, Hunor, Oszkár, Rezső, Sámuel, Tivadar,
  Vince, Márk, Tamás, Zoltán, Attila`);
const HU_E1988 = w(`Ábel, Adrián, Ákos, Alex, Álmos, András, Áron, Attila, Barnabás, Bálint, Barna, Benedek, Botond, Csaba, Csongor, Dominik, Erik,
  Ferenc, Gábor, Gellért, Hunor, Kristóf, Kornél, László, Lőrinc, Marcell, Martin, Mátyás, Márton, Mihály, Miklós, Nándor, Noel, Olivér,
  Oszkár, Szabolcs, Szilárd, Tibor, Viktor, Vilmos, Zalán, Zoltán, Zsolt, Benjámin, Benett, Bendegúz, Dorián, Gergő, Kevin, Krisztofer,
  Nimród, Örs, Soma, Vince, István, József, János, Sándor, Imre, Gyula, Lajos, Simon, Boldizsár, Kende, Bertalan, Domonkos, Kolos, Bulcsú,
  Keve, Ervin, Tamás, Richárd, Roland, Norbert, Krisztián, Róbert`);
const HU_E2005 = w(`Bence, Máté, Levente, Dominik, Ádám, Dániel, Marcell, Balázs, Dávid, Milán, Botond, Zalán, Benedek, Barnabás, Noel, Olivér,
  Áron, Bálint, Gergő, Zsombor, Kristóf, Márk, Benett, Hunor, Vince, Zétény, Zente, Bendegúz, Nimród, Soma, Ábel, Csongor, Kornél, Martin,
  Patrik, Péter, Tamás, Erik, Alex, Benjámin, Krisztofer, Mátyás, Márton, Lőrinc, Barna, Örs, Szabolcs, Simon, Boldizsár, Kende, Bertalan,
  Domonkos, Gellért, András, László, Attila, Zoltán, Gábor, Richárd, Norbert, Viktor, Ákos, Bulcsú, Keve, Zénó, Kolos, Medárd, Ágoston,
  Benjamin, Dorián, Liam, Noé, Olivér, Ármin`);

// --- UdSSR / Russland ----------------------------------------------------------------
const SU_RUS = w(`Afanassjew, Aksjonow, Anissimow, Archipow, Artjomow, Baranow, Belousow, Blinow, Bobrow, Bolschakow, Bulatow, Bykow, Denissow,
  Dmitrijew, Drosdow, Dubow, Fadejew, Fedossejew, Gerassimow, Gladkow, Gorbunow, Gorschkow, Grigorjew, Gromow, Grischin, Gurjew, Ignatjew,
  Isajew, Jefimow, Jefremow, Jermakow, Jerschow, Jurjew, Kalinin, Kapustin, Kasakow, Kirillow, Kolesnikow, Kondratjew, Konowalow, Kopylow,
  Korotkow, Krasnow, Krjukow, Kudrjawzew, Kulikow, Lasarew, Lapin, Larionow, Leonow, Loginow, Lukin, Majorow, Malyschew, Markow, Martynow,
  Maslow, Mironow, Muchin, Naumow, Nasarow, Nesterow, Nikiforow, Obuchow, Ossipow, Panow, Panfilow, Platonow, Ponomarjow, Prochorow,
  Rodionow, Rogow, Rjabow, Rybakow, Samoilow, Sawin, Schestakow, Schirokow, Schubin, Schtscherbakow, Seliwanow, Sidorow, Simonow, Sorokin,
  Suchanow, Swerjew, Tichonow, Timofejew, Tretjakow, Trofimow, Tschernow, Tscherkassow, Tschistjakow, Tschernyschow, Uwarow, Wasin, Weselow,
  Wiktorow, Woronin, Woronzow, Zwetkow, Akimow, Arsenjew, Awdejew, Barinow, Beljajew, Bessonow, Bogomolow, Bondarew, Borodin, Bystrow,
  Dawydow, Degtjarjow, Demidow, Dementjew, Doronin, Galkin, Gontscharow, Gubin, Ignatow, Kotow, Kostin, Kudrin, Lytkin, Malinin, Maximow,
  Melnikow, Merkulow, Michejew, Nikonow, Nosow, Orechow, Owtschinnikow, Pachomow, Panin, Pantelejew, Pirogow, Plotnikow, Pogodin, Potapow,
  Prokofjew, Pronin, Rasumow, Rjasanow, Samsonow, Saweljew, Schachow, Schilow, Sedow, Sobolew, Sotnikow, Starikow, Tarakanow, Uschakow,
  Waganow, Warlamow, Wolodin, Woronow, Bajkow, Fokin, Golubkow, Jakuschew, Kolobow, Lobanow, Lukjanow, Nekrassow, Rudnew,
  Silantjew, Skworzow, Subbotin, Tschurkin, Wichrow, Sujew`);
const SU_UKR_BY = w(`Kowaltschuk, Melnyk, Boiko, Kowalenko, Tkatschenko, Krawtschenko, Oliinyk, Schewtschuk, Polischtschuk, Lysenko, Rudenko,
  Sawtschenko, Petrenko, Klimenko, Pawlenko, Kusmenko, Ponomarenko, Lewtschenko, Martschenko, Kostenko, Wakulenko, Gontscharenko, Didenko,
  Fedorenko, Prichodko, Grizenko, Karpenko, Mischtschenko, Radtschenko, Sidorenko, Nasarenko, Sacharenko, Semenenko, Wowk, Romanjuk,
  Sawtschuk, Martynjuk, Melnitschuk, Kowal, Gawriljuk, Tkatschuk, Pawljuk, Dmitrenko, Ostaptschuk, Kotscherga, Moros, Litwin, Bilyk,
  Kowalewitsch, Nowik, Sawitsch, Markewitsch, Jurkewitsch, Pawlowitsch, Sinkewitsch, Bogdanowitsch, Kasakewitsch, Juschkewitsch,
  Radkewitsch, Daschkewitsch, Prokopowitsch, Martinowitsch, Kowaljonok, Schuk, Gurinowitsch`);
const SU_SOUTH = w(`Beridse, Kapanadse, Gelaschwili, Maisuradse, Giorgadse, Lomidse, Nozadse, Mamaladse, Abaschidse, Kiknadse, Dolidse,
  Tschcheidse, Gogoladse, Bakradse, Burduli, Kobachidse, Meladse, Zereteli, Petrosjan, Grigorjan, Sarkisjan, Owanessjan, Akopjan,
  Arutjunjan, Martirosjan, Mkrtschjan, Gasparjan, Karapetjan, Babajan, Galstjan, Saakjan, Awetisjan, Wardanjan, Manukjan, Mamedow,
  Gussejnow, Gassanow, Ismailow, Kasimow, Abdullajew, Welijew, Sultanow, Nabijew, Rachimow, Tursunow, Kassymow, Ibragimow, Saidow,
  Galijew, Sabirow, Garipow, Chairullin, Gilmutdinow, Nurgalijew, Fachrutdinow, Achmadullin, Junussow, Mussin, Schakirow`);
const SU_BALT = w(`Kazlauskas, Petrauskas, Jankauskas, Butkus, Paulauskas, Urbonas, Kavaliauskas, Rimkus, Navickas, Ramanauskas, Vaitkus,
  Jonaitis, Baranauskas, Bērziņš, Kalniņš, Ozoliņš, Jansons, Ozols, Liepiņš, Krūmiņš, Balodis, Zariņš, Pētersons, Vītols, Tamm, Saar, Sepp,
  Mägi, Kask, Kukk, Rebane, Pärn, Koppel, Lepik, Kuusk, Raudsepp, Vaher`);
const SU_E0 = w(`Albert, Andrei, Arkadi, Bogdan, Dmitri, Eduard, Emil, Felix, Fjodor, Gleb, Grigori, Ilja, Iwan, Jakow, Konstantin, Lew, Matwei,
  Michail, Nikita, Pawel, Rostislaw, Semjon, Stanislaw, Stepan, Timofei, Wadim, Waleri, Walentin, Wenjamin, Wjatscheslaw, Wladislaw,
  Wsewolod, Jaroslaw, Ruslan, Rustam, Timur, Marat, Rinat, Rawil, Ildar, Rafael, Schamil, Merab, Schota, Rewas, Tengis, Otar, Dawit, Giwi,
  Aschot, Armen, Karen, Samwel, Arnold, Robert, Rudolf, Genrich, Innokenti, Lewan, Nodar, Ramas, Wachtang, Guram, Vytautas, Algirdas,
  Jānis, Andris, Aivars, Toomas, Taras, Ostap, Juozas, Kirill, Daniil, Afanassi, Jefim, Ignat, Awenir, Platon, Prochor, Saweli, Tichon,
  Trofim, Wassili, Gennadi, Igor, Jewgeni, Anatoli`);
const SU_E1965 = w(`Anton, Arkadi, Artur, Boris, Denis, Eduard, Fjodor, Gleb, Grigori, Ilja, Iwan, Jaroslaw, Juri, Kirill, Leonid, Maxim, Nikolai,
  Nikita, Pjotr, Rostislaw, Ruslan, Rustam, Semjon, Stepan, Timur, Wassili, Wjatscheslaw, Wladimir, Albert, Marat, Rinat, Rawil, Ildar, Rafael,
  Damir, Ramil, Schamil, Aslan, Arsen, Georgi, Lewan, Dawit, Sasa, Otar, Rewas, Merab, Armen, Karen, Aram, Gagik, Walentin, Wenjamin,
  Wsewolod, Bogdan, Taras, Ostap, Anatoli, Artjom, Emil, Felix, Jakow, Lew, Matwei, Robert, Timofei, Andris, Jānis,
  Arūnas, Darius, Rimas, Tõnu, Aivar, Mart, Rolandas, Ainars, Alexej`);
const SU_E1988 = w(`Andrei, Arseni, Artur, Bogdan, Damir, David, Eduard, Elissei, Gleb, Grigori, Igor, Jaroslaw, Jewgeni, Konstantin, Lew, Makar,
  Mark, Matwei, Michail, Miron, Nikolai, Oleg, Platon, Ruslan, Rustam, Saweli, Semjon, Sergei, Stepan, Timofei, Timur, Tichon, Wadim, Walentin,
  Wassili, Wenjamin, Wjatscheslaw, Wladislaw, Wsewolod, Arsen, Aslan, Amir, Marat, Ramil, Ildar, Aidar, Rafael, Robert, Emil, Albert, Leonid,
  Georgi, Sachar, Demid, Ignat, Jakow, Prochor, Rodion, Magomed, Schamil, Arslan, German, Gordei, Jemeljan, Mstislaw, Nasar, Ratmir,
  Swjatoslaw, Rostislaw, Waleri, Vitali, Juri, Alexej, Aleksei, Oskar, Taras`);
const SU_E2005 = w(`Artjom, Maksim, Aleksandr, Michail, Iwan, Daniil, Dmitri, Kirill, Andrei, Jegor, Nikita, Ilja, Alexej, Matwei, Timofei, Roman,
  Wladimir, Jaroslaw, Fjodor, Georgi, Konstantin, Lew, Nikolai, Stepan, Wladislaw, Pawel, Arseni, Denis, Gleb, Saweli, Mark, Makar, Platon,
  Semjon, Tichon, Miron, Sachar, Demid, Lukjan, Elissei, Ratmir, Timur, Amir, Damir, Arsen, Rodion, Bogdan, David, Eduard, Igor, Wsewolod,
  Swjatoslaw, Mstislaw, Rostislaw, Jemeljan, Prochor, Gordei, Ignat, Wenjamin, Walentin, Sergei, Anton, Artur, Ruslan, Rustam, Eldar, Magomed,
  Ibragim, Ismail, Murad, Schamil, Kamil, Adam, Mansur, Danijar, Erik, Robert, Wassili, Wadim, Jakow, Taras`);

// --- Jugoslawien (alle Teilrepubliken) ----------------------------------------------
const YU_SRB = w(`Stanković, Simić, Lukić, Ivanović, Jovičić, Jevtić, Pešić, Ranković, Stamenković, Tasić, Veličković, Zorić, Dimitrijević,
  Đokić, Gligorijević, Ignjatović, Jeremić, Maksimović, Marjanović, Milanović, Milojević, Milutinović, Mirković, Nešić, Pantić, Paunović,
  Petronijević, Radenković, Radivojević, Radojević, Simonović, Stanisavljević, Stefanović, Stojiljković, Trifunović, Živanović, Arsić, Ćirić,
  Dragović, Jakšić, Kojić, Lalić, Mitić, Nenadović, Pajić, Prokić, Rajković, Stošić, Tanasković, Urošević, Vujić, Zarić, Grujić, Ostojić,
  Sekulić, Trajković, Vasiljević, Vidaković, Vukadinović, Zlatković, Aleksić, Andrić, Gajić, Jović, Milić, Petković, Spasić, Lazić, Đurić`);
const YU_CRO = w(`Horvat, Novak, Knežević, Jurić, Pavić, Barić, Bašić, Blažević, Bošnjak, Brkić, Grgić, Kovač, Kovačić, Lovrić, Vidović, Barišić,
  Galić, Lučić, Mikulić, Perković, Šimić, Vukić, Božić, Jukić, Mandić, Martinović, Pavičić, Lončar, Ivanković, Jelić, Ivančić, Kolar,
  Šimunović, Bartulović, Brajković, Dujmović, Golubić, Grubišić, Herceg, Jurković, Klarić, Kraljević, Krznarić, Ljubić, Matković, Mihaljević,
  Miletić, Milković, Novosel, Pejić, Puljić, Rajić, Ružić, Sertić, Stipić, Topić, Tomljenović, Vrban, Žužul, Kralj, Matijević`);
const YU_BIH = w(`Mujić, Ramić, Delić, Mehić, Bešić, Halilović, Hasić, Alić, Salihović, Suljić, Selimović, Husić, Avdić, Mešić, Karić, Kurtović,
  Muratović, Osmanović, Smajić, Softić, Zukić, Čolić, Džaferović, Imamović, Kadić, Mahmutović, Jusić, Huskić, Bajrić, Tahirović, Hamzić,
  Šehić, Velić, Dedić, Hrustić, Pašić, Hodžić, Begović, Hasanović, Omerović, Ahmetović, Ibrišimović, Kovačević, Ćosić, Lukač`);
const YU_SLO = w(`Krajnc, Zupančič, Kovačič, Potočnik, Mlakar, Kos, Vidmar, Golob, Turk, Zupan, Bizjak, Hribar, Kastelic, Kavčič, Rozman, Žagar,
  Petek, Košir, Koren, Medved, Jerman, Kuhar, Furlan, Pirc, Hočevar, Tomažič, Janežič, Kranjc, Breznik, Žnidaršič, Lešnik, Sever, Petrič,
  Pavlin, Debeljak, Jereb, Zorman, Rupnik, Kokalj, Kramar, Majcen, Leban, Erjavec, Uršič, Bogataj, Gregorič, Kozole, Primožič, Logar`);
const YU_MAZ = w(`Stojanovski, Petrovski, Nikolovski, Jovanovski, Trajkovski, Dimitrovski, Ristovski, Angelovski, Georgievski, Stefanovski,
  Popovski, Kostovski, Ilievski, Mitrevski, Velkovski, Naumovski, Atanasovski, Spasovski, Todorovski, Krstevski, Arsovski, Bogdanovski,
  Gjorgjievski, Stojkovski, Markovski, Pavlovski, Simonovski, Trajanovski`);
const YU_MNE = w(`Vujović, Radulović, Vujačić, Bulatović, Raičević, Šćekić, Božović, Kaluđerović, Vukčević, Lakić, Pejović, Đurović, Perović,
  Bojović, Nikčević, Vujošević, Radonjić, Bošković, Šćepanović`);
const YU_KOS = w(`Krasniqi, Gashi, Berisha, Morina, Hoxha, Shala, Bytyqi, Kastrati, Rexhepi, Hasani, Kryeziu, Sahiti, Halili, Osmani`);
const YU_E0 = w(`Ljubomir, Milorad, Miodrag, Slobodan, Velimir, Vojislav, Živko, Milovan, Bogdan, Svetozar, Aleksandar, Đorđe, Stanko, Vlado,
  Dragutin, Stjepan, Franjo, Ante, Ivan, Mate, Šime, Pavao, Marijan, Tomislav, Zdravko, Mladen, Rade, Milan, Mile, Božo, Stevo, Đuro, Slavko,
  Krešimir, Branimir, Hajrudin, Asim, Fuad, Enver, Ibrahim, Munir, Husref, Janez, Franc, Jože, Stane, Anton, Marjan, Ivo, Blagoja, Trajko,
  Kiril, Gjorgji, Ljupčo, Agim, Fadil, Rexhep, Shaban, Ramadan, Muhamed, Mustafa, Hasan, Husein, Kemal, Alija, Zijad, Sabahudin, Refik,
  Muhidin, Nusret, Midhat, Budimir, Milorad, Veselin, Radoje, Vukašin, Novak, Sreten, Tihomir, Vinko, Mirko, Andrija, Bogoljub, Dobrivoje,
  Miljan, Jure, Luka, Ilija, Nikola, Petar`);
const YU_E1960 = w(`Janez, Bojan, Matjaž, Andrej, Primož, Uroš, Aleš, Borut, Gregor, Matej, Igor, Tomaž, Jure, Blaž, Goce, Toni, Vlatko, Dragi,
  Ilija, Boban, Vasko, Saško, Edin, Emir, Senad, Elvir, Samir, Mirsad, Nermin, Sead, Muhamed, Fikret, Nihad, Jasmin, Almir, Damir, Adnan,
  Amel, Dženan, Ermin, Besnik, Fatmir, Ilir, Bujar, Arben, Burim, Afrim, Veselin, Vuk, Milorad, Budimir, Branko, Željko, Dražen, Krešimir,
  Zvonimir, Tomislav, Ante, Mario, Marko, Josip, Robert, Damir, Alen, Ivo, Miroslav, Dalibor, Darko, Danijel, Duško, Dušan, Ivica, Mladen,
  Nenad, Saša, Bratislav, Dragiša, Milorad, Miodrag, Mile, Petar, Rade, Radomir, Siniša, Srđan, Vladan, Vlade`);
const YU_E1970 = w(`Marko, Nikola, Ivan, Luka, Petar, Stefan, Aleksandar, Milan, Miloš, Nemanja, Dušan, Filip, Lazar, Vladimir, Uroš, Marin, Josip,
  Ante, Tomislav, Mario, Dario, Igor, Goran, Dejan, Bojan, Darko, Saša, Danijel, Denis, Edin, Emir, Haris, Admir, Adnan, Amir, Armin, Kenan,
  Mirza, Tarik, Elvis, Elvir, Jasmin, Senad, Samir, Nermin, Rok, Žiga, Anže, Jan, Tilen, Gašper, Klemen, Blaž, Jure, Luka, Matic, Nejc,
  Aljaž, Goran, Igor, Vlatko, Darko, Boban, Kire, Nikola, Valon, Arton, Driton, Blerim, Ardian, Vuk, Vukašin, Mihailo, Ognjen, Veljko,
  Strahinja, Andrija, Bogdan, Đorđe, Ivo, Krešimir, Mladen, Zvonimir, Domagoj, Ivica`);

// --- Kroatien und Serbien seit 1991 --------------------------------------------------
const HR_LAST = u(YU_CRO, w(`Kovačević, Popović, Pavlović, Ilić, Šantić, Varga, Tadić, Zorić, Petković, Mihalić, Kos, Turk, Medved, Stanić,
  Sokolić, Validžić, Žganjer, Bukovac, Crnković, Ćurić, Filipović, Ivanković, Jozić, Jurišić, Juričić, Kelava, Kolarić, Kušić, Lasić,
  Lukačević, Majić, Matijašević, Nikolić, Novaković, Radman, Rendulić, Rubčić, Smoljan, Šarić, Škugor, Tokić, Udovičić, Zec,
  Bakula, Brajša, Budimir, Car, Čavlina, Dragičević, Duvnjak, Erceg, Franjić, Ivić, Ivković, Jagodić, Kardum, Katić,
  Abramović, Antunović, Bačić, Balen, Batinić, Benković, Bralić, Brnić, Buljan, Bulić, Čačić, Čuljak, Dadić, Domazet, Đaković, Ercegovac,
  Fabijanić, Gašparić, Grbić, Grgurić, Horvatić, Ivančević, Jakopović, Jerković, Jurčević, Kalebić, Klasić, Kolak, Komljenović, Kosić,
  Kostelac, Krajinović, Krpan, Lacković, Marinović, Markulin, Matošić, Medić, Mikić, Milas, Miličević, Mustapić, Nemet, Novačić, Oreč,
  Pandžić, Pavković, Pavlić, Piljić, Prskalo, Raguž, Ramljak, Rašić, Režić, Rubić, Sablić, Skelin, Sušac, Šegvić, Šimičić, Škarica,
  Šoštarić, Tolić, Tomašević, Topalović, Turković, Vidaković, Vranješ, Vrkić, Vukelić, Vulić, Zelić, Zovko, Žanić, Bilandžić, Brkljačić,
  Ćaleta, Dropulić, Jurin, Kaić, Krolo, Lozo, Pervan, Plazibat, Radoš, Ravlić, Sučić, Šunjić, Vuletić`));
const SR_LAST = u(YU_SRB, w(`Popović, Bogdanović, Bošković, Cvetković, Filipović, Janković, Krstić, Lazarević, Marinković, Matić, Mihajlović,
  Nedeljković, Obradović, Radović, Stevanović, Tomić, Vučković, Vuković, Ilić, Babović, Blagojević, Branković, Čolić, Damnjanović,
  Despotović, Dinić, Glišić, Isailović, Jeftić, Knežević, Lukić, Milosavljević, Nikodijević, Panić, Pavić, Pejović, Perović, Radić,
  Raičević, Simeunović, Sretenović, Vasiljević, Velimirović, Vujošević, Zdravković, Andrejević, Aćimović, Bjelić, Božović, Erić, Jakšić,
  Ljubisavljević, Mićić, Petrić, Radulović, Rakić, Savić, Stanković, Stojanović, Todorović, Živić, Arsenijević, Bajić, Cvijić, Đorđević,
  Gavrilović, Ivković, Jevremović, Kostić, Mladenović, Novaković, Pešić, Ristić, Tošić, Vulović,
  Anđelković, Antonijević, Bojić, Bogićević, Ćosić, Dimić, Đurđević, Đuričić, Golubović, Janićijević, Jankov, Jelić, Joksimović, Lazović,
  Majstorović, Milanković, Pavićević, Pejčić, Popov, Prodanović, Radisavljević, Ranđelović, Stanojković, Tešić, Vidojević, Vuksanović,
  Ćirković, Jovanov, Pantelić, Radonjić, Simović, Veselinović, Vukić, Mihailović, Pavlov, Stankov, Nikolov, Kovačev, Milojković`));
const HR_E0 = w(`Stjepan, Franjo, Mate, Šime, Pavao, Marijan, Zdravko, Mladen, Krešimir, Branimir, Božo, Vinko, Ivo, Jure, Luka, Petar, Nikola,
  Andrija, Ilija, Tihomir, Željko, Dražen, Zoran, Damir, Darko, Dalibor, Danijel, Denis, Dino, Edi, Elvis, Hrvoje, Ivo, Jakov, Jozo, Kristijan,
  Leo, Lovro, Marin, Marijo, Matija, Mato, Mihovil, Miroslav, Neven, Ozren, Renato, Roko, Saša, Siniša, Slavko, Srećko, Stanko, Tonći, Vedran,
  Velimir, Vjekoslav, Želimir, Ante, Boris, Bruno, Dubravko, Emil, Goran, Hrvoje, Igor, Josip, Kruno, Marko, Mirko, Nenad, Predrag,
  Romeo, Tomo, Vladimir, Zvonko, Antun, Dragutin`);
const HR_E1980 = w(`Filip, Leon, Jakov, Karlo, Petar, David, Fran, Roko, Lovro, Matej, Noa, Mihael, Niko, Toma, Patrik, Šimun, Leo, Gabriel, Vito,
  Lukas, Teo, Jan, Josip, Ante, Ivan, Marko, Luka, Nikola, Mateo, Dominik, Bruno, Borna, Tin, Duje, Marin, Antonio, Ivo, Mislav, Stjepan,
  Toni, Kristijan, Dino, Domagoj, Hrvoje, Igor, Krešimir, Matija, Mario, Dario, Damir, Vedran, Tomislav, Zvonimir, Nino, Ivano, Robert,
  Valentino, Adrian, Andro, Bartol, Benjamin, Dorian, Emanuel, Erik, Frane, Grgur, Jure, Kruno, Lovre, Marijan, Martin, Matias, Mate,
  Nikolas, Rafael, Tvrtko, Vid, Adam, Alen, Andrija, Anton, Antun, Bernard,
  Branimir, Davor, Dragan, Dražen, Fabijan, Franko, Ilija, Ivica, Ivor, Jerko, Joško, Jozo, Juraj, Krunoslav, Lucijan, Mihovil, Neven, Ozren,
  Paško, Rok, Siniša, Silvio, Slaven, Tomo, Tonći, Vjekoslav, Vlatko, Zlatko, Zoran, Željko`);
const HR_E2000 = w(`Luka, David, Jakov, Ivan, Petar, Filip, Mateo, Leon, Roko, Marko, Josip, Karlo, Fran, Lovro, Noa, Toma, Matej, Mihael, Niko,
  Ante, Šimun, Gabriel, Vito, Teo, Leo, Lukas, Jan, Borna, Tin, Duje, Marin, Bruno, Dominik, Patrik, Nikola, Antonio, Mislav, Viktor, Vid,
  Grgur, Bartol, Andro, Frane, Lovre, Mate, Emanuel, Adrian, Rafael, Liam, Oliver, Tomislav, Toni, Ivano, Kristijan, Matija, Jure, Marijan,
  Nino, Erik, Martin, Domagoj, Zvonimir, Krešimir, Stjepan, Benjamin, Dorian, Matias, Pavao, Šime, Krsto, Nikolas, Lorenzo,
  Oskar, Maks, Fabijan, Lucijan, Mak, Tomo, Dujam, Ilija, Andrija, Ivor, Juraj, Franko, Mauro, Sebastijan, Dino, Hrvoje, Igor, Dario, Mario,
  Kristian, Davor, Mihovil, Rok, Ian`);
const SR_E0 = w(`Aleksandar, Bogdan, Branislav, Branko, Dragoljub, Dragomir, Dragoslav, Đorđe, Ilija, Jovan, Ljubomir, Milivoje, Milorad, Milovan,
  Miroslav, Momir, Nebojša, Nenad, Petar, Radomir, Radoslav, Rajko, Ranko, Srboljub, Sreten, Svetozar, Tihomir, Velimir, Vlastimir, Vojislav,
  Zoran, Živko, Dobrivoje, Bratislav, Dragiša, Duško, Đura, Jovica, Milenko, Mirko, Mladen, Novica, Obrad, Ostoja, Radiša, Sava, Stanko,
  Stojan, Todor, Vasilije, Veselin, Vidoje, Vukašin, Zdravko, Željko, Dragan, Božidar, Miloje, Miodrag, Nikola, Predrag, Slobodan, Spasoje,
  Stevan, Uroš, Vladan, Vladimir, Milutin, Branimir, Budimir, Desimir, Milisav, Miomir, Nedeljko, Vojin, Zlatko, Lazar, Marko, Milan`);
const SR_E1980 = w(`Đorđe, Mihailo, Vuk, Petar, Pavle, Nikola, Lazar, Luka, Stefan, Aleksa, Andrej, Bogdan, Dimitrije, Jovan, Matija, Ognjen, Relja,
  Uroš, Veljko, Vukašin, Milan, Miloš, Marko, Filip, Nemanja, Aleksandar, Dušan, Ivan, Vladimir, Strahinja, Andrija, Vanja, Dejan, Darko,
  Bojan, Igor, Nenad, Srđan, Saša, Goran, Vladan, Danilo, David, Dragan, Branislav, Zoran, Milutin, Mladen, Predrag, Radomir, Slobodan,
  Željko, Viktor, Ljubomir, Marjan, Mirko, Mitar, Momčilo, Nebojša, Novak, Rastko, Sava, Simeon, Spasoje, Teodor, Tomislav, Vasilije,
  Vojin, Zdravko, Đurađ, Božidar, Kosta, Milovan, Branko, Dalibor, Danijel,
  Gordan, Ivica, Jovica, Milenko, Miljan, Miroslav, Radoslav, Slaviša, Stanislav, Velibor, Vladica, Žarko, Zlatko, Zvonko, Boško, Bratislav,
  Dragiša, Ljubiša, Milorad, Miodrag, Perica, Siniša`);
const SR_E2000 = w(`Luka, Stefan, Lazar, Nikola, Vuk, Petar, Aleksa, Đorđe, Mihailo, Pavle, Dimitrije, Matija, Uroš, Filip, Marko, Andrej, Vukašin,
  Jovan, Bogdan, Ognjen, Relja, Strahinja, Veljko, Milan, Miloš, Nemanja, Danilo, David, Aleksandar, Dušan, Kosta, Teodor, Vasilije,
  Andrija, Sava, Simeon, Rastko, Mateja, Lav, Viktor, Arsenije, Jakov, Despot, Novak, Nikolaj, Vojin, Vladimir, Ivan, Mitar, Tadija,
  Damjan, Gavrilo, Konstantin, Kristijan, Lazar, Nebojša, Đurađ, Adam, Leon, Mihajlo, Momčilo, Todor, Uglješa, Igor,
  Zoran, Darko, Ilija, Vid, Milutin, Stevan, Mladen, Sergej, Emilijan, Maksim, Aleksej, Zarije, Matej,
  Vukan, Vladan, Danijel, Srđan, Boris`);

// --- Familien aus Jugoslawien in Deutschland -----------------------------------------
const GYU_LAST = u(YU_CRO.slice(0, 45), YU_BIH.slice(0, 35), YU_SRB.slice(0, 30), YU_SLO.slice(0, 10), YU_MAZ.slice(0, 6), YU_KOS.slice(0, 8));
const GYU_E0 = w(`Stjepan, Franjo, Ante, Josip, Ivan, Mate, Marijan, Zdravko, Mladen, Branko, Dragan, Milan, Slobodan, Miroslav, Zoran, Goran,
  Nenad, Predrag, Dušan, Petar, Nikola, Ljubomir, Hasan, Mustafa, Muhamed, Enver, Safet, Fikret, Senad, Samir, Mirsad, Hamdija, Janez,
  Franc, Jože, Ilija, Željko, Damir, Darko, Dražen, Davor, Krešimir, Tomislav, Igor, Vlado, Rade, Mirko, Mile, Nihad, Elvir, Jasmin, Vinko,
  Andrija, Ivica, Boris, Dejan`);
const GYU_E1990 = w(`Marko, Luka, Ivan, Dario, Mario, Denis, Daniel, Kevin, Dominik, Patrick, Marcel, Robert, Antonio, Kristijan, Nikola, Stefan,
  Aleksandar, Miloš, Nemanja, Lazar, Dejan, Goran, Edin, Emir, Haris, Admir, Armin, Kenan, Mirza, Tarik, Elvis, Elvir, Senad, Samir, Adnan,
  Amir, Damir, Mateo, Josip, Tomislav, Ante, Marin, Filip, Toni, Dino, Alen, Igor, Sven, Michael, Christian, Sebastian, Alexander, Benjamin,
  Andrej, David, Leon`);
const GYU_E2005 = w(`Luka, David, Leon, Noah, Elias, Ben, Jonas, Finn, Paul, Gabriel, Mateo, Filip, Petar, Jakov, Ivan, Marko, Josip, Lukas, Nikola,
  Stefan, Lazar, Vuk, Aleksa, Đorđe, Mihailo, Emir, Amar, Adin, Hamza, Tarik, Kerim, Imran, Eldin, Anel, Dino, Toni, Fabian, Noel, Liam, Mika,
  Theo, Leo, Emil, Julian, Matej, Jan, Roko, Fran, Teo, Karlo, Niko, Anton, Milan, Ilija, Danijel`);

export const XL4_SOUTH2: Record<string, XLNames> = {
  pol: { last: PL_ALL, eras: [[0, PL_E0], [1960, PL_E1960], [1980, PL_E1980], [1998, PL_E1998], [2010, PL_E2010]] },
  ger_pl: { last: GPL_LAST, eras: [[0, GPL_E0], [1988, GPL_E1988], [2003, GPL_E2003]] },
  cze: { last: CZ_ALL, eras: [[0, CZ_E0], [1965, CZ_E1965], [1988, CZ_E1988]] },
  hun: { last: HU_ALL, eras: [[0, HU_E0], [1965, HU_E1965], [1988, HU_E1988], [2005, HU_E2005]] },
  rus: { last: u(SU_RUS, SU_UKR_BY, SU_SOUTH, SU_BALT), eras: [[0, SU_E0], [1965, SU_E1965], [1988, SU_E1988], [2005, SU_E2005]] },
  yug: { last: u(YU_SRB, YU_CRO, YU_BIH, YU_SLO, YU_MAZ, YU_MNE, YU_KOS), eras: [[0, YU_E0], [1960, YU_E1960], [1970, YU_E1970]] },
  cro: { last: HR_LAST, eras: [[0, HR_E0], [1980, HR_E1980], [2000, HR_E2000]] },
  srb: { last: SR_LAST, eras: [[0, SR_E0], [1980, SR_E1980], [2000, SR_E2000]] },
  ger_yu: { last: GYU_LAST, eras: [[0, GYU_E0], [1990, GYU_E1990], [2005, GYU_E2005]] },
};
