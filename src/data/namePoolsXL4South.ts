// =============================================================================
// Namenspools, fünfte Stufe (Wunsch Pascal: „immer noch zu viele doppelte Namen –
// vervierfache die Anzahl der verfügbaren Namen“). Aufbau wie data/namePoolsXL.ts
// (`XLNames`: last, first, eras = [ab Geburtsjahr, Vornamen]); eingemischt in
// data/origins.ts über `mergeXL` nach der vierten Stufe. Nur in der Bevölkerung
// häufige Namen, keine bekannten Fußballer-Paare.
// Teil Süd: Italien, Spanien, Portugal, Griechenland, Türkei + Familien dieser
// Herkunft in Deutschland; Ost-/Südosteuropa in data/namePoolsXL4South2.ts.
// Nachnamen nach den Häufigkeitslisten (ISTAT/Telefonbuch-Rangfolgen je Region,
// INE „apellidos más frecuentes“ samt Autonomien, INE-PT/IRN, Rangfolgen der
// häufigsten griechischen Familiennamen, TÜİK/Nüfus-Rangfolgen), Vornamen nach
// Geburtsjahrzehnt (ISTAT „nomi più diffusi“, INE nach Jahrzehnt, IRN, TÜİK).
// Regionale Vielfalt: Italien Nord/Mitte/Süd/Sizilien/Sardinien; Spanien mit
// katalanischen, baskischen, galicischen und kanarischen Namen; Türkei mit
// Schwarzmeer-, Ost- und Südostanatolien.
// =============================================================================
import { w, type XLNames } from './namePoolsXL';
import { XL4_SOUTH2 } from './namePoolsXL4South2';

/** Listen zusammenführen, ohne Dubletten. */
const u = (...l: string[][]): string[] => [...new Set(l.flat())];

// --- Italien -------------------------------------------------------------------
const IT_NORD = w(`Agostini, Airoldi, Alberti, Arrigoni, Baldini, Baroni, Bassani, Battaglia, Benini, Beretta, Bergamaschi, Bernasconi, Bertoli,
  Bettini, Bianchini, Biondi, Boldrini, Bonfanti, Bonomi, Borghi, Bortolotti, Boschetti, Bosio, Bottazzi, Bovo, Brunetti, Bruni, Camozzi, Canova,
  Capra, Carrara, Casati, Castagna, Cavalli, Ceriani, Colombi, Comi, Corti, Crippa, Dal Bello, Dalla Costa, Dal Molin, De Marchi, Fabbris, Facchini,
  Fava, Favaro, Ferrarese, Ferrario, Fiorini, Fontanella, Formenti, Franzoni, Frigerio, Galbiati, Gallina, Garbin, Gasparini, Gatto, Ghezzi,
  Ghirardi, Giacomelli, Gobbi, Grandi, Guerrini, Lazzari, Lazzarini, Longhi, Lorenzi, Lunardi, Maggi, Magnani, Magni, Malvezzi, Mantovani,
  Marchesi, Marchi, Marcon, Meneghetti, Merlo, Milani, Molinari, Mondini, Montanari, Morandi, Moro, Nava, Negrini, Nicoletti, Orsini, Pagani,
  Panzeri, Pasini, Pavan, Perego, Perini, Piazza, Pietrobon, Pirola, Pizzi, Poli, Porro, Pozzoli, Prandi, Previtali, Rampazzo, Ravasi, Redaelli,
  Rigamonti, Rigoni, Rocca, Ronchi, Rota, Ruggeri, Salvi, Santini, Scotti, Severi, Signorini, Sironi, Sola, Soldati, Spinelli, Stefani,
  Tagliabue, Tedeschi, Tonelli, Toso, Trevisan, Turra, Valli, Vanoni, Venturi, Viganò, Visentin, Zago, Zanella, Zanini, Zanon, Zanotti, Zecchin,
  Zennaro, Zorzi, Zuliani, Bonazzi, Bortolin, Bragato, Carraro, Cecchinato, Dalla Valle, De Bortoli, Furlan, Michelon, Pellizzari, Sartor,
  Zamboni, Zanin, Canepa, Repetto, Ferrando, Traverso, Olivieri, Gaggero, Piana, Bruzzone, Rebora, Bertola, Bosco, Cravero, Giraudo, Barbero,
  Bonino, Marengo, Rosso, Revelli, Audisio, Benassi, Bonacini, Ferretti, Guidetti, Malagoli, Manfredini, Montecchi, Zanni, Righi, Fantini,
  Casadei, Righetti, Zoffoli, Gardini, Pedrotti, Tomasi, Bertoldi, Zeni, Cristofori, Leonardi, Del Fabbro, Zanier, Cargnelutti, Tomasin`);
const IT_MITTE = w(`Bacci, Baldi, Bandini, Bartolini, Bellandi, Benvenuti, Bertini, Biagini, Bindi, Cappelli, Cecchi, Ciampi, Del Bianco, Fabbrini,
  Fiaschi, Frosini, Giannini, Giorgetti, Gori, Guidi, Innocenti, Lenzi, Lotti, Mariotti, Mazzei, Meucci, Nardi, Niccolai, Pacini, Pagni, Paoli,
  Paolini, Pieri, Pucci, Salvadori, Sani, Santi, Tognetti, Vannucci, Vannini, Bigi, Bartolucci, Carletti, Cerioni, Mancinelli, Marinelli, Pierini,
  Rossini, Sabbatini, Santarelli, Tittarelli, Cipriani, Proietti, Mattei, Felici, Ciani, Paolucci, Crescenzi, Di Carlo, Sciarra, Fiorentini,
  Federici, Iacobelli, Di Giacomo, Di Marco, D'Alessandro, D'Amato, Di Pietro, Di Lorenzo, Di Berardino, Di Domenico, Ianni, Iannetti, Ciccone,
  Di Felice, Di Nardo, Di Paolo, Ciccarelli, Angelini, Antonelli, Carli, Cesari, Corsini, Cristiani, De Angelis, Fabiani, Giordani, Martinelli,
  Mazzoni, Raimondi, Sabatini, Valenti, Vitali, Ventura, Romagnoli, Marchesini, Guarnieri, Grimaldi`);
const IT_SUED = w(`Ambrosio, Annunziata, Aprea, Cacace, Capasso, Cozzolino, De Simone, Iovine, Langella, Maiello, Manzo, Marrazzo, Napolitano, Perna,
  Scognamiglio, Sorrentino, Tortora, Vitiello, Ferraro, Formisano, Di Costanzo, Liguori, Iorio, Improta, Imparato, Ascione, Cuomo, D'Auria,
  Guarino, Avallone, Lorusso, De Palma, Loiacono, Colonna, Palmisano, Ricciardi, Carella, Catalano, D'Errico, Lattanzio, Montanaro, Quarta,
  De Giorgi, Martina, Calò, Pascali, Morabito, Barbaro, Romeo, Marra, Arena, Commisso, Laganà, Pugliese, Rotundo, Spanò, Zappia, Cosentino,
  Albanese, Amoroso, Barone, Benedetto, Bellomo, Calabrò, Capuano, Carlucci, Carrozza, Castellano, Cavallo, Colella, D'Agostino, D'Ambrosio,
  De Blasi, De Carlo, De Martino, De Vita, Del Prete, Di Bella, Di Benedetto, Di Biase, Di Gregorio, Di Leo, Di Napoli, Di Salvo, Fasano,
  Fiorentino, Galante, Gargiulo, Lanza, Lupo, Morello, Nardone, Palma, Pellegrino, Pepe, Pesce, Piccolo, Pinto, Riccio, Rinaldo, Ruggieri,
  Salerno, Santangelo, Scala, Schiavone, Spina, Vecchio, Zito, Calabrese, Mazzeo, Esposti, Cirillo, Cerullo, Sepe, Pagliaro, Russomanno`);
const IT_SIZ = w(`Lombardo, La Rosa, Lo Presti, Lo Giudice, Puglisi, Scalia, Licata, Musumeci, Di Mauro, Pappalardo, Cavallaro, Sciacca, Giuffrida,
  Spadaro, Cammarata, Lo Bue, Maltese, La Spina, Lo Cascio, Pirrone, Arcidiacono, Cusumano, Di Stefano, Ferrante, Sottile, Cascio, Marchese,
  Catania, Scuderi, Nicolosi, Randazzo, Cannizzaro, Messineo, La Mantia, Platania, Distefano, Leotta, Torrisi, Raciti, Signorello`);
const IT_SARD = w(`Pinna, Porcu, Mura, Usai, Murgia, Floris, Cocco, Carta, Deiana, Loi, Lai, Fadda, Pisanu, Pintus, Contu, Mele, Marras, Cossu,
  Spanu, Sechi, Dessì, Cabras, Atzeni, Orrù, Puddu, Zedda, Corda, Saba, Uras, Arca, Piga, Satta, Tolu, Manca, Murru, Pili`);
const ITA = u(IT_NORD, IT_MITTE, IT_SUED, IT_SIZ, IT_SARD);

const IT_E0 = w(`Giuseppe, Giovanni, Antonio, Mario, Luigi, Francesco, Angelo, Vincenzo, Pietro, Salvatore, Carlo, Franco, Domenico, Bruno, Paolo,
  Michele, Giorgio, Aldo, Sergio, Luciano, Renato, Alberto, Enzo, Raffaele, Gino, Umberto, Ettore, Guido, Lino, Italo, Dino, Nino, Gaetano, Rocco,
  Pasquale, Gennaro, Carmine, Ciro, Rosario, Vito, Sebastiano, Natale, Nicola, Arturo, Attilio, Augusto, Cesare, Corrado, Dante, Edoardo, Elio,
  Emilio, Ennio, Enrico, Ernesto, Ezio, Fausto, Felice, Ferdinando, Ferruccio, Filippo, Flavio, Fulvio, Gastone, Gerardo, Giacomo, Gianfranco,
  Giancarlo, Gilberto, Giulio, Guglielmo, Ignazio, Lorenzo, Livio, Lucio, Marcello, Mariano, Marino, Massimo, Mauro, Nazzareno, Nello, Oreste,
  Orlando, Osvaldo, Ottavio, Piero, Pierino, Primo, Remo, Renzo, Rino, Riccardo, Rodolfo, Rolando, Romolo, Ruggero, Sabatino, Saverio, Severino,
  Silvano, Silvio, Tito, Tommaso, Ugo, Valentino, Valerio, Vittorio, Walter, Adriano, Agostino, Alfredo, Amedeo, Arnaldo, Armando, Bernardo,
  Calogero, Carmelo, Cosimo, Damiano, Egidio, Emanuele, Eugenio, Fernando, Gianni, Giuliano, Germano, Martino, Orazio, Pio, Raimondo, Santo,
  Secondo, Stefano, Teodoro, Tullio, Amerigo, Biagio, Fiorenzo, Giordano, Graziano, Gavino, Efisio, Antonino, Alfio, Settimio, Ivo, Ivano`);
const IT_E1950 = w(`Giuseppe, Giovanni, Antonio, Mario, Franco, Roberto, Paolo, Luigi, Francesco, Sergio, Claudio, Giorgio, Bruno, Angelo, Carlo,
  Vincenzo, Salvatore, Pietro, Maurizio, Gianni, Massimo, Marco, Stefano, Fabrizio, Luciano, Alberto, Enzo, Renato, Domenico, Michele, Gianfranco,
  Giancarlo, Piero, Pierluigi, Pierpaolo, Gianpiero, Gianluigi, Giampaolo, Walter, Adriano, Aldo, Alessandro, Alfredo, Andrea, Antonello,
  Armando, Daniele, Dario, Diego, Edoardo, Elio, Emilio, Enrico, Ernesto, Ezio, Fausto, Fernando, Flavio, Fulvio, Gabriele, Gaetano, Gennaro,
  Gerardo, Giacomo, Giuliano, Giulio, Graziano, Guido, Ivano, Lamberto, Lorenzo, Luca, Marcello, Mariano, Marino, Mauro, Nicola, Orlando,
  Pasquale, Raffaele, Renzo, Riccardo, Rocco, Rodolfo, Romano, Rosario, Sandro, Silvano, Silvio, Tiziano, Tommaso, Ugo, Umberto, Valerio,
  Vittorio, Vito, Carmine, Ciro, Cosimo, Leonardo, Ruggero, Sebastiano, Ottavio, Lucio, Loris, Moreno, Oscar, Ivo, Eugenio, Fabio, Felice,
  Filippo, Gilberto, Italo, Lino, Nazzareno, Primo, Corrado, Damiano, Dino, Ettore, Franco, Germano, Gino, Nino, Oreste, Remo, Rino, Calogero,
  Antonino, Carmelo, Biagio, Agostino`);
const IT_E1960 = w(`Massimo, Roberto, Paolo, Stefano, Andrea, Marco, Maurizio, Fabrizio, Alessandro, Luca, Claudio, Giuseppe, Antonio, Francesco,
  Giovanni, Mario, Fabio, Daniele, Gianluca, Riccardo, Alberto, Davide, Simone, Emanuele, Massimiliano, Gianni, Franco, Sergio, Giorgio, Carlo,
  Luigi, Salvatore, Vincenzo, Pietro, Michele, Raffaele, Domenico, Angelo, Enrico, Federico, Gabriele, Giacomo, Lorenzo, Marcello, Mauro, Nicola,
  Piero, Pierluigi, Gianpiero, Gianfranco, Giancarlo, Walter, Sandro, Dario, Diego, Ivan, Ivano, Cristiano, Christian, Moreno, Mirko, Fulvio,
  Gianmarco, Gianpaolo, Leonardo, Luciano, Matteo, Ottavio, Renato, Rocco, Rosario, Ruggero, Silvio, Tiziano, Tommaso, Ugo, Valerio, Vittorio,
  Vito, Adriano, Aldo, Antonello, Armando, Carmine, Ciro, Corrado, Cosimo, Dino, Edoardo, Elio, Emilio, Ermanno, Ettore, Fausto, Filippo, Flavio,
  Gaetano, Gennaro, Germano, Giuliano, Giulio, Graziano, Guido, Igor, Lucio, Marino, Mariano, Orlando, Oscar, Pasquale, Romeo, Sebastiano,
  Silvano, Umberto, Rodolfo, Loris, Gerardo, Leandro, Renzo, Raimondo, Danilo, Denis, Alessio, Bruno, Pierpaolo, Antonino, Calogero, Carmelo,
  Damiano, Eugenio, Alfredo, Sabino`);
const IT_E1970 = w(`Andrea, Marco, Alessandro, Luca, Matteo, Stefano, Simone, Francesco, Davide, Daniele, Massimo, Roberto, Paolo, Fabio, Christian,
  Cristian, Gianluca, Emanuele, Federico, Riccardo, Alessio, Antonio, Giuseppe, Giovanni, Fabrizio, Maurizio, Mirko, Manuel, Diego, Domenico,
  Gabriele, Giacomo, Ivan, Lorenzo, Luigi, Massimiliano, Mattia, Michele, Nicola, Pietro, Salvatore, Vincenzo, Valerio, Valentino, Alberto,
  Angelo, Carlo, Claudio, Dario, Denis, Enrico, Filippo, Giorgio, Giulio, Igor, Jacopo, Leonardo, Marcello, Mario, Mauro, Nicolò, Omar,
  Raffaele, Samuele, Sergio, Tommaso, Walter, Alex, Thomas, Michael, Cristiano, Gianmarco, Gianni, Graziano, Luciano, Moreno, Nicolas, Paride,
  Pierluigi, Rocco, Rosario, Sandro, Silvio, Tiziano, Vittorio, Vito, Ciro, Carmine, Gaetano, Gennaro, Pasquale, Antonello, Alfonso, Arturo,
  Danilo, Dino, Edoardo, Elia, Ettore, Fausto, Flavio, Franco, Gerardo, Giampiero, Gianpaolo, Guido, Lucio, Manuele, Marino, Mariano, Nazario,
  Orazio, Oscar, Piero, Renato, Ruggero, Sebastiano, Ugo, Umberto, Yuri, Antonino, Calogero, Cosimo, Damiano, Emiliano, Pierpaolo, Loris`);
const IT_E1980 = w(`Andrea, Marco, Alessandro, Luca, Matteo, Francesco, Simone, Davide, Daniele, Federico, Stefano, Riccardo, Lorenzo, Fabio,
  Gabriele, Giuseppe, Antonio, Giovanni, Emanuele, Alessio, Mattia, Nicola, Michele, Christian, Cristian, Manuel, Paolo, Roberto, Massimo, Mirko,
  Diego, Dario, Enrico, Filippo, Giacomo, Jacopo, Leonardo, Luigi, Marcello, Mario, Nicolò, Pietro, Salvatore, Samuele, Tommaso, Valerio,
  Vincenzo, Alberto, Angelo, Carlo, Claudio, Domenico, Edoardo, Elia, Fabrizio, Gianluca, Giorgio, Giulio, Ivan, Kevin, Maurizio, Mauro, Omar,
  Raffaele, Sergio, Thomas, Umberto, Valentino, Vittorio, Alex, Denis, Igor, Michael, Nicolas, Yuri, Daniel, David, Gianmarco, Luciano, Manuele,
  Pierluigi, Rocco, Rosario, Sebastiano, Walter, Ciro, Gennaro, Pasquale, Carmine, Gaetano, Antonino, Calogero, Alfonso, Arturo, Cosimo, Fausto,
  Franco, Guido, Lucio, Marino, Nazario, Orazio, Ottavio, Renato, Sandro, Silvio, Teodoro, Tiziano, Vito, Dennis, Jonathan, Patrick, Loris,
  Fabiano, Moreno, Emiliano, Massimiliano, Damiano, Elio, Ettore, Flavio, Ruben, Cristiano, Danilo, Gerardo, Giampaolo, Mariano, Paride`);
const IT_E1990 = w(`Andrea, Alessandro, Matteo, Lorenzo, Luca, Marco, Francesco, Simone, Davide, Federico, Riccardo, Gabriele, Daniele, Mattia,
  Stefano, Tommaso, Nicolò, Niccolò, Alessio, Edoardo, Giacomo, Filippo, Leonardo, Jacopo, Giuseppe, Antonio, Giovanni, Emanuele, Pietro,
  Michele, Nicola, Christian, Cristian, Manuel, Samuele, Elia, Valerio, Fabio, Diego, Enrico, Giulio, Vincenzo, Salvatore, Alberto, Paolo,
  Roberto, Mirko, Kevin, Mario, Luigi, Dario, Domenico, Claudio, Angelo, Raffaele, Carlo, Giorgio, Massimo, Thomas, Denis, Alex, Michael,
  Nicolas, Gianluca, Gianmarco, Damiano, Ivan, Omar, Marcello, Sebastiano, Vittorio, Umberto, Valentino, Ettore, Emiliano, Fabrizio, Maurizio,
  Mauro, Sergio, Daniel, David, Jonathan, Patrick, Gioele, Leandro, Luciano, Tiziano, Rocco, Ciro, Gennaro, Pasquale, Antonino, Carmine,
  Gaetano, Cosimo, Rosario, Alfonso, Arturo, Brian, Dennis, Erik, Ludovico, Achille, Cesare, Pierpaolo, Eugenio, Flavio, Igor, Ruben,
  Christopher, Yuri, Samuel, Manuele, Elio, Ottavio, Orazio, Calogero, Massimiliano, Cristiano, Lapo, Giuliano, Matias, Raffaello`);
const IT_E2000 = w(`Lorenzo, Alessandro, Andrea, Matteo, Francesco, Leonardo, Gabriele, Riccardo, Tommaso, Mattia, Davide, Federico, Luca, Marco,
  Edoardo, Giuseppe, Antonio, Simone, Pietro, Giovanni, Nicolò, Niccolò, Christian, Samuele, Filippo, Diego, Alessio, Michele, Emanuele,
  Jacopo, Elia, Daniele, Stefano, Manuel, Giulio, Gioele, Vincenzo, Salvatore, Cristian, Enrico, Domenico, Giacomo, Raffaele, Kevin, Thomas,
  Nicola, Luigi, Mario, Paolo, Claudio, Ettore, Achille, Giorgio, Emiliano, Valerio, Sebastiano, Dario, Damiano, Angelo, Carlo, Vittorio,
  Ludovico, Cesare, Gianmarco, Alberto, Fabio, Roberto, Daniel, David, Samuel, Mathias, Mattias, Raffaello, Ruben, Denis, Alex, Michael,
  Nicolas, Brian, Christopher, Jonathan, Patrick, Erik, Cristiano, Giuliano, Lapo, Rocco, Ciro, Gennaro, Pasquale, Antonino, Carmine, Gaetano,
  Cosimo, Rosario, Noah, Elio, Enea, Ivan, Massimo, Manuele, Leandro, Igor, Giosuè, Gianluca, Umberto, Arturo, Gabriel, Valentino, Marcello,
  Ottavio, Flavio, Tiziano, Omar, Yuri, Mirko, Emanuel, Brando, Ismaele, Liam, Calogero, Christopher`);
const IT_E2010 = w(`Leonardo, Francesco, Alessandro, Lorenzo, Mattia, Tommaso, Gabriele, Andrea, Riccardo, Edoardo, Matteo, Giuseppe, Antonio,
  Federico, Diego, Davide, Christian, Nicolò, Giovanni, Samuele, Pietro, Filippo, Marco, Luca, Michele, Alessio, Emanuele, Giulio, Simone,
  Jacopo, Elia, Gioele, Vincenzo, Salvatore, Daniele, Manuel, Enea, Ettore, Achille, Thomas, Cesare, Leone, Noah, Liam, Samuel, Gabriel,
  Giacomo, Mario, Luigi, Domenico, Raffaele, Cristian, Kevin, Stefano, Enrico, Nicola, Ludovico, Sebastiano, Damiano, Vittorio, Giorgio, Carlo,
  Brando, Dario, Angelo, Valerio, Emiliano, Raffaello, Ryan, Elio, Mathias, Mattias, Ismaele, Giosuè, Rocco, Ciro, Gennaro, Pasquale, Antonino,
  Carmine, Gaetano, Cosimo, Rosario, Alberto, Paolo, Claudio, Lapo, Tiziano, Valentino, Marcello, Ottavio, Nathan, Daniel, David, Alex, Denis,
  Michael, Nicolas, Jonathan, Patrick, Erik, Gianmarco, Giuliano, Arturo, Flavio, Massimo, Umberto, Ivan, Omar, Mirko, Fabio, Roberto,
  Leandro, Manuele, Emanuel, Teo, Zeno, Dante, Elias, Niccolò, Christopher, Aurelio, Guglielmo, Ruben, Edoardo`);

// --- Spanien -------------------------------------------------------------------
const ES_KAST = w(`Mendoza, Carrasco, Rivera, Gallardo, Soto, Contreras, Pardo, Bermúdez, Cuesta, Rojas, Vera, Cabello, Mesa, Bueno, Merino, Luque,
  Parra, Montes, Lara, Moya, Pozo, Toledo, Aranda, Rivas, Robles, Salazar, Acosta, Bernal, Paredes, Sierra, Escobar, Duque, Marcos, Tapia,
  Espinosa, Villar, Rosa, Valero, Ordóñez, Trujillo, Gálvez, Mateo, Cuenca, Lucas, Cordero, Plaza, Salas, Rico, Corral, Hurtado, Rueda, Barrera,
  Soria, Prado, Salinas, Manzano, Ojeda, Collado, Arroyo, Galán, Carrillo, Blázquez, Beltrán, Padilla, Alarcón, Caro, Miranda, Cabezas, Sosa,
  Amaya, Quintana, Polo, Peinado, Sevilla, Mena, Maldonado, Avilés, Gracia, Ballesteros, Bautista, Calderón, Cámara, Montoya, Pacheco, Jurado,
  Andrés, Barroso, Lázaro, Villalba, Zamora, Cobo, Rosales, Ramón, Pineda, Bonilla, Navas, Cuevas, Vallejo, Sancho, Ayala, Moral, Becerra,
  Santamaría, Benavente, Solís, Valverde, Segura, Lago, Gordillo, Cerezo, Clemente, Simón, Jaén, Escudero, Godoy, Pulido, Chacón, Aparicio, Olmo,
  Aguado, Expósito, Casado, Cid, Roldán, Rincón, Palacios, Heredia, Rojo, Toro, Robledo, Mejías, Lorente, Camacho, Chaves, Linares, Tomás, Ruano,
  Morán, Herranz, Tejero, Requena, Llorente, Rodrigo, Luna, Cárdenas, Del Río, De la Fuente, De la Cruz, Del Pino, Fajardo, Guzmán, Villanueva,
  Salgado, Arenas, Ortuño, Pizarro, Ponce, Quesada, Sola, Tello, Peralta, Murillo, Leal, Ferrándiz, Gimeno, Lillo, Bernabé, Hervás, Catalán,
  Pedraza, Marco, Muñiz, Mateos, Bermejo, Calero, Lucena, Tirado,
  Morillo, Trigo, Sandoval, Rivero, Bello, Baena, Ávila, Valencia, Zapata, Infante, Navarrete, Alcaraz, Orozco, Briones, Cantero`);
const ES_KAT = w(`Font, Vives, Mas, Bosch, Riera, Sala, Roig, Rovira, Valls, Prat, Coll, Camps, Casals, Batlle, Bonet, Comas, Ribas, Torrent, Martí,
  Esteve, Pou, Gual, Mir, Oliver, Grau, Sabaté, Planas, Cardona, Badia, Bertran, Rius, Fabregat, Moll, Ros, Guasch, Solé, Domènech, Miralles,
  Llobet, Ballester, Reig, Segarra, Vilà, Garriga, Cervera, Colomer, Pla, Pagès, Canals, Simó, Mestre, Bou, Sanchis, Climent, Llopis, Monzó, Peris,
  Gisbert, Pons, Serra, Costa, Ferrando, Marí, Tur, Ribera, Bonnín, Crespí, Amengual, Vicens, Capó, Albert, Castells, Sabater`);
const ES_BASK = w(`Aguirre, Urrutia, Zabala, Uriarte, Arrieta, Elizondo, Iturbe, Ibarra, Mendizábal, Olaizola, Gorostiza, Aranburu, Bilbao, Zubiaurre,
  Arteaga, Iriarte, Lasa, Mujika, Otxoa, Ugarte, Azpeitia, Larrea, Aramburu, Goñi, Beristain, Elorza, Iturriaga, Arana, Etxebarria, Ormaetxea,
  Gaztañaga, Irigoyen, Echevarría, Zubiri, Ochoa, Salaberria, Igartua, Lertxundi, Unanue, Agirre, Zabaleta, Altuna, Errazti,
  Urkiza, Garate, Jauregi, Labaka, Olano, Sarasola, Ugalde, Zubeldia`);
const ES_GAL = w(`Otero, Rey, Pazos, Lage, Fraga, Varela, Novoa, Seoane, Couto, Lema, Barreiro, Rial, Souto, Piñeiro, Carballo, Mosquera, Doval,
  Freire, Bouzas, Ferreiro, Regueiro, Sanmartín, Pena, Amoedo, Abal, Cancela, Boullosa, Dopico, Castiñeira, Vilariño, Taboada, Chao, Loureiro,
  Paz, Quintela, Fariña, Ríos, Vilas, Ares, Brea, Losada, Sobrino, Castelo, Caamaño, Lamas, Mouriño, Insua`);
const ES_KAN = w(`Perdomo, Betancor, Armas, Padrón, Brito, Déniz, Bethencourt, Quintero, Viera, Marrero, Melián,
  Afonso`);
const ESP = u(ES_KAST, ES_KAT, ES_BASK, ES_GAL, ES_KAN);

const ES_E0 = w(`José, Antonio, Manuel, Francisco, Juan, Ángel, Miguel, Rafael, Pedro, Luis, Jesús, Fernando, Andrés, Ramón, Vicente, Joaquín, Julián,
  Enrique, Emilio, Agustín, Felipe, Tomás, Salvador, Santiago, Julio, Ricardo, Eugenio, Ignacio, José María, José Luis, José Antonio, José Manuel,
  Juan José, Juan Antonio, Francisco Javier, Alfonso, Alfredo, Arturo, Benito, Bernardo, Carlos, Ceferino, Clemente, Cristóbal, Domingo, Eduardo,
  Eloy, Esteban, Eusebio, Faustino, Félix, Fermín, Florencio, Gabriel, Gaspar, Gerardo, Germán, Gonzalo, Gregorio, Guillermo, Herminio, Hilario,
  Isidro, Jacinto, Jaime, Javier, Jerónimo, Jorge, Justo, Leandro, Leonardo, Lorenzo, Lucio, Luciano, Marcelino, Marcos, Mariano, Mario, Martín,
  Mateo, Matías, Maximino, Nicolás, Octavio, Pablo, Pascual, Patricio, Rogelio, Roberto, Rufino, Saturnino, Sebastián, Severino, Simón, Teodoro,
  Urbano, Valentín, Valeriano, Víctor, Avelino, Benjamín, Casimiro, Daniel, Desiderio, Emiliano, Ernesto, Evaristo, Fidel, Gumersindo, Inocencio,
  Jordi, Josep, Joan, Jaume, Pere, Lluís, Ramon, Josu, Koldo, Patxi, Iñaki, Txomin, Xosé, Manolo, Paco, Pepe, Quique, Alberto, Diego, Óscar, Sergio`);
const ES_E1950 = w(`José, Antonio, Manuel, Francisco, Juan, José Antonio, José Luis, José Manuel, José María, Juan Carlos, Juan José, Juan Antonio,
  Juan Manuel, Francisco Javier, Miguel Ángel, Jesús, Ángel, Miguel, Rafael, Pedro, Luis, Carlos, Fernando, Javier, Alberto, Ramón, Vicente,
  Enrique, Joaquín, Andrés, Eduardo, Alfonso, Jorge, Ricardo, Roberto, Emilio, Julio, Salvador, Tomás, Félix, Gregorio, Jaime, Agustín, Ignacio,
  Santiago, Alejandro, Gabriel, Marcos, Mariano, Pablo, Daniel, Víctor, Óscar, Sergio, Diego, Gonzalo, César, Guillermo, Arturo, Alfredo,
  Domingo, Felipe, Lorenzo, Julián, Marcelino, Mario, Martín, Nicolás, Esteban, Cristóbal, Sebastián, Isidro, Ismael, Germán, Gerardo, Leandro,
  Octavio, Rogelio, Teodoro, Valentín, Avelino, Benjamín, Bernardo, Emiliano, Eugenio, Fabián, Faustino, Fidel, Gaspar, Jacinto, Justo, Leonardo,
  Lucio, Luciano, Mateo, Matías, Moisés, Pascual, Samuel, Simón, Jordi, Josep, Joan, Jaume, Pere, Ferran, Lluís, Carles, Albert, Enric, Xavier,
  Josep Maria, Iñaki, Josu, Koldo, Patxi, Xabier, Joseba, Txema, Kepa, Andoni, Xosé, Paco, Pepe, Manolo, Rubén`);
const ES_E1960 = w(`Antonio, José, Manuel, Francisco, Juan, David, Javier, Jesús, Carlos, Miguel, Rafael, Pedro, Ángel, José Antonio, José Luis,
  José Manuel, Francisco Javier, Juan Carlos, Juan Antonio, Juan José, Juan Manuel, José María, José Ramón, José Carlos, José Miguel, Miguel Ángel,
  Luis Miguel, Jorge, Alberto, Fernando, Luis, Alfonso, Pablo, Daniel, Sergio, Raúl, Ricardo, Roberto, Enrique, Ramón, Vicente, Joaquín, Andrés,
  Eduardo, Óscar, Víctor, Ignacio, Santiago, Agustín, Emilio, Julio, Salvador, Tomás, Félix, Gregorio, Jaime, Alejandro, Gabriel, Marcos,
  Mariano, Rubén, Iván, Diego, Gonzalo, Rodrigo, César, Guillermo, Arturo, Alfredo, Domingo, Felipe, Lorenzo, Julián, Mario, Martín, Nicolás,
  Esteban, Cristóbal, Sebastián, Isidro, Ismael, Jordi, Josep, Joan, Jaume, Josep Maria, Pere, Ferran, Lluís, Carles, Albert, Enric, Xavier,
  Iñaki, Josu, Koldo, Patxi, Xabier, Gorka, Aitor, Iñigo, Jon, Mikel, Txema, Joseba, Kepa, Andoni, Xosé, Germán, Gerardo, Leandro, Octavio,
  Rogelio, Teodoro, Valentín, Benjamín, Bernardo, Emiliano, Fabián, Faustino, Fidel, Lucio, Luciano, Mateo, Matías, Moisés, Pascual, Samuel,
  Simón, Hugo, Gustavo, Marc, Toni, Quique`);
const ES_E1970 = w(`David, Javier, Daniel, Francisco Javier, José Antonio, Carlos, Sergio, Jesús, Juan Carlos, José Manuel, Antonio, Manuel, Francisco,
  José Luis, Miguel Ángel, Juan, José, Rubén, Óscar, Raúl, Alberto, Fernando, Pablo, Jorge, Roberto, Iván, Luis, Miguel, Pedro, Rafael, Ángel,
  Alejandro, Víctor, Diego, Ignacio, Eduardo, Alfonso, Enrique, Ricardo, Joaquín, Marcos, Mario, Gonzalo, Andrés, Ramón, Vicente, Santiago,
  Jaime, Gabriel, Héctor, Gustavo, César, Guillermo, Rodrigo, Álvaro, Borja, Jonathan, Cristian, Israel, Abel, Adolfo, Agustín, Aitor, Alfredo,
  Arturo, Asier, Benjamín, Cristóbal, Emilio, Esteban, Félix, Felipe, Germán, Gerardo, Gorka, Hugo, Ibon, Iker, Iñaki, Iñigo, Ismael, Jon,
  Jordi, Josep, Joan, Juan Antonio, Juan José, Juan Manuel, Julio, Julián, Lorenzo, Marc, Martín, Mikel, Moisés, Nicolás, Oriol, Pau, Rafa,
  Roger, Salvador, Samuel, Sebastián, Tomás, Unai, Xavier, Xabier, Albert, Carles, Ferran, Gerard, Sergi, Jaume, Joseba, Josu, Txema, Xosé,
  Aarón, Adrián, Alexis, Raimundo, Valentín, Teodoro, Lucas, Mateo`);
const ES_E1980 = w(`David, Daniel, Javier, Sergio, Alejandro, Carlos, Pablo, Jorge, Rubén, Adrián, Alberto, Iván, Raúl, Óscar, Antonio, Manuel,
  Francisco, José, Juan, Miguel, Álvaro, Diego, Fernando, Víctor, Mario, Luis, Pedro, Rafael, Ángel, Roberto, Marcos, Jesús, Ignacio, Héctor,
  Alfonso, Enrique, Gonzalo, Jaime, Ricardo, Eduardo, Borja, Jonathan, Cristian, Christian, Israel, Hugo, Samuel, Aitor, Asier, Iker, Unai,
  Mikel, Jon, Ander, Gorka, Ibai, Eneko, Oier, Julen, Xabier, Iñigo, Marc, Jordi, Albert, Gerard, Sergi, Oriol, Pau, Roger, Xavier, Arnau,
  Aleix, Joan, Guillem, Ferran, Àlex, Alex, Aarón, Abel, Alexis, Andrés, Ismael, Joel, Rodrigo, Gabriel, Lucas, Martín, Nicolás, Saúl, Tomás,
  Guillermo, César, Gustavo, Germán, Agustín, Felipe, Esteban, Joaquín, Vicente, Ramón, Emilio, Julio, Julián, Lorenzo, Moisés, Salvador,
  Sebastián, Eloy, Fran, Dani, Toni, Kevin, Brais, Iago, Xoán, Antón, Brian, Yeray, Kiko, Nacho, Jacobo, Iñaki, Juan Carlos, José Antonio,
  Juan José, Miguel Ángel, José Manuel, Francisco Javier, José Luis, Juan Antonio`);
const ES_E1990 = w(`Alejandro, Daniel, Pablo, David, Adrián, Javier, Sergio, Álvaro, Carlos, Jorge, Mario, Iván, Rubén, Diego, Víctor, Raúl, Marcos,
  Miguel, Alberto, Antonio, Manuel, Francisco, José, Juan, Luis, Pedro, Rafael, Ángel, Hugo, Jaime, Gonzalo, Ignacio, Héctor, Óscar, Fernando,
  Roberto, Jesús, Samuel, Cristian, Christian, Jonathan, Borja, Aitor, Asier, Iker, Unai, Mikel, Jon, Ander, Gorka, Ibai, Eneko, Oier, Julen,
  Xabier, Iñigo, Markel, Marc, Jordi, Albert, Gerard, Sergi, Oriol, Pau, Roger, Arnau, Aleix, Joan, Guillem, Ferran, Pol, Bernat, Àlex, Alex,
  Aarón, Abel, Alexis, Andrés, Ismael, Joel, Rodrigo, Gabriel, Lucas, Martín, Nicolás, Saúl, Tomás, Guillermo, Eric, Izan, Kevin, Brian,
  Yeray, Brais, Iago, Antón, Jacobo, Nacho, Dani, Fran, Toni, Enrique, Eduardo, Ricardo, Alfonso, Joaquín, Vicente, Felipe, Mateo, Bruno,
  Santiago, Darío, Marco, Leo, Erik, Aimar, Beñat, Hodei, Unax, Xavi, Ricard, Jaume, Martí, Biel, Andreu`);
const ES_E2000 = w(`Pablo, Alejandro, Daniel, Hugo, Álvaro, Adrián, David, Javier, Mario, Diego, Sergio, Marcos, Iván, Carlos, Jorge, Manuel, Lucas,
  Izan, Martín, Raúl, Rubén, Miguel, Víctor, Alberto, Antonio, Francisco, José, Juan, Ángel, Gonzalo, Nicolás, Rodrigo, Samuel, Aarón, Héctor,
  Jaime, Marc, Pau, Pol, Jan, Nil, Arnau, Aleix, Biel, Oriol, Gerard, Guillem, Joan, Martí, Bernat, Roger, Eric, Unai, Iker, Ander, Aimar, Jon,
  Mikel, Markel, Oier, Julen, Eneko, Ibai, Asier, Aitor, Beñat, Hodei, Unax, Xabier, Iñigo, Gorka, Brais, Iago, Antón, Xoán, Mateo, Leo, Bruno,
  Thiago, Dylan, Gael, Darío, Enzo, Erik, Marco, Alex, Álex, Alonso, Joel, Saúl, Ismael, Rafael, Pedro, Luis, Jesús, Fernando, Óscar, Cristian,
  Christian, Jonathan, Kevin, Brian, Yeray, Kilian, Ian, Liam, Noah, Gabriel, Santiago, Tomás, Andrés, Ignacio, Guillermo, Rayan, Adam, Omar,
  Youssef, Jacobo, Nacho, Borja, Íker, Teo, Gael, Lucas, Jordi, Albert, Sergi, Ferran, Xavier, Ricard, Andreu, Isaac, Abel, Alexis,
  Joaquín, Vicente, Felipe, Eduardo, Enrique, Ricardo, Alfonso, Emilio, Julio, Iñaki, Asier, Marcel, Fabio, Luca, Axel, Sebastián, Valentín`);
const ES_E2010 = w(`Hugo, Martín, Lucas, Mateo, Leo, Daniel, Alejandro, Pablo, Manuel, Álvaro, Adrián, Enzo, Mario, Diego, David, Oliver, Marcos, Thiago,
  Marco, Álex, Javier, Izan, Bruno, Miguel, Antonio, Gonzalo, Liam, Gael, Marc, Carlos, Juan, Ángel, Dylan, Nicolás, José, Sergio, Gabriel,
  Luca, Jorge, Darío, Íker, Samuel, Eric, Adam, Héctor, Francisco, Rodrigo, Jesús, Erik, Amir, Jaime, Ian, Rubén, Aarón, Iker, Pau, Víctor,
  Mauro, Guillermo, Pol, Nil, Jan, Biel, Arnau, Aleix, Martí, Oriol, Joan, Bernat, Roger, Unai, Ander, Aimar, Jon, Mikel, Markel, Oier, Julen,
  Eneko, Beñat, Hodei, Unax, Xabier, Ibai, Asier, Brais, Iago, Antón, Xoán, Noah, Alonso, Joel, Saúl, Ismael, Rafael, Pedro, Luis, Raúl,
  Iván, Alberto, Fernando, Tomás, Andrés, Ignacio, Santiago, Valentín, Teo, Axel, Rayan, Youssef, Omar, Kilian, Lucas, Matías, Sebastián,
  Alexander, Gerard, Guillem, Isaac, Abel, Elías, Noel, Eloy, Jacobo, Simón, Lorenzo, Max, Nacho, Dani, Ethan, Oliver, Alessandro,
  Marcel, Fabio, Hugo, Nico, Unai, Lander, Danel, Ekain, Mateu, Quim, Ot, Roc, Lluc, Pere, Xavi, Enric`);

// --- Portugal ------------------------------------------------------------------
const POR = w(`Abreu, Aguiar, Alexandre, Andrade, Anjos, Assunção, Bastos, Belo, Bento, Bessa, Bettencourt, Botelho, Brandão, Bragança, Bravo, Calado,
  Camacho, Câmara, Carmo, Carrilho, Casimiro, Catarino, Cerqueira, Chaves, Cordeiro, Couto, Craveiro, Damião, Dantas, Delgado, Dinis, Dionísio,
  Dourado, Encarnação, Estrela, Falcão, Feijó, Félix, Ferraz, Ferro, Figueira, Filipe, Flores, Franco, Frade, Freire, Frias, Fragoso, Galvão,
  Garcia, Gil, Godinho, Gouveia, Graça, Guedes, Guerra, Guimarães, Inácio, Jacinto, Jardim, Jorge, Justino, Lacerda, Leitão, Lemos, Lobo, Louro,
  Luz, Macedo, Madeira, Maia, Malheiro, Marinho, Mascarenhas, Mata, Matias, Meireles, Mesquita, Morgado, Mourão, Neto, Neves, Nóbrega, Novais,
  Paixão, Palma, Pardal, Patrício, Paulo, Paz, Pedrosa, Peixoto, Peres, Pimenta, Pimentel, Pinho, Pontes, Portela, Prata, Queirós, Quintas,
  Rebelo, Rego, Resende, Rosa, Rosário, Sá, Salgado, Salvador, Sampaio, Santana, Santiago, Saraiva, Seabra, Sena, Serra, Serrano, Silvestre,
  Sobral, Tomé, Torres, Trindade, Vale, Vasconcelos, Veloso, Ventura, Viana, Vidal, Vilela, Afonso, Amorim, Aragão, Bandeira, Barata, Barreto,
  Barroso, Beirão, Boaventura, Brás, Caetano, Calheiros, Campelo, Candeias, Capela, Castanheira, Coimbra, Conceição, Coutinho, Crespo, Custódio,
  Faustino, Ferrão, Fidalgo, Fontes, Fortunato, Frazão, Furtado, Gameiro, Granja, Janeiro, Lapa, Leandro, Loureiro, Lucas, Madureira, Mendonça,
  Milheiro, Mira, Monte, Montenegro, Mourato, Nascimento, Ornelas, Pais, Paredes, Parreira, Passos, Pato, Pedro, Pestana, Pina, Proença, Prates,
  Raposo, Ramalho, Ricardo, Romão, Roque, Sacramento, Sarmento, Seixas, Semedo, Silveira, Simão, Sobreira, Taborda, Teles, Valério, Varela, Velho,
  Vicente, Videira, Vilaça, Vital, Assis, Toscano, Lino, Vidigal, Fialho, Rato, Gaio, Grilo, Folgado, Grácio, Abrantes, Amaro, Antão,
  Arruda, Ataíde, Aveiro, Baleia, Barradas, Bernardo, Bispo, Bonito, Brazão, Cabrita, Calvário, Canelas, Cardeal, Carriço, Casal, Cavaleiro, Cid, Clemente, Colaço, Cortês, Cotrim, Damasceno, Dores, Elias, Évora, Farinha, Fonte, Gago, Galego, Garrido, Isidoro, Jordão, Lança, Lousada, Lourinho,
  Malta, Manso, Martinho, Massa, Medina, Meira, Melro, Miguel, Mimoso, Moreno, Nobre,
  Novo, Pedroso, Pegado, Penedo, Pombo, Queiroz, Quintela, Raimundo, Rebocho, Relvas, Rolo, Rufino, Sabino, Sales, Serafim, Silvério, Sobrinho, Tomás, Torrão, Valadas, Veiga, Viegas, Vilar,
  Fortes, Moniz`).filter((n) => !n.includes(' '));

const PT_E0 = w(`Abel, Abílio, Acácio, Adelino, Adriano, Agostinho, Albano, Albertino, Alberto, Alcides, Alexandre, Alfredo, Álvaro, Amadeu, Amândio,
  Américo, Aníbal, Ângelo, António, Armando, Armindo, Arnaldo, Artur, Augusto, Aurélio, Avelino, Belmiro, Benjamim, Bernardino, Bernardo,
  Caetano, Cândido, Carlos, Casimiro, Celestino, Custódio, Daniel, Delfim, Domingos, Duarte, Eduardo, Emídio, Ernesto, Eugénio, Fausto,
  Feliciano, Fernando, Filipe, Firmino, Francisco, Gabriel, Gaspar, Gilberto, Guilherme, Henrique, Horácio, Hermínio, Hélder, Inácio, Isidro,
  Ilídio, Jacinto, Jaime, Joaquim, João, Jorge, José, Júlio, Justino, Laurindo, Leonel, Licínio, Lino, Lourenço, Luciano, Luís, Manuel,
  Marcelino, Mário, Martinho, Norberto, Octávio, Óscar, Orlando, Paulo, Raul, Ramiro, Rogério, Rodrigo, Rui, Salvador, Samuel, Sebastião,
  Serafim, Silvino, Simão, Teodoro, Tomás, Valdemar, Vasco, Vicente, Virgílio, Vítor, Zeferino, Adolfo, Afonso, Agostinho, Albino, Américo,
  Anselmo, Arménio, Basílio, Bento, Clemente, Diamantino, Elias, Fortunato, Germano, Gonçalo, Inocêncio, Leandro, Leopoldo, Mateus, Nuno`);
const PT_E1960 = w(`José, António, Manuel, João, Carlos, Jorge, Fernando, Luís, Paulo, Rui, Pedro, Nuno, Mário, Francisco, Joaquim, Vítor, Sérgio,
  Ricardo, Hélder, Hugo, Álvaro, Alberto, Armando, Artur, Augusto, Domingos, Eduardo, Filipe, Henrique, Jaime, Júlio, Miguel, Rogério, Raul,
  Rodrigo, Tiago, Bruno, Abel, Adelino, Adriano, Agostinho, Albano, Alexandre, Alfredo, Amadeu, Américo, Aníbal, Ângelo, Armindo, Arnaldo,
  Avelino, Belmiro, Bernardo, Cândido, Daniel, Delfim, Duarte, Eugénio, Fausto, Fernando, Gabriel, Gilberto, Gonçalo, Guilherme, Horácio,
  Hermínio, Isidro, Jacinto, Joel, Leonel, Lino, Lourenço, Luciano, Marcelino, Marco, Martinho, Mateus, Nélson, Norberto, Octávio, Óscar,
  Orlando, Ramiro, Renato, Rúben, Samuel, Sebastião, Simão, Teodoro, Tomás, Valdemar, Vasco, Vicente, Virgílio, César, Celso, Emanuel,
  Fábio, Frederico, Gustavo, Ivo, Leonardo, Marcos, Mauro, Patrício, Rafael, Válter, Xavier, Zacarias`);
const PT_E1980 = w(`João, Pedro, Tiago, Bruno, Ricardo, Rui, Nuno, Hugo, Diogo, André, Luís, Paulo, Miguel, Daniel, Sérgio, Marco, Fábio, Filipe,
  Gonçalo, Vítor, Carlos, Jorge, José, Manuel, António, Fernando, Francisco, Mário, Nélson, Rúben, Ivo, Renato, Hélder, Joel, Vasco, Rafael,
  Rodrigo, Duarte, Gustavo, Henrique, Leonardo, Marcos, Mauro, Samuel, Simão, Tomás, Válter, Emanuel, Frederico, Alexandre, Bernardo, Celso,
  César, Cláudio, Cristiano, David, Edgar, Eduardo, Élio, Fausto, Flávio, Gabriel, Gil, Guilherme, Igor, Jaime, Jonathan, Leandro, Luciano,
  Márcio, Mateus, Micael, Nelson, Norberto, Patrick, Raul, Roberto, Rolando, Silvano, Sandro, Telmo, Valdemar, Vitorino, Wilson,
  Xavier, Artur, Augusto, Domingos, Joaquim, Júlio, Lourenço, Martim, Afonso, Salvador, Dinis, Martinho, Abel, Adriano, Agostinho, Albano,
  Óscar, Orlando, Sebastião, Teodoro, Edson, Stéphane, Kevin, Steven`).filter((n) => !n.includes(' '));
const PT_E2000 = w(`Afonso, Diogo, Duarte, Francisco, Gonçalo, Guilherme, Henrique, Lourenço, Martim, Rafael, Rodrigo, Salvador, Santiago, Simão,
  Tomás, Vasco, Dinis, Tiago, Leonardo, João, Pedro, Miguel, Gabriel, Bernardo, Gustavo, Lucas, Mateus, David, Daniel, Rúben, André, Bruno,
  Ricardo, Hugo, Nuno, Luís, Rui, Filipe, Fábio, José, António, Manuel, Carlos, Jorge, Vicente, Xavier, Alexandre, Eduardo, Frederico, Samuel,
  Rodrigo, Enzo, Lourenço, Isaac, Kevin, Leandro, Marco, Mauro, Ivo, Joel, Renato, Sérgio, Vítor, Martinho, Benjamim, Caetano, Dário, Edgar,
  Emanuel, Fausto, Gil, Jaime, Júlio, Lucas, Matias, Noah, Raul, Sebastião, Teodoro, Tomé, Valentim, Artur, Bento, Cristiano, Ivan,
  Jonathan, Wilson, Telmo, Nélson, Diego, Thiago, Alex, Henrique, Lorenzo, Luca, Liam, Leon, Ângelo, Augusto, Baltazar,
  Domingos, Elias, Gaspar, Inácio, Mário, Martim, Paulo, Raúl, Simão, Duarte`).filter((n) => !n.includes(' '));
const PT_E2010 = w(`Francisco, Afonso, João, Tomás, Duarte, Lourenço, Santiago, Martim, Rodrigo, Miguel, Gabriel, Salvador, Guilherme, Gonçalo, Simão,
  Vicente, Rafael, Diogo, Lucas, Pedro, Leonardo, Dinis, Henrique, Bernardo, Vasco, Gustavo, Tiago, Mateus, David, Benjamim, Enzo, Noah, Isaac,
  Lorenzo, Liam, Leon, Luca, Thiago, Theo, Kevin, Samuel, Daniel, Martinho, Matias, Sebastião, Valentim, Caetano, Gaspar, Teodoro, Tomé, Xavier,
  Alexandre, Eduardo, Frederico, Artur, Bento, Augusto, Baltazar, Elias, Inácio, Manuel, José, António, Rúben, André, Bruno, Ricardo, Hugo,
  Nuno, Luís, Rui, Filipe, Fábio, Carlos, Jorge, Marco, Mauro, Ivo, Joel, Diego, Ângelo, Raul, Mário, Paulo, Heitor, Davi, Arthur,
  Joaquim, Benício, Aurélio, Leandro, Emanuel, Cristiano, Ivan, Gil, Jaime, Júlio`);

// --- Griechenland ----------------------------------------------------------------
const GRE = w(`Konstantinidis, Papaioannou, Papathanasiou, Georgiadis, Panagiotopoulos, Pavlidis, Dimopoulos, Athanasopoulos, Kontos, Alexopoulos,
  Anastasiou, Anastasiadis, Apostolou, Apostolopoulos, Argyropoulos, Argyriou, Chatzidakis, Christopoulos, Daskalakis, Dimas, Drakopoulos,
  Efthymiou, Fotopoulos, Galanopoulos, Georgakopoulos, Giannakopoulos, Giannopoulos, Gkikas, Iliopoulos, Kalogeropoulos, Kanellopoulos, Karalis,
  Karamanos, Karanikolas, Katsikas, Kokkinos, Kontogiannis, Kostakis, Koutsoukos, Kyriakidis, Liakos, Logothetis, Manolopoulos, Marinos, Markou,
  Mavros, Mavropoulos, Michalopoulos, Moraitis, Nikolopoulos, Pantazis, Papakonstantinou, Papamichail, Papazoglou, Papoutsis, Paraskevopoulos,
  Pavlou, Petrakis, Petropoulos, Psarras, Sarris, Sideris, Spyropoulos, Stamatopoulos, Stathopoulos, Stavropoulos, Stefanidis, Tsoukalas,
  Vasilopoulos, Vassilakis, Voulgaris, Xanthopoulos, Zisis, Kyriakopoulos, Lazaridis, Theodoridis, Charalampidis, Sotiropoulos, Triantafyllidis,
  Kalaitzis, Mylonas, Kouris, Zafeiriou, Panagopoulos, Nikas, Christakis, Chatzigeorgiou, Chatzopoulos, Vlachopoulos, Doukas, Drosos, Kostoglou,
  Zervos, Antonopoulos, Andreou, Angelidis, Anagnostopoulos, Chronopoulos, Diamantis, Exarchos, Gavalas, Grigoriou, Kazakos, Lekkas, Malamas,
  Mitropoulos, Papadogiannis, Petsas, Politis, Polychronopoulos, Rallis, Rigas, Sakellariou, Stamou, Stergiou, Vlassis, Xenos, Kosmidis,
  Ioannidis, Savvidis, Arvanitis, Bakalis, Bouras, Chatzis, Dimitropoulos, Eleftheriou, Floros, Fragkos, Gatsos, Georgopoulos, Giannakis,
  Gkoutzos, Kalamaras, Kampouris, Karras, Katsaros, Kefalas, Kotsakis, Kotsopoulos, Koukoulas, Koutsoupias, Lamprakis, Lymperopoulos,
  Manousakis, Margaritis, Mavrommatis, Ntaras, Oikonomidis, Panousis, Pappas, Pateras, Petrou, Poulos, Prodromou, Rousos,
  Samaras, Siamos, Skordas, Sotiriadis, Spanos, Stathakis, Stavridis, Tsagkaris, Tsakalidis, Tsiligiannis, Tzanakis, Valsamis, Vardakis,
  Vasileiadis, Vergis, Vrettos, Xydis, Zachariou, Zografakis, Alexiadis, Charalampous, Chrysikopoulos, Dedousis, Fountoulakis, Kakkos,
  Kalogirou, Karakostas, Kavvadias, Kyriazis, Lagos, Makridis, Mantzouranis, Nikolakopoulos, Papadias, Paraskevas, Perakis, Psaltis, Siganos,
  Spiliotis, Tsolakis, Tsoukas, Vlachakis, Zacharakis`);

const GR_E0 = w(`Georgios, Ioannis, Konstantinos, Dimitrios, Nikolaos, Panagiotis, Vasileios, Christos, Athanasios, Michail, Evangelos, Spyridon,
  Antonios, Anastasios, Theodoros, Charalambos, Andreas, Emmanouil, Ilias, Stavros, Petros, Sotirios, Stylianos, Apostolos, Alexandros,
  Eleftherios, Grigorios, Pavlos, Stefanos, Kyriakos, Thomas, Stamatios, Efstathios, Efstratios, Gerasimos, Lambros, Markos, Pantelis, Savvas,
  Zacharias, Aristeidis, Periklis, Miltiadis, Sokratis, Themistoklis, Xenofon, Leonidas, Kosmas, Prodromos, Paraskevas, Triantafyllos, Iakovos,
  Lazaros, Fotios, Chrysostomos, Damianos, Dionysios, Kleanthis, Menelaos, Nikiforos, Theofilos, Vlasios, Achilleas, Aristotelis, Evripidis,
  Iraklis, Loukas, Matthaios, Nektarios, Orestis, Timotheos, Zisis, Kostas, Nikos, Giorgos, Giannis, Dimitris, Vasilis, Thanasis, Panos, Takis,
  Sakis, Babis, Makis, Lefteris, Manolis, Michalis, Sotiris, Stelios, Spyros, Tasos, Antonis, Vangelis, Christoforos, Agisilaos, Charilaos`);
const GR_E1970 = w(`Georgios, Ioannis, Konstantinos, Dimitrios, Nikolaos, Panagiotis, Vasileios, Christos, Athanasios, Michail, Evangelos, Spyridon,
  Antonios, Anastasios, Theodoros, Charalambos, Andreas, Emmanouil, Ilias, Stavros, Petros, Sotirios, Stylianos, Apostolos, Alexandros,
  Eleftherios, Grigorios, Pavlos, Stefanos, Kyriakos, Thomas, Stamatios, Efstathios, Efstratios, Gerasimos, Lambros, Markos, Pantelis, Savvas,
  Zacharias, Aristeidis, Periklis, Miltiadis, Sokratis, Leonidas, Kosmas, Prodromos, Iakovos, Lazaros, Fotios, Dionysios, Nektarios, Orestis,
  Achilleas, Aristotelis, Loukas, Marios, Alexis, Aris, Kostas, Nikos, Giorgos, Giannis, Dimitris, Vasilis, Thanasis, Panos, Lefteris, Manolis,
  Michalis, Sotiris, Stelios, Spyros, Tasos, Antonis, Vangelis, Christoforos, Fotis, Babis, Sakis, Makis, Filippos, Iasonas, Rafail, Nikitas,
  Odysseas, Chrysovalantis, Thodoris, Haris, Kyriakos, Dinos, Angelos, Vaggelis`);
const GR_E1990 = w(`Georgios, Ioannis, Konstantinos, Dimitrios, Nikolaos, Panagiotis, Vasileios, Christos, Athanasios, Michail, Evangelos, Spyridon,
  Antonios, Anastasios, Theodoros, Charalambos, Andreas, Emmanouil, Ilias, Stavros, Petros, Sotirios, Stylianos, Apostolos, Alexandros,
  Eleftherios, Grigorios, Pavlos, Stefanos, Kyriakos, Thomas, Gerasimos, Markos, Pantelis, Savvas, Leonidas, Lazaros, Dionysios, Nektarios,
  Orestis, Achilleas, Aristotelis, Loukas, Marios, Alexis, Aris, Filippos, Iasonas, Rafail, Nikitas, Odysseas, Chrysovalantis, Angelos, Kostas,
  Nikos, Giorgos, Giannis, Dimitris, Vasilis, Thanasis, Panos, Lefteris, Manolis, Michalis, Sotiris, Stelios, Spyros, Tasos, Antonis, Vangelis,
  Thodoris, Fotis, Haris, Christoforos, Paris, Iason, Rafael, Nikolas, Periklis, Miltiadis, Ermis, Zisis, Taxiarchis`);
const GR_E2010 = w(`Georgios, Ioannis, Konstantinos, Dimitrios, Nikolaos, Panagiotis, Vasileios, Christos, Athanasios, Michail, Evangelos, Spyridon,
  Antonios, Anastasios, Theodoros, Charalambos, Andreas, Emmanouil, Ilias, Stavros, Petros, Alexandros, Eleftherios, Pavlos, Stefanos, Kyriakos,
  Thomas, Markos, Savvas, Leonidas, Lazaros, Dionysios, Orestis, Achilleas, Aristotelis, Loukas, Marios, Alexis, Aris, Filippos, Iasonas,
  Rafail, Nikitas, Odysseas, Angelos, Ermis, Apollon, Aristeidis, Iraklis, Zisis, Taxiarchis, Matthaios, Paris, Periklis, Nektarios, Gerasimos,
  Giorgos, Giannis, Dimitris, Kostas, Nikos, Vasilis, Thanasis, Panos, Manolis, Michalis, Stelios, Spyros, Christoforos, Ektoras, Prokopis, Zacharias, Timotheos, Sotirios, Stylianos, Apostolos, Grigorios, Fotios`);

// --- Türkei --------------------------------------------------------------------
const TUR = w(`Özkan, Erdoğan, Can, Gül, Köse, Çiftçi, Kahraman, Karaca, Uçar, Duman, Altun, Bayram, Coşkun, Akın, Tunç, Ekinci, Yurt, Gündüz,
  Akbulut, Temel, Cengiz, Kandemir, Akkaya, Çınar, Ayhan, Sönmez, Ay, Tan, Günay, Karataş, Akyüz, Oral, Yiğit, Ercan, Sezer, Çoban, Kurtuluş,
  Özbek, Ergün, Tuncer, Çakmak, Er, Ekici, Kaçar, Şeker, Aslantaş, Karakuş, Eroğlu, Akgün, Türk, Bilgin, Dinç, Akar, Güven, Bilgiç, Özen,
  Aydemir, Tatlı, Alkan, Atalay, Elmas, Gültekin, Aksu, Akdeniz, Aktürk, Çolak, Önder, Sevim, Bakır, Gezer, Ünlü, Kuru, Yaşar, Özçelik, Kurnaz,
  Tok, Dağ, Akdağ, Esen, Yazar, Duran, Yener, Başar, Bal, Kaçmaz, Özkaya, Akça, Bayrak, Ceylan, Dursun, Ekmekçi, Eser, Gürsoy, Karabulut,
  Karagöz, Kaymak, Kocaoğlu, Mutlu, Okur, Sezgin, Şener, Tuna, Uslu, Varol, Zorlu, Akçay, Alp, Altay, Arı, Balcı, Bektaş, Boz, Bozdağ, Cömert,
  Çalışkan, Çam, Çevik, Demirtaş, Dikmen, Erten, Gedik, Gökçe, Gönül, Güleç, Gümüş, Günaydın, Gür, Güzel, İnan, İpek, Kabak, Kalaycı,
  Karadeniz, Karahan, Kavak, Kaynak, Kesici, Koca, Kök, Köksal, Oğuz, Oktay, Orhan, Öz, Özbay, Özgen, Öztoprak, Özyurt, Pehlivan, Sağır,
  Saygılı, Seven, Şahan, Tanrıverdi, Taşdemir, Topal, Turgut, Tütüncü, Uğur, Ulusoy, Uyar, Ünver, Yakut, Yeşil, Yetkin, Yurdakul, Zeybek,
  Kırmızı, Karakoç, Çiçek, Aydoğdu, Şenol, Kocatürk, Sarıkaya, Arıcı, Çakar, Demirbaş, Altınok, Alptekin, Baysal, Bilici, Bingöl, Çakıroğlu,
  Dağdelen, Demirhan, Doğanay, Ertürk, Güngör, Kalender, Karabacak, Karaman, Koçak, Kuzu, Saraç, Selvi, Türkmen, Yalçınkaya, Akpınar, Akyol,
  Çetinkaya, Kahveci, Keleş, Kızılkaya, Özkök, Işık, Sarı, Ünal, Yüksel, Özer, Tunç, Ateş, Bulut, Kılıç, Aydoğan, Kocabaş, Aras, Bayraktar,
  Bozan, Ceran, Cin, Çağlar, Eryılmaz, Gök, Gülşen, Kalkan, Kanat, Karakurt, Kayaalp, Kılınç, Kurtoğlu, Mert, Öcal, Özdoğan, Özkara, Sarıgül, Sert, Soysal, Sümer, Taşçı, Tekeli, Terzi, Toker, Topçu, Uçan,
  Uzunoğlu, Yalçıner, Yavaş, Yazgan, Yeşilyurt, Yıldızhan, Yörük, Zengin, Avşar, Balık, Bağcı, Benli, Biçer, Bostancı, Cebeci, Çalık, Dalkılıç,
  Demirkol, Durak, Ekşi, Erbaş, Ergin, Eriş, Fidan, Göçmen, Güçlü, Gürel, Halıcı, Işıklar, Kalyoncu, Kara, Karadağ, Karakaya, Kavaklı,
  Kaygusuz, Kıraç, Kızıl, Kurşun, Metin, Nacar, Oruç, Özmen, Sağlam, Sevinç, Sezen, Solmaz, Süzer, Şanlı, Tekin, Tosun, Turhan, Uzun, Ülger,
  Yaman, Yazıcı, Yetim, Yıldırım, Akkuş, Alagöz, Atmaca, Ayaz, Babaoğlu, Bulut, Canpolat, Coşar, Çağır, Deniz, Dumlu, Erkan, Gençer, Gürler,
  İlhan, Kapan, Karaaslan, Kaygısız, Koyuncu, Kuş, Örnek, Önen, Özsoy, Soydan, Şeref, Taşkıran, Uğurlu, Yamaç, Yolcu`);
const TR_E0 = w(`Mehmet, Ahmet, Mustafa, Ali, Hüseyin, Hasan, İbrahim, İsmail, Osman, Yusuf, Süleyman, Halil, Ramazan, Abdullah, Mahmut, Recep, Murat,
  Salih, Kemal, Hakkı, Halit, Hamdi, Hayri, Hikmet, Hilmi, İlhan, İsa, İzzet, Kadir, Kamil, Kazım, Lütfi, Mahir, Mazhar, Mecit, Mehmet Ali,
  Muammer, Muharrem, Muhittin, Muzaffer, Nazım, Necati, Necdet, Nevzat, Nihat, Nuri, Nusret, Orhan, Ömer, Rahmi, Rasim, Rauf, Remzi, Rıza, Rüştü,
  Sabri, Sadık, Sadettin, Selahattin, Selim, Sait, Sami, Şaban, Şakir, Şevket, Şükrü, Tahir, Tahsin, Talat, Tevfik, Turgut, Vahit, Veli, Yakup,
  Yaşar, Zeki, Ziya, Abdurrahman, Adem, Adil, Akif, Arif, Asım, Avni, Aydın, Bahri, Bayram, Bekir, Bilal, Burhan, Cafer, Cahit, Celal, Cemal,
  Cemil, Cevdet, Cevat, Davut, Dursun, Ekrem, Emin, Enver, Erol, Eşref, Ethem, Fahri, Faruk, Fazıl, Ferit, Fikret, Fuat, Galip, Haydar, Hulusi,
  Hüsnü, Kenan, Kerim, Mevlüt, Metin, Musa, Mümin, Nail, Naci, Niyazi, Oktay, Rıdvan, Ruhi, Sedat, Sezai, Tanju, Turan, Ünal, Yılmaz, Zekeriya`);
const TR_E1960 = w(`Mehmet, Ahmet, Mustafa, Ali, Hüseyin, Hasan, İbrahim, İsmail, Osman, Yusuf, Süleyman, Halil, Ramazan, Abdullah, Mahmut, Recep, Murat,
  Salih, Kemal, Metin, Erol, Erdal, Erkan, Ercan, Erhan, Hakan, Bülent, Levent, Kenan, Kadir, Kerim, Nihat, Necati, Nevzat, Orhan, Ömer, Sedat,
  Selim, Sinan, Tamer, Taner, Tarık, Tayfun, Tuncay, Turgay, Tuncer, Ünal, Yavuz, Yılmaz, Zafer, Adnan, Ayhan, Aydın, Bayram, Bekir, Cengiz,
  Cemal, Cemil, Coşkun, Doğan, Ekrem, Engin, Enver, Erdinç, Ertan, Ertuğrul, Fahri, Faruk, Fatih, Ferhat, Fikret, Gökhan, Güven, Halit, Haydar,
  Hayati, Hikmet, İlhan, İlker, İsa, Kamil, Kazım, Koray, Mahir, Mesut, Mevlüt, Muammer, Murat Han, Musa, Muzaffer, Naci, Nazım, Nedim, Nuri,
  Oğuz, Okan, Oktay, Onur, Ozan, Rıza, Sabri, Sadık, Saffet, Sami, Savaş, Selçuk, Serdar, Serkan, Sezgin, Şahin, Şenol, Şükrü, Tahsin, Talat,
  Tanju, Tevfik, Tolga, Turan, Uğur, Umut, Volkan, Yakup, Yaşar, Yücel, Zeki, Ziya, Ahmet Ali, Alper, Atilla, Aykut, Burhan, Celal, Cüneyt,
  Erkut, Ferit, Gürsel, Hilmi, Kaya, Kubilay, Levent Ali, Nail, Necdet, Niyazi, Rüştü, Selahattin, Seyfi, Tufan, Yalçın`).filter((n) => !n.includes(' '));
const TR_E1970 = w(`Mehmet, Ahmet, Mustafa, Ali, Hüseyin, Hasan, İbrahim, İsmail, Osman, Yusuf, Murat, Hakan, Serkan, Ercan, Erkan, Erhan, Levent, Bülent,
  Kenan, Kadir, Tolga, Volkan, Gökhan, Sinan, Selçuk, Serdar, Cengiz, Cem, Emre, Ozan, Okan, Onur, Oğuz, Umut, Uğur, Barış, Burak, Tuncay, Tamer,
  Taner, Tarık, Tayfun, Kerem, Koray, Mert, Mesut, Fatih, Ferhat, Engin, Erdem, Erdinç, Ertan, Ertuğrul, Alper, Atilla, Aykut, Cüneyt, Deniz,
  Doğan, Erol, Erdal, Ersin, Evren, Fırat, Gürkan, Halil, Haluk, İlker, Kaan, Kamil, Kaya, Korhan, Kubilay, Mahmut, Metin, Muhammet, Mücahit,
  Nihat, Nuri, Oktay, Orhan, Ömer, Özgür, Recep, Salih, Savaş, Sedat, Selim, Semih, Sezgin, Soner, Süleyman, Şahin, Şenol, Tufan, Turgay,
  Ümit, Yalçın, Yasin, Yavuz, Yener, Yücel, Zafer, Abdullah, Adem, Adnan, Arif, Aydın, Bayram, Birol, Bora, Çağatay, Ekrem, Emrah, Emin,
  Enver, Fikret, Gökay, Güray, Hilmi, Ilgaz, İsa, Kemal, Levent, Mevlüt, Murat Can, Musa, Nevzat, Ramazan, Rıza, Sabri, Sami, Sertaç, Taylan,
  Tekin, Tuğrul, Yakup, Yunus`).filter((n) => !n.includes(' '));
const TR_E1980 = w(`Mehmet, Mustafa, Ahmet, Ali, Hüseyin, Hasan, Murat, İbrahim, Emre, Fatih, Burak, Serkan, Yusuf, Ömer, Osman, İsmail, Volkan, Gökhan,
  Hakan, Onur, Uğur, Kemal, Erkan, Ercan, Erhan, Kadir, Mesut, Mert, Ozan, Sinan, Tolga, Umut, Barış, Kerem, Kaan, Cem, Can, Caner, Cihan, Deniz,
  Emrah, Engin, Erdem, Eren, Ferhat, Fırat, Gürkan, Halil, İlker, Koray, Levent, Mahmut, Mehmet Ali, Muhammet, Mücahit, Okan, Oğuz, Oğuzhan,
  Orhan, Özgür, Recep, Salih, Savaş, Selçuk, Semih, Serdar, Sezgin, Soner, Süleyman, Şahin, Taner, Tarık, Tayfun, Tuncay, Ümit, Yasin, Yavuz,
  Yunus, Abdullah, Adem, Alper, Anıl, Arda, Aykut, Batuhan, Berk, Bilal, Bora, Burhan, Cüneyt, Çağlar, Çağrı, Doğan, Doğukan, Emin, Ender,
  Ersin, Evren, Fuat, Furkan, Göksel, Güven, Harun, İlhan, Kamil, Kenan, Korkmaz, Mehmet Can, Melih, Metin, Musa, Necati, Nihat, Nuri, Oktay,
  Onur Can, Ramazan, Rıdvan, Sabri, Sadık, Sedat, Selim, Serhat, Sercan, Sertaç, Tamer, Tugay, Tunahan, Uğurcan, Utku, Yakup, Yiğit, Zafer`)
  .filter((n) => !n.includes(' '));
const TR_E1990 = w(`Mehmet, Mustafa, Ahmet, Ali, Hüseyin, Hasan, Murat, İbrahim, Emre, Burak, Fatih, Yusuf, Ömer, Osman, İsmail, Furkan, Enes, Muhammed,
  Muhammet, Mert, Kaan, Can, Cem, Caner, Onur, Oğuzhan, Serkan, Gökhan, Volkan, Uğur, Umut, Barış, Kerem, Arda, Berk, Berkay, Batuhan, Bilal,
  Buğra, Cihan, Doğukan, Efe, Emir, Emirhan, Emrah, Engin, Erdem, Eren, Ersin, Ferhat, Fırat, Göktuğ, Gürkan, Halil, Harun, Hakan, İlker,
  Kadir, Kemal, Koray, Mahmut, Melih, Mesut, Mücahit, Okan, Oğuz, Orhan, Ozan, Recep, Salih, Samet, Selçuk, Semih, Serdar, Serhat, Sercan,
  Sinan, Süleyman, Şahin, Taha, Tarık, Tolga, Tuncay, Tunahan, Ufuk, Uğurcan, Utku, Yasin, Yiğit, Yunus, Abdullah, Abdulkadir, Adem, Alper,
  Anıl, Atakan, Aykut, Baran, Berat, Burhan, Çağatay, Çağlar, Çağrı, Erkan, Erhan, Ercan, Furkan Can, İsa, Kaya, Kubilay, Levent, Metehan,
  Muhammed Ali, Musa, Necati, Onurcan, Ramazan, Rıdvan, Sefa, Selim, Sertaç, Sezer, Talha, Taner, Tayfun, Turgay, Ümit, Volkan, Yavuz, Yusuf Ali,
  Zafer, Hamza, Hüseyin Can, Kerim, Malik`).filter((n) => !n.includes(' '));
const TR_E2000 = w(`Yusuf, Mustafa, Mehmet, Ahmet, Emir, Ömer, Muhammed, Eren, Enes, Furkan, Berat, Emirhan, Efe, Ali, Hüseyin, Hasan, İbrahim, Mert,
  Kerem, Arda, Yiğit, Burak, Berkay, Batuhan, Kaan, Can, Baran, Doğukan, Emre, Eymen, Hamza, Hüseyin Efe, İsmail, Kadir, Mehmet Ali, Metehan,
  Muhammet, Murat, Osman, Ozan, Oğuz, Oğuzhan, Recep, Salih, Samet, Semih, Taha, Talha, Tuna, Tunahan, Umut, Utku, Yasin, Yunus, Yunus Emre,
  Abdullah, Ahmet Can, Alp, Alperen, Anıl, Atakan, Ayaz, Barış, Berk, Bilal, Buğra, Çağan, Çınar, Deniz, Doruk, Ege, Egemen, Ensar, Erkan,
  Eyüp, Fatih, Göktuğ, Görkem, Halil, Harun, İlyas, Kağan, Kerim, Kutay, Melih, Miraç, Muhammed Ali, Musa, Mustafa Kemal, Onur, Onurcan, Orhan,
  Ömer Faruk, Rüzgar, Sefa, Selim, Serhat, Sinan, Şahin, Tarık, Tolga, Tuğra, Uğur, Uğurcan, Yağız, Yavuz, Yiğit Efe, Zeki, Abdulkadir, Adem,
  Aras, Bora, Cem, Cihan, Çağrı, Emin, Eray, Ercan, Ertuğrul, Furkan Can, Hakan, İlker, Kemal, Koray, Mahmut, Mirza, Nihat, Serkan, Sercan,
  Volkan, Barkın, Berkan, Kaya, Selçuk`).filter((n) => !n.includes(' '));
const TR_E2010 = w(`Yusuf, Eymen, Ömer Asaf, Alparslan, Miraç, Göktuğ, Mustafa, Ömer, Muhammed, Kerem, Emir, Ahmet, Mehmet, Ali, Hamza, Ayaz, Aras,
  Yiğit, Efe, Kuzey, Çınar, Poyraz, Mert, Eren, Berat, Emirhan, Enes, Furkan, Arda, Kaan, Can, Baran, Doruk, Ege, Atlas, Aslan, Asaf, Ali Asaf,
  Yağız, Rüzgar, Alp, Alperen, Batuhan, Berkay, Burak, Çağan, Deniz, Doğukan, Egemen, Ensar, Hasan, Hüseyin, İbrahim, İsmail, Kağan, Kerim,
  Mehmet Akif, Metehan, Muhammet, Murat, Osman, Ozan, Oğuz, Salih, Selim, Semih, Taha, Talha, Tuna, Tunahan, Umut, Utku, Yasin, Yunus, Yunus Emre,
  Abdullah, Bora, Barış, Berk, Bilal, Buğra, Cem, Demir, Eymen Ali, Fatih, Görkem, Halil, Harun, İlyas, Kayra, Kutay, Melih, Musa, Onur, Sarp,
  Serhat, Sinan, Tarık, Tolga, Tuğra, Uğur, Yavuz, Zeki, Mirza, Aybars, Batın, Bartu, Berkan, Çağrı, Emin, Erdem, Kaya, Koray, Mahir,
  Recep, Sadık, Sefa, Toprak, Yahya, Zeynel`).filter((n) => !n.includes(' '));

// --- Deutschland: Familien aus der Türkei und aus Italien ------------------------
const GTR_E0 = w(`Mehmet, Ahmet, Mustafa, Ali, Hüseyin, Hasan, İbrahim, İsmail, Osman, Yusuf, Süleyman, Halil, Ramazan, Abdullah, Mahmut, Recep, Murat,
  Salih, Kemal, Metin, Erol, Erdal, Erkan, Ercan, Erhan, Hakan, Bülent, Levent, Kenan, Kadir, Kerim, Nihat, Necati, Nevzat, Orhan, Ömer, Sedat,
  Selim, Sinan, Tamer, Taner, Tarık, Tayfun, Tuncay, Turgay, Ünal, Yavuz, Yılmaz, Zafer, Adnan, Ayhan, Aydın, Bayram, Bekir, Cengiz, Cemal, Cem,
  Coşkun, Doğan, Engin, Ertan, Fahri, Faruk, Fatih, Ferhat, Gökhan, Haydar, İlhan, İsa, Kazım, Mesut, Musa, Nuri, Oğuz, Okan, Rıza, Sabri,
  Sami, Selçuk, Serdar, Serkan, Şahin, Şenol, Tevfik, Turan, Uğur, Yakup, Yaşar, Zeki, Hıdır, Cafer, Haydar, Veli, Rıdvan, Emin`);
const GTR_E1985 = w(`Serkan, Kerem, Deniz, Barış, Emre, Can, Okan, Mert, Taner, Burak, Erhan, Tolga, Kaan, Volkan, Gökhan, Ahmet, Ali, Cihan, Engin, Erkan,
  Hakan, Kemal, Mustafa, Onur, Serdar, Tayfun, Mehmet, Murat, Hasan, Hüseyin, İbrahim, Yusuf, Ömer, Osman, Fatih, Furkan, Enes, Muhammed, Kadir,
  Halil, Mahmut, Recep, Salih, Selim, Sinan, Tarık, Uğur, Umut, Yasin, Yunus, Caner, Cem, Emrah, Erdem, Eren, Ercan, Ferhat, Fırat, Gürkan,
  İlker, Koray, Levent, Melih, Mesut, Oğuz, Oğuzhan, Orhan, Ozan, Özgür, Semih, Sercan, Serhat, Sezer, Süleyman, Şahin, Tuncay, Ümit, Yavuz,
  Yiğit, Abdullah, Adem, Alper, Anıl, Arda, Aykut, Batuhan, Berk, Berkay, Bilal, Çağlar, Çağrı, Doğan, Doğukan, Emin, Emir, Ender, Ersin, Evren,
  Harun, İsmail, Kenan, Kubilay, Metin, Musa, Necati, Nihat, Ramazan, Sedat, Taylan, Timur, Tunahan, Utku, Dennis, Kevin, Marcel, Patrick,
  Daniel, Michael, Marco, Pascal, Sascha, Tobias, Jan, Dominik, Benjamin, Erik, Timo, Okay, Ilkay, Volkan, Gökay, Sertaç, Selçuk, Tamer`);
const GTR_E2000 = w(`Yusuf, Emre, Can, Kaan, Mert, Deniz, Eren, Arda, Efe, Emir, Ömer, Kerem, Berkan, Enes, Elias, Yunus, Ali, Aykut, Batuhan, Berat,
  Muhammed, Mustafa, Onur, Tarık, Ahmet, Mehmet, Hamza, Furkan, Emirhan, Burak, Baran, Berkay, Yiğit, Ayaz, Aras, Eymen, Miraç, Göktuğ, Alparslan,
  Çınar, Kuzey, Poyraz, Doruk, Ege, Alp, Alperen, Bilal, Taha, Talha, Yasin, Selim, Sinan, Hasan, Hüseyin, İbrahim, İsmail, Kadir, Kemal, Murat,
  Osman, Ozan, Oğuz, Salih, Semih, Tuna, Umut, Utku, Barış, Berk, Cem, Cihan, Doğukan, Ensar, Harun, Kerim, Melih, Musa, Serkan, Tolga, Uğur,
  Yavuz, Abdullah, Adem, Anıl, Atakan, Batın, Kağan, Kayra, Metehan, Leon, Noah, Luca, Ben, Finn, Jonas, Elias, Adam, Malik, Amir, Ilyas, Yasin,
  Yunus Emre, Kaya, Timur, Deniz Can, Mikail, Sami, Emin`).filter((n) => !n.includes(' '));

const GIT_LAST = u(IT_SUED, IT_SIZ, w(`Sardo, Pinna, Porcu, Mura, Manca, Carta, Zanetti, Furlan, Marchi, Moretti, Bertoni, Colella, Morelli, Coppola, D'Amico,
  Puglisi, Spinelli, Nardone, Galante, Santangelo, Di Pietro, Di Marco, Di Lorenzo, D'Alessandro, Ciccarelli, Mattei, Ferretti, Martinelli,
  Bruno, Leone, Gentile, Caputo, Palumbo, Longo, Rinaldi, De Rosa, Pagano, Ruggiero, Cirillo`));
const GIT_E0 = w(`Giuseppe, Giovanni, Antonio, Mario, Luigi, Francesco, Angelo, Vincenzo, Pietro, Salvatore, Carlo, Franco, Domenico, Bruno, Paolo,
  Michele, Giorgio, Sergio, Luciano, Renato, Raffaele, Rocco, Pasquale, Gennaro, Carmine, Ciro, Rosario, Vito, Nicola, Gaetano, Cosimo, Calogero,
  Carmelo, Antonino, Gerardo, Giacomo, Gianni, Enzo, Roberto, Claudio, Massimo, Maurizio, Stefano, Fabrizio, Marco, Luca, Alessandro, Andrea,
  Daniele, Dario, Davide, Fabio, Gianluca, Gianfranco, Giancarlo, Leonardo, Lorenzo, Marcello, Mauro, Nino, Piero, Riccardo, Sandro, Silvio,
  Tommaso, Umberto, Vittorio, Walter, Agostino, Alfonso, Arturo, Biagio, Damiano, Emilio, Italo, Orazio, Santo, Sebastiano, Natale`);
const GIT_E1980 = w(`Luca, Marco, Gianluca, Alessandro, Nico, Dario, Matteo, Fabio, Enrico, Simone, Daniele, Leonardo, Fabrizio, Kevin, Andrea,
  Antonio, Giuseppe, Francesco, Salvatore, Vincenzo, Giovanni, Davide, Stefano, Roberto, Massimo, Mario, Angelo, Pietro, Michele, Domenico,
  Rocco, Raffaele, Pasquale, Carmine, Gaetano, Rosario, Cosimo, Nicola, Christian, Cristian, Manuel, Mirko, Riccardo, Federico, Lorenzo,
  Giacomo, Emanuele, Alessio, Mattia, Gabriele, Samuele, Tommaso, Valerio, Denis, Dennis, Patrick, Pascal, Sascha, Marcel, Daniel, Michael,
  Sandro, Mauro, Claudio, Marcello, Fabian, Tobias, Dominik, Toni, Tino, Enzo, Dino, Gino, Rino, Vito, Ciro`);
const GIT_E2000 = w(`Luca, Matteo, Leonardo, Gabriele, Lorenzo, Noah, Elia, Nico, Enzo, Liam, Alessio, Mattia, Alessandro, Francesco, Giuseppe, Antonio,
  Marco, Andrea, Davide, Daniele, Simone, Federico, Riccardo, Tommaso, Samuele, Emanuele, Giovanni, Pietro, Michele, Salvatore, Vincenzo,
  Raffaele, Rocco, Dario, Fabio, Mario, Angelo, Domenico, Christian, Manuel, Kevin, Fabian, Leon, Elias, Ben, Finn, Jonas, Paul, Julian, Luis,
  Tim, Nils, Dennis, Marcel, Samuel, Gabriel, Diego, Fabrizio, Nicolò, Jacopo, Filippo, Gioele, Edoardo, Achille, Enea, Dante, Matthias, Milan,
  Valentino, Ennio, Emilio, Massimo`);

export const XL4_SOUTH: Record<string, XLNames> = {
  ita: {
    last: ITA,
    eras: [[0, IT_E0], [1950, IT_E1950], [1960, IT_E1960], [1970, IT_E1970], [1980, IT_E1980], [1990, IT_E1990], [2000, IT_E2000], [2010, IT_E2010]],
  },
  esp: {
    last: ESP,
    eras: [[0, ES_E0], [1950, ES_E1950], [1960, ES_E1960], [1970, ES_E1970], [1980, ES_E1980], [1990, ES_E1990], [2000, ES_E2000], [2010, ES_E2010]],
  },
  por: {
    last: POR,
    eras: [[0, PT_E0], [1960, PT_E1960], [1980, PT_E1980], [2000, PT_E2000], [2010, PT_E2010]],
  },
  gre: {
    last: GRE,
    eras: [[0, GR_E0], [1970, GR_E1970], [1990, GR_E1990], [2010, GR_E2010]],
  },
  tur: {
    last: TUR,
    eras: [[0, TR_E0], [1960, TR_E1960], [1970, TR_E1970], [1980, TR_E1980], [1990, TR_E1990], [2000, TR_E2000], [2010, TR_E2010]],
  },
  ger_tr: {
    last: TUR,
    eras: [[0, GTR_E0], [1985, GTR_E1985], [2000, GTR_E2000]],
  },
  ger_it: {
    last: GIT_LAST,
    eras: [[0, GIT_E0], [1980, GIT_E1980], [2000, GIT_E2000]],
  },
  ...XL4_SOUTH2,
};
