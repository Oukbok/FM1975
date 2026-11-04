// =============================================================================
// ZENTRALE – linke Spalte: gestapelte Kurz-Widgets (Tabelle, Spiele, Budget,
// Managerstatus, Sperren/Verletzungen, Teamstatus, Taktik). Jedes Widget führt
// per Klick auf die passende Seite; Vereine/Spieler öffnen ihr Profil.
// =============================================================================
import type { ReactNode } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import { FitnessIcon, FormIcon, FreshnessIcon, MoraleIcon, statusLevel, statusWord, type StatusKind } from '../../../components/status';
import { STYLE_DE } from '../../../components/lineup/LineupSide';
import { getFormation } from '../../../data/formations';
import type { InfoKey } from '../../../data/infoTexts';
import { divisionLabel } from '../../../engine/leagues';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import { condBar, condColor, fmtDM, fmtPrice, vColor, zoneClass } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { Crest, clubShort } from '../presse/parts';
import { absences, budgetOf, ownGames, teamStatus } from './data';
import PosBadge from '../../../components/PosBadge';

type Go = (s: Screen) => void;

/** Rahmen eines Widgets: Titelzeile klein in Großbuchstaben, Klick → Zielseite. */
export function Widget({ title, info, right, to, onGoto, children, className = '' }: {
  title: string; info?: InfoKey; right?: ReactNode; to: Screen; onGoto: Go; children: ReactNode; className?: string;
}) {
  return (
    <section className={`dz-w ${className}`} role="button" tabIndex={0} onClick={() => onGoto(to)}
      onKeyDown={(e) => { if (e.key === 'Enter') onGoto(to); }}>
      <div className="dz-wh">
        <span className="dz-wt">{title}{info && <InfoTip k={info} />}</span>
        {right != null && <span className="dz-wr">{right}</span>}
        <svg className="dz-wgo" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <div className="dz-wb">{children}</div>
    </section>
  );
}

const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
const ddmm = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.`;

// ------------------------------------------------------------------- Tabelle
function TableWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const rows = g.table.rows;
  const p = Math.max(0, rows.findIndex((r) => r.clubId === g.managedClubId));
  const n = 5;
  const start = Math.max(0, Math.min(rows.length - n, p - 2));
  const cut = rows.slice(start, start + n);
  return (
    <Widget title="Aktuelle Ligatabelle" to="table" onGoto={onGoto} right={divisionLabel(g.leagues.playerDivision.tier, g.leagues.playerDivision.group)}>
      <div className="dz-grid dz-tab">
        <span className="dz-th">Pl.</span><span className="dz-th">Verein</span><span className="dz-th dz-r">Diff.</span><span className="dz-th dz-r">Pkt.</span>
        {cut.map((r) => {
          const me = r.clubId === g.managedClubId;
          return (
            <div key={r.clubId} className={`dz-tr ${me ? 'me' : ''}`}>
              <span className={`rl-z ${zoneClass(r.position, rows.length)}`}>{r.position}</span>
              <span className="dz-club" onClick={stop}><Crest g={g} id={r.clubId} size={20} /><ClubLink id={r.clubId}><span className="dz-cn">{clubShort(g, r.clubId)}</span></ClubLink></span>
              <span className="dz-r">{r.goalDifference > 0 ? '+' : ''}{r.goalDifference}</span>
              <span className="dz-r dz-main">{r.points}</span>
            </div>
          );
        })}
      </div>
    </Widget>
  );
}

// ------------------------------------------------------------------- Spiele
const COMP_SHORT = { Liga: 'L', Pokal: 'P', Europa: 'E' } as const;
function GamesWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const all = ownGames(g);
  const today = g.calendar.currentDate;
  const past = all.filter((x) => x.gf != null).slice(-2);
  const next = all.filter((x) => x.gf == null && x.date >= today).slice(0, 3);
  const list = [...past, ...next];
  return (
    <Widget title="Liste der Spiele" to="fixtures" onGoto={onGoto}>
      {list.length === 0 ? <div className="dz-empty">Keine Spiele angesetzt.</div> : (
        <div className="dz-grid dz-games">
          {list.map((x, i) => {
            const res = x.gf == null ? null : x.gf > (x.ga ?? 0) ? 'W' : x.gf < (x.ga ?? 0) ? 'L' : 'D';
            return (
              <div key={i} className={`dz-tr ${x.gf == null && i === past.length ? 'next' : ''}`}>
                <span className="dz-dim">{ddmm(x.date)}</span>
                <span className="dz-comp" title={x.comp}>{COMP_SHORT[x.comp]}</span>
                <span className="dz-club" onClick={stop}><Crest g={g} id={x.opp} size={20} /><ClubLink id={x.opp}><span className="dz-cn">{clubShort(g, x.opp)}</span></ClubLink></span>
                <span className="dz-dim dz-ha">{x.home ? 'H' : 'A'}</span>
                <span className={`dz-r dz-main ${res ? `dz-res-${res}` : 'dz-dim'}`}>{x.gf == null ? '–:–' : `${x.gf}:${x.ga}`}</span>
              </div>
            );
          })}
        </div>
      )}
    </Widget>
  );
}

// ------------------------------------------------------------------- Budget
function BudgetWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const b = budgetOf(g);
  const neg = (v: number) => fmtDM(v > 0 ? -v : 0);
  const row = (k: ReactNode, v: string, cls = '') => <div className={`dz-kv ${cls}`}><span>{k}</span><b>{v}</b></div>;
  return (
    <Widget title="Budget" to="finances" onGoto={onGoto} right="Saison bisher">
      {row('Einnahmen', fmtDM(b.income))}
      {row('Gehälter', neg(b.wages))}
      {row('Transfers', (b.transfers > 0 ? '+' : '') + fmtDM(b.transfers))}
      {row('Bau & Unterhalt', neg(b.build))}
      {row('Sonstiges', neg(b.other))}
      {row(<>Kontostand<InfoTip k="kontostand" /></>, fmtDM(b.balance), `dz-kv-sum ${b.balance < 0 ? 'neg' : ''}`)}
      {row(<>Transferbudget<InfoTip k="transferbudget" /></>, fmtPrice(b.transferBudget))}
    </Widget>
  );
}

// ------------------------------------------------------------------- Managerstatus
function Bar({ label, v, info, invert }: { label: string; v: number; info?: InfoKey; invert?: boolean }) {
  const c = invert ? 100 - v : v;
  return (
    <div className="dz-bar">
      <span>{label}{info && <InfoTip k={info} />}</span>
      <span className="dz-track"><i style={{ width: `${Math.max(2, Math.min(100, v))}%`, background: condBar(c) }} /></span>
      <b style={{ color: condColor(c) }}>{Math.round(v)}</b>
    </div>
  );
}
function ManagerWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const club = g.clubs[g.managedClubId];
  const env = g.environment;
  return (
    <Widget title="Managerstatus" to="vorstand" onGoto={onGoto}>
      <div className="dz-kv"><span>Saisonziel<InfoTip k="saisonziel" /></span><b>{club.boardExpectation}</b></div>
      <Bar label="Vorstand" v={club.boardConfidence ?? 60} info="vorstandVertrauen" />
      {env && <Bar label="Fans" v={env.fanMood} info="fanStimmung" />}
      {env && <Bar label="Mediendruck" v={env.mediaPressure} info="medienDruck" invert />}
      {env && <Bar label="Leitbild" v={env.identity} info="leitbild" />}
    </Widget>
  );
}

// ------------------------------------------------------------------- Sperren/Verletzungen
function AbsenceWidget({ g, onGoto, openPlayer }: { g: Game; onGoto: Go; openPlayer: (id: string) => void }) {
  const list = absences(g);
  return (
    <Widget title="Sperren und Verletzungen" to="squad" onGoto={onGoto} right={list.length ? `${list.length}` : undefined}>
      {list.length === 0 ? <div className="dz-empty">Alle Spieler einsatzbereit.</div> : (
        <div className="dz-grid dz-abs">
          <span className="dz-th">Spieler</span><span className="dz-th" /><span className="dz-th dz-r">Dauer noch</span>
          {list.slice(0, 6).map((a) => (
            <div key={a.p.id + a.kind} className="dz-tr clickable" onClick={(e) => { e.stopPropagation(); openPlayer(a.p.id); }}>
              <span className="dz-cn"><PosBadge p={a.p} single /> {a.p.lastName || a.p.fullName}</span>
              <span className={`dz-tag ${a.kind}`}>{a.kind === 'injury' ? 'Verletzt' : 'Gesperrt'}</span>
              <span className="dz-r">{a.text}</span>
            </div>
          ))}
          {list.length > 6 && <div className="dz-more">+ {list.length - 6} weitere</div>}
        </div>
      )}
    </Widget>
  );
}

// ------------------------------------------------------------------- Teamstatus
function StatusRow({ kind, v }: { kind: Exclude<StatusKind, 'kraft'>; v: number }) {
  const Ico = kind === 'frische' ? FreshnessIcon : kind === 'form' ? FormIcon : kind === 'fitness' ? FitnessIcon : MoraleIcon;
  const label = { frische: 'Frische', form: 'Form', fitness: 'Fitness', moral: 'Moral' }[kind];
  return (
    <div className="dz-st">
      <span>{label}<InfoTip k={kind} /></span>
      <span className="dz-st-mid" onClick={stop}><Ico value={v} size={18} /><span className="dz-dim">{statusWord(kind, statusLevel(kind, v))}</span></span>
      <b>{v}</b>
    </div>
  );
}
function TeamWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const t = teamStatus(g);
  return (
    <Widget title="Teamstatus" to="squad" onGoto={onGoto} right={`${t.size} Spieler`}>
      <div className="dz-kv"><span>Stärke (Startelf)<InfoTip k="staerke" /></span><b className="dz-big" style={{ color: vColor(t.strength) }}>{t.strength}</b></div>
      <StatusRow kind="fitness" v={t.fitness} />
      <StatusRow kind="frische" v={t.freshness} />
      <StatusRow kind="form" v={t.form} />
      <StatusRow kind="moral" v={t.morale} />
    </Widget>
  );
}

// ------------------------------------------------------------------- Taktik
function TacticWidget({ g, onGoto }: { g: Game; onGoto: Go }) {
  const t = g.clubs[g.managedClubId].tactics;
  const lvl = (v: number | undefined) => (v == null ? '–' : v < 34 ? 'niedrig' : v < 67 ? 'mittel' : 'hoch');
  const rows: [string, string][] = [
    ['Formation', getFormation(t.formation).label],
    ['Mentalität', STYLE_DE[t.style] ?? t.style],
    ['Pressing', lvl(t.pressing)],
    ['Tempo', lvl(t.tempo)],
    ['Abwehrlinie', lvl(t.defensiveLine)],
    ['Abseitsfalle', t.offsideTrap ? 'an' : 'aus'],
    ['Aufbau', t.buildup === 'long' ? 'lang' : 'kurz'],
  ];
  return (
    <Widget title="Taktik" to="tactics" onGoto={onGoto}>
      {rows.map(([k, v]) => <div key={k} className="dz-kv"><span>{k}</span><b>{v}</b></div>)}
    </Widget>
  );
}

export function LeftColumn({ g, onGoto, openPlayer }: { g: Game; onGoto: Go; openPlayer: (id: string) => void }) {
  return (
    <div className="dz-col dz-left">
      <TableWidget g={g} onGoto={onGoto} />
      <GamesWidget g={g} onGoto={onGoto} />
      <BudgetWidget g={g} onGoto={onGoto} />
      <ManagerWidget g={g} onGoto={onGoto} />
      <AbsenceWidget g={g} onGoto={onGoto} openPlayer={openPlayer} />
      <TeamWidget g={g} onGoto={onGoto} />
      <TacticWidget g={g} onGoto={onGoto} />
    </div>
  );
}
