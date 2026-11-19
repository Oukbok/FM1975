// Nationalteam › Übersicht: Nation & Vertrag | Nächste Termine | Bilanz,
// Amtszeit (Verlauf) | Kandidaten aus deinem Verein. Rücktritt mit Bestätigung (feste Größe).
import { useState } from 'react';
import type { Game } from '../../game/state';
import type { Screen } from '../../shell/navigation';
import { NatFlag } from '../../components/competition/CountryFlag';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import PosBadge from '../../components/PosBadge';
import Icon from '../../components/Icon';
import { activeJob, defOfKey, fmtDay, nationalJob, resignCost, resignNationalJob, sackable, tLong } from '../../game/national/nationalJob';
import { natName } from '../../game/national/nationalGame';
import { allStrengths, candidatesByNation } from '../../game/national/pool';
import { ddmm, jobCalendar, recText } from '../../game/national/nationalJobView';
import { DashBox, DashPage, Empty, KV, Meter } from '../../ui/DashPage';
import { condBar, vColor } from '../../ui/format';
import type { Position } from '../../types';

const sign = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');

export function NtOverviewTab({ g, onChange, onTab, onGoto }: { g: Game; onChange: () => void; onTab: (t: 'aufgebot' | 'spiele') => void; onGoto: (s: Screen) => void }) {
  const job = nationalJob(g)!;
  const active = !!activeJob(g);
  const [ask, setAsk] = useState(false);
  const today = g.calendar.currentDate;
  const def = defOfKey(job.untilKey);
  const strength = allStrengths(g);
  const rank = [...strength.entries()].sort((a, b) => b[1] - a[1]);
  const r = rank.findIndex(([c]) => c === job.nat) + 1;
  const next = jobCalendar(g).filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);
  const mine = (candidatesByNation(g).get(job.nat) ?? []).filter((c) => c.clubId === g.managedClubId).slice(0, 12);
  const pick = activeJob(g)?.pick;
  const cost = resignCost(g);
  const t = job.record.total;

  return (
    <DashPage className="ntj-ov">
      <DashBox title={<span className="kv-flag"><NatFlag nat={job.nat} height={16} /> {natName(job.nat)}</span>} info="nationaltrainer" right={active ? 'Dein Team' : 'Amtszeit beendet'}>
        <KV k="Nationaltrainer seit" v={fmtDay(job.since)} />
        <KV k="Vertrag" v={active ? (def ? `bis ${tLong(def)}` : job.untilKey) : `beendet ${fmtDay(job.ended!.date)}`} />
        <KV k="Ziel" info="ntZiel" v={job.goal ? `${job.goal.label}` : '–'} strong />
        <Meter label="Vertrauen" info="ntVertrauen" value={job.trust} color={condBar(job.trust)} />
        <KV k="Stärke · Rang" v={<><b style={{ color: vColor(strength.get(job.nat) ?? 0) }}>{Math.round(strength.get(job.nat) ?? 0)}</b> · {r ? `${r}. von ${rank.length}` : '–'}</>} />
        <KV k="Entlassung möglich" info="ntEntlassung" v={sackable(g) ? 'ja' : 'nein'} />
        {active && <div className="ntj-actions ntj-push">
          <button type="button" className="b3 b3-s" onClick={() => setAsk(true)}>Zurücktreten</button>
        </div>}
      </DashBox>

      <DashBox title="Nächste Termine" right={pick && !pick.used ? <button type="button" className="b3 b3-s b3-primary" onClick={() => onTab('aufgebot')}>Aufgebot</button> : undefined}>
        {next.length ? <div className="ntj-list">{next.map((e) => (
          <div key={e.date + e.line} className={`ntj-row ${e.own ? 'own' : ''}`}><span className="ntj-date">{ddmm(e.date)}</span><span className="ntj-txt">{e.line.replace(/^Nationalteam: /, '')}</span></div>
        ))}</div> : <Empty icon="kalender">Keine Termine in dieser Saison.</Empty>}
      </DashBox>

      <DashBox title="Bilanz" right={t.p ? `${t.p} Spiele` : undefined}>
        {t.p ? <>
          <KV k="Gesamt" v={recText(t)} strong />
          <KV k="Tore" v={`${t.gf}:${t.ga}`} />
          <div className="dsec">Je Wettbewerb</div>
          <div className="ntj-list">{Object.entries(job.record.by).reverse().map(([k, x]) => <KV key={k} k={k} v={`${recText(x)} · ${x.gf}:${x.ga}`} />)}</div>
        </> : <Empty icon="stats">Noch kein Länderspiel unter dir.</Empty>}
      </DashBox>

      <DashBox title="Amtszeit" span={2} right={<button type="button" className="b3 b3-s" onClick={() => onTab('spiele')}>Spiele & Turniere</button>}>
        <div className="ntj-hist">
          <div className="ntj-hrow head"><span>Datum</span><span>Wettbewerb</span><span>Ziel</span><span>Ergebnis</span><span className="num">Vertrauen</span></div>
          <div className="ntj-list">
            {[...(job.prev ?? []).flatMap((p) => p.history.map((h) => ({ ...h, nat: p.nat }))), ...job.history.map((h) => ({ ...h, nat: job.nat }))].reverse().map((h, i) => (
              <div key={i} className="ntj-hrow" title={h.text}>
                <span className="ntj-date">{fmtDay(h.date)}</span>
                <span><NatFlag nat={h.nat} /> {h.key}</span>
                <span className="dim">{h.goal ?? '–'}</span>
                <span>{h.result}</span>
                <span className={`num ${h.delta > 0 ? 'pos' : h.delta < 0 ? 'neg' : ''}`}>{h.delta ? sign(h.delta) : ''} <b>{h.trust}</b></span>
              </div>
            ))}
          </div>
        </div>
      </DashBox>

      <DashBox title="Kandidaten aus deinem Verein" right={mine.length ? `${mine.length}` : undefined}>
        {mine.length ? <div className="ntj-list">{mine.map((c) => (
          <div key={c.id} className="ntj-prow" data-pid={c.id}>
            <PosBadge pos={c.pos as Position} /><span className="ntj-pname"><PlayerLink id={c.id}>{c.name}</PlayerLink></span>
            <span className="dim">{pick?.ids.includes(c.id) ? 'im Aufgebot' : ''}</span><b style={{ color: vColor(c.ov) }}>{c.ov}</b>
          </div>
        ))}</div> : <Empty icon="squad">Kein Spieler deines Vereins hat die Nationalität {natName(job.nat)}.</Empty>}
        <div className="dnote mt8">Nominierte Spieler fehlen deinem Verein während der Länderspiele.</div>
      </DashBox>

      {ask && (
        <div className="ntj-confirm-back" role="dialog" aria-modal="true">
          <div className="ntj-confirm">
            <h3>Als Nationaltrainer zurücktreten?</h3>
            <p>Deine Amtszeit bei {natName(job.nat)} endet sofort. {cost ? `Mitten im Turnierzyklus kostet das ${cost} Punkte Ansehen.` : 'Nach dem Turnier kostet das kein Ansehen.'} Dein Verein bleibt dir; neue Angebote kommen nur, wenn ein Verband einen Nachfolger sucht.</p>
            <div className="ntj-confirm-btns">
              <button type="button" className="b3" onClick={() => setAsk(false)}>Abbrechen</button>
              <button type="button" className="b3 b3-primary" onClick={() => { resignNationalJob(g); setAsk(false); onChange(); onGoto('dashboard'); }}><Icon name="close" size={16} /> Zurücktreten</button>
            </div>
          </div>
        </div>
      )}
    </DashPage>
  );
}
