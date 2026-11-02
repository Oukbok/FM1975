// =============================================================================
// KABINE — Vorfälle mit Entscheidung (Postfach, Typ `kabine_*`)
// -----------------------------------------------------------------------------
// Selten: höchstens ein Vorfall alle drei Wochen, Würfel am 5. und 20. eines
// Monats (≈ 12 % je Wurf, mehr bei schlechter Stimmung/vielen Außenseitern),
// dazu Auslöser: Kabinenpredigt nach einer hohen Niederlage, Grüppchenbildung
// nach einer Niederlagenserie. Ohne Antwort gilt nach sieben Tagen die
// vorsichtige Standardwahl (game/eventsGame.ts).
// Epochenfarbe: Forderungen und Streitanlässe ändern sich mit der Zeit
// (1974 drohten die Nationalspieler in Malente wegen der WM-Prämie mit
// Abreise, Einigung bei 70.000 DM – Quelle: sport1.de, „An diesem Ort erlebten
// Hoeneß & Co. die absurdesten Geschichten“, 07/2024).
// =============================================================================
import { DRAnalysis } from '../engine/dressingRoom';
import { CalendarEngine } from '../engine/calendar';
import { economyScale, yearOf } from '../engine/economy';
import { makeMessage, pushMessage } from '../engine/messages';
import { personaOf } from '../engine/persona';
import { MessageChoice, MessageEventRef, Player } from '../types';
import { CHOICE_HANDLERS } from './eventsGame';
import { addBoost, addBoostJolt, logRoom, roomAnalysis, roomInputs, roomOf, setFlag, squadOf, teamEvent, eventState } from './dressingRoomGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const days = (a: string, b: string) => (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000;

interface Spawn {
  type: string; subject: string; shortText: string; bodyText: string; from: string;
  playerId?: string; choices: MessageChoice[]; defaultChoice: string; data?: Record<string, string | number>;
}

function post(g: Game, today: string, s: Spawn): void {
  const msg = makeMessage({ date: today, category: 'general', from: s.from, subject: s.subject, shortText: s.shortText, bodyText: s.bodyText, actionRequired: true, relatedId: s.playerId });
  msg.choices = s.choices;
  msg.eventRef = { type: s.type, playerId: s.playerId, deadline: CalendarEngine.addDays(today, 7), defaultChoice: s.defaultChoice, data: s.data };
  pushMessage(g.messages, msg);
  const dr = roomOf(g.clubs[g.managedClubId]);
  dr.lastIncident = today;
  logRoom(dr, today, s.subject);
}

// -----------------------------------------------------------------------------
// Vorfälle erzeugen
// -----------------------------------------------------------------------------
function spawnStreit(g: Game, today: string, a: DRAnalysis, sq: Player[], rng: () => number): Spawn | null {
  const year = yearOf(today);
  const lead = new Set(a.leaders);
  const inf = (p: Player) => a.byId[p.id]?.influence ?? 0;
  const { xs, ctx } = roomInputs(g, g.clubs[g.managedClubId]);
  const share = new Map(xs.map((x) => [x.p.id, x]));
  let pa: Player | undefined, pb: Player | undefined, reason = '';
  const frustrated = sq.filter((p) => !lead.has(p.id) && !p.injury && !ctx.offSeason && (share.get(p.id)?.share ?? 1) < 0.4 && ((share.get(p.id)?.rank ?? 99) <= 11 || personaOf(p).ehrgeiz >= 62));
  const leaders = sq.filter((p) => lead.has(p.id));
  if (frustrated.length && leaders.length && rng() < 0.6) {
    pb = frustrated[Math.floor(rng() * frustrated.length)];
    pa = leaders[Math.floor(rng() * leaders.length)];
    reason = 'Einsatzzeiten';
  } else {
    const sour = sq.filter((p) => (a.byId[p.id]?.target ?? 60) < 52 || (p.attributes.aggression ?? 50) >= 66);
    for (let i = 0; i < 12 && !pb; i++) {
      const x = sour[Math.floor(rng() * sour.length)], y = sq[Math.floor(rng() * sq.length)];
      if (x && y && x.id !== y.id && a.byId[x.id]?.group !== a.byId[y.id]?.group) { pa = x; pb = y; }
    }
    reason = year < 1990 ? 'ein hartes Foul im Training' : year < 2010 ? 'eine Bemerkung in der Zeitung' : 'einen Beitrag in den sozialen Medien';
  }
  if (!pa || !pb) return null;
  if (inf(pb) > inf(pa)) [pa, pb] = [pb, pa];
  const dr = roomOf(g.clubs[g.managedClubId]);
  (dr.conflicts ??= []).push({ a: pa.id, b: pb.id, since: today, until: CalendarEngine.addDays(today, 90), reason });
  const about = reason === 'Einsatzzeiten' ? `${pb.lastName} wirft ${pa.lastName} vor, ihm den Platz zu blockieren und beim Trainer gut Wetter zu machen.` : `Auslöser war ${reason}.`;
  return {
    type: 'kabine_streit', from: 'Co-Trainer', playerId: pb.id,
    subject: `Streit in der Kabine: ${pa.lastName} gegen ${pb.lastName}`,
    shortText: 'Zwei Spieler sind aneinandergeraten – die Mannschaft schaut zu.',
    bodyText: `${pa.fullName} und ${pb.fullName} sind in der Kabine laut geworden. ${about}\n\nSolange der Streit schwelt, leiden beide in der Moral, und der Zusammenhalt sinkt. Wie reagierst du?`,
    choices: [
      { id: 'schlichten', label: 'Gespräch zu dritt', hint: 'kann den Streit beenden – oder scheitern' },
      { id: 'fuehrung', label: `${pa.lastName} den Rücken stärken`, hint: `${pb.lastName} fühlt sich zurückgesetzt` },
      { id: 'strafe', label: 'Beide bestrafen', hint: 'Geldstrafe, Ruhe – aber beide sind sauer' },
      { id: 'laufen', label: 'Laufen lassen', hint: 'der Streit schwelt weiter' },
    ],
    defaultChoice: 'laufen', data: { a: pa.id, b: pb.id },
  };
}

function demandFor(year: number): { text: string; cost: number } {
  if (year < 1985) return { text: 'eine höhere Siegprämie für die Mannschaft', cost: 12000 };
  if (year < 1995) return { text: 'einen zweiten Masseur für die Mannschaft', cost: 8000 };
  if (year < 2005) return { text: 'einen Familienbereich mit Kinderbetreuung bei Heimspielen', cost: 10000 };
  if (year < 2015) return { text: 'mehr freie Tage nach Siegen', cost: 0 };
  return { text: 'mehr Freiheiten in den sozialen Medien', cost: 0 };
}

function spawnForderung(g: Game, today: string, a: DRAnalysis): Spawn | null {
  const L = g.players[a.leaders[0]];
  if (!L) return null;
  const d = demandFor(yearOf(today));
  const price = d.cost ? ` (etwa ${Math.round(d.cost * economyScale(yearOf(today))).toLocaleString('de-DE')} ${yearOf(today) >= 2002 ? '€' : 'DM'})` : '';
  return {
    type: 'kabine_forderung', from: L.fullName, playerId: L.id,
    subject: `${L.lastName} spricht für die Mannschaft`,
    shortText: `Die Mannschaft wünscht sich ${d.text}.`,
    bodyText: `${L.fullName} kommt im Namen der Mannschaft zu dir: „Wir wünschen uns ${d.text}${price}. Das würde uns allen guttun.“\n\nAls Führungsspieler hat sein Wort Gewicht – lehnst du ab, bekommt es die ganze Kabine mit.`,
    choices: [
      { id: 'erfuellen', label: 'Zusagen', hint: d.cost ? 'kostet Geld, stärkt Stimmung und Führungsspieler' : 'stärkt Stimmung und Führungsspieler' },
      { id: 'kompromiss', label: 'Kompromiss anbieten', hint: 'die Hälfte – wird meist angenommen' },
      { id: 'ablehnen', label: 'Ablehnen', hint: 'kostet nichts, verärgert ihn' },
    ],
    defaultChoice: 'kompromiss', data: { cost: d.cost },
  };
}

function spawnIntegration(g: Game, today: string, a: DRAnalysis, sq: Player[], rng: () => number): Spawn | null {
  const dr = roomOf(g.clubs[g.managedClubId]);
  const { xs } = roomInputs(g, g.clubs[g.managedClubId]);
  const cands = xs.filter((x) => x.years < 0.6 && (x.barrier >= 0.4 || (x.p.development.adaptability ?? 50) < 40) && !dr.flags?.includes(`int:${x.p.id}`));
  if (!cands.length) return null;
  const n = cands[Math.floor(rng() * cands.length)];
  setFlag(dr, `int:${n.p.id}`);
  const lang = a.byId[n.p.id]?.language;
  const mentor = sq.filter((p) => p.id !== n.p.id && (a.byId[p.id]?.influence ?? 0) >= 40)
    .sort((x, y) => (a.byId[y.id]?.language === lang ? 30 : 0) + (a.byId[y.id]?.influence ?? 0) - (a.byId[x.id]?.language === lang ? 30 : 0) - (a.byId[x.id]?.influence ?? 0))[0];
  const choices: MessageChoice[] = [];
  if (mentor) choices.push({ id: 'pate', label: `${mentor.lastName} als Paten bestimmen`, hint: a.byId[mentor.id]?.language === lang ? 'spricht seine Sprache' : 'erfahrener Führungsspieler' });
  if (n.barrier >= 0.3) choices.push({ id: 'sprachkurs', label: 'Sprachkurs bezahlen', hint: 'kostet etwas, baut die Sprachbarriere schneller ab' });
  choices.push({ id: 'zeit', label: 'Ihm Zeit geben', hint: 'kostet nichts – vielleicht fängt er sich' });
  return {
    type: 'kabine_integration', from: 'Co-Trainer', playerId: n.p.id,
    subject: `${n.p.lastName} findet keinen Anschluss`,
    shortText: 'Der Neuzugang sitzt beim Essen meist allein.',
    bodyText: `${n.p.fullName} (${n.p.age}) ist seit einigen Wochen bei uns, findet aber keinen Anschluss.${n.barrier >= 0.4 ? ' Die Sprache ist ein großes Hindernis.' : ''} Er sitzt beim Essen meist allein, im Training wirkt er gehemmt.`,
    choices, defaultChoice: 'zeit', data: { m: mentor?.id ?? '' },
  };
}

function spawnAbend(g: Game, today: string): Spawn | null {
  const st = eventState(g);
  const dr = roomOf(g.clubs[g.managedClubId]);
  if (st.nextOn || (dr.events ?? []).some((d) => days(d, today) < 90)) return null;
  const y = yearOf(today);
  const what = y < 1990 ? 'einen gemeinsamen Kegelabend' : y < 2005 ? 'einen Grillabend' : 'einen Mannschaftsabend';
  return {
    type: 'kabine_abend', from: 'Mannschaftsrat',
    subject: `Mannschaftsrat wünscht sich ${what}`,
    shortText: 'Die Mannschaft möchte mal wieder etwas zusammen unternehmen.',
    bodyText: `Der Mannschaftsrat fragt, ob der Verein ${what} ausrichtet. „Einfach mal zusammensitzen, ohne Taktiktafel.“ Die Kosten wären überschaubar.`,
    choices: [{ id: 'ja', label: 'Gern – der Verein zahlt', hint: 'Stimmung und Zusammenhalt steigen' }, { id: 'nein', label: 'Jetzt nicht', hint: 'leichte Enttäuschung' }],
    defaultChoice: 'ja',
  };
}

function spawnGruppen(g: Game, today: string): Spawn {
  const dr = roomOf(g.clubs[g.managedClubId]);
  addBoost(dr, '#c', -8, 'Grüppchenbildung nach Niederlagen', today, 30);
  setFlag(dr, `gr:${today}`);
  return {
    type: 'kabine_gruppen', from: 'Co-Trainer',
    subject: 'Nach der Niederlagenserie bilden sich Grüppchen',
    shortText: 'Schuldzuweisungen zwischen Alten und Jungen, Stammkräften und Bank.',
    bodyText: 'Nach den letzten Niederlagen zerfällt die Mannschaft in Grüppchen. Die Routiniers schimpfen über die Jungen, die Bank über die Stammelf. Wie gehst du vor?',
    choices: [
      { id: 'sitzung', label: 'Krisensitzung einberufen', hint: 'wirkt, wenn die Führungsspieler mitziehen' },
      { id: 'harte_hand', label: 'Extraschichten ansetzen', hint: 'Form hoch, Stimmung runter – riskant' },
      { id: 'fuehrung', label: 'Kapitän und Mannschaftsrat regeln das', hint: 'hängt am Kapitän' },
    ],
    defaultChoice: 'fuehrung',
  };
}

function spawnPredigt(g: Game, score: string): Spawn {
  return {
    type: 'kabine_predigt', from: 'Co-Trainer',
    subject: `Nach dem ${score}: Was sagst du der Mannschaft?`,
    shortText: 'Die Spieler sitzen mit hängenden Köpfen in der Kabine.',
    bodyText: `Das ${score} war ein Tiefpunkt. Die Spieler warten auf deine Reaktion.`,
    choices: [
      { id: 'laut', label: 'Kabinenpredigt', hint: 'kann aufrütteln – oder verunsichern' },
      { id: 'sachlich', label: 'Sachliche Analyse am Montag', hint: 'sicher, kleine Wirkung' },
      { id: 'aufbauen', label: 'Aufbauende Worte', hint: 'hilft, wenn die Stimmung schon am Boden ist' },
    ],
    defaultChoice: 'sachlich',
  };
}

/** Täglich nach dem Kabinenlauf (eigener Verein). */
export function dressingRoomIncidents(g: Game, today: string, a: DRAnalysis, rng: () => number = Math.random): void {
  const club = g.clubs[g.managedClubId];
  const dr = roomOf(club);
  const sq = squadOf(g, club);
  if (dr.lastIncident && days(dr.lastIncident, today) < 14) return;
  // Auslöser 1: hohe Niederlage heute.
  const mine = g.fixtures.filter((m) => m.result && m.date === today && (m.homeClubId === club.id || m.awayClubId === club.id));
  for (const m of mine) {
    const home = m.homeClubId === club.id;
    const gf = home ? m.result!.homeGoals : m.result!.awayGoals, ga = home ? m.result!.awayGoals : m.result!.homeGoals;
    if (ga - gf >= 3 && rng() < 0.7) { post(g, today, spawnPredigt(g, `${gf}:${ga}`)); return; }
  }
  // Auslöser 2: Niederlagenserie (letzte vier ohne Sieg, mindestens drei Niederlagen).
  const form = g.table.rows.find((r) => r.clubId === club.id)?.form ?? [];
  const last4 = form.slice(-4);
  const lastGr = (dr.flags ?? []).filter((f) => f.startsWith('gr:')).map((f) => f.slice(3)).sort().pop();
  if (mine.length && last4.length === 4 && !last4.includes('W') && last4.filter((r) => r === 'L').length >= 3 && (!lastGr || days(lastGr, today) > 60) && rng() < 0.6) {
    post(g, today, spawnGruppen(g, today)); return;
  }
  if (dr.lastIncident && days(dr.lastIncident, today) < 21) return;
  const dom = today.slice(8);
  if (dom !== '05' && dom !== '20') return;
  const p = 0.12 + (dr.mood < 45 ? 0.1 : 0) + (a.outsiders.length >= 2 ? 0.05 : 0);
  if (rng() >= p) return;
  const opts: [number, () => Spawn | null][] = [
    [3, () => spawnStreit(g, today, a, sq, rng)],
    [2, () => spawnForderung(g, today, a)],
    [3, () => spawnIntegration(g, today, a, sq, rng)],
    [dr.mood >= 40 ? 2 : 0.5, () => spawnAbend(g, today)],
  ];
  let total = opts.reduce((s, o) => s + o[0], 0);
  while (total > 0 && opts.length) {
    let r = rng() * total, i = 0;
    for (; i < opts.length - 1 && r >= opts[i][0]; i++) r -= opts[i][0];
    const s = opts[i][1]();
    if (s) { post(g, today, s); return; }
    total -= opts[i][0];
    opts.splice(i, 1);
  }
}

// -----------------------------------------------------------------------------
// Entscheidungen
// -----------------------------------------------------------------------------
type Eff = { text: string; money?: { amount: number; text: string } };
const ctx = (g: Game) => ({ today: g.calendar.currentDate, club: g.clubs[g.managedClubId], dr: roomOf(g.clubs[g.managedClubId]), scale: economyScale(yearOf(g.calendar.currentDate)) });
const here = (g: Game, id: unknown): Player | undefined => { const p = g.players[String(id ?? '')]; return p && p.clubId === g.managedClubId ? p : undefined; };

CHOICE_HANDLERS['kabine_streit'] = (g: Game, ref: MessageEventRef, choice: string): Eff => {
  const { today, dr, scale } = ctx(g);
  const a = here(g, ref.data?.a), b = here(g, ref.data?.b);
  const conflict = (dr.conflicts ?? []).find((c) => c.a === ref.data?.a && c.b === ref.data?.b);
  const end = () => { dr.conflicts = (dr.conflicts ?? []).filter((c) => c !== conflict); };
  if (!a || !b) { end(); return { text: 'Einer der beiden ist nicht mehr im Verein – der Streit hat sich erledigt.' }; }
  if (choice === 'schlichten') {
    const loy = (personaOf(a).loyalitaet + personaOf(b).loyalitaet) / 2;
    if (Math.random() < 0.5 + (dr.council?.length ? 0.1 : 0) + (loy - 50) / 200) {
      end(); addBoostJolt(g, dr, a.id, 3, 'Streit beigelegt', today); addBoostJolt(g, dr, b.id, 3, 'Streit beigelegt', today);
      return { text: `${a.lastName} und ${b.lastName} geben sich die Hand.` };
    }
    addBoostJolt(g, dr, a.id, -2, 'Schlichtung gescheitert', today); addBoostJolt(g, dr, b.id, -2, 'Schlichtung gescheitert', today);
    return { text: 'Das Gespräch endet im Schweigen – der Streit schwelt weiter.' };
  }
  if (choice === 'fuehrung') {
    addBoostJolt(g, dr, a.id, 4, 'Rückendeckung vom Trainer', today); addBoostJolt(g, dr, b.id, -8, 'Trainer stellt sich gegen ihn', today, 45);
    if (conflict) conflict.until = CalendarEngine.addDays(today, 45);
    return { text: `${a.lastName} fühlt sich bestätigt, ${b.lastName} zieht sich zurück.` };
  }
  if (choice === 'strafe') {
    end(); addBoostJolt(g, dr, a.id, -5, 'Geldstrafe nach Streit', today); addBoostJolt(g, dr, b.id, -5, 'Geldstrafe nach Streit', today);
    for (const p of [a, b]) p.development.professionalism = clamp((p.development.professionalism ?? 50) + 2, 0, 100);
    return { text: 'Beide zahlen. In der Kabine ist es ruhig – vorerst.', money: { amount: Math.round(2000 * scale), text: `Geldstrafen ${a.lastName}/${b.lastName}` } };
  }
  return { text: 'Du hältst dich raus. Der Streit schwelt weiter.' };
};

CHOICE_HANDLERS['kabine_forderung'] = (g: Game, ref: MessageEventRef, choice: string): Eff => {
  const { today, dr, scale } = ctx(g);
  const L = here(g, ref.playerId);
  const cost = Math.round(Number(ref.data?.cost ?? 0) * scale);
  if (!L) return { text: 'Der Wortführer ist nicht mehr im Verein.' };
  if (choice === 'erfuellen') {
    addBoostJolt(g, dr, L.id, 8, 'Forderung erfüllt', today, 45); addBoost(dr, '*', 4, 'Wunsch der Mannschaft erfüllt', today, 40);
    return { text: `${L.lastName} bedankt sich im Namen der Mannschaft.`, money: cost ? { amount: -cost, text: 'Wunsch der Mannschaft' } : undefined };
  }
  if (choice === 'kompromiss') {
    if (Math.random() < 0.6) {
      addBoostJolt(g, dr, L.id, 3, 'Kompromiss angenommen', today); addBoost(dr, '*', 1, 'Kompromiss mit der Mannschaft', today);
      return { text: 'Die Mannschaft akzeptiert den Kompromiss.', money: cost ? { amount: -Math.round(cost / 2), text: 'Kompromiss mit der Mannschaft' } : undefined };
    }
    addBoostJolt(g, dr, L.id, -2, 'Kompromiss zu dürftig', today);
    return { text: `${L.lastName} hatte mehr erwartet.`, money: cost ? { amount: -Math.round(cost / 2), text: 'Kompromiss mit der Mannschaft' } : undefined };
  }
  addBoostJolt(g, dr, L.id, -8, 'Forderung abgelehnt', today, 45);
  const big = (roomAnalysis(g).byId[L.id]?.influence ?? 0) >= 70;
  if (big) addBoost(dr, '*', -4, `${L.lastName} abgeblitzt`, today, 30);
  return { text: big ? `${L.lastName} ist verärgert – und die Kabine steht hinter ihm.` : `${L.lastName} nimmt es hin.` };
};

CHOICE_HANDLERS['kabine_integration'] = (g: Game, ref: MessageEventRef, choice: string): Eff => {
  const { today, dr, scale } = ctx(g);
  const n = here(g, ref.playerId);
  if (!n) return { text: 'Er ist nicht mehr im Verein.' };
  if (choice === 'pate') {
    const m = here(g, ref.data?.m);
    if (!m) return { text: 'Der Pate ist nicht mehr im Verein.' };
    setFlag(dr, `pate:${n.id}`);
    addBoostJolt(g, dr, n.id, 8, `Pate: ${m.lastName}`, today, 45); addBoostJolt(g, dr, m.id, 2, 'Verantwortung als Pate', today);
    return { text: `${m.lastName} nimmt ${n.lastName} unter seine Fittiche.` };
  }
  if (choice === 'sprachkurs') {
    setFlag(dr, `kurs:${n.id}`); addBoostJolt(g, dr, n.id, 4, 'Sprachkurs', today, 45);
    return { text: `${n.lastName} lernt jetzt zweimal die Woche Deutsch.`, money: { amount: -Math.round(2000 * scale), text: `Sprachkurs ${n.lastName}` } };
  }
  if (Math.random() < 0.5) { addBoostJolt(g, dr, n.id, -4, 'Fühlt sich allein gelassen', today); return { text: `${n.lastName} zieht sich weiter zurück.` }; }
  return { text: `${n.lastName} findet langsam selbst seinen Weg.` };
};

CHOICE_HANDLERS['kabine_abend'] = (g: Game, _ref: MessageEventRef, choice: string): Eff => {
  const { today, dr } = ctx(g);
  if (choice === 'ja') return { text: teamEvent(g, 'abend').text };
  addBoost(dr, '*', -3, 'Wunsch nach Teamabend abgelehnt', today, 25);
  return { text: 'Die Mannschaft ist etwas enttäuscht.' };
};

CHOICE_HANDLERS['kabine_gruppen'] = (g: Game, _ref: MessageEventRef, choice: string): Eff => {
  const { today, dr, club } = ctx(g);
  const a = roomAnalysis(g);
  const sq = squadOf(g, club);
  if (choice === 'sitzung') {
    const ls = a.leaders.map((id) => g.players[id]).filter(Boolean);
    const lm = ls.length ? ls.reduce((s, p) => s + (p.moraleScore ?? 60), 0) / ls.length : 60;
    const v = clamp(6 + (lm - 50) / 10, 2, 10);
    addBoost(dr, '*', v, 'Krisensitzung', today, 30); addBoost(dr, '#c', v / 2, 'Krisensitzung', today, 30);
    return { text: v >= 6 ? 'Die Führungsspieler ziehen mit – die Reihen schließen sich.' : 'Die Sitzung bringt wenig, die Führungsspieler sind selbst angeschlagen.' };
  }
  if (choice === 'harte_hand') {
    for (const p of sq) p.form = clamp((p.form ?? 50) + 3, 0, 100);
    const prof = sq.reduce((s, p) => s + (p.development.professionalism ?? 50), 0) / Math.max(1, sq.length);
    addBoost(dr, '*', -4, 'Extraschichten', today, 25); addBoost(dr, '#c', prof >= 55 ? 5 : -3, 'Extraschichten', today, 30);
    return { text: prof >= 55 ? 'Die Profis ziehen durch – gemeinsames Leiden schweißt zusammen.' : 'Murren über die Extraschichten, die Gräben bleiben.' };
  }
  const cap = dr.captainId ? g.players[dr.captainId] : undefined;
  const c = cap ? a.byId[cap.id] : undefined;
  if (cap && c && c.influence >= 65 && (cap.moraleScore ?? 60) >= 55) {
    addBoost(dr, '*', 8, `${cap.lastName} regelt das`, today, 30); addBoost(dr, '#c', 4, `${cap.lastName} regelt das`, today, 30);
    return { text: `${cap.lastName} trommelt die Mannschaft zusammen – das hilft.` };
  }
  addBoost(dr, '*', -2, 'Führung fehlt', today, 25);
  return { text: 'Der Kapitän hat nicht genug Rückhalt – die Grüppchen bleiben.' };
};

CHOICE_HANDLERS['kabine_predigt'] = (g: Game, _ref: MessageEventRef, choice: string): Eff => {
  const { today, dr, club } = ctx(g);
  const y = yearOf(today);
  const sq = squadOf(g, club);
  if (choice === 'laut') {
    const prof = sq.reduce((s, p) => s + (p.development.professionalism ?? 50), 0) / Math.max(1, sq.length);
    const chance = 0.5 + (y < 1990 ? 0.15 : y >= 2005 ? -0.1 : 0) + (dr.mood >= 40 ? 0.1 : -0.15) + (prof - 50) / 100;
    if (Math.random() < chance) {
      addBoost(dr, '*', 5, 'Kabinenpredigt', today, 25);
      for (const p of sq.filter((x) => (x.development.recentMinutes ?? 0) > 300)) p.form = clamp((p.form ?? 50) + 2, 0, 100);
      return { text: 'Die Predigt sitzt – die Spieler wollen es wiedergutmachen.' };
    }
    addBoost(dr, '*', -5, 'Kabinenpredigt verfehlt', today, 25);
    const top = roomAnalysis(g).leaders[0];
    if (top) addBoostJolt(g, dr, top, -4, 'Fühlt sich vor allen bloßgestellt', today);
    return { text: y >= 2005 ? 'Der laute Ton kommt bei dieser Generation nicht an.' : 'Die Predigt verunsichert mehr, als sie aufrüttelt.' };
  }
  if (choice === 'aufbauen') { addBoost(dr, '*', dr.mood < 45 ? 4 : 0.5, 'Aufbauende Worte', today, 20); return { text: dr.mood < 45 ? 'Die Mannschaft ist dankbar für Rückhalt.' : 'Freundlich, aber ohne große Wirkung.' }; }
  addBoost(dr, '*', 2, 'Sachliche Analyse', today, 20);
  return { text: 'Die Analyse ist nüchtern – die Spieler wissen, woran sie arbeiten müssen.' };
};
