// =============================================================================
// Presse: voller Artikel als Popup – Bild, Text, Ergebnisse, Beteiligte
// (Gesichter → Spielerprofil, Wappen → Vereinsprofil) und Sprungziele
// (Spielbericht, Tabelle, Transfermarkt …).
// =============================================================================
import { ClubLink } from '../../../components/club/ClubLink';
import { fmtDateFull } from '../../../ui/format';
import type { Screen } from '../../../shell/navigation';
import type { PressEdition, PressStory } from '../../../game/press/types';
import { Crest, Face, ResultLine, StoryImage, clubShort, type PressApi } from './parts';

export function ArticleModal({ api, s, ed, onClose, onGoto }: { api: PressApi; s: PressStory; ed: PressEdition; onClose: () => void; onGoto: (sc: Screen) => void }) {
  const g = api.g;
  const people = s.people.filter((id) => g.players[id] || g.youthPlayers[id]);
  const clubs = s.clubs.filter((id) => !!g.clubs[id]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl np-article" onClick={(e) => e.stopPropagation()}>
        <div className="mx-head">
          <div>
            <div className="mx-sub">{ed.masthead.name} · Nr. {ed.number} · {s.rubric} · {fmtDateFull(s.date)}</div>
            <h2 className={s.rumor ? 'np-rumor-h' : undefined}>{s.headline}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mx-body np-art-body">
          <div className="np-art-img">
            <StoryImage api={api} img={s.image} size={s.image?.kind === 'club' ? 150 : 190} />
            {s.rumor && <div className="np-art-note">Gerücht – nicht bestätigt</div>}
          </div>
          <div className="np-art-main">
            {s.dek && <div className="np-dek">{s.dek}</div>}
            {s.body.map((p, i) => <p key={i} className={i === 0 ? 'np-art-first' : 'np-art-p'}>{p}</p>)}
            {s.results && s.results.length > 0 && (
              <div className="np-art-res">
                <div className="np-sec">Ergebnisse</div>
                {s.results.map((r, i) => <ResultLine key={r.matchId ?? i} api={api} r={r} my={g.managedClubId} />)}
              </div>
            )}
            {(people.length > 0 || clubs.length > 0) && (
              <div className="np-art-who">
                <div className="np-sec">Im Artikel</div>
                <div className="np-art-chips">
                  {people.map((id) => (
                    <span key={id} className="np-who" onClick={() => api.openPlayer(id)} role="button" tabIndex={0}>
                      <Face api={api} id={id} size={40} />
                      <span>{(g.players[id] ?? g.youthPlayers[id]).fullName}<small>{clubShort(g, (g.players[id] ?? g.youthPlayers[id]).clubId)}</small></span>
                    </span>
                  ))}
                  {clubs.map((id) => (
                    <ClubLink key={id} id={id} className="np-who">
                      <Crest g={g} id={id} size={34} />
                      <span>{g.clubs[id].name}<small>Vereinsprofil</small></span>
                    </ClubLink>
                  ))}
                </div>
              </div>
            )}
            {s.targets.length > 0 && (
              <div className="np-art-actions">
                {s.targets.map((t, i) => (
                  <button key={i} className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => { if (t.kind === 'match') api.onWatch(t.id); else { onClose(); onGoto(t.screen); } }}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
