import PlayerAvatar from '../../components/PlayerAvatar';
import PlayerModal from '../../components/PlayerModal';
import { getAvailablePlayers, makeOffer } from '../../engine/transfers';
import { Game } from '../../game/state';
import { Player, renderStars } from '../../types';
import { PageHead, PagePlaceholder } from '../../ui/PageHead';
import { fmtDM, vColor } from '../../ui/format';
import { useState } from 'react';

// --- BEOBACHTUNGSLISTE ------------------------------------------------------
export function BeobachtungView() {
  return (
    <PagePlaceholder icon="watchlist" title="Beobachtungsliste">
      Hier sammelst du künftig Spieler, die du im Auge behalten möchtest. Du kannst
      Kandidaten aus dem Transfermarkt hinzufügen und ihre Form, ihren Wert und ihre
      Vertragssituation verfolgen.
    </PagePlaceholder>
  );
}

// --- AKTIVE VERHANDLUNGEN ---------------------------------------------------
export function VerhandlungenView() {
  return (
    <PagePlaceholder icon="negotiations" title="Aktive Verhandlungen">
      In diesem Bereich laufen künftig alle offenen Transfer- und Vertragsgespräche
      zusammen — inklusive Angeboten, Gegenangeboten und Fristen.
    </PagePlaceholder>
  );
}

// =============================================================================
// TRANSFERS
// =============================================================================
export function TransfersView({ g, onDone }: { g: Game; onDone: () => void }) {
  const available = getAvailablePlayers(g.players, g.managedClubId).slice(0, 40);
  const club = g.clubs[g.managedClubId];
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<string | null>(null);

  const buy = (p: Player) => {
    const amount = Math.round(p.contract.transferValue * 1.05);
    const wage = Math.round(p.contract.weeklyWage * 1.1);
    const res = makeOffer(club, p, g.clubs, g.players, amount, wage);
    setMsg(res.message);
    onDone();
  };

  const selP = sel ? g.players[sel] : null;

  return (
    <div className="page">
      <PageHead
        icon="transfers"
        title="Transfermarkt"
        right={<span className="pill" style={{ fontSize: 13 }}>Budget: <b className="accent-text" style={{ marginLeft: 4 }}>{fmtDM(club.finances.transferBudget)}</b></span>}
      />
      {msg && <div className={`card ${msg.includes('abgeschlossen') ? 'green' : 'red'}`} style={{ padding: 12 }}>{msg}</div>}
      <div className="card">
        <div className="table-scroll">
          <table>
            <thead><tr><th></th><th>Name</th><th>Verein</th><th>Pos</th><th>Alter</th><th>OVR</th><th>Pot.</th><th>Wert</th><th></th></tr></thead>
            <tbody>
              {available.map((p) => {
                const c = g.clubs[p.clubId];
                return (
                  <tr key={p.id}>
                    <td className="clickable" style={{ width: 34 }} onClick={() => setSel(p.id)}>{c && <PlayerAvatar player={p} club={c} size="small" />}</td>
                    <td className="clickable" style={{ fontWeight: 600 }} onClick={() => setSel(p.id)}>{p.fullName}</td>
                    <td className="dim">{c?.shortName}</td>
                    <td>{p.naturalPosition}</td>
                    <td>{p.age}</td>
                    <td><b style={{ color: vColor(p.overall) }}>{p.overall}</b></td>
                    <td className="stars" style={{ fontSize: 11 }}>{renderStars(p.potentialStars)}</td>
                    <td className="dim">{fmtDM(p.contract.transferValue)}</td>
                    <td><button className="btn-sm btn-primary" onClick={() => buy(p)}>Angebot</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {selP && <PlayerModal player={selP} club={g.clubs[selP.clubId]} squad={g.clubs[selP.clubId]?.playerIds.map((id) => g.players[id])} today={g.calendar.currentDate} onClose={() => setSel(null)} />}
    </div>
  );
}
