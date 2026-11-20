// =============================================================================
// Namenspools, vierte Stufe – Teil 2: Süd- und Osteuropa, Balkan, Türkei und die
// Familien dieser Herkunft in Deutschland (Erläuterung in data/namePoolsXL.ts).
// =============================================================================
import { w, type XLNames } from './namePoolsXL';

export const XL_SOUTH_EAST: Record<string, XLNames> = {
  ita: {
    last: w(`Amato, Andreoli, Angeli, Barbieri, Basile, Bellini, Benedetti, Bernardi, Bertolini, Bianco, Bonetti, Bruno, Caputo, Carbone, Caruso, Castelli, Cattaneo, Cirillo, Colombo, Conte, Conti, Coppola, Corsi, D'Amico, D'Angelo, De Luca, De Rosa, De Santis, Esposito, Fabbri, Farina, Ferrara, Ferri, Fiore, Fontana, Galli, Gallo, Gatti, Gentile, Giordano, Giuliani, Grassi, Greco, Guerra, Leone, Lombardi, Longo, Mancini, Marchetti, Marini, Martini, Mazza, Messina, Monti, Morelli, Moretti, Neri, Orlando, Pace, Palmieri, Parisi, Pellegrini, Piras, Pozzi, Ricci, Rinaldi, Rizzi, Rizzo, Romano, Ruggiero, Russo, Sala, Sanna, Santoro, Serra, Silvestri, Testa, Valentini, Villa, Vitale, Zanetti, Bassi, Bellucci, Brambilla, Ceccarelli, Donati, Ferrero, Fumagalli, Lucchesi, Mariani, Melis, Negri, Pagano, Pastore, Riva, Sartori, Tosi, Vinci`),
    eras: [
      [0, w(`Aldo, Angelo, Antonio, Armando, Bruno, Carlo, Dino, Enzo, Ettore, Franco, Giacomo, Gianni, Gino, Giorgio, Giovanni, Giuseppe, Guido, Luigi, Mario, Nello, Pietro, Renato, Romano, Sergio, Tullio, Umberto, Vittorio`)],
      [1960, w(`Alberto, Alessandro, Andrea, Antonio, Claudio, Daniele, Fabio, Fabrizio, Francesco, Gianluca, Luca, Marco, Massimo, Maurizio, Michele, Paolo, Roberto, Salvatore, Stefano, Vincenzo, Walter, Domenico`)],
      [1978, w(`Alessio, Andrea, Christian, Cristiano, Daniele, Davide, Emanuele, Federico, Gabriele, Giacomo, Lorenzo, Luca, Manuel, Marco, Matteo, Mattia, Mirko, Nicola, Riccardo, Simone, Stefano, Valerio, Fabio, Marcello`)],
      [1996, w(`Alessandro, Alessio, Andrea, Christian, Davide, Diego, Edoardo, Federico, Filippo, Francesco, Gabriele, Giorgio, Giulio, Jacopo, Leonardo, Lorenzo, Luca, Manuel, Mattia, Michele, Nicolò, Pietro, Riccardo, Samuele, Simone, Tommaso, Kevin`)],
    ],
  },
  esp: {
    last: w(`Aguilar, Alonso, Álvarez, Arias, Benítez, Blanco, Bravo, Caballero, Calvo, Campos, Cano, Carmona, Castillo, Castro, Cortés, Crespo, Cruz, Delgado, Díaz, Diez, Domínguez, Durán, Esteban, Fernández, Ferrer, Flores, Fuentes, Gallego, García, Garrido, Gil, Giménez, Gómez, González, Guerrero, Gutiérrez, Hernández, Herrera, Herrero, Hidalgo, Ibáñez, Iglesias, Jiménez, León, López, Lorenzo, Lozano, Marín, Márquez, Martín, Martínez, Medina, Méndez, Molina, Montero, Mora, Morales, Moreno, Muñoz, Navarro, Nieto, Núñez, Ortega, Ortiz, Pascual, Pastor, Peña, Pérez, Prieto, Ramírez, Ramos, Reyes, Rodríguez, Román, Romero, Rubio, Ruiz, Sáez, Sánchez, Santana, Santiago, Santos, Sanz, Serrano, Soler, Suárez, Torres, Vargas, Vázquez, Vega, Velasco, Vicente, Vidal, Arregui, Echeverría, Etxeberria, Garmendia, Goikoetxea, Larrañaga, Puig, Roca, Vila, Pujol`),
    eras: [
      [0, w(`Agustín, Andrés, Ángel, Antonio, Emilio, Enrique, Eugenio, Felipe, Fernando, Francisco, Ignacio, Jesús, Joaquín, José, Juan, Julián, Luis, Manuel, Miguel, Pedro, Rafael, Ramón, Salvador, Tomás, Vicente`)],
      [1965, w(`Alberto, Alfonso, Carlos, Daniel, Diego, Eduardo, Francisco Javier, Gabriel, Ignacio, Javier, Jorge, José Antonio, José Luis, Juan Carlos, Luis, Manuel, Óscar, Pablo, Ricardo, Roberto, Rubén, Sergio, Txema, Iñaki`)],
      [1985, w(`Adrián, Álvaro, Asier, Borja, Cristian, Daniel, David, Diego, Fernando, Gonzalo, Héctor, Hugo, Ibai, Iker, Iván, Jaime, Jonathan, Jorge, Marcos, Mario, Mikel, Raúl, Rubén, Unai, Víctor, Xavi`)],
      [2000, w(`Aitor, Alejandro, Álex, Ander, Bruno, Dani, Eric, Gerard, Hugo, Izan, Jan, Joel, Jon, Leo, Lucas, Manuel, Marc, Martín, Mateo, Nico, Nil, Pau, Pol, Rodrigo, Samuel, Thiago, Unai, Yeray`)],
    ],
  },
  por: {
    last: w(`Almeida, Alves, Amaral, Antunes, Araújo, Azevedo, Baptista, Barbosa, Barros, Batista, Borges, Branco, Brito, Cabral, Caldeira, Campos, Cardoso, Carneiro, Carvalho, Castro, Coelho, Correia, Costa, Cruz, Cunha, Dias, Domingues, Duarte, Esteves, Faria, Fernandes, Ferreira, Figueiredo, Fonseca, Freitas, Gaspar, Gomes, Gonçalves, Guerreiro, Henriques, Jesus, Leal, Leite, Lima, Lopes, Lourenço, Machado, Magalhães, Marques, Martins, Matos, Medeiros, Melo, Mendes, Miranda, Monteiro, Morais, Moreira, Mota, Moura, Nogueira, Nunes, Oliveira, Pacheco, Paiva, Pereira, Pinheiro, Pinto, Pires, Ramos, Reis, Ribeiro, Rocha, Rodrigues, Santos, Sequeira, Silva, Simões, Soares, Sousa, Tavares, Teixeira, Valente, Vaz, Vieira, Xavier`),
    eras: [
      [0, w(`Abel, Alberto, Américo, António, Armando, Artur, Augusto, Carlos, Fernando, Francisco, Henrique, Jaime, Joaquim, Jorge, José, Júlio, Manuel, Mário, Raul, Vítor, Virgílio`)],
      [1965, w(`Álvaro, Carlos, Fernando, Hélder, Hugo, João, Jorge, José, Luís, Manuel, Mário, Nuno, Paulo, Pedro, Ricardo, Rui, Sérgio, Vítor, Bruno, Tiago`)],
      [1985, w(`André, Bruno, Daniel, Diogo, Fábio, Filipe, Gonçalo, Hugo, João, Luís, Marco, Miguel, Nélson, Nuno, Pedro, Ricardo, Rúben, Sérgio, Tiago, Vítor, Ivo, Renato`)],
      [2000, w(`Afonso, Diogo, Duarte, Francisco, Gonçalo, Guilherme, Gustavo, Henrique, Lourenço, Martim, Rafael, Rodrigo, Salvador, Santiago, Simão, Tomás, Vasco, Dinis, Tiago, Leonardo`)],
    ],
  },
  gre: {
    last: w(`Alexiou, Anagnostou, Angelopoulos, Antoniou, Christodoulou, Dimitriou, Georgiou, Ioannou, Karagiannis, Karamanlis, Katsaros, Konstantinou, Kostopoulos, Kyriakou, Makris, Michailidis, Nikolaou, Oikonomou, Panagiotou, Papadakis, Papadimitriou, Papadopoulos, Papageorgiou, Papanikolaou, Pappas, Petrou, Sotiriou, Stavrou, Theodorou, Tsakiris, Vasileiou, Vlachos, Zervas, Athanasiou, Galanis, Chatzis, Lambrou, Mavridis, Raptis, Samaras, Spanos, Triantafyllou`),
    eras: [[0, w(`Andreas, Christos, Dimitris, Georgios, Giannis, Kostas, Nikos, Panagiotis, Spyros, Stavros, Thanasis, Vasilis, Antonis, Michalis, Stelios`)],
      [1975, w(`Alexandros, Angelos, Charalambos, Christos, Dimitrios, Evangelos, Giorgos, Ilias, Ioannis, Konstantinos, Lazaros, Manolis, Nikolaos, Panagiotis, Sotiris, Theofanis, Vangelis`)],
      [1995, w(`Anastasios, Apostolos, Aris, Charis, Dimitris, Fotis, Giannis, Kyriakos, Marios, Nikolas, Odysseas, Pantelis, Petros, Stefanos, Tasos, Thodoris`)]],
  },
  pol: {
    last: w(`Adamczyk, Baran, Błaszczyk, Borkowski, Chmielewski, Czarnecki, Dąbrowski, Dudek, Duda, Głowacki, Górski, Grabowski, Jabłoński, Jakubowski, Jankowski, Jasiński, Kaczmarek, Kalinowski, Kamiński, Kołodziej, Kowalczyk, Kowalewski, Kozłowski, Krajewski, Krawczyk, Król, Kubiak, Kwiatkowski, Lis, Majewski, Makowski, Malinowski, Marciniak, Mazur, Michalski, Mróz, Nowakowski, Olszewski, Ostrowski, Pawlak, Pawłowski, Pietrzak, Piotrowski, Rutkowski, Sadowski, Sikora, Sobczak, Sokołowski, Stępień, Szczepański, Szewczyk, Tomaszewski, Walczak, Wieczorek, Witkowski, Wojciechowski, Wróbel, Wysocki, Zając, Zalewski, Zawadzki, Ziółkowski, Żak`),
    eras: [[0, w(`Andrzej, Antoni, Bogdan, Czesław, Edward, Henryk, Jan, Jerzy, Józef, Kazimierz, Marian, Stanisław, Stefan, Tadeusz, Władysław, Zbigniew, Zdzisław, Ryszard`)],
      [1960, w(`Andrzej, Dariusz, Grzegorz, Jacek, Janusz, Krzysztof, Leszek, Marek, Mirosław, Paweł, Piotr, Robert, Roman, Tomasz, Waldemar, Wiesław, Włodzimierz, Zbigniew`)],
      [1980, w(`Adam, Artur, Bartosz, Damian, Dawid, Grzegorz, Kamil, Krystian, Łukasz, Maciej, Marcin, Mariusz, Michał, Paweł, Przemysław, Radosław, Rafał, Sebastian, Sławomir, Wojciech`)],
      [1998, w(`Adrian, Aleksander, Antoni, Bartłomiej, Dominik, Filip, Hubert, Igor, Jakub, Jan, Kacper, Karol, Mateusz, Mikołaj, Oskar, Patryk, Szymon, Wiktor, Kamil, Krzysztof`)]],
  },
  cze: {
    last: w(`Bartoš, Beneš, Bláha, Čech, Černý, Doležal, Dušek, Dvořák, Fiala, Hájek, Havel, Holub, Horák, Hruška, Jelínek, Kadlec, Kolář, Konečný, Kopecký, Kos, Kovář, Kratochvíl, Kříž, Kučera, Malý, Mareš, Marek, Matoušek, Navrátil, Němec, Novotný, Pokorný, Pospíšil, Procházka, Růžička, Sedláček, Šimek, Soukup, Svoboda, Štěpánek, Sýkora, Tichý, Urban, Valenta, Vávra, Veselý, Vlček, Zeman, Kohout, Kubíček, Hrubý, Nový, Polák, Říha`),
    eras: [[0, w(`Antonín, Bohumil, František, Jan, Jaroslav, Jindřich, Jiří, Josef, Karel, Ladislav, Miloslav, Miroslav, Oldřich, Stanislav, Václav, Vladimír, Zdeněk`)],
      [1965, w(`Aleš, Daniel, David, Jan, Jaroslav, Jiří, Libor, Luboš, Marek, Martin, Michal, Miroslav, Pavel, Petr, Radek, Roman, Tomáš, Vladimír, Zdeněk, Vratislav`)],
      [1988, w(`Adam, Dominik, Filip, Jakub, Jan, Jiří, Josef, Lukáš, Matěj, Michal, Ondřej, Patrik, Petr, Tomáš, Vojtěch, Václav, David, Daniel, Šimon`)]],
  },
  hun: {
    last: w(`Antal, Bakó, Balázs, Balog, Bodnár, Bognár, Boros, Csizmadia, Deák, Farkas, Fazekas, Fekete, Fodor, Gál, Gulyás, Hajdu, Halász, Horváth, Juhász, Kardos, Katona, Kelemen, Kis, Kiss, Kocsis, Kovács, Lakatos, László, Lukács, Major, Mészáros, Molnár, Nagy, Németh, Oláh, Orosz, Pál, Papp, Pásztor, Péter, Pintér, Rácz, Sándor, Simon, Somogyi, Szabó, Szalai, Szekeres, Szilágyi, Szücs, Takács, Tóth, Török, Varga, Vincze, Vörös`),
    eras: [[0, w(`András, Antal, Ernő, Ferenc, Gábor, Géza, György, Gyula, Imre, István, János, József, Károly, Lajos, László, Mihály, Miklós, Sándor, Tibor, Zoltán`)],
      [1965, w(`Attila, Csaba, Gábor, György, Imre, István, János, József, Károly, László, Péter, Róbert, Sándor, Tamás, Tibor, Zoltán, Zsolt, Ferenc`)],
      [1988, w(`Ádám, Balázs, Bence, Dániel, Dávid, Gergely, Krisztián, Levente, Máté, Márk, Milán, Norbert, Patrik, Péter, Richárd, Roland, Tamás, Zsombor`)]],
  },
  rus: {
    last: w(`Abramov, Alekseev, Andreev, Antonov, Belov, Bogdanov, Bondarenko, Borisov, Danilov, Egorov, Filippov, Fomin, Frolov, Gavrilov, Golubev, Gusev, Ilyin, Kiselev, Klimov, Komarov, Korolev, Kozlov, Krylov, Kuzmin, Kuznetsov, Lebedev, Makarov, Matveev, Medvedev, Mikhailov, Morozov, Nikitin, Nikolaev, Novikov, Orlov, Pavlov, Petrov, Polyakov, Popov, Romanov, Semenov, Sergeev, Smirnov, Sokolov, Solovyov, Stepanov, Tarasov, Titov, Vasiliev, Vinogradov, Volkov, Vorobyov, Yakovlev, Zaitsev, Zakharov, Zhukov`),
    eras: [[0, w(`Aleksandr, Anatoli, Boris, Gennadi, Igor, Juri, Leonid, Mikhail, Nikolai, Oleg, Pjotr, Sergei, Valeri, Viktor, Vladimir, Wassili, Juri, Jewgeni`)],
      [1965, w(`Aleksei, Andrei, Dmitri, Gennadi, Igor, Jewgeni, Konstantin, Michail, Oleg, Pawel, Roman, Sergei, Stanislaw, Wadim, Waleri, Viktor, Wladislaw`)],
      [1988, w(`Aleksandr, Anton, Artjom, Danila, Denis, Dmitri, Ilja, Iwan, Kirill, Maksim, Nikita, Pawel, Roman, Stanislaw, Wladimir, Jegor, Fjodor, Daniil`)]],
  },
  yug: {
    last: w(`Antić, Bogdanović, Bošković, Cvetković, Đukić, Filipović, Ivanović, Janković, Jovanović, Kostić, Krstić, Lazarević, Lukić, Marinković, Matić, Milenković, Milošević, Mitrović, Nedeljković, Obradović, Pavlović, Perišić, Radović, Ristić, Savić, Simić, Stanković, Stevanović, Tadić, Todorović, Vasić, Vučković, Živković, Hodžić, Mehmedović, Begić, Hadžić, Hasanović, Omerović, Šarić`),
    eras: [[0, w(`Branislav, Dragoljub, Dušan, Ilija, Ivica, Josip, Miloš, Momčilo, Nikola, Petar, Radomir, Stevan, Vladimir, Vujadin, Zvonko, Velibor, Safet`)],
      [1960, w(`Admir, Darko, Dejan, Dragan, Goran, Ivan, Mirko, Nebojša, Nenad, Saša, Srđan, Zoran, Željko, Mladen, Ljubomir, Faruk`)]],
  },
  cro: {
    last: w(`Antolić, Barišić, Blažević, Bošnjak, Brkić, Bubalo, Ćorić, Galić, Grgić, Kovač, Lovrić, Lučić, Matić, Mikulić, Mlinarić, Pavić, Perković, Petrović, Radić, Rukavina, Šimić, Tomić, Vidović, Vukić, Živković, Božić, Jukić, Knežević, Marković, Pranjić, Rogić, Šarić, Vrdoljak, Zubak`),
    eras: [[0, w(`Ante, Branko, Davor, Dražen, Franjo, Ivica, Josip, Krunoslav, Mladen, Slaven, Stipe, Tomislav, Zlatko, Zvonimir, Vlatko`)],
      [1980, w(`Antonio, Bruno, Domagoj, Dominik, Filip, Ivan, Ivo, Karlo, Lovro, Luka, Marin, Mateo, Mislav, Nikola, Petar, Stjepan, Tin, Toni`)]],
  },
  srb: {
    last: w(`Aleksić, Andrić, Babić, Đorđević, Gajić, Ilić, Jakovljević, Jović, Kovačević, Marić, Milić, Milovanović, Nikolić, Pavlović, Petković, Radosavljević, Spasić, Stojković, Tošić, Vidić, Vukašinović, Zdravković, Gavrilović, Mladenović, Novaković, Rakić, Stanojević`),
    eras: [[0, w(`Bora, Dragan, Dušan, Ljubiša, Milan, Miloš, Miodrag, Nikola, Radivoje, Slobodan, Stevan, Vladimir, Živorad`)],
      [1980, w(`Aleksandar, Andrija, Bogdan, Filip, Lazar, Luka, Marko, Mihajlo, Miloš, Nemanja, Nikola, Ognjen, Stefan, Strahinja, Uroš, Vuk, Veljko`)]],
  },
  tur: {
    last: w(`Akbaş, Akgül, Akman, Aktaş, Altıntaş, Arıkan, Aslan, Ateş, Avcı, Aydoğan, Başaran, Bozkurt, Çakır, Çetin, Demirci, Doğru, Durmaz, Eker, Erdem, Erol, Gök, Gündoğdu, Güneş, Gürbüz, İnce, Kara, Karakaya, Kaplan, Kartal, Kılınç, Koç, Kocabaş, Kurt, Metin, Önal, Özcan, Özdemir, Özgür, Polat, Sağlam, Şen, Şimşek, Soylu, Taş, Taşkın, Temiz, Toprak, Turan, Uysal, Uzun, Yalçın, Yaman, Yavuz, Yazıcı, Yıldırım, Yücel`),
    eras: [[0, w(`Ahmet, Ali, Cemil, Erol, Fatih, Hasan, Hüseyin, İsmail, Kemal, Mehmet, Metin, Mustafa, Necati, Nihat, Osman, Ramazan, Selçuk, Tanju, Turgay, Yusuf`)],
      [1975, w(`Abdullah, Ahmet, Arif, Bülent, Cem, Emre, Ercan, Erdal, Gökhan, Hakan, Kerem, Levent, Murat, Okan, Ömer, Serkan, Sinan, Tolga, Tuncay, Ümit`)],
      [1995, w(`Alper, Arda, Barış, Berkay, Burak, Cengiz, Doğukan, Efe, Emir, Enes, Furkan, Kaan, Kerem, Mert, Oğuz, Ozan, Semih, Yasin, Yiğit, Yunus`)]],
  },
  ger_tr: {
    last: w(`Akdağ, Altun, Aras, Atalay, Aydemir, Bilgin, Bozkurt, Çakmak, Çelebi, Dağ, Demirtaş, Doğan, Ekici, Erdoğdu, Güven, Kaplan, Karadağ, Kaya, Koçak, Kurt, Öner, Özkan, Polat, Sağlam, Şahin, Tekin, Tosun, Turan, Uçar, Yaşar, Yıldırım, Yurt`),
    eras: [[1985, w(`Ahmet, Ali, Burak, Cihan, Deniz, Engin, Erkan, Gökhan, Hakan, Kemal, Mustafa, Okan, Onur, Serdar, Tayfun, Volkan`)],
      [2000, w(`Ali, Arda, Aykut, Batuhan, Berat, Can, Eren, Kaan, Mert, Muhammed, Mustafa, Onur, Tarık, Yusuf, Emir, Elias`)]],
  },
  ger_pl: {
    last: w(`Banaszak, Bednarek, Czech, Dudek, Gajewski, Górecki, Grzelak, Jankowski, Kowalczyk, Kubiak, Lewandowski, Michalak, Nowicki, Pawlak, Sobczak, Wiśniewski, Wójcik, Zając, Kaczmarek, Koziol, Krol, Mazurek`),
  },
  ger_it: {
    last: w(`Amato, Barbieri, Bianchi, Caruso, Colombo, Conti, De Luca, Esposito, Ferrara, Gallo, Greco, Lombardi, Mancini, Marino, Moretti, Rizzo, Romano, Russo, Santoro, Vitale, Messina, Ricci`),
  },
  ger_yu: {
    last: w(`Babić, Bašić, Begić, Božić, Delić, Hadžić, Ivanović, Jurić, Kovačević, Lukić, Marić, Mehić, Nikolić, Pavlović, Petrović, Radić, Šarić, Stojanović, Tomić, Vuković`),
  },
  ger_af: {
    last: w(`Abiodun, Adjei, Akpan, Ansah, Badu, Bamba, Coulibaly, Diarra, Effiong, Eze, Fofana, Kamara, Koné, Kouassi, Mbeki, Nwachukwu, Ofori, Okeke, Oyelaran, Quaye, Sesay, Tetteh, Yeboah`),
  },
};
