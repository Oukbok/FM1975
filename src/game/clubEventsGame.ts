// =============================================================================
// VEREINSEREIGNISSE (Katalog aus dem Konzept, Abschnitt 6)
// -----------------------------------------------------------------------------
// Selten und an Epoche/Lage gebunden. Jedes Ereignis hat eine Sperrzeit von
// drei Jahren. Die Häufigkeit folgt der Einstellung „Ereignisse“ (wenige /
// normal / viele). Gewürfelt wird mit einem Zufall aus Datum und Verein, damit
// Neuladen kein Ereignis wegwürfelt.
//
//   Mäzen (bis 1998)          Derby-Krawalle                 (Investoren: Vorstandsseite)
//   Fanprotest (ab 2000)      Pressekampagne (ab 1984)       Flutlichtschaden
//   Grippewelle (Winter)      Talent im Probetraining        Konjunktur
//   WM-Euphorie (WM-Sommer, für alle Vereine)
// =============================================================================
import { CalendarEngine } from '../engine/calendar';
import { lastRevenue } from '../engine/clubEconomy';
import { book } from '../engine/finances';
import { makeMessage, pushMessage } from '../engine/messages';
import { eventFrequency } from '../engine/randomEvents';
import { generateYouthPlayer } from '../engine/youth';
import { setAttendanceEuphoria } from '../data/history';
import { Club, InboxMessage, MessageChoice, Player } from '../types';
import { fmtFullDM } from '../ui/format';
import { ensureEnvironment } from './environmentGame';
import { CHOICE_HANDLERS } from './eventsGame';
import { Game } from './state';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = h >>> 0;
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

interface Ctx { g: Game; club: Club; today: string; year: number; month: number; rev: number; r: () => number; squad: Player[] }

interface ClubEvent {
  type: string;
  weight: (c: Ctx) => number; // 0 = nicht möglich
  spawn: (c: Ctx) => { subject: string; shortText: string; bodyText: string; from: string; category: InboxMessage['category']; choices?: MessageChoice[]; defaultChoice?: string; data?: Record<string, number | string>; apply?: () => void };
  resolve?: (g: Game, club: Club, choice: string, data: Record<string, number | string>) => { text: string; money?: number; moneyText?: string };
}

function lostStreak(g: Game, clubId: string): number {
  const ms = g.fixtures.filter((m) => m.result && (m.homeClubId === clubId || m.awayClubId === clubId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  let n = 0;
  for (const m of ms) {
    const mine = m.homeClubId === clubId ? m.result!.homeGoals : m.result!.awayGoals;
    const other = m.homeClubId === clubId ? m.result!.awayGoals : m.result!.homeGoals;
    if (mine < other) n++; else break;
  }
  return n;
}

const EVENTS: ClubEvent[] = [
  {
    type: 'maezen',
    weight: (c) => (c.year <= 1998 ? ((c.club.finances.balance < 0 ? 3 : 1)) : 0),
    spawn: (c) => {
      const amount = Math.round(c.rev * (0.06 + c.r() * 0.06));
      return {
        from: 'Präsident', category: 'board', subject: 'Ein Mäzen bietet Geld an',
        shortText: `${fmtFullDM(amount)} – aber er will mitreden.`,
        bodyText: `Ein wohlhabender Unternehmer aus der Region bietet dem Verein ${fmtFullDM(amount)} an. Im Gegenzug erwartet er Mitsprache bei Personalfragen. Der Vorstand ist gespalten.`,
        choices: [{ id: 'annehmen', label: 'Annehmen', hint: 'Geld jetzt, Einfluss später' }, { id: 'ablehnen', label: 'Ablehnen' }],
        defaultChoice: 'ablehnen', data: { amount },
      };
    },
    resolve: (_g, club, choice, d) => {
      if (choice === 'annehmen') {
        club.boardConfidence = clamp((club.boardConfidence ?? 60) - 6, 0, 100);
        return { text: 'Das Geld ist da. Der Mäzen sitzt ab jetzt bei jeder Vorstandssitzung mit am Tisch.', money: Number(d.amount), moneyText: 'Zuwendung eines Mäzens' };
      }
      club.boardConfidence = clamp((club.boardConfidence ?? 60) + 2, 0, 100);
      return { text: 'Der Vorstand schätzt deine Unabhängigkeit.' };
    },
  },
  {
    type: 'krawall',
    weight: (c) => (c.year >= 1980 && c.year <= 1999 ? 3 : 1) * (ensureEnvironment(c.g).rivals.length ? 1 : 0),
    spawn: (c) => {
      const env = ensureEnvironment(c.g);
      const rival = c.g.clubs[env.rivals[0]]?.name ?? 'den Rivalen';
      const cost = Math.round(c.rev * 0.006);
      return {
        from: 'Polizei', category: 'general', subject: `Warnung vor dem Derby gegen ${rival}`,
        shortText: 'Die Polizei rechnet mit Ausschreitungen.',
        bodyText: `Vor dem nächsten Spiel gegen ${rival} rechnet die Polizei mit Krawallen. Zusätzliche Ordner und Absperrungen kosten ${fmtFullDM(cost)}.`,
        choices: [{ id: 'sicherheit', label: 'Sicherheit verstärken', hint: fmtFullDM(cost) }, { id: 'nichts', label: 'Wird schon gutgehen' }],
        defaultChoice: 'sicherheit', data: { cost },
      };
    },
    resolve: (g, club, choice, d) => {
      if (choice === 'sicherheit') return { text: 'Das Spiel bleibt friedlich.', money: -Number(d.cost), moneyText: 'Zusätzliche Ordner (Derby)' };
      if (Math.random() < 0.5) {
        const env = ensureEnvironment(g);
        env.fanMood = clamp(env.fanMood - 4, 0, 100);
        club.boardConfidence = clamp((club.boardConfidence ?? 60) - 3, 0, 100);
        return { text: 'Es kommt zu Ausschreitungen. Der Verband verhängt eine Geldstrafe, Familien bleiben fern.', money: -Number(d.cost) * 3, moneyText: 'Verbandsstrafe (Ausschreitungen)' };
      }
      return { text: 'Glück gehabt – es bleibt ruhig.' };
    },
  },
  {
    type: 'fanprotest',
    weight: (c) => {
      if (c.year < 2000) return 0;
      const env = ensureEnvironment(c.g);
      return env.fanMood < 45 ? 3 : env.fanMood < 60 ? 1 : 0;
    },
    spawn: () => ({
      from: 'Fanbeauftragter', category: 'general', subject: 'Fans kündigen Protest an',
      shortText: 'Ticketpreise, Kommerz, Ergebnisse – die Kurve ist sauer.',
      bodyText: 'Die Fanclubs kündigen einen Stimmungsboykott an. Sie fordern ein Gespräch und günstigere Tickets.',
      choices: [
        { id: 'gespraech', label: 'Zum Gespräch einladen' },
        { id: 'preise', label: 'Ticketpreise um 10 % senken' },
        { id: 'aussitzen', label: 'Aussitzen' },
      ],
      defaultChoice: 'gespraech',
    }),
    resolve: (g, club, choice) => {
      const env = ensureEnvironment(g);
      if (choice === 'preise') { club.stadium.ticketPrice = Math.round(club.stadium.ticketPrice * 0.9 * 100) / 100; env.fanMood = clamp(env.fanMood + 8, 0, 100); return { text: 'Die Kurve nimmt das Angebot an. Die Einnahmen pro Spiel sinken etwas.' }; }
      if (choice === 'gespraech') { env.fanMood = clamp(env.fanMood + 4, 0, 100); return { text: 'Das Gespräch beruhigt die Lage – vorerst.' }; }
      env.fanMood = clamp(env.fanMood - 6, 0, 100);
      return { text: 'Die ersten 12 Minuten herrscht Schweigen im Stadion. Die Stimmung bleibt gereizt.' };
    },
  },
  {
    type: 'presse',
    weight: (c) => (c.year >= 1984 && lostStreak(c.g, c.club.id) >= 3 ? 3 : 0),
    spawn: () => ({
      from: 'Pressestelle', category: 'media', subject: 'Boulevard startet Kampagne gegen den Trainer',
      shortText: 'Nach der Niederlagenserie wird es laut.',
      bodyText: 'Nach mehreren Niederlagen in Folge fordert die Boulevardpresse personelle Konsequenzen. Ein großes Interview könnte die Stimmung drehen – oder alles schlimmer machen.',
      choices: [{ id: 'interview', label: 'Interview geben', hint: 'riskant' }, { id: 'schweigen', label: 'Schweigen' }],
      defaultChoice: 'schweigen',
    }),
    resolve: (g, club, choice) => {
      const env = ensureEnvironment(g);
      if (choice === 'interview') {
        if (Math.random() < 0.55) { club.boardConfidence = clamp((club.boardConfidence ?? 60) + 4, 0, 100); env.mediaPressure = clamp(env.mediaPressure - 8, 0, 100); return { text: 'Das Interview kommt gut an. Die Schlagzeilen werden freundlicher.' }; }
        club.boardConfidence = clamp((club.boardConfidence ?? 60) - 4, 0, 100); env.mediaPressure = clamp(env.mediaPressure + 6, 0, 100);
        return { text: 'Ein Satz wird aus dem Zusammenhang gerissen. Die Kampagne geht weiter.' };
      }
      env.mediaPressure = clamp(env.mediaPressure + 2, 0, 100);
      club.boardConfidence = clamp((club.boardConfidence ?? 60) - 1, 0, 100);
      return { text: 'Die Kampagne verläuft sich langsam.' };
    },
  },
  {
    type: 'flutlicht',
    weight: (c) => ((c.club.stadium.condition ?? 70) < 60 ? 3 : 1),
    spawn: (c) => {
      const cost = Math.round(c.rev * 0.01);
      return {
        from: 'Platzwart', category: 'general', subject: 'Flutlichtmast ausgefallen',
        shortText: 'Ohne Reparatur gibt es keine Abendspiele.',
        bodyText: `Ein Flutlichtmast ist ausgefallen. Die sofortige Reparatur kostet ${fmtFullDM(cost)}. Verschieben ist billiger, aber das nächste Abendspiel müsste verlegt werden.`,
        choices: [{ id: 'sofort', label: 'Sofort reparieren', hint: fmtFullDM(cost) }, { id: 'spaeter', label: 'Verschieben', hint: 'halbe Kosten, Ärger' }],
        defaultChoice: 'sofort', data: { cost },
      };
    },
    resolve: (g, _club, choice, d) => {
      if (choice === 'sofort') return { text: 'Repariert – das Licht brennt wieder.', money: -Number(d.cost), moneyText: 'Reparatur Flutlicht' };
      const env = ensureEnvironment(g);
      env.fanMood = clamp(env.fanMood - 3, 0, 100);
      return { text: 'Das Abendspiel wird auf Samstagnachmittag verlegt. Die Fans murren.', money: -Math.round(Number(d.cost) / 2), moneyText: 'Notreparatur Flutlicht' };
    },
  },
  {
    type: 'grippe',
    weight: (c) => ([11, 12, 1, 2].includes(c.month) ? 2 : 0),
    spawn: (c) => {
      const pool = c.squad.filter((p) => !p.injury);
      const n = Math.min(pool.length, 2 + Math.floor(c.r() * 3));
      const ill: Player[] = [];
      for (let i = 0; i < n; i++) ill.push(pool.splice(Math.floor(c.r() * pool.length), 1)[0]);
      return {
        from: 'Mannschaftsarzt', category: 'injury', subject: `Grippewelle: ${ill.length} Spieler krank`,
        shortText: ill.map((p) => p.lastName).join(', '),
        bodyText: `Eine Grippewelle geht durch die Kabine. ${ill.map((p) => p.fullName).join(', ')} fallen für einige Tage aus.`,
        apply: () => {
          for (const p of ill) {
            const days = 4 + Math.floor(c.r() * 6);
            p.injury = { id: `ill_${p.id}_${c.today}`, type: 'illness', severity: 'minor', description: 'Grippe', startDate: c.today,
              expectedReturnDate: CalendarEngine.addDays(c.today, days), daysRemaining: days, totalDays: days, fromTraining: true };
            p.availability = 'injured';
          }
        },
      };
    },
  },
  {
    type: 'probetraining',
    weight: () => 2,
    spawn: (c) => {
      const yp = generateYouthPlayer(c.club.id, `probe_${c.today}`, c.today, Math.max(1, c.club.infrastructure.youthAcademy), 16);
      c.g.youthPlayers[yp.id] = yp; // vorläufig, wird bei Absage entfernt
      return {
        from: 'Jugendkoordinator', category: 'training', subject: `Probetraining: ${yp.fullName} (${yp.naturalPosition}, 16)`,
        shortText: 'Ein Junge aus der Region hat im Probetraining überzeugt.',
        bodyText: `${yp.fullName} hat beim Probetraining einen guten Eindruck hinterlassen. Wie viel in ihm steckt, kann noch niemand sagen. Ein Ausbildungsvertrag kostet kaum etwas.`,
        choices: [{ id: 'vertrag', label: 'Ausbildungsvertrag anbieten' }, { id: 'absage', label: 'Absagen' }],
        defaultChoice: 'vertrag', data: { youthId: yp.id },
      };
    },
    resolve: (g, club, choice, d) => {
      const id = String(d.youthId);
      const yp = g.youthPlayers[id];
      if (!yp) return { text: 'Der Junge hat sich anders entschieden.' };
      if (choice === 'vertrag') {
        yp.clubId = club.id;
        if (!club.youthPlayerIds.includes(id)) club.youthPlayerIds.push(id);
        return { text: `${yp.fullName} gehört jetzt zur Jugendakademie.` };
      }
      delete g.youthPlayers[id];
      return { text: 'Abgesagt.' };
    },
  },
  {
    type: 'konjunktur',
    weight: (c) => (c.month === 9 ? 2 : 0),
    spawn: (c) => {
      const up = c.r() < 0.5;
      const amount = Math.round(c.rev * 0.03) * (up ? 1 : -1);
      return {
        from: 'Geschäftsstelle', category: 'board', subject: up ? 'Konjunktur zieht an' : 'Konjunkturflaute',
        shortText: up ? 'Sponsoren und Logen buchen mehr.' : 'Sponsoren halten sich zurück.',
        bodyText: up ? `Die Wirtschaft brummt. Sponsoren stocken auf, Logen sind ausgebucht: ${fmtFullDM(amount)} zusätzlich.` : `Die Wirtschaft schwächelt. Sponsoren kürzen, Logen bleiben leer: ${fmtFullDM(-amount)} weniger.`,
        apply: () => book(c.club.finances, c.today, amount, 'other', up ? 'Konjunktur: Zusatzerlöse' : 'Konjunktur: Mindereinnahmen', true),
      };
    },
  },
];

const BASE_CHANCE: Record<string, number> = { wenige: 0.015, normal: 0.03, viele: 0.06 };

/** Monatlich (1. des Monats): höchstens ein Vereinsereignis. */
export function monthlyClubEvents(g: Game, today: string): void {
  if ((g as any).simAutoManage) return;
  const club = g.clubs[g.managedClubId];
  if (!club) return;
  const r = seeded(`${g.managedClubId}|club|${today}`);
  maybeWorldCupEuphoria(g, today);
  if (r() >= (BASE_CHANCE[eventFrequency()] ?? 0.03)) return;
  const year = Number(today.slice(0, 4));
  const ctx: Ctx = { g, club, today, year, month: Number(today.slice(5, 7)), rev: lastRevenue(club, year), r, squad: club.playerIds.map((id) => g.players[id]).filter(Boolean) };
  const cd = (g.eventCooldowns ??= {});
  const opts = EVENTS.map((e) => ({ e, w: (cd[e.type] ?? '') > today ? 0 : e.weight(ctx) })).filter((x) => x.w > 0);
  const total = opts.reduce((s, x) => s + x.w, 0);
  if (!total) return;
  let roll = r() * total;
  const pickE = opts.find((x) => (roll -= x.w) <= 0)?.e ?? opts[0].e;
  const ev = pickE.spawn(ctx);
  cd[pickE.type] = CalendarEngine.addDays(today, 3 * 365);
  const msg = makeMessage({ date: today, category: ev.category, from: ev.from, subject: ev.subject, shortText: ev.shortText, bodyText: ev.bodyText, actionRequired: !!ev.choices });
  if (ev.choices) {
    msg.choices = ev.choices;
    msg.eventRef = { type: `club:${pickE.type}`, deadline: CalendarEngine.addDays(today, 7), defaultChoice: ev.defaultChoice, data: ev.data };
  }
  ev.apply?.();
  pushMessage(g.messages, msg);
}

for (const e of EVENTS) {
  if (!e.resolve) continue;
  CHOICE_HANDLERS[`club:${e.type}`] = (g, ref, choice) => {
    const club = g.clubs[g.managedClubId];
    const res = e.resolve!(g, club, choice, ref.data ?? {});
    return { text: res.text, money: res.money ? { amount: res.money, text: res.moneyText ?? 'Vereinsereignis' } : undefined };
  };
}

// -----------------------------------------------------------------------------
// WM-Euphorie: In WM-Sommern (1978, 1982, …) mit 50 % ein Lauf der
// Nationalelf – eine Saison lang 5–10 % mehr Zuschauer bei allen Vereinen.
// -----------------------------------------------------------------------------
function maybeWorldCupEuphoria(g: Game, today: string): void {
  const year = Number(today.slice(0, 4));
  if (today.slice(5) !== '08-01' || (year - 1974) % 4 !== 0) return;
  const r = seeded(`wm|${year}|${g.managedClubId}`);
  if (r() >= 0.5) return;
  const factor = 1.05 + Math.round(r() * 5) / 100;
  g.euphoria = { from: today, to: `${year + 1}-06-30`, factor };
  applyEuphoria(g);
  pushMessage(g.messages, makeMessage({
    date: today, category: 'media', from: 'Sportpresse', subject: 'WM-Euphorie im ganzen Land',
    shortText: `Nach dem starken Turnier der Nationalelf rechnen alle Vereine mit ${Math.round((factor - 1) * 100)} % mehr Zuschauern.`,
    bodyText: `Die Nationalmannschaft hat bei der Weltmeisterschaft begeistert. Die Stadien werden in dieser Saison voller sein – überall im Land, bis zur Kapazitätsgrenze.`,
  }));
}

export function applyEuphoria(g: Game): void {
  setAttendanceEuphoria(g.euphoria ?? null);
}

