// =============================================================================
// Statistiken › Auszeichnungen, oben: Goldener Schuh und Trainer des Jahres
// (Wahl oben in AwardsView.tsx). Daten: game.extraAwards (game/extraAwardsGame.ts),
// CSS 28-awards.css (.gs-*, .tdj-*).
// =============================================================================
import type { CSSProperties } from 'react';
import ClubCrest from '../../../components/ClubCrest';
import { ClubLink } from '../../../components/club/ClubLink';
import { CountryFlag } from '../../../components/competition/CountryFlag';
import PosBadge from '../../../components/PosBadge';
import { COUNTRY_BY_KEY } from '../../../data/world/countries';
import { seasonStartYear } from '../../../data/timeline';
import { SHOE_WEIGHTED_FROM } from '../../../engine/goldenShoe';
import { clubView } from '../../../game/clubProfile';
import type { CoachSeason, GSEntry, GSSeason } from '../../../game/extraAwardsGame';
import type { Game } from '../../../game/state';
import { InfoTip } from '../../../ui/InfoTip';
import FaceThumb from '../../../components/FaceThumb';
import { AwardFace, AwardName, awardPerson } from './AwardParts';

const dec = (v: number) => String(v).replace('.', ',');
const landOf = (k: string) => COUNTRY_BY_KEY[k]?.name ?? k;

function Crest({ g, id, season, size }: { g: Game; id: string; season: string; size: number }) {
  const v = clubView(g, id, seasonStartYear(season));
  return v ? <ClubCrest club={v as never} size={size} /> : null;
}

/** Goldener Schuh: Sieger groß links, Top 10 als Tabelle rechts. */
export function GoldenShoeTop({ g, y }: { g: Game; y: GSSeason }) {
  const w = y.top[0];
  const weighted = seasonStartYear(y.s) + 1 >= SHOE_WEIGHTED_FROM;
  const mine = g.managedClubId;
  return (
    <div className="aw-page-top gs-top">
      <div className="gbt-sub">
        <span>Bester Torjäger Europas {y.s} · alle 1. Ligen</span>
        <span className="gbt-rule">{weighted ? 'Tore × Ligafaktor (Rang 1–5: 2 · Rang 6–21: 1,5 · sonst 1)' : 'Ungewichtet: reine Zahl der Ligatore'}</span>
        <InfoTip k="goldener_schuh" />
      </div>
      <div className="gs-body">
        <article className={`aw-card compact gs-hero ${w.c === mine ? 'mine' : ''}`} style={{ '--k': 0 } as CSSProperties}>
          <div className="aw-cat"><span>Goldener Schuh</span><span className="aw-tag">{landOf(w.k)}</span></div>
          <div className="aw-hero">
            <AwardFace g={g} e={w} size={88} />
            <div className="aw-who">
              <AwardName e={w} />
              <div className="aw-meta"><PosBadge pos={w.pos} /><CountryFlag country={w.k} height={14} /></div>
              <ClubLink id={w.c} className="aw-club"><Crest g={g} id={w.c} season={y.s} size={20} /><span className="aw-club-name">{w.cn}</span></ClubLink>
            </div>
          </div>
          <div className="aw-kpis">
            {[['Tore', String(w.gl)], ['Spiele', String(w.ap)], ['Faktor', dec(w.f)], ['Punkte', dec(w.pts)]].map(([k, v]) => (
              <div key={k} className="aw-kpi"><b>{v}</b><span>{k}</span></div>
            ))}
          </div>
          <p className="aw-why">{w.ap ? `${dec(Math.round((w.gl / w.ap) * 100) / 100)} Tore je Spiel – ${w.h ? 'in deiner Liga' : `in der 1. Liga (${landOf(w.k)})`}.` : ''}</p>
        </article>
        <div className="gs-table-wrap">
          <table className="dtable rl-players gs-table">
            <thead><tr><th>#</th><th>Spieler</th><th>Verein</th><th>Land</th><th className="num">Spiele</th><th className="num">Tore</th><th className="num">Faktor</th><th className="num">Punkte</th></tr></thead>
            <tbody>
              {y.top.map((e: GSEntry, i) => (
                <tr key={e.p} className={e.c === mine ? 'me' : ''}>
                  <td className="rl-rank">{i + 1}</td>
                  <td className="nowrap"><span className="gs-who"><FaceThumb p={awardPerson(g, e.p)} size={24} /><AwardName e={e} cls="gs-name" /></span></td>
                  <td className="nowrap gs-club"><ClubLink id={e.c}>{e.cn}</ClubLink></td>
                  <td className="nowrap gs-land"><CountryFlag country={e.k} height={12} /><span>{landOf(e.k)}</span></td>
                  <td className="num">{e.ap}</td>
                  <td className="num">{e.gl}</td>
                  <td className="num">{dec(e.f)}</td>
                  <td className="num gs-pts">{dec(e.pts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Trainer des Jahres: drei Karten mit Endplatz gegen Erwartung und Begründung. */
export function CoachAwardTop({ g, y }: { g: Game; y: CoachSeason }) {
  return (
    <div className="aw-page-top">
      <div className="gbt-sub">
        <span>Trainer des Jahres {y.s} · {y.dn}</span>
        <span className="gbt-rule">Gewählt von der Sportredaktion: Ergebnis gegen Erwartung, Titel, Europapokal</span>
        <InfoTip k="trainer_des_jahres" />
      </div>
      <div className="aw-grid compact tdj-grid">
        {y.top.map((e, i) => (
          <article key={e.c} className={`aw-card compact ${e.me ? 'mine' : ''} ${i === 0 ? 'gbt-first' : ''}`} style={{ '--k': i } as CSSProperties}>
            <div className="aw-cat"><span>Platz {i + 1}</span><span className="aw-tag">{e.pts.toFixed(1).replace('.', ',')} Punkte</span></div>
            <div className="aw-hero">
              <span className="tdj-crest"><Crest g={g} id={e.c} season={y.s} size={52} /></span>
              <div className="aw-who">
                <span className="aw-name">{e.n}</span>
                <ClubLink id={e.c} className="aw-club"><span className="aw-club-name">{e.cn}</span></ClubLink>
              </div>
            </div>
            <div className="aw-kpis tdj-kpis">
              {[['Endplatz', `${e.rk}.`], ['Erwartet', `${e.ex}.`], ['Differenz', e.ex - e.rk > 0 ? `+${e.ex - e.rk}` : String(e.ex - e.rk)]].map(([k, v]) => (
                <div key={k} className="aw-kpi"><b>{v}</b><span>{k}</span></div>
              ))}
            </div>
            <p className="aw-why">{e.why}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
