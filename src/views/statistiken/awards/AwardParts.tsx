// =============================================================================
// DIE BESTEN DER SAISON — gemeinsame Bausteine (Popup + Seite Statistiken › Auszeichnungen)
// Karte je Mannschaftsteil (Gesicht, Wappen, Name, Kennzahlen, Begründung, Plätze 2/3),
// Ehrenzeile (Spieler der Saison / Newcomer). CSS 28-awards.css (.aw-*).
// =============================================================================
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import type { CSSProperties } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import PlayerAvatar, { hasFacePhoto } from '../../../components/PlayerAvatar';
import { seasonStartYear } from '../../../data/timeline';
import { AWARD_CAT_LABEL, type AwardCat } from '../../../engine/seasonAwards';
import { clubView } from '../../../game/clubProfile';
import type { AwardEntry, AwardSeason } from '../../../game/seasonAwardsGame';
import type { Game } from '../../../game/state';
import PosBadge from '../../../components/PosBadge';

export const fmtGrade = (v: number) => v.toFixed(2).replace('.', ',');

/** Gesicht des Spielers (falls er noch im Spielstand ist), sonst Initialen. */
export function AwardFace({ g, e, size }: { g: Game; e: AwardEntry; size: number }) {
  const p = g.players[e.p] ?? g.youthPlayers?.[e.p];
  // Foto: ganzer freigestellter Kopf inkl. Hals in der Höhe der Box (kein Kreis, kein Beschnitt)
  if (p && hasFacePhoto(p)) return <span className="aw-face" style={{ width: size, height: size }}><PlayerAvatar key={p.id} player={p} club={g.clubs[p.clubId]} size={Math.round(size * 512 / 600)} /></span>;
  if (p) return <span className="aw-face" style={{ width: size, height: size }}><PlayerAvatar player={p} club={g.clubs[p.clubId]} size={size} /></span>;
  const ini = e.n.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return <span className="aw-face aw-face-none" style={{ width: size, height: size, fontSize: size * 0.34 }}>{ini}</span>;
}

/** Wappen + Vereinsname zur Saison (klickbar, wenn ein Profil existiert). */
export function AwardClub({ g, e, season, size = 22 }: { g: Game; e: AwardEntry; season: string; size?: number }) {
  const v = clubView(g, e.c, seasonStartYear(season));
  return (
    <ClubLink id={e.c} className="aw-club">
      {v ? <ClubCrest club={v as never} size={size} /> : null}
      <span className="aw-club-name">{e.cn}</span>
    </ClubLink>
  );
}

/** Die vier Kennzahlen einer Karte – je Mannschaftsteil passend. */
export function awardKpis(cat: AwardCat, e: AwardEntry): { k: string; v: string }[] {
  const base = [{ k: 'Spiele', v: String(e.ap) }, { k: 'Note', v: fmtGrade(e.g) }];
  if (cat === 'GK') return [...base, { k: 'Zu null', v: String(e.cs) }, { k: 'Gegentore/Sp.', v: fmtGrade(e.ga) }];
  if (cat === 'DEF') return [...base, { k: 'Zu null', v: String(e.cs) }, { k: 'Tore/Vorl.', v: `${e.gl}/${e.as}` }];
  return [...base, { k: 'Tore', v: String(e.gl) }, { k: 'Vorlagen', v: String(e.as) }];
}

const nameBtn = (e: AwardEntry, onPlayer?: (pid: string) => void, cls = 'aw-name') => (
  onPlayer
    ? <button type="button" className={`${cls} aw-link`} onClick={() => onPlayer(e.p)}>{e.n}</button>
    : <span className={cls}><PlayerLink id={e.p}>{e.n}</PlayerLink></span>
);

/** Karte eines Mannschaftsteils: Sieger groß, Plätze 2 und 3 darunter. */
export function AwardCard({ g, s, cat, k = 0, onPlayer, compact = false }: {
  g: Game; s: AwardSeason; cat: AwardCat; k?: number; onPlayer?: (pid: string) => void; compact?: boolean;
}) {
  const list = s.cats[cat];
  const w = list[0];
  const mine = s.mine ?? g.managedClubId;
  if (!w) {
    return (
      <article className="aw-card empty" style={{ '--k': k } as CSSProperties}>
        <div className="aw-cat">{AWARD_CAT_LABEL[cat]}</div>
        <div className="aw-none">Niemand erreichte die Mindestzahl an Einsätzen.</div>
      </article>
    );
  }
  return (
    <article className={`aw-card ${w.c === mine ? 'mine' : ''} ${compact ? 'compact' : ''}`} style={{ '--k': k } as CSSProperties}>
      <div className="aw-cat">
        <span>{AWARD_CAT_LABEL[cat]}</span>
        {s.best === cat && <span className="aw-tag">Spieler der Saison</span>}
      </div>
      <div className="aw-hero">
        <AwardFace g={g} e={w} size={compact ? 64 : 92} />
        <div className="aw-who">
          {nameBtn(w, onPlayer)}
          <div className="aw-meta"><PosBadge pos={w.pos} /><span>{w.a} Jahre</span></div>
          <AwardClub g={g} e={w} season={s.season} size={compact ? 20 : 24} />
        </div>
      </div>
      <div className="aw-kpis">
        {awardKpis(cat, w).map((x) => (
          <div key={x.k} className="aw-kpi"><b>{x.v}</b><span>{x.k}</span></div>
        ))}
      </div>
      {w.why && <p className="aw-why">{w.why}</p>}
      <ol className="aw-rest" start={2}>
        {list.slice(1).map((e, i) => (
          <li key={e.p} className={e.c === mine ? 'mine' : ''}>
            <span className="aw-rk">{i + 2}</span>
            {nameBtn(e, onPlayer, 'aw-rest-name')}
            <span className="aw-rest-club">{e.cn}</span>
            <span className="aw-rest-val">{fmtGrade(e.g)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

/** Ehrenzeile: Spieler der Saison und Newcomer. */
export function AwardHonours({ g, s, onPlayer, k = 4 }: { g: Game; s: AwardSeason; onPlayer?: (pid: string) => void; k?: number }) {
  const best = s.best ? s.cats[s.best][0] : undefined;
  const mine = s.mine ?? g.managedClubId;
  const items: { title: string; e: AwardEntry; sub: string }[] = [];
  if (best && s.best) items.push({ title: 'Spieler der Saison', e: best, sub: `hob sich als ${AWARD_CAT_LABEL[s.best]} am deutlichsten von seiner Konkurrenz ab` });
  if (s.rookie) items.push({ title: 'Newcomer der Saison', e: s.rookie, sub: s.rookie.why ?? `${s.rookie.a} Jahre, ${s.rookie.ap} Spiele` });
  if (!items.length) return null;
  return (
    <div className="aw-honours">
      {items.map((it, i) => (
        <div key={it.title} className={`aw-honour ${it.e.c === mine ? 'mine' : ''}`} style={{ '--k': k + i } as CSSProperties}>
          <AwardFace g={g} e={it.e} size={48} />
          <div className="aw-honour-txt">
            <span className="aw-honour-title">{it.title}</span>
            <span className="aw-honour-name">{nameBtn(it.e, onPlayer, 'aw-honour-n')}<span className="aw-honour-club"> · {it.e.cn}{it.title.startsWith('Newcomer') ? ` · ${it.e.a} Jahre` : ''}</span></span>
            <span className="aw-honour-sub">{it.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
