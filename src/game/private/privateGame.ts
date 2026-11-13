// =============================================================================
// PRIVATLEBEN – Ablauf (Wunsch Pascal #47). `privateDaily` aus day.ts.
// -----------------------------------------------------------------------------
// Montags: Wochenplan auswerten (Freizeit-Einheiten nach Spielbelastung, Wirkung auf
// Energie/Laune/Beziehung/Kinder/Kontakte/Fähigkeiten). Am 1.: Gehalt, Kosten,
// Zinsen/Aktien, Kontakte (Vorstand, Sponsoren), Erschöpfung, Beziehungskrise,
// Kinderwunsch. Täglich: Geburtstage/Lebensabschnitte der Kinder (Einschulung mit
// 6, Weichenstellung mit 16, Volljährigkeit), Geburt, Ruhestand.
// Wirkung im Spiel: `privateTrainingFactor` (trainerTeam.ts blockFactorFn),
// `privateTalkBonus` (playerTalk.ts → engine/dressingRoom.ts talkOdds),
// Vorstandsvertrauen/Ansehen/Sponsorengeld über Kontakte, Spende an den Verein,
// Kinder als Jugendspieler (engine/youth.ts generateYouthPlayer) und Nachfolger.
// =============================================================================
import type { Game } from '../state';
import { hashSeed } from '../state';
import { mulberry32 } from '../../engine/leagues';
import { CalendarEngine } from '../../engine/calendar';
import { economyScale, yearOf } from '../../engine/economy';
import { book } from '../../engine/finances';
import { makeMessage, pushMessage } from '../../engine/messages';
import { generateYouthPlayer } from '../../engine/youth';
import { CHOICE_HANDLERS } from '../eventsGame';
import { careerLog, ensureCareer } from '../careerState';
import { ownFixtures } from '../trainingWeek';
import { inWinterBreak, summerWindow } from '../winterShared';
import { fmtDM, fmtPrice } from '../../ui/format';
import {
  CHILD_MONTHLY, carsFor, cpi, FREE_UNITS, housing, HEIR_MIN_AGE, HOBBIES, HOMES, LIVING_MONTHLY, PLAN_DEF, RETIRE_FORCE_AGE, RETIRE_HINT_AGE,
  savingsRate, SKILLS, stockYear, WEDDING_COST, type PlanKey, type SkillKey,
} from '../../data/privateLife';
import {
  ageOf, ageOn, clamp, ensurePrivate, fullName, kidsOf, kidTraits, makePerson, partnerOf, privLog, privOf, privOn, salaryOf,
  type Person, type PrivateState,
} from './privateState';

const add = (d: string, n: number) => CalendarEngine.addDays(d, n);
const rnd = (s: string) => mulberry32(hashSeed(s));
const scaleNow = (g: Game) => economyScale(yearOf(g.calendar.currentDate));
const nameFor = (p: Person) => p.first;

function msg(g: Game, subject: string, shortText: string, bodyText: string, choices?: { id: string; label: string; hint?: string }[], type?: string, data?: Record<string, string | number>, def?: string): void {
  const today = g.calendar.currentDate;
  const m = makeMessage({ date: today, category: 'general', from: 'Privat', subject, shortText, bodyText, actionRequired: !!choices?.length });
  if (choices?.length && type) {
    m.choices = choices;
    m.eventRef = { type, deadline: add(today, 10), defaultChoice: def ?? choices[choices.length - 1].id, data };
  }
  pushMessage(g.messages, m);
}

// -----------------------------------------------------------------------------
// Woche
// -----------------------------------------------------------------------------
export function freeUnitsFor(g: Game, monday: string): { units: number; matches: number; off: boolean } {
  const matches = ownFixtures(g, monday, add(monday, 6)).size;
  const sw = summerWindow(g);
  const off = (monday >= sw.from && monday <= sw.to) || inWinterBreak(g, monday) || matches === 0;
  return { units: Math.max(2, FREE_UNITS.base + FREE_UNITS.perMatch * Math.max(0, matches - 1) + (off ? FREE_UNITS.offSeason : 0)), matches, off };
}

function weekResults(g: Game, from: string, to: string): { w: number; l: number } {
  const me = g.managedClubId;
  let w = 0, l = 0;
  for (const m of g.fixtures) {
    if (m.status !== 'finished' || !m.result || m.date < from || m.date > to || (m.homeClubId !== me && m.awayClubId !== me)) continue;
    const gf = m.homeClubId === me ? m.result.homeGoals : m.result.awayGoals;
    const ga = m.homeClubId === me ? m.result.awayGoals : m.result.homeGoals;
    if (gf > ga) w++; else if (gf < ga) l++;
  }
  return { w, l };
}

function weekly(g: Game, st: PrivateState, monday: string): void {
  const { units, matches } = freeUnitsFor(g, monday);
  const sum = Object.values(st.plan).reduce((a, b) => a + b, 0) || 1;
  const u = (k: PlanKey) => (units * st.plan[k]) / sum;
  const hobby = HOBBIES.find((h) => h.id === st.hobby) ?? HOBBIES[0];
  const partner = partnerOf(st);
  const kids = kidsOf(st).filter((k) => ageOf(g, k) < 18);
  const res = weekResults(g, add(monday, -7), add(monday, -1));
  const vac = st.vacation && st.vacation.to >= monday;
  const before = { energy: st.energy, mood: st.mood, rel: st.rel, net: st.net };

  // Energie: Belastung durch Spiele, Erholung durch Freizeit.
  st.energy = clamp(st.energy - (9 + 4 * matches + res.l * 1.5) + u('erholung') * 6 + u('hobby') * hobby.energy + u('partner') * 1.5 + u('familie') * 1 + (vac ? 18 : 0));
  // Laune: Ergebnisse, Hobby, Menschen um dich herum; zieht zur Mitte.
  st.mood = clamp(st.mood + (res.w - res.l) * 3 + u('hobby') * hobby.mood * 0.6 + u('partner') * (partner ? 1.5 : 0.5) + u('familie') * (kids.length ? 1.5 : 0)
    + (st.energy < 25 ? -3 : 0) + (50 - st.mood) * 0.08);
  // Beziehung.
  if (partner) st.rel = clamp(st.rel + u('partner') * 4 + u('familie') * 0.8 - (st.married ? 2.2 : 3) - (st.energy < 25 ? 1.5 : 0) + (vac ? 4 : 0));
  // Kinder: Bindung und Fußball-Lust wachsen mit gemeinsamer Zeit.
  const share = kids.length ? u('familie') / kids.length : 0;
  for (const k of kids) {
    k.bond = clamp((k.bond ?? 60) + share * 5 - 1.2);
    k.fussball = clamp((k.fussball ?? 40) + share * 0.5 + (res.w > res.l ? 0.12 : 0) - 0.1);
    if (ageOf(g, k) >= 10) k.fuehrung = clamp((k.fuehrung ?? 40) + share * 0.12 - 0.03);
  }
  // Kontakte und Fähigkeiten.
  st.net = clamp(st.net + u('netzwerk') * 2.5 + u('hobby') * hobby.net * 0.8 - 0.8);
  const study = st.study;
  st.xp[study] += u('bildung');
  const need = 8 + st.skills[study] * 3;
  if (st.xp[study] >= need && st.skills[study] < 20) {
    st.xp[study] -= need;
    st.skills[study]++;
    const label = SKILLS.find((s) => s.k === study)!.label;
    privLog(st, monday, `Weiterbildung: ${label} jetzt ${st.skills[study]}.`);
    if (st.skills[study] % 5 === 0) msg(g, `Weiterbildung: ${label} Stufe ${st.skills[study]}`, 'Deine Lehrgänge zahlen sich aus.', `Du hast dich in ${label} weiterentwickelt (Stufe ${st.skills[study]} von 20). ${SKILLS.find((s) => s.k === study)!.text}`);
  }
  // Gesundheit.
  const age = ageOf(g, st.persons[st.selfId]);
  st.health = clamp(st.health + u('hobby') * hobby.health * 0.25 - (age > 50 ? 0.12 + (age - 50) * 0.012 : 0) - (st.energy < 20 ? 0.6 : 0) + (st.health < 60 ? 0.15 : 0));
  // Ohne Partner: Leute kennenlernen.
  if (!partner && age >= 18 && age < 70) {
    const r = rnd(`date|${st.selfId}|${monday}`);
    if (r() < 0.012 + u('partner') * 0.018 + u('hobby') * 0.004 && !st.told.dating) meetSomeone(g, st, r);
  }
  st.last = { units, energy: Math.round(st.energy - before.energy), mood: Math.round(st.mood - before.mood), rel: Math.round(st.rel - before.rel), net: Math.round(st.net - before.net) };
  // Erschöpfung warnen (höchstens alle 6 Wochen).
  if (st.energy < 25 && (!st.told.tired || st.told.tired < add(monday, -42))) {
    st.told.tired = monday;
    msg(g, 'Du bist erschöpft', 'Mehr Erholung einplanen – sonst leiden Training und Gespräche.',
      `Seit Wochen geht es nur um den Verein. Du schläfst schlecht, bist gereizt, vergisst Termine.\n\nSolange deine Energie unter 30 liegt, wirkt das Training etwas schwächer (−3 %) und Gespräche mit Spielern gelingen seltener. Plane in Privat › Freizeit mehr Erholung ein oder buche einen Urlaub in der Sommer- oder Winterpause.`);
  }
}

function meetSomeone(g: Game, st: PrivateState, r: () => number): void {
  const self = st.persons[st.selfId];
  const today = g.calendar.currentDate;
  const age = ageOf(g, self);
  const pAge = clamp(age - 4 + Math.floor(r() * 8), 18, 75);
  const y = +today.slice(0, 4) - pAge;
  const cand = makePerson(st, r, { sex: st.seeking, birth: `${y}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 28)).padStart(2, '0')}`, last: '', gen: self.gen, role: 'ex' });
  cand.last = ['Albers', 'Hagen', 'Lorenz', 'Sander', 'Voigt', 'Kessler', 'Brinkmann', 'Martens', 'Reuter', 'Thiele'][Math.floor(r() * 10)];
  cand.alive = true;
  st.told.dating = today;
  const where = ['bei einem Sponsorenabend', 'im Café gegenüber der Geschäftsstelle', 'beim Hobby', 'auf der Hochzeit eines Spielers', 'im Zug nach einem Auswärtsspiel', 'bei Freunden'][Math.floor(r() * 6)];
  msg(g, `Du hast ${cand.first} kennengelernt`, `${cand.first} ${cand.last}, ${pAge} – ${where}.`,
    `${where[0].toUpperCase()}${where.slice(1)} kommst du mit ${cand.first} ${cand.last} (${pAge}) ins Gespräch. Ihr lacht viel, du vergisst sogar die Tabelle.\n\nWiedersehen?`,
    [{ id: 'ja', label: 'Wiedersehen', hint: 'Beziehung beginnt' }, { id: 'nein', label: 'Lieber nicht', hint: 'Der Verein geht vor' }], 'privat_treffen', { id: cand.id }, 'nein');
}

CHOICE_HANDLERS['privat_treffen'] = (g, ref, choice) => {
  const st = ensurePrivate(g);
  const p = st.persons[String(ref.data?.id ?? '')];
  delete st.told.dating;
  if (!p) return { text: '' };
  if (choice !== 'ja' || st.partnerId) { delete st.persons[p.id]; return { text: 'Ihr seht euch nicht wieder.' }; }
  p.role = 'partner';
  st.partnerId = p.id;
  st.rel = 40;
  st.mood = clamp(st.mood + 8);
  privLog(st, g.calendar.currentDate, `Zusammen mit ${fullName(p)}.`);
  return { text: `Du und ${p.first} seid jetzt ein Paar.` };
};

// -----------------------------------------------------------------------------
// Monat
// -----------------------------------------------------------------------------
export function monthlyCosts(g: Game, st: PrivateState): { income: number; living: number; home: number; car: number; hobby: number; kids: number } {
  const adults = 1 + (st.partnerId ? 1 : 0);
  const kids = kidsOf(st).filter((k) => ageOf(g, k) < 18).length;
  const year = yearOf(g.calendar.currentDate);
  const car = carsFor(year)[st.car] ?? carsFor(1975)[0];
  const k = cpi(year);
  return {
    income: Math.round(salaryOf(g) * economyScale(year) / 12),
    living: Math.round(LIVING_MONTHLY * (adults === 2 ? 1.6 : 1) * k),
    home: Math.round(HOMES[st.home].monthly * k),
    car: Math.round(car.monthly * k),
    hobby: Math.round((HOBBIES.find((h) => h.id === st.hobby)?.monthly ?? 0) * k),
    kids: Math.round(CHILD_MONTHLY * kids * k),
  };
}

function monthly(g: Game, st: PrivateState, today: string): void {
  const year = yearOf(today);
  const c = monthlyCosts(g, st);
  const out = c.living + c.home + c.car + c.hobby + c.kids;
  // Zinsen und Aktien (nominal).
  const interest = Math.round(st.savings * savingsRate(year) / 12);
  const r = rnd(`stk|${st.selfId}|${today}`);
  const ret = stockYear(year) / 12 + (r() - 0.5) * 0.04 + st.skills.wirtschaft * 0.0002;
  const stockDelta = Math.round(st.stocks * ret);
  st.savings = Math.max(0, st.savings + interest);
  st.stocks = Math.max(0, st.stocks + stockDelta);
  st.money += c.income - out;
  // Konto im Minus: erst Sparbuch, dann Aktien.
  if (st.money < 0) { const t = Math.min(st.savings, -st.money); st.savings -= t; st.money += t; }
  if (st.money < 0) { const t = Math.min(st.stocks, -st.money); st.stocks -= t; st.money += t; }
  if (st.money < 0 && !st.told.debt) {
    st.told.debt = today;
    msg(g, 'Dein Privatkonto ist im Minus', 'Zu teuer gelebt – Haus, Auto oder Hobby kosten mehr, als du verdienst.', `Dein Gehalt deckt die laufenden Kosten nicht mehr (${fmtDM(out)} im Monat gegenüber ${fmtDM(c.income)} Gehalt). Verkaufe in Privat › Vermögen das Auto oder ziehe kleiner, sonst leidet die Laune.`);
  }
  if (st.money >= 0) delete st.told.debt;
  if (st.money < 0) st.mood = clamp(st.mood - 3);
  st.ledger = { d: today, income: c.income, living: c.living, home: c.home, car: c.car, hobby: c.hobby, kids: c.kids, interest, stocks: stockDelta };

  // Kontakte: Vorstand, Sponsor, Presse.
  const club = g.clubs[g.managedClubId];
  const rc = rnd(`net|${st.selfId}|${today}`);
  if (club && rc() < st.net / 500) {
    const roll = rc();
    if (roll < 0.4) {
      const amt = Math.round((8000 + st.net * 250) * (1 + st.skills.wirtschaft / 20));
      book(club.finances, today, Math.round(amt * scaleNow(g)), 'sponsorship', 'Sponsorenkontakt (privat)', true);
      msg(g, 'Kontakt zahlt sich aus', `Ein Unternehmer aus deinem Bekanntenkreis gibt ${fmtPrice(amt)}.`, `Beim ${st.hobby === 'golf' ? 'Golf' : 'Abendessen'} hast du einem Unternehmer von den Plänen des Vereins erzählt. Jetzt überweist er ${fmtPrice(amt)} als Zuschuss – „für die Jugend“, sagt er.`);
      privLog(st, today, `Sponsorenkontakt: ${fmtPrice(amt)} für den Verein.`);
    } else if (roll < 0.75) {
      club.boardConfidence = clamp((club.boardConfidence ?? 60) + 4);
      msg(g, 'Abend mit dem Vorstand', 'Vertrauen des Vorstands +4.', 'Ein langer Abend mit zwei Vorstandsmitgliedern. Man versteht sich – und man weiß jetzt, was du vorhast.');
    } else {
      const c2 = ensureCareer(g);
      c2.rep = clamp(c2.rep + 0.6 + st.skills.medien * 0.05, 0, 100);
      msg(g, 'Gute Presse', 'Ein Porträt in der Sonntagszeitung – dein Ansehen steigt.', 'Ein Journalist, den du von früher kennst, schreibt ein freundliches Porträt über dich. Die Branche liest mit.');
    }
  }
  // Gesundheit: ernsthafte Warnung.
  if (st.health < 35 && (!st.told.health || st.told.health < add(today, -180))) {
    st.told.health = today;
    msg(g, 'Der Arzt rät zur Ruhe', 'Deine Gesundheit leidet. Mehr Erholung und Bewegung einplanen.', 'Beim Check-up schaut der Arzt lange auf die Werte. „Sie arbeiten zu viel und bewegen sich zu wenig.“ Mehr Erholung und ein Hobby mit Bewegung helfen.');
  }
  // Beziehungskrise.
  const partner = partnerOf(st);
  if (partner && st.rel < 22 && (!st.told.crisis || st.told.crisis < add(today, -120))) {
    st.told.crisis = today;
    msg(g, `Krise mit ${partner.first}`, `${partner.first} fühlt sich allein gelassen.`,
      `„Du bist nie da. Und wenn du da bist, denkst du an den Verein.“ ${partner.first} meint es ernst.`,
      [{ id: 'urlaub', label: 'Gemeinsam verreisen', hint: fmtPrice(4000 * cpi(yearOf(today)) / economyScale(yearOf(today))) }, { id: 'reden', label: 'Reden, mehr Zeit versprechen' }, { id: 'trennung', label: 'Trennen' }],
      'privat_krise', {}, 'reden');
  }
  // Kinderwunsch.
  const self = st.persons[st.selfId];
  if (partner && st.wish && !st.expecting && st.rel >= 50) {
    const a1 = ageOf(g, self), a2 = ageOf(g, partner);
    const fertile = (self.sex === 'w' ? a1 <= 44 : a1 <= 60) && (partner.sex === 'w' ? a2 <= 44 : a2 <= 60);
    const rk = rnd(`kid|${st.selfId}|${today}`);
    const nKids = kidsOf(st).length;
    if (nKids < 6 && rk() < (fertile ? 0.07 : 0.02) * (1 - nKids * 0.15)) {
      const adopt = self.sex === partner.sex || !fertile;
      st.expecting = add(today, adopt ? 120 : 255);
      st.told.adopt = adopt ? '1' : '';
      msg(g, adopt ? 'Ihr werdet Eltern' : 'Ihr bekommt ein Kind', adopt ? `Die Adoption ist bewilligt – in etwa vier Monaten ist es so weit.` : `${partner.first} ist schwanger. Geburtstermin: ${CalendarEngine.formatDate(st.expecting)}.`,
        adopt ? 'Nach vielen Gesprächen mit dem Jugendamt kommt der Anruf: Ihr bekommt ein Kind.' : `${partner.first} zeigt dir das Ultraschallbild. Ab jetzt wird alles anders.`);
    }
  }
  // Ruhestand: Hinweis.
  const age = ageOf(g, self);
  if (age >= RETIRE_HINT_AGE && !st.told.retire) {
    st.told.retire = today;
    const heirs = heirsOf(g, st);
    msg(g, 'Gedanken an den Ruhestand', heirs.length ? `${heirs.map(nameFor).join(', ')} könnte übernehmen.` : 'Noch kein Nachfolger in der Familie.',
      `Mit ${age} fragt der Vorstand vorsichtig, wie lange du noch willst. ${heirs.length ? `In Privat › Familie kannst du den Verein an ${heirs.length > 1 ? 'eines deiner Kinder' : heirs[0].first} übergeben – dann spielst du mit ${heirs.length > 1 ? 'ihm oder ihr' : heirs[0].sex === 'w' ? 'ihr' : 'ihm'} weiter.` : 'Noch hat niemand in der Familie das Alter oder die Neigung. Spätestens mit ' + RETIRE_FORCE_AGE + ' übergibst du an einen Nachfolger.'}`);
  }
}

CHOICE_HANDLERS['privat_krise'] = (g, _ref, choice) => {
  const st = ensurePrivate(g);
  const p = partnerOf(st);
  if (!p) return { text: '' };
  if (choice === 'urlaub') {
    st.money -= Math.round(4000 * cpi(yearOf(g.calendar.currentDate))); st.rel = clamp(st.rel + 28); st.energy = clamp(st.energy + 15);
    return { text: `Zwei Wochen weg, ohne Telefon. Mit ${p.first} ist es wieder gut.` };
  }
  if (choice === 'reden') { st.rel = clamp(st.rel + 12); st.plan.partner = Math.min(5, st.plan.partner + 1); return { text: `Du versprichst mehr Zeit (Wochenplan: Partner +1). ${p.first} gibt dir eine Chance.` }; }
  separate(g, st, 'Ihr trennt euch.');
  return { text: `Ihr geht getrennte Wege.` };
};

function separate(g: Game, st: PrivateState, why: string): void {
  const p = partnerOf(st);
  if (!p) return;
  const today = g.calendar.currentDate;
  if (st.married) {
    const half = Math.round((st.money + st.savings + st.stocks) / 2);
    let left = half;
    for (const k of ['stocks', 'savings', 'money'] as const) { const t = Math.min(Math.max(0, st[k]), left); st[k] -= t; left -= t; }
    st.money -= left;
    privLog(st, today, `Scheidung von ${fullName(p)} – die Hälfte des Vermögens geht mit.`);
  } else privLog(st, today, `Trennung von ${fullName(p)}.`);
  p.role = 'ex';
  st.partnerId = undefined; st.married = undefined; st.rel = 0; st.wish = false; st.expecting = undefined;
  st.mood = clamp(st.mood - 15);
  for (const k of kidsOf(st)) k.bond = clamp((k.bond ?? 60) - 10);
  void why;
}

// -----------------------------------------------------------------------------
// Kinder: Geburt, Lebensabschnitte, Fußball
// -----------------------------------------------------------------------------
function birth(g: Game, st: PrivateState, today: string): void {
  const self = st.persons[st.selfId];
  const partner = partnerOf(st);
  const adopt = st.told.adopt === '1';
  const r = rnd(`born|${st.selfId}|${today}`);
  const sex = r() < 0.51 ? 'm' : 'w';
  const kBirth = adopt ? add(today, -Math.floor(r() * 300)) : today;
  const kid = makePerson(st, r, { sex, birth: kBirth, last: self.last, gen: self.gen + 1, role: 'kind', parents: [self.id, ...(partner ? [partner.id] : [])] });
  kidTraits(st, kid, r, g.manager?.background === 'ex_pro' || g.manager?.background === 'legend');
  st.expecting = undefined;
  st.wish = false; // Kinderwunsch neu entscheiden (Privat › Familie)
  st.mood = clamp(st.mood + 12);
  st.energy = clamp(st.energy - 10);
  privLog(st, today, `${kid.first} ist da.`);
  msg(g, `${kid.first} ist da!`, `${sex === 'm' ? 'Ein Sohn' : 'Eine Tochter'} – ${kid.first} ${kid.last}.`,
    `${adopt ? 'Heute zieht' : 'Heute kam'} ${kid.first} ${adopt ? 'bei euch ein' : 'zur Welt'}. Die Mannschaft schickt Blumen, der Zeugwart einen Strampler in Vereinsfarben.\n\nIn Privat › Familie siehst du, wie sich ${kid.first} entwickelt. Wie viel Zeit du mit der Familie verbringst, prägt, ob aus ${sex === 'm' ? 'ihm' : 'ihr'} einmal ${sex === 'm' ? 'ein Fußballer oder dein Nachfolger' : 'deine Nachfolgerin'} wird.`);
}

function kidBirthday(g: Game, st: PrivateState, k: Person, age: number, today: string): void {
  const self = st.persons[st.selfId];
  if (age === 6 && (k.path ?? 'offen') === 'offen') {
    msg(g, `${k.first} wird 6`, 'Schule beginnt – und nachmittags?', `${k.first} kommt in die Schule. Was machen wir nachmittags?`,
      [
        ...(k.sex === 'm' ? [{ id: 'verein', label: 'In die eigene Jugend', hint: 'Ab 7 Jahren in deiner Akademie' }] : [{ id: 'verein', label: 'Fußball im Verein', hint: 'Bolzplatz und Mädchenteam' }]),
        { id: 'musik', label: 'Musikschule' },
        { id: 'frei', label: 'Selbst entscheiden lassen' },
      ], 'privat_schule', { id: k.id }, 'frei');
  }
  if (age === 7 && k.hobby === 'verein' && k.sex === 'm' && !k.playerId) joinYouth(g, st, k);
  if (age === 16 && (k.path === 'offen' || k.path === 'spieler')) {
    const pl = k.playerId ? (g.players[k.playerId] ?? g.youthPlayers[k.playerId]) : undefined;
    msg(g, `${k.first} wird 16 – wie geht es weiter?`, pl ? `In der Jugend: Stärke ${pl.overall}.` : 'Die Schule ist bald vorbei.',
      `${k.first} sitzt dir am Küchentisch gegenüber. ${pl ? `„Ich will Profi werden.“ Die Jugendtrainer sagen: Stärke ${pl.overall} mit 16.` : '„Ich weiß noch nicht genau, was ich will.“'}\n\nFußballlust ${Math.round(k.fussball ?? 0)}, Führungsstärke ${Math.round(k.fuehrung ?? 0)}, Bindung zu dir ${Math.round(k.bond ?? 0)}.`,
      [
        ...(pl ? [{ id: 'spieler', label: 'Auf die Profikarriere setzen' }] : []),
        { id: 'manager', label: 'Sportmanagement studieren', hint: 'Später dein Nachfolger' },
        { id: 'eigen', label: 'Eigenen Weg gehen lassen' },
      ], 'privat_weg', { id: k.id }, pl ? 'spieler' : 'eigen');
  }
  if (age === HEIR_MIN_AGE && (k.path === 'manager' || (k.fuehrung ?? 0) >= 60)) {
    msg(g, `${k.first} ist volljährig`, 'Ein möglicher Nachfolger.', `${k.first} wird 18. ${k.path === 'manager' ? 'Das Studium läuft, die Wochenenden verbringt ' + (k.sex === 'm' ? 'er' : 'sie') + ' im Stadion.' : 'Im Verein sagen sie, ' + (k.sex === 'm' ? 'er' : 'sie') + ' habe deinen Blick.'}\n\nIn Privat › Familie kannst du ${k.first} jederzeit den Verein übergeben – dann spielst du mit ${k.sex === 'm' ? 'ihm' : 'ihr'} weiter.`);
  }
  void self;
}

CHOICE_HANDLERS['privat_schule'] = (g, ref, choice) => {
  const st = ensurePrivate(g);
  const k = st.persons[String(ref.data?.id ?? '')];
  if (!k) return { text: '' };
  k.hobby = choice;
  if (choice === 'verein') { k.fussball = clamp((k.fussball ?? 40) + 15); return { text: `${k.first} ${k.sex === 'm' ? 'spielt ab 7 in deiner Jugend' : 'kickt im Verein'}.` }; }
  if (choice === 'musik') { k.fussball = clamp((k.fussball ?? 40) - 10); k.fuehrung = clamp((k.fuehrung ?? 40) + 4); return { text: `${k.first} lernt ein Instrument.` }; }
  return { text: `${k.first} sucht sich selbst etwas aus.` };
};

CHOICE_HANDLERS['privat_weg'] = (g, ref, choice) => {
  const st = ensurePrivate(g);
  const k = st.persons[String(ref.data?.id ?? '')];
  if (!k) return { text: '' };
  k.path = choice as Person['path'];
  if (choice === 'manager') { k.fuehrung = clamp((k.fuehrung ?? 40) + 18); return { text: `${k.first} studiert Sportmanagement.` }; }
  if (choice === 'spieler') { k.fussball = clamp((k.fussball ?? 40) + 10); return { text: `${k.first} setzt alles auf den Fußball.` }; }
  k.bond = clamp((k.bond ?? 60) + 5);
  return { text: `${k.first} geht ${k.sex === 'm' ? 'seinen' : 'ihren'} eigenen Weg.` };
};

/** Kind in die eigene Jugend aufnehmen (ab 7, nur Jungen – Frauenfußball läuft außerhalb des Spiels). */
export function joinYouth(g: Game, st: PrivateState, k: Person): string {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const age = ageOn(k.birth, today);
  if (!club || k.sex !== 'm' || age < 7 || age > 19 || k.playerId) return 'Nicht möglich.';
  const pot = ((k.talent ?? 50) - 50) / 22 + ((k.fussball ?? 50) - 50) / 80;
  const p = generateYouthPlayer(club.id, `kid_${k.id}`, today, Math.max(1, club.infrastructure.youthAcademy), age, { pool: 'talent', potBias: pot });
  p.firstName = k.first; p.lastName = k.last; p.fullName = `${k.first} ${k.last}`;
  p.dateOfBirth = k.birth;
  p.nationality = g.manager?.nationality || p.nationality;
  p.clubId = club.id;
  g.youthPlayers[p.id] = p;
  if (!club.youthPlayerIds.includes(p.id)) club.youthPlayerIds.push(p.id);
  k.playerId = p.id;
  k.path = 'spieler';
  privLog(st, today, `${k.first} spielt jetzt in der Jugend (${p.naturalPosition}).`);
  return `${k.first} spielt jetzt in deiner Jugend.`;
}

// -----------------------------------------------------------------------------
// Tageslauf
// -----------------------------------------------------------------------------
export function privateDaily(g: Game, today: string): void {
  if (!privOn(g)) return;
  const st = ensurePrivate(g);
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  if (dow === 1 && st.week !== today) { st.week = today; weekly(g, st, today); }
  if (today.endsWith('-01') && st.month !== today) { st.month = today; monthly(g, st, today); }
  if (st.expecting && st.expecting <= today) birth(g, st, today);
  const md = today.slice(5);
  for (const k of kidsOf(st)) if (k.birth.slice(5) === md && k.birth < today) kidBirthday(g, st, k, ageOn(k.birth, today), today);
  // Eltern werden alt.
  for (const p of Object.values(st.persons)) {
    if (!p.alive || (p.role !== 'eltern' && p.role !== 'alt')) continue;
    if (p.birth.slice(5) !== md) continue;
    const a = ageOn(p.birth, today);
    const r = rnd(`die|${p.id}|${today}`);
    if (a >= 70 && r() < (a - 65) * 0.012) {
      p.alive = false; p.died = today;
      st.mood = clamp(st.mood - 12);
      const inherit = p.role === 'eltern' ? Math.round((20000 + r() * 40000) * cpi(yearOf(today))) : 0;
      st.money += inherit;
      privLog(st, today, `${fullName(p)} ist gestorben (${a}).`);
      msg(g, `Abschied von ${p.first}`, `${fullName(p)} ist mit ${a} Jahren gestorben.`, `${fullName(p)} ist gestorben. ${p.role === 'alt' ? 'Im Stadion gibt es eine Schweigeminute, die Fans hängen ein Banner auf.' : 'Die Familie kommt zusammen.'}${inherit ? `\n\nDas Erbe: ${fmtDM(inherit)}.` : ''}`);
    }
  }
  // Kind als Spieler: Karriereende erkennen.
  for (const k of kidsOf(st)) if (k.playerId && !g.players[k.playerId] && !g.youthPlayers[k.playerId] && !g.worldPool) { k.notes = [...(k.notes ?? []), `Fußball beendet ${today.slice(0, 4)}`]; k.playerId = undefined; }
  // Zwangs-Ruhestand.
  const self = st.persons[st.selfId];
  if (ageOn(self.birth, today) >= RETIRE_FORCE_AGE && !st.told.force) {
    st.told.force = today;
    const heirs = heirsOf(g, st);
    msg(g, 'Zeit, abzugeben', heirs.length ? 'Wähle in Privat › Familie deinen Nachfolger.' : 'Ein Nachfolger von außen steht bereit.',
      `Mit ${ageOn(self.birth, today)} ist Schluss – so hat es der Vorstand beschlossen, und ehrlich gesagt bist du müde. ${heirs.length ? 'Übergib in Privat › Familie an eines deiner Kinder.' : 'In der Familie gibt es niemanden, also übernimmt dein Assistent – du spielst mit ihm weiter (Privat › Familie).'}`);
  }
}

// -----------------------------------------------------------------------------
// Aktionen (Oberfläche)
// -----------------------------------------------------------------------------
export function setPlan(g: Game, k: PlanKey, v: number): void { const st = ensurePrivate(g); st.plan[k] = Math.max(0, Math.min(5, Math.round(v))); }
export function setHobby(g: Game, id: string): void { const st = ensurePrivate(g); if (HOBBIES.some((h) => h.id === id)) st.hobby = id; }
export function setStudy(g: Game, k: SkillKey): void { ensurePrivate(g).study = k; }
export function setSeeking(g: Game, s: 'm' | 'w'): void { ensurePrivate(g).seeking = s; }
export function setWish(g: Game, on: boolean): void { ensurePrivate(g).wish = on; }

const total = (st: PrivateState) => st.money + st.savings + st.stocks;

export function buyHome(g: Game, lvl: number): string {
  const st = ensurePrivate(g);
  const h = HOMES[lvl];
  if (!h || lvl === st.home) return '';
  const { sell, cost } = homeDeal(g, st, lvl);
  if (cost > st.money) return `Dafür fehlen ${fmtDM(cost - st.money)} auf dem Konto.`;
  st.money -= cost; st.home = lvl;
  st.mood = clamp(st.mood + (lvl > 0 ? 6 : -4));
  if (st.partnerId) st.rel = clamp(st.rel + h.family * 0.4);
  privLog(st, g.calendar.currentDate, `Umzug: ${h.label}.`);
  return `Umzug in ${h.label === 'Villa' ? 'die' : h.label === 'Mietwohnung' || h.label === 'Eigentumswohnung' ? 'die' : 'das'} ${h.label}${sell ? ` (altes Zuhause verkauft: ${fmtDM(sell)})` : ''}.`;
}

export function buyCar(g: Game, lvl: number): string {
  const st = ensurePrivate(g);
  const cars = carsFor(yearOf(g.calendar.currentDate));
  const c = cars[lvl];
  if (!c || lvl === st.car) return '';
  const { cost } = carDeal(g, st, lvl);
  if (cost > st.money) return `Dafür fehlen ${fmtDM(cost - st.money)} auf dem Konto.`;
  st.money -= cost; st.car = lvl;
  st.mood = clamp(st.mood + (lvl > 2 ? 4 : 1));
  privLog(st, g.calendar.currentDate, `Neues Auto: ${c.label}.`);
  return `${c.label} gekauft.`;
}

export function moveMoney(g: Game, from: 'money' | 'savings' | 'stocks', to: 'money' | 'savings' | 'stocks', amount: number): string {
  const st = ensurePrivate(g);
  const a = Math.min(Math.max(0, Math.round(amount)), Math.max(0, st[from]));
  if (!a) return '';
  st[from] -= a; st[to] += a;
  return `${fmtDM(a)} umgebucht.`;
}

/** Privatgeld an den Verein (Finanzspritze, keine Rückzahlung). */
export function donateToClub(g: Game, amount: number): string {
  const st = ensurePrivate(g);
  const club = g.clubs[g.managedClubId];
  const a = Math.min(Math.max(0, Math.round(amount)), Math.max(0, st.money));
  if (!club || !a) return '';
  st.money -= a; st.donated += a;
  book(club.finances, g.calendar.currentDate, a, 'other', 'Zuschuss des Managers (privat)', true);
  // Vertrauen nach Anteil am Jahresumsatz-Niveau (1975: 20.000 DM ≈ +1).
  club.boardConfidence = clamp((club.boardConfidence ?? 60) + Math.min(8, a / (20000 * scaleNow(g))));
  privLog(st, g.calendar.currentDate, `${fmtDM(a)} an den Verein gegeben.`);
  return `${fmtDM(a)} an den Verein überwiesen. Der Vorstand ist beeindruckt.`;
}

export function vacation(g: Game, kind: 'kurz' | 'lang'): string {
  const st = ensurePrivate(g);
  const today = g.calendar.currentDate;
  const monday = today;
  const { off } = freeUnitsFor(g, monday);
  if (!off) return 'Urlaub nur in der Sommer- oder Winterpause.';
  if (st.vacation && st.vacation.to >= today) return 'Du bist schon im Urlaub.';
  const cost = vacationCost(g, kind);
  if (cost > st.money) return `Dafür fehlen ${fmtDM(cost - st.money)}.`;
  st.money -= cost;
  st.vacation = { to: add(today, kind === 'kurz' ? 7 : 14), label: kind === 'kurz' ? 'Kurzurlaub' : 'Familienurlaub' };
  st.energy = clamp(st.energy + (kind === 'kurz' ? 10 : 20));
  st.mood = clamp(st.mood + 8);
  if (st.partnerId) st.rel = clamp(st.rel + (kind === 'kurz' ? 6 : 14));
  for (const k of kidsOf(st)) if (ageOf(g, k) < 18) k.bond = clamp((k.bond ?? 60) + (kind === 'lang' ? 8 : 2));
  privLog(st, today, `${st.vacation.label} gebucht.`);
  return `${st.vacation.label} bis ${CalendarEngine.formatDate(st.vacation.to)}.`;
}

export function gift(g: Game, pid: string): string {
  const st = ensurePrivate(g);
  const p = st.persons[pid];
  if (!p || !p.alive) return '';
  const last = st.told[`gift:${pid}`];
  if (last && last > add(g.calendar.currentDate, -60)) return 'Zu viele Geschenke wirken gekauft – später wieder.';
  const cost = Math.round(300 * cpi(yearOf(g.calendar.currentDate)));
  if (cost > st.money) return 'Das Konto ist leer.';
  st.money -= cost; st.told[`gift:${pid}`] = g.calendar.currentDate;
  if (pid === st.partnerId) st.rel = clamp(st.rel + 6); else p.bond = clamp((p.bond ?? 60) + 5);
  return `${p.first} freut sich.`;
}

export function canPropose(st: PrivateState): boolean { return !!st.partnerId && !st.married && st.rel >= 65; }
export function propose(g: Game): string {
  const st = ensurePrivate(g);
  const p = partnerOf(st);
  if (!p || !canPropose(st)) return '';
  const r = rnd(`propose|${st.selfId}|${g.calendar.currentDate}`);
  if (r() > 0.35 + st.rel / 100 * 0.6) { st.rel = clamp(st.rel - 8); return `${p.first} braucht noch Zeit.`; }
  st.married = g.calendar.currentDate;
  const wedding = Math.round(WEDDING_COST * cpi(yearOf(g.calendar.currentDate)));
  st.money -= wedding;
  st.rel = clamp(st.rel + 12); st.mood = clamp(st.mood + 12);
  p.last = st.persons[st.selfId].last;
  privLog(st, g.calendar.currentDate, `Hochzeit mit ${p.first}.`);
  msg(g, `Hochzeit mit ${p.first}`, 'Die Mannschaft steht Spalier.', `${p.first} hat Ja gesagt. Die Feier kostet ${fmtDM(wedding)}, die Mannschaft steht vor dem Standesamt Spalier, und der Vorstand schickt einen Präsentkorb.`);
  return `${p.first} hat Ja gesagt!`;
}

export function endRelationship(g: Game): string {
  const st = ensurePrivate(g);
  const p = partnerOf(st);
  if (!p) return '';
  separate(g, st, '');
  return `Trennung von ${p.first}.`;
}

// -----------------------------------------------------------------------------
// Nachfolge
// -----------------------------------------------------------------------------
export function heirsOf(g: Game, st: PrivateState): Person[] {
  return kidsOf(st).filter((k) => ageOf(g, k) >= HEIR_MIN_AGE).sort((a, b) => heirScore(b) - heirScore(a));
}
export const heirScore = (k: Person) => (k.fuehrung ?? 40) + (k.path === 'manager' ? 20 : 0) + (k.bond ?? 50) * 0.2;

export function planLabel(k: PlanKey): string { return PLAN_DEF.find((p) => p.k === k)!.label; }
export const homePrice = (lvl: number, year: number) => Math.round(HOMES[lvl].price * housing(year));
export const netWorth = (st: PrivateState, year: number) => total(st) + homePrice(st.home, year);
/** Kauf eines Zuhauses: Erlös des alten (85 %) und Zuzahlung (nominal). */
export function homeDeal(g: Game, st: PrivateState, lvl: number): { sell: number; cost: number } {
  const y = yearOf(g.calendar.currentDate);
  const sell = st.home > 0 ? Math.round(homePrice(st.home, y) * 0.85) : 0;
  return { sell, cost: homePrice(lvl, y) - sell };
}
export const carPrice = (lvl: number, year: number) => Math.round((carsFor(year)[lvl]?.price ?? 0) * cpi(year));
export function carDeal(g: Game, st: PrivateState, lvl: number): { sell: number; cost: number } {
  const y = yearOf(g.calendar.currentDate);
  const sell = Math.round(carPrice(st.car, y) * 0.45);
  return { sell, cost: carPrice(lvl, y) - sell };
}
export const vacationCost = (g: Game, kind: 'kurz' | 'lang') => Math.round((kind === 'kurz' ? 1500 : 5000) * cpi(yearOf(g.calendar.currentDate)));
export const giftCost = (g: Game) => Math.round(300 * cpi(yearOf(g.calendar.currentDate)));

export { careerLog };
