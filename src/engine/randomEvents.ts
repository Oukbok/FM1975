// =============================================================================
// ZUFALLSEREIGNISSE — selten, meist für einzelne Spieler, oft mit Entscheidung
// -----------------------------------------------------------------------------
// Grundsätze (Pascals Vorgaben):
//   • Der Zufall schlägt selten zu (etwa drei Ereignisse pro Saison), den ganzen
//     Verein trifft er fast nie.
//   • Kein künstlicher Ausgleich: Ereignisse werden unabhängig gewürfelt – auf
//     etwas Gutes folgt nicht automatisch etwas Schlechtes und umgekehrt.
//   • Ereignisse passen zur Epoche (Kneipe 1978, Berater 1998, Social Media 2018).
//   • Unbeantwortete Entscheidungen werden nach einer Woche mit der vorsichtigen
//     Standardwahl aufgelöst, damit das Spiel nie hängen bleibt.
// =============================================================================
import { Club, InboxMessage, MessageChoice, MessageEventRef, Player } from '../types';

export type EventChoice = MessageChoice;
export type EventRef = MessageEventRef;

export interface EventContext {
  date: string;
  year: number;
  club: Club;
  players: Record<string, Player>;
  rng: () => number;
  scale: number;
}

export interface EventSpawn {
  type: string;
  playerId?: string;
  subject: string;
  shortText: string;
  bodyText: string;
  from: string;
  category: InboxMessage['category'];
  choices?: EventChoice[];
  defaultChoice?: string;
  data?: Record<string, number | string>;
  /** Sofort-Wirkung ohne Entscheidung. */
  apply?: () => void;
}

export interface EventEffects {
  /** Geldbuchung (nominal, + Einnahme / − Ausgabe) mit Text. */
  money?: { amount: number; text: string };
  text: string;
}

const MORALE: Player['morale'][] = ['very_low', 'low', 'okay', 'good', 'excellent'];
export function shiftMorale(p: Player, steps: number): void {
  const i = Math.max(0, Math.min(4, MORALE.indexOf(p.morale) + steps));
  p.morale = MORALE[i];
}
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pick = <T,>(arr: T[], r: () => number): T | undefined => arr[Math.floor(r() * arr.length)];

// -----------------------------------------------------------------------------
// Katalog
// -----------------------------------------------------------------------------
interface EventDef {
  type: string;
  from: number; to: number;
  /** Relatives Gewicht (bei passenden Kandidaten). */
  weight: number;
  candidates: (ctx: EventContext, squad: Player[]) => Player[];
  spawn: (ctx: EventContext, p: Player) => EventSpawn;
  resolve?: (ctx: EventContext, p: Player | undefined, choice: string, ref: EventRef) => EventEffects;
}

const DEFS: EventDef[] = [
  {
    type: 'heimweh', from: 1975, to: 2100, weight: 3,
    candidates: (_c, s) => s.filter((p) => p.age <= 23 && p.nationality !== 'Deutschland'),
    spawn: (_c, p) => ({
      type: 'heimweh', playerId: p.id, from: 'Mannschaftsrat', category: 'contract',
      subject: `${p.fullName} hat Heimweh`,
      shortText: 'Er wirkt im Training abwesend.',
      bodyText: `${p.fullName} (${p.age}) vermisst seine Familie und wirkt im Training abwesend. Wie gehen wir damit um?`,
      choices: [
        { id: 'familie', label: 'Familie zu Besuch einladen', hint: 'kostet etwas, hilft meistens' },
        { id: 'gespraech', label: 'Persönliches Gespräch', hint: 'kostenlos, hilft manchmal' },
        { id: 'ignorieren', label: 'Da muss er durch' },
      ],
      defaultChoice: 'gespraech',
    }),
    resolve: (ctx, p, choice) => {
      if (!p) return { text: '' };
      if (choice === 'familie') { shiftMorale(p, 2); return { money: { amount: -Math.round(8000 * ctx.scale), text: `Familienbesuch ${p.fullName}` }, text: `Der Besuch tut ${p.fullName} sichtlich gut.` }; }
      if (choice === 'gespraech') {
        if (ctx.rng() < 0.6) { shiftMorale(p, 1); return { text: `Das Gespräch hilft – ${p.fullName} fängt sich.` }; }
        return { text: `${p.fullName} bedankt sich, wirkt aber weiter bedrückt.` };
      }
      shiftMorale(p, -1); p.contract.satisfaction = clamp(p.contract.satisfaction - 10, 0, 100);
      return { text: `${p.fullName} zieht sich zurück. Seine Zufriedenheit sinkt.` };
    },
  },
  {
    type: 'kneipe', from: 1975, to: 1994, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.age >= 26),
    spawn: (_c, p) => ({
      type: 'kneipe', playerId: p.id, from: p.fullName, category: 'contract',
      subject: `${p.fullName} will eine Kneipe eröffnen`,
      shortText: 'Ein zweites Standbein für die Zeit nach der Karriere.',
      bodyText: `${p.fullName} möchte gemeinsam mit seinem Schwager eine Gaststätte in der Stadt eröffnen – „für die Zeit nach dem Fußball“. Erlauben wir das?`,
      choices: [{ id: 'erlauben', label: 'Erlauben' }, { id: 'verbieten', label: 'Verbieten' }],
      defaultChoice: 'erlauben',
    }),
    resolve: (_ctx, p, choice) => {
      if (!p) return { text: '' };
      const d = p.development;
      if (choice === 'erlauben') { shiftMorale(p, 1); d.professionalism = clamp((d.professionalism ?? 50) - 6, 0, 100); return { text: `${p.fullName} ist glücklich. Ob die späten Abende im Lokal dem Training guttun, wird sich zeigen.` }; }
      shiftMorale(p, -1); return { text: `${p.fullName} akzeptiert die Entscheidung zähneknirschend.` };
    },
  },
  {
    type: 'nachtleben', from: 1975, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => (p.development.professionalism ?? 50) < 45 && p.age <= 30),
    spawn: (c, p) => ({
      type: 'nachtleben', playerId: p.id, from: c.year < 2010 ? 'Lokalpresse' : 'Online-Redaktion', category: 'media',
      subject: `${p.fullName} nachts in der Disco erwischt`,
      shortText: 'Zwei Tage vor dem Spiel – die Zeitung hat Fotos.',
      bodyText: `Zwei Tage vor dem Spiel wurde ${p.fullName} um drei Uhr nachts in einer Diskothek fotografiert${c.year >= 2010 ? ' – die Bilder kursieren schon im Netz' : ''}. Wie reagierst du?`,
      choices: [
        { id: 'strafe', label: 'Geldstrafe', hint: 'Disziplin, aber Ärger' },
        { id: 'tribuene', label: 'Ein Spiel auf die Tribüne' },
        { id: 'nichts', label: 'Keine Konsequenzen' },
      ],
      defaultChoice: 'strafe',
    }),
    resolve: (ctx, p, choice) => {
      if (!p) return { text: '' };
      const d = p.development;
      if (choice === 'strafe') { shiftMorale(p, -1); d.professionalism = clamp((d.professionalism ?? 50) + 4, 0, 100); return { money: { amount: Math.round(3000 * ctx.scale), text: `Geldstrafe ${p.fullName}` }, text: `${p.fullName} zahlt die Strafe und gelobt Besserung.` }; }
      if (choice === 'tribuene') { p.suspensionMatches = Math.max(p.suspensionMatches, 1); d.professionalism = clamp((d.professionalism ?? 50) + 6, 0, 100); shiftMorale(p, -1); return { text: `${p.fullName} sitzt beim nächsten Spiel auf der Tribüne.` }; }
      d.professionalism = clamp((d.professionalism ?? 50) - 3, 0, 100);
      ctx.club.boardConfidence = clamp((ctx.club.boardConfidence ?? 60) - 3, 0, 100);
      return { text: 'Die Mannschaft registriert, dass es keine Konsequenzen gibt. Der Vorstand ist nicht begeistert.' };
    },
  },
  {
    type: 'werbung', from: 1985, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.overall >= 76),
    spawn: (c, p) => ({
      type: 'werbung', playerId: p.id, from: 'Geschäftsstelle', category: 'contract',
      subject: `Werbeangebot für ${p.fullName}`,
      shortText: c.year < 2005 ? 'Ein Haarshampoo-Hersteller möchte ihn für einen Spot.' : 'Ein Sportartikel-Hersteller will eine Kampagne mit ihm.',
      bodyText: `Ein Unternehmen möchte ${p.fullName} für eine Werbekampagne. Drehtage kosten Trainingszeit, bringen ihm aber Geld und dem Verein Aufmerksamkeit.`,
      choices: [{ id: 'ja', label: 'Zustimmen' }, { id: 'nein', label: 'Ablehnen (Fokus auf Fußball)' }],
      defaultChoice: 'nein',
    }),
    resolve: (_ctx, p, choice) => {
      if (!p) return { text: '' };
      if (choice === 'ja') { shiftMorale(p, 1); p.form = clamp(p.form - 4, 0, 100); return { text: `${p.fullName} dreht den Spot. Die Fans sind begeistert, im Training fehlt er zwei Tage.` }; }
      p.contract.satisfaction = clamp(p.contract.satisfaction - 6, 0, 100); return { text: `${p.fullName} hätte gern zugesagt.` };
    },
  },
  {
    type: 'berater', from: 1995, to: 2100, weight: 3,
    candidates: (_c, s) => s.filter((p) => p.overall >= 74 && p.age <= 29),
    spawn: (c, p) => ({
      type: 'berater', playerId: p.id, from: `Berater von ${p.lastName}`, category: 'contract',
      subject: `Berater fordert mehr Geld für ${p.fullName}`,
      shortText: 'Sonst will er über einen Wechsel sprechen.',
      bodyText: `Der Berater von ${p.fullName} meldet sich: Andere Vereine seien interessiert. Er fordert eine Gehaltserhöhung um 20 %${c.year >= 2010 ? ' – und hat das Interesse schon in den Medien gestreut' : ''}.`,
      choices: [
        { id: 'erhoehen', label: 'Gehalt um 20 % erhöhen' },
        { id: 'ablehnen', label: 'Ablehnen' },
        { id: 'liste', label: 'Auf die Transferliste setzen' },
      ],
      defaultChoice: 'ablehnen',
    }),
    resolve: (_ctx, p, choice) => {
      if (!p) return { text: '' };
      if (choice === 'erhoehen') { p.contract.weeklyWage = Math.round(p.contract.weeklyWage * 1.2); p.contract.satisfaction = clamp(p.contract.satisfaction + 15, 0, 100); shiftMorale(p, 1); return { text: `${p.fullName} verdient jetzt mehr und ist zufrieden.` }; }
      if (choice === 'liste') { p.transferListed = true; shiftMorale(p, -1); return { text: `${p.fullName} steht auf der Transferliste.` }; }
      p.contract.satisfaction = clamp(p.contract.satisfaction - 15, 0, 100); shiftMorale(p, -1);
      return { text: `${p.fullName} ist enttäuscht. Bleibt die Unzufriedenheit, wird er wechseln wollen.` };
    },
  },
  {
    type: 'interview', from: 1990, to: 2100, weight: 2,
    candidates: (c, s) => s.filter((p) => (p.seasonStats?.minutesPlayed ?? 0) < 400 && p.overall >= 70 && c.year > 0),
    spawn: (c, p) => ({
      type: 'interview', playerId: p.id, from: c.year < 2012 ? 'Sportpresse' : 'Online-Redaktion', category: 'media',
      subject: `${p.fullName} kritisiert den Trainer`,
      shortText: '„Ich verstehe nicht, warum ich nicht spiele.“',
      bodyText: `${p.fullName} hat sich öffentlich über seine Reservistenrolle beschwert${c.year >= 2012 ? ' und das Interview in den sozialen Medien geteilt' : ''}. Wie reagierst du?`,
      choices: [
        { id: 'ruege', label: 'Öffentlich zurechtweisen' },
        { id: 'intern', label: 'Intern klären' },
        { id: 'chance', label: 'Ihm eine Chance versprechen' },
      ],
      defaultChoice: 'intern',
    }),
    resolve: (ctx, p, choice) => {
      if (!p) return { text: '' };
      if (choice === 'ruege') { shiftMorale(p, -2); p.contract.satisfaction = clamp(p.contract.satisfaction - 12, 0, 100); ctx.club.boardConfidence = clamp((ctx.club.boardConfidence ?? 60) + 2, 0, 100); return { text: 'Klare Kante. Der Vorstand trägt das mit, der Spieler ist verärgert.' }; }
      if (choice === 'chance') { shiftMorale(p, 1); p.contract.satisfaction = clamp(p.contract.satisfaction + 8, 0, 100); return { text: `${p.fullName} ist zufrieden – jetzt sollte er aber auch spielen.` }; }
      if (ctx.rng() < 0.6) return { text: 'Das Gespräch räumt die Sache aus.' };
      shiftMorale(p, -1); return { text: `${p.fullName} bleibt unzufrieden.` };
    },
  },
  {
    type: 'mentor', from: 1975, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.age >= 31 && (p.development.professionalism ?? 50) >= 65),
    spawn: (c, p) => {
      const squad = c.club.playerIds.map((id) => c.players[id]).filter((x) => x && x.age <= 21 && x.naturalPosition === p.naturalPosition);
      const young = pick(squad.length ? squad : c.club.playerIds.map((id) => c.players[id]).filter((x) => x && x.age <= 21), c.rng);
      return {
        type: 'mentor', playerId: p.id, from: 'Co-Trainer', category: 'training',
        subject: `${p.fullName} nimmt einen Jungen unter seine Fittiche`,
        shortText: young ? `${young.fullName} profitiert von Extraschichten.` : 'Der Routinier gibt sein Wissen weiter.',
        bodyText: young
          ? `${p.fullName} bleibt nach dem Training mit ${young.fullName} auf dem Platz und gibt ihm Tipps. Das tut dem Jungen sichtlich gut.`
          : `${p.fullName} kümmert sich um die jungen Spieler.`,
        apply: () => { if (young) { young.development.devPoints = (young.development.devPoints ?? 0) + 1.2; young.development.professionalism = clamp((young.development.professionalism ?? 50) + 4, 0, 100); } },
      };
    },
  },
  {
    type: 'trainingsweltmeister', from: 1975, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.age <= 24),
    spawn: (_c, p) => ({
      type: 'trainingsweltmeister', playerId: p.id, from: 'Co-Trainer', category: 'training',
      subject: `${p.fullName} zerreißt sich im Training`,
      shortText: 'Er ist der Erste auf dem Platz und der Letzte, der geht.',
      bodyText: `${p.fullName} ist derzeit kaum zu bremsen: Extraschichten, Krafttraining, Videostudium. Wenn das so weitergeht, macht er bald einen Sprung.`,
      apply: () => { p.development.devPoints = (p.development.devPoints ?? 0) + 1.5; },
    }),
  },
  {
    type: 'nachwuchs', from: 1975, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.age >= 24 && p.age <= 34),
    spawn: (_c, p) => ({
      type: 'nachwuchs', playerId: p.id, from: 'Mannschaftsrat', category: 'general',
      subject: `${p.fullName} wird Vater`,
      shortText: 'Glückwünsche aus der ganzen Mannschaft.',
      bodyText: `${p.fullName} ist Vater geworden. Die Mannschaft gratuliert – er wirkt beflügelt.`,
      apply: () => { shiftMorale(p, 1); },
    }),
  },
  {
    type: 'wunderheiler', from: 1975, to: 2004, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.injury && p.injury.daysRemaining >= 20),
    spawn: (_c, p) => ({
      type: 'wunderheiler', playerId: p.id, from: p.fullName, category: 'injury',
      subject: `${p.fullName} will zu einem Wunderheiler`,
      shortText: 'Ein Bekannter schwört auf einen Heilpraktiker im Ausland.',
      bodyText: `${p.fullName} möchte seine Verletzung bei einem umstrittenen Heilpraktiker behandeln lassen. Der Mannschaftsarzt ist skeptisch.`,
      choices: [{ id: 'ja', label: 'Erlauben' }, { id: 'nein', label: 'Beim Mannschaftsarzt bleiben' }],
      defaultChoice: 'nein',
    }),
    resolve: (ctx, p, choice) => {
      if (!p || !p.injury) return { text: 'Die Verletzung ist inzwischen ausgeheilt.' };
      if (choice === 'nein') return { text: `${p.fullName} bleibt in der Obhut des Mannschaftsarztes.` };
      const r = ctx.rng();
      if (r < 0.45) { p.injury.daysRemaining = Math.max(1, Math.round(p.injury.daysRemaining * 0.6)); shiftMorale(p, 1); return { text: `Erstaunlich: ${p.fullName} ist deutlich früher wieder fit.` }; }
      if (r < 0.7) { p.injury.daysRemaining += 14; p.injury.totalDays += 14; return { text: `Rückschlag: Die Behandlung hat geschadet, ${p.fullName} fällt zwei Wochen länger aus.` }; }
      return { text: 'Die Behandlung bringt nichts – aber auch keinen Schaden.' };
    },
  },
  {
    type: 'socialmedia', from: 2012, to: 2100, weight: 2,
    candidates: (_c, s) => s.filter((p) => p.age <= 27),
    spawn: (_c, p) => ({
      type: 'socialmedia', playerId: p.id, from: 'Medienabteilung', category: 'media',
      subject: `${p.fullName} löst Shitstorm aus`,
      shortText: 'Ein unbedachter Post sorgt für Empörung.',
      bodyText: `Ein unbedachter Post von ${p.fullName} sorgt für Empörung im Netz. Die Medienabteilung schlägt eine Entschuldigung vor.`,
      choices: [{ id: 'entschuldigung', label: 'Entschuldigung veröffentlichen' }, { id: 'aussitzen', label: 'Aussitzen' }],
      defaultChoice: 'entschuldigung',
    }),
    resolve: (ctx, p, choice) => {
      if (!p) return { text: '' };
      if (choice === 'entschuldigung') { shiftMorale(p, -1); return { text: 'Die Entschuldigung beruhigt die Lage.' }; }
      if (ctx.rng() < 0.5) return { text: 'Nach drei Tagen spricht niemand mehr darüber.' };
      ctx.club.boardConfidence = clamp((ctx.club.boardConfidence ?? 60) - 4, 0, 100);
      return { text: 'Die Sache eskaliert, Sponsoren fragen nach. Der Vorstand ist verärgert.' };
    },
  },
];

// Seltene Ereignisse für den ganzen Verein (etwa einmal in vier Spielzeiten).
const CLUB_DEFS: { type: string; from: number; to: number; spawn: (ctx: EventContext) => EventSpawn & { money?: { amount: number; text: string } } }[] = [
  {
    type: 'sturm', from: 1975, to: 2100,
    spawn: (c) => {
      const cost = Math.round((40000 + c.club.stadium.capacity * 2) * c.scale);
      return {
        type: 'sturm', from: 'Platzwart', category: 'general',
        subject: 'Sturmschaden am Stadiondach',
        shortText: 'Ein Orkan hat Teile der Tribünenüberdachung beschädigt.',
        bodyText: `Ein Orkan hat Teile des Tribünendachs abgedeckt. Die Reparatur ist unumgänglich.`,
        money: { amount: -cost, text: 'Reparatur Sturmschaden' },
      };
    },
  },
  {
    type: 'goenner', from: 1975, to: 2100,
    spawn: (c) => {
      const gift = Math.round((60000 + c.club.reputation * 1500) * c.scale);
      return {
        type: 'goenner', from: 'Vorstand', category: 'board',
        subject: 'Ein Gönner unterstützt den Verein',
        shortText: 'Ein langjähriges Mitglied vermacht dem Verein eine Spende.',
        bodyText: 'Ein langjähriges Vereinsmitglied unterstützt den Verein mit einer großzügigen Spende – ohne Bedingungen.',
        money: { amount: gift, text: 'Spende eines Gönners' },
      };
    },
  },
  {
    type: 'sponsorpleite', from: 1980, to: 2100,
    spawn: (c) => ({
      type: 'sponsorpleite', from: 'Geschäftsstelle', category: 'board',
      subject: 'Trikotsponsor meldet Insolvenz an',
      shortText: 'Der Vertrag endet sofort.',
      bodyText: 'Unser Trikotsponsor ist insolvent. Der Vertrag endet mit sofortiger Wirkung – zur neuen Saison gibt es wieder Angebote.',
      apply: () => { if (c.club.commerce) c.club.commerce.shirtSponsor = undefined; },
    }),
  },
];

// -----------------------------------------------------------------------------
// Würfeln (monatlich)
// -----------------------------------------------------------------------------
/** Chance auf ein Spieler-Ereignis je Monat und auf ein Vereins-Ereignis. */
export const PLAYER_EVENT_CHANCE = 0.27;
export const CLUB_EVENT_CHANCE = 0.02;

/** Einstellung „Ereignisse“ (App-Einstellungen): wenige · normal · viele. */
export type EventFrequency = 'wenige' | 'normal' | 'viele';
let frequency: EventFrequency = 'normal';
export function setEventFrequency(f: EventFrequency | undefined): void { frequency = f ?? 'normal'; }
export function eventFrequency(): EventFrequency { return frequency; }
const FREQ_FACTOR: Record<EventFrequency, number> = { wenige: 0.5, normal: 1, viele: 1.8 };

export function rollMonthlyEvents(ctx: EventContext): (EventSpawn & { money?: { amount: number; text: string } })[] {
  const out: (EventSpawn & { money?: { amount: number; text: string } })[] = [];
  const squad = ctx.club.playerIds.map((id) => ctx.players[id]).filter(Boolean);
  if (ctx.rng() < PLAYER_EVENT_CHANCE * FREQ_FACTOR[frequency]) {
    const options = DEFS.filter((d) => ctx.year >= d.from && ctx.year <= d.to)
      .map((d) => ({ d, cands: d.candidates(ctx, squad) })).filter((x) => x.cands.length);
    const total = options.reduce((a, x) => a + x.d.weight, 0);
    let r = ctx.rng() * total;
    for (const x of options) {
      r -= x.d.weight;
      if (r <= 0) { const p = pick(x.cands, ctx.rng); if (p) out.push(x.d.spawn(ctx, p)); break; }
    }
  }
  if (ctx.rng() < CLUB_EVENT_CHANCE * FREQ_FACTOR[frequency]) {
    const opts = CLUB_DEFS.filter((d) => ctx.year >= d.from && ctx.year <= d.to);
    const d = pick(opts, ctx.rng);
    if (d) out.push(d.spawn(ctx));
  }
  return out;
}

export function resolveEvent(ctx: EventContext, ref: EventRef, choice: string): EventEffects {
  const def = DEFS.find((d) => d.type === ref.type);
  if (!def?.resolve) return { text: '' };
  const p = ref.playerId ? ctx.players[ref.playerId] : undefined;
  return def.resolve(ctx, p, choice, ref);
}
