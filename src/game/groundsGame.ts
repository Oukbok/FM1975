// =============================================================================
// Stadionumfeld im Spielablauf: Nachrüstung, Tages-/Monats-/Saisonlauf,
// Bauprojekte mit Genehmigung und Anwohnerprotest, ÖPNV-Verhandlung,
// Ausschreitungen/Strafen/Polizeigebühren, Lizenzauflagen, KI-Ausbau.
// Rechenlogik: engine/grounds.ts · Katalog: data/groundsCatalog.ts.
// Einstieg: groundsDaily() aus game/day.ts, migrateGrounds() beim Laden.
// =============================================================================
import { Game } from './state';
import { Club } from '../types';
import { ClubGrounds, GroundsModuleKey, GroundsProject } from '../types/grounds';
import {
  FINE_BASE, GROUNDS_BY_KEY, GROUNDS_MODULES, LAND_PARCEL, LICENSE_FINE, LOCATIONS, POLICE_FEE_BASE, licenseMin, permitMonths, policeFeeShare,
} from '../data/groundsCatalog';
import {
  accessInfo, addGroundsStats, areaUsed, typicalAttendance, buildCost, checkNext, condMult, groundsAttendanceBonus, incidentRisk, landPrice, levelDef, levelOf,
  makeGrounds, monthlyItems, pushLog, renovateCost, typicalLevel, wearMonthly,
} from '../engine/grounds';
import { economyScale, formatMoney, yearOf } from '../engine/economy';
import { ensureBrand, isLeagueClub, lastRevenue } from '../engine/clubEconomy';
import { book } from '../engine/finances';
import { sameRegion } from '../engine/environment';
import { makeMessage, pushMessage } from '../engine/messages';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const addDays = (d: string, n: number) => new Date(Date.parse(d + 'T00:00:00Z') + Math.round(n) * 86400000).toISOString().slice(0, 10);
function seasonOf(date: string): string {
  const y = Number(date.slice(0, 4));
  const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1;
  return `${s}/${String((s + 1) % 100).padStart(2, '0')}`;
}
const tierOf = (g: Game) => g.leagues?.playerDivision?.tier ?? 1;
const isMine = (g: Game, c: Club) => c.id === g.managedClubId && !(g as any).simAutoManage;

function msg(g: Game, date: string, from: string, subject: string, body: string, short?: string) {
  pushMessage(g.messages, makeMessage({ date, category: 'board', from, subject, shortText: short ?? body.split('\n')[0].slice(0, 120), bodyText: body }));
}

// -----------------------------------------------------------------------------
// Nachrüstung
// -----------------------------------------------------------------------------
export function ensureClubGrounds(club: Club, today: string): ClubGrounds {
  if (!club.grounds) {
    club.grounds = makeGrounds(club, yearOf(today));
    club.grounds.lastMonth = today.slice(0, 7);
    club.grounds.lastSeason = seasonOf(today);
    club.grounds.lastScan = today;
  }
  return club.grounds;
}

/** Idempotent: alle Liga-Vereine bekommen ein Umfeld (vorhandene Stufen bleiben). */
export function migrateGrounds(g: Game): void {
  const today = g.calendar?.currentDate;
  if (!today) return;
  for (const c of Object.values(g.clubs)) {
    if (!isLeagueClub(c)) continue;
    const gr = ensureClubGrounds(c, today);
    gr.log ??= []; gr.projects ??= []; gr.modules ??= {};
    gr.attApplied ??= 0;
  }
}

// -----------------------------------------------------------------------------
// Tageslauf
// -----------------------------------------------------------------------------
export function groundsDaily(g: Game, today: string): void {
  const year = yearOf(today);
  const tier = tierOf(g);
  const month = today.slice(0, 7);
  const season = seasonOf(today);
  const league = Object.values(g.clubs).filter(isLeagueClub);
  // KI-Ausbau nach Größe: Rang im Umsatz → wirksamer Ruf 90 (größter) bis 50 (kleinster).
  let sizeRep: Map<string, number> | null = null;
  for (const club of league) {
    const gr = ensureClubGrounds(club, today);
    if (gr.lastSeason !== season) {
      gr.lastSeason = season;
      if (!sizeRep) {
        const byRev = [...league].sort((a, b) => lastRevenue(b, year, tier) - lastRevenue(a, year, tier));
        sizeRep = new Map(byRev.map((c, i) => [c.id, Math.round(90 - (40 * i) / Math.max(1, byRev.length - 1))]));
      }
      seasonGrounds(g, club, gr, today, tier, Math.max(club.reputation ?? 50, sizeRep.get(club.id) ?? 50));
    }
    if (gr.lastMonth !== month) { gr.lastMonth = month; monthlyGrounds(g, club, gr, today, year); }
  }
  scanMatches(g, today, year);
  const mine = g.clubs[g.managedClubId];
  if (mine?.grounds && !(g as any).simAutoManage) {
    advanceProjects(g, mine, mine.grounds, today);
    advanceTalk(g, mine, mine.grounds, today);
    reportLog(g, mine.grounds, today);
  }
}

function monthlyGrounds(g: Game, club: Club, gr: ClubGrounds, today: string, year: number): void {
  const mine = club.id === g.managedClubId;
  let inc = 0, cost = 0;
  for (const it of monthlyItems(club, gr, year)) {
    if (!it.amount) continue;
    book(club.finances, today, it.amount, it.amount > 0 ? it.kind : 'facilities', `Umfeld: ${it.label} (Monat)`, mine);
    if (it.amount > 0) inc += it.amount; else cost -= it.amount;
  }
  addGroundsStats(gr, today, inc, cost);
  wearMonthly(gr, year);
  // Auslastung: nur die Änderung des Umfeld-Bonus anwenden (umkehrbar, kein Aufschaukeln).
  const bonus = groundsAttendanceBonus(club, gr, year);
  const delta = bonus - (gr.attApplied ?? 0);
  if (Math.abs(delta) > 0.0005) {
    club.stadium.averageAttendanceRate = clamp(club.stadium.averageAttendanceRate + delta, 0.3, 0.98);
    gr.attApplied = bonus;
  }
}

// -----------------------------------------------------------------------------
// Spiele: Ausschreitungen, Strafen, Polizeigebühren
// -----------------------------------------------------------------------------
function scanMatches(g: Game, today: string, year: number): void {
  const since = new Map<string, string>();
  for (const c of Object.values(g.clubs)) if (c.grounds) since.set(c.id, c.grounds.lastScan ?? today);
  for (const m of g.fixtures) {
    if (m.status !== 'finished' || !m.result || m.date > today) continue;
    const home = g.clubs[m.homeClubId];
    const gr = home?.grounds;
    if (!gr || m.date <= (since.get(home.id) ?? today)) continue;
    const away = g.clubs[m.awayClubId];
    const mine = home.id === g.managedClubId;
    const derby = !!away && (home.city === away.city || sameRegion(home.city ?? '', away.city ?? '')
      || (mine && !!g.environment?.rivals.includes(away.id)));
    const mood = mine ? g.environment?.fanMood ?? 55 : 55;
    const scale = economyScale(year);
    if (Math.random() < incidentRisk(gr, year, derby, mood)) {
      const r = Math.random();
      const sev = r < 0.6 ? 1 : r < 0.9 ? 2 : 3;
      const fine = Math.round((FINE_BASE * sev * scale) / 1000) * 1000;
      book(home.finances, m.date, -fine, 'other', `DFB-Geldstrafe: Zuschauerausschreitungen${away ? ` gegen ${away.shortName}` : ''}`, mine);
      if (year >= 1980 && year < 1993) home.stadium.averageAttendanceRate = clamp(home.stadium.averageAttendanceRate - 0.004 * sev, 0.3, 0.98);
      const what = year < 1993 ? (sev >= 2 ? 'Schlägereien auf den Rängen und vor dem Stadion' : 'Rangeleien im Block') : year < 2005 ? 'Ausschreitungen im Gästeblock' : (sev >= 2 ? 'Pyrotechnik und Platzsturm-Versuch' : 'gezündete Pyrotechnik');
      pushLog(gr, { date: m.date, kind: 'incident', amount: fine, text: `${what}${away ? ` beim Spiel gegen ${away.name}` : ''}. Der DFB verhängt ${formatMoney(fine, year)} Geldstrafe.` }, !mine);
      addGroundsStats(gr, m.date, 0, fine, { fines: fine, incidents: 1 });
    }
    const share = policeFeeShare(year);
    if (derby && share > 0) {
      const sl = levelDef('stewards', levelOf(gr, 'stewards'))?.risk ?? 0;
      const fee = Math.round((POLICE_FEE_BASE * scale * share * (1 - 0.5 * sl)) / 1000) * 1000;
      book(home.finances, m.date, -fee, 'other', `Polizeigebühr Hochrisikospiel${away ? ` gegen ${away.shortName}` : ''}`, mine);
      pushLog(gr, { date: m.date, kind: 'police', amount: fee, text: `Das Land stellt für den Polizeieinsatz beim Hochrisikospiel${away ? ` gegen ${away.name}` : ''} ${formatMoney(fee, year)} in Rechnung.` }, !mine);
      addGroundsStats(gr, m.date, 0, fee, { fines: fee });
    }
  }
  for (const c of Object.values(g.clubs)) if (c.grounds) c.grounds.lastScan = today;
}

function reportLog(g: Game, gr: ClubGrounds, today: string): void {
  const titles = { chaos: 'Anreise-Chaos am Stadion', incident: 'Ausschreitungen beim Heimspiel', police: 'Rechnung für den Polizeieinsatz', license: 'Lizenzauflage', info: 'Vereinsgelände' };
  const from = { chaos: 'Stadionbetrieb', incident: 'Sicherheitsbeauftragter', police: 'Finanzabteilung', license: 'DFB-Lizenzierung', info: 'Bauleitung' };
  for (const e of gr.log) {
    if (e.shown) continue;
    e.shown = true;
    const hint = e.kind === 'chaos' ? '\n\nMehr Parkplätze oder eine bessere ÖPNV-Anbindung entlasten die Anreise (Verein → Vereinsgelände).'
      : e.kind === 'incident' ? '\n\nOrdnungsdienst, Fanprojekt und Fanräume senken das Risiko (Verein → Vereinsgelände).' : '';
    msg(g, today, from[e.kind], titles[e.kind], e.text + hint, e.text);
  }
}

// -----------------------------------------------------------------------------
// Saisonwechsel: Marke, Lizenz, KI-Ausbau
// -----------------------------------------------------------------------------
function seasonGrounds(g: Game, club: Club, gr: ClubGrounds, today: string, tier: number, aiRep: number): void {
  const year = yearOf(today);
  // Marke: Medien, Handel, Hospitality, Museum wirken jede Saison ein wenig.
  const b = ensureBrand(club);
  for (const m of GROUNDS_MODULES) {
    const st = gr.modules[m.key];
    const d = levelDef(m.key, st?.level ?? 0);
    if (!d?.brand) continue;
    const cm = condMult(st, m, year);
    b.regional = clamp(b.regional + (d.brand.regional ?? 0) * cm, 0, 100);
    b.national = clamp(b.national + (d.brand.national ?? 0) * cm, 0, 100);
    b.international = clamp(b.international + (d.brand.international ?? 0) * cm, 0, 100);
  }
  const auto = !isMine(g, club);
  // Lizenzauflagen (1. und 2. Liga).
  const missing: string[] = [];
  for (const key of ['floodlight', 'press'] as const) {
    const need = licenseMin(key, tier, year);
    if (levelOf(gr, key) >= need) continue;
    if (auto) {
      for (let l = levelOf(gr, key) + 1; l <= need; l++) {
        const cost = buildCost(key, l, year);
        if (cost) book(club.finances, today, -cost, 'facilities', `Lizenzauflage: ${levelDef(key, l)!.name}`, false);
        gr.modules[key] = { level: l, condition: 100, builtYear: year };
      }
    } else missing.push(`${GROUNDS_BY_KEY[key].name}: mindestens „${levelDef(key, need)!.name}“`);
  }
  if (!auto) {
    if (missing.length) {
      gr.licenseStrikes = (gr.licenseStrikes ?? 0) + 1;
      const fine = Math.round((LICENSE_FINE * missing.length * gr.licenseStrikes * economyScale(year)) / 1000) * 1000;
      book(club.finances, today, -fine, 'other', 'Lizenzauflage nicht erfüllt (Geldstrafe)', true);
      if (gr.licenseStrikes >= 2) club.boardConfidence = clamp((club.boardConfidence ?? 60) - 5, 0, 100);
      pushLog(gr, { date: today, kind: 'license', amount: fine, text: `Die Lizenz wird nur unter Auflagen erteilt. Es fehlt:\n- ${missing.join('\n- ')}\n\nGeldstrafe: ${formatMoney(fine, year)}${gr.licenseStrikes >= 2 ? `. Zum ${gr.licenseStrikes}. Mal in Folge – die Strafe steigt, der Vorstand verliert Vertrauen.` : '. Im Wiederholungsfall steigt die Strafe.'}` });
      addGroundsStats(gr, today, 0, fine, { fines: fine });
    } else gr.licenseStrikes = 0;
  }
  if (auto) aiBuild(club, gr, today, year, tier, aiRep);
}

const AI_ORDER: GroundsModuleKey[] = ['stewards', 'parking', 'transit', 'hospitality', 'vereinsheim', 'familyBlock', 'fanProject', 'onlineShop', 'megastore', 'press', 'choreoRoom', 'tours', 'museum', 'fanZone', 'floodlight'];

/** KI-Vereine (und der eigene Verein in der Simulation) bauen vereinfacht nach Budget und Größe. */
export function aiBuild(club: Club, gr: ClubGrounds, today: string, year: number, tier: number, effRep?: number): void {
  const rev = lastRevenue(club, year, tier);
  let budget = Math.max(0, club.finances.balance - 0.25 * rev) * 0.3;
  let builds = 0;
  const rep = effRep ?? club.reputation ?? 60;
  // Erst sanieren (Werterhalt), dann ausbauen.
  for (const m of GROUNDS_MODULES) {
    const st = gr.modules[m.key];
    const rc = renovateCost(gr, m.key, year);
    if (st && st.condition < 50 && rc > 0 && rc <= budget) {
      book(club.finances, today, -rc, 'facilities', `Sanierung ${m.name}`, false);
      st.condition = 100; st.builtYear = year; budget -= rc;
    }
  }
  for (const key of AI_ORDER) {
    if (builds >= 2 || budget <= 0) break;
    const m = GROUNDS_BY_KEY[key];
    if ((key === 'fanProject' || key === 'choreoRoom' || key === 'museum') && (club.id.length + key.length) % 3 === 0) continue;
    let target = typicalLevel(m, rep, year, 0);
    // Überlastete Anreise: Parken und ÖPNV haben Vorrang, auch unterhalb der Ruf-Schwelle.
    if ((key === 'parking' || key === 'transit') && accessInfo(club, gr, year, typicalAttendance(club)).ratio < 1) target = Math.max(target, levelOf(gr, key) + 1);
    const cur = levelOf(gr, key);
    if (cur >= target) continue;
    let chk = checkNext(club, gr, key, year);
    if (!chk.ok && chk.areaNeed > 0 && /Fläche/.test(chk.reason ?? '')) {
      const lp = landPrice(gr, year);
      if (lp != null && lp + chk.cost <= budget) {
        book(club.finances, today, -lp, 'facilities', 'Grundstückskauf', false);
        gr.area += LAND_PARCEL; gr.landBought++; budget -= lp;
        chk = checkNext(club, gr, key, year);
      }
    }
    if (!chk.ok || chk.cost > budget) continue;
    if (chk.cost) book(club.finances, today, -chk.cost, 'facilities', `Ausbau ${m.name}: ${chk.def!.name}`, false);
    gr.modules[key] = { level: chk.level, condition: 100, builtYear: year, months: key === 'fanProject' ? 0 : undefined };
    budget -= chk.cost; builds++;
  }
}

// -----------------------------------------------------------------------------
// Aktionen des Managers
// -----------------------------------------------------------------------------
export function startGroundsBuild(g: Game, key: GroundsModuleKey): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const gr = ensureClubGrounds(club, today);
  const m = GROUNDS_BY_KEY[key];
  if (m.negotiated && levelOf(gr, key) >= 1) return startTransitTalk(g);
  const chk = checkNext(club, gr, key, year);
  if (!chk.ok) return { ok: false, text: chk.reason ?? 'Nicht möglich.' };
  if (gr.projects.length >= 2) return { ok: false, text: 'Es laufen bereits zwei Bauvorhaben.' };
  if (chk.cost) book(club.finances, today, -chk.cost, 'facilities', `Bauvorhaben ${m.name}: ${chk.def!.name}`, true);
  const p: GroundsProject = { id: `gp_${today}_${key}`, module: key, targetLevel: chk.level, phase: 'build', phaseEnd: addDays(today, chk.def!.days), cost: chk.cost };
  if (chk.def!.permit) {
    p.phase = 'permit';
    p.phaseEnd = addDays(today, permitMonths(year) * 30);
    const risk = LOCATIONS[gr.location].protest * m.noise * (year >= 1990 ? 1.2 : 1);
    p.protest = Math.random() < risk ? (Math.random() < 0.35 ? 'abgelehnt' : 'auflage') : 'none';
  }
  gr.projects.push(p);
  const text = p.phase === 'permit'
    ? `Bauantrag für „${chk.def!.name}“ gestellt. Die Genehmigung dauert etwa ${Math.round(permitMonths(year))} Monate, danach ${Math.round(chk.def!.days / 30)} Monate Bauzeit.`
    : `Baubeginn: „${chk.def!.name}“, fertig in etwa ${Math.max(1, Math.round(chk.def!.days / 30))} Monat(en).`;
  return { ok: true, text };
}

function advanceProjects(g: Game, club: Club, gr: ClubGrounds, today: string): void {
  const year = yearOf(today);
  for (const p of [...gr.projects]) {
    const def = levelDef(p.module, p.targetLevel)!;
    if (p.phase === 'permit' && p.protest && p.protest !== 'none' && !p.protestShown) {
      const half = addDays(p.phaseEnd, -permitMonths(year) * 15);
      if (today >= half) {
        p.protestShown = true;
        p.phaseEnd = addDays(p.phaseEnd, 30 + Math.round(Math.random() * 30));
        msg(g, today, 'Bauamt', `Anwohner protestieren: ${def.name}`,
          `Eine Bürgerinitiative wehrt sich gegen „${def.name}“ (Lärm, Verkehr, Licht). Das Genehmigungsverfahren verzögert sich um ein bis zwei Monate.`
          + (LOCATIONS[gr.location].protest > 0.3 ? '\n\nIn deiner Lage sind die Nachbarn nah dran – Proteste sind hier häufiger.' : ''));
      }
    }
    if (today < p.phaseEnd) continue;
    if (p.phase === 'permit') {
      if (p.protest === 'abgelehnt') {
        const refund = Math.round(p.cost * 0.9);
        if (refund) book(club.finances, today, refund, 'other', `Rückerstattung abgelehntes Bauvorhaben ${def.name}`, true);
        gr.projects = gr.projects.filter((x) => x !== p);
        msg(g, today, 'Bauamt', `Bauantrag abgelehnt: ${def.name}`, `Nach den Anwohnerprotesten lehnt die Stadt den Bauantrag ab. 90 % der Kosten (${formatMoney(refund, year)}) fließen zurück, die Planungskosten sind verloren. Du kannst es später erneut versuchen.`);
        continue;
      }
      if (p.protest === 'auflage') {
        const extra = Math.round(p.cost * 0.12);
        if (extra) book(club.finances, today, -extra, 'facilities', `Auflagen (Lärmschutz) ${def.name}`, true);
        p.cost += extra;
      }
      p.phase = 'build';
      p.phaseEnd = addDays(today, def.days);
      msg(g, today, 'Bauamt', `Baugenehmigung erteilt: ${def.name}`,
        `Die Stadt genehmigt „${def.name}“${p.protest === 'auflage' ? ' unter Auflagen (Lärmschutz, Ruhezeiten). Die Mehrkosten von 12 % wurden gebucht' : ''}. Baubeginn ist sofort, Fertigstellung in etwa ${Math.max(1, Math.round(def.days / 30))} Monaten.`);
      continue;
    }
    gr.modules[p.module] = { level: p.targetLevel, condition: 100, builtYear: year, months: p.module === 'fanProject' ? gr.modules.fanProject?.months ?? 0 : undefined };
    gr.projects = gr.projects.filter((x) => x !== p);
    msg(g, today, 'Bauleitung', `Fertig: ${def.name}`, `„${def.name}“ (${GROUNDS_BY_KEY[p.module].name}, Stufe ${p.targetLevel}) ist fertig und ab sofort in Betrieb.`);
  }
}

/** Verhandlung mit der Stadt über die nächste ÖPNV-Stufe (ab Stufe 2). */
export function startTransitTalk(g: Game): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const gr = ensureClubGrounds(club, today);
  if (gr.talkCooldown && today < gr.talkCooldown) return { ok: false, text: `Die Stadt verhandelt frühestens wieder ab ${gr.talkCooldown.split('-').reverse().join('.')}.` };
  const chk = checkNext(club, gr, 'transit', year);
  if (!chk.ok) return { ok: false, text: chk.reason ?? 'Nicht möglich.' };
  const loc = gr.location;
  const recent = gr.log.filter((e) => e.kind === 'incident' && e.date >= addDays(today, -365)).length;
  const p = clamp(0.35 + (club.reputation ?? 50) / 200 + (loc === 'innenstadt' ? 0.1 : loc === 'stadtrand' ? -0.05 : 0)
    + (chk.level === 3 ? 0.1 : 0) - recent * 0.05, 0.15, 0.9);
  gr.talk = { targetLevel: chk.level, decideDate: addDays(today, 42 + Math.round(Math.random() * 28)), clubShare: chk.cost, accepted: Math.random() < p };
  return { ok: true, text: `Gespräche mit Stadt und Verkehrsbetrieben über „${chk.def!.name}“ laufen. Eine Entscheidung fällt in sechs bis zehn Wochen (Chance etwa ${Math.round(p * 100)} %).` };
}

function advanceTalk(g: Game, club: Club, gr: ClubGrounds, today: string): void {
  const t = gr.talk;
  if (!t || today < t.decideDate) return;
  const year = yearOf(today);
  gr.talk = undefined;
  const def = levelDef('transit', t.targetLevel)!;
  if (!t.accepted) {
    gr.talkCooldown = addDays(today, 180);
    msg(g, today, 'Stadtverwaltung', `ÖPNV: Stadt lehnt ab`, `Die Stadt sieht für „${def.name}“ derzeit kein Geld im Haushalt. Neue Gespräche sind in einem halben Jahr möglich. Bessere Chancen hast du mit mehr Ansehen und ohne Ausschreitungen.`);
    return;
  }
  if (t.clubShare) book(club.finances, today, -t.clubShare, 'facilities', `Vereinsanteil ÖPNV: ${def.name}`, true);
  if (def.days > 60) {
    gr.projects.push({ id: `gp_${today}_transit`, module: 'transit', targetLevel: t.targetLevel, phase: 'build', phaseEnd: addDays(today, def.days), cost: t.clubShare });
  } else gr.modules.transit = { level: t.targetLevel, condition: 100, builtYear: year };
  msg(g, today, 'Stadtverwaltung', `ÖPNV: Einigung mit der Stadt`, `Die Stadt stimmt „${def.name}“ zu.${t.clubShare ? ` Der Vereinsanteil von ${formatMoney(t.clubShare, year)} wurde gebucht.` : ''}${def.days > 60 ? ` Der Bau dauert etwa ${Math.round(def.days / 30)} Monate.` : ' Gilt ab dem nächsten Heimspiel.'}`);
}

export function buyGroundsLand(g: Game): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const gr = ensureClubGrounds(club, today);
  const price = landPrice(gr, year);
  if (price == null) return { ok: false, text: 'Rund um das Stadion ist kein Grundstück mehr zu haben.' };
  if (club.finances.balance < price) return { ok: false, text: 'Kontostand zu niedrig.' };
  book(club.finances, today, -price, 'facilities', `Grundstückskauf (+${LAND_PARCEL} Parzellen)`, true);
  gr.area += LAND_PARCEL; gr.landBought++;
  return { ok: true, text: `Grundstück gekauft: +${LAND_PARCEL} Parzellen für ${formatMoney(price, year)}.` };
}

export function renovateGrounds(g: Game, key: GroundsModuleKey): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const gr = ensureClubGrounds(club, today);
  const st = gr.modules[key];
  const cost = renovateCost(gr, key, year);
  if (!st || cost <= 0) return { ok: false, text: 'Keine Sanierung nötig.' };
  if (club.finances.balance < cost) return { ok: false, text: 'Kontostand zu niedrig.' };
  book(club.finances, today, -cost, 'facilities', `Sanierung ${GROUNDS_BY_KEY[key].name}`, true);
  st.condition = 100; st.builtYear = year;
  return { ok: true, text: `${GROUNDS_BY_KEY[key].name} saniert und modernisiert (${formatMoney(cost, year)}).` };
}

/** Abriss der obersten Stufe: gibt Fläche frei, keine Erstattung. */
export function demolishGrounds(g: Game, key: GroundsModuleKey): { ok: boolean; text: string } {
  const club = g.clubs[g.managedClubId];
  const gr = ensureClubGrounds(club, g.calendar.currentDate);
  const st = gr.modules[key];
  if (!st || st.level < 1 || gr.projects.some((p) => p.module === key)) return { ok: false, text: 'Nichts abzureißen.' };
  const name = levelDef(key, st.level)!.name;
  st.level -= 1;
  if (st.level <= 0) delete gr.modules[key];
  return { ok: true, text: `„${name}“ abgerissen. Fläche frei: ${gr.area - areaUsed(club, gr)} Parzellen.` };
}
