// Reiter „Stationen“ (Vorbild EA Fussball Manager): frühere Stationen Von–bis/Mannschaft/Ablöse/
// Spiele/Tore (aus Transfers + Saisonbilanzen, engine/history.ts), Vereinsspiele der laufenden
// Saison je Wettbewerb (engine/compStats.ts), Saisonbilanzen, Auszeichnungen (Die Besten der
// Saison, Goldener Ball) und Titel mit dem Verein (game/trophyCabinet.ts). Nur vorhandene Daten.
import { useMemo } from 'react';
import type { CareerStation, Club, Player, TransferRecord } from '../../types';
import type { Game } from '../../game/state';
import { useClubProfile } from '../club/ClubLink';
import { TeamName } from '../../views/statistiken/competition/parts';
import { formatMoneyShort } from '../../engine/economy';
import { compStatsOf, type CompTuple } from '../../engine/compStats';
import { AWARD_CATS, AWARD_CAT_LABEL } from '../../engine/seasonAwards';
import { awardsState } from '../../game/seasonAwardsGame';
import { goldenBallState } from '../../game/goldenBallGame';
import { trophiesOf } from '../../game/trophyCabinet';
import { InfoTip } from '../../ui/InfoTip';
import { Section, utcDate } from './shared';

interface Spell { club: string; from?: string; to?: string; fee?: number; kind?: string; apps: number; goals: number; current: boolean }

const seasonEnd = (season: string) => `${Number(season.slice(0, 4)) + 1}-06-30`;
const seasonStart = (season: string) => `${season.slice(0, 4)}-07-01`;

function kindOf(g: Game | undefined, p: Player, t: TransferRecord): string | undefined {
  for (const w of g?.transferLog?.wins ?? []) {
    const e = w.e.find((x) => x.p === p.id && x.d === t.date);
    if (e?.k) return e.k;
  }
  return undefined;
}

/** Vereinsstationen: an jedem Wechsel getrennt, Saisonbilanzen der passenden Station zugeordnet. */
export function spellsOf(g: Game | undefined, p: Player, clubName: string): Spell[] {
  const tr = [...(p.history?.transfers ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const out: Spell[] = [];
  if (!tr.length) out.push({ club: clubName, apps: 0, goals: 0, current: true });
  else {
    out.push({ club: tr[0].fromClub, to: tr[0].date, apps: 0, goals: 0, current: false });
    tr.forEach((t, i) => out.push({
      club: t.toClub, from: t.date, to: tr[i + 1]?.date, fee: t.fee, kind: kindOf(g, p, t),
      apps: 0, goals: 0, current: i === tr.length - 1,
    }));
  }
  const add = (st: CareerStation) => {
    const named = out.filter((s) => s.club === st.clubName);
    const hit = named.find((s) => (!s.from || s.from <= seasonEnd(st.season)) && (!s.to || s.to >= seasonStart(st.season))) ?? named[0];
    if (hit) { hit.apps += st.appearances; hit.goals += st.goals; }
  };
  for (const st of p.history?.stations ?? []) add(st);
  const cur = out[out.length - 1];
  cur.apps += p.seasonStats.appearances; cur.goals += p.seasonStats.goals;
  return out.reverse();
}

function feeText(s: Spell): string {
  if (s.fee == null) return '–';
  if (s.kind === 'loan') return 'Leihe';
  if (s.kind === 'back') return 'Leihende';
  return s.fee > 0 ? formatMoneyShort(s.fee, Number(s.from!.slice(0, 4))) : 'ablösefrei';
}

/** Statistik je Wettbewerb der laufenden Saison (Europapokal 2.0 liegt am Wettbewerb). */
function compRows(g: Game | undefined, p: Player): { label: string; t?: CompTuple }[] {
  const cs = compStatsOf(p) ?? {};
  let e: CompTuple | undefined = cs.E ? [...cs.E] as CompTuple : undefined;
  for (const cup of Object.values(g?.euroCups ?? {})) {
    const x = cup?.xstats?.[p.id];
    if (!x) continue;
    e ??= [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 7; i++) e[i] += x[i];
  }
  return [{ label: 'Liga', t: cs.L }, { label: 'Pokal', t: cs.P }, { label: 'Europapokal', t: e }];
}

const CAT_BEST: Record<string, string> = { GK: 'Bester Torwart', DEF: 'Bester Abwehrspieler', MID: 'Bester Mittelfeldspieler', ATT: 'Bester Stürmer' };

function honoursOf(g: Game | undefined, p: Player) {
  const list: { when: string; what: string; where?: string; top: boolean }[] = [];
  let sds = 0, gb = 0;
  for (const s of awardsState(g as Game)?.seasons ?? []) {
    for (const cat of AWARD_CATS) {
      const i = s.cats[cat].findIndex((e) => e.p === p.id);
      if (i < 0) continue;
      if (i === 0 && s.best === cat) { sds++; list.push({ when: s.season, what: 'Spieler der Saison', where: s.divName, top: true }); }
      list.push({ when: s.season, what: i === 0 ? CAT_BEST[cat] : `Platz ${i + 1} · ${AWARD_CAT_LABEL[cat]}`, where: s.divName, top: i === 0 });
    }
    if (s.rookie?.p === p.id) list.push({ when: s.season, what: 'Newcomer der Saison', where: s.divName, top: true });
  }
  for (const y of goldenBallState(g as Game)?.years ?? []) {
    const i = y.top.findIndex((e) => e.p === p.id);
    if (i < 0) continue;
    if (i === 0) gb++;
    list.push({ when: String(y.year), what: i === 0 ? y.title : `${y.title} · Platz ${i + 1}`, top: i === 0 });
  }
  return { list: list.sort((a, b) => b.when.localeCompare(a.when)), sds, gb };
}

function titlesWith(g: Game | undefined, p: Player): { season: string; title: string; club: string }[] {
  if (!g) return [];
  const out: { season: string; title: string; club: string }[] = [];
  const cache = new Map<string, ReturnType<typeof trophiesOf>>();
  for (const st of p.history?.stations ?? []) {
    if (!g.clubs[st.clubId]) continue;
    let list = cache.get(st.clubId);
    if (!list) { try { list = trophiesOf(g, st.clubId); } catch { list = []; } cache.set(st.clubId, list); }
    for (const t of list) if (t.season === st.season && t.cat !== 'jugend') out.push({ season: st.season, title: t.title, club: st.clubName });
  }
  return out.reverse();
}

const dash = (n: number | undefined) => (n ? n : '–');

/** Verein über den gespeicherten Namen finden (voller Kader, Sim-Verein, Ausland). */
function clubIdByName(g: Game | undefined, name: string): string | null {
  if (!g || !name) return null;
  for (const c of Object.values(g.clubs)) if (c.name === name) return c.id;
  for (const c of Object.values(g.simClubs ?? {})) if (c.name === name) return c.id;
  for (const c of Object.values(g.euroClubs ?? {})) if (c.name === name) return c.id;
  return null;
}

/** Wunsch Pascal: Vereine in den Stationen mit Wappen und als Link zum Vereinsprofil. */
function ClubCell({ g, name, season }: { g: Game | undefined; name: string; season?: string }) {
  const id = clubIdByName(g, name);
  if (!g || !id) return <>{name}</>;
  return <TeamName g={g} id={id} season={season ?? g.season} size={22} />;
}

export default function CareerTab({ p, club, season }: { p: Player; club?: Club; season?: string }) {
  const g = useClubProfile()?.game;
  const clubName = club?.name ?? g?.clubs[p.clubId]?.name ?? '—';
  const spells = useMemo(() => spellsOf(g, p, clubName), [g, p, clubName]);
  const comps = compRows(g, p);
  const hon = useMemo(() => honoursOf(g, p), [g, p]);
  const titles = useMemo(() => titlesWith(g, p), [g, p]);
  const stations = [...(p.history?.stations ?? [])].reverse();
  const c = p.careerStats;
  return (
    <div className="pp3-career">
      <Section title={<>Frühere Stationen<InfoTip k="stationen" /></>}>
        <table className="pp-table pp3-table pp3-spells">
          <thead><tr><th>Von – bis</th><th>Mannschaft</th><th className="num">Ablöse</th><th className="num">Sp.</th><th className="num">Tore</th></tr></thead>
          <tbody>
            {spells.map((s, i) => (
              <tr key={i} className={s.current ? 'pp3-cur' : undefined}>
                <td>{s.from ? `${utcDate(s.from)} – ${s.current ? 'offen' : s.to ? utcDate(s.to) : '–'}` : s.current ? 'seit Spielbeginn' : `bis ${s.to ? utcDate(s.to) : '–'}`}</td>
                <td><ClubCell g={g} name={s.club} /></td>
                <td className="num">{feeText(s)}</td>
                <td className="num">{s.apps}</td>
                <td className="num">{s.goals}</td>
              </tr>
            ))}
            <tr className="pp-row-total"><td>Gesamte Karriere</td><td /><td /><td className="num">{c.appearances}</td><td className="num">{c.goals}</td></tr>
          </tbody>
        </table>
      </Section>

      <Section title="Vereinsspiele je Wettbewerb" right={season}>
        <table className="pp-table pp3-table pp3-comp">
          <thead><tr><th>Wettbewerb</th><th className="num">Sp.</th><th className="num">Tore</th><th className="num">Vorl.</th><th className="num">GK</th><th className="num">GRK</th><th className="num">RK</th><th className="num">Ø Note</th></tr></thead>
          <tbody>
            {comps.map(({ label, t }) => (
              <tr key={label}>
                <td>{label}</td><td className="num">{t?.[0] ?? 0}</td><td className="num">{dash(t?.[1])}</td><td className="num">{dash(t?.[2])}</td>
                <td className="num">{dash(t?.[3])}</td><td className="num">{dash(t?.[4])}</td><td className="num">{dash(t?.[5])}</td>
                <td className="num">{t?.[8] ? ((t[7] ?? 0) / t[8]).toFixed(2) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Auszeichnungen" right={hon.list.length ? `${hon.list.length}` : undefined}>
        <div className="pp3-honsum">
          <div><b>{hon.sds}</b><span>Spieler der Saison</span></div>
          <div><b>{hon.gb}</b><span>Goldener Ball</span></div>
          <div><b>{titles.length}</b><span>Titel mit dem Verein</span></div>
        </div>
        {hon.list.length === 0 && titles.length === 0 && <div className="pp-note">Noch keine Ehrung und kein Titel seit Spielbeginn.</div>}
        {(hon.list.length > 0 || titles.length > 0) && (
          <div className="pp3-honlist">
            {hon.list.map((h, i) => (
              <div key={'h' + i} className={`pp3-hon${h.top ? ' top' : ''}`}><span className="w">{h.when}</span><b>{h.what}</b><span className="dim">{h.where ?? ''}</span></div>
            ))}
            {titles.map((t, i) => (
              <div key={'t' + i} className="pp3-hon"><span className="w">{t.season}</span><b>{t.title}</b><span className="dim">{t.club}</span></div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Saisonbilanzen">
        <table className="pp-table pp3-table pp3-seasons">
          <thead><tr><th>Saison</th><th>Verein</th><th className="num">Sp.</th><th className="num">Tore</th><th className="num">Vorl.</th><th className="num">Ø Note</th></tr></thead>
          <tbody>
            <tr className="pp3-cur">
              <td>{season ?? 'aktuell'}</td><td><span className="pp3-clubcell"><ClubCell g={g} name={clubName} /> <span className="dim">(läuft)</span></span></td>
              <td className="num">{p.seasonStats.appearances}</td><td className="num">{p.seasonStats.goals}</td><td className="num">{p.seasonStats.assists}</td>
              <td className="num">{p.seasonStats.averageRating > 0 ? p.seasonStats.averageRating.toFixed(2) : '–'}</td>
            </tr>
            {stations.slice(0, 20).map((st, i) => (
              <tr key={i}>
                <td>{st.season}</td><td><ClubCell g={g} name={st.clubName} season={st.season} /></td><td className="num">{st.appearances}</td><td className="num">{st.goals}</td>
                <td className="num">{st.assists}</td><td className="num">{st.averageRating > 0 ? st.averageRating.toFixed(2) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stations.length === 0 && <div className="pp-note">Frühere Saisons werden zum Saisonende festgehalten.</div>}
      </Section>
    </div>
  );
}
