// =============================================================================
// Namenspools, sechste Stufe – Schweiz und Österreich (Wunsch Pascal: Namen je Land im Verhältnis
// zu den simulierten Vereinen, Zielwerte in docs/research/namen-ziel.md). Familiennamen
// nach den Häufigkeits-Ranglisten des Landes (Rangfolge echter Namen je Land, siehe
// docs/research/namen-ziel.md), gefiltert auf in der Bevölkerung übliche Namen ohne
// Überschneidung mit den Ethnien-Herkünften desselben Landes; deutsch-, französisch- und italienischsprachige Schweiz; österreichische Namen aus allen Bundesländern.
// Vornamen als Zeitspannen der Geburtsjahrgänge [von, bis, Namen] – Aufbau der
// Stufen in data/namePoolsXL5.ts, eingemischt über `mergeXL` in data/origins.ts.
// =============================================================================
import { w } from './namePoolsXL';
import type { XL5Names } from './namePoolsXL5';

export const XL5_ALPS: Record<string, XL5Names> = {
  sui: {
    last: w(`
      Koller, Hauser, Senn, Scheidegger, Zehnder, Meister, Wittwer, Schärer, Marty, Blanc, Steiger, Bischof, Sieber, Mathys, Eichenberger, Röthlisberger,
      Reber, Zwahlen, Betschart, Häller, Siegrist, Nussbaumer, Rohrer, Probst, Friedli, Steinmann, Jäger, Wirth, Heiniger, Käser, Schaub, Eberle, König,
      Schlegel, Etter, Emini, Balmer, Iseni, Schütz, Salzmann, Iten, Thoma, Zingg, Näf, Birrer, Asani, Baur, Beyeler, Perret, Geiser, Rieder, Schüpbach,
      Grossenbacher, Walser, Maillard, Achermann, Gfeller, Emmenegger, Monney, Buchs, Städler, Manser, Germann, Sidler, Neuenschwander, Neuhaus, Kummer,
      Fahrni, Sonderegger, Jordi, Jusufi, Honegger, Riesen, Strebel, Hodel, Fuhrer, Gaillard, Krähenbühl, Tschopp, Schneiter, Memeti, Hafner, Buser,
      Rechsteiner, Ramseier, Imboden, Burkhard, Hirt, Niederhäuser, Lauber, Züger, Amrein, Blättler, Streit, Wettstein, Herren, Mächler, Rohrbach, Oppliger,
      Bär, Signer, Magnin, Thommen, Plüss, Kolly, Huser, Renggli, Maeder, Wanner, Rutz, Borer, Hefti, Nydegger, Wiedmer, Diethelm, Kurmann, Oberson, Fleury,
      Jud, Lötscher, Aeschbacher, Hediger, Limani, Haliti, Schnider, Ruch, Büchel, Schenker, Schaad, Thomann, Wernli, Vögeli, Krummenacher, Matthey, Gmür,
      Jeanneret, Hurni, Hohl, Vetsch, Beutler, Zweifel, Bättig, Duc, Mustafi, Aschwanden, Brönnimann, Kappeler, Gurtner, Wüst, Golay, Dubach, Maag,
      Aeberhard, Ingold, Egloff, Kissling, Bürgin, Ameti, Nyffenegger, Helbling, Stämpfli, Pauli, Gilgen, Gschwend, Lauper, Piller, Hitz, Jacot, Bernet,
      Luginbühl, Sylejmani, Theiler, Wegmann, Droz, Fluri, Hollenstein, Schmidlin, Inauen, Berner, Fritschi, Gysin, Niederer, Feuz, Althaus, Chassot, Künzi,
      Ruf, Lerch, Felber, Hänggi, Monnet, Gremaud, Wegmüller, Sturzenegger, Grand, Eberhard, Büchler, Hügli, Forrer, Ruckstuhl, Lüdi, Rosset, Biedermann,
      Herzig, Ajeti, Sauter, Halter, Mühlemann, Ibraimi, Bruderer, Troxler, Ineichen, Hotz, Boillat, Aegerter, Strub, Kobel, Ledermann, Gantenbein, Huguenin,
      Besson, Roduit, Froidevaux, Grütter, Schaer, Wieland, Kühne, Vaucher, Künzler, Amsler, Weidmann, Eigenmann, Pajaziti, Kiener, Rüttimann, Messmer,
      Burgener, Gassmann, Beeler, Maret, Aregger, Freiburghaus, Zellweger, Schulthess, Walder, Spiess, Baeriswyl, Aeby, Waeber, Engler, Brändle, Wälchli,
      Dörig, Barmettler, Bähler, Hayoz, Hochstrasser, Hunkeler, Bossi, Dobler, Diener, Stuber, Crausaz, Hochuli, Obrist, Morf, Rentsch, Bichsel, Fröhlich,
      Tissot, Stamm, Zurbuchen, Lachat, Baechler, Rashiti, Karrer, Kobler, Kempf, Saxer, Cattin, Riedo, Gubser, Weder, Holenstein, Spycher, Kellenberger,
      Morgenthaler, Ismajli, Perroud, Schwegler, Brechbühl, Künzle, Mischler, Aubry, Kaeser, Birchler, Fiechter, Vollenweider, Häberli, Pache, Stäheli,
      Leuthold, Chapuis, Bischofberger, Redzepi, Haldemann, Stebler, Gutknecht, Chollet, Duss, Wullschleger, Grossmann, Reichenbach, Keiser, Guggisberg,
      Tresch, Balsiger, Reist, Bütikofer, Küttel, Santschi, Rouiller, Tschannen, Schmied, Gander, Giroud, Oesch, Sommerhalder, Haziri, Schenkel, Frossard,
      Hugentobler, Münger, Caviezel, Rüsch, Elsener, Sigg, Piguet, Strahm, Stieger, Baumberger, Scheurer, Morard, Leuba, Schöni, Saiti, Jungo, Buri, Aliji,
      Schöpfer, Schellenberg, Guignard, Schmidli, Knobel, Haldimann, Limacher, Barbey, Lüchinger, Strasser, Bodmer, Bapst, Bugnon, Schild, Dürr, Reimann,
      Peyer, Perrenoud, Langenegger, Zihlmann, Zurflüh, Wigger, Werder, Flück, Meli, Bunjaku, Buchmann, Estermann, Heusser, Schiess, Stoller, Bänziger,
      Fellay, Pellegrini, Castella, Sollberger, Camenisch, Glanzmann, Breitenmoser, Zogg, Witschi, Michellod, Erne, Riva, Köppel, Hagmann, Fricker, Blumer,
      Kammermann, Andenmatten, Stierli, Stirnimann, Niedermann, Junod, Allenbach, Badertscher, Feldmann, Häusler, Krieg, Käppeli, Bruchez, Kurz, Fellmann,
      Bersier, Lenherr, Frehner, Wildhaber, Cotting, Kleiner, Wenk, Schlup, Rickli, Basler, Pfiffner, Rölli, Annen, Grüter, Bürgler, Bracher, Humbert, Arn,
      Girardin, Hungerbühler, Leuzinger, Ducommun, Hanselmann, Schönbächler, Aebersold, Jucker, Berthoud, Kyburz, Perren, Crivelli, Karlen, Rudaz, Dreier,
      Schürmann, Kipfer, Meile, Grunder, Hübscher, Niggli, Anliker, Pochon, Sprenger, Reusser, Schärli, Fäh, Abt, Kropf, Notter, Grossen, Spirig, Darbellay,
      Schelbert, Richner, Huwyler, Tschumi, Sägesser, Gertsch, Fürst, Spielmann, Ambühl, Eggenschwiler, Saladin, Preisig, Crameri, Knöpfel, Leibundgut,
      Tairi, Ramseyer, Jeker, Gartmann, Zähner, Simmen, Strässle, Waldvogel, Zurbrügg, Bally, Beaud, Howald, Ruchti, Boschung, Brack, Rickenbacher, Bregy,
      Winiger, Misini, Ajdari, Rast, Enz, Sabani, Rothen, Kuonen, Hämmerli, Brodard, Scheiwiller, Praz, Nobs, Rüegger, Pulfer, Kneubühler, Woodtli,
      Allenspach, Leutenegger, Holdener, Mangold, Heuberger, Helfenstein, Comte, Zünd, Porchet, Lüthy, Bamert, Augsburger, Mettraux, Germanier, Jaeggi, Auer,
      Nigg, Memedi, Raemy, Bolli, Wildi, Bertschy, Angst, Savioz, Brülhart, Montavon, Rothenbühler, Bangerter, Ryter, Märki, Luchsinger, Matti, Burkart,
      Ettlin, Büsser, Süess, Haefeli, Canonica, Gobet, Seydoux, Willemin, Hertig, Wüest, Pillonel, Schwendener, Tinner, Aerni, Häfeli, Tschan, Bodenmann,
      Grünig, Thomet, Conus, Röösli, Reichlin, Meichtry, Schwager, Geneva, Cavin, Lieberherr, Zumsteg, Vallat, Häusermann, Leutwyler, Bollhalder, Lippuner,
      Menoud, Gugger, Eisenring, Switzerland, Bislimi, Dayer, Wipf, Zwicky, Juillerat, Maissen, Yerly, Pahud, Räber, Hardegger`),
    spans: [
      [1940, 2019, w(`
        Francesco, Salvatore, Vincenzo, Domenico, Maurizio, Fabien, Pietro, Enrico, Lorenz, Cyrill, Alban, Pasquale, Georg, Raffaele, Rocco, Vito, Christof,
        Giacomo, Hervé, Timon, Emanuele, Carmine, Hansueli, Gaetano, Sepp, Giuliano, Damiano, Martial, Janik, Yannik, Massimiliano, Gérald, Yoann, Cosimo,
        Othmar, Antonino, Maximilian, Giulio, Benedikt, Vittorio, Till, Sebastiano, Rino, Gaël, Flurin, Yanik, Cyrille, Ivano, Graziano, Martino`)],
    ],
  },
  aut: {
    last: w(`
      Böhm, Schweiger, Herzog, Müllner, Brückner, Krammer, Ecker, Brandstetter, Haller, Bischof, Bichler, Stockinger, Bayer, Schauer, Walch, Windisch, Hölzl,
      Stöger, Schweighofer, Frühwirth, Pucher, Raab, Wurzer, Schütz, Maierhofer, Reiterer, Kröll, Sailer, Geisler, Steger, Artner, Höfler, Siegl, Schranz,
      Pühringer, Schmied, Wechselberger, Harrer, Eberl, Holzmann, Burtscher, Schindler, Kellner, Eberharter, Steinberger, Gmeiner, Weidinger, Baier,
      Buchegger, Steinkellner, Sonnleitner, Probst, Schneeberger, Handler, Klug, Thaller, Walcher, Löffler, Maus, Kügler, Suppan, Bachmann, Fankhauser,
      Seebacher, Muhr, Lengauer, Bogner, Rieser, Neuhauser, Schön, Heindl, Klammer, Stiegler, Schärf, Falkner, Schachinger, Rechberger, Schüller, Redl,
      Wieland, Pacher, Wittmann, Amann, Neuner, Forstner, Häring, Pointner, Wegscheider, Böck, Nußbaumer, Lederer, Kremser, Reinisch, Rosenberger, Juen,
      Hämmerle, Hinteregger, Erhart, Zenz, Steinlechner, Greiner, Weigl, Heigl, Tischler, Weninger, Metzler, Kummer, Eibl, Janisch, Oberhauser, Kager,
      Erlacher, Walser, Galler, Perner, Käfer, Hollaus, Gritsch, Payer, Kirschner, Petz, Hemetsberger, Handl, Hammerl, Mitter, Macher, Dräxler, Hubmann,
      Dobler, Klotz, Jauk, Gschwandtner, Trimmel, Deutschmann, Bartl, Mitteregger, Mörth, Schiestl, Prantl, Radl, Reitbauer, Eisner, Schantl, Buchberger,
      Rohrmoser, Dorfer, Margreiter, Sigl, Paulitsch, Pieber, Eigner, Schäfer, Ostermann, Sammer, Tiefenbacher, Grießer, Neumeister, Guggenberger, Dengg,
      Santner, Rettenbacher, Lagler, Pöschl, Leutgeb, Krall, Sperl, Köhler, Stolz, Sagmeister, Kraxner, Koppensteiner, Stückler, Jöbstl, Kreiner, Schmuck,
      Fercher, Fichtinger, Scholz, Höfinger, Spreitzer, Pfleger, Führer, Auinger, Pertl, Riedler, Lipp, Pils, Scherz, Felber, Kratzer, Schinnerl, Haindl,
      Klocker, Schilcher, Klausner, Strohmeier, Pircher, Reichmann, Wibmer, Dirnberger, Laßnig, Klingler, Hanser, Knaus, Reinprecht, Steidl, Glück,
      Fellinger, Steiger, Neumayer, Karrer, Pöck, Kalcher, Hell, Thalhammer, Jenewein, Rotter, Schwaighofer, Baldauf, Waltl, Tanzer, Reithofer, Kreidl,
      Hufnagl, Kulmer, Scheidl, Wurzinger, Reicher, Fröschl, Kaindl, Temmel, Köpf, Reif, Bliem, Götz, Praxmarer, Schmidl, Pesendorfer, Meusburger, Dangl,
      Wiesner, Meindl, Hasler, Hummer, Trattner, Sporer, Taucher, Ladner, Schönberger, Neumayr, Klement, Wenzl, Gfrerer, Österreicher, Seiwald, Reisner,
      Veit, Stadlbauer, Stelzl, Bösch, Bär, Kappel, Hausberger, Luttenberger, Brandtner, Nägele, Pendl, Scharinger, Peham, Sulzer, Kraßnitzer, Puntigam,
      Markl, Laimer, Haderer, Gosch, Scherzer, Kropf, Bachinger, Kaltenegger, Lercher, Krobath, Wippel, Dreier, Keplinger, Wilfinger, Widmann, Schrammel,
      Röck, Stromberger, Scherr, Widhalm, Zechmeister, Vallant, Loibl, Hammerer, Bitschnau, Langmann, Feurstein, Mühlberger, Grundner, Schrenk, Gratz,
      Lintner, Ronacher, Riedmann, Schrittwieser, Neurauter, Reinbacher, Kronsteiner, Leber, Krainz, Kircher, Gratzl, Saurer, Rottensteiner, Lerch, Lammer,
      Fetz, Kathrein, Lampert, Ringhofer, Häusler, Hebenstreit, Geier, Punz, Joham, Kämmerer, Grüner, Prodinger, Göschl, Böhler, Salzer, Hotter, Spiegl,
      Wernig, Steinbacher, Bräuer, Feichter, Obermoser, Knabl, Schimpl, Erber, Leiter, Heinzl, Schöffmann, Ferstl, Leibetseder, Wilfling, Neureiter,
      Hettegger, Schuch, Reisenhofer, Riener, Dallinger, Unterrainer, Pfurtscheller, Postl, Gamsjäger, Glanzer, Huter, Fauland, Rehrl, Heger, Holzner,
      Bernsteiner, Gutschi, Berchtold, Parzer, Feichtenschlager, Wohlmuth, Lueger, Feigl, Ramsauer, Zettl, Spitaler, Schwendinger, Pongratz, Kloiber,
      Weingärtner, Reitinger, Hutterer, Leichtfried, Steinacher, Neumüller, Schaufler, Schinagl, Stütz, Suntinger, Gindl, Bierbaumer, Streicher, Taschner,
      Hartinger, Neururer, Duller, Schroll, Jantscher, Schagerl, Rudigier, Salcher, Dolezal, Gamper, Staudacher, Bechter, Gahleitner, Mitterlehner,
      Weinzierl, Hartner, Haßler, Feuerstein, Haiden, Kaltenböck, Prohaska, Bammer, Sampl, Lindorfer, Aldrian, Kalteis, Pachler, Höllerer, Schöller,
      Feichtner, Leonhartsberger, Kendlbacher, Glantschnig, Rabitsch, Grabher, Pröll, Reinthaler, Buchacher, Groiß, Schwarzinger, Schönherr, Frühmann,
      Trauner, Hainzl, Schrattenecker, Legat, Täuber, Graßl, Edler, Ganahl, Exenberger, Ettl, Schmidinger, Rössler, Furtner, Kölbl, Lienbacher, Schweizer,
      Sieber, Ploner, Eckhart, Watzinger, Lanner, Nöbauer, Schönauer, Eiter, Hölbling, Bodner, Wassermann, Kolm, Fischbacher, Granig, Gschaider, Biedermann,
      Wildauer, Weißenbacher, Schandl, Walzl, Wögerbauer, Aichholzer, Hillinger, Krismer, Edinger, Hörl, Haslauer, Riml, Kreutzer, Pfeifenberger, Landl,
      Hofmeister, Hohl, Stoiber, Halper, Matzinger, Radinger, Kobler, Feßl, Rabensteiner, Daum, Dohr, Schellander, Dünser, Bilgeri, Schmidbauer, Heschl,
      Zeiner, Schartner, Flicker, Grünberger, Steinbichler, Maitz, Marth, Dittrich, Paier, Strommer, Trinkl, Fuchsberger, Hochegger, Kobald, Fehringer,
      Ganster, Allmer, Blauensteiner, Hofstetter, Jaritz, Stampfer, Sprenger, Mühlböck, Haumer, Mörtl, Dullnig, Heißenberger`),
    spans: [
      [1940, 2019, w(`
        Franz, Johann, Josef, Karl, Johannes, Michael, Thomas, Andreas, Stefan, Christian, Markus, Martin, Wolfgang, Gerhard, Peter, Robert, Manfred, Helmut,
        Herbert, Walter, Günther, Alfred, Ernst, Friedrich, Hubert, Leopold, Rudolf, Anton, Alois, Florian, Daniel, Philipp, Lukas, David, Matthias, Patrick,
        Dominik, Sebastian, Bernhard, Christoph, Harald, Gernot, Reinhard, Kurt, Erich, Heinz, Werner, Hannes, Klaus, Roland, Rainer, Günter, Siegfried,
        Ferdinand, Georg, Engelbert, Gottfried, Hermann, Kaspar, Wilfried, Wolfram, Raimund, Valentin, Simon, Jakob, Elias, Maximilian, Paul, Felix, Fabian,
        Tobias, Julian, Moritz, Niklas, Benjamin, Clemens, Konstantin, Leonhard, Vinzenz, Severin, Quirin, Lorenz, Kilian, Korbinian, Laurenz, Gregor, Rupert,
        Pius, Willi, Jörg, Gerd, Heimo, Otmar, Othmar, Karlheinz, Hansjörg, Erhard, Hanspeter, Berthold, Hartwig, Gerfried`)],
      [1940, 1989, w(`
        Erwin, Heinrich`)],
      [1940, 1969, w(`
        Adolf, Albin, August, Eduard, Emmerich, Hans, Ignaz, Ludwig, Max, Otto, Theodor, Viktor, Wilhelm, Alfons, Anselm, Augustin, Balthasar, Benedikt,
        Blasius, Bruno, Cyrill, Edmund, Egon, Eugen, Fritz, Gebhard, Gustav, Isidor, Konrad, Lambert, Liborius, Norbert, Oswald, Pankraz, Roman, Silvester,
        Wendelin`)],
      [1960, 2019, w(`
        Alexander`)],
      [1960, 1989, w(`
        Gerald, Mario, Jürgen, Dietmar, Ewald, René, Rene, Mag`)],
      [1980, 2019, w(`
        Benedikt, Raphael, Leon, Jonas, Noah, Luca, Manuel, Marcel, Kevin, Leo, Theo, Emil, Jonathan, Nico, Samuel`)],
    ],
  },
};
