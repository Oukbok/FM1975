// =============================================================================
// SPIELENDE — Abschluss-Bildschirm nach dem Abstieg aus der untersten Liga
// -----------------------------------------------------------------------------
// Zeigt die im Spielstand festgehaltene Karrierebilanz (`game.over`,
// game/relegationGame.ts). Kein Weiterspielen: nur „Letzten Spielstand laden“
// (jüngster gespeicherter Stand) und „Hauptmenü“. CSS `28-gameover.css` (`.go-*`),
// feste Größen, Farben nur über Tokens.
// =============================================================================
import ClubCrest from '../components/ClubCrest';
import { listSaves } from '../engine/save';
import type { Game } from '../game/state';
import { fmtDateFull } from '../ui/format';
import { nOf } from '../engine/textNum';

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="go-stat">
      <span className="go-stat-l">{label}</span>
      <b className="go-stat-v">{value}</b>
      <span className="go-stat-s">{sub ?? ''}</span>
    </div>
  );
}

export function GameOverScreen({ g, onExit, onLoad }: { g: Game; onExit: () => void; onLoad: (slot: string) => void }) {
  const o = g.over;
  if (!o) return null;
  const club = g.clubs[o.clubId];
  const last = listSaves()[0];
  const [w, d, l, gf, ga] = o.record;
  const n = w + d + l;
  const titles = o.titles.reduce((a, t) => a + t.n, 0);
  return (
    <div className="go-root" role="dialog" aria-label="Spielende">
      <div className="go-sheet">
        <header className="go-head">
          <span className="go-eyebrow">Abpfiff · Saison {o.season}</span>
          <h1 className="go-title">Das Ende deiner Amtszeit</h1>
        </header>

        <section className="go-story">
          <div className="go-crest">{club && <ClubCrest club={club} size={190} />}</div>
          <div className="go-story-txt">
            <p className="go-lead">{o.clubName} steigt als {o.pos}. von {o.size} aus der {o.league} in den Amateurbereich ab.</p>
            <p className="go-text">
              Der Vorstand trennt sich von {o.manager}. {g.career?.releg && g.manager?.startMode === 'career'
                ? 'Kein Verein, der zu deinem Ansehen passt, hat dir ein Angebot gemacht – deine Laufbahn als Manager ist vorbei.'
                : 'Du hast dich für diesen einen Verein entschieden – mit dem Abstieg aus der untersten Liga ist das Spiel zu Ende.'}
            </p>
            <p className="go-date">{fmtDateFull(o.date)} · im Amt seit {o.from}</p>
          </div>
        </section>

        <section className="go-stats" aria-label="Karrierebilanz">
          <Stat label="Saisons" value={String(o.seasons)} sub={`seit ${o.from}`} />
          <Stat label="Titel" value={String(titles)} sub={titles ? o.titles.slice(0, 2).map((t) => `${t.n} × ${t.label}`).join(' · ') : 'ohne Titel'} />
          <Stat label="Beste Platzierung" value={o.best ? `${o.best.pos}.` : '–'} sub={o.best ? `${o.best.league} ${o.best.season}` : ''} />
          <Stat label="Bilanz S–U–N" value={`${w}–${d}–${l}`} sub={`${nOf(n, 'Pflichtspiel', 'Pflichtspiele')} · ${gf}:${ga} Tore`} />
          <Stat label="Ansehen" value={String(o.rep)} sub="von 100" />
        </section>

        <div className="go-titles">
          {o.titles.length
            ? o.titles.slice(0, 8).map((t) => <span key={t.label} className="go-chip">{t.n > 1 ? `${t.n} × ` : ''}{t.label}</span>)
            : <span className="go-none">Kein Pokal in der Vitrine – aber jede Saison war deine.</span>}
        </div>

        <footer className="go-foot">
          <span className="go-hint">{last ? `Letzter Spielstand: ${last.name}` : 'Kein gespeicherter Spielstand vorhanden.'}</span>
          <button type="button" className="go-btn" disabled={!last} onClick={() => last && onLoad(last.slot)}>Letzten Spielstand laden</button>
          <button type="button" className="go-btn primary" onClick={onExit}>Hauptmenü</button>
        </footer>
      </div>
    </div>
  );
}
