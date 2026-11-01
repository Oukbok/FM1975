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
  // ---------------------------------------------------------------- Spieler-Zustand
  frische: {
    title: 'Frische',
    text: 'Wie ausgeruht ein Spieler gerade ist (0–100). Nach Spielen sinkt sie stark und erholt sich über mehrere Tage; je niedriger sie ist, desto schneller gehen dem Spieler im Spiel die Kräfte aus. Batterie dunkelgrün = voll erholt, rot = erschöpft.',
    wiki: 'condition-frische',
  },
  fitness: {
    title: 'Fitness',
    text: 'Grundkondition und Durchhaltevermögen – ein Attribut, das sich über Training langsam aufbaut. Hohe Fitness lässt die Frische nach Spielen weniger stark fallen und schneller zurückkommen.',
    wiki: 'condition-fitness',
  },
  form: {
    title: 'Form',
    text: 'Kurzfristige Verfassung (0–100, 50 = Durchschnitt). Gute Noten und Siege heben sie, schwache Spiele senken sie; mit der Zeit pendelt sie zur Mitte. Daumen hoch grün = Topform, waagerecht = normal, nach unten rot = Formtief.',
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
    text: 'Verdeckter Charakterwert: Wie stark die Leistung von Spiel zu Spiel schwankt. Konstante Spieler liefern verlässlich, unkonstante haben mehr Ausreißer nach oben und unten.',
    wiki: 'development-hidden',
  },
  nervenstaerke: {
    title: 'Nervenstärke',
    text: 'Wie gut ein Spieler mit großen Spielen umgeht – Derbys, Pokal, Europapokal, Entscheidungsspiele. Nervenstarke Spieler steigern sich dort eher, nervöse fallen ab.',
    wiki: 'development-hidden',
  },
  zustand: {
    title: 'Zustand',
    text: 'Frische, Form und Moral ändern sich laufend; Fitness, Konstanz und Nervenstärke gehören zum Spieler. Fahre mit der Maus über ein Symbol, um den genauen Wert zu sehen.',
    wiki: 'condition-frische',
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
    text: 'Von 1976 bis 2004 gab es im Winter Hallenturniere. Eine Zusage bringt Antrittsgeld, Prämien und Ansehen, kostet aber Frische und birgt Verletzungsrisiko.',
    wiki: 'indoor-football',
  },
  hallenMasters: {
    title: 'Hallen-Masters',
    text: 'Das Finalturnier der Hallensaison (1988–2001) für die besten Mannschaften der Tour. Ein Sieg bringt Geld und Ansehen, sportlich zählt er nicht.',
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
  abseitsfalle: {
    title: 'Abseitsfalle',
    text: 'Die Abwehr rückt gemeinsam heraus, um Gegner ins Abseits zu stellen. Klappt es, ist der Angriff vorbei – verpasst einer den Moment, steht ein Stürmer allein vor dem Tor.',
    wiki: 'tactic-options',
  },
  wirkung: {
    title: 'Wirkung im Spiel',
    text: 'Wie deine Einstellungen die Match-Engine gegenüber einer neutralen Taktik verschieben – in Prozent. Grün/hell hilft dir, orange kostet etwas. Kein Wert ist „gratis“.',
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
    text: 'Wie zufrieden der Vorstand mit dir ist (0–100). Es richtet sich nach Saisonziel, Ergebnissen und Finanzen. Unter 40 kürzt er die Transfermittel, unter 20 halbiert er sie.',
    wiki: 'environment-overview',
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
    text: 'Bonus, der nur bei einem vereinbarten Erfolg fällig wird, etwa Meisterschaft oder Europapokal. Ehrgeizige Spieler mögen sie, die Kasse trifft sie erst im Erfolgsfall.',
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
  beobachtung: {
    title: 'Beobachtung',
    text: 'Spieler auf deiner Liste werden von den Scouts verfolgt. Je länger, desto genauer werden Potenzial-Spanne und Persönlichkeit.',
    wiki: 'youth-gems-scouting',
  },
} satisfies Record<string, InfoText>;

export type InfoKey = keyof typeof INFO_TEXTS;
