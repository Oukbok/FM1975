// =============================================================================
// Top-Transfers: Zeitungs-Doppelseite im Blattstil der Presse (Blattname je Epoche
// aus game/press/calendar.ts) auf images/dossier/zeitung.webp. Raster wie die Presse
// (.np-sheet: Rand | linke Seite | Falz | rechte Seite | Rand):
//   Kopf über beide Seiten · links Aufmacher mit Platz 1–3 + Bilanz des Fensters ·
//   rechts die Tabelle aller Top-Transfers je Liga (scrollt intern).
// Erste Seite nach dem Fensterschluss, sonst über den Knopf „Top-Transfers“.
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { mastheadFor } from '../../../game/press/calendar';
import type { Game } from '../../../game/state';
import type { TLRow, TTFacts, TTSection } from '../../../game/transferLogView';
import { fmtPrice, vColor } from '../../../ui/format';
import { AnyCrest, ClubCell, Face, feeText, fmtDate, PlayerName, potText } from './parts';
import PosBadge from '../../../components/PosBadge';

const eraClass = (year: number) => (year < 1986 ? 'np-e1' : year < 1998 ? 'np-e2' : year < 2012 ? 'np-e3' : 'np-e4');

function Podium({ g, r, n, onOpen }: { g: Game; r: TLRow; n: number; onOpen: (id: string) => void }) {
  return (
    <div className={`tt-pod ${r.own ? 'me' : ''}`}>
      <div className="tt-pod-stage">
        <span className="tt-pod-n">{n}</span>
        <span className={`tt-pod-face ${r.player ? 'clickable' : ''}`} onClick={() => r.player && onOpen(r.e.p)}><Face g={g} row={r} size={160} /></span>
        <span className="tt-pod-crest"><ClubLink id={r.toId}><AnyCrest g={g} id={r.toId} size={56} /></ClubLink></span>
      </div>
      <div className="tt-pod-name"><PlayerName row={r} onOpen={onOpen} /></div>
      <div className="tt-pod-club"><ClubLink id={r.toId}>{r.toName}</ClubLink></div>
      <div className="tt-pod-from">von {r.fromName}</div>
      <div className="tt-pod-kv"><span>Position</span><b><PosBadge pos={r.e.pos} /></b></div>
      <div className="tt-pod-kv"><span>Alter</span><b>{r.e.age}</b></div>
      <div className="tt-pod-kv"><span>Stärke</span><b style={{ color: vColor(r.e.ov) }}>{r.e.ov}</b></div>
      <div className="tt-pod-kv"><span>Potenzial</span><b>{potText(r)}</b></div>
      <div className="tt-pod-kv"><span>Ablöse</span><b>{feeText(r)}</b></div>
    </div>
  );
}

function Facts({ f }: { f: TTFacts }) {
  return (
    <div className="tt-facts">
      <div className="tt-facts-h">Bilanz des Fensters</div>
      <div className="tt-facts-row">
        <div className="tt-fact"><b>{f.count}</b><span>Neuzugänge</span></div>
        <div className="tt-fact"><b>{f.fees > 0 ? fmtPrice(f.fees) : '–'}</b><span>Ablösen gesamt</span></div>
        <div className="tt-fact"><b>{f.free}</b><span>ablösefrei</span></div>
        <div className="tt-fact"><b>{f.loans}</b><span>Leihen</span></div>
      </div>
      {f.record && <div className="tt-facts-rec">Teuerster Wechsel: <b>{f.record.e.n}</b> für {fmtPrice(f.record.e.fee)} zu {f.record.toName}</div>}
    </div>
  );
}

/** Kurzer Aufmacher-Text aus den Top-Transfers der eigenen Liga (nur Daten, keine Wertung). */
function leadText(g: Game, rows: TLRow[], league: string): string[] {
  const a = rows[0];
  if (!a) return [];
  const out: string[] = [];
  const how = a.loan ? 'leiht' : 'holt';
  const fee = a.loan ? '' : a.e.fee > 0 ? ` für ${feeText(a)}` : ' ablösefrei';
  out.push(`${a.toName} ${how} mit ${a.e.n} (${a.e.age}) den stärksten Neuzugang der ${league}${fee} von ${a.fromName}.`);
  const by = new Map<string, { name: string; n: number }>();
  for (const r of rows) { const k = r.toId ?? r.toName; const x = by.get(k) ?? { name: r.toName, n: 0 }; x.n++; by.set(k, x); }
  const most = [...by.values()].sort((x, y) => y.n - x.n)[0];
  if (most && most.n > 1) out.push(`Am kräftigsten verstärkt hat sich ${most.name}: ${most.n} der ${rows.length} Top-Transfers gehen dorthin.`);
  const young = [...rows].sort((x, y) => x.e.age - y.e.age || y.e.ov - x.e.ov)[0];
  if (young && young !== a && young.e.age <= 23) out.push(`Jüngster in der Liste ist ${young.e.n} (${young.e.age}), der zu ${young.toName} wechselt.`);
  const mine = rows.filter((r) => r.toId === g.managedClubId);
  const myName = g.clubs[g.managedClubId]?.name;
  if (myName) {
    out.push(mine.length
      ? `${myName} ist mit ${mine.length === 1 ? `${mine[0].e.n}` : `${mine.length} Spielern`} vertreten.`
      : `${myName} taucht in der Liste der Top-Transfers nicht auf.`);
  }
  return out;
}

function SectionRows({ g, s, onOpen }: { g: Game; s: TTSection; onOpen: (id: string) => void }) {
  return (
    <tbody>
      <tr className="tt-sec-row"><th colSpan={7}>{s.name}</th></tr>
      {s.rows.map((r, i) => (
        <tr key={r.i} className={r.own ? 'me' : ''}>
          <td className="num rl-rank">{i + 1}</td>
          <td className="tt-pl"><span className="nowrap rl-name"><PlayerName row={r} onOpen={onOpen} /></span><small>von {r.fromName}</small></td>
          <td className="ctr"><PosBadge pos={r.e.pos} /></td>
          <td className="num">{r.e.age}</td>
          <td className="num"><b style={{ color: vColor(r.e.ov) }}>{r.e.ov}</b></td>
          <td className="num nowrap">{r.loan ? 'Leihe' : feeText(r)}</td>
          <td className="nowrap"><ClubCell g={g} id={r.toId} name={r.toName} size={24} /></td>
        </tr>
      ))}
    </tbody>
  );
}

export function TopTransfersPage({ g, league, label, date, sections, facts, onOpen }: {
  g: Game; league: string; label: string; date: string; sections: TTSection[]; facts: TTFacts; onOpen: (id: string) => void;
}) {
  const year = Number(date.slice(0, 4));
  const mast = mastheadFor(year);
  const tops = sections[0]?.rows ?? [];
  const more = sections.slice(1).some((s) => s.rows.length);
  return (
    <div className={`tt-sheet np-sheet ${eraClass(year)}`}>
      <header className="np-mast tt-mast">
        <div className="np-mast-l">Transferfenster<br />{label}</div>
        <div className="np-mast-c"><div className="np-name">{mast.name}</div><div className="np-claim">{mast.claim}</div></div>
        <div className="np-mast-r">{mast.name}<br />{fmtDate(date)}</div>
      </header>

      <section className="tt-left">
        <div className="np-rubric">Transfermarkt · {league}</div>
        <h1 className="tt-title">Top-Transfers</h1>
        <p className="tt-dek">Die stärksten Neuzugänge der {league} im Transferfenster {label}.</p>
        {tops.length ? (
          <div className={`tt-podium n${Math.min(3, tops.length)}`}>{tops.slice(0, 3).map((r, i) => <Podium key={r.i} g={g} r={r} n={i + 1} onOpen={onOpen} />)}</div>
        ) : <div className="tt-empty">Die Vereine der {league} haben in diesem Fenster niemanden verpflichtet.</div>}
        <div className="tt-lead">{leadText(g, tops, league).map((t, i) => <p key={i} className="np-text">{t}</p>)}</div>
        <Facts f={facts} />
      </section>

      <section className="tt-right">
        <div className="np-sec tt-right-h">Alle Top-Transfers{more ? ' nach Ligen' : ''}</div>
        <div className="tt-tablewrap">
          {sections.some((s) => s.rows.length) ? (
            <table className="dtable tt-table">
              <thead><tr>
                <th className="num">Pl.</th><th>Spieler</th><th className="ctr">Pos.</th><th className="num">Alter</th><th className="num">Stärke</th>
                <th className="num">Ablöse</th><th>Neuer Verein</th>
              </tr></thead>
              {sections.filter((s) => s.rows.length).map((s) => <SectionRows key={s.id} g={g} s={s} onOpen={onOpen} />)}
            </table>
          ) : <div className="tt-empty">Keine Neuzugänge in diesem Fenster.</div>}
        </div>
      </section>
    </div>
  );
}
