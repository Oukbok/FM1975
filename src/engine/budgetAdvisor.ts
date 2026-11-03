// =============================================================================
// SAISONBUDGET — Texte des Finanzberaters (rein, ohne Spielstand)
// -----------------------------------------------------------------------------
// Einordnung des Jahres (data/budgetEras.ts, mit Quellen), Lage des Vereins mit
// Zahlen aus der Prognose, Risiken und je Budgetposten eine Empfehlung.
// Formulierungen werden je Saison/Verein deterministisch gewählt.
// =============================================================================
import { eraLines } from '../data/budgetEras';
import { formatMoney } from './economy';

export interface AdvisorCtx {
  year: number;
  seed: string;
  tier: number;
  revenue: number;
  /** Anteile der Einnahmebereiche (0–1). */
  shares: { tv: number; sponsor: number; tickets: number; merch: number; members: number; prizes: number };
  balanceBase: number;
  reserveMin: number;
  reservePlanned: number;
  personnelFixed: number;
  operations: number;
  youthRunning: number;
  loansAnnual: number;
  /** Budgets laut aktueller Wahl (nominal). */
  b: { wages: number; transfers: number; infra: number; youth: number };
  /** Vorschlag des Beraters (nominal). */
  advice: { wages: number; transfers: number; infra: number; youth: number };
  /** Typische Ablöse eines Stammspielers in unserer Liga und Spitzenablöse in Deutschland (nominal). */
  typicalFee: number;
  recordFee: number;
  /** Saisonziel des Vorstands, Abstiegsgefahr, Europapokal. */
  goal: string;
  relegation: boolean;
  euro: boolean;
  banned: boolean;
  /** TV-Topf der nächstniedrigeren Liga relativ zur eigenen (für das Abstiegsrisiko), 0 = keine. */
  tvDropShare: number;
  lastWageRatio?: number;
}

export interface AdvisorText { era: string; lines: string[]; tips: Record<'wages' | 'transfers' | 'infra' | 'youth' | 'reserve', string> }

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = <T,>(a: T[], seed: string): T => a[hash(seed) % a.length];
const pct = (v: number) => `${Math.round(v * 100)} %`;

const AREA_NAME: Record<keyof AdvisorCtx['shares'], string> = {
  tv: 'das Fernsehgeld', sponsor: 'Sponsoren und Vermarktung', tickets: 'der Spieltag', merch: 'die Fanartikel', members: 'die Mitgliedsbeiträge', prizes: 'die Prämien',
};

export function advisorText(c: AdvisorCtx): AdvisorText {
  const f = (v: number) => formatMoney(Math.round(v), c.year);
  const s = (k: string) => `${c.seed}:${k}`;
  const era = pick(eraLines(c.year), s('era'));
  const lines: string[] = [];

  // 1) Einnahmen dieses Jahres.
  const top = (Object.entries(c.shares) as [keyof AdvisorCtx['shares'], number][]).sort((a, b) => b[1] - a[1]);
  lines.push(pick([
    `Für diese Saison rechne ich mit ${f(c.revenue)} Einnahmen; der größte Posten ist ${AREA_NAME[top[0][0]]} mit ${pct(top[0][1])}, danach ${AREA_NAME[top[1][0]]} mit ${pct(top[1][1])}.`,
    `Ich plane mit ${f(c.revenue)} Umsatz. Am meisten bringt ${AREA_NAME[top[0][0]]} (${pct(top[0][1])}), gefolgt von ${AREA_NAME[top[1][0]]} (${pct(top[1][1])}).`,
  ], s('rev')));

  // 2) Was ist realistisch: Personal.
  const ratio = c.personnelFixed / Math.max(1, c.revenue);
  lines.push(ratio > 0.7
    ? `Der jetzige Kader samt Stab kostet schon ${f(c.personnelFixed)} – ${pct(ratio)} des Umsatzes. Der Vorstand will höchstens rund 60 %; neue Verträge müssen wir uns gut überlegen.`
    : ratio > 0.55
      ? `Personal kostet uns mit dem jetzigen Kader ${f(c.personnelFixed)}, das sind ${pct(ratio)} des Umsatzes – am oberen Rand dessen, was der Vorstand mit rund 60 % für gesund hält.`
      : pick([
        `Kader, Trainer und Stab kosten derzeit ${f(c.personnelFixed)} oder ${pct(ratio)} des Umsatzes. Bis rund 60 % gilt im Vorstand als vertretbar – da ist noch Luft.`,
        `Mit ${f(c.personnelFixed)} für das Personal (${pct(ratio)} des Umsatzes) liegen wir unter der 60-Prozent-Marke des Vorstands.`,
      ], s('wage')));

  // 3) Transfermarkt der Epoche.
  if (c.banned) lines.push('Wegen der Lizenzauflagen dürfen wir in dieser Saison keine Ablösen zahlen.');
  else if (c.typicalFee > 0) {
    lines.push(pick([
      `Ein Stammspieler unseres Niveaus kostet derzeit etwa ${f(c.typicalFee)} Ablöse; die Spitze in Deutschland liegt bei rund ${f(c.recordFee)}.`,
      `Zur Einordnung: Für einen Stammspieler unserer Klasse zahlt man gerade um ${f(c.typicalFee)}, der teuerste Wechsel des Landes kostet etwa ${f(c.recordFee)}.`,
    ], s('fee')));
  }

  // 4) Risiken.
  const risks: string[] = [];
  if (c.relegation && c.tvDropShare > 0) risks.push(`ein Abstieg kostet nicht nur Zuschauer – in der Liga darunter gibt es nur etwa ${pct(c.tvDropShare)} des Fernsehgeldes`);
  if (c.loansAnnual > 0) risks.push(`Kreditraten von ${f(c.loansAnnual)} im Jahr sind fest verplant`);
  if (c.balanceBase < 0) risks.push(`wir starten mit ${f(c.balanceBase)} im Minus, Überziehungszinsen fressen jeden Spielraum`);
  if (risks.length) lines.push(`Risiken: ${risks.join('; ')}.`);
  if (c.euro) lines.push('Europapokal-Prämien über das Startgeld hinaus habe ich bewusst nicht eingeplant – jede Runde ist Zusatzgeld.');

  // 5) Reserve und Empfehlung.
  lines.push(c.reservePlanned >= c.reserveMin
    ? pick([
      `Mit meinem Vorschlag bleiben am Saisonende etwa ${f(c.reservePlanned)} auf dem Konto; der Vorstand verlangt mindestens ${f(c.reserveMin)}.`,
      `Der Vorstand will eine Reserve von ${f(c.reserveMin)} sehen – so, wie es jetzt steht, kommen wir auf ${f(c.reservePlanned)}.`,
    ], s('res'))
    : `Achtung: Geplant sind am Saisonende nur ${f(c.reservePlanned)}, der Vorstand verlangt ${f(c.reserveMin)}. Das wird er dir ankreiden.`);

  // Empfehlungen je Posten.
  const wageRoom = c.b.wages - c.personnelFixed;
  const tips = {
    wages: wageRoom < 0
      ? `Das Budget liegt ${f(-wageRoom)} unter den laufenden Personalkosten – neue Verträge und Gehaltserhöhungen gibt der Vorstand nicht frei.`
      : `Nach den laufenden Verträgen bleiben ${f(wageRoom)} im Jahr für Neuzugänge und Verlängerungen. Mein Vorschlag: ${f(c.advice.wages)}.`,
    transfers: c.banned ? 'Transfersperre durch die Lizenzauflagen.'
      : c.typicalFee > 0
        ? `Das reicht für etwa ${Math.max(0, Math.floor(c.b.transfers / c.typicalFee))} Stammspieler-Ablöse(n). Verkäufe füllen das Budget wieder auf. Vorschlag: ${f(c.advice.transfers)}.`
        : `Vorschlag: ${f(c.advice.transfers)}.`,
    infra: c.b.infra > 0
      ? `Rahmen für Stadion, Gelände und Einrichtungen (bar bezahlt). Kreditfinanzierte Bauten belasten das Budget nicht, aber die Raten die nächsten Jahre. Vorschlag: ${f(c.advice.infra)}.`
      : 'Kein Geld für Bauvorhaben – Ausbauten werden gesperrt, Kredite bleiben möglich.',
    youth: c.b.youth < c.youthRunning
      ? `Die Akademie kostet schon ${f(c.youthRunning)} im Jahr – das Budget reicht nicht einmal dafür. Fahre unter Jugend › Akademie etwas zurück.`
      : `Laufende Kosten der Akademie ${f(c.youthRunning)}; für Ausbauten bleiben ${f(c.b.youth - c.youthRunning)}. Nachwuchs wirkt erst nach Jahren.`,
    reserve: `Bleibt am Saisonende auf dem Konto. Mindestens ${f(c.reserveMin)} (Vorgabe des Vorstands), dazu laufende Betriebskosten von ${f(c.operations)}, die ich fest eingeplant habe.`,
  };
  return { era, lines, tips };
}
