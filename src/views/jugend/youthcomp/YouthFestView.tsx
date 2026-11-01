// =============================================================================
// Jugendwettbewerbe – Spielfeste ohne Tabelle (G-Jugend; F-Jugend vor 1984/85;
// G/F/E ab der DFB-Kinderfußball-Reform 2024/25). Statt einer Tabelle: links die
// Termine, rechts Spielform, Erklärung und die Teilnahmen deiner Kinder.
// Daten: game/youthComps/view.ts (`YcSnapshot.fest`).
// =============================================================================
import type { Game } from '../../../game/state';
import type { YcSnapshot } from '../../../game/youthComps/view';
import { DashBox, Empty, KV } from '../../../ui/DashPage';
import { fmtDateShort } from '../../../ui/format';
import { TeamName } from '../../statistiken/competition/parts';

/** Linke große Box: Termine der Spielfeste. */
export function FestDates({ g, snap }: { g: Game; snap: YcSnapshot }) {
  const f = snap.fest!;
  const today = g.calendar.currentDate;
  return (
    <div className="cmp-scroll yc-fest">
      <div className="yc-fest-banner">
        <div className="yc-fest-title">Keine Tabelle</div>
        <div className="dnote">{f.note}</div>
      </div>
      {f.dates.length ? (
        <div className="yc-fest-list">
          <div className="dsec">Spielfeste der Saison</div>
          {f.dates.map((d) => {
            const past = d.date < today;
            return (
              <div key={d.date} className={`yc-fest-row ${past ? 'past' : ''}`}>
                <span className="yc-fest-date">{fmtDateShort(d.date).wd} {fmtDateShort(d.date).dmy}</span>
                <span className="yc-fest-host">Gastgeber <TeamName g={g} id={d.host} season={snap.season} size={16} /></span>
                <span className="yc-fest-state">{past ? 'gespielt' : 'geplant'}</span>
              </div>
            );
          })}
        </div>
      ) : <div className="dnote mt8">{f.count} Spielfeste in dieser Saison. Ergebnisse wurden nicht festgehalten.</div>}
    </div>
  );
}

/** Rechte Seite: drei Boxen statt der Bestenlisten. */
export function FestSide({ g, snap }: { g: Game; snap: YcSnapshot }) {
  const f = snap.fest!;
  const done = f.dates.filter((d) => d.date < g.calendar.currentDate).length;
  return (
    <>
      <DashBox title="Spielform" icon="lineup" className="yc-fest-box yc-fest-wide">
        <KV k="Spielform" v={snap.play ?? '–'} />
        <KV k="Spielfeste" v={snap.source === 'live' ? `${done} von ${f.count}` : `${f.count}`} />
        <KV k="Ergebnisse" v="werden nicht festgehalten" />
      </DashBox>
      <DashBox title="Teilnahmen deiner Kinder" icon="youth" className="yc-fest-box yc-fest-l" right={f.apps.length ? `${f.apps.length} Kinder` : undefined}>
        {f.apps.length ? (
          <div className="cmp-statlist">
            {f.apps.map((a) => (
              <div key={a.pid} className="cmp-stat">
                <span className="cmp-rank" />
                <span className="cmp-pname">{a.name}</span>
                <span className="cmp-pclub muted">{a.pos}</span>
                <span className="cmp-val">{a.n}</span>
              </div>
            ))}
          </div>
        ) : <Empty icon="youth">{snap.source === 'live' ? 'Noch kein Spielfest gespielt.' : 'Im Archiv nicht gespeichert.'}</Empty>}
      </DashBox>
      <DashBox title="Kinderfußball" icon="info" className="yc-fest-box yc-fest-r">
        <div className="dnote">Bei den Jüngsten soll jedes Kind viel spielen und den Ball oft haben: kleine Teams, kurze Spielzeiten, alle kommen zum Einsatz. Eine Meisterschaft mit Tabelle gibt es in dieser Altersklasse nicht.</div>
        <div className="dnote mt8">Für deine Akademie zählt die Teilnahme: Jedes Spielfest gibt deinen Kindern einen kleinen Schub für Entwicklung und Freude am Spiel.</div>
      </DashBox>
    </>
  );
}
