// =============================================================================
// Sponsoring — Bedienung aller Reiter: Linksklick öffnet die Karteikarte
// (SponsorCard), Rechtsklick (Touch: langer Druck) ein Kontextmenü mit den
// vorhandenen Aktionen: Annehmen, Verhandeln, Ablehnen, Option ziehen, Auflösen,
// Namensrechte verkaufen, Sprung zu Trainingslager/Kartenverkauf/Stadion.
// =============================================================================
import { standLabel } from '../../../game/standNames';
import { useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../../components/Icon';
import type { IconName } from '../../../components/iconPaths';
import { SLOT_BY_ID } from '../../../data/sponsorCatalog';
import { STAND } from '../../../data/seatingCatalog';
import { acceptNaming, currentNamingOffers } from '../../../game/clubBusiness';
import { exerciseOption, rejectSponsorOffer, signSponsorOffer, terminationCost } from '../../../game/sponsorGame';
import type { Game } from '../../../game/state';
import type { Screen } from '../../../shell/navigation';
import type { StandId } from '../../../types';
import { fmtDM } from '../../../ui/format';
import { NegotiateModal } from './NegotiateModal';
import { SponsorCard } from './SponsorCard';
import type { SpTarget } from './model';

interface MenuItem { label: string; icon: IconName; run: () => void; sep?: boolean; off?: boolean }
const LONG_PRESS_MS = 550;
/** Portal in den skalierten Anzeigebereich (sonst sperren Boxen mit Filter das feste Overlay ein). */
const host = () => (document.querySelector('.display-content') ?? document.body) as Element;

export interface SponsorUi {
  /** Props für ein anklickbares Element (Kachel, Zeile, Bande, Tribüne). */
  bind: (t: SpTarget, label?: string) => {
    onClick: (e: MouseEvent) => void; onContextMenu: (e: MouseEvent) => void; onKeyDown: (e: KeyboardEvent) => void;
    onPointerDown: (e: PointerEvent) => void; onPointerUp: () => void; onPointerLeave: () => void;
    tabIndex: number; role: 'button'; 'aria-label'?: string; 'data-sp': string;
  };
  /** Gerade in der Karteikarte offenes Ziel (Hervorhebung). */
  isOpen: (t: SpTarget) => boolean;
  note: string | null;
  layer: JSX.Element;
  act: (err: string | null) => void;
}

export const targetKey = (t: SpTarget) =>
  t.kind === 'deal' || t.kind === 'offer' ? `${t.kind}:${t.id}` : t.kind === 'free' || t.kind === 'locked' ? `${t.kind}:${t.slot}`
    : t.kind === 'namingOffer' ? `no:${t.idx}` : t.kind === 'stand' ? `st:${t.id}` : 'naming';

export function useSponsorUi(g: Game, onChange: () => void, onGoto: (s: Screen) => void): SponsorUi {
  const [card, setCard] = useState<SpTarget | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; t: SpTarget } | null>(null);
  const [talk, setTalk] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const press = useRef<number | null>(null);
  const club = g.clubs[g.managedClubId];
  const com = club.commerce;
  const act = (err: string | null) => { setNote(err); onChange(); };

  const items = (t: SpTarget): MenuItem[] => {
    const close = () => setMenu(null);
    const run = (f: () => void) => () => { f(); close(); };
    const details: MenuItem = { label: 'Details', icon: 'contracts', run: run(() => setCard(t)) };
    if (t.kind === 'deal') {
      const d = com?.deals?.find((x) => x.id === t.id);
      if (!d) return [details];
      const out: MenuItem[] = [details];
      if (d.clauses.some((k) => k.kind === 'option') && d.yearsLeft <= 1) out.push({ label: 'Verlängerungsoption ziehen', icon: 'unlock', run: run(() => act(exerciseOption(g, d.id))) });
      const renew = com?.dealOffers?.find((o) => o.renewal && o.partner === d.partner);
      if (renew) out.push({ label: 'Verlängerungsangebot ansehen', icon: 'negotiations', run: run(() => setCard({ kind: 'offer', id: renew.id })) });
      if (d.clauses.some((k) => k.kind === 'camp')) out.push({ label: 'Zum Trainingslager', icon: 'transit', run: run(() => onGoto('trainingslager')) });
      out.push({ label: `Auflösen … (${fmtDM(terminationCost(g, d))})`, icon: 'close', sep: true, run: run(() => setCard(t)) });
      return out;
    }
    if (t.kind === 'offer') {
      const o = com?.dealOffers?.find((x) => x.id === t.id);
      if (!o) return [details];
      return [
        details,
        { label: o.renewal ? 'Verlängerung annehmen' : 'Angebot annehmen', icon: 'contracts', sep: true, run: run(() => act(signSponsorOffer(g, o.id))) },
        { label: 'Verhandeln', icon: 'negotiations', run: run(() => setTalk(o.id)) },
        { label: 'Ablehnen', icon: 'close', run: run(() => { rejectSponsorOffer(g, o.id); act(null); }) },
      ];
    }
    if (t.kind === 'free') {
      const offers = (com?.dealOffers ?? []).filter((o) => o.slot === t.slot && !o.renewal);
      return [
        { label: offers.length ? `${offers.length} Angebot${offers.length === 1 ? '' : 'e'} für diese Fläche` : 'Fläche ansehen', icon: 'sponsoring', run: run(() => setCard(t)) },
        ...offers.slice(0, 3).map((o, i) => ({ label: `Annehmen: ${o.partner}`, icon: 'contracts' as IconName, sep: i === 0, run: run(() => act(signSponsorOffer(g, o.id))) })),
      ];
    }
    if (t.kind === 'namingOffer') {
      return [details, { label: 'Namensrechte verkaufen …', icon: 'contracts', sep: true, run: run(() => setCard(t)) }];
    }
    if (t.kind === 'naming') {
      const n = currentNamingOffers(g).length;
      return [details, ...(n ? [{ label: `${n} Angebote ansehen`, icon: 'negotiations' as IconName, run: run(() => setCard(t)) }] : []),
        { label: 'Zum Stadion', icon: 'stadium', sep: true, run: run(() => onGoto('stadium')) }];
    }
    if (t.kind === 'stand') {
      return [details, { label: 'Benennen: Legende oder Sponsor', icon: 'trophy', run: run(() => setCard(t)) },
        { label: 'Zum Kartenverkauf', icon: 'ticket', sep: true, run: run(() => onGoto('kartenverkauf')) }];
    }
    return [details];
  };

  const bind: SponsorUi['bind'] = (t, label) => ({
    onClick: (e) => { e.stopPropagation(); setCard(t); },
    onContextMenu: (e) => { e.preventDefault(); e.stopPropagation(); setMenu({ x: e.clientX, y: e.clientY, t }); },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCard(t); }
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault();
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenu({ x: r.left + 12, y: r.top + r.height / 2, t });
      }
    },
    onPointerDown: (e) => {
      if (e.pointerType !== 'touch') return;
      const { clientX: x, clientY: y } = e;
      press.current = window.setTimeout(() => { setMenu({ x, y, t }); navigator.vibrate?.(10); }, LONG_PRESS_MS);
    },
    onPointerUp: () => { if (press.current) clearTimeout(press.current); press.current = null; },
    onPointerLeave: () => { if (press.current) clearTimeout(press.current); press.current = null; },
    tabIndex: 0, role: 'button', 'aria-label': label, 'data-sp': targetKey(t),
  });

  const head = (t: SpTarget): { name: string; sub: string } => {
    if (t.kind === 'deal') { const d = com?.deals?.find((x) => x.id === t.id); return { name: d?.partner ?? '', sub: d ? SLOT_BY_ID[d.slot].name : '' }; }
    if (t.kind === 'offer') { const o = com?.dealOffers?.find((x) => x.id === t.id); return { name: o?.partner ?? '', sub: o ? `Angebot · ${SLOT_BY_ID[o.slot].short}` : '' }; }
    if (t.kind === 'free') return { name: SLOT_BY_ID[t.slot].name, sub: 'frei' };
    if (t.kind === 'locked') return { name: SLOT_BY_ID[t.slot].name, sub: 'noch gesperrt' };
    if (t.kind === 'namingOffer') return { name: currentNamingOffers(g)[t.idx]?.sponsor ?? '', sub: 'Namensrechte' };
    if (t.kind === 'stand') return { name: standLabel(club, t.id as StandId), sub: 'Tribüne' };
    return { name: club.stadium.name, sub: 'Stadion' };
  };

  const list = menu ? items(menu.t) : [];
  const W = 300, H = 46 + list.length * 38;
  const left = menu ? Math.max(8, Math.min(menu.x, window.innerWidth - W - 8)) : 0;
  const top = menu ? Math.max(8, Math.min(menu.y, window.innerHeight - H - 8)) : 0;
  const mh = menu ? head(menu.t) : null;

  const layer = (
    <>
      {menu && mh && createPortal(
        <div className="pcm-layer" onMouseDown={() => setMenu(null)} onContextMenu={(e) => { e.preventDefault(); setMenu(null); }}>
          <div className="pcm sp3-menu" role="menu" style={{ left, top, width: W }} onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') setMenu(null); }}>
            <div className="pcm-head"><span className="pcm-name">{mh.name}</span><span className="pcm-sub">{mh.sub}</span></div>
            {list.map((it, i) => (
              <button key={it.label} type="button" role="menuitem" autoFocus={i === 0} disabled={it.off}
                className={`pcm-item ${it.sep ? 'sep' : ''}`} onClick={it.run}>
                <Icon name={it.icon} size={16} /> <span>{it.label}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
      {card && createPortal(
        <SponsorCard g={g} t={card} onClose={() => setCard(null)} onOpen={setCard} onTalk={(id) => setTalk(id)} onGoto={onGoto}
          onAct={(err) => act(err)}
          onNaming={(idx) => { const o = currentNamingOffers(g)[idx]; if (o) { setNote(acceptNaming(g, o)); onChange(); } setCard({ kind: 'naming' }); }} />,
        host(),
      )}
      {talk && createPortal(<NegotiateModal g={g} offerId={talk} onClose={() => setTalk(null)} onChange={onChange} />, host())}
    </>
  );
  return { bind, isOpen: (t) => !!card && targetKey(card) === targetKey(t), note, layer, act };
}
