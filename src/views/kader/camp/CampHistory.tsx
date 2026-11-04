// =============================================================================
// TRAININGSLAGER – Archiv: vergangene Lager mit gemessener Wirkung (Vorher/Nachher).
// Daten: CampState.history (game/winterShared.ts), geschrieben beim Lagerende.
// =============================================================================
import { campDestination } from '../../../data/campDestinations';
import { campLodging } from '../../../data/campLodgings';
import { campGrade } from '../../../engine/campPlan';
import { campFocusLabel } from '../../../game/trainingCampGame';
import type { CampHistoryEntry, CampPlayerDelta } from '../../../game/winterShared';
import { Empty, KV } from '../../../ui/DashPage';
import { fmtDM, fmtDay } from '../../../ui/format';
import { BeforeAfter } from './EffectBars';
import PosBadge from '../../../components/PosBadge';

const sgn = (v: number, dig = 1) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(dig).replace('.', ',')}`;

export function HistoryList({ list, sel, onSel }: { list: CampHistoryEntry[]; sel: number; onSel: (i: number) => void }) {
  if (!list.length) return <Empty icon="weather">Noch kein Trainingslager absolviert.</Empty>;
  return (
    <div className="cp-hist">
      {list.map((h, i) => (
        <button key={i} className={`cp-hist-row ${i === sel ? 'on' : ''}`} onClick={() => onSel(i)}>
          <span className="cp-hist-when">{h.season.slice(2, 4)}/{h.season.slice(-2)} {h.campSeason === 'summer' ? 'So' : 'Wi'}</span>
          <span className="cp-hist-name">{campDestination(h.destId)?.name ?? h.destId}</span>
          <span className="cp-hist-score">{h.result ? h.result.score : '–'}</span>
        </button>
      ))}
    </div>
  );
}

function Players({ title, list }: { title: string; list: CampPlayerDelta[] }) {
  return (
    <div className="cp-hd-pl">
      <div className="cp-sec">{title}</div>
      {list.length ? list.map((p) => (
        <div key={p.id} data-pid={p.id} className="cp-hd-row">
          <PosBadge pos={p.pos} />
          <span className="grow">{p.name}{p.youth ? <span className="muted"> · Jugend</span> : null}</span>
          <span className="cp-hd-v">{p.injured ? <span className="neg">{p.injured}</span> : `Fit ${sgn(p.fit)} · Form ${sgn(p.form)}${p.morale ? ` · Moral ${p.morale > 0 ? '+' : '−'}` : ''}`}</span>
        </div>
      )) : <div className="cp-hint">–</div>}
    </div>
  );
}

export function HistoryDetail({ h }: { h?: CampHistoryEntry }) {
  if (!h) return <Empty icon="stats">Wähle links ein Lager.</Empty>;
  const d = campDestination(h.destId);
  const r = h.result;
  if (!r) return <div className="cp-hd"><div className="cp-hd-title">{d?.name ?? h.destId} · {h.season}</div><div className="dnote">{h.note}</div><div className="cp-hint">Für Lager vor dem Planer ist nur die Kurzbilanz gespeichert.</div></div>;
  const l = h.lodgingId ? campLodging(h.destId, h.lodgingId) : undefined;
  return (
    <div className="cp-hd">
      <div className="cp-hd-head">
        <div>
          <div className="cp-hd-title">{d?.name ?? h.destId}</div>
          <div className="cp-hd-sub">{h.start && h.end ? `${fmtDay(h.start)} – ${fmtDay(h.end)}` : h.season} · {l?.name ?? ''} · {campFocusLabel(h)}</div>
        </div>
        <div className="cp-hd-score"><b>{r.score}</b><span>{campGrade(r.score)}</span></div>
      </div>
      <div className="cp-hd-grid">
        <div>
          <div className="cp-sec">Vorher › Nachher (Ø der Reisegruppe)</div>
          <BeforeAfter label="Fitness" before={r.fit[0]} after={r.fit[1] + (r.altitude ?? 0)} />
          <BeforeAfter label="Form" before={r.form[0]} after={r.form[1]} />
          <BeforeAfter label="Frische" before={r.frische[0]} after={r.frische[1]} digits={0} />
          <BeforeAfter label="Teamgeist" before={r.spirit[0]} after={r.spirit[1]} digits={0} />
          {r.altitude ? <div className="cp-hint">Fitness inkl. Höhentraining ({sgn(r.altitude)} zwei Wochen später).</div> : null}
          <Players title="Profitiert" list={r.best.slice(0, 3)} />
          <Players title="Weniger gut" list={r.worst.slice(0, 3)} />
        </div>
        <div>
          <KV k="Reisegruppe" v={`${r.travelers} Profis${r.youth ? ` + ${r.youth} Jugend` : ''}${r.stayed ? ` · ${r.stayed} daheim` : ''}`} />
          <KV k="Entwicklung Ø" v={sgn(r.dev, 2)} />
          <KV k="Moral besser / schlechter" v={`${r.moraleUp} / ${r.moraleDown}`} />
          <KV k="Verletzte · Verstöße" v={`${r.injuries} · ${r.incidents}${r.healed ? ` · ${r.healed} früher fit` : ''}`} color={r.injuries ? 'var(--red)' : undefined} />
          <KV k="Wetter" v={r.luck >= 1.05 ? 'bestes Wetter' : r.luck <= 0.92 ? 'Ausfälle durchs Wetter' : 'normal'} />
          <KV k="Kosten" v={fmtDM(r.cost)} color="var(--red)" />
          <KV k="Erlöse (Tests · Sponsor)" v={`${fmtDM(r.income)} · ${fmtDM(r.sponsor)}`} />
          {r.drills?.length ? <KV k="Taktik-Inhalte (Spieler +1)" v={r.drills.map((x) => `${x.label} ${x.up}`).join(' · ')} /> : null}
          {r.fans ? <KV k="Fan-Stimmung" v={sgn(r.fans)} color={r.fans < 0 ? 'var(--red)' : undefined} /> : null}
        </div>
      </div>
    </div>
  );
}
