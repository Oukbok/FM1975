// =============================================================================
// Presse: die Zeitungsseite einer Ausgabe – Kopf, Aufmacher, Spalten,
// Ergebnisse/Tabelle/Torjäger, Kurzmeldungen. Jede Schlagzeile öffnet den
// Artikel, Gesichter das Spielerprofil, Wappen/Vereinsnamen das Vereinsprofil.
// =============================================================================
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';
import { useLayoutEffect, useRef, useState } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import { fmtDateFull } from '../../../ui/format';
import { weekdayOf } from '../../../game/press/calendar';
import type { PressEdition, PressStory } from '../../../game/press/types';
import { Crest, Face, ResultLine, StoryImage, clubShort, type PressApi } from './parts';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const longDate = (iso: string) => `${weekdayOf(iso)}, ${Number(iso.slice(8, 10))}. ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

/** Era-Klasse für die Typografie des Kopfes. */
const eraClass = (year: number) => year < 1986 ? 'np-e1' : year < 1998 ? 'np-e2' : year < 2012 ? 'np-e3' : 'np-e4';

function Rubric({ s }: { s: PressStory }) {
  return (
    <div className={`np-rubric ${s.own ? 'own' : ''}`}>
      {s.rubric}{s.rumor && <span className="np-tag">Gerücht</span>}
    </div>
  );
}

function open(api: PressApi, id: string) {
  return {
    role: 'button', tabIndex: 0,
    onClick: () => api.openStory(id),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') api.openStory(id); },
  } as const;
}

/** Artikel in einer Spalte: Rubrik, Schlagzeile, Bild, Anriss. */
function Teaser({ api, s }: { api: PressApi; s: PressStory }) {
  const big = s.image?.kind === 'player' || s.image?.kind === 'coach';
  return (
    <article className={`np-teaser ${s.own ? 'own' : ''}`} {...open(api, s.id)}>
      <Rubric s={s} />
      <h3 className={`np-h3 ${s.rumor ? 'rumor' : ''}`}>{s.headline}</h3>
      <div className="np-teaser-body">
        {s.image && <span className={`np-teaser-img ${big ? 'face' : ''}`}><StoryImage api={api} img={s.image} size={big ? 64 : 44} /></span>}
        <p className="np-text">{s.dek && <b className="np-dek-in">{s.dek}. </b>}{s.body[0]}</p>
      </div>
      {s.people.length > 1 && (
        <div className="np-faces">{s.people.slice(1, 5).map((id) => <Face key={id} api={api} id={id} size={30} />)}</div>
      )}
    </article>
  );
}

function Lead({ api, s }: { api: PressApi; s: PressStory }) {
  const face = s.image?.kind === 'player' || s.image?.kind === 'coach';
  return (
    <article className={`np-lead ${s.own ? 'own' : ''}`} {...open(api, s.id)}>
      <div className="np-lead-img">
        <StoryImage api={api} img={s.image} size={face ? 150 : 130} />
        {s.image?.kind === 'player' && <div className="np-caption"><PlayerLink id={s.image.id}>{api.g.players[s.image.id]?.fullName ?? ''}</PlayerLink></div>}
      </div>
      <div className="np-lead-main">
        <Rubric s={s} />
        <h2 className={`np-h1 ${s.rumor ? 'rumor' : ''}`}>{s.headline}</h2>
        {s.dek && <div className="np-dek">{s.dek}</div>}
        <div className="np-lead-text">
          {s.body.slice(0, 3).map((p, i) => <p key={i} className="np-text">{p}</p>)}
        </div>
        <div className="np-more">Weiterlesen</div>
      </div>
    </article>
  );
}

export function Newspaper({ api, ed }: { api: PressApi; ed: PressEdition }) {
  const g = api.g, my = g.managedClubId;
  const year = Number(ed.date.slice(0, 4));
  // Die Doppelseite passt immer ins Bild (Wunsch Pascal: kein Scrollen). Läuft ein Bereich über,
  // wird nur dort gekürzt: Spalten → hintere Artikel, „Kurz notiert“ → Meldungen, Seitenleiste → Torjäger.
  const ref = useRef<HTMLDivElement>(null);
  const [cut, setCut] = useState({ left: 0, right: 0, brief: 0, side: 0 });
  useLayoutEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    const over = (sel: string) => [...sheet.querySelectorAll<HTMLElement>(sel)].some((el) => el.scrollHeight > el.clientHeight + 1);
    const next = { ...cut };
    if (over('.np-left, .np-cols > .np-col') && next.left < 4) next.left++;
    if (over('.np-right > .np-col') && next.right < 5) next.right++;
    if (over('.np-briefs') && next.brief < 20) next.brief++;
    if (over('.np-side') && next.side < 10) next.side++;
    if (next.left !== cut.left || next.right !== cut.right || next.brief !== cut.brief || next.side !== cut.side) setCut(next);
  });
  useLayoutEffect(() => {
    const onResize = () => setCut({ left: 0, right: 0, brief: 0, side: 0 });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const allBriefs = [...ed.stories.slice(9), ...ed.briefs];
  // Doppelseite (Bild bilder/akte/zeitung.webp): links Aufmacher + zwei Spalten,
  // rechts eine Spalte + Ergebnisse/Tabelle/Torjäger, unten „Kurz notiert“ über beide Seiten.
  // Links je zwei Artikel, rechts der Rest (die rechte Spalte hat die ganze Höhe).
  const st = ed.stories.slice(0, 9);
  const leftList = [st[0], st[1], st[3], st[4]].filter(Boolean).slice(0, Math.max(0, 4 - cut.left));
  const rightList = [st[2], ...st.slice(5)].filter(Boolean).slice(0, Math.max(0, 5 - cut.right));
  const cols: PressStory[][] = [leftList.filter((_, i) => i % 2 === 0), leftList.filter((_, i) => i % 2 === 1), rightList];
  const colBox = (list: PressStory[], i: number) => (
    <div key={i} className="np-col">{list.map((s) => <Teaser key={s.id} api={api} s={s} />)}</div>
  );
  const briefs = allBriefs.slice(0, Math.max(0, allBriefs.length - cut.brief));
  const scorers = ed.scorers.slice(0, Math.max(0, ed.scorers.length - cut.side));
  const n = ed.table.length;
  const top = ed.table.slice(0, 5), bottom = n > 8 ? ed.table.slice(-3) : [];
  const zone = (pos: number) => pos === 1 ? 'np-z-top' : pos > n - 3 ? 'np-z-down' : '';
  return (
    <div ref={ref} className={`np-sheet ${eraClass(year)}`}>
      <header className="np-mast">
        <div className="np-mast-l">Ausgabe Nr. {ed.number}<br />{ed.volume}. Jahrgang</div>
        <div className="np-mast-c">
          <div className="np-name">{ed.masthead.name}</div>
          <div className="np-claim">{ed.masthead.claim}</div>
        </div>
        <div className="np-mast-r">{longDate(ed.date)}<br />{ed.regular ? (new Date(ed.date + 'T00:00:00Z').getUTCDay() === 1 ? 'Montagsausgabe' : 'Donnerstagsausgabe') : 'Aktuelle Ausgabe'}</div>
      </header>

      <div className="np-left">
        {ed.lead ? <Lead api={api} s={ed.lead} /> : <div className="np-empty">Die Redaktion meldet: ruhige Tage – keine großen Nachrichten seit {fmtDateFull(ed.from)}.</div>}
        <div className="np-cols">{colBox(cols[0], 0)}{colBox(cols[1], 1)}</div>
      </div>

      <div className="np-right">
        {colBox(cols[2], 2)}
        <aside className="np-side">
          {ed.matchday && (
            <section>
              <div className="np-sec">{ed.matchday.md}. Spieltag</div>
              {ed.matchday.results.map((r, i) => <ResultLine key={r.matchId ?? i} api={api} r={r} my={my} />)}
            </section>
          )}
          {ed.upcoming && (
            <section>
              <div className="np-sec">{ed.upcoming.md}. Spieltag · Vorschau</div>
              {ed.upcoming.pairs.map((m, i) => (
                <div key={i} className="np-res">
                  <span className={`np-res-team h ${m.home === my ? 'me' : ''}`}><ClubLink id={m.home}><span className="np-res-name">{clubShort(g, m.home)}</span></ClubLink><Crest g={g} id={m.home} size={20} /></span>
                  <span className="np-res-score np-res-date">{m.date.slice(8, 10)}.{m.date.slice(5, 7)}.</span>
                  <span className={`np-res-team ${m.away === my ? 'me' : ''}`}><Crest g={g} id={m.away} size={20} /><ClubLink id={m.away}><span className="np-res-name">{clubShort(g, m.away)}</span></ClubLink></span>
                </div>
              ))}
            </section>
          )}
          {ed.table.some((r) => r.played > 0) && (
            <section>
              <div className="np-sec">Tabelle</div>
              <table className="np-table">
                <tbody>
                  {top.map((r) => <TabRow key={r.clubId} api={api} r={r} cls={zone(r.pos)} my={my} />)}
                  {bottom.length > 0 && <tr className="np-gap"><td colSpan={4}>···</td></tr>}
                  {bottom.map((r) => <TabRow key={r.clubId} api={api} r={r} cls={zone(r.pos)} my={my} />)}
                </tbody>
              </table>
            </section>
          )}
          {scorers.length > 0 && (
            <section>
              <div className="np-sec">Torjäger</div>
              {scorers.map((s) => (
                <div key={s.id} className={`np-scorer ${s.clubId === my ? 'me' : ''}`}>
                  <Face api={api} id={s.id} size={28} />
                  <span className="np-scorer-name" role="button" tabIndex={0} onClick={() => api.openPlayer(s.id)}>{s.name}</span>
                  <Crest g={g} id={s.clubId} size={18} />
                  <b>{s.goals}</b>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      {briefs.length > 0 && (
        <section className="np-briefs">
          <div className="np-sec">Kurz notiert</div>
          <div className="np-brief-cols">
            {briefs.map((s) => (
              <div key={s.id} className={`np-brief ${s.own ? 'own' : ''}`} {...open(api, s.id)}>
                <b>{s.headline}</b> <span>{s.body[0]}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TabRow({ api, r, cls, my }: { api: PressApi; r: PressEdition['table'][number]; cls: string; my: string }) {
  return (
    <tr className={`${cls} ${r.clubId === my ? 'me' : ''}`}>
      <td className="np-pos">{r.pos}.</td>
      <td className="np-club"><Crest g={api.g} id={r.clubId} size={18} /><ClubLink id={r.clubId}><span>{clubShort(api.g, r.clubId)}</span></ClubLink></td>
      <td className="np-num">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
      <td className="np-num"><b>{r.pts}</b></td>
    </tr>
  );
}
