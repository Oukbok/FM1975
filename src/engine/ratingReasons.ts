// =============================================================================
// Begründungen der Auf-/Abwertungen: aus dem Entwicklungs-Protokoll
// (engine/devLog.ts) die tatsächlichen Hauptursachen, nach Gewicht sortiert.
// Nur Ursachen, die in die Rechnung eingegangen sind – keine erfundenen Gründe.
// Schlüssel: alter, abbau, langlebig, training, anlagen, trainer, praxis,
// charakter, umfeld, moral, potenzial, epoche, reife, reifegrad, weltklasse,
// abbau_bremse, abbau_spitze, spezial:<fach>, fokus:<schwerpunkt>, plan,
// foerder, individuell, lager, lager_disziplin, halle, mentor, fleiss, juwel,
// durchbruch, spaetzuender, knick; dazu start (Übertrag) und Hinweise note_*.
// =============================================================================
import type { Player } from '../types';
import type { DevLog, RatingReason } from './devLog';
import { FOCUS_LABEL, type TrainingFocus } from './staffPeople';

const SPEC: Record<string, string> = {
  torwart: 'Torwarttrainer', technik: 'Techniktrainer', taktik: 'Taktiktrainer', athletik: 'Athletiktrainer',
  mental: 'Mentaltrainer', allround: 'Spezialtrainer', jugend: 'Jugendtrainer',
};

const num = (n: number) => Math.round(n).toLocaleString('de-DE');

/** Text einer Ursache je nach Richtung des Beitrags. */
export function reasonText(k: string, v: number, p: Pick<Player, 'age'>, log?: DevLog, year?: number): string {
  const up = v > 0;
  const [key, sub] = k.split(':');
  switch (key) {
    case 'alter':
      return p.age <= 20 ? `Alter ${p.age}: Entwicklungsjahre` : p.age <= 24 ? `Alter ${p.age}: noch im Aufbau` : `Alter ${p.age}: kaum noch Steigerung`;
    case 'abbau': return `Alter ${p.age}: natürlicher Abbau`;
    case 'langlebig': return up ? 'robuster Körper: der Abbau setzt später ein' : 'der Körper baut früher ab als bei anderen';
    case 'training': return up ? 'gute Trainingsbedingungen' : 'schwache Trainingsbedingungen';
    case 'anlagen': return up ? 'gute Trainingsanlagen' : 'einfache Trainingsanlagen';
    case 'trainer': return up ? 'starkes Trainerteam' : 'Trainerteam zu klein oder zu schwach für den Kader';
    case 'praxis': {
      const min = log ? num(log.min) : '';
      const res = log && log.res >= 45 ? `, dazu ${num(log.res)} min in der zweiten Mannschaft` : '';
      const inj = log && log.inj >= 14 ? `, ${Math.round(log.inj / 7)} Wochen verletzt` : '';
      if (up) return log ? `viele Einsatzminuten (${min} min${res})` : 'viel Spielpraxis';
      return log ? `kaum Spielpraxis (${min} min${res}${inj})` : 'kaum Spielpraxis';
    }
    case 'charakter': return up ? 'professionelle Einstellung und Ehrgeiz' : 'mangelnde Professionalität';
    case 'umfeld': return up ? 'ruhiges, erfolgreiches Umfeld' : 'Unruhe im Verein';
    case 'moral': return up ? 'gute Moral' : 'schlechte Moral';
    case 'potenzial': return 'nahe an seinem Leistungsvermögen: die letzten Punkte sind die schwersten';
    case 'epoche': return up ? 'moderne Sportwissenschaft' : `Trainingslehre ${year ?? ''}: Sportwissenschaft noch in den Anfängen`.replace('  ', ' ');
    case 'reife':
      if (p.age <= 22) return up ? 'Frühentwickler: wächst in jungen Jahren schnell' : 'Spätentwickler: der Schub kommt erst später';
      return up ? 'Spätentwickler: holt jetzt auf' : 'früh gereift: viel ist schon erreicht';
    case 'reifegrad': return 'für sein Alter schon weit: wächst vorerst langsamer';
    case 'weltklasse': return 'Weltklasse-Niveau: jeder weitere Punkt ist schwer';
    case 'abbau_bremse': return up ? 'gutes Training und Professionalität bremsen den Abbau' : 'schwaches Training beschleunigt den Abbau';
    case 'abbau_spitze': return up ? 'wenig Konkurrenz an der Spitze: hält sich länger' : 'großer Konkurrenzdruck an der Spitze';
    case 'spezial': return up ? `${SPEC[sub] ?? 'Spezialtrainer'} im Trainerteam` : 'Spezialtrainer';
    case 'fokus': return `Trainingsschwerpunkt ${FOCUS_LABEL[sub as TrainingFocus] ?? sub}`;
    case 'plan': return up ? 'Trainingsplan mit vielen Entwicklungseinheiten' : 'Trainingsplan mit wenig Entwicklungsinhalten';
    case 'foerder': return up ? 'Förderspieler: das Trainerteam kümmert sich besonders' : 'kein Förderspieler: die Förderung anderer bindet Trainer';
    case 'individuell': return up ? 'individuelle Betreuung' : 'wenig individuelle Betreuung';
    case 'lager': return 'Trainingslager';
    case 'lager_disziplin': return 'Disziplinprobleme im Trainingslager';
    case 'halle': return 'Spielpraxis beim Hallenturnier';
    case 'mentor': return 'Extraschichten mit einem Routinier';
    case 'fleiss': return 'Trainingsfleiß: Extraschichten';
    case 'juwel': return 'der Knoten ist geplatzt';
    case 'durchbruch': return 'Durchbruch: die Spielpraxis zahlt sich aus';
    case 'spaetzuender': return 'Spätzünder: neuer Ehrgeiz';
    case 'knick': return 'Leistungsknick nach schwerer Verletzung oder Überlastung';
    case 'start':
      return log?.partial ? 'Entwicklung vor Beginn der Aufzeichnung (ohne Einzelnachweis)'
        : up ? 'Übertrag aus der letzten Bewertung' : 'offener Abbau aus der letzten Bewertung';
    default: return k;
  }
}

export interface PayoutInfo {
  change: number;
  /** Verfügbare Punkte vor der Auszahlung (start + Σ parts). */
  pts: number;
  /** Rest nach der Auszahlung. */
  rest: number;
  /** Begrenzung, die gegriffen hat. */
  capped?: 'max' | 'pot' | null;
  cap: number;
  /** Die Unschärfe der Bewertung hat den Ausschlag gegeben. */
  close?: boolean;
  /** Durchbruch, Juwel … (nur Anzeige). */
  tag?: string;
}

/**
 * Hauptursachen einer Bewertung. Ohne (vollständiges) Protokoll eine
 * allgemeine Begründung (generic = true).
 */
export function explainRating(p: Player, log: DevLog | undefined, info: PayoutInfo, year: number): { reasons: RatingReason[]; generic: boolean } {
  const notes: RatingReason[] = [];
  if (info.capped === 'pot') notes.push({ k: 'note_pot', v: 0, text: 'an der Grenze seines Potenzials angekommen' });
  if (info.capped === 'max') notes.push({ k: 'note_max', v: 0, text: `mehr als ${info.cap} Punkte auf einmal gibt es in dieser Runde nicht` });
  if (info.close) notes.push({ k: 'note_close', v: 0, text: 'knappe Entscheidung des Trainerteams' });
  if (info.rest >= 0.8 && info.change >= 0) notes.push({ k: 'note_rest', v: 0, text: 'weitere Fortschritte zeichnen sich ab' });
  if (info.rest <= -0.8 && info.change <= 0) notes.push({ k: 'note_rest', v: 0, text: 'der Abbau setzt sich fort' });

  if (!log || (log.partial && Math.abs(log.start) > Math.abs(info.pts - log.start))) {
    const reasons: RatingReason[] = [];
    if (p.age >= 29 && info.change < 0) reasons.push({ k: 'abbau', v: -1, text: reasonText('abbau', -1, p) });
    else if (p.age <= 24 && info.change > 0) reasons.push({ k: 'alter', v: 1, text: reasonText('alter', 1, p) });
    reasons.push({ k: 'generic', v: 0, text: 'Entwicklung aus Alter, Training und Spielpraxis seit der letzten Bewertung (noch ohne Einzelnachweis)' });
    return { reasons: [...reasons, ...notes], generic: true };
  }
  const all: RatingReason[] = Object.entries(log.parts)
    .filter(([, v]) => Math.abs(v) >= 0.05)
    .map(([k, v]) => ({ k, v, text: reasonText(k, v, p, log, year) }));
  if (Math.abs(log.start) >= 0.3) all.push({ k: 'start', v: log.start, text: reasonText('start', log.start, p, log) });
  all.sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  // Die gewichtigsten Ursachen; in Richtung des Ergebnisses zuerst.
  const dir = Math.sign(info.change);
  const top = all.slice(0, 5);
  const same = top.filter((r) => dir === 0 || Math.sign(r.v) === dir).slice(0, 4);
  const other = top.filter((r) => dir !== 0 && Math.sign(r.v) !== dir).slice(0, 2);
  return { reasons: [...same, ...other, ...notes], generic: false };
}
