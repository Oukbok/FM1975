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
  ],
  hl_sieg_knapp: [
    '{w} zittert sich zum Sieg',
    'Ein Tor reicht {w}',
    'Knapp, aber verdient: {w} schlägt {l}',
    '{w} müht sich gegen {l} zum [Dreier|Sieg]',
    '?spaet Spätes Glück für {w}',
    '?spaet Last-Minute-Jubel bei {w}',
  ],
  hl_remis: [
    '{h} und {a} trennen sich {score}',
    'Punkteteilung zwischen {h} und {a}',
    'Kein Sieger in {city}',
    '{h} kommt gegen {a} nicht über ein Remis hinaus',
    '?null Nullnummer in {city}',
    '?null Torlos und trostlos: {h} gegen {a}',
  ],
  hl_upset: [
    'Sensation! {w} stürzt {l}',
    'Außenseiter {w} [überrascht|blamiert] {l}',
    'David schlägt Goliath: {w} gewinnt bei {l}',
    '{l} [blamiert sich|stolpert] gegen {w}',
  ],
  hl_held: [
    '{player} schießt {club} zum Sieg',
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
    'In der Tabelle ist {club} nun [Platz|auf Rang] {pos}.',
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
    '{club} [zieht einsam seine Kreise|marschiert vorneweg]',
    'Spitzenreiter {club} [lässt nicht locker|gibt sich keine Blöße]',
  ],
  hl_keller: [
    'Abstiegskampf: {club} [rutscht|steckt] [tief |]im Keller',
    'Bei {club} brennt der Baum',
    'Bei {club} schrillen die Alarmglocken',
    'Rote Laterne für {club}',
    '{club} [taumelt|schlittert] Richtung zweite Liga',
  ],
  tb_lead: [
    '{club} steht nach {played} Spielen mit {pts} Punkten auf Platz {pos}.',
    'Mit {pts} Zählern aus {played} Partien belegt {club} Rang {pos}.',
  ],
  tb_abstand: [
    '!gleich Der Vorsprung auf {second} beträgt {gap}.',
    '?gleich {second} ist punktgleich – nur das Torverhältnis trennt die beiden.',
    '!gleich Dahinter lauert {second} ({gap} zurück).',
  ],
  tb_keller: [
    'Am Tabellenende wird die Luft dünn: {bottom} [zittern|bangen] um die Klasse.',
    'Im Keller [stecken|kämpfen] {bottom}.',
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
    '?abroad {player} [zieht es ins Ausland|verlässt die Liga]',
  ],
  tr_lead: [
    '!import {player} ({age}, {pos}) [wechselt|geht] von {from} zu {to}.',
    '!import Der {age}-jährige {posname} {player} [verlässt {from}|kehrt {from} den Rücken] und schließt sich {to} an.',
    '!import !abroad {to} hat {player} von {from} verpflichtet.',
    '?import !abroad {to} hat den {age}-jährigen {posname} {player} verpflichtet.',
    '?ausl !abroad {player} kommt aus dem Ausland zu {to}.',
  ],
  tr_fee: [
    'Die Ablöse soll bei {fee} liegen.',
    'Nach unseren Informationen fließen {fee}.',
    'Über die Ablöse wurde Stillschweigen vereinbart – im Umfeld ist von {fee} die Rede.',
  ],
  tr_free: ['Eine Ablöse wird nicht fällig.', 'Der Wechsel erfolgt ablösefrei.'],
  tr_fazit: [
    '{player} [kam|stand] in dieser Saison auf {apps} Einsätze und {goals} Tore.',
    '!import In {fromcity} [hinterlässt er eine Lücke|weint man ihm keine Träne nach|hatte er zuletzt einen schweren Stand].',
    '@2003- Im Netz [diskutieren die Fans|wird der Wechsel heftig diskutiert].',
  ],
  hl_geruecht: [
    'Zieht es {player} zu {to}?',
    '{to} [buhlt|wirbt] um {player}',
    '{player} im Visier von {to}',
    '[Poker|Tauziehen] um {player}',
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
    '?ruhestand Nach {years} Jahren an der Seitenlinie [ist Schluss|genießt er den Ruhestand].',
  ],
  co_nachfolger: [
    'Nachfolger wird {succ}.',
    'Neuer Mann an der Seitenlinie ist {succ}.',
    '{succ} soll [die Wende schaffen|für frischen Wind sorgen|das Ruder herumreißen].',
  ],

  // ------------------------------------------------------------ Verletzung
  hl_verletzung: [
    '{player} fällt [lange|wochenlang] aus',
    'Schock für {club}: {player} verletzt',
    'Bittere Diagnose für {player}',
    '?lang {player} [droht das Saison-Aus|fällt monatelang aus]',
  ],
  vl_body: [
    'Die Diagnose bei {player}: {inj}. [Die Ärzte rechnen|Der Mannschaftsarzt rechnet] mit {days}.',
    '{club} muss {days} auf {player} verzichten ({inj}).',
  ],
  vl_fazit: [
    '?stamm Für {club} wiegt der Ausfall schwer – {player} war gesetzt.',
    '[Die Lücke müssen nun andere füllen.|Jetzt ist die zweite Reihe gefragt.]',
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
    '?aus Aus in {round}: {club} scheitert an {opp}',
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
  hl_rekord_hattrick: ['Dreierpack! {player} [schreibt Geschichte|ist der Mann des Tages]', 'Lupenreiner Hattrick von {player}'],
  hl_rekord_marke: ['{player} knackt die {n}-Tore-Marke', '{n} Saisontore: {player} [trifft und trifft|ist nicht zu stoppen]'],
  hl_rekord_kulisse: ['Rekordkulisse: {att} sehen {h} gegen {a}', '{att}! Ausverkauft in {city}'],
  rk_body: [
    '?marke Mit seinem jüngsten Treffer erreichte {player} ({club}) die Marke von {n} Saisontoren.',
    '?marke {player} ({club}) steht nun bei {n} Saisontoren – [eine starke Quote|ein beachtlicher Wert].',
    '?hattrick {player} traf beim {score} gegen {opp} gleich dreimal.',
    '?kulisse So viele Zuschauer wie beim Spiel {h} gegen {a} ({att}) gab es in dieser Saison noch nicht.',
  ],

  // -------------------------------------------------------------- Vorschau
  hl_vorschau: ['Vorschau: {h} gegen {a}', '?top Topspiel: {h} empfängt {a}', '?top Das Spiel der Woche: {h} – {a}', '!top {h} erwartet {a}', '!top Vor dem Duell {h} – {a}'],
  vs_body: [
    'Am {wd} [kommt es zum|steigt das] Duell zwischen {h} (Platz {hp}) und {a} (Platz {ap}).',
    '{h} [hofft auf|setzt auf] die Unterstützung des Publikums, {a} reist mit [breiter Brust|Respekt|Selbstvertrauen] an.',
  ],

  // ------------------------------------------------------- Saisonvorschau
  hl_favoriten: ['Wer stoppt {a}?', 'Die Jagd auf die Schale beginnt', '{a}, {b}, {c}: Die Favoriten', 'Titelkampf: Alle gegen {a}'],
  fv_body: [
    'Vor dem Saisonstart gilt {a} als [erster Anwärter auf die Meisterschaft|Topfavorit]. Die größten Verfolger: {b} und {c}.',
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
  hl_kommentar_gut: ['{club} – weiter so!', 'Die Kurve zeigt nach oben', 'Ein Lob an {club}', '{club} macht Lust auf mehr'],
  hl_kommentar_mittel: ['Licht und Schatten bei {club}', '{club}: Noch ist Luft nach oben', 'Geduld ist gefragt'],
  hl_kommentar_schlecht: ['Wo soll das hinführen, {club}?', 'Die Uhr tickt', '{club} braucht eine Wende', 'Es reicht!'],
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
  ],
};
