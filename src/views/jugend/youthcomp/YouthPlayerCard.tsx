// =============================================================================
// Jugendwettbewerbe – kleine Karte für Jugendspieler anderer Vereine bzw. erzeugte
// Spieler (kein volles Profil mit Fantasiewerten): Name, Verein, Position, Alter,
// Werte im gewählten Wettbewerb. Profis und eigene Jugend öffnen das normale Profil.
// =============================================================================
import type { Game } from '../../../game/state';
import { STAT_CATS, type StatCat } from '../../../game/leagueArchive';
import { isVirtual } from '../../../game/youthComps/sim';
import type { YcSnapshot } from '../../../game/youthComps/view';
import { KV } from '../../../ui/DashPage';
import { TeamName } from '../../statistiken/competition/parts';
import PosBadge from '../../../components/PosBadge';

const LABEL: Record<StatCat, string> = { goals: 'Tore', assists: 'Vorlagen', scorer: 'Scorer', yellow: 'Gelbe Karten', red: 'Rote Karten', clean: 'Zu-null-Spiele' };

/** Karte oder null (dann normales Spielerprofil). */
export function youthPlayerCard(g: Game, snap: YcSnapshot | null, pid: string, close: () => void) {
  if (!snap || g.players[pid] || g.youthPlayers[pid]?.clubId === g.managedClubId) return null;
  const rows = STAT_CATS.map((c) => ({ c, r: snap.stats?.[c]?.find((x) => x.pid === pid) }));
  const any = rows.find((x) => x.r)?.r;
  if (!any) return null;
  const real = g.youthPlayers[pid];
  const cls = snap.section;
  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal yc-card" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">{snap.compLabel} · {snap.season}</div>
            <h2 className="yc-card-name">{any.name}{any.pos && <PosBadge pos={any.pos} className="cmp-pos" />}</h2>
          </div>
          <button className="dchip" onClick={close} title="Schließen">×</button>
        </div>
        <div className="mx-body">
          <KV k="Verein" v={any.clubId ? <TeamName g={g} id={any.clubId} season={snap.season} size={16} /> : '–'} />
          <KV k="Alter" v={real ? `${real.age} Jahre` : cls} />
          <KV k="Einsätze" v={any.apps} />
          {rows.filter((x) => x.c !== 'scorer').map(({ c, r }) => <KV key={c} k={LABEL[c]} v={r?.value ?? '–'} />)}
          <div className="dnote mt8">{isVirtual(pid) || !real
            ? 'Spieler aus der Jugend eines anderen Vereins – bekannt sind nur seine Werte in diesem Wettbewerb.'
            : 'Talent eines anderen Vereins – ein ausführliches Profil gibt es erst, wenn deine Scouts ihn beobachten oder er Profi wird.'}</div>
        </div>
      </div>
    </div>
  );
}
