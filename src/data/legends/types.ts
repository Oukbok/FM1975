// =============================================================================
// Ausnahmetalente der Fußballgeschichte – Datenformat (Datensatz-Feld `legendsV2`)
// -----------------------------------------------------------------------------
// Jeder Eintrag beschreibt einen Spieler mit verfremdetem Namen, echtem
// Geburtsdatum, Land, Position, Spielertyp, Potenzial und seinen VERDECKTEN
// Werten. Das Spiel lässt ihn im passenden Jahr als Jugendspieler auftauchen
// (bzw. 1975 schon im Kader); danach entwickelt er sich über die normalen
// Systeme. Nichts davon erscheint als Zahl oder Markierung in der Oberfläche.
// Logik: game/legendsGame.ts, Erzeugung game/legendFactory.ts.
// =============================================================================
import type { AttributeKey, Position } from '../../types';

/** Spielertyp: hebt die typischen Attribute an (Profil des Spielers). */
export type LegendType =
  | 'libero' | 'vorstopper' | 'aussen' | 'abraeumer' | 'regisseur' | 'antreiber'
  | 'dribbler' | 'torjaeger' | 'wandspieler' | 'sprinter' | 'kuenstler' | 'reflex' | 'mitspielend';

export const LEGEND_TYPES: { id: LegendType; label: string; attrs: AttributeKey[] }[] = [
  { id: 'libero', label: 'Libero / Abwehrstratege', attrs: ['passing', 'vision', 'composure', 'positioning', 'ballControl', 'decisions'] },
  { id: 'vorstopper', label: 'Abwehrchef / Manndecker', attrs: ['tackling', 'marking', 'heading', 'strength', 'positioning', 'interceptions'] },
  { id: 'aussen', label: 'Offensiver Außenverteidiger', attrs: ['crossing', 'stamina', 'speed', 'acceleration', 'tackling', 'workRate'] },
  { id: 'abraeumer', label: 'Abräumer', attrs: ['tackling', 'interceptions', 'workRate', 'stamina', 'positioning', 'aggression'] },
  { id: 'regisseur', label: 'Regisseur', attrs: ['passing', 'longPassing', 'vision', 'technique', 'ballControl', 'composure'] },
  { id: 'antreiber', label: 'Antreiber (Box-to-Box)', attrs: ['stamina', 'workRate', 'passing', 'shotPower', 'tackling', 'leadership'] },
  { id: 'dribbler', label: 'Dribbler / Flügelspieler', attrs: ['dribbling', 'agility', 'acceleration', 'flair', 'ballControl', 'balance'] },
  { id: 'torjaeger', label: 'Torjäger', attrs: ['shooting', 'positioning', 'composure', 'firstTouch', 'acceleration', 'decisions'] },
  { id: 'wandspieler', label: 'Wandspieler / Kopfballstürmer', attrs: ['heading', 'strength', 'jumping', 'shooting', 'balance', 'firstTouch'] },
  { id: 'sprinter', label: 'Schneller Stürmer', attrs: ['speed', 'acceleration', 'shooting', 'dribbling', 'agility', 'shotPower'] },
  { id: 'kuenstler', label: 'Ballkünstler / Allrounder', attrs: ['technique', 'dribbling', 'vision', 'flair', 'shooting', 'passing'] },
  { id: 'reflex', label: 'Torwart (Reflexe)', attrs: ['reflexes', 'handling', 'oneOnOnes', 'agility', 'concentration', 'communication'] },
  { id: 'mitspielend', label: 'Torwart (mitspielend)', attrs: ['reflexes', 'kicking', 'oneOnOnes', 'passing', 'aerialReach', 'composure'] },
];

/** Verdeckte Werte, jeweils 0–100 (Verletzung: hoch = anfälliger; Tempo = Lerngeschwindigkeit). */
export interface LegendHidden {
  /** Konstanz: wie gleichmäßig er von Spiel zu Spiel spielt. */
  consistency: number;
  /** Nervenstärke in großen Spielen. */
  nerves: number;
  /** Verletzungsanfälligkeit (hoch = anfällig). */
  injury: number;
  /** Entwicklungstempo (Lerngeschwindigkeit). */
  tempo: number;
  /** Professionalität / Trainingsfleiß. */
  professionalism: number;
  ambition: number;
  adaptability: number;
}

/** Persönlichkeit (engine/persona.ts), 0–100; Ehrgeiz kommt aus `hidden.ambition`. */
export interface LegendPersona {
  loyalitaet: number;
  geld: number;
  heimat: number;
  abenteuer: number;
  rampenlicht: number;
  familie: number;
}

export interface LegendDef {
  /** Eindeutige Kennung (Kleinbuchstaben, Ziffern, _ und -). */
  id: string;
  firstName: string;
  lastName: string;
  /** Geburtsdatum JJJJ-MM-TT. */
  birth: string;
  /** Land (Nationalitätskürzel, z. B. GER, BRA; „DDR“ = bis 1990 in der DDR). */
  country: string;
  /** Gesichtstyp (optional, sonst nach Land). */
  face?: string;
  pos: Position;
  /** Weitere Positionen. */
  pos2?: Position[];
  foot: 'right' | 'left' | 'both';
  type: LegendType;
  /** Höchstpotenzial (Stärke-Skala, 80–99). */
  potential: number;
  /** Körpergröße in cm (optional). */
  height?: number;
  /** Jugendverein (Vereins-ID des Datensatzes). Leer = zufällig im Land, gewichtet nach Jugendarbeit. */
  club?: string;
  /** Frühreife −1 (Spätentwickler) … +1 (früh fertig). */
  maturity: number;
  /** Langlebigkeit −1 (früher Abbau) … +1 (spielt lange auf hohem Niveau). */
  longevity: number;
  hidden: LegendHidden;
  persona?: LegendPersona;
}

/** Kompakte Schreibweise für die eingebaute Liste. */
export function L(
  id: string, firstName: string, lastName: string, birth: string, country: string,
  pos: Position, pos2: Position[], foot: 'R' | 'L' | 'B', type: LegendType, potential: number, height: number,
  curve: [number, number], h: [number, number, number, number, number, number, number],
  pe: [number, number, number, number, number, number], face?: string,
): LegendDef {
  const d: LegendDef = {
    id, firstName, lastName, birth, country, pos, foot: foot === 'L' ? 'left' : foot === 'B' ? 'both' : 'right', type, potential, height,
    maturity: curve[0], longevity: curve[1],
    hidden: { consistency: h[0], nerves: h[1], injury: h[2], tempo: h[3], professionalism: h[4], ambition: h[5], adaptability: h[6] },
    persona: { loyalitaet: pe[0], geld: pe[1], heimat: pe[2], abenteuer: pe[3], rampenlicht: pe[4], familie: pe[5] },
  };
  if (pos2.length) d.pos2 = pos2;
  if (face) d.face = face;
  return d;
}

/** Gesichtstyp nach Land (Vorgabe, wenn `face` fehlt). */
export const COUNTRY_FACE: Record<string, string> = {
  GER: 'mitteleuropa', DDR: 'mitteleuropa', NED: 'mitteleuropa', FRA: 'mitteleuropa', ENG: 'mitteleuropa', SCO: 'mitteleuropa',
  BEL: 'mitteleuropa', ITA: 'suedeuropa', ESP: 'suedeuropa', POR: 'suedeuropa', BRA: 'lateinamerika', ARG: 'lateinamerika',
  URU: 'lateinamerika', DEN: 'nordeuropa', SWE: 'nordeuropa', NOR: 'nordeuropa', POL: 'osteuropa', UKR: 'osteuropa',
  CZE: 'osteuropa', BUL: 'balkan', CRO: 'balkan', LBR: 'westafrika', CMR: 'westafrika', CIV: 'westafrika', EGY: 'nordafrika',
};

/** Länder für die Auswahl im Editor (Kürzel → Anzeigename). */
export const LEGEND_COUNTRIES: Record<string, string> = {
  GER: 'Deutschland', DDR: 'DDR (bis 1990)', NED: 'Niederlande', FRA: 'Frankreich', ITA: 'Italien', ESP: 'Spanien', ENG: 'England',
  SCO: 'Schottland', POR: 'Portugal', BEL: 'Belgien', DEN: 'Dänemark', SWE: 'Schweden', NOR: 'Norwegen', POL: 'Polen',
  UKR: 'Ukraine', CZE: 'Tschechien', BUL: 'Bulgarien', CRO: 'Kroatien', BRA: 'Brasilien', ARG: 'Argentinien', URU: 'Uruguay',
  LBR: 'Liberia', CMR: 'Kamerun', CIV: 'Elfenbeinküste', EGY: 'Ägypten', AUT: 'Österreich', SUI: 'Schweiz', HUN: 'Ungarn',
  YUG: 'Jugoslawien', TUR: 'Türkei', GRE: 'Griechenland', RUS: 'Russland', USA: 'USA', JPN: 'Japan', KOR: 'Südkorea',
  GHA: 'Ghana', NGA: 'Nigeria', MAR: 'Marokko',
};

/** Länder mit simulierten deutschen Vereinen (Spawn bei einem Verein des Landes). */
export const DOMESTIC = new Set(['GER', 'DDR']);
