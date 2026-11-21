// =============================================================================
// Zusätzliche Varianten der Einzelduelle (Text-Audit, docs/recherche/text-audit.md):
// Die häufigsten Duell-Zeilen kamen in einem Spiel bis zu fünfmal wörtlich vor.
// Ergänzt die Symbole aus duels.ts (dort unverändert), zusammengeführt im
// Erzähler über `withMore`. Slots wie in duels.ts: {p} Verlierer (angreifendes
// Team), {d} Gewinner, {t}/{o} Teams, {tn} Team als Subjekt.
// =============================================================================
import type { Grammar } from './grammar';

export const DUELS_MORE: Grammar = {
  fail_intercept: [
    '{d} schnappt sich den Ball, bevor er {p} erreicht.', '{d} fährt das Bein aus – Pass von {p} abgefangen.',
    'Der Pass von {p} ist zu durchsichtig, {d} sagt danke.', '{d} hat aufgepasst und unterbindet den Pass von {p}.',
    '{p} sucht die Lücke, aber {d} hat sie längst zugestellt.', 'Gut gelesen von {d}: Der Ball von {p} landet bei ihm.',
    '{d} antizipiert den Pass und läuft ihn ab.', '{p} spielt zu ungenau – {d} ist zur Stelle.',
  ],
  fail_tackle: [
    '{d} grätscht {p} den Ball sauber vom Fuß.', '{d} bleibt im Zweikampf mit {p} Sieger.', '{p} versucht es mit Tempo, {d} hält dagegen.',
    'Fairer Zweikampf, {d} hat den Ball – {p} geht leer aus.', '{d} stellt {p} und erobert den Ball.', '{p} verliert das Laufduell um den Ball gegen {d}.',
    '{d} geht entschlossen dazwischen, {p} ist den Ball los.',
  ],
  fail_aerial: [
    '{d} ist in der Luft nicht zu überwinden.', 'Hoher Ball auf {p} – {d} ist zuerst dran.', '{d} springt mit {p} hoch und gewinnt das Duell.',
    'Kopf an Kopf mit {p}: {d} behält die Oberhand.', '{d} nickt den Ball vor {p} aus der Gefahrenzone.', 'Lufthoheit für {d}, {p} kommt nicht an den Ball.',
    '{d} hat das bessere Timing und köpft den Ball weg.', '{p} wird von {d} im Kopfballduell abgekocht.', 'Der Ball segelt Richtung {p}, doch {d} köpft ihn zurück ins Mittelfeld.',
    '{d} klärt mit dem Kopf, {p} schaut hinterher.',
  ],
  fail_claim: [
    '{d} faustet die Flanke weit hinaus.', '{d} greift sicher zu, {p} hat das Nachsehen.', 'Keine Chance für {p} – {d} fängt den Ball im Sprung.',
    '{d} verlässt die Linie und hat die Hereingabe.',
  ],
  fail_cross_blocked: [
    '{d} wirft sich in die Flanke von {p}.', 'Die Hereingabe von {p} prallt von {d} ins Seitenaus.',
    '{d} steht richtig, die Flanke von {p} kommt nicht durch.', '{p} sucht den Weg zur Grundlinie, {d} ist schneller da.',
    '{d} hält {p} auf dem Flügel in Schach.', 'Flanke von {p} – abgeblockt von {d}.', '{p} bleibt mit der Hereingabe an {d} hängen.',
  ],
  fail_race: [
    '{d} ist im Sprintduell mit {p} vorn.', 'Lauf in die Tiefe von {p}, doch {d} holt ihn ein.', '{d} sprintet {p} hinterher und spitzelt den Ball weg.',
    '{p} legt sich den Ball zu weit vor – {d} ist dazwischen.',
  ],
  fail_longball: [
    'Ein langer Ball von {p} segelt ins Seitenaus.', '{p} versucht es mit dem weiten Pass – zu ungenau.', 'Der Diagonalball von {p} findet keinen Abnehmer.',
    'Weiter Schlag von {p}, aber da ist kein Mitspieler.', '{p} drischt den Ball nach vorn – Abstoß.', 'Viel zu lang: Der Ball von {p} rollt ins Toraus.',
    '@-1991 {p} schlägt den Ball blind nach vorn – Ballverlust.',
  ],
  fail_recycle: [
    '{tn} kommt nicht weiter und baut neu auf.', '{p} findet keine Anspielstation und spielt zurück.', 'Zurück zum Torwart – {t} sortiert sich neu.',
    '{tn} schiebt den Ball hin und her, eine Lücke tut sich nicht auf.', '{p} dreht sich um und sucht den Rückpass.', 'Kein Durchkommen für {t}, der Ball läuft zurück.',
    '{o} steht gut, {t} muss den Angriff abbrechen.',
  ],
};

/** Varianten anhängen (gleiche Symbole, mehr Abwechslung). */
export function withMore(base: Grammar, more: Grammar): Grammar {
  const out: Grammar = { ...base };
  for (const [k, v] of Object.entries(more)) out[k] = [...(base[k] ?? []), ...v];
  return out;
}
