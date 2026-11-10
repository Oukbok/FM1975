// =============================================================================
// TRANSFERS › VERHANDLUNGEN › ÜBERSICHT (Wunsch Pascal)
// -----------------------------------------------------------------------------
// Laufende Verhandlungen (Tabelle, Klick öffnet das Gespräch), fest verpflichtete
// Spieler, die später kommen oder gehen (Einigung fürs nächste Fenster, Vorverträge),
// Leihspieler in beide Richtungen mit ihrer Saisonleistung und der Stand des
// Transferfensters. Nur Anzeige – Daten aus transferTalks, Player.loan,
// Player.contract.preContractClubId.
// =============================================================================
import FaceThumb from '../../components/FaceThumb';
import PosBadge from '../../components/PosBadge';
import { ClubLink } from '../../components/club/ClubLink';
import { CalendarEngine } from '../../engine/calendar';
import { activeTalks, inTransferWindow, sellerOf, type TransferTalk } from '../../game/transferTalks';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { DashBox, Empty, KV } from '../../ui/DashPage';
import { fmtPrice } from '../../ui/format';

const PHASE: Record<string, string> = { club: 'mit dem Verein', player: 'mit dem Spieler', agreed: 'Einigung' };

/** Nächster Wechseltermin bzw. Ende des offenen Fensters. */
export function windowInfo(today: string): { open: boolean; text: string; next: string } {
  const y = Number(today.slice(0, 4)), m = Number(today.slice(5, 7));
  if (m === 7 || m === 8) return { open: true, text: `offen bis 31.8.${y}`, next: today };
  if (m === 1) return { open: true, text: `offen bis 31.1.${y}`, next: today };
  const next = m >= 2 && m <= 6 ? `${y}-07-01` : `${y + 1}-01-01`;
  return { open: false, text: `geschlossen · öffnet am ${CalendarEngine.formatDate(next)}`, next };
}

function PlayerCell({ g, p }: { g: Game; p?: Player }) {
  if (!p) return <span className="muted">Spieler</span>;
  return <span className="tm-name"><FaceThumb p={p} club={g.clubs[p.clubId]} size={26} /><span>{p.fullName}</span></span>;
}

function ClubName({ g, id }: { g: Game; id?: string }) {
  if (!id) return <span className="muted">–</span>;
  const c = g.clubs[id] ?? sellerOf(g, id);
  return <ClubLink id={id}>{c?.shortName ?? c?.name ?? id}</ClubLink>;
}

const note = (p: Player) => (p.seasonStats.ratedMatches ? p.seasonStats.averageRating.toFixed(2).replace('.', ',') : '–');

export function RunningTalksBox({ g, onOpen }: { g: Game; onOpen: (t: TransferTalk) => void }) {
  const talks = activeTalks(g).filter((t) => t.phase !== 'agreed').sort((a, b) => b.lastAction.localeCompare(a.lastAction));
  const today = g.calendar.currentDate;
  return (
    <DashBox title="Laufende Verhandlungen" info="verhandlungen" span={2} flush right={`${talks.length}`}>
      {talks.length ? (
        <table className="dtable rl-players">
          <thead><tr>
            <th>Spieler</th><th className="ctr">Pos</th><th className="num">Alter</th><th>Verein</th><th>Gespräch</th>
            <th className="num">Stand</th><th className="num">Seit</th><th className="num">Läuft aus</th>
          </tr></thead>
          <tbody>
            {talks.map((t) => {
              const p = g.players[t.playerId];
              const ask = t.phase === 'club' ? (t.round ? `Forderung ${fmtPrice(t.currentAsk)}` : `geschätzt ${fmtPrice(t.estimate[0])}–${fmtPrice(t.estimate[1])}`)
                : t.pkg ? `Ablöse ${fmtPrice(t.pkg.fee)}${t.pkg.loan ? ' (Leihe)' : ''}` : t.freeAgent ? 'ablösefrei' : '';
              const expires = CalendarEngine.addDays(t.lastAction, 30);
              const soon = expires <= CalendarEngine.addDays(today, 7);
              return (
                <tr key={t.id} data-pid={t.playerId} className="clickable" onClick={() => onOpen(t)}>
                  <td className="nowrap rl-name"><PlayerCell g={g} p={p} /></td>
                  <td className="ctr">{p && <PosBadge p={p} compact />}</td>
                  <td className="num">{p?.age ?? ''}</td>
                  <td className="nowrap"><ClubName g={g} id={t.sellerId} /></td>
                  <td className="nowrap">{PHASE[t.phase]}{t.freeAgent ? ' · Vorvertrag' : ''}</td>
                  <td className="num nowrap">{ask}</td>
                  <td className="num muted nowrap">{CalendarEngine.formatDate(t.started)}</td>
                  <td className="num nowrap" style={soon ? { color: 'var(--neg)' } : undefined}>{CalendarEngine.formatDate(expires)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <Empty icon="negotiations">Keine laufenden Gespräche. Verhandeln kannst du im Transfermarkt, im Spielerpool und in der Beobachtung – oder per Rechtsklick auf einen Spieler.</Empty>}
    </DashBox>
  );
}

export function CommittedBox({ g, onOpen }: { g: Game; onOpen: (t: TransferTalk) => void }) {
  const mine = g.managedClubId;
  const today = g.calendar.currentDate;
  const w = windowInfo(today);
  const agreed = activeTalks(g).filter((t) => t.phase === 'agreed');
  const preIn = Object.values(g.players).filter((p) => p.contract.preContractClubId === mine && p.clubId !== mine && !agreed.some((t) => t.playerId === p.id));
  const preOut = Object.values(g.players).filter((p) => p.clubId === mine && p.contract.preContractClubId && p.contract.preContractClubId !== mine);
  const arrive = (t: TransferTalk) => {
    const p = g.players[t.playerId];
    if (t.freeAgent && p) return `kommt ablösefrei am ${CalendarEngine.formatDate(CalendarEngine.addDays(p.contract.expiryDate, 1))}`;
    return w.open ? 'kommt in den nächsten Tagen' : `kommt am ${CalendarEngine.formatDate(w.next)}`;
  };
  const n = agreed.length + preIn.length + preOut.length;
  return (
    <DashBox title="Fest verpflichtet" info="festverpflichtet" rows={2} right={`${n}`}>
      {n ? <>
        {(agreed.length > 0 || preIn.length > 0) && <div className="dsec">Zugänge</div>}
        {agreed.map((t) => {
          const p = g.players[t.playerId];
          return (
            <div key={t.id} className="dlist-row clickable" data-pid={t.playerId} onClick={() => onOpen(t)}>
              {p && <PosBadge p={p} compact />}
              <span className="grow"><b>{p?.fullName ?? 'Spieler'}</b><span className="muted"> · von <ClubName g={g} id={t.sellerId} /> · {arrive(t)}</span></span>
              <span className="val">{t.pkg ? fmtPrice(t.pkg.fee) : 'ablösefrei'}</span>
            </div>
          );
        })}
        {preIn.map((p) => (
          <div key={p.id} className="dlist-row" data-pid={p.id}>
            <PosBadge p={p} compact />
            <span className="grow"><b>{p.fullName}</b><span className="muted"> · von <ClubName g={g} id={p.clubId} /> · Vorvertrag, kommt am {CalendarEngine.formatDate(CalendarEngine.addDays(p.contract.expiryDate, 1))}</span></span>
            <span className="val">ablösefrei</span>
          </div>
        ))}
        {preOut.length > 0 && <div className="dsec">Abgänge</div>}
        {preOut.map((p) => (
          <div key={p.id} className="dlist-row" data-pid={p.id}>
            <PosBadge p={p} compact />
            <span className="grow"><b>{p.fullName}</b><span className="muted"> · zu <ClubName g={g} id={p.contract.preContractClubId} /> · geht am {CalendarEngine.formatDate(p.contract.expiryDate)}</span></span>
            <span className="val">ablösefrei</span>
          </div>
        ))}
      </> : <Empty icon="contracts">Niemand ist fest verpflichtet. Nach einer Einigung außerhalb des Transferfensters oder einem Vorvertrag steht der Spieler hier, bis er kommt.</Empty>}
      <div className="mt8">
        <KV k="Transferfenster" v={w.text} />
        {!w.open && agreed.length > 0 && <div className="dnote">Einigungen werden mit Öffnen des Fensters vollzogen.</div>}
        {inTransferWindow(today) && <div className="dnote">Im offenen Fenster wechseln Spieler direkt nach der Einigung.</div>}
      </div>
    </DashBox>
  );
}

export function LoansBox({ g }: { g: Game }) {
  const mine = g.managedClubId;
  const out = Object.values(g.players).filter((p) => p.loan?.fromClubId === mine && p.clubId !== mine);
  const inn = Object.values(g.players).filter((p) => p.loan && p.clubId === mine);
  const rows = [...out.map((p) => ({ p, out: true })), ...inn.map((p) => ({ p, out: false }))];
  return (
    <DashBox title="Leihspieler" info="leihspieler" span={2} flush right={`${out.length} verliehen · ${inn.length} ausgeliehen`}>
      {rows.length ? (
        <table className="dtable rl-players">
          <thead><tr>
            <th>Spieler</th><th className="ctr">Pos</th><th className="num">Alter</th><th>Leihe</th><th className="num">Bis</th>
            <th className="num">Spiele</th><th className="num">Min.</th><th className="num">Tore</th><th className="num">Vorl.</th><th className="num">Ø Note</th><th className="num">Kaufoption</th>
          </tr></thead>
          <tbody>
            {rows.map(({ p, out: o }) => {
              const s = p.seasonStats;
              return (
                <tr key={p.id} data-pid={p.id}>
                  <td className="nowrap rl-name"><PlayerCell g={g} p={p} /></td>
                  <td className="ctr"><PosBadge p={p} compact /></td>
                  <td className="num">{p.age}</td>
                  <td className="nowrap">{o ? <>an <ClubName g={g} id={p.clubId} /></> : <>von <ClubName g={g} id={p.loan!.fromClubId} /></>}</td>
                  <td className="num muted nowrap">{CalendarEngine.formatDate(p.loan!.until)}</td>
                  <td className="num">{s.appearances}{s.starts ? <span className="muted"> ({s.starts})</span> : null}</td>
                  <td className="num">{s.minutesPlayed.toLocaleString('de-DE')}</td>
                  <td className="num">{s.goals}</td>
                  <td className="num">{s.assists}</td>
                  <td className="num"><b>{note(p)}</b></td>
                  <td className="num nowrap muted">{p.loan!.noOption || !p.loan!.optionFee ? '–' : fmtPrice(p.loan!.optionFee)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : <Empty icon="transfers">Keine Leihspieler. Eine Leihe vereinbarst du in der Transferverhandlung; eigene Spieler leihst du über Anfragen anderer Vereine aus.</Empty>}
    </DashBox>
  );
}
