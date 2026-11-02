// =============================================================================
// Presse: die Zeitungsseite einer Ausgabe – Kopf, Aufmacher, Spalten,
// Ergebnisse/Tabelle/Torjäger, Kurzmeldungen. Jede Schlagzeile öffnet den
// Artikel, Gesichter das Spielerprofil, Wappen/Vereinsnamen das Vereinsprofil.
// =============================================================================
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
        {s.image?.kind === 'player' && <div className="np-caption">{api.g.players[s.image.id]?.fullName ?? ''}</div>}
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
  const cols: PressStory[][] = [[], [], []];
  const main = ed.stories.slice(0, 9);
  main.forEach((s, i) => cols[i % 3].push(s));
  const briefs = [...ed.stories.slice(9), ...ed.briefs];
  const n = ed.table.length;
  const top = ed.table.slice(0, 5), bottom = n > 8 ? ed.table.slice(-3) : [];
  const zone = (pos: number) => pos === 1 ? 'np-z-top' : pos > n - 3 ? 'np-z-down' : '';
  return (
    <div className={`np-sheet ${eraClass(year)}`}>
      <header className="np-mast">
        <div className="np-mast-l">Ausgabe Nr. {ed.number}<br />{ed.volume}. Jahrgang</div>
        <div className="np-mast-c">
          <div className="np-name">{ed.masthead.name}</div>
          <div className="np-claim">{ed.masthead.claim}</div>
        </div>
        <div className="np-mast-r">{longDate(ed.date)}<br />{ed.regular ? (new Date(ed.date + 'T00:00:00Z').getUTCDay() === 1 ? 'Montagsausgabe' : 'Donnerstagsausgabe') : 'Aktuelle Ausgabe'}</div>
      </header>

      <div className="np-grid">
        <div className="np-front">
          {ed.lead ? <Lead api={api} s={ed.lead} /> : <div className="np-empty">Die Redaktion meldet: ruhige Tage – keine großen Nachrichten seit {fmtDateFull(ed.from)}.</div>}
          <div className="np-cols">
            {cols.map((list, i) => (
              <div key={i} className="np-col">
                {list.map((s) => <Teaser key={s.id} api={api} s={s} />)}
              </div>
            ))}
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
          {ed.scorers.length > 0 && (
            <section>
              <div className="np-sec">Torjäger</div>
              {ed.scorers.map((s) => (
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
