// =============================================================================
// Presse: Textbausteine im Ton einer Sportzeitung (Grammatik wie der Ticker,
// siehe data/ticker/grammar.ts: #symbol#, {slot}, [a|b], @Jahr-, ?flag, !flag).
// Nur fiktive Vereine/Personen aus dem Spielstand – keine echten Namen.
// =============================================================================
import type { Grammar } from '../ticker/grammar';

export const PRESS_GRAMMAR: Grammar = {
  // ---------------------------------------------------------------- Spiele
  hl_sieg_hoch: [
    '{w} schießt {l} ab',
    'Schützenfest: {w} [überrollt|demontiert|zerlegt] {l}',
    '{score}! {w} lässt {l} keine Chance',
    'Gala von {w} – {l} geht unter',
    '{l} erlebt ein Debakel',
    'Torfestival in {city}',
  ],
  hl_sieg: [
    '{w} [bezwingt|schlägt|besiegt] {l}',
    'Verdienter Erfolg für {w}',
    '{w} behält gegen {l} die Oberhand',
    '{w} gewinnt gegen {l}',
    '{w} setzt sich gegen {l} durch',
    'Klare Sache für {w}',
    '{w} lässt {l} [hinter sich|das Nachsehen]',
    'Nichts zu holen für {l}',
    '{score}: {w} [jubelt|feiert] gegen {l}',
  ],
  hl_sieg_knapp: [
    '{w} zittert sich zum Sieg',
    'Ein Tor reicht {w}',
    'Knapp, aber verdient: {w} schlägt {l}',
    '?p3 {w} müht sich gegen {l} zum Dreier',
    '{w} müht sich gegen {l} zum Sieg',
    '{w} siegt mit Ach und Krach',
    'Knappe Kiste: {w} gegen {l} vorn',
    '?spaet Spätes Glück für {w}',
    '?spaet Last-Minute-Jubel bei {w}',
  ],
  hl_remis: [
    '{h} und {a} trennen sich {score}',
    'Punkteteilung zwischen {h} und {a}',
    'Kein Sieger in {city}',
    'Remis zwischen {h} und {a}',
    '{h} und {a} teilen die Punkte',
    '{score} – {h} und {a} bleiben ohne Sieger',
    '{h} kommt gegen {a} nicht über ein Remis hinaus',
    '?null Nullnummer in {city}',
    '?null Torlos und trostlos: {h} gegen {a}',
  ],
  hl_upset: [
    'Sensation! {w} stürzt {l}',
    'Außenseiter {w} [überrascht|blamiert] {l}',
    '?ausw David schlägt Goliath: {w} gewinnt bei {l}',
    '!ausw David schlägt Goliath: {w} bezwingt {l}',
    '?ausw Überraschung in {city}: {w} siegt beim Favoriten',
    '{l} [blamiert sich|stolpert] gegen {w}',
  ],
  hl_held: [
    '{player} schießt {club} zum Sieg',
    '{player} [sticht|trifft] für {club}',
    'Matchwinner {player}',
    '{club} jubelt über {player}',
    '{player} macht den Unterschied',
    '?doppel Doppelpack! {player} [entscheidet|erledigt] das Spiel',
    '?hattrick Dreierpack! {player} ist nicht zu halten',
    '?hattrick {player} trifft dreimal – {club} jubelt',
    '?spaet {player} [erlöst|rettet] {club} in der Schlussphase',
  ],
  sp_lead: [
    'Vor {att} Zuschauern entwickelte sich [eine Partie mit klarer Rollenverteilung|eine intensive Begegnung|ein Spiel mit offenem Visier].',
    '{att} Zuschauer [im {stadium}|in {city}] erlebten [einen umkämpften Nachmittag|ein Spiel, das lange offen blieb|eine einseitige Angelegenheit].',
    '@-1990 Bei [Nieselregen|bestem Fußballwetter|frischem Wind] [kamen|pilgerten] {att} Zuschauer [ins Stadion|zum {stadium}].',
    '@1991- {att} Fans [im {stadium}|in {city}] sahen [ein temporeiches Spiel|eine taktisch geprägte Partie|ein Spiel mit vielen Torraumszenen].',
  ],
  sp_tore: [
    'Die Tore: {goals}.',
    'Für die Treffer sorgten {goals}.',
    'Torfolge: {goals}.',
  ],
  sp_motm: [
    'Bester Mann auf dem Platz war {motm}.',
    '{motm} [überragte|ragte heraus|war nicht zu bremsen] und verdiente sich die Bestnote.',
    'Herausragend: {motm}.',
  ],
  sp_fazit_w: [
    '{w} [zeigte die reifere Leistung|war über weite Strecken überlegen|nutzte die Chancen eiskalt].',
    'Für {l} [war mehr drin|bleibt die Erkenntnis, dass es nicht reicht|beginnt nun das große Grübeln].',
    'Bei {w} [stimmte vor allem die Einstellung|griff ein Rädchen ins andere|lief der Ball gut durch die Reihen].',
  ],
  sp_fazit_d: [
    'Am Ende [konnten beide mit dem Punkt leben|ärgerten sich beide Seiten über vergebene Chancen|ging die Punkteteilung in Ordnung].',
    'Mehr als ein Remis [gab das Spiel nicht her|war für keine Seite drin].',
  ],
  sp_zitat_w: [
    '„[Wir haben heute eine geschlossene Mannschaftsleistung gezeigt|Die Jungs haben sich das verdient|Das war ein hartes Stück Arbeit|So stelle ich mir das vor]“, [sagte|meinte|freute sich] {coach} [nach dem Abpfiff|nach dem Spiel|auf der Pressekonferenz].',
    '{coach} [war zufrieden|zeigte sich erleichtert]: „[Wir sind auf einem guten Weg.|Darauf lässt sich aufbauen.|Die Mannschaft lebt.]“',
  ],
  sp_zitat_l: [
    '„[Wir haben uns selbst geschlagen|Darüber müssen wir reden|Heute hat nicht viel zusammengepasst|So können wir nicht auftreten]“, [haderte|ärgerte sich|kritisierte] {coach}.',
    '{coach} [suchte nach Erklärungen|wirkte ratlos]: „[Das müssen wir schnell abhaken.|Wir müssen die Fehler abstellen.]“',
  ],
  sp_zitat_d: [
    '„[Mit dem Punkt können wir leben|Da war mehr drin|Ein gerechtes Ergebnis]“, [sagte|meinte|befand] {coach}.',
  ],
  sp_platz: [
    'Damit [steht|rangiert] {club} nun auf Platz {pos}.',
    'In der Tabelle [belegt {club} nun Rang {pos}|liegt {club} jetzt auf Platz {pos}].',
  ],
  sp_rot: ['Für Aufregung sorgte {rot}, der [vorzeitig duschen musste|die Rote Karte sah|vom Platz flog].'],

  // ------------------------------------------------------------- Spieltag
  hl_spieltag: [
    'Der {md}. Spieltag: {top}',
    '{md}. Spieltag: {top}',
  ],
  st_lead: [
    '{goals} Tore in {games} Spielen – [ein unterhaltsamer|ein torreicher|ein durchwachsener] Spieltag.',
    'Der {md}. Spieltag brachte {goals} Treffer in {games} Begegnungen.',
    '{games} Spiele, {goals} Tore: [der Spieltag im Überblick|so lief die Runde].',
  ],
  st_heim: ['Die Heimteams gewannen {hw} von {games} Spielen.', 'Bilanz: {hws}, {aws}, {drs}.'],

  // --------------------------------------------------------------- Tabelle
  hl_spitze_neu: ['{club} [erobert|übernimmt] die Tabellenspitze', 'Neuer Spitzenreiter: {club}', '{club} ganz oben!'],
  hl_spitze: [
    '{club} [thront|bleibt] [weiter |]an der Spitze',
    'Platz eins bleibt bei {club}',
    '{club} verteidigt die Tabellenführung',
    'Der Spitzenreiter heißt weiter {club}',
    '{club} [zieht einsam seine Kreise|marschiert vorneweg]',
    'Spitzenreiter {club} [lässt nicht locker|gibt sich keine Blöße]',
  ],
  hl_keller: [
    'Abstiegskampf: {club} [rutscht in den|steckt tief im] Keller',
    'Bei {club} brennt der Baum',
    'Bei {club} schrillen die Alarmglocken',
    'Rote Laterne für {club}',
    '?oberhaus {club} [taumelt|schlittert] Richtung zweite Liga',
    '!oberhaus {club} [taumelt|schlittert] dem Abstieg entgegen',
    '{club} im Tabellenkeller: Die Lage wird ernst',
    'Krisenstimmung bei {club}',
  ],
  tb_lead: [
    '{club} steht nach {spiele} mit {punkte} auf Platz {pos}.',
    'Mit {zaehler} aus {partien} belegt {club} Rang {pos}.',
    'Nach {spiele} hat {club} {punkte_acc} auf dem Konto – Platz {pos}.',
  ],
  tb_abstand: [
    '!gleich Der Vorsprung auf {second} beträgt {gap}.',
    '?gleich {second} ist punktgleich – nur das Torverhältnis trennt die beiden.',
    '!gleich ?eng Dahinter lauert {second} ({gap} zurück).',
    '!gleich !eng Erster Verfolger ist {second} mit {gapdat} Rückstand.',
    '!gleich ?eng {second} sitzt dem Spitzenreiter mit {gapdat} Rückstand im Nacken.',
  ],
  tb_keller: [
    'Am Tabellenende wird die Luft dünn: {bottom} [zittern|bangen] um die Klasse.',
    'Im Keller [stecken|kämpfen] {bottom}.',
    'Ganz unten [stehen|finden sich] {bottom}.',
  ],

  // ------------------------------------------------------------- Transfers
  hl_transfer: [
    '!abroad {player} wechselt zu {to}',
    '!abroad {to} holt {player}',
    '!abroad {player} [unterschreibt|unterzeichnet] bei {to}',
    '!abroad Perfekt: {player} geht nach {tocity}',
    '?big Rekord-Deal: {player} für {fee} zu {to}',
    '?big {fee}! {to} [schlägt zu|greift tief in die Tasche]',
    '?free !abroad Ablösefrei: {player} [schließt sich {to} an|geht zu {to}]',
    '?abroad Es zieht {player} ins Ausland',
    '?abroad {player} verlässt die Liga',
    '!abroad Neue Aufgabe: {player} wechselt nach {tocity}',
    '!abroad Wechsel perfekt: {player} [spielt künftig|läuft künftig] für {to} auf',
    '!abroad !import {from} gibt {player} an {to} ab',
    '!abroad ?import Neuer Mann für {to}: {player}',
  ],
  tr_lead: [
    '!import {player} ({age}, {pos}) [wechselt|geht] von {from} zu {to}.',
    '!import Der {age}-jährige {posname} {player} [verlässt {from}|kehrt {from} den Rücken] und schließt sich {to} an.',
    '!import !abroad {to} hat {player} von {from} verpflichtet.',
    '!import !abroad {player} ({age}) spielt künftig für {to}, {from} gibt den {posname} ab.',
    '!import !abroad Von {from} zu {to}: {player} hat seinen neuen Vertrag unterschrieben.',
    '!import !abroad Der Wechsel ist perfekt – {player} verlässt {from} in Richtung {tocity}.',
    '!import !abroad {to} verstärkt sich mit {player} ({pos}, {age}) von {from}.',
    '?import !abroad {to} hat den {age}-jährigen {posname} {player} verpflichtet.',
    '?ausl !abroad {player} kommt aus dem Ausland zu {to}.',
  ],
  tr_fee: [
    'Die Ablöse soll bei {fee} liegen.',
    'Nach unseren Informationen fließen {fee}.',
    'Über die Ablöse wurde Stillschweigen vereinbart – im Umfeld ist von {fee} die Rede.',
    'Der Transfer kostet {fee}.',
    'Für den Wechsel werden {fee} fällig.',
    'Die Summe: {fee}, wie aus Vereinskreisen verlautet.',
  ],
  tr_free: ['Eine Ablöse wird nicht fällig.', 'Der Wechsel erfolgt ablösefrei.', 'Geld fließt keines.'],
  tr_fazit: [
    '{player} kam in dieser Saison auf {apps} und {goals}.',
    'In dieser Saison brachte es {player} auf {apps} und {goals}.',
    '!import In {fromcity} [hinterlässt er eine Lücke|weint man ihm keine Träne nach|hatte er zuletzt einen schweren Stand].',
    '@2003- Im Netz [diskutieren die Fans|wird der Wechsel heftig diskutiert].',
  ],
  hl_geruecht: [
    'Zieht es {player} zu {to}?',
    '{to} [buhlt|wirbt] um {player}',
    '{player} im Visier von {to}',
    '[Poker|Tauziehen] um {player}',
    'Wechselt {player} nach {tocity}?',
    'Gerücht: {to} [fragt|klopft] bei {club} an',
    '{to} [streckt die Fühler|seine Fühler] nach {player} aus',
    'Wie lange bleibt {player} noch in {city}?',
    'Heiße Spur: {player} und {to}',
  ],
  ge_body: [
    'Wie aus [dem Umfeld des Vereins|gut unterrichteten Kreisen|Spielerkreisen] zu hören ist, [beobachtet|verfolgt] {to} die Entwicklung von {player} ({club}) [schon länger|aufmerksam].',
    '{player} gilt bei {to} als [heißer Kandidat|Wunschspieler].',
  ],
  ge_grund: [
    '?vertrag Sein Vertrag in {city} läuft im Sommer aus.',
    '?liste {club} hat den {posname} auf die Transferliste gesetzt.',
    '{club} [will von einem Verkauf nichts wissen|blockt bisher ab|würde wohl nur für eine hohe Summe verkaufen].',
  ],

  // --------------------------------------------------------------- Trainer
  hl_entlassen: [
    '{club} [feuert|entlässt] {coach}',
    'Aus für {coach} in {city}',
    'Trainerbeben bei {club}',
    '{club} zieht die Reißleine',
  ],
  hl_ruhestand: ['{coach} [hört auf|sagt Servus]', 'Abschied: {coach} geht in den Ruhestand'],
  hl_abgeworben: ['{coach} verlässt {club}', '{club} verliert seinen Trainer'],
  hl_vertragsende: ['{coach} und {club} gehen getrennte Wege'],
  co_lead: [
    '{club} hat sich von {coach} getrennt.',
    'Die Zeit von {coach} bei {club} ist vorbei.',
  ],
  co_grund: [
    '?entlassen [Nach|Infolge] der sportlichen Talfahrt – Platz {pos} – [zog der Vorstand die Konsequenzen|verlor das Präsidium die Geduld].',
    '?entlassen [Zuletzt hatte es|Seit Wochen hatte es] im Umfeld [gebrodelt|gerumort].',
    '?ruhestand Nach {years} an der Seitenlinie [ist Schluss|genießt er den Ruhestand].',
  ],
  co_nachfolger: [
    'Nachfolger wird {succ}.',
    'Neuer Mann an der Seitenlinie ist {succ}.',
    '{succ} soll [die Wende schaffen|für frischen Wind sorgen|das Ruder herumreißen].',
  ],

  // ------------------------------------------------------------ Verletzung
  hl_verletzung: [
    '{player} fällt [lange|wochenlang] aus',
    'Verletzungssorgen bei {club}',
    '{club} bangt um {player}',
    'Schock für {club}: {player} verletzt',
    'Bittere Diagnose für {player}',
    '?lang {player} [droht das Saison-Aus|fällt monatelang aus]',
  ],
  vl_body: [
    'Die Diagnose bei {player}: {inj}. [Die Ärzte rechnen|Der Mannschaftsarzt rechnet] mit {daysdat} Pause.',
    '{club} muss {days} auf {player} verzichten ({inj}).',
    '{player} hat sich verletzt ({inj}) und fehlt {club} voraussichtlich {days}.',
  ],
  vl_fazit: [
    '?stamm Für {club} wiegt der Ausfall schwer – {player} war gesetzt.',
    'Die Lücke müssen nun andere füllen.',
    'Jetzt ist die zweite Reihe gefragt.',
    'Der Trainer muss umbauen.',
    'Für die Ersatzleute schlägt jetzt die Stunde.',
    '[Ein herber Rückschlag.|Ein Ausfall zur Unzeit.]',
    'Wann {player} wieder ins Training einsteigt, ist offen.',
  ],

  // ---------------------------------------------------------- Pokal/Europa
  hl_pokal: [
    '!final {w} zieht {next} ein',
    '!final {w} [übersteht|meistert] die Hürde {l}',
    '?upset Pokalschreck {w}! {l} [fliegt raus|ist raus]',
    '?upset Blamage für {l} im Pokal',
    '?final {w} holt den Pokal!',
  ],
  hl_euro: [
    '!aus !final {club} [zieht|stürmt] {next} ein',
    '!aus !final Europa ruft: {club} [weiter|eine Runde weiter]',
    '?aus Aus {inround}: {club} scheitert an {opp}',
    '?aus Europäischer Traum geplatzt für {club}',
    '?final {club} [triumphiert|siegt] im Endspiel!',
  ],
  hl_leg_w: ['{club} [siegt|gewinnt] {score} gegen {opp}', 'Erfolg für {club}: {score} gegen {opp}', '{club} legt vor: {score} gegen {opp}'],
  hl_leg_d: ['{club} mit Remis gegen {opp}', 'Unentschieden: {club} und {opp} trennen sich {score}'],
  hl_leg_l: ['Pleite für {club} gegen {opp}', '{club} verliert {score} gegen {opp}', 'Dämpfer für {club}'],
  cup_lead: [
    '{round}, {comp}: {res}.',
    'Die Ergebnisse {round_gen} im {comp}: {res}.',
  ],

  // ---------------------------------------------------------------- Jugend
  hl_talent: [
    'Talent {player} [trifft|zeigt sich]',
    '{age} Jahre jung: {player} [trumpft auf|macht auf sich aufmerksam]',
    'Ein Name, den man sich merken muss: {player}',
  ],
  tl_body: [
    'Der erst {age}-jährige {posname} [traf|netzte] [gegen|beim Spiel gegen] {opp} [und sorgte für Aufsehen|zum {score}].',
    'Bei {club} [setzt man große Hoffnungen in den Nachwuchsmann|schwärmt man vom Nachwuchsmann].',
    '?eigen {player} stammt aus der eigenen Jugend.',
  ],

  // --------------------------------------------------------------- Kabine
  hl_kabine_krach: [
    'Knatsch bei {club}: {a} gegen {b}?',
    'Unruhe in der Kabine von {club}',
    'Dicke Luft bei {club}',
  ],
  hl_kabine_gut: ['Bei {club} stimmt die Chemie', '{club}: [Eine Einheit|Ein Herz und eine Seele]'],
  hl_kabine_schlecht: ['Stimmungstief bei {club}', 'Bei {club} hängt der Haussegen schief'],
  kb_body: [
    'Wie [aus dem Mannschaftskreis|von Trainingsbeobachtern|aus dem Umfeld] zu hören ist, ist die Stimmung {mood}.',
    '?krach Zwischen {a} und {b} soll es [im Training|in der Kabine] [gekracht haben|ordentlich gefunkt haben].',
    '?kapitaen Kapitän {cap} [gilt als ruhender Pol|soll die Wogen glätten].',
    '@2008- In den sozialen Netzwerken [kursieren bereits Gerüchte|wird fleißig spekuliert].',
  ],

  // --------------------------------------------------------------- Rekorde
  hl_rekord_hattrick: [
    'Dreierpack! {player} [schreibt Geschichte|ist der Mann des Tages]', 'Lupenreiner Hattrick von {player}', 'Drei Tore: {player} [glänzt|trumpft auf]',
    '{player} trifft und trifft und trifft', 'Ein Abend für {player}', '{player} schnürt den Dreierpack',
  ],
  hl_rekord_marke: [
    '{player} knackt die {n}-Tore-Marke', '{n} Saisontore: {player} [trifft und trifft|ist nicht zu stoppen]', '{player} schon bei {n} Toren',
    'Torjäger {player}: Nummer {n}', '{player} trifft zum {n}. Mal', '{n}! {player} [hört nicht auf|legt nach]',
  ],
  hl_rekord_kulisse: ['Rekordkulisse: {att} sehen {h} gegen {a}', '{att}! Ausverkauft in {city}'],
  rk_body: [
    '?marke Mit seinem jüngsten Treffer erreichte {player} ({club}) die Marke von {n} Saisontoren.',
    '?marke {player} ({club}) steht nun bei {n} Saisontoren – [eine starke Quote|ein beachtlicher Wert].',
    '?marke {n} Tore hat {player} in dieser Saison schon erzielt – {club} [freut sich über seinen Torjäger|kann sich auf ihn verlassen].',
    '?marke Für {player} ({club}) war es bereits das {n}. Saisontor.',
    '?marke Die Torjägerliste kennt einen neuen Namen weit oben: {player} ({club}) hat jetzt {n} Treffer.',
    '?hattrick {player} traf beim {score} gegen {opp} gleich dreimal.',
    '?hattrick Beim {score} gegen {opp} war {player} dreimal erfolgreich.',
    '?hattrick Drei Treffer gegen {opp}: {player} ({club}) war beim {score} nicht zu halten.',
    '?hattrick {opp} fand beim {score} kein Mittel gegen {player} – drei Tore.',
    '?kulisse So viele Zuschauer wie beim Spiel {h} gegen {a} ({att}) gab es in dieser Saison noch nicht.',
  ],

  // -------------------------------------------------------------- Vorschau
  hl_vorschau: [
    'Vorschau: {h} gegen {a}', '?top Topspiel: {h} empfängt {a}', '?top Das Spiel der Woche: {h} – {a}', '!top {h} erwartet {a}', '!top Vor dem Duell {h} – {a}',
    '{a} zu Gast bei {h}', 'Am {wd}: {h} gegen {a}', '{h} will gegen {a} punkten', 'Was geht für {a} in {city}?', 'Die Woche der Wahrheit für {h}?',
  ],
  vs_body: [
    '?plaetze Am {wd} [kommt es zum|steigt das] Duell zwischen {h} (Platz {hp}) und {a} (Platz {ap}).',
    '!plaetze Am {wd} [kommt es zum|steigt das] Duell zwischen {h} und {a}.',
    '{h} [hofft auf|setzt auf] die Unterstützung des Publikums, {a} reist mit [breiter Brust|Respekt|Selbstvertrauen] an.',
    '?plaetze Am {wd} empfängt der Tabellen-{hp}. den Tabellen-{ap}.',
    'Beide Trainer [haben sich bedeckt gehalten|lassen sich nicht in die Karten schauen].',
    'In {city} rechnet man mit [einer vollen Hütte|einem ordentlichen Besuch|einer stimmungsvollen Kulisse].',
  ],

  // ------------------------------------------------------- Saisonvorschau
  hl_favoriten: [
    'Wer stoppt {a}?', '?schale Die Jagd auf die Schale beginnt', '!schale ?oberhaus Die Jagd auf den Titel beginnt', '!oberhaus Wer schafft den Aufstieg?',
    '{a}, {b}, {c}: Die Favoriten', '?oberhaus Titelkampf: Alle gegen {a}', '!oberhaus Aufstiegsrennen: Alle gegen {a}',
  ],
  fv_body: [
    '?oberhaus Vor dem Saisonstart gilt {a} als [erster Anwärter auf die Meisterschaft|Topfavorit]. Die größten Verfolger: {b} und {c}.',
    '!oberhaus Vor dem Saisonstart gilt {a} als [erster Anwärter auf den Aufstieg|Topfavorit]. Die größten Verfolger: {b} und {c}.',
    'Unsere Redaktion [tippt|setzt] auf {a}. [Dahinter lauern|Ein Wort mitreden wollen] {b} und {c}.',
  ],
  hl_stars: ['Die Stars der neuen Saison', 'Auf diese Spieler schaut die Liga', '{player} und Co.: Die Besten der Liga'],
  sr_body: ['Die stärksten Spieler der Liga: {list}.', '[Allen voran|An der Spitze steht] {player} ({club}).'],
  hl_ziel: ['{club}: Das Ziel heißt {goal}', 'Mission {goal} bei {club}', 'Was ist drin für {club}?'],
  zl_body: [
    'Der Vorstand hat die Richtung vorgegeben: {goal}.',
    'Im Umfeld von {club} ist man sich einig – {goal} ist das Mindeste.',
    'Die Mannschaft [wirkt eingespielt|muss sich erst finden], die Vorbereitung [lief ordentlich|verlief durchwachsen].',
  ],

  // ------------------------------------------------------------ Kommentar
  hl_kommentar_gut: [
    '{club} – weiter so!', 'Die Kurve zeigt nach oben', 'Ein Lob an {club}', '{club} macht Lust auf mehr', 'Es läuft bei {club}',
    '{club} auf dem richtigen Weg', 'Ein Team im Aufwind', 'Hier wächst etwas zusammen',
  ],
  hl_kommentar_mittel: [
    'Licht und Schatten bei {club}', '{club}: Noch ist Luft nach oben', 'Geduld ist gefragt', '{club} tritt auf der Stelle',
    'Mittelmaß bei {club}?', 'Wohin geht die Reise, {club}?',
  ],
  hl_kommentar_schlecht: [
    'Wo soll das hinführen, {club}?', 'Die Uhr tickt', '{club} braucht eine Wende', 'Es reicht!', '{club} im freien Fall?',
    'So geht es nicht weiter', 'Krisenstimmung in {city}',
  ],
  km_gut: [
    'Die letzten Wochen [machen Mut|sprechen eine deutliche Sprache]: {form}. [So darf es weitergehen.|Die Fans träumen schon.]',
    '{form} – [da wächst etwas zusammen|die Mannschaft hat sichtbar Spaß am Spiel].',
  ],
  km_mittel: [
    '{form} – [das ist ordentlich, aber nicht mehr|kein Grund zur Panik, aber auch keiner zum Jubeln].',
    'Die Bilanz der letzten Wochen: {form}. [Es fehlt die Konstanz.|Der große Wurf bleibt aus.]',
  ],
  km_schlecht: [
    '{form}. [Das kann nicht der Anspruch sein.|Die Geduld der Fans ist endlich.|Der Trainer muss Lösungen finden.]',
    'Die nackten Zahlen: {form}. [Es wird ungemütlich.|Die Alarmglocken schrillen.]',
  ],
  km_platz: [
    'Aktuell steht {club} auf Platz {pos}.',
    'In der Tabelle bedeutet das Rang {pos}.',
    'Die Tabelle weist {club} derzeit auf Rang {pos} aus.',
  ],
};
