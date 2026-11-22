// =============================================================================
// Namenspools, vierte Stufe (Wunsch Pascal: Namen wiederholten sich zu oft –
// Pools je Land deutlich größer, Vornamen je Jahrzehnt, Namen der Ethnien im Land).
// Nur in der Bevölkerung häufige Vor- und Nachnamen (Ranglisten der häufigsten
// Familiennamen bzw. Jungennamen je Geburtsjahrzehnt; Quellen wie in
// data/nameEras.ts und docs/research/names.md). Keine Rücksicht auf Fußballer –
// Paare entstehen zufällig, bekannte reale Paare sperrt BLOCKED_NAMES.
// Eingemischt in data/origins.ts (`mergeXL`): Nachnamen/Grundvornamen ohne Dubletten,
// Vornamen je Jahrzehnt zusätzlich zu den vorhandenen Stufen (bestehende bleiben).
// Teil 1: Mittel-, West- und Nordeuropa + Namen der Einwanderer dort.
// =============================================================================

export const w = (s: string): string[] => s.split(',').map((x) => x.trim()).filter(Boolean);

/** Zusatz je Herkunft: Nachnamen, Grundvornamen, Vornamen ab Geburtsjahr. */
export interface XLNames { last?: string[]; first?: string[]; eras?: [number, string[]][] }

export const XL_WEST: Record<string, XLNames> = {
  ger: {
    last: w(`Albrecht, Alt, Aust, Baier, Balz, Bartsch, Bauch, Baumann, Beckmann, Berg, Berger, Biermann, Binder, Birk, Blank, Blume, Böhm, Bohle, Borchert, Born, Böttcher, Brandl, Brück, Brückner, Brunner, Buck, Bühler, Bürger, Busse, Clemens, Dahl, Dahms, Dörr, Drescher, Dürr, Ebert, Eckhardt, Eder, Ehlers, Eichler, Eggers, Elsner, Emmerich, Endres, Erdmann, Evers, Ewald, Feldmann, Fiedler, Fietz, Fischbach, Förster, Franke, Franz, Freitag, Fröhlich, Funk, Gabriel, Gärtner, Geiger, Geißler, Gerber, Gerhardt, Gläser, Graf, Greiner, Groß, Gruber, Günther, Haas, Hahn, Hampel, Hanke, Haupt, Heinemann, Heinrich, Heinz, Helbig, Hellwig, Henkel, Hennig, Herbst, Hermann, Hesse, Heuer, Hinrichs, Höfer, Hoffmeister, Holm, Horn, Huber, Hummel, Hunold, Jäger, Jakob, Janßen, Jung, Jürgens, Kaiser, Kamp, Karl, Kasper, Keil, Keller, Kemper, Kiefer, Kirsch, Klose, Knapp, Knorr, Köster, Krämer, Kranz, Kraft, Krebs, Kroll, Kuhlmann, Kunze, Kurz, Lammers, Landgraf, Lenz, Leonhardt, Liebig, Lindemann, Link, Lohmann, Löffler, Lutz, Mack, Mann, Marquardt, Mayer, Meißner, Menzel, Mertens, Metzger, Meurer, Mielke, Möbius, Mörs, Naumann, Neubauer, Niemann, Noack, Nowak, Oertel, Ott, Pape, Pfeifer, Philipp, Plath, Preuß, Probst, Rademacher, Rau, Rausch, Rehm, Reimann, Renner, Rieger, Rink, Rohde, Rose, Rösler, Rothe, Rupp, Sander, Schaaf, Scharf, Schick, Schlüter, Schmid, Schnell, Scholl, Schön, Schoppe, Schramm, Schrader, Schütz, Schütte, Schwab, Seeger, Siebert, Siegel, Specht, Speer, Sperling, Springer, Stadler, Steffen, Stoll, Strobel, Sturm, Thiele, Timm, Trautmann, Unger, Urban, Vogt, Volk, Voß, Wachter, Wahl, Weidner, Weigel, Weise, Wenk, Westphal, Wiedemann, Wilhelm, Will, Willms, Witte, Wittmann, Wolter, Wulf, Wunderlich, Zander, Zeller, Ziegler, Zink`),
    eras: [
      [0, w(`Adolf, Alois, Anton, Arno, August, Bruno, Edgar, Emil, Erhard, Ferdinand, Georg, Gottfried, Gustav, Hubert, Hugo, Josef, Konrad, Leo, Ludwig, Max, Oskar, Reinhold, Richard, Robert, Rudolf, Theo, Waldemar, Wilhelm, Willy, Johann`)],
      [1950, w(`Achim, Alfred, Bernhard, Christian, Egon, Erich, Friedhelm, Gerhard, Günther, Hans, Heinrich, Helmut, Hermann, Jochen, Josef, Karl, Konrad, Kurt, Ludger, Martin, Matthias, Michael, Paul, Reiner, Richard, Siegfried, Ulrich, Walter, Wilhelm, Winfried`)],
      [1960, w(`Achim, Alexander, Bernhard, Christoph, Detlef, Dieter, Gerd, Hans-Peter, Harald, Heiko, Helmut, Joachim, Karsten, Klaus-Dieter, Lothar, Manfred, Michael, Norbert, Peter, Reinhard, Rüdiger, Stephan, Thorsten, Ulrich, Volker, Werner, Wilfried, Hartmut, Udo, Bernd`)],
      [1970, w(`Achim, Andre, Axel, Benjamin, Boris, Carsten, Claus, David, Dennis, Erik, Florian, Guido, Hendrik, Jochen, Jörg, Lars, Lutz, Marc, Marcus, Mark, Maik, Michael, Mirko, Nils, Peter, Ralph, Robert, Rolf, Stephan, Steffen, Ulf, Volker`)],
      [1980, w(`Andre, Benedikt, Björn, Carsten, Christopher, Daniel, Dirk, Eike, Erik, Frank, Hendrik, Henning, Jens, Johannes, Jonas, Julian, Lars, Lukas, Manuel, Marc, Marvin, Matthias, Maximilian, Nils, Oliver, Pascal, Peter, Robert, Sven, Thorsten, Torben, Ole`)],
      [1990, w(`Adrian, Alexander, Andre, Benedikt, Benjamin, Bastian, Christopher, Dominik, Erik, Fabio, Hendrik, Jakob, Jannis, Joel, Jonathan, Kai, Kevin, Lennart, Lucas, Malte, Manuel, Marco, Markus, Mats, Mike, Nick, Nils, Ole, Oliver, Paul, Rene, Sascha, Thomas, Tom, Torben`)],
      [2000, w(`Aaron, Alexander, Anton, Arne, Bastian, Benedikt, Colin, Dominic, Emil, Eric, Fynn, Hannes, Henrik, Henry, Jakob, Jan-Luca, Jason, Joel, Johann, Jonah, Kilian, Lars, Lasse, Leonard, Levin, Louis, Lucas, Lukas, Marlon, Mattis, Mika, Milan, Nick, Ole, Oskar, Robin, Samuel, Tobias, Valentin, Vincent`)],
      [2010, w(`Aaron, Adam, Alexander, Arthur, Benjamin, Carl, Constantin, David, Emil, Erik, Fiete, Frederik, Hannes, Henri, Jan, Joel, Johann, Johannes, Jonah, Kian, Konstantin, Lasse, Leonard, Leopold, Lio, Louis, Lukas, Maximilian, Mattis, Mio, Nils, Oskar, Paul, Philipp, Rafael, Samuel, Tom, Valentin, Vincent, Ben`)],
    ],
  },
  ger_ost: {
    last: w(`Ahnert, Bachmann, Barthel, Baumgart, Beyer, Bittner, Blech, Brückner, Buschmann, Dietze, Döhler, Dressler, Ebert, Ehrlich, Enke, Fischer, Förster, Frenzel, Fritzsche, Gebauer, Geißler, Gerlach, Glöckner, Göpfert, Gottschalk, Graupner, Große, Grundmann, Haase, Hänel, Hartig, Hartwig, Haufe, Heinze, Hempel, Hennig, Hesse, Hofmann, Höhne, Hübner, Jahn, Jentsch, Junghanns, Kade, Keller, Kirsten, Klemm, Knobloch, Kranz, Kretzschmar, Kunert, Kunze, Kutschke, Lauterbach, Leonhardt, Liebscher, Linke, Löser, Mädler, Matthes, Mehnert, Melzer, Menzel, Mittag, Mücke, Müller, Naumann, Nestler, Neubert, Oehme, Opitz, Ott, Pfeifer, Pohl, Preußer, Queißer, Rabe, Reinhold, Rentsch, Richter, Rößler, Rudolph, Sachse, Schaarschmidt, Scheibe, Schindler, Schlegel, Schmidt, Schreiter, Schubert, Schuster, Seifert, Siegert, Starke, Stein, Tauber, Teichmann, Thieme, Ullrich, Unger, Viehweger, Walter, Weber, Weigelt, Weise, Wendler, Wetzel, Wilde, Wolff, Zacharias, Zenker, Zschoche, Bergmann, Baumann, Ehrhardt, Fröhlich, Haubold, Kießling, Kühne, Lorenz, Mauersberger, Nitzsche, Poppe, Räbiger, Schwalbe, Tietze, Uhlig, Wagner, Winkler, Wolf`),
    eras: [
      [0, w(`Gerhard, Günter, Heinz, Helmut, Herbert, Horst, Joachim, Karl-Heinz, Klaus, Kurt, Lothar, Manfred, Siegfried, Werner, Wolfgang, Dieter, Erich, Fritz, Gottfried, Harry, Rudolf, Rolf, Walter, Willi`)],
      [1960, w(`Andreas, Bernd, Detlef, Dietmar, Frank, Hans-Jürgen, Harald, Jürgen, Lutz, Matthias, Michael, Norbert, Olaf, Peter, Rainer, Ralf, Reinhard, Thomas, Uwe, Volker, Wolfgang, Gert, Hartmut, Steffen, Ulrich`)],
      [1970, w(`Andre, Carsten, Danilo, Dirk, Enrico, Heiko, Ingo, Jan, Jens, Jörg, Kai, Marco, Maik, Mario, Mike, Nico, René, Ronny, Sandro, Steffen, Sven, Thomas, Thoralf, Tino, Torsten, Silvio, Rico, Mirko`)],
      [1980, w(`Alexander, Christian, Daniel, Danny, Denny, Dennis, Eric, Kevin, Marcel, Martin, Matthias, Patrick, Paul, Philipp, Robert, Robin, Ronny, Sebastian, Stefan, Steve, Tobias, Tom, Toni, Benjamin, Felix, Tim`)],
      [1990, w(`Alexander, Christoph, Erik, Felix, Florian, Franz, Hannes, Jakob, Jonas, Julian, Justin, Kevin, Lukas, Max, Maximilian, Moritz, Niklas, Paul, Richard, Robert, Tim, Tom, Toni, Willy, Leon, Luca`)],
    ],
  },
  ger_modern: {
    last: w(`Albrecht, Bauer, Baumann, Beckmann, Berger, Böhm, Bohn, Brandt, Busch, Dietrich, Ebert, Engel, Fiedler, Fischer, Franke, Fuchs, Graf, Günther, Haas, Hahn, Heinrich, Hermann, Horn, Jäger, Jung, Kaiser, Keller, Klein, Kluge, Köhler, König, Kraft, Kramer, Krüger, Kuhn, Kunz, Lehmann, Lutz, Mayer, Meier, Menzel, Moser, Neubauer, Peters, Pfeifer, Rose, Sauer, Schmid, Schneider, Scholz, Schulte, Schultz, Seifert, Stahl, Thomas, Ullrich, Vogt, Weber, Weber, Wolf, Wolff, Zimmer`),
  },
  aut: {
    last: w(`Aigner, Auer, Bacher, Baumgartner, Binder, Brandstätter, Brunner, Buchner, Eder, Egger, Ebner, Ertl, Fischer, Fleischmann, Forster, Fritz, Gasser, Graf, Gruber, Haas, Haider, Hackl, Hammer, Hartl, Hauser, Heinz, Hinterberger, Hofbauer, Holzer, Horvath, Huber, Jäger, Kainz, Kaiser, Karner, Kaufmann, Kern, Klein, König, Koller, Köck, Kogler, Kraus, Kreuzer, Kurz, Lackner, Lang, Lechner, Lehner, Lindner, Lorenz, Maier, Mair, Moser, Müller, Neubauer, Oberhofer, Pammer, Pfeiffer, Pichler, Platzer, Pöll, Prinz, Rainer, Reiter, Riegler, Rieder, Schmid, Schneider, Schober, Schuster, Schwarz, Seidl, Strasser, Stadler, Steiner, Stocker, Strobl, Taferner, Unterberger, Wagner, Walder, Wallner, Weber, Weiß, Wieser, Wimmer, Winkler, Wolf, Zach, Zauner, Zechner, Ziegler, Zöhrer`),
    eras: [
      [0, w(`Alfred, Alois, Anton, Erich, Ernst, Friedrich, Gottfried, Hans, Heinrich, Helmut, Hermann, Karl, Kurt, Leopold, Ludwig, Otto, Rudolf, Wilhelm, Ferdinand, Ignaz`)],
      [1960, w(`Alexander, Christian, Dietmar, Erwin, Günther, Gerald, Hannes, Harald, Heinz, Kurt, Manfred, Martin, Michael, Peter, Reinhard, Roland, Thomas, Werner, Wolfgang, Gernot`)],
      [1978, w(`Andreas, Bernhard, Christoph, Daniel, Dominik, Florian, Georg, Gerald, Hannes, Jürgen, Klaus, Manuel, Mario, Martin, Matthias, Patrick, Philipp, Roman, Stefan, Wolfgang, René, Rene`)],
      [1995, w(`Alexander, Benjamin, Clemens, David, Elias, Fabian, Felix, Jakob, Jonas, Julian, Kilian, Leon, Lorenz, Lukas, Marcel, Matthias, Maximilian, Moritz, Nico, Niklas, Paul, Raphael, Sebastian, Simon, Tobias, Valentin, Noah, Luca`)],
    ],
  },
  sui: {
    last: w(`Ammann, Arnold, Bachmann, Bärtschi, Bauer, Baumgartner, Berger, Bieri, Blaser, Bosshard, Brunner, Bühler, Bürgi, Burri, Egli, Felder, Fischer, Flückiger, Frei, Frey, Fuchs, Furrer, Gasser, Gerber, Gisler, Graber, Gut, Haas, Hess, Hofer, Huber, Hug, Hürlimann, Imhof, Iseli, Jäggi, Kälin, Kaufmann, Keller, Kessler, Koch, Kunz, Küng, Lehmann, Lüthi, Marti, Meier, Meyer, Moser, Müller, Murer, Nussbaum, Peter, Rüegg, Schaller, Schär, Schmid, Schneider, Schnyder, Schürch, Siegenthaler, Sommer, Stalder, Stauffer, Steiner, Stucki, Suter, Thalmann, Vogel, Vogt, Wälti, Weber, Wenger, Widmer, Wyss, Zbinden, Zimmermann, Zürcher, Bonvin, Chappuis, Favre, Girard, Rochat, Rey, Perrin, Bianchi, Rossi, Ferrari, Gianoli`),
    eras: [
      [0, w(`Alfred, Ernst, Fritz, Hans, Heinz, Jakob, Karl, Kurt, Max, Paul, Peter, Robert, Rudolf, Walter, Werner, Willi, Hansruedi, Ruedi, Pierre, Jean`)],
      [1965, w(`Andreas, Bruno, Christian, Daniel, Heinz, Jürg, Markus, Martin, Michael, Patrick, Peter, René, Roger, Roland, Stefan, Thomas, Urs, Christoph, Alain, Pascal, Philippe, Marco`)],
      [1985, w(`Adrian, Andreas, Benjamin, Christian, Cédric, Dominik, Fabian, Florian, Kevin, Lukas, Manuel, Marc, Marco, Matthias, Michael, Nicolas, Pascal, Patrick, Philipp, Raphael, Reto, Sandro, Simon, Yves`)],
      [2000, w(`Alessandro, Andrin, Dario, David, Elias, Fabio, Gian, Jan, Joel, Jonas, Julian, Kilian, Lars, Leon, Levin, Luca, Luis, Marco, Mattia, Nico, Nils, Noah, Noel, Remo, Robin, Silvan, Tim, Yanick`)],
    ],
  },
  ned: {
    last: w(`Aalbers, Akkerman, Bakker, Beekman, Berends, Blom, Boer, Boonstra, Bosch, Bosman, Brink, Brouwer, Bruins, Claassen, Dekker, Dijkstra, Driessen, Evers, Gerritsen, Groen, Haan, Hendriks, Hermans, Hoekstra, Hofman, Hoogland, Huisman, Jacobs, Jonker, Kok, Koning, Koster, Kramer, Kuipers, Lambers, Martens, Meijer, Molenaar, Mulder, Nijhuis, Peeters, Peters, Pieters, Post, Prins, Roos, Schouten, Smits, Spoelstra, Stam, Teunissen, Timmermans, van Beek, van Dam, van der Heijden, van der Linden, van der Meer, van der Veen, van der Wal, van Dongen, van Leeuwen, van Loon, van Vliet, van Wijk, Veenstra, Verbeek, Verhoeven, Vermeulen, Vos, Willems, Wouters, Zwart, de Bruijn, de Graaf, de Groot, de Haan, de Koning, de Lange, de Leeuw, de Wit, Kuiper, Sanders, Scholten, Smeets, Tromp, Hoogendoorn, Kroon, Kerkhof, Ruiter`),
    eras: [
      [0, w(`Adrianus, Cornelis, Dirk, Gerrit, Hendrik, Jacobus, Johannes, Klaas, Kees, Piet, Theo, Wim, Henk, Gerard, Frans, Joop, Ton, Hans, Jaap, Rinus`)],
      [1960, w(`Arie, Bert, Erik, Gerard, Hans, Henk, Jan, Jeroen, John, Kees, Marco, Martin, Michel, Peter, René, Rob, Ronald, Wim, Wouter, Edwin, Marcel, Patrick`)],
      [1980, w(`Bas, Dennis, Erik, Jeroen, Joost, Kevin, Maarten, Mark, Martijn, Michiel, Mike, Niels, Paul, Remco, Rick, Robin, Roy, Stefan, Thijs, Tim, Wesley, Jeffrey, Dave, Ricardo`)],
      [1998, w(`Bram, Daan, Dani, Daley, Jesse, Joey, Joris, Justin, Kevin, Lars, Lucas, Luuk, Mats, Max, Milan, Niels, Noah, Owen, Rick, Ruben, Sem, Stijn, Teun, Thijs, Thomas, Tijn, Wout, Xavi, Levi, Finn`)],
    ],
  },
  bel: {
    last: w(`Aerts, Baert, Bastin, Bauwens, Bertrand, Bogaert, Bosmans, Claeys, Cools, Coppens, Cornelis, De Backer, De Bruyn, De Clercq, De Cock, De Coninck, De Meyer, De Smet, De Vos, De Wilde, Declercq, Delvaux, Denis, Desmet, Devos, Dupont, Dumont, Evrard, Fontaine, François, Geerts, Gérard, Gilles, Hendrickx, Hermans, Huybrechts, Janssen, Lambert, Laurent, Leclercq, Lemaire, Lenaerts, Lambrechts, Martens, Mathieu, Michiels, Michel, Moens, Nys, Pauwels, Peeters, Renard, Segers, Simon, Smets, Stevens, Thys, Timmermans, Van Damme, Van de Velde, Van den Bossche, Van Hoof, Vandenberghe, Vandamme, Verbeke, Verhaegen, Vermeulen, Verstraete, Wauters, Willaert, Wuyts, Claes, Jacobs, Dewulf, Lefebvre, Leroy, Noël`),
    eras: [
      [0, w(`Albert, André, Emile, Georges, Gilbert, Henri, Jean, Jef, Joseph, Jozef, Julien, Léon, Louis, Marcel, Paul, Pierre, Raymond, René, Roger, Willy, Frans, Guy, Jacques`)],
      [1965, w(`Alain, Bart, Christophe, Dirk, Eric, Filip, Frank, Geert, Gert, Johan, Koen, Luc, Marc, Michel, Olivier, Patrick, Peter, Philippe, Pascal, Stefaan, Tom, Wim, Yves, Didier, Kurt, Kris`)],
      [1985, w(`Arnaud, Bram, Cédric, Dieter, Dries, Gilles, Glenn, Jens, Jérôme, Jonas, Kevin, Laurent, Maxime, Nicolas, Pieter, Romain, Ruben, Sander, Sébastien, Steven, Thibaut, Thomas, Tim, Wout, Yannick`)],
      [2000, w(`Alexis, Arthur, Arne, Bryan, Cyril, Elias, Hugo, Jarne, Jonas, Lars, Louis, Lucas, Mathis, Maxim, Noah, Robbe, Senne, Siebe, Théo, Thibo, Victor, Warre, Wout, Nathan`)],
    ],
  },
  den: {
    last: w(`Bach, Bang, Berg, Bertelsen, Bundgaard, Christiansen, Clausen, Dahl, Damgaard, Dam, Eriksen, Frandsen, Frederiksen, Frost, Hald, Holm, Holst, Iversen, Jakobsen, Jeppesen, Jessen, Johansen, Jørgensen, Juhl, Juul, Kjær, Kjeldsen, Knudsen, Kristensen, Laursen, Lauridsen, Lund, Madsen, Mikkelsen, Mortensen, Mogensen, Møller, Nissen, Nygaard, Olsen, Overgaard, Petersen, Riis, Schmidt, Simonsen, Skov, Steffensen, Svendsen, Thomsen, Thygesen, Toft, Vestergaard, Villadsen, Winther, Østergaard, Bech, Bisgaard, Brandt, Dalgaard, Enevoldsen, Kirkegaard, Lassen, Lindberg, Nørgaard, Rask, Søndergaard`),
    eras: [
      [0, w(`Aage, Arne, Bent, Børge, Erik, Finn, Flemming, Hans, Henning, Jens, Jørgen, Knud, Kurt, Leif, Niels, Ole, Poul, Preben, Svend, Tage, Kaj, Erling`)],
      [1960, w(`Bjarne, Brian, Carsten, Claus, Flemming, Jan, Jesper, John, Kenneth, Kim, Lars, Michael, Ole, Peter, Per, René, Steen, Søren, Thomas, Torben, Jens, Bo`)],
      [1980, w(`Anders, Bo, Casper, Christian, Daniel, Dennis, Jacob, Jakob, Jonas, Kasper, Kenneth, Mads, Martin, Michael, Morten, Nicolai, Rasmus, Simon, Thomas, Tobias, Mikkel, Jesper`)],
      [1998, w(`Alexander, Andreas, Christian, Emil, Frederik, Gustav, Jonas, Kasper, Lucas, Magnus, Malthe, Marcus, Mathias, Mikkel, Nikolaj, Oliver, Oscar, Rasmus, Sebastian, Victor, William, Noah, Elias`)],
    ],
  },
  swe: {
    last: w(`Axelsson, Berg, Bergström, Björk, Blom, Bengtsson, Danielsson, Ek, Eklund, Ekström, Engström, Forsberg, Fredriksson, Gunnarsson, Hansson, Hedlund, Henriksson, Holm, Holmberg, Hermansson, Isaksson, Jakobsson, Jansson, Jonsson, Jönsson, Kristiansson, Lindberg, Lindgren, Lindqvist, Lindström, Lund, Lundberg, Lundgren, Lundqvist, Magnusson, Mattsson, Månsson, Nordin, Nordström, Nyberg, Nyström, Olofsson, Pettersson, Samuelsson, Sandberg, Sjöberg, Sundberg, Ström, Söderberg, Wallin, Wikström, Åberg, Åkesson, Berglund, Dahlberg, Ekberg, Göransson, Hägg, Lindahl, Mårtensson, Sjögren, Strand, Sundström`),
    eras: [
      [0, w(`Arne, Bengt, Bo, Bertil, Gunnar, Göran, Hans, Ingemar, Karl, Kjell, Lars, Lennart, Nils, Olle, Rolf, Rune, Sven, Stig, Sture, Åke, Ove, Tommy`)],
      [1960, w(`Anders, Björn, Dan, Håkan, Jan, Jonas, Kent, Leif, Magnus, Mats, Mikael, Niklas, Ola, Patrik, Per, Peter, Roger, Stefan, Thomas, Tomas, Ulf, Johan`)],
      [1980, w(`Alexander, Andreas, Christoffer, Daniel, David, Emil, Erik, Fredrik, Henrik, Jesper, Jimmy, Joakim, Johan, Marcus, Martin, Mattias, Robin, Sebastian, Simon, Tobias, Kim, Rasmus`)],
      [1998, w(`Albin, Alexander, Anton, Axel, Carl, Elias, Emil, Filip, Gustav, Hampus, Isak, Jacob, Jonathan, Linus, Lucas, Ludvig, Melvin, Noah, Oliver, Oscar, Samuel, Viktor, William, Hugo, Leo`)],
    ],
  },
  nor: {
    last: w(`Aas, Amundsen, Andersen, Antonsen, Bakke, Berge, Birkeland, Bjerke, Brekke, Dahle, Eide, Ellingsen, Engen, Fredriksen, Gundersen, Hagen, Halvorsen, Hansen, Haugland, Helland, Hovland, Iversen, Jacobsen, Jensen, Johnsen, Karlsen, Kristiansen, Kristoffersen, Lund, Lunde, Martinsen, Moen, Myhre, Myklebust, Nilsen, Nygård, Pedersen, Rasmussen, Ruud, Sandvik, Sæther, Solheim, Strand, Strøm, Svendsen, Sørensen, Tveit, Vik, Aune, Berntsen, Dale, Fjeld, Holm, Kvamme, Moe, Næss, Riise, Rønning, Stene, Tangen, Thorsen, Ødegård`),
    eras: [
      [0, w(`Arne, Bjørn, Egil, Einar, Finn, Gunnar, Harald, Helge, Ivar, Jan, Kåre, Kjell, Odd, Olav, Per, Reidar, Svein, Terje, Thor, Arild`)],
      [1970, w(`Anders, Bjarte, Børre, Eirik, Espen, Frode, Geir, Gisle, Jon, Kristian, Lars, Morten, Ole, Petter, Roar, Stig, Tom, Trond, Vegard, Øyvind, Kjetil, Rune`)],
      [1993, w(`Aksel, Andreas, Brage, Eirik, Emil, Even, Fredrik, Henrik, Herman, Isak, Jakob, Jonas, Kasper, Kristoffer, Magnus, Markus, Mathias, Ola, Sander, Sebastian, Sindre, Tobias, Vetle, William, Jørgen`)],
    ],
  },
  eng: {
    last: w(`Adams, Allen, Atkinson, Bailey, Baker, Barker, Barnes, Bates, Bell, Bennett, Berry, Bird, Bishop, Booth, Bradley, Brooks, Brown, Burton, Butler, Carter, Chapman, Clark, Clarke, Cole, Collins, Cook, Cooper, Cox, Davies, Davis, Dawson, Dixon, Edwards, Ellis, Evans, Fisher, Fletcher, Foster, Fox, Gibson, Gill, Gordon, Graham, Grant, Gray, Green, Griffiths, Hall, Hamilton, Harding, Harris, Harrison, Hart, Harvey, Hayes, Hill, Holmes, Hopkins, Howard, Hughes, Hunt, Hunter, Jackson, James, Jenkins, Johnson, Jones, Kelly, Kennedy, King, Knight, Lane, Lawrence, Lee, Lewis, Lloyd, Marsh, Marshall, Martin, Mason, Matthews, Miller, Mills, Mitchell, Moore, Morgan, Morris, Murphy, Murray, Newton, Owen, Palmer, Parker, Patel, Payne, Pearce, Pearson, Perry, Phillips, Porter, Powell, Price, Reid, Reynolds, Richards, Richardson, Roberts, Robinson, Rogers, Rose, Russell, Saunders, Scott, Shaw, Simpson, Smith, Spencer, Stevens, Stewart, Stone, Taylor, Thomas, Thompson, Turner, Walker, Wallace, Ward, Watson, Webb, Wells, West, White, Wilkinson, Williams, Wilson, Wood, Woods, Wright, Young, Ashworth, Barlow, Barrett, Bradshaw, Bray, Briggs, Buckley, Cartwright, Charlton, Coates, Crossley, Dobson, Duffy, Fenwick, Gregson, Hargreaves, Holt, Jowett, Kirby, Lowe, Metcalfe, Naylor, Oldfield, Platt, Rhodes, Sutcliffe, Whittaker`),
    eras: [
      [0, w(`Albert, Alan, Arthur, Bernard, Bill, Bobby, Brian, Colin, Dennis, Derek, Donald, Eric, Ernest, Frank, Fred, Geoff, George, Gordon, Harry, Jack, Jim, Ken, Leslie, Norman, Peter, Ray, Ron, Roy, Stan, Ted, Tommy, Walter`)],
      [1960, w(`Andrew, Barry, Chris, Clive, Dave, Gary, Graham, Ian, Keith, Kevin, Malcolm, Mark, Martin, Mick, Neil, Nigel, Paul, Phil, Russell, Steve, Stuart, Terry, Tony, Trevor, Wayne, Nicky`)],
      [1975, w(`Adam, Andy, Ben, Carl, Craig, Dale, Darren, Dean, Gareth, Jamie, Jason, Jon, Justin, Lee, Matt, Nick, Richard, Robbie, Ryan, Scott, Shaun, Simon, Stephen, Tom, Wes, Danny`)],
      [1995, w(`Aaron, Alfie, Archie, Bradley, Callum, Charlie, Connor, Daniel, Dylan, Ethan, Finley, George, Harrison, Harvey, Jack, Jake, Jamie, Joe, Jordan, Kai, Kieran, Lewis, Liam, Louis, Mason, Max, Nathan, Reece, Tyler, Oliver, Oscar, Theo, Toby, Rhys`)],
    ],
  },
  sco: {
    last: w(`Aitken, Anderson, Baird, Black, Boyd, Brown, Buchanan, Burns, Cameron, Campbell, Craig, Crawford, Cunningham, Davidson, Docherty, Douglas, Duncan, Ferguson, Fraser, Gallacher, Gibson, Gillespie, Gordon, Graham, Grant, Gray, Hamilton, Hay, Henderson, Hunter, Johnston, Kerr, Kidd, Lindsay, Mackay, Mackenzie, Mackintosh, Maclean, Macleod, Martin, McAllister, McCallum, McCann, McDonald, McGregor, McIntyre, McKay, McLaren, McLean, McLeod, McMillan, McNeil, McPherson, Miller, Mitchell, Morrison, Muir, Munro, Murray, Paterson, Reid, Robertson, Ross, Scott, Shaw, Sinclair, Smith, Stewart, Sutherland, Taylor, Thomson, Walker, Wallace, Watson, Watt, White, Wilson, Young`),
    eras: [
      [0, w(`Alex, Alistair, Andy, Archie, Billy, Bobby, Davie, Dougie, Eddie, Gordon, Hugh, Ian, Jim, Jimmy, John, Kenny, Malcolm, Neil, Rab, Sandy, Tam, Willie, Jock, Hamish`)],
      [1965, w(`Alan, Andrew, Brian, Colin, Craig, Darren, David, Derek, Gary, Graeme, Iain, Kevin, Mark, Martin, Paul, Ross, Scott, Steven, Stuart, Gavin, Grant, Barry`)],
      [1990, w(`Aaron, Adam, Blair, Callum, Cameron, Connor, Dylan, Euan, Fraser, Greg, Jack, Jamie, Jordan, Kieran, Kyle, Lewis, Liam, Lucas, Murray, Ryan, Sean, Ewan, Finlay, Rory`)],
    ],
  },
  fra: {
    last: w(`André, Arnaud, Aubert, Barbier, Baron, Bernard, Bertin, Blanc, Blanchard, Bonnet, Bouchet, Boucher, Bourgeois, Boyer, Brun, Brunet, Carpentier, Caron, Charles, Chevalier, Clément, Colin, Collet, Da Silva, Daniel, David, Denis, Dubois, Dufour, Dumas, Dupont, Dupuis, Durand, Fabre, Faure, Fleury, Fontaine, Fournier, François, Gaillard, Garnier, Gauthier, Gautier, Gérard, Germain, Girard, Giraud, Guerin, Guillaume, Henry, Hubert, Jacquet, Joly, Lacroix, Lambert, Laurent, Leblanc, Lebrun, Leclerc, Lefebvre, Lefèvre, Legrand, Lemaire, Leroux, Leroy, Lucas, Marchand, Marie, Martin, Masson, Mathieu, Mercier, Meunier, Meyer, Michel, Moreau, Morel, Morin, Muller, Nicolas, Noël, Perrin, Petit, Picard, Pierre, Renard, Renaud, Rey, Richard, Rivière, Robert, Robin, Roche, Roger, Rousseau, Roussel, Roux, Roy, Schmitt, Simon, Thomas, Vidal, Vincent, Bertrand, Bonnefoy, Chauvin, Courtois, Delmas, Dumont, Ferrand, Guichard, Hamon, Lebreton, Maillard, Pasquier, Poulain, Tessier, Vasseur`),
    eras: [
      [0, w(`André, Bernard, Claude, Daniel, Georges, Gérard, Guy, Henri, Jacques, Jean, Jean-Claude, Jean-Pierre, Louis, Lucien, Marcel, Maurice, Michel, Paul, Pierre, Raymond, René, Robert, Roger, Roland, Yves, Gilbert, Marc`)],
      [1962, w(`Alain, Bruno, Christian, Christophe, Didier, Dominique, Éric, Franck, Frédéric, Gilles, Hervé, Jean-Luc, Jean-Marc, Laurent, Lionel, Olivier, Pascal, Patrick, Philippe, Serge, Stéphane, Thierry, Vincent, Joël, Luc, Yannick`)],
      [1978, w(`Anthony, Arnaud, Benoît, Cédric, Damien, David, Fabien, Florent, Grégory, Guillaume, Jérémy, Jérôme, Julien, Ludovic, Mathieu, Maxime, Mickaël, Nicolas, Romain, Sébastien, Sylvain, Yohan, Kévin, Steve, Rudy`)],
      [1996, w(`Adrien, Alexandre, Antoine, Baptiste, Benjamin, Bastien, Clément, Corentin, Dylan, Enzo, Florian, Hugo, Jordan, Kylian, Léo, Loïc, Louis, Lucas, Mathis, Maxime, Nathan, Paul, Quentin, Raphaël, Rayan, Théo, Thomas, Tom, Valentin, Yanis`)],
    ],
  },
};

/**
 * Neue Herkünfte für Namen der Ethnien im Land (Wunsch Pascal: „echte Namen der
 * Ethnien in dem Land“): Karibik in England/Frankreich, Maghreb in Frankreich,
 * Suriname in den Niederlanden. Werden in data/origins.ts als Herkunft angelegt
 * und über HOST_HERITAGE (data/ethnicity.ts) genutzt.
 */
export const XL_NEW_ORIGINS: Record<string, { nationality: string; face: string; first: string[]; last: string[]; eras?: [number, string[]][] }> = {
  // Familien mit karibischen Wurzeln (Jamaika, Trinidad, Barbados …): englische Nachnamen.
  eng_car: { nationality: 'ENG', face: 'westafrika',
    first: w(`Andre, Anthony, Clayton, Courtney, Delroy, Dwight, Errol, Garfield, Junior, Leroy, Lloyd, Marlon, Nathaniel, Neville, Winston, Wesley, Tyrone, Trevor`),
    last: w(`Anderson, Bailey, Barrett, Beckford, Blake, Bryan, Campbell, Clarke, Daley, Davis, Douglas, Edwards, Francis, Gayle, Gordon, Grant, Green, Hall, Henry, Hylton, Jackson, James, Johnson, Lewis, Lindo, Morgan, Morrison, Nelson, Powell, Reid, Richards, Robinson, Samuels, Sinclair, Smith, Spence, Stewart, Thomas, Walker, Watson, White, Williams, Wright, Brissett, Cunningham, Dixon, Ellis, Facey, Gooden, McKenzie`),
    eras: [[0, w(`Clive, Cyrille, Desmond, Errol, Garth, Hubert, Laurie, Lloyd, Neville, Roland, Vince, Winston, Everton`)],
      [1965, w(`Andre, Carlton, Clayton, Courtney, Darren, Delroy, Devon, Dwight, Garry, Jason, Leroy, Marcus, Mark, Michael, Paul, Trevor, Tyrone, Wayne, Dean, Junior`)],
      [1990, w(`Ashley, Darnell, Daniel, Isaiah, Jaden, Jamal, Jermaine, Jordan, Joshua, Kai, Kyle, Malachi, Marcus, Nathaniel, Reiss, Ryan, Shaquille, Tyrese, Tyler, Zion, Ethan, Kemar`)]] },
  // Französische Antillen/Guayana/Réunion: französische Nachnamen kreolischer Familien.
  fra_car: { nationality: 'FRA', face: 'westafrika',
    first: w(`Alain, Christophe, Daniel, Didier, Fabrice, Frédéric, Gilles, Jacques, Jean-Marc, Joël, Laurent, Lilian, Ludovic, Marius, Pascal, Patrice, Steve, Thierry`),
    last: w(`Alexis, Antoine, Bellance, Bernard, Bonheur, Calixte, Céleste, Charles, Clément, Désir, Edouard, Etienne, Fidèle, Florent, Gabriel, Germain, Hilaire, Jean-Baptiste, Joseph, Laurent, Lucien, Marie-Sainte, Maxime, Modeste, Nicolas, Placide, Raphaël, Romain, Saint-Clair, Sylvestre, Théodore, Thomas, Valentin, Victorin, Zénon, Belaise, Clotilde, Galas, Jalta, Larcher, Mirande, Ursulet`),
    eras: [[0, w(`Alain, Gérard, Jacques, Jean, Marius, Max, Michel, Raymond, Roger, Serge, Victor`)],
      [1970, w(`Bruno, Christophe, Didier, Fabrice, Frédéric, Jean-Marc, Joël, Laurent, Lilian, Ludovic, Pascal, Patrice, Steve, Thierry, Wilfried, Mickaël`)],
      [1995, w(`Anthony, Dylan, Enzo, Jordan, Kenny, Kévin, Killian, Lenny, Loïc, Lucas, Mathis, Nathan, Ryan, Teddy, Wesley, Yoann, Johan, Steeve`)]] },
  // Maghreb-Familien in Frankreich/Belgien.
  fra_mag: { nationality: 'FRA', face: 'nordafrika',
    first: w(`Abdel, Ahmed, Ali, Farid, Hakim, Hassan, Karim, Khaled, Malik, Mehdi, Mohamed, Mourad, Nabil, Nordine, Rachid, Samir, Sofiane, Yacine, Youssef`),
    last: w(`Abdi, Amrani, Belkacem, Belkadi, Benali, Bendjelloul, Benhamou, Benmansour, Bensalem, Bouaziz, Boudjema, Boukhari, Bouzid, Brahimi, Chaouch, Cherif, Djebbar, El Amrani, Ferhat, Gharbi, Haddad, Hadj, Hamdi, Haddadi, Kaci, Kaddour, Khelifi, Larbi, Mansouri, Meziane, Messaoudi, Mokrani, Ouali, Rahmani, Saidi, Slimani, Taleb, Touati, Yahiaoui, Zerrouki, Ziani, Bouhaddi, Hamidi, Zeroual`),
    eras: [[0, w(`Abdelkader, Ahmed, Ali, Hocine, Mohamed, Moktar, Mustapha, Rachid, Saïd, Salah`)],
      [1970, w(`Abdel, Djamel, Farid, Hakim, Kamel, Karim, Khaled, Malik, Mourad, Nabil, Nordine, Rachid, Samir, Smaïl, Tarik`)],
      [1990, w(`Adel, Amine, Anis, Bilal, Hamza, Ilyes, Ismaël, Mehdi, Nassim, Rayan, Riyad, Sofiane, Walid, Yanis, Yassine, Younès, Zakaria, Ilan`)]] },
  // Surinamische/Antillianische Familien in den Niederlanden.
  ned_sur: { nationality: 'NED', face: 'westafrika',
    first: w(`Clarence, Edgar, Edson, Ferdi, Frank, Gerald, Glenn, Henk, Humphrey, Marciano, Michael, Orlando, Patrick, Regi, Romeo, Ruud, Stanley, Winston`),
    last: w(`Aerts, Amatkarijo, Bakboord, Belfor, Bosse, Brandon, Breinburg, Dors, Eersel,, Hagen, Held, Jozefzoon, Kanhai, Kemble, Kokke, Landveld, Linger, Lont, Macnack, Mijnals, Monsels, Nelom, Pinas, Plet, Refos, Sedney, Sleur, Telgt, Tjon, Tuinfort, Valies, Vlijter, Waal, Wijngaarde, Zeefuik, Doelwijt, Esajas, Fortuna, Karsters, Kroes, Lie Paw Sam, Muskiet`),
    eras: [[0, w(`Edgar, Erwin, Frank, Henk, Humphrey, Leo, Rudi, Stanley, Theo, Winston`)],
      [1970, w(`Aron, Bryan, Clarence, Edson, Ferdi, Gerald, Glenn, Jerrel, John, Marciano, Michael, Orlando, Patrick, Regi, Romeo, Stanley, Dwight, Mitchell`)],
      [1995, w(`Calvin, Denzel, Dylan, Jayden, Jeremiah, Jordy, Justin, Kenneth, Mitchel, Noa, Ryan, Shurandy, Xavi`)]] },
};
