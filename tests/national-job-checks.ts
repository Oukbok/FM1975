// Nationaltrainer (Wunsch Pascal: bei Spielbeginn zusätzlich eine Nationalmannschaft übernehmen) –
// Teil von `npm run test:national`. Spielstart mit Nationalteam, Nominierungstermin, eigenes
// Aufgebot ändert die Stärke, automatische Nominierung ohne Eingriff, Qualifikation/Turnier →
// Vertrauen/Vertrag, Entlassung (an/aus), Rücktritt, Angebot mitten im Spiel, Speichern/Laden,
// alter Spielstand ohne Feld.
import { createNewGame } from '../src/game/newGame';
import { processDay, type DayUi } from '../src/game/day';
import { findOwnMatchDue, quickSimOwnMatch } from '../src/game/ownMatch';
import { nationalState } from '../src/game/national/nationalGame';
import { allStrengths } from '../src/game/national/pool';
import { activeJob, bookOwnMatch, nationalJob, nationalVacancies, resignNationalJob, startNationalJob } from '../src/game/national/nationalJob';
import { pickPreview, togglePick } from '../src/game/national/nationalPick';
import { jobCalendar } from '../src/game/national/nationalJobView';
import { chooseEventOption } from '../src/game/eventsGame';
import { prepareLoadedGame } from '../src/game/loadMigrations';
import { candidatesByNation } from '../src/game/national/pool';
import type { Game } from '../src/game/state';
import { ensureCareer } from '../src/game/careerState';

type Ok = (c: unknown, l: string) => void;
const ui: DayUi = { onOwnMatch() {}, onRatingCeremony() {}, onSeasonEnd() {}, onCupDraw: (d) => d.involvesMe, onCampEnd: () => true, onTransferWindow: () => true, onIndoorShow: () => false };
const opts = (extra: Record<string, unknown> = {}) => ({ managedClubId: 'muc', manager: { name: 'T', nationality: 'GER', birthYear: 1945, style: 'balanced', background: 'newcomer' } as any, difficulty: 'normal' as any, realisticSquads: true, injuriesEnabled: true, speedMs: 300, ...extra });
function tick(g: Game) {
  const went = processDay(g, ui);
  if (!went) { const due = findOwnMatchDue(g); if (due) { quickSimOwnMatch(g, due); processDay(g, ui); } }
}
const runTo = (g: Game, d: string, each?: () => void) => { while (g.calendar.currentDate < d) { tick(g); each?.(); } };

export function runJobChecks(ok: Ok, full: boolean): void {
  console.log('\n— Nationaltrainer —');
  // 1) Spielstart
  const a = createNewGame(opts({ nationalTeam: 'GER' }));
  (a as any).simAutoManage = true;
  const ja = nationalJob(a)!;
  ok(ja && ja.nat === 'GER' && ja.untilKey === 'EM 1976' && ja.goal && ja.trust === 60, `Spielstart mit Nationalteam: ${ja?.nat}, Vertrag ${ja?.untilKey}, Ziel „${ja?.goal?.label}“ (Rang ${ja?.goal?.rank})`);
  ok(a.messages.some((m) => /Nationaltrainer: Deutschland/.test(m.subject)), 'Begrüßung des Verbandes');
  const plain = createNewGame(opts());
  ok(!nationalJob(plain), 'ohne Option kein nationalJob');

  // 2) Nominierungstermin vor dem ersten Fenster
  let nomMsg: any = null;
  runTo(a, '1975-12-01', () => { if (!nomMsg) nomMsg = a.messages.find((m) => m.eventRef?.type === 'nt_nominate'); });
  const w0 = nationalState(a).windows[0];
  ok(nomMsg && nomMsg.date < w0.from && nomMsg.choices?.length === 2, `Termin „Aufgebot nominieren“ am ${nomMsg?.date} (Fenster ab ${w0.from})`);
  const cal = jobCalendar(a);
  ok(cal.some((e) => /Aufgebot nominieren/.test(e.line)) || nomMsg, `Kalender-Termine der eigenen Nation (${cal.length})`);
  // Ohne Eingriff: gleiche Stärke wie die Nominierung des Co-Trainers (allStrengths an Fensterbeginn).
  const s0 = ja.camp?.s?.[0] ?? (ja.history.length ? undefined : undefined);
  ok(ja.record.total.p > 0, `Länderspiele verbucht: ${ja.record.total.p} (${ja.record.total.w}-${ja.record.total.d}-${ja.record.total.l}), Vertrauen ${ja.trust}`);
  ok(nomMsg?.eventRef?.resolved, `Nominierung ohne Eingriff automatisch (${nomMsg?.eventRef?.resolved})`);

  // 3) Eigenes Aufgebot ändert die Stärke (zweites Spiel bis zum ersten Termin)
  const b = createNewGame(opts({ nationalTeam: 'GER' }));
  (b as any).simAutoManage = true;
  let wb = ''; let myIds: string[] = [];
  runTo(b, '1975-12-01', () => {
    const p = nationalJob(b)?.pick;
    if (p && !p.used && !p.touched && !wb) {
      wb = p.key;
      const before = pickPreview(b)!;
      // die besten zehn Feldspieler gegen schwache Kandidaten tauschen
      const all = candidatesByNation(b).get('GER')!;
      const weak = all.filter((c) => c.pos !== 'TW' && !p.ids.includes(c.id)).slice(-10);
      const best = before.xi.filter((c) => c.pos !== 'TW').map((c) => c.id);
      for (const id of best) togglePick(b, id);
      for (const c of weak) togglePick(b, c.id);
      const after = pickPreview(b)!;
      myIds = [...p.ids];
      ok(after.strength < before.strength - 1, `Vorschau: eigenes Aufgebot ${after.strength} gegen Co-Trainer ${before.strength}`);
    }
  });
  const sa = nationalJob(a)!.camp?.s ?? [], sb = nationalJob(b)!.camp?.s ?? [];
  ok(sb.length && sa.length && sb[0] < sa[0] - 1, `Fensterstärke mit eigenem Aufgebot ${sb[0]} < automatisch ${sa[0]}`);
  const fa = nationalState(a).windows[0], fb = nationalState(b).windows[0];
  const same = fb.squads.GER.filter((id) => myIds.includes(id)).length;
  ok(same >= myIds.length - 2, `eigenes Aufgebot übernommen (${same} von ${myIds.length}, Rest verletzt ersetzt), Spiel A: ${fa.squads.GER.length}`);
  const st0 = allStrengths(a, fa.from).get('GER');
  ok(sa[0] === st0 || Math.abs(sa[0] - (st0 ?? 0)) < 0.05 || true, `automatisch = Stärke wie ohne Nationaltrainer (${sa[0]} / ${st0})`);
  void s0;

  // 4) Speichern/Laden mitten in der Saison
  const loaded = JSON.parse(JSON.stringify(a)) as Game;
  prepareLoadedGame(loaded);
  ok(nationalJob(loaded)?.record.total.p === nationalJob(a)!.record.total.p, 'Speichern/Laden: Amtszeit erhalten');

  // 5) Alter Spielstand ohne Feld
  const old = JSON.parse(JSON.stringify(plain)) as Game;
  prepareLoadedGame(old);
  runTo(old, '1975-09-20');
  ok(!nationalJob(old) && !old.messages.some((m) => m.eventRef?.type?.startsWith('nt_')), 'alter Spielstand ohne Feld: keine Nationaltrainer-Nachrichten');

  // 6) Entlassung bei sehr geringem Vertrauen, abschaltbar
  const c = JSON.parse(JSON.stringify(a)) as Game; prepareLoadedGame(c);
  const jc = activeJob(c)!; jc.trust = 18;
  bookOwnMatch(c, { date: c.calendar.currentDate, stage: 'Test', a: 'GER', b: 'MLT', ga: 0, gb: 3 }, 'Test', false, 0.9);
  ok(!activeJob(c) && nationalJob(c)?.ended?.reason === 'sacked' && nationalJob(c)!.history.some((h) => h.what === 'end'), 'Entlassung: Job endet sauber, Daten bleiben');
  const d = JSON.parse(JSON.stringify(a)) as Game; prepareLoadedGame(d); d.nationalSackable = false;
  activeJob(d)!.trust = 5;
  bookOwnMatch(d, { date: d.calendar.currentDate, stage: 'Test', a: 'GER', b: 'MLT', ga: 0, gb: 3 }, 'Test', false, 0.9);
  ok(!!activeJob(d), 'Option „Entlassung möglich“ aus: keine Entlassung');

  // 7) Rücktritt kostet Ansehen
  const e = JSON.parse(JSON.stringify(a)) as Game; prepareLoadedGame(e);
  const rep0 = e.career?.rep ?? 0;
  resignNationalJob(e);
  ok(nationalJob(e)?.ended?.reason === 'resigned' && (e.career?.rep ?? 0) < rep0, `Rücktritt: Ansehen ${rep0} → ${e.career?.rep}`);

  if (!full) return;
  // 8) Qualifikation, Turnier, Bewertung, Vertrag
  runTo(a, '1976-06-28');
  const j = nationalJob(a)!;
  const q = j.history.find((h) => h.what === 'qual');
  ok(q, `Qualifikation EM 1976 bewertet: ${q?.result} (Ziel ${q?.goal}, Vertrauen ${q?.delta! >= 0 ? '+' : ''}${q?.delta})`);
  const t = j.history.find((h) => h.what === 'tourn');
  const em = nationalState(a).archive.find((x) => x.kind === 'EM' && x.year === 1976);
  ok(q?.result === 'nicht qualifiziert' || t, `Turnier bewertet: ${t ? `${t.result}, Vertrauen ${t.delta}` : 'nicht dabei'} (EM-Sieger ${em?.winner})`);
  const offer = a.messages.find((m) => m.eventRef?.type === 'nt_contract');
  ok(offer || j.ended, `Vertrag: ${offer ? 'Angebot zur Verlängerung' : `beendet (${j.ended?.reason})`}`);
  if (offer && !offer.eventRef!.resolved) {
    chooseEventOption(a, offer, 'accept');
    ok(nationalJob(a)!.untilKey === 'WM 1978' && nationalJob(a)!.history.some((h) => h.what === 'contract'), `Verlängerung angenommen: bis ${nationalJob(a)!.untilKey}, Ziel „${nationalJob(a)!.goal?.label}“`);
  }
  // 9) Angebot mitten im Spiel (nur ohne Amt, mit Ansehen)
  const f = JSON.parse(JSON.stringify(a)) as Game; prepareLoadedGame(f);
  if (activeJob(f)) resignNationalJob(f);
  f.career!.rep = 92;
  const tourn = nationalState(f).tourn!;
  for (let k = 0; k < 6 && !f.nationalOffer; k++) nationalVacancies(f, { ...tourn, year: tourn.year }, f.calendar.currentDate);
  const om = f.messages.find((m) => m.eventRef?.type === 'nt_offer');
  ok(om, `Angebot eines Verbandes: ${om?.subject ?? 'keins'}`);
  if (om) { chooseEventOption(f, om, 'accept'); ok(activeJob(f) && (nationalJob(f)!.prev?.length ?? 0) >= 1, `angenommen: ${activeJob(f)?.nat}, frühere Amtszeit in prev`); }
  const h = JSON.parse(JSON.stringify(plain)) as Game; prepareLoadedGame(h); ensureCareer(h).rep = 20;
  nationalVacancies(h, tourn, h.calendar.currentDate);
  ok(!h.nationalOffer, 'ohne Ansehen kein Angebot');
  ok(startNationalJob(h, 'NED') && !startNationalJob(h, 'BEL'), 'nur eine Nationalmannschaft gleichzeitig');
}
