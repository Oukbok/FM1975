// =============================================================================
// Erklärtexte für die i-Hilfen (<InfoTip k="…" />, src/ui/InfoTip.tsx)
// =============================================================================
// Ein Eintrag = Titel + 1–3 Sätze, deutsch, „du“. `wiki` verweist auf einen
// Artikel in data/wiki.ts (Knopf „Mehr im Wiki“). Neue Begriffe hier ergänzen,
// nicht in den Seiten. Zahlen nur nennen, wenn sie im Code so feststehen.
// =============================================================================

export interface InfoText {
  title: string;
  text: string;
  /** Artikel-ID in data/wiki.ts */
  wiki?: string;
}

export const INFO_TEXTS = {
  // ---------------------------------------------------------------- Spielplan
  spielplan: {
    title: 'Spielplan & Termine',
    text: 'Kein Verein spielt an zwei Tagen hintereinander – zwischen zwei Pflichtspielen liegen mindestens zwei Tage. Pokal und Europapokal haben eigene Wochen; Wetter kann Spiele absagen (früher oft, heute selten), das Nachholspiel liegt dann unter der Woche, spätestens vor den letzten zwei Spieltagen.',
    wiki: 'match-calendar',
  },
  // ---------------------------------------------------------------- Weltdaten (Assistent)
  startjahr: {
    title: 'Startjahr',
    text: 'Die Welt entsteht so, wie sie in dieser Saison war: Ligen, Europapokal-Teilnehmer, Regeln und Preise der Epoche. Ansehen und Kaderstärke richten sich nach der Vorsaison – wie die Startsaison ausgeht, ist offen.',
    wiki: 'world-start',
  },
  simtiefe: {
    title: 'Simulationstiefe',
    text: 'Deine Liga läuft mit vollen Kadern. „Spiel für Spiel“ rechnet ein Land mit Spielplan, Tabelle und Auf-/Abstieg; „Hintergrund“ einmal je Saison. Beides kostet kaum Rechenzeit.',
    wiki: 'world-start',
  },
  // ---------------------------------------------------------------- Spieler-Zustand
  frische: {
    title: 'Frische',
    text: 'Wie ausgeruht ein Spieler gerade ist (0–100). Nach Spielen sinkt sie stark und erholt sich über mehrere Tage; je niedriger sie ist, desto schneller gehen dem Spieler im Spiel die Kräfte aus. Batterie dunkelgrün = voll erholt, rot = erschöpft.',
    wiki: 'condition-frische',
  },
  fitness: {
    title: 'Fitness',
    text: 'Grundkondition – baut sich über Training langsam auf und sinkt durch Einsätze. Geht leicht in die Tagesstärke ein (Fitness 0 = rund 10 % weniger). Hantel dunkelgrün = topfit, rot = kaum belastbar.',
    wiki: 'condition-fitness',
  },
  form: {
    title: 'Form',
    text: 'Form zeigt, wie gut ein Spieler im System zurechtkommt (0–100, 50 = Durchschnitt). Gute Noten, Siege und sinnvolles Training heben sie; sie wirkt leicht auf die Leistung (bis ±2,5 %). Daumen in kräftigem Grün = Topform, blasses Grau-Grün = Formtief.',
    wiki: 'condition-form',
  },
  moral: {
    title: 'Moral',
    text: 'Wie zufrieden der Spieler gerade ist – in fünf Stufen, als Smiley von rot (sehr unzufrieden) bis dunkelgrün (sehr glücklich). Moral wirkt leicht auf Leistung und Entwicklung und beeinflusst Vertragsgespräche.',
    wiki: 'condition-form',
  },
  kraft: {
    title: 'Kraft im Spiel',
    text: 'Verbleibende Kraft während der Partie. Sie sinkt mit jeder Minute – je nach Ausdauer, Laufarbeit und Taktik. Müde Spieler verlieren an Tempo und Zweikampfstärke; ein frischer Einwechselspieler hilft.',
    wiki: 'match-engine',
  },
  konstanz: {
    title: 'Konstanz',
    text: 'Verdeckter Wert: wie stark die Leistung von Spiel zu Spiel schwankt. Du siehst nur die Einschätzung deines Trainerteams bzw. deiner Scouts – je länger du den Spieler kennst, desto treffsicherer.',
    wiki: 'player-hidden-values',
  },
  trainingsfleiss: {
    title: 'Trainingsfleiß',
    text: 'Verdeckter Wert: wie professionell ein Spieler arbeitet. Fleißige Spieler entwickeln sich schneller und bauen im Alter langsamer ab. Du siehst nur die Einschätzung deines Trainerteams bzw. deiner Scouts.',
    wiki: 'player-hidden-values',
  },
  nervenstaerke: {
    title: 'Nervenstärke',
    text: 'Verdeckter Wert: wie gut ein Spieler mit großen Spielen umgeht – Derbys, Pokal, Europapokal. Du siehst nur die Einschätzung deines Trainerteams bzw. deiner Scouts, keine Zahl.',
    wiki: 'player-hidden-values',
  },

  // ---------------------------------------------------------------- Spieler-Bewertung
  staerke: {
    title: 'Stärke',
    text: 'Gesamtwert des Spielers auf seiner Stammposition (0–100), berechnet aus den für diese Position wichtigen Attributen. Auf fremden Positionen ist er schwächer.',
    wiki: 'squad-attributes',
  },
  potenzial: {
    title: 'Potenzial (Scout-Sterne)',
    text: 'Einschätzung deiner Scouts, wie gut der Spieler einmal werden kann – als Spanne in Sternen (bis 5). Je besser dein Scouting und je länger du ihn beobachtest, desto enger die Spanne; danebenliegen können die Scouts trotzdem.',
    wiki: 'youth-potential',
  },
  eignung: {
    title: 'Eignung',
    text: 'Wie gut der Spieler auf genau diese Position passt (0–100). Auf der Stammposition entspricht sie der Stärke, auf Nebenpositionen etwas weniger, auf fremden deutlich weniger.',
    wiki: 'suitability',
  },
  vertrautheit: {
    title: 'Vertraute Positionen',
    text: 'Wie viele Spieler der Startelf auf ihrer Stamm- oder Nebenposition stehen. Spieler auf ungewohnten Positionen spielen unter ihrer Stärke und machen mehr Fehler.',
    wiki: 'position-weights',
  },
  marktwert: {
    title: 'Marktwert',
    text: 'Grobe Schätzung, was der Spieler auf dem Transfermarkt bringt – aus Stärke, Alter, Potenzial und Vertragslaufzeit. Die tatsächliche Forderung des Vereins kann deutlich darüber oder darunter liegen.',
    wiki: 'transfers-market',
  },
  zufriedenheit: {
    title: 'Zufriedenheit',
    text: 'Wie wohl sich der Spieler mit Vertrag, Einsatzzeit und Verein fühlt (0–100). Unter etwa 45 denkt er an einen Wechsel, lässt sich leichter abwerben und stört den Kabinenfrieden.',
    wiki: 'squad-contracts',
  },
  persoenlichkeit: {
    title: 'Persönlichkeit',
    text: 'Verdeckte Charakterzüge wie Ehrgeiz, Treue, Geldgier oder Heimatverbundenheit. Sie bestimmen, was ein Spieler sich wünscht und wohin er wechseln möchte – deine Scouts erkennen sie nur nach und nach.',
    wiki: 'transfers-wishes',
  },
  karrierephase: {
    title: 'Karrierephase',
    text: 'Junge Spieler wollen Einsatzzeit und Entwicklung, Spieler im besten Alter Titel oder Geld, ältere eher Sicherheit und Heimatnähe. Die Phase verschiebt, welche Wünsche zählen.',
    wiki: 'transfers-wishes',
  },
  teamchemie: {
    title: 'Teamchemie',
    text: 'Stimmung der Mannschaft als Ganzes: überwiegend aus der Moral, zum kleineren Teil aus der Form aller Spieler. Eine gute Chemie hilft in engen Spielen.',
    wiki: 'condition-form',
  },

  // ---------------------------------------------------------------- Training
  trainingsplan: {
    title: 'Wochen-Trainingsplan',
    text: 'Bis zu drei Einheiten pro Tag. Hohe Intensität bringt mehr Fortschritt, kostet aber Fitness und Frische; Regeneration baut sie wieder auf. Vor Spieltagen lieber leicht trainieren.',
    wiki: 'training-planner',
  },
  wochenwirkung: {
    title: 'Trainingsinfo',
    text: 'Zustand deines Kaders (Durchschnitt) und was die angezeigte Woche bringt: Fitness je Trainingstag, Verletzungsrisiko, Entwicklungstempo und die Schwerpunkte je Bereich. Die Balken lenken, welche Attribute bei den nächsten Bewertungen wachsen.',
    wiki: 'training-planner',
  },
  trainingIntensitaet: {
    title: 'Intensität',
    text: 'Wie hart die Woche ist – gemessen an der Fitness-Bilanz je Trainingstag (Grund-Erholung 10 minus Belastung). Ab „Sehr hart“ sinkt die Fitness, Verletzungen werden wahrscheinlicher und Überlastung bremst die Entwicklung.',
    wiki: 'training-fitness',
  },
  trainingsgruppen: {
    title: 'Trainingsgruppen',
    text: 'Dein Kader nach dem, wie er gerade trainiert: Torhüter, Förderspieler, Positionstraining, Angeschlagene (Fitness unter 50) und Verletzte. Alle außer den Verletzten folgen dem Wochenplan; die Gruppen ergeben sich von selbst.',
    wiki: 'training-planner',
  },
  langfristig: {
    title: 'Saisonverlauf',
    text: 'Jede kommende Woche bis Saisonende mit den echten Spielterminen und dem Plan, der dann gilt. Wähle eine Woche und eine Vorlage: Ab diesem Montag lädt der Trainerstab die Vorlage in deinen Wochenplan.',
    wiki: 'training-planner',
  },
  schwerpunkte: {
    title: 'Schwerpunkte der Woche',
    text: 'Welche Attribute dein Plan diese Woche besonders fördert. Training füllt verdeckte Fortschrittswerte – sichtbar wird ein Punkt erst nach einiger Zeit.',
    wiki: 'training-planner',
  },
  belastung: {
    title: 'Belastung',
    text: 'Durchschnittliche Frische und Fitness deines Kaders. Liegt die Frische dauerhaft niedrig, steigen Verletzungsrisiko und Leistungsabfall – dann Regeneration einplanen.',
    wiki: 'training-fitness',
  },
  philosophie: {
    title: 'Trainingsphilosophie',
    text: 'Grundausrichtung je Saisonabschnitt, z. B. mehr Kondition in der Vorbereitung oder Spielfrische in der Rückrunde. Schwerpunkte bringen Vorteile, haben aber auch Nebenwirkungen.',
    wiki: 'training-philosophy',
  },
  foerderspieler: {
    title: 'Förderspieler',
    text: 'Bis zu drei Spieler, um die sich das Trainerteam besonders kümmert: Sie entwickeln sich etwa ein Viertel schneller, der Rest des Kaders bekommt etwas weniger Aufmerksamkeit.',
    wiki: 'training-philosophy',
  },
  trainingslager: {
    title: 'Trainingslager',
    text: 'Ein paar Tage abseits des Alltags im Sommer oder Winter. Je nach Ziel, Unterkunft und Schwerpunkt bringt es Fitness, Zusammenhalt oder Taktik – Reise und hartes Programm kosten aber Frische und Geld.',
    wiki: 'training-camps',
  },
  campPoints: {
    title: 'Punkteverteilung im Trainingslager',
    text: 'Du verteilst 21 Punkte auf sieben Bereiche (höchstens 8 je Bereich). Drei je Bereich entsprechen dem ausgewogenen Lager; mehr Punkte verstärken die Wirkung des Bereichs, weniger schwächen sie. Die Punkte auf Taktik bezahlen die Taktik-Inhalte.',
    wiki: 'training-camps',
  },
  hoehentraining: {
    title: 'Höhentraining',
    text: 'Training in der Höhe wirkt verzögert: Erst einige Tage nach der Rückkehr steigt die Fitness spürbar. Direkt danach sind die Spieler eher müde.',
    wiki: 'training-camps',
  },
  sponsorpflicht: {
    title: 'Sponsor-Pflichtreise',
    text: 'Manche Sponsoren verlangen im Vertrag ein Trainingslager oder eine Reise in ihr Land. Lässt du sie aus, sinkt das Ansehen beim Partner und es kann Geld kosten.',
    wiki: 'training-camps',
  },
  halle: {
    title: 'Hallenfußball',
    text: 'Von 1976 bis 2004 gab es im Winter Hallenturniere. Eine Zusage bringt Antrittsgeld, Prämien und – in der eigenen Stadt – etwas Fan-Stimmung, kostet aber deutlich Frische und birgt Verletzungsrisiko.',
    wiki: 'indoor-football',
  },
  hallenWertung: {
    title: 'Masters-Wertung',
    text: 'Gewertet werden alle Spiele der Qualifikationsturniere: entscheidend ist der Schnitt (Ø Punkte je Spiel), bei Gleichstand die Tordifferenz je Spiel, dann die Tore – ein starkes Turnier kann reichen. Die besten 8 Vereine der beiden oberen Ligen fahren zum Masters; wer verzichtet oder noch ein Pflichtspiel hat, macht Platz für Nachrücker. Ohne Masters (vor 1988, nach 2001) zählen Turniersiege, dann Punkte.',
    wiki: 'indoor-football',
  },
  ligaLand: {
    title: 'Land wählen',
    text: 'Schalte durch die Ligen anderer Länder: Heimatland, DDR und Länder „Spiel für Spiel“ mit voller Tabelle, Länder im Hintergrund mit der Abschluss-Reihenfolge (die Saison wird dort erst am Saisonende in einem Zug gerechnet). Saisons vor Spielbeginn kommen aus den Weltdaten.',
    wiki: 'world-start',
  },
  hallenMasters: {
    title: 'Hallen-Masters',
    text: 'Das Finalturnier der Hallensaison (1988–2001) für die besten Mannschaften der Tour. Ein Sieg bringt eine Prämie, für die Liga zählt er nicht.',
    wiki: 'indoor-football',
  },

  // ---------------------------------------------------------------- Taktik
  mentalitaet: {
    title: 'Mentalität',
    text: 'Grundhaltung deiner Elf. Offensiv bringt mehr Angriffe, öffnet aber Räume; defensiv steht sicherer, schafft weniger Chancen; Konter lauert auf Ballgewinne und schnelle Wege nach vorn.',
    wiki: 'tactics',
  },
  mitBall: {
    title: 'Mit Ball',
    text: 'Tempo, Breite und Aufbauspiel bestimmen, wie deine Mannschaft angreift. Hohes Tempo und langes Spiel sind direkter, kosten aber mehr Ballverluste und Kraft.',
    wiki: 'tactic-options',
  },
  gegenBall: {
    title: 'Gegen den Ball',
    text: 'Pressinghöhe, Abwehrlinie und Zweikampfhärte. Hohes Pressing erobert Bälle weit vorn, verbraucht aber viel Kraft; eine hohe Linie ist anfällig für Steilpässe, harte Zweikämpfe bringen Karten.',
    wiki: 'tactic-options',
  },
  flankenart: {
    title: 'Flankenart',
    text: 'Hoch: Kopfballduelle im Strafraum – lohnt mit kopfballstarken, großen Stürmern. Flach: scharf in den Rückraum, für schnelle, abschlussstarke Angreifer. Wie oft geflankt wird, regelt die Breite.',
    wiki: 'tactic-options',
  },
  abseitsfalle: {
    title: 'Abseitsfalle',
    text: 'Die Abwehr rückt gemeinsam heraus, um Gegner ins Abseits zu stellen. Klappt es, ist der Angriff vorbei – verpasst einer den Moment, steht ein Stürmer allein vor dem Tor.',
    wiki: 'tactic-options',
  },
  wirkung: {
    title: 'Wirkung im Spiel',
    text: 'Gemessen, nicht geschätzt: Die Match-Engine spielt deine Elf mit deiner und mit neutraler Taktik je 40-mal daheim und auswärts. Links neutral, rechts deine Einstellung; orange = Nachteil. Kein Wert ist „gratis“.',
    wiki: 'tactic-options',
  },
  formation: {
    title: 'Formation',
    text: 'Grundordnung auf dem Platz. Libero-Systeme prägen die 70er und 80er, die Viererkette setzt sich in den 90ern durch. Die Formation legt fest, welche Positionen du besetzen musst.',
    wiki: 'tactics',
  },
  standards: {
    title: 'Kapitän & Standards',
    text: 'Die Führungsstärke des Kapitäns verstärkt deine Zurufe im Textmodus. Die Schützen führen Elfmeter, Freistöße und Ecken aus – gute Schützen machen aus Standards echte Chancen.',
    wiki: 'set-pieces',
  },
  festEinrasten: {
    title: 'Fest einrasten',
    text: 'An: Spieler springen auf feste Positionen des Rasters. Aus: Du kannst sie frei verschieben – etwa einen Flügelspieler etwas weiter innen. Die Position bestimmt, welche Eignung zählt.',
    wiki: 'position-weights',
  },

  auszeichnungen: {
    title: 'Vereinsauszeichnungen',
    text: 'Besondere Leistungen über eine Saison oder mehrere Jahre bringen dauerhafte Boni in Bronze, Silber oder Gold. Jede Stufe gilt 5 Jahre und verlängert sich, wenn du die Hürde erneut schaffst. Fahre über eine Medaille, um Voraussetzung und Wirkung zu sehen.',
    wiki: 'club-honours',
  },

  // ---------------------------------------------------------------- Finanzen
  kontostand: {
    title: 'Kontostand',
    text: 'Geld auf dem Vereinskonto, nominal in DM (bis 2001) bzw. Euro. Ein negativer Kontostand ist möglich, kostet aber Zinsen und gefährdet die Lizenz.',
    wiki: 'finance-overview',
  },
  saldoMonat: {
    title: 'Saldo pro Monat',
    text: 'Feste Einnahmen minus feste Ausgaben eines Monats – ohne Spieltagserlöse, Prämien und Transfers. Ist er negativ, müssen die Heimspiele die Lücke schließen.',
    wiki: 'finance-forecast',
  },
  prognose: {
    title: 'Prognose Saisonende',
    text: 'Hochrechnung des Kontostands zum 30. Juni aus festen Posten und den erwarteten Heimspielen. Transfers, Pokalrunden und Prämien kommen noch dazu.',
    wiki: 'finance-forecast',
  },
  transferbudget: {
    title: 'Transferbudget',
    text: 'Was der Vorstand dir für Ablösen freigibt. Es hängt vom Kontostand und vom Vertrauen ab: Unter 40 kürzt der Vorstand, unter 20 halbiert er es.',
    wiki: 'finance-overview',
  },
  gehaltsbudget: {
    title: 'Gehaltsbudget',
    text: 'Obergrenze für die Spielergehälter pro Woche. Der Gehaltsspielraum ist, was bis dahin noch frei ist – neue Verträge müssen hineinpassen.',
    wiki: 'finance-contracts',
  },
  gehaltsquote: {
    title: 'Gehaltsquote',
    text: 'Anteil der Spielergehälter am Umsatz. Bis etwa 50 % gilt als gesund, über 70 % wird es eng – dann fressen die Gehälter alles, was Spieltag, TV und Sponsoren bringen.',
    wiki: 'finance-expenses',
  },
  einnahmen: {
    title: 'Einnahmen',
    text: 'Stadion und Catering kommen je Heimspiel, TV-Geld, Sponsoring und Werbung monatlich, Prämien nach Erfolg. Welche Quelle am wichtigsten ist, ändert sich mit den Jahrzehnten stark.',
    wiki: 'finance-income',
  },
  ausgaben: {
    title: 'Ausgaben',
    text: 'Gehälter sind fast immer der größte Posten, dazu Betreuerstab, Unterhalt von Stadion und Gebäuden, Nachwuchs sowie Betrieb und Vermarktung.',
    wiki: 'finance-expenses',
  },
  tvGeld: {
    title: 'TV- & Mediengelder',
    text: 'Anteil am Fernsehvertrag der Liga, verteilt nach festen Sockeln und Tabellenplatz. In den 70ern ein Taschengeld, ab den 90ern mit dem Privatfernsehen die wichtigste Einnahme.',
    wiki: 'finance-income',
  },
  vermarktung: {
    title: 'Vermarktung & Hospitality',
    text: 'Lizenzen, Events und Kooperationen neben dem Sponsoring. 1975 praktisch null, ab den 90ern ein Hauptpfeiler – große Marken verdienen hier überproportional.',
    wiki: 'finance-income',
  },
  betrieb: {
    title: 'Betrieb & Vermarktung',
    text: 'Wareneinsatz der Fanartikel, Betreuung der Sponsoren sowie Geschäftsstelle, Beratung und Reisen. Wächst mit dem Umsatz – wer mehr vermarktet, braucht auch mehr Apparat.',
    wiki: 'finance-expenses',
  },
  fixposten: {
    title: 'Monatliche Fixposten',
    text: 'Alles, was jeden Monat sicher gebucht wird – unabhängig von Spielen. Daran siehst du, wie viel die Heimspiele mindestens einbringen müssen.',
    wiki: 'finance-expenses',
  },
  ffp: {
    title: 'Finanzielles Fairplay',
    text: 'Ab 2011: Die Verluste der letzten drei Spielzeiten dürfen höchstens 5 % des Umsatzes betragen. Beim ersten Verstoß gibt es eine Verwarnung, beim zweiten eine Transfersperre.',
    wiki: 'finance-epochs',
  },
  lizenz: {
    title: 'Lizenz & Schulden',
    text: 'Schulden über 60 % des Jahresumsatzes kosten 3 Punkte, über 90 % 6, über 120 % 9; wer über 150 % bleibt, steigt zwangsweise ab. Kredite zählen nur zu einem Viertel.',
    wiki: 'club-business',
  },
  kredite: {
    title: 'Kredite',
    text: 'Für Stadionausbauten kannst du Kredite aufnehmen. Sie werden in festen Monatsraten mit Zinsen zurückgezahlt; bei der Lizenzprüfung zählen sie nur zu einem Viertel als Schulden.',
    wiki: 'club-business',
  },
  rechtsform: {
    title: 'Rechtsform & Investor',
    text: 'Ab 1998 darf der Profibereich in eine Kapitalgesellschaft ausgegliedert werden. Danach kannst du Anteile an einen Investor verkaufen: sofort Geld, dafür eine jährliche Dividende. Wegen 50+1 bleibt die Mehrheit beim Verein.',
    wiki: 'club-business',
  },
  namensrechte: {
    title: 'Namensrechte',
    text: 'Ab etwa 2000 kannst du den Stadionnamen an einen Sponsor verkaufen. Das bringt über die Laufzeit jedes Jahr einen festen Betrag.',
    wiki: 'club-business',
  },

  // ---------------------------------------------------------------- Sponsoring & Marketing
  markenfaktor: {
    title: 'Marke',
    text: 'Wie bekannt und begehrt dein Verein als Werbepartner ist. Titel, Europapokal und Fernsehpräsenz lassen die Marke wachsen – und große Marken verdienen überproportional mehr.',
    wiki: 'marketing-overview',
  },
  reichweite: {
    title: 'Reichweite',
    text: 'Wie viele Menschen dein Verein erreicht – im Fernsehen, in der Region, im Land und international. Sponsoren zahlen nach Reichweite; ein Regionalpartner braucht andere Werte als ein Weltkonzern.',
    wiki: 'marketing-overview',
  },
  partnerPyramide: {
    title: 'Partner-Pyramide',
    text: 'Werbeflächen deines Vereins von der Trikotbrust bis zum Regionalpartner. Jede Fläche hat einen eigenen Vertrag mit Laufzeit; neue Flächen kommen mit den Jahrzehnten hinzu.',
    wiki: 'marketing-overview',
  },
  sponsorKlauseln: {
    title: 'Vertragsklauseln',
    text: 'Leistungsklauseln koppeln das Geld an deinen Tabellenplatz, eine Abstiegsklausel erlaubt dem Partner den Ausstieg, eine Verlängerungsoption sichert dir zu festen Konditionen eine weitere Laufzeit.',
    wiki: 'marketing-overview',
  },
  verhandeln: {
    title: 'Verhandeln',
    text: 'Du kannst mehr Geld, eine andere Laufzeit oder weniger Klauseln fordern. Je stärker deine Marke im Vergleich zum Angebot, desto eher gibt der Partner nach – überreizt du, zieht er sein Angebot zurück.',
    wiki: 'marketing-overview',
  },
  // ---------------------------------------------------------------- Fanartikel (Finanzen › Fanartikel)
  merchSortiment: {
    title: 'Sortiment & Vorräte',
    text: 'Was dein Fanshop in dieser Epoche führt, mit Einkaufs- und Verkaufspreis, Bestand und Saisonverkäufen. Gewinn = Verkaufserlös minus Einkauf der Saison; „Vorrat“ sagt, wie viele Wochen der Bestand bei der jetzigen Nachfrage reicht.',
    wiki: 'merchandise',
  },
  merchArtikel: {
    title: 'Preis, Rabatt, Einkauf',
    text: 'Zum Richtpreis bringt dein Shop genau so viel wie früher die Pauschale. Teurer heißt deutlich weniger Käufer, Rabatt lockt mehr – vor allem für Ladenhüter. Größere Bestellungen bekommen Mengenrabatt, solange Platz im Lager ist.',
    wiki: 'merchandise',
  },
  merchLager: {
    title: 'Lager',
    text: 'Lagerplätze hängen an der Fanshop-Stufe und einem Megastore im Umfeld. Ein Schal braucht einen Platz, ein Ball zwei, Aufnäher kaum etwas. Ist das Lager leer, gehen Kunden ohne Ware nach Hause.',
    wiki: 'merchandise',
  },
  merchNachfrage: {
    title: 'Nachfrage',
    text: 'Gekauft wird vor allem am Spieltag: je mehr Zuschauer, je stärker Marke und Ruf, desto mehr. Stars und neue Spitzenspieler ziehen zusätzlich bei Trikots und Postern. Drei Viertel kaufen im Stadion, der Rest in der Woche danach.',
    wiki: 'merchandise',
  },
  merchMarke: {
    title: 'Marke & Reichweite',
    text: 'Bekanntheit deines Vereins im Verhältnis zu dem, was Ruf und Liga erwarten lassen. Sie wirkt auf Sponsoring und Fanartikel gleichermaßen.',
    wiki: 'merchandise',
  },
  merchLizenzen: {
    title: 'Lizenzen weltweit',
    text: 'Lizenzgeschäft und Versand an Fans im Ausland laufen über Sponsoring 2.0 und brauchen kein eigenes Lager. Nur international bekannte Vereine verdienen hier nennenswert.',
    wiki: 'merchandise',
  },
  merchStatistik: {
    title: 'Verkäufe je Artikel',
    text: 'Saisonzahlen je Artikel. „Nicht lieferbar“ zählt Kunden, die wegen leerer Regale nichts bekommen haben. Klick eine Zeile an, um ihre Entwicklung im Diagramm zu sehen.',
    wiki: 'merchandise',
  },
  merchUmsatz: {
    title: 'Umsatzentwicklung',
    text: 'Umsatz je Woche der laufenden Saison oder je Saison im Vergleich. Abgerechnet wird jeweils montags. Gewählter Artikel oder Spieler wird hier gezeigt.',
    wiki: 'merchandise',
  },
  merchTrikots: {
    title: 'Trikots und Poster je Spieler',
    text: 'Wer bei den Fans zieht: Stärke, Einsätze, Tore, Position, Kapitänsbinde, Eigengewächs und Neuzugang. Ab 1995/96 zählen beflockte Trikots, vorher Poster und Autogrammkarten.',
    wiki: 'merchandise',
  },
  werbekanaele: {
    title: 'Werbekanäle',
    text: 'Eigene Werbung kostet monatlich und bringt Ansehen, Mitglieder und etwas Fanartikel-Umsatz. Der Nutzen flacht mit jeder Stufe ab – sportlicher Erfolg bleibt der Hauptantrieb.',
    wiki: 'marketing-overview',
  },
  catering: {
    title: 'Catering-Betrieb',
    text: 'Eigenbetrieb bringt den höchsten Erlös je Besucher, aber hohe Fixkosten. Umsatzbeteiligung teilt Risiko und Ertrag, Verpachtung bringt eine feste Pacht ohne Aufwand.',
    wiki: 'finance-catering',
  },
  mitglieder: {
    title: 'Mitglieder',
    text: 'Zahlende Vereinsmitglieder. Ihre Beiträge sind eine sichere Einnahme; die Zahl wächst mit Erfolg, guter Stimmung und der Fankultur der Epoche.',
    wiki: 'environment-overview',
  },

  // ---------------------------------------------------------------- Verein & Umfeld
  vorstandVertrauen: {
    title: 'Vertrauen des Vorstands',
    text: 'Wie zufrieden der Vorstand mit dir als Manager ist (0–100) – nach Saisonziel, Ergebnissen und Finanzen. Unter 40 kürzt er die Transfermittel, unter 20 halbiert er sie, und er gibt danach dein nächstes Saisonbudget frei. Entlassen wirst du nie; läuft es schlecht, legt er dir einen Trainerwechsel nahe.',
    wiki: 'manager-career',
  },
  trainerAnsehen: {
    title: 'Dein Ansehen als Manager',
    text: 'Wie angesehen du in der Branche bist (0–100). Es steigt, wenn du Saisonziele übertriffst, Titel holst oder aufsteigst, und sinkt bei Misserfolg. Je höher es schon ist, desto langsamer wächst es.',
    wiki: 'manager-career',
  },
  vereinsgroesse: {
    title: 'Größe des Vereins',
    text: 'Ruf des Vereins, bereinigt um die Liga (2. Liga −7). So lassen sich Vereine aus 1. und 2. Liga vergleichen.',
    wiki: 'manager-career',
  },
  jobangebote: {
    title: 'Jobangebote',
    text: 'Gibt es nicht: Du bleibst über alle Jahrzehnte Manager deines Vereins. Trainer stellst du selbst ein und entlässt sie, wenn nötig.',
    wiki: 'manager-career',
  },
  trainerGehalt: {
    title: 'Jahresgehalt',
    text: 'Dein Gehalt als Manager (Preisniveau 1975, angezeigt im Wert des Jahres). Es ist eine Kennzahl und wird nicht über die Vereinskasse gebucht.',
    wiki: 'manager-career',
  },
  trainerBilanz: {
    title: 'Bilanz und Punkte je Spiel',
    text: 'Siege, Remis und Niederlagen, dazu Punkte je Spiel nach 3-Punkte-Wertung (damit Epochen vergleichbar bleiben). Bei Trainern zählen die Ligaspiele der Amtszeit.',
    wiki: 'ai-coaches',
  },
  managerBilanz: {
    title: 'Deine Managerbilanz',
    text: 'Alle Pflichtspiele deines Vereins seit deinem Amtsantritt – Liga, Landespokal und Europapokal, auch die laufende Saison. Freundschafts- und Hallenspiele zählen nicht.',
    wiki: 'manager-career',
  },
  deineTrainer: {
    title: 'Deine Trainer',
    text: 'Alle Cheftrainer, die du eingestellt hast, mit Amtszeit, Ligabilanz und wie die Amtszeit endete. Der Cheftrainer ist dein Angestellter: Du stellst ihn unter Training › Trainerteam ein und entlässt ihn auch – auf Druck des Vorstands oder aus eigenem Entschluss.',
    wiki: 'manager-career',
  },
  karriereTransfers: {
    title: 'Transferbilanz deiner Amtszeit',
    text: 'Ablösesummen aller Käufe und Verkäufe seit deinem Amtsantritt. Beträge aus verschiedenen Jahrzehnten werden über das Preisniveau 1975 vergleichbar gemacht und im Geldwert des heutigen Jahres angezeigt.',
    wiki: 'manager-career',
  },
  eigengewaechse: {
    title: 'Eigengewächse',
    text: 'Spieler aus deiner eigenen Jugend, die unter dir mindestens ein Pflichtspiel für die Profis bestritten haben – mit ihren Einsätzen.',
    wiki: 'manager-career',
  },
  vorstandsdruck: {
    title: 'Druck auf den Trainer',
    text: 'Läuft es klar schlechter als das Saisonziel, legt dir der Vorstand nahe, den Cheftrainer zu entlassen. Gibst du ihm Rückendeckung, prüft der Vorstand einen Monat später nach: Bleibt die Wende aus, verlierst du deutlich Vertrauen.',
    wiki: 'manager-career',
  },
  saisonziel: {
    title: 'Saisonziel',
    text: 'Was der Vorstand von dir erwartet – abhängig von Stärke und Ruf des Vereins. Wer das Ziel übertrifft, gewinnt Vertrauen, wer es klar verfehlt, verliert es.',
    wiki: 'environment-overview',
  },
  ansehen: {
    title: 'Ansehen',
    text: 'Ruf des Vereins (0–100). Er wächst mit Titeln und Erfolgen und lockt bessere Spieler, Sponsoren, Zuschauer und Mitglieder an.',
    wiki: 'club-profile',
  },
  fanStimmung: {
    title: 'Fan-Stimmung',
    text: 'Laune der Anhänger (0–100). Siege, Derbysiege und ein erfülltes Leitbild heben sie, Niederlagen und unbeliebte Entscheidungen senken sie. Sie wirkt auf Zuschauerzahlen und Vorstand.',
    wiki: 'environment-overview',
  },
  leitbild: {
    title: 'Leitbild',
    text: 'Wofür die Fans deinen Verein halten – etwa „Titel und Stars“ oder „Eigene Jugend“. Erfüllst du es, verzeihen sie mehr; verfehlst du es, kippt die Stimmung schneller.',
    wiki: 'environment-overview',
  },
  tradition: {
    title: 'Tradition',
    text: 'Wie stark der Verein in seiner Geschichte verwurzelt ist. Traditionsvereine haben treue Fans, reagieren aber empfindlich auf Investoren, Namensrechte und Kommerz.',
    wiki: 'environment-overview',
  },
  medienDruck: {
    title: 'Medien-Druck',
    text: 'Wie genau die Presse auf deinen Verein schaut. Hoher Druck verstärkt die Reaktion des Vorstands auf Serien – im Guten wie im Schlechten.',
    wiki: 'environment-overview',
  },
  auslastung: {
    title: 'Auslastung',
    text: 'Anteil der verkauften Plätze an der Kapazität. Sie hängt von Erfolg, Gegner, Wetter, Preisen und der Zuschauernachfrage der Epoche ab.',
    wiki: 'finance-elasticity',
  },
  anreise: {
    title: 'Anreise',
    text: 'Wie viele Zuschauer Parkplätze, Bus und Bahn sowie die Wege ums Stadion bewältigen – in Prozent der erwarteten Besucher. Unter 100 % droht Anreise-Chaos, das Stimmung und Einnahmen kostet.',
    wiki: 'facilities-surroundings',
  },
  sicherheit: {
    title: 'Sicherheit & Polizeigebühren',
    text: 'Risiko für Ausschreitungen je Heimspiel, bei Derbys höher. Zwischenfälle bringen Verbandsstrafen; je nach Epoche stellt die Polizei Einsätze in Rechnung. Ordnungsdienst und Fanprojekte senken das Risiko.',
    wiki: 'facilities-surroundings',
  },
  anwohner: {
    title: 'Anwohner & Genehmigung',
    text: 'Bauvorhaben am Stadion brauchen eine Genehmigung. Je näher die Anwohner wohnen, desto eher protestieren sie gegen Lärm und Verkehr – das kann Projekte verzögern oder verteuern.',
    wiki: 'facilities-surroundings',
  },
  lizenzauflagen: {
    title: 'Lizenzauflagen',
    text: 'Der Verband verlangt je nach Epoche bestimmte Ausstattung, etwa Flutlicht oder Plätze für Presse und Fernsehen. Fehlt sie, drohen Auflagen bis hin zur verweigerten Lizenz.',
    wiki: 'facilities-surroundings',
  },
  flaeche: {
    title: 'Fläche',
    text: 'Bauplätze rund ums Stadion. Jedes Gebäude belegt Parzellen; ist alles voll, kannst du Grundstücke dazukaufen – wenn die Lage es zulässt.',
    wiki: 'facilities-grounds',
  },
  einrichtungen: {
    title: 'Vereinsgelände',
    text: 'Stufen von Stadion, Trainingszentrum, Jugend, Medizin und Fanshop. Höhere Stufen verbessern Training, Erholung, Nachwuchs und Erlöse, kosten aber Bau und laufenden Unterhalt.',
    wiki: 'facilities-overview',
  },
  mitarbeiter: {
    title: 'Mitarbeiter',
    text: 'Trainer, Ärzte, Scouts und Verwaltung. Ihre Qualität wirkt auf Training, Erholung, Verletzungen, Scouting und Vermarktung; neue Berufe kommen mit den Jahrzehnten hinzu.',
    wiki: 'staff-people',
  },

  // ---------------------------------------------------------------- Textmodus
  textmodusOptionen: {
    title: 'Optionen im Textmodus',
    text: 'Automatische Auswechslungen: Dein Co-Trainer wärmt Ersatz auf und wechselt Erschöpfte und Verletzte selbst. Ohne ihn humpelt ein Verletzter weiter, bis du reagierst – das Spiel hält dann immer an. Die Anhalte-Optionen öffnen den Wechsel-Bildschirm zur Halbzeit, zur Schlussphase, bei Rückstand oder wenn bei dir ein Wechsel ansteht.',
    wiki: 'match',
  },
  mannschaftsstaerke: {
    title: 'Mannschaftsstärke',
    text: 'Durchschnitt der Tagesstärke deiner Elf auf ihren Positionen – mit Form, Moral, Frische und der Kraft im Spiel. Fehlt ein Spieler (Platzverweis), zählt sein Platz mit null.',
    wiki: 'match',
  },
  schiedsrichter: {
    title: 'Schiedsrichter',
    text: 'Name und Einschätzung des Unparteiischen. Seine Linie und Stimmung werden aus Fouls und Karten dieses Spiels abgeleitet – er hat keinen eigenen Einfluss auf die Simulation, die Kartenhärte folgt der Epoche.',
    wiki: 'match',
  },

  // ---------------------------------------------------------------- Stadion
  stadionBloecke: {
    title: 'Stadion-Blöcke',
    text: 'Das Stadion besteht aus 14 Blöcken, die du einzeln umbauen kannst – Stehplätze, Sitzplätze, Überdachung, später Logen. Während eines Umbaus fehlen die Plätze.',
    wiki: 'stadium-blocks',
  },
  platzarten: {
    title: 'Platzarten',
    text: 'Stehplätze sind billig und voller Stimmung, Sitzplätze bringen mehr je Besucher, Premium, Business und Logen viel Geld von wenigen. Jede Art hat ihre eigene Nachfrage.',
    wiki: 'stadium-blocks',
  },
  nachfrageGeschaetzt: {
    title: 'Nachfrage (geschätzt)',
    text: 'Wie viele Karten je Platzart voraussichtlich verkauft werden. Es ist eine Schätzung deiner Mitarbeiter – je besser die Verwaltung, desto genauer. Höhere Preise senken die Nachfrage.',
    wiki: 'finance-elasticity',
  },
  ticketpreis: {
    title: 'Ticketpreise',
    text: 'Höhere Preise bringen mehr je Karte, verkaufen aber weniger. Der beste Preis hängt von Epoche, Erfolg und Gegner ab; leere Ränge kosten zudem Stimmung.',
    wiki: 'finance-elasticity',
  },
  kartenverkauf: {
    title: 'Kartenverkauf',
    text: 'Hier legst du die Eintrittspreise je Tribüne fest und siehst für jedes Heimspiel, wie viele Karten voraussichtlich verkauft werden. Die Draufsicht zeigt die acht Tribünen – fahr darüber für Kapazität und Bauzustand.',
    wiki: 'tickets-sales',
  },
  tribuenen: {
    title: 'Tribünen',
    text: 'Die 14 Stadion-Blöcke sind zu acht Tribünen zusammengefasst: Haupt- und Gegentribüne (je 3 Blöcke), Hinter dem Tor 1 und 2 (je 2) und vier Ecken. Jede Tribüne kann je Platzart einen eigenen Preis haben.',
    wiki: 'tickets-sales',
  },
  tribuenenpreise: {
    title: 'Eintrittspreise je Tribüne',
    text: 'Günstigere Tribünen füllen sich zuerst, teure bleiben eher leer – die Nachfrage der Platzart richtet sich nach dem Mittel aller Tribünen. „Alle Tribünen“ setzt eine Platzart überall auf denselben Preis.',
    wiki: 'tickets-sales',
  },
  preiskategorie: {
    title: 'Preiskategorie je Spiel',
    text: 'Klick schaltet: automatisch → Normal → Top → Rabatt. Top- und Rabattpreise gelten für Steh-, Sitz-, Premium- und Gästeplätze; Business-Seats und Logen laufen über Saisonverträge.',
    wiki: 'tickets-sales',
  },
  prognoseSpanne: {
    title: 'Prognose als Spanne',
    text: 'Deine Mitarbeiter schätzen eine Spanne. Der tatsächliche Verkauf landet mal am unteren, mal am oberen Ende, mal dazwischen – und in etwa jedem zehnten Fall knapp daneben. Derby, Pokal, unklares Wetter und wenig Erfahrung machen sie breiter.',
    wiki: 'tickets-sales',
  },
  besonderePreise: {
    title: 'Besondere Preise',
    text: 'Topzuschlag und Rabatt in Prozent auf die Fanplätze. Automatisch: Zuschlag gegen die besten Mannschaften der Tabelle, Rabatt gegen Gegner aus tieferen Ligen (Pokal). Einzelne Spiele stellst du in der Spielliste ein.',
    wiki: 'tickets-sales',
  },
  fanbasis: {
    title: 'Fanbasis',
    text: 'Eingetragene Vereinsmitglieder. Sie wächst mit Erfolg und Stimmung und trägt den Zuspruch im Stadion.',
    wiki: 'tickets-sales',
  },
  ueberdacht: {
    title: 'Überdachung',
    text: 'Anteil der Plätze mit Dach. Bei Regen und Kälte kommen mehr Zuschauer auf überdachte Plätze; ab den 90ern erwarten sie es fast überall.',
    wiki: 'stadium-blocks',
  },

  // ---------------------------------------------------------------- Nachwuchs
  ausbildung: {
    title: 'Ausbildungsqualität',
    text: 'Wie gut deine Akademie Talente formt (0–100). Sie folgt dem Ausbau verzögert – etwa ein Fünftel des Wegs zum Ziel pro Jahr – und bestimmt Lernrate und Reife der Jugendspieler.',
    wiki: 'youth-invest',
  },
  jugendRuf: {
    title: 'Ruf der Akademie',
    text: 'Wie bekannt deine Nachwuchsarbeit ist. Er wächst langsam mit erfolgreichen eigenen Talenten und entscheidet, ob die besten Jugendlichen am 1. Juli zu dir kommen.',
    wiki: 'youth-invest',
  },
  akaAusbildung: {
    title: 'Ausbildung',
    text: 'Die aktuelle Ausbildungsqualität deiner Akademie (0–100). Sie bestimmt, wie schnell Talente lernen, wie reif sie mit 18/19 sind und wie viele Kinder jedes Jahr kommen. „Ziel“ ist der Wert, den dein heutiger Ausbau und Etat auf Dauer tragen.',
    wiki: 'youth-invest',
  },
  akaWeg: {
    title: 'Weg zum Ziel',
    text: 'Die Ausbildung steigt nicht sofort: Sie nähert sich dem Ziel um etwa ein Fünftel des Abstands pro Jahr. Der Balken zeigt, wie weit sie schon ist. Kürzungen am Etat oder Ausbau ziehen sie schneller nach unten.',
    wiki: 'youth-invest',
  },
  akaBambini: {
    title: 'Bambini je Jahrgang',
    text: 'So viele neue Kinder nimmt deine Akademie jedes Jahr am 1. Juli auf (1–4). Mehr Plätze, ein voller Etat und eine bessere Ausbildung erhöhen die Zahl – und damit die Chance auf ein Ausnahmetalent.',
    wiki: 'youth-invest',
  },
  akaLernrate: {
    title: 'Lernrate der Talente',
    text: 'Faktor auf die Entwicklung aller Jugendspieler im Training und in Spielen (etwa ×0,8 bei schwacher bis ×1,65 bei sehr guter Ausbildung). ×1,18 heißt: Deine Talente entwickeln sich 18 % schneller als mit dem Grundwert ×1,0.',
    wiki: 'youth-invest',
  },
  akaReife: {
    title: 'Reife mit 19 Jahren',
    text: 'Gut ausgebildete Talente sind am Ende der Jugend weiter: Ihre altersgerechte Höchststärke liegt um diesen Anteil höher. Sie können dadurch früher bei den Profis mithalten.',
    wiki: 'youth-invest',
  },
  akaZweite: {
    title: 'Zweite Mannschaft',
    text: 'Gibt Eigengewächsen bis 23, die bei den Profis (noch) nicht spielen, Spielpraxis. Ohne zweite Mannschaft stagnieren sie eher; je höher sie spielt, desto mehr bringt es.',
    wiki: 'youth-invest',
  },
  durchlaessigkeit: {
    title: 'Durchlässigkeit',
    text: 'Bekommen eigene Talente Einsatzzeit bei den Profis? Gemessen am Anteil junger Eigengewächse mit Spielpraxis. Hohe Durchlässigkeit macht den Verein für Talente attraktiver.',
    wiki: 'youth-invest',
  },
  nlz: {
    title: 'Leistungszentrum',
    text: 'Ab 2001 schreibt der Verband jedem Profiverein ein Nachwuchsleistungszentrum mit Mindestausstattung vor. Fehlt sie, gibt es Lizenzauflagen.',
    wiki: 'youth-invest',
  },
  talentWettbewerb: {
    title: 'Wettbewerb um Talente',
    text: 'Jedes Jahr am 1. Juli werben alle Vereine um die besten 12- bis 16-Jährigen. Wer die meiste Anziehung hat – Ruf, Ausbildung, Durchlässigkeit –, bekommt den Zuschlag.',
    wiki: 'youth-invest',
  },
  jugendEtat: {
    title: 'Jugendetat',
    text: 'Jährliches Budget für den laufenden Nachwuchsbetrieb. Weniger als empfohlen senkt die Ausbildungsqualität spürbar schneller, als mehr sie hebt.',
    wiki: 'youth-invest',
  },

  // ---------------------------------------------------------------- Verträge & Transfers
  bosman: {
    title: 'Bosman-Urteil',
    text: 'Seit dem Urteil von Ende 1995 dürfen Spieler nach Vertragsende ablösefrei wechseln. Läuft ein Vertrag aus, verlierst du den Spieler ohne Geld – rechtzeitig verlängern oder verkaufen.',
    wiki: 'squad-contracts',
  },
  ausstiegsklausel: {
    title: 'Ausstiegsklausel',
    text: 'Festgeschriebene Ablöse, zu der ein anderer Verein den Spieler ohne Verhandlung holen darf. Sie macht Verträge attraktiver für den Spieler, kann dich aber Stars kosten.',
    wiki: 'squad-contracts',
  },
  treuepraemie: {
    title: 'Treueprämie',
    text: 'Einmalzahlung, wenn der Spieler bis zum Vertragsende bleibt – fällig am 30. Juni. Sie hilft beim Abschluss, belastet aber später die Kasse.',
    wiki: 'transfers-wishes',
  },
  erfolgsklausel: {
    title: 'Erfolgsklausel',
    text: 'Mehr Gehalt (z. B. +10 oder +20 %), sobald ihr einen Europapokal-Platz erreicht. Ehrgeizige Spieler mögen sie, die Kasse trifft sie erst im Erfolgsfall.',
    wiki: 'transfers-wishes',
  },
  spielerKlauseln: {
    title: 'Vertragsklauseln',
    text: 'Sonderregeln im Vertrag: Ausstiegsklausel (feste Ablöse), Treueprämie (Bonus bei Vertragsende), Erfolgsklausel (mehr Gehalt bei Europapokal), Rückkaufoption für den abgebenden Verein. Sie erleichtern Abschlüsse, binden dich aber.',
    wiki: 'transfers-wishes',
  },
  wechselgefahr: {
    title: 'Wechselgefahr',
    text: 'Wie wahrscheinlich andere Vereine den Spieler weglocken. Sie steigt bei niedriger Zufriedenheit und wenn ein reizvollerer Verein in Frage kommt – ehrgeizige, wenig loyale Spieler sind besonders gefährdet.',
    wiki: 'transfers-wishes',
  },
  restlaufzeit: {
    title: 'Restlaufzeit',
    text: 'Monate bis Vertragsende. Unter 12 Monaten sinkt der Preis bei einem Verkauf, und der Spieler wird für andere Vereine interessant.',
    wiki: 'squad-contracts',
  },
  verkaeuferposition: {
    title: 'Verkäuferposition',
    text: 'Wie hart der abgebende Verein verhandelt. Lange Verträge, Leistungsträger und Rivalen als Käufer treiben den Preis; auslaufende Verträge, Geldsorgen und wechselwillige Spieler senken ihn.',
    wiki: 'transfers-market',
  },
  interesse: {
    title: 'Interesse des Spielers',
    text: 'Wie sehr dein Verein den Spieler reizt – Ruf, Einsatzchancen, Heimat, Rivalität, Europapokal. Unter 25 lehnt er ab, außer du bietest sehr viel Geld.',
    wiki: 'transfers-wishes',
  },
  berater: {
    title: 'Berater',
    text: 'Ab den 90ern verhandeln Berater für die Spieler mit und verlangen eine Provision. Sie treiben die Forderungen, wissen aber auch, wann ein Angebot gut ist.',
    wiki: 'transfers-wishes',
  },
  versprechen: {
    title: 'Versprechen',
    text: 'Zusagen wie Stammplatz oder Verstärkungen helfen beim Abschluss. Hältst du sie nicht, sinken Zufriedenheit und Kabinenfrieden, und der Spieler will wieder weg.',
    wiki: 'transfers-wishes',
  },
  leihe: {
    title: 'Leihe mit Kaufoption',
    text: 'Der Spieler kommt bis zum Saisonende gegen eine Leihgebühr. Mit Kaufoption darfst du ihn danach zum vorher festgelegten Preis fest übernehmen.',
    wiki: 'transfers-market',
  },
  kaderbedarf: {
    title: 'Kaderbedarf',
    text: 'Richtwert: 2 Torhüter, je 6 Abwehr- und Mittelfeldspieler, 4 Stürmer. Rot heißt, dort bist du zu dünn besetzt – Verletzungen und Sperren treffen dich dann hart.',
    wiki: 'squad-table',
  },
  stabSpielstaerke: {
    title: 'Stab und Spielstärke',
    text: 'Co-Trainer, Ärzte, Physios, Athletik- und Torwarttrainer, Analysten und die sportliche Leitung bringen einzeln wenig, zusammen aber spürbar Leistung auf den Platz. Ohne Stab verliert deine Mannschaft bis zu 4 % Spielstärke (1975 etwa die Hälfte), ein voller, guter Stab bringt ein kleines Plus. Gezählt werden nur Stellen, die es in der Epoche schon gibt.',
    wiki: 'staff-effects',
  },
  spielerpool: {
    title: 'Spielerpool',
    text: 'Alle Spieler der Welt, auch Amateure, Auslandsligen und Jugendliche. Wen dein Stab nicht genau kennt, siehst du nur als geschätzte Spanne – sortiert und gefiltert wird nach der Schätzung. Ein Scout macht die Werte genauer.',
    wiki: 'transfer-pool',
  },
  bekanntheit: {
    title: 'Bekanntheit',
    text: 'Wie gut dein Stab den Spieler kennt. Spieler deiner Liga, Gegner aus häufigen Duellen und Stars kennst du gut, Amateure, Jugendliche und kleine Auslandsligen kaum. Fernsehen, Internet und Datenbanken machen die Welt über die Jahrzehnte bekannter.',
    wiki: 'transfer-pool',
  },
  scouting: {
    title: 'Scouting',
    text: 'Ein Scout beobachtet einen Spieler über Tage bis Wochen und kostet Reisegeld. Danach sind Stärke, Potenzial und Wert fast genau bekannt. Jeder Scouting-Mitarbeiter übernimmt einen weiteren Auftrag; Berichte veralten nach einigen Jahren.',
    wiki: 'transfer-pool',
  },
  beobachtung: {
    title: 'Beobachtung',
    text: 'Spieler auf deiner Liste werden von den Scouts verfolgt. Je länger, desto genauer werden Potenzial-Spanne und Persönlichkeit.',
    wiki: 'youth-gems-scouting',
  },
  charakter: {
    title: 'Charakter',
    text: 'Die Einschätzung deines Trainerteams aus den beiden stärksten Charakterzügen. Sie bestimmt mit, wie ein Spieler auf Lob, Kritik oder Druck reagiert.',
    wiki: 'condition-kabine',
  },
  gespraeche: {
    title: 'Spielergespräche',
    text: 'Du hast pro Woche (Montag bis Sonntag) Zeit für drei Einzelgespräche, mit demselben Spieler frühestens wieder nach 10 Tagen. Häufige Gespräche mit demselben Spieler nutzen sich ab.',
    wiki: 'condition-kabine',
  },
  promises_first: {
    title: 'Erstes Training',
    text: 'Beim ersten Training jeder Saison kannst du der Mannschaft bis zu fünf Versprechen geben. Jedes wird messbar geprüft – über die Saison und am Saisonende. Gehalten stärkt deine Glaubwürdigkeit, gebrochen kostet Moral und Vertrauen.',
    wiki: 'season-promises',
  },
  promises_reaction: {
    title: 'Reaktion der Spieler',
    text: 'Gezeigt sind die einflussreichsten Spieler. Wie sie reagieren, hängt von ihrer Persönlichkeit, Rolle und deiner Glaubwürdigkeit ab: Ehrgeizige mögen große Ziele, glauben unrealistische aber nicht; Stammspieler mögen keine Rotation. Die Reaktion wirkt sofort auf ihre Moral.',
    wiki: 'season-promises',
  },
  promise_trust: {
    title: 'Glaubwürdigkeit',
    text: 'Wie sehr dir Spieler Versprechen glauben (Start 70). Gehaltene Versprechen erhöhen sie, gebrochene senken sie – beim ersten Training wie bei Transfers.',
    wiki: 'season-promises',
  },
  kabine_pyramide: {
    title: 'Kabinen-Pyramide',
    text: 'Oben die Führungsspieler, darunter Stützen und Mitläufer, unten wer außen vor ist – je Stufe links der Einflussreichste. Der Smiley zeigt die Moral, die Ziffer die Gruppe (Legende darunter), eine gestrichelte Linie einen Konflikt.',
    wiki: 'condition-kabine',
  },
  presse: {
    title: 'Presse',
    text: 'Die Sportzeitung erscheint montags und donnerstags, dazu gibt es immer die aktuelle Ausgabe des Tages. Sie fasst Spiele, Tabelle, Transfers, Trainerwechsel, Verletzungen, Pokal und Europapokal zusammen. Schlagzeilen öffnen den Artikel, Gesichter das Spielerprofil, Wappen das Vereinsprofil.',
    wiki: 'presse',
  },
  // ---------------------------------------------------------------- Transferbilanz & Suche
  transferbilanz: {
    title: 'Transfer des Fensters',
    text: 'Der teuerste Wechsel des Fensters (ohne Ablöse: der stärkste Neuzugang). Mit „Verein auswählen“ siehst du den wichtigsten Wechsel eines Vereins. Die Bilanz erscheint am Tag nach jedem Fensterschluss.',
    wiki: 'transfers-window',
  },
  geruechtekueche: {
    title: 'Gerüchteküche',
    text: 'Was zum Fensterschluss erzählt wird: gute Spieler der Liga mit auslaufendem Vertrag, auf der Transferliste oder unzufrieden – und welcher größere Verein angeblich interessiert ist. Nur Gerede, nicht bestätigt.',
    wiki: 'transfers-window',
  },
  spielersuche: {
    title: 'Spieler suchen',
    text: 'Durchsucht alle Spieler der Vereine mit vollem Kader nach deinen Vorgaben. Werte, die verdeckt sind (Potenzial), filterst du nur über die Einschätzung deiner Scouts. Suchen kannst du benennen und speichern.',
    wiki: 'transfers-search',
  },
  realistisch: {
    title: 'Nur realistische Transfers',
    text: 'Zeigt nur Spieler, die nach ihren Wünschen grundsätzlich zu deinem Verein wechseln würden (Reiz deines Vereins, keine Ausschlussgründe wie ein Erzrivale). Ob der abgebende Verein verkauft, ist damit nicht gesagt.',
    wiki: 'transfers-wishes',
  },
  // ---------------------------------------------------------------- Vorschau „Nächstes Spiel“
  prematch_staerke: {
    title: 'Mannschaftsstärke',
    text: 'Stärke der voraussichtlichen Startelf (0–100) – so, wie die Match-Engine sie aus Positionsstärke und Tagesform rechnet. Die kleine Zahl ist der Rang dieser Elf in deiner Liga. Der Balken darunter zeigt das Kräfteverhältnis.',
    wiki: 'match',
  },
  prematch_aufstellung: {
    title: 'Schnelle Aufstellung',
    text: 'Übernimm deine gespeicherte Aufstellung, lass den Co-Trainer nach Eignung die beste Elf und Bank aufstellen (Taktik bleibt) oder wechsle zur Aufstellung. Die Wahl gilt beim Anpfiff. Hast du Plätze leer gezogen, besetzt sie der Co-Trainer beim Anpfiff mit dem Passendsten.',
    wiki: 'match',
  },
  prematch_zuschauer: {
    title: 'Erwartete Zuschauer',
    text: 'Schätzung aus Nachfrage, Gegner, Derby, Monat und Wetter – dieselbe Rechnung wie am Spieltag, nur ohne Zufall. Am Spieltag schwankt die Zahl um einige Prozent.',
    wiki: 'match',
  },
  awards_wertung: {
    title: 'Die Besten der Saison',
    text: 'Gewertet werden nur Ligaspiele, mindestens die Hälfte der Spieltage. Punkte gibt es für den Notenschnitt, die Einsätze und den Tabellenplatz der Mannschaft, dazu je Position: Torwart und Abwehr für Spiele zu null und wenige Gegentore, Mittelfeld für Tore und Vorlagen, Sturm vor allem für Tore. Spieler der Saison ist, wer sich am deutlichsten von seiner Konkurrenz abhebt.',
    wiki: 'season-awards',
  },
  goldener_ball: {
    title: 'Goldener Ball',
    text: 'Am 20. Dezember wählt die Jury den Fußballer des Jahres – bewertet wird das Kalenderjahr: Noten, Tore und Vorlagen, Titel und Klasse. Bis 1994 sind nur Europäer wählbar, ab 1995 alle Spieler europäischer Vereine, ab 2007 Spieler weltweit. Klick auf ein Jahr zeigt die Gala noch einmal.',
    wiki: 'season-awards',
  },
  positionstraining: {
    title: 'Positionstraining',
    text: 'Dein Trainerteam schult den Spieler zusätzlich auf einer zweiten Position – etwa +15 Vertrautheit je Saison, höchstens bis 85. Viel schneller lernt er durch Einsätze dort (eine Saison Stammplatz ≈ +40, verwandte Rollen etwas mehr); ab 80 geht es deutlich langsamer.',
    wiki: 'position-skill',
  },
  spielerentwicklung: {
    title: 'Spielerentwicklung',
    text: 'Jeden Sonntag hält das Spiel für deinen Kader Stärke, Form, Frische, Fitness und Moral fest (bis zu 52 Wochen), einmal im Monat zusätzlich alle Fähigkeiten (bis zu zehn Jahre). Oben wählst du die Anzeige (Stärke & Zustand, Stärke, eine Kategorie als Schnitt oder eine einzelne Fähigkeit) und den Zeitraum (letzte 52 Wochen oder gesamte Zeit). „Kaderschnitt“ zeigt gestrichelt den Mittelwert deines Kaders in derselben Woche. Bei anderen Spielern stammen die Werte aus den Bewertungsrunden.',
    wiki: 'player-profile',
  },
  stationen: {
    title: 'Stationen',
    text: 'Vereine des Spielers seit Spielbeginn, getrennt an jedem Wechsel. Ablöse in der Währung des Wechseljahres; Spiele und Tore aus den Saisonbilanzen (die laufende Saison zählt mit).',
    wiki: 'player-profile',
  },
  erfolge: {
    title: 'Vereinspokale',
    text: 'Alle Titel deines Vereins nach Wettbewerb: Meisterschaften und Staffelsiege, Landespokal, Europapokale, Jugendtitel, Hallen-Masters und Aufstiege – inklusive der Historie seit 1963/64. Klick auf einen Eintrag zeigt die Trophäe mit Endstand, Finale, Trainer und Torjäger der Saison, soweit gespeichert.',
    wiki: 'club-trophies',
  },
  budgetBerater: {
    title: 'Finanzberater',
    text: 'Kaufmännischer Leiter, Schatzmeister oder Geschäftsstelle – wer bei dir die Finanzen führt. Er ordnet jedes Jahr ein, woher das Geld in dieser Epoche kommt, was realistisch ist und wo die Risiken liegen.',
    wiki: 'finance-budget',
  },
  budgetPrognose: {
    title: 'Erwartete Einnahmen',
    text: 'Hochrechnung aus denselben Formeln wie die Buchungen: Monatseinnahmen, erwartete Zuschauer je Heimspiel, Pokal mit zwei Runden. Europapokal-Prämien über das Startgeld hinaus sind bewusst nicht eingeplant.',
    wiki: 'finance-budget',
  },
  budgetPosten: {
    title: 'Budgets',
    text: 'Gehälter sind die Grenze für neue Verträge (der Vorstand toleriert bis 110 %), das Transferbudget gilt für Ablösen und Handgelder, Infrastruktur und Jugend für bar bezahlte Bauvorhaben. Die Reserve ist, was am Saisonende übrig bleibt – der Vorstand verlangt ein Minimum.',
    wiki: 'finance-budget',
  },
  budgetReaktionen: {
    title: 'Reaktionen',
    text: 'So nehmen Vorstand, Fans und Sponsoren deine Aufteilung auf. Der Vorstand achtet auf Reserve und Personalquote, die Fans auf Ehrgeiz bei Transfers und Ausbau. Bestätigst du, ändern sich Vertrauen und Stimmung sofort ein wenig.',
    wiki: 'finance-budget',
  },
  // --- Vertragsverhandlung 2.0 (screens/contract/) ---
  v2_tisch: {
    title: 'Verhandlungstisch',
    text: 'Links steht seine Forderung, rechts dein Angebot. Er bewertet das ganze Paket: Was ihm wichtig ist (Punkte), zählt mehr. Zu schwache Angebote kosten Geduld – bei null bricht er ab und redet einige Wochen nicht mehr mit dir.',
    wiki: 'squad-contracts2',
  },
  v2_gehalt: {
    title: 'Grundgehalt',
    text: 'Festes Gehalt, auch wenn er nicht spielt. Es zählt gegen die Grenze deines Gehaltsbudgets (110 %) – Prämien und Einmalzahlungen nicht.',
    wiki: 'squad-contracts2',
  },
  v2_laufzeit: {
    title: 'Laufzeit',
    text: 'Junge Ehrgeizige wollen kurz (um bald weiterzuziehen), Routiniers lang (Sicherheit). Außerhalb seiner Wunschspanne kostet jedes Jahr viel Zustimmung.',
    wiki: 'squad-contracts2',
  },
  v2_handgeld: {
    title: 'Handgeld',
    text: 'Einmalzahlung bei Unterschrift, bezahlt aus dem Transferbudget. Geschäftstüchtige und ältere Spieler schätzen sie oft mehr, als sie dich kostet – dann kannst du beim Gehalt sparen.',
    wiki: 'squad-contracts2',
  },
  v2_praemien: {
    title: 'Leistungsprämien',
    text: 'Je Einsatz, Tor bzw. Spiel ohne Gegentor – gebucht nach jedem Spiel. Sie kosten nur, wenn er spielt und trifft; ehrgeizige Stammspieler mögen sie, Ergänzungsspieler weniger.',
    wiki: 'squad-contracts2',
  },
  v2_titel: {
    title: 'Titel- und Klassenerhalt-Prämie',
    text: 'Einmalig je Titel (Meisterschaft/Staffelsieg, Pokalsieg) bzw. wenn ihr die Klasse haltet. Er bewertet sie nach euren Chancen.',
    wiki: 'squad-contracts2',
  },
  v2_staffel: {
    title: 'Gehaltssteigerung',
    text: 'Gestaffeltes Gehalt: zu jedem Saisonstart steigt es um den vereinbarten Anteil. Günstig im ersten Jahr, teurer am Ende.',
    wiki: 'squad-contracts2',
  },
  v2_festablose: {
    title: 'Festgeschriebene Ablöse',
    text: 'Vor dem Bosman-Urteil (1995) kostet ein Spieler auch nach Vertragsende Ablöse. Ein niedriger, festgeschriebener Betrag macht ihn frei – das will er, für dich bedeutet es weniger Erlös.',
    wiki: 'squad-contracts2',
  },
  v2_option: {
    title: 'Verlängerungsoption',
    text: 'Vereinsoption (ab 1990): Du kannst den Vertrag in seiner letzten Saison einseitig um ein Jahr verlängern. Spieleroption (ab 2000): Er entscheidet am Vertragsende. Freiheitsliebende Spieler hassen Vereinsoptionen.',
    wiki: 'squad-contracts2',
  },
  v2_abstieg: {
    title: 'Abstiegsklausel',
    text: 'Steigt ihr ab, sinkt sein Gehalt zum Saisonstart um den vereinbarten Anteil. Familienmenschen und Ältere wollen das ungern.',
    wiki: 'squad-contracts2',
  },
  v2_zusagen: {
    title: 'Rollen und Zusagen',
    text: 'Zusagen wie Stammplatz oder Kapitänsbinde werden am Saisonende geprüft (ab März: in der nächsten Saison). Gebrochene Zusagen kosten Glaubwürdigkeit und Kabinenfrieden.',
    wiki: 'squad-contracts2',
  },
  v2_geduld: {
    title: 'Geduld',
    text: 'Jede Ablehnung kostet Geduld – knapp daneben wenig, ein beleidigendes Angebot viel. Bei null oder nach sieben Runden bricht er ab, ist gekränkt und will erst nach einigen Wochen wieder reden.',
    wiki: 'squad-contracts2',
  },
  v2_kosten: {
    title: 'Kosten über die Laufzeit',
    text: 'Grundgehalt mit Staffelung, erwartete Prämien (nach Einsätzen, Toren und euren Chancen) und Einmalzahlungen – nominal in der Währung der Zeit.',
    wiki: 'squad-contracts2',
  },
} satisfies Record<string, InfoText>;

export type InfoKey = keyof typeof INFO_TEXTS;
