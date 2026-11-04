// Zentrale › Karriere, Reiter „Saisons“: alle Saisons unter dir + höchste Siege/Niederlagen.
import type { CareerData } from '../../../game/managerView';
import type { Game } from '../../../game/state';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { GameRow, wdlText } from './parts';

const LEAGUE = (t?: number, name?: string) => name || (t === 1 ? '1. Liga' : t === 2 ? '2. Liga' : t ? `${t}. Ebene` : '–');

export function SeasonsTab({ g, d }: { g: Game; d: CareerData }) {
  return (
    <DashPage className="car-page car-seasons-page">
      <DashBox title="Deine Saisons" span={2} rows={2} flush info="saisonziel" right={`${d.seasons.length}`}>
        <table className="dtable rl-sm car-seasons">
          <thead>
            <tr>
              <th>Saison</th><th>Liga</th><th className="rl-num">Platz</th><th>Saisonziel</th><th className="rl-num">Liga S-U-N</th>
              <th>Pokal</th><th>Europapokal</th><th>Titel</th><th className="rl-num">Ansehen</th>
            </tr>
          </thead>
          <tbody>
            {d.seasons.map((s) => (
              <tr key={s.season} className={s.live ? 'car-live' : ''}>
                <td className="rl-main">{s.season}</td>
                <td className="car-cut">{LEAGUE(s.tier, s.league)}</td>
                <td className="rl-num rl-main">{s.pos ? `${s.pos}.` : '–'}{s.live && <span className="car-dim"> läuft</span>}</td>
                <td className="car-cut">
                  {s.goal ?? '–'}
                  {s.ok != null && <span className={`car-goal ${s.ok ? 'ok' : 'miss'}`}>{s.ok ? 'erreicht' : 'verfehlt'}</span>}
                </td>
                <td className="rl-num">{wdlText(s.L)}</td>
                <td className="car-cut">{s.cup ?? '–'}</td>
                <td className="car-cut" title={s.euro}>{s.euro ?? "–"}</td>
                <td className="car-cut car-strong" title={s.titles.join(", ")}>{s.titles.join(", ")}</td>
                <td className="rl-num">{s.rep != null ? Math.round(s.rep) : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashBox>

      <DashBox title="Höchste Siege" flush>
        {d.tally.big.length ? <div className="rl rl-sm">{d.tally.big.map((x, i) => <GameRow key={x[0] + x[2]} g={g} x={x} lead={`${i + 1}`} />)}</div>
          : <Empty icon="trophy">Noch kein Sieg mit zwei Toren Vorsprung.</Empty>}
      </DashBox>

      <DashBox title="Höchste Niederlagen" flush>
        {d.tally.bad.length ? <div className="rl rl-sm">{d.tally.bad.map((x, i) => <GameRow key={x[0] + x[2]} g={g} x={x} lead={`${i + 1}`} />)}</div>
          : <Empty icon="shield">Noch keine Niederlage mit zwei Toren Unterschied.</Empty>}
      </DashBox>
    </DashPage>
  );
}
