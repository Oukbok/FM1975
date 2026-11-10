// =============================================================================
// Namenspools, dritte Stufe (Wunsch Pascal: deutlich mehr Namen für die
// Zufallserzeugung – mit dem Weltpool laufen zehntausende Spieler gleichzeitig).
// Nur häufige, generische Vor- und Nachnamen des jeweiligen Landes; Paare
// entstehen zufällig, bekannte reale Paare sperrt BLOCKED_NAMES (namePools.ts).
// Eingemischt in data/origins.ts ohne Dubletten (bestehende Namen bleiben).
// =============================================================================

const w = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export const MORE_NAMES: Record<string, { first?: string[]; last?: string[] }> = {
  ger: {
    last: w(`Ackermann, Adam, Albers, Altmann, Ahrens, Arndt, Bach, Bader, Barth, Bartels, Baumgartner, Behrens, Beier, Benz, Bernhardt, Beyer, Bischoff, Blum, Bock, Bode, Bohn, Brand, Brauer, Bremer, Buchholz, Burger, Büttner, Christ, Conrad, Decker, Diehl, Dietz, Dittrich, Döring, Dreher, Eichhorn, Ernst, Esser, Falk, Fink, Fischer, Fleischer, Frey, Fritz, Gerlach, Giese, Glaser, Göbel, Götz, Gottschalk, Grimm, Gruber, Haag, Hagen, Haller, Hammer, Hansen, Harms, Hauser, Heck, Heil, Held, Henke, Hentschel, Heß, Hildebrandt, Hinz, Hirsch, Hoff, Hofer, Holz, Hübner, Imhof, Jacob, Jahn, John, Jordan, Junker, Kaufmann, Kern, Kessler, Kirchner, Kluge, Knoll, Kolb, Konrad, Kopp, Kraus, Kremer, Kunz, Lang, Lindner, Lorenz, Ludwig, Maier, Martens, Marx, Matthes, Merkel, Michel, Mohr, Moritz, Nagel, Nolte, Oswald, Otto, Paul, Petersen, Pfeiffer, Pieper, Popp, Rapp, Reich, Reinhardt, Reuter, Riedel, Ritter, Roth, Rudolph, Sauer, Schade, Schäfer, Scheller, Schenk, Schilling, Schlegel, Schmitz, Schott, Schreiber, Schubert, Schuster, Seifert, Simon, Sommer, Stahl, Stark, Stein, Steiner, Stephan, Strauß, Thiel, Thomas, Ulrich, Vetter, Vogel, Voigt, Wagner, Walther, Weiß, Wendt, Wenzel, Wiese, Wild, Winkler, Winter, Witt, Wolff, Ziegler, Zimmer`),
  },
  ger_modern: {
    last: w(`Ackermann, Arndt, Barth, Beck, Behrens, Beyer, Bischoff, Brinkmann, Buchholz, Decker, Dietz, Döring, Eckert, Ernst, Falk, Fink, Frey, Friedrich, Gerlach, Götz, Grimm, Hansen, Heinze, Hübner, Kessler, Kern, Kirchner, Kühn, Lang, Lindner, Lorenz, Ludwig, Maier, Martin, Marx, Möller, Nagel, Otto, Pfeiffer, Pohl, Reuter, Roth, Sauer, Schäfer, Schubert, Schumacher, Schuster, Seidel, Simon, Sommer, Stein, Thiel, Vogel, Voigt, Walter, Weiß, Wendt, Winkler, Winter, Ziegler`),
  },
  ger_ost: {
    first: w(`Andreas, Bernd, Detlef, Dirk, Frank, Gerd, Hans-Jürgen, Heiko, Holger, Jens, Jörg, Karsten, Lutz, Matthias, Olaf, Peter, Rainer, Ralf, René, Ronny, Sven, Thomas, Torsten, Ulf, Uwe, Volker, Wolfgang`),
    last: w(`Albrecht, Arnold, Bär, Böhme, Fiedler, Franke, Friedrich, Fuchs, Günther, Hahn, Heinrich, Hentschel, Herrmann, Kaiser, Kluge, Köhler, Krause, Kretschmer, Kühn, Lange, Lehmann, Lorenz, Ludwig, Meier, Möbius, Nitsche, Pietsch, Reichelt, Richter, Riedel, Schreiber, Schröter, Schulze, Seidel, Sommer, Thiele, Vogel, Voigt, Walther, Werner, Wolf, Ziegler, Zimmermann`),
  },
  ger_tr: {
    first: w(`Abdullah, Arda, Berkay, Çağlar, Efe, Emir, Enes, Furkan, Halil, Hakan, İbrahim, Kemal, Levent, Mahmut, Melih, Oğuz, Ömer, Ozan, Recep, Selim, Sinan, Tarık, Tuncay, Uğur, Yasin`),
    last: w(`Acar, Akın, Aksoy, Altun, Avcı, Bayram, Bulut, Coşkun, Duman, Ekinci, Erdoğan, Eren, Güler, Güneş, Işık, Kahraman, Karaca, Keskin, Korkmaz, Kurt, Özer, Sarı, Tekin, Tunç, Uçar, Ünal, Yavuz, Yüksel, Zengin`),
  },
  ger_af: {
    first: w(`Aaron, Christopher, Dominic, Eric, Gideon, Isaac, Jonas, Kenneth, Leroy, Marvin, Michael, Nathan, Oliver, Raphael, Tim, Timothy`),
    last: w(`Acheampong, Addai, Agyemang, Ampofo, Annan, Antwi, Appiah, Baffour, Boakye, Danso, Frimpong, Gyamfi, Konaté, Kwarteng, Nwosu, Obeng, Okonkwo, Opoku, Osei, Sarpong, Sow, Touré`),
  },
  ger_pl: {
    first: w(`Andrzej, Bartosz, Damian, Grzegorz, Łukasz, Marcin, Michał, Paweł, Rafał, Robert, Tomasz, Wojciech`),
    last: w(`Adamski, Baran, Bielecki, Czarnecki, Górski, Grabowski, Jabłoński, Kaczmarek, Krawczyk, Kubiak, Lis, Majewski, Mazur, Michalski, Nowicki, Olszewski, Pawlak, Pietrzak, Sikora, Sobczak, Wieczorek, Wróbel`),
  },
  ger_it: {
    first: w(`Alessandro, Andrea, Antonio, Daniele, Davide, Fabio, Francesco, Giuseppe, Luca, Marco, Mario, Massimo, Matteo, Paolo, Roberto, Salvatore, Stefano, Vincenzo`),
  },
  ger_yu: {
    first: w(`Aleksandar, Branko, Dario, Dejan, Goran, Ivan, Ivica, Marko, Milan, Mirko, Nenad, Petar, Predrag, Zoran`),
  },
  aut: {
    first: w(`Alexander, Bernhard, Daniel, Dominik, Erich, Ernst, Fabian, Georg, Günther, Hannes, Harald, Heinz, Helmut, Josef, Jürgen, Karl, Kurt, Leopold, Manuel, Mario, Matthias, Max, Patrick, Paul, Philipp, Reinhard, René, Sebastian, Simon, Wolfgang`),
    last: w(`Aigner, Auer, Bauer, Binder, Brunner, Eder, Egger, Fischer, Friedl, Gartner, Graf, Haas, Hackl, Haider, Hofbauer, Holzer, Huber, Kainz, Koller, Kofler, Kopp, Kraus, Lackner, Lang, Lechner, Lehner, Maier, Mayr, Moser, Müller, Neubauer, Pfeifer, Pichler, Plank, Pölzl, Prinz, Reiter, Riegler, Schmid, Schneider, Schober, Schwarz, Seidl, Stadler, Steiner, Strasser, Trummer, Unger, Wallner, Weber, Weiss, Wieser, Wimmer, Winkler, Wolf, Zach`),
  },
  sui: {
    first: w(`Adrian, Andreas, Christian, Dario, David, Fabian, Florian, Gian, Hans, Jonas, Kevin, Lars, Luca, Manuel, Martin, Michael, Nico, Patrick, Pascal, Peter, Philipp, Raphael, Roman, Silvan, Thomas, Yann`),
    last: w(`Ammann, Bachmann, Bader, Baumgartner, Bieri, Bösch, Bühler, Egli, Fässler, Fischer, Frey, Gasser, Gisler, Grob, Hess, Hofmann, Huber, Kälin, Kaufmann, Koch, Kunz, Lehmann, Lüthi, Marti, Meyer, Moser, Müller, Rüegg, Schär, Schmid, Schneider, Sommer, Stalder, Steiner, Suter, Vogel, Wälti, Weber, Wenger, Wyss, Zimmermann, Zbinden`),
  },
  ned: {
    first: w(`Arie, Bart, Bas, Bert, Cor, Daan, Dennis, Erik, Gerrit, Hans, Henk, Jaap, Jasper, Jeroen, Joost, Kees, Klaas, Lars, Martijn, Niels, Patrick, Rick, Rob, Roy, Sander, Stefan, Theo, Thijs, Tim, Wesley, Wim, Wout`),
    last: w(`Aarts, van Beek, Bosman, Brouwer, Dekker, Dijkstra, van Dam, van der Heijden, van der Linden, van Dongen, Groot, Hendriks, Hoekstra, Huisman, Jacobs, de Graaf, de Groot, de Haan, de Wit, Kok, Koster, Kramer, van Leeuwen, Maas, Mertens, Peters, Post, Prins, Schouten, Smits, van der Meer, van der Veen, van Vliet, Verbeek, Verhoeven, Vos, Vermeulen, Willems, Wouters, Zwart`),
  },
  bel: {
    first: w(`Axel, Bart, Bram, Christophe, Dirk, Dries, Eden, Filip, Frank, Geert, Gert, Hans, Jan, Jelle, Jens, Jonas, Koen, Kevin, Luc, Marc, Michel, Nico, Olivier, Pieter, Sam, Stijn, Thomas, Tom, Wim, Yves`),
    last: w(`Aerts, Claes, Claessens, Cools, De Backer, De Clercq, De Smet, Declercq, Dubois, Dupont, Goossens, Hermans, Jacobs, Janssens, Lambert, Lemaire, Maes, Martens, Mertens, Michiels, Peeters, Renard, Simon, Smets, Thys, Van Damme, Van de Velde, Vandenberghe, Verhaegen, Vermeulen, Willems, Wouters`),
  },
  den: {
    first: w(`Anders, Bent, Bo, Brian, Carsten, Christian, Claus, Flemming, Frank, Henrik, Jacob, Jan, Jens, Jesper, John, Kasper, Kim, Lars, Martin, Morten, Niels, Ole, Peter, Poul, Rasmus, Søren, Thomas, Torben`),
    last: w(`Andersen, Bach, Berg, Christensen, Christiansen, Dahl, Eriksen, Frederiksen, Hansen, Holm, Jakobsen, Jensen, Jeppesen, Johansen, Jørgensen, Knudsen, Kristensen, Larsen, Lund, Madsen, Mikkelsen, Møller, Mortensen, Nielsen, Olsen, Pedersen, Petersen, Poulsen, Rasmussen, Schmidt, Sørensen, Thomsen, Vestergaard`),
  },
  swe: {
    first: w(`Anders, Björn, Daniel, Erik, Fredrik, Gustav, Henrik, Johan, Jonas, Kim, Lars, Magnus, Mattias, Mikael, Niklas, Olof, Patrik, Per, Peter, Robin, Sebastian, Stefan, Thomas, Tobias, Viktor`),
    last: w(`Andersson, Axelsson, Bengtsson, Berg, Berglund, Björk, Carlsson, Ekström, Eriksson, Gustafsson, Hansson, Holm, Isaksson, Jakobsson, Johansson, Jonsson, Karlsson, Larsson, Lind, Lindberg, Lindgren, Lundberg, Lundqvist, Magnusson, Nilsson, Nyström, Olsson, Persson, Pettersson, Sandberg, Sjöberg, Svensson, Wallin`),
  },
  nor: {
    first: w(`Anders, Bjørn, Espen, Even, Fredrik, Geir, Håkon, Harald, Jan, Jørgen, Kjetil, Kristian, Lars, Magnus, Martin, Morten, Ole, Petter, Rune, Sander, Sigurd, Stian, Thomas, Tor, Trond, Vegard`),
    last: w(`Aas, Andersen, Bakke, Berg, Berntsen, Dahl, Eide, Eriksen, Fredriksen, Haugen, Hagen, Halvorsen, Hansen, Jacobsen, Johansen, Johnsen, Karlsen, Kristiansen, Larsen, Lie, Lund, Moen, Nilsen, Olsen, Pedersen, Solberg, Strand, Sæther, Tveit, Vik`),
  },
  yug: {
    first: w(`Aleksandar, Božidar, Branko, Dragan, Dušan, Goran, Ivica, Josip, Ljubomir, Milan, Miloš, Mirko, Nebojša, Nikola, Petar, Predrag, Radomir, Slobodan, Srečko, Vladimir, Zlatko, Zoran`),
    last: w(`Babić, Bogdanović, Đorđević, Ilić, Janković, Jovanović, Kostić, Kovačević, Lukić, Marić, Marković, Mihajlović, Milošević, Nikolić, Pavlović, Perić, Petrović, Popović, Radić, Simić, Stanković, Stojanović, Tomić, Vasić, Vuković, Živković`),
  },
  cro: {
    first: w(`Ante, Antonio, Boris, Damir, Dario, Davor, Domagoj, Filip, Goran, Igor, Ivan, Ivica, Josip, Krunoslav, Luka, Marin, Mario, Marko, Mateo, Nikola, Robert, Stipe, Tomislav, Vedran, Zoran`),
    last: w(`Babić, Barić, Bašić, Blažević, Bošnjak, Brkić, Grgić, Horvat, Jurić, Knežević, Kovač, Kovačić, Lovrić, Marić, Marković, Matić, Novak, Pavić, Perić, Petrović, Radić, Šarić, Tomić, Vidović, Vuković`),
  },
  srb: {
    first: w(`Aleksandar, Bojan, Darko, Dejan, Dušan, Filip, Ivan, Lazar, Luka, Marko, Miloš, Nemanja, Nikola, Stefan, Uroš, Vladimir`),
    last: w(`Antić, Đurić, Ilić, Jovanović, Kostić, Lazić, Marković, Milenković, Mitrović, Nikolić, Pavlović, Petrović, Radovanović, Ristić, Savić, Stojanović, Tadić, Todorović, Vasić, Živković`),
  },
  pol: {
    first: w(`Adam, Andrzej, Artur, Bartosz, Dariusz, Grzegorz, Jacek, Jakub, Jan, Jerzy, Kamil, Krzysztof, Łukasz, Maciej, Marcin, Marek, Mariusz, Mateusz, Michał, Paweł, Piotr, Rafał, Robert, Ryszard, Stanisław, Tomasz, Wojciech, Zbigniew`),
    last: w(`Adamczyk, Baran, Błaszczyk, Chmielewski, Czarnecki, Dudek, Głowacki, Górski, Grabowski, Jabłoński, Jankowski, Kaczmarek, Kalinowski, Kowalczyk, Kozłowski, Krawczyk, Kubiak, Lewicki, Majewski, Malinowski, Mazur, Michalski, Nowicki, Olszewski, Pawlak, Pawłowski, Piątek, Sadowski, Sikora, Sobczak, Walczak, Wieczorek, Wróbel, Zając, Zawadzki`),
  },
  cze: {
    first: w(`Aleš, David, Filip, František, Jakub, Jan, Jaroslav, Jiří, Josef, Karel, Ladislav, Lukáš, Marek, Martin, Michal, Milan, Miroslav, Ondřej, Pavel, Petr, Radek, Roman, Tomáš, Václav, Vladimír, Zdeněk`),
    last: w(`Beneš, Bureš, Čermák, Doležal, Dvořák, Fiala, Hájek, Horák, Jelínek, Kolář, Kopecký, Král, Krejčí, Kučera, Marek, Navrátil, Němec, Novák, Novotný, Pokorný, Pospíšil, Procházka, Růžička, Sedláček, Svoboda, Urban, Vaněk, Veselý, Zeman`),
  },
  hun: {
    first: w(`András, Attila, Balázs, Béla, Csaba, Dániel, Ferenc, Gábor, György, István, János, József, Károly, Krisztián, László, Lajos, Miklós, Norbert, Péter, Roland, Sándor, Tamás, Zoltán`),
    last: w(`Balogh, Bognár, Farkas, Fekete, Fodor, Horváth, Juhász, Kelemen, Kiss, Kovács, Lakatos, Mészáros, Molnár, Nagy, Németh, Oláh, Papp, Pintér, Rácz, Simon, Somogyi, Szabó, Szalai, Szűcs, Takács, Tóth, Varga, Vincze`),
  },
  rus: {
    first: w(`Aleksandr, Aleksej, Anatolij, Andrej, Anton, Artjom, Boris, Denis, Dmitrij, Fjodor, Igor, Ilja, Iwan, Jewgeni, Juri, Kirill, Konstantin, Maxim, Michail, Nikolai, Oleg, Pawel, Roman, Sergej, Viktor, Vitali, Wladimir, Wjatscheslaw`),
    last: w(`Alexejew, Antonow, Below, Bogdanow, Fjodorow, Frolow, Gawrilow, Golowin, Iwanow, Jakowlew, Karpow, Kisseljow, Kowaljow, Kusnezow, Lebedew, Makarow, Medwedew, Morosow, Nikitin, Orlow, Pawlow, Petrow, Popow, Romanow, Semjonow, Sokolow, Solowjow, Stepanow, Tarassow, Wassiljew, Winogradow, Wolkow, Zaizew`),
  },
  ita: {
    first: w(`Alberto, Alessandro, Andrea, Angelo, Antonio, Carlo, Claudio, Daniele, Davide, Emanuele, Enrico, Fabio, Federico, Filippo, Francesco, Gabriele, Giacomo, Gianluca, Giorgio, Giovanni, Giuseppe, Lorenzo, Luca, Luigi, Marco, Mario, Massimo, Matteo, Mauro, Michele, Nicola, Paolo, Pietro, Riccardo, Roberto, Salvatore, Sergio, Simone, Stefano, Tommaso, Vincenzo`),
    last: w(`Amato, Barbieri, Bellini, Benedetti, Bernardi, Bianchi, Bruno, Caputo, Caruso, Colombo, Conte, Costa, D'Angelo, De Luca, De Santis, Esposito, Fabbri, Ferrara, Ferrari, Ferri, Fontana, Galli, Gallo, Gentile, Giordano, Greco, Grasso, Leone, Lombardi, Longo, Mancini, Marchetti, Marino, Martini, Mazza, Monti, Moretti, Morelli, Neri, Orlando, Palumbo, Parisi, Pellegrini, Rinaldi, Rizzo, Romano, Rossetti, Russo, Sala, Santoro, Serra, Silvestri, Testa, Valentini, Villa, Vitale`),
  },
  esp: {
    first: w(`Adrián, Alberto, Alejandro, Álvaro, Andrés, Ángel, Antonio, Carlos, César, Daniel, David, Diego, Enrique, Fernando, Francisco, Gonzalo, Guillermo, Ignacio, Iker, Javier, Jesús, Jorge, José, Juan, Luis, Manuel, Marcos, Mario, Miguel, Óscar, Pablo, Pedro, Rafael, Ramón, Raúl, Roberto, Rubén, Santiago, Sergio, Víctor`),
    last: w(`Alonso, Álvarez, Blanco, Cabrera, Calvo, Campos, Cano, Castillo, Castro, Cortés, Delgado, Díaz, Domínguez, Fernández, Flores, Garrido, Gil, Gómez, González, Gutiérrez, Herrera, Iglesias, Jiménez, León, López, Lozano, Marín, Martín, Martínez, Medina, Molina, Morales, Moreno, Muñoz, Navarro, Núñez, Ortega, Ortiz, Pascual, Peña, Pérez, Prieto, Ramírez, Ramos, Reyes, Rodríguez, Romero, Rubio, Ruiz, Sánchez, Santos, Sanz, Serrano, Suárez, Torres, Vázquez, Vega`),
  },
  por: {
    first: w(`Abel, Álvaro, André, António, Bruno, Carlos, Daniel, Diogo, Duarte, Fábio, Fernando, Filipe, Francisco, Gonçalo, Hélder, Hugo, João, Joaquim, Jorge, José, Luís, Manuel, Mário, Miguel, Nuno, Paulo, Pedro, Ricardo, Rui, Sérgio, Tiago, Vítor`),
    last: w(`Almeida, Alves, Antunes, Barbosa, Batista, Cardoso, Carvalho, Correia, Costa, Cruz, Dias, Faria, Fernandes, Ferreira, Fonseca, Gomes, Gonçalves, Lopes, Machado, Marques, Martins, Mendes, Monteiro, Moreira, Nunes, Oliveira, Pereira, Pinto, Ramos, Reis, Ribeiro, Rodrigues, Santos, Silva, Sousa, Teixeira, Vieira`),
  },
  fra: {
    first: w(`Adrien, Alain, Alexandre, Antoine, Arnaud, Benoît, Bernard, Bruno, Cédric, Christophe, Clément, Damien, David, Didier, Éric, Fabien, Florian, François, Frédéric, Guillaume, Hugo, Jean, Jérôme, Julien, Laurent, Louis, Lucas, Marc, Mathieu, Maxime, Michel, Nicolas, Olivier, Pascal, Patrick, Philippe, Pierre, Romain, Sébastien, Stéphane, Thierry, Thomas, Vincent, Yann`),
    last: w(`André, Arnaud, Bertrand, Blanc, Bonnet, Bourgeois, Boyer, Brun, Chevalier, Clément, Dubois, Dufour, Dumas, Dupont, Durand, Fabre, Fournier, Gaillard, Garnier, Gautier, Girard, Guerin, Henry, Lambert, Laurent, Leclerc, Lefebvre, Legrand, Lemaire, Leroy, Martin, Masson, Mathieu, Mercier, Michel, Moreau, Morel, Muller, Noël, Perrin, Petit, Picard, Renaud, Richard, Robert, Robin, Roche, Rousseau, Roux, Simon, Thomas, Vincent`),
  },
  fra_af: {
    first: w(`Abdou, Adama, Alassane, Amadou, Bakary, Boubacar, Cheikh, Djibril, Ibrahima, Issa, Lamine, Mamadou, Mohamed, Moussa, Ousmane, Samba, Seydou, Souleymane, Yacine, Youssouf`),
    last: w(`Bamba, Camara, Cissé, Coulibaly, Diaby, Diakité, Diallo, Diarra, Diop, Doumbia, Fofana, Gueye, Kanté, Keita, Koné, Konaté, Mendy, N'Diaye, Sakho, Sangaré, Sarr, Sissoko, Sow, Sylla, Touré, Traoré`),
  },
  eng: {
    first: w(`Adam, Alan, Andrew, Anthony, Ben, Brian, Callum, Carl, Charlie, Chris, Craig, Daniel, Darren, Dave, Dean, Ed, Gary, George, Graham, Harry, Ian, Jack, Jake, James, Jamie, Joe, John, Jordan, Keith, Kevin, Lee, Liam, Luke, Mark, Martin, Matt, Michael, Neil, Nick, Paul, Peter, Phil, Rob, Ryan, Sam, Scott, Simon, Steve, Stuart, Terry, Tom, Tony, Wayne`),
    last: w(`Adams, Allen, Atkinson, Bailey, Baker, Barker, Barnes, Bell, Bennett, Brooks, Brown, Butler, Carter, Chapman, Clarke, Collins, Cook, Cooper, Cox, Davies, Dixon, Edwards, Ellis, Evans, Fisher, Foster, Gibson, Graham, Green, Hall, Harris, Harrison, Hill, Holmes, Hughes, Hunt, Jackson, James, Johnson, Jones, Kelly, King, Knight, Lewis, Marshall, Mason, Matthews, Mills, Mitchell, Moore, Morris, Murphy, Palmer, Parker, Phillips, Price, Richards, Roberts, Robinson, Rogers, Russell, Shaw, Simpson, Smith, Stevens, Taylor, Thomas, Thompson, Turner, Walker, Ward, Watson, White, Wilkinson, Williams, Wood, Wright, Young`),
  },
  sco: {
    first: w(`Alan, Alex, Alistair, Andy, Barry, Billy, Callum, Colin, Craig, David, Derek, Douglas, Duncan, Euan, Fraser, Gordon, Graeme, Hamish, Iain, Jamie, John, Kenny, Kyle, Lewis, Malcolm, Ross, Scott, Stuart, Willie`),
    last: w(`Anderson, Boyd, Brown, Cameron, Campbell, Craig, Crawford, Duncan, Ferguson, Fraser, Gordon, Graham, Grant, Hamilton, Henderson, Hunter, Johnston, Kerr, MacDonald, MacKenzie, MacLeod, Martin, McGregor, McKay, McLean, Miller, Mitchell, Murray, Paterson, Reid, Robertson, Ross, Scott, Simpson, Smith, Stewart, Thomson, Wallace, Watson, Wilson, Young`),
  },
  tur: {
    first: w(`Ahmet, Ali, Arda, Burak, Can, Caner, Cenk, Emre, Engin, Ercan, Erdem, Fatih, Gökhan, Hakan, Hasan, İlhan, Kaan, Kerem, Mehmet, Murat, Mustafa, Okan, Ömer, Onur, Ozan, Selçuk, Serdar, Sinan, Tolga, Tuncay, Uğur, Volkan, Yusuf`),
    last: w(`Acar, Akgül, Aksoy, Arslan, Aslan, Avcı, Aydın, Bulut, Çakır, Çelik, Çetin, Demir, Doğan, Erdem, Eren, Güler, Güneş, Kaplan, Kara, Kaya, Keskin, Kılıç, Koç, Korkmaz, Kurt, Özdemir, Öztürk, Polat, Şahin, Şen, Tekin, Turan, Yavuz, Yıldırım, Yıldız, Yılmaz, Yücel`),
  },
  gre: {
    first: w(`Alexandros, Andreas, Antonis, Christos, Dimitris, Georgios, Giannis, Ilias, Konstantinos, Kostas, Lefteris, Manolis, Michalis, Nikos, Panagiotis, Pantelis, Petros, Sotiris, Spyros, Stelios, Thanasis, Theodoros, Vasilis, Vangelis`),
    last: w(`Alexiou, Angelopoulos, Antoniou, Dimitriou, Georgiou, Ioannou, Karagiannis, Konstantinou, Kotsis, Makris, Michailidis, Nikolaidis, Oikonomou, Panagiotou, Papadakis, Papadopoulos, Papageorgiou, Pappas, Petridis, Stavrou, Theodorou, Triantafyllou, Vlachos, Zografos`),
  },
  bra: {
    first: w(`Adriano, Alex, Anderson, André, Bruno, Caio, Carlos, Cláudio, Daniel, Diego, Douglas, Eduardo, Fábio, Felipe, Fernando, Gabriel, Gustavo, Henrique, Igor, João, Jorge, José, Júlio, Leandro, Lucas, Luiz, Marcelo, Marcos, Matheus, Paulo, Pedro, Rafael, Renato, Ricardo, Roberto, Rodrigo, Thiago, Vinícius, Wagner, Wellington`),
    last: w(`Almeida, Alves, Araújo, Barbosa, Barros, Batista, Borges, Cardoso, Carvalho, Castro, Costa, Cunha, Dias, Duarte, Farias, Fernandes, Ferreira, Freitas, Gomes, Gonçalves, Lima, Lopes, Machado, Martins, Melo, Mendes, Miranda, Monteiro, Moraes, Moreira, Nascimento, Nunes, Oliveira, Pereira, Pinto, Ramos, Reis, Ribeiro, Rocha, Rodrigues, Santana, Santos, Silva, Soares, Souza, Teixeira, Vieira`),
  },
  arg: {
    first: w(`Agustín, Alejandro, Ariel, Carlos, Claudio, Cristian, Daniel, Darío, Diego, Esteban, Ezequiel, Facundo, Federico, Fernando, Franco, Gastón, Gonzalo, Guillermo, Hernán, Javier, Jorge, Juan, Leandro, Lucas, Luciano, Marcelo, Martín, Matías, Maximiliano, Nicolás, Pablo, Ricardo, Rodrigo, Sebastián, Sergio, Walter`),
    last: w(`Acosta, Aguirre, Álvarez, Benítez, Cabrera, Castro, Díaz, Domínguez, Fernández, Flores, Giménez, Gómez, González, Gutiérrez, Herrera, Juárez, López, Medina, Molina, Morales, Moreno, Ortiz, Pereyra, Pérez, Ramírez, Ríos, Rodríguez, Rojas, Romero, Ruiz, Sánchez, Silva, Sosa, Suárez, Torres, Vega, Villalba`),
  },
  gha: {
    first: w(`Abdul, Albert, Daniel, David, Ebenezer, Emmanuel, Enoch, Eric, Felix, Francis, Godfred, Isaac, Jonathan, Joseph, Kofi, Kwabena, Kwadwo, Kwame, Kwasi, Michael, Prince, Richard, Samuel, Thomas`),
    last: w(`Acheampong, Addo, Adjei, Agyeman, Amoako, Ampofo, Ansah, Appiah, Asamoah, Asante, Boakye, Bonsu, Danquah, Darko, Frimpong, Gyan, Mensah, Nkansah, Obeng, Ofori, Opoku, Osei, Owusu, Sarpong, Tetteh, Yeboah`),
  },
  nga: {
    first: w(`Ahmed, Chidi, Chinedu, Daniel, Emeka, Emmanuel, Femi, Ibrahim, Ifeanyi, John, Kelechi, Musa, Nnamdi, Obinna, Olumide, Peter, Samuel, Segun, Tunde, Uche, Victor, Yusuf`),
    last: w(`Abiola, Adebayo, Adeleke, Adeyemi, Afolabi, Akinola, Balogun, Bello, Chukwu, Eze, Ibrahim, Igwe, Musa, Nwankwo, Nwosu, Obi, Odiah, Okafor, Okeke, Okonkwo, Okoro, Olawale, Onyeka, Usman`),
  },
  cmr: {
    first: w(`Alain, André, Benjamin, Christian, Éric, Eugène, François, Georges, Jacques, Jean, Joseph, Marc, Patrick, Paul, Pierre, Rigobert, Samuel, Serge, Stéphane, Vincent`),
    last: w(`Abanda, Ateba, Bassogog, Biyik, Ekotto, Essomba, Eyong, Fotso, Kameni, Makoun, Mbarga, Mbia, Mboma, Ndjeng, Ngoa, Njoh, Nkoulou, Onana, Owona, Tchami, Toko, Wome`),
  },
  mar: {
    first: w(`Abdelaziz, Achraf, Adil, Ahmed, Amine, Anas, Ayoub, Bilal, Driss, Hakim, Hamza, Hassan, Ismail, Karim, Khalid, Mehdi, Mohamed, Mounir, Mustapha, Nabil, Noureddine, Omar, Rachid, Said, Sofiane, Youssef, Zakaria`),
    last: w(`Alaoui, Amrani, Bakkali, Belhaj, Benali, Bennani, Berrada, Bouzidi, Chakir, Cherkaoui, El Amrani, El Idrissi, Fassi, Hajji, Idrissi, Kabbaj, Lahlou, Mansouri, Naciri, Ouazzani, Rami, Saidi, Tazi, Ziani`),
  },
  jpn: {
    first: w(`Daisuke, Daiki, Hideo, Hiroshi, Hiroki, Hayato, Junichi, Kazuki, Kenji, Kenta, Koji, Makoto, Masahiro, Naoki, Ryo, Ryota, Satoshi, Shinji, Shota, Takashi, Takumi, Taro, Tomoya, Tsubasa, Yuki, Yusuke, Yuto`),
    last: w(`Abe, Endo, Fujita, Fukuda, Goto, Hasegawa, Hayashi, Inoue, Ishii, Ito, Kato, Kimura, Kobayashi, Kondo, Maeda, Matsumoto, Mori, Murakami, Nakamura, Nakano, Ogawa, Okada, Saito, Sakamoto, Sasaki, Shimizu, Suzuki, Takahashi, Tanaka, Watanabe, Yamada, Yamamoto, Yoshida`),
  },
  kor: {
    first: w(`Byung-ho, Chang-min, Dae-jung, Dong-hyun, Hyun-woo, Ji-hoon, Ji-sung, Jin-woo, Jong-min, Joon-ho, Jun-young, Kyung-soo, Min-ho, Min-jae, Sang-woo, Seung-hyun, Sung-min, Tae-hyun, Woo-jin, Young-ho`),
    last: w(`Ahn, Bae, Cho, Choi, Chung, Han, Hong, Hwang, Jang, Jeon, Jung, Kang, Kim, Ko, Kwon, Lee, Lim, Moon, Nam, Oh, Park, Seo, Shin, Song, Yang, Yoo, Yoon`),
  },
  usa: {
    first: w(`Aaron, Alex, Andrew, Brad, Brandon, Brian, Chris, Cody, Dan, DeAndre, Eric, Greg, Jason, Jeff, Jesse, Jordan, Josh, Justin, Kyle, Landon, Mark, Matt, Mike, Nate, Ryan, Scott, Sean, Tim, Tyler, Zach`),
    last: w(`Anderson, Baker, Brooks, Brown, Campbell, Clark, Davis, Evans, Garcia, Green, Hall, Harris, Jackson, Johnson, Jones, Lewis, Martin, Miller, Moore, Nelson, Parker, Robinson, Smith, Taylor, Thomas, Thompson, Turner, Walker, White, Williams, Wilson, Wright`),
  },
};
