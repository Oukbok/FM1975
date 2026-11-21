// =============================================================================
// Vitrine „Vereinspokale“ (Vorbild EA FM „Erfolge › Vereinspokale“):
// oben die Kategorien Liga | Pokal | Kontinental | Jugend | Andere, links die
// Liste Saison + Titel, rechts die gewählte Trophäe groß mit Saison und Eckdaten.
// Genutzt auf Verein › Erfolge (eigener Verein) und im Vereinsprofil (Reiter Erfolge).
// Daten: game/trophyCabinet.ts; Zeichnung: TrophyArt.tsx; Fotos: data/trophyImages.ts.
// =============================================================================
import { useEffect, useMemo, useState } from 'react';
import { ClubLink } from '../../../components/club/ClubLink';
import { trophyPhoto } from '../../../data/trophyImages';
import type { Game } from '../../../game/state';
import { TROPHY_CATS, trophiesOf, trophyFacts, trophyTally, type TrophyCat, type TrophyEntry, type TrophyShape } from '../../../game/trophyCabinet';
import { InfoTip } from '../../../ui/InfoTip';
import { TrophyArt } from './TrophyArt';

const CAT_SHAPE: Record<TrophyCat, TrophyShape> = { liga: 'schale', pokal: 'pokal', kontinental: 'henkel', jugend: 'jugend', andere: 'halle' };
const CAT_EMPTY: Record<TrophyCat, string> = {
  liga: 'Noch keine Meisterschaft und kein Staffelsieg. Jede gewonnene Liga – auch 2. Liga, Regionalliga oder DDR-Oberliga – landet hier.',
  pokal: 'Der Landespokal fehlt noch in der Vitrine. Sechs Runden, ein Finale – und die Trophäe steht hier.',
  kontinental: 'Noch kein Europapokal. Landesmeister, Pokalsieger und Europa-Pokal (später Meisterliga, Europa-Liga, Konferenz-Liga) erscheinen hier.',
  jugend: 'Noch keine Jugendtitel. Deutsche A-/B-Jugend-Meisterschaft, Junioren-Pokal, Staffelsiege und die UEFA Youth League zählen hier.',
  andere: 'Hier stehen Hallen-Masters und Aufstiege, sobald dein Verein einen davon schafft.',
};

function Trophy({ shape }: { shape: TrophyShape }) {
  const src = trophyPhoto(shape);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [shape]);
  if (src && !failed) return <img className="tro-art tro-photo" src={src} alt="" onError={() => setFailed(true)} />;
  return <TrophyArt shape={shape} />;
}

const seasonLong = (s: string) => { const y = parseInt(s.slice(0, 4), 10); return `${y} / ${y + 1}`; };

export function TrophyCabinet({ g, clubId, className = '' }: { g: Game; clubId: string; className?: string }) {
  const all = useMemo(() => trophiesOf(g, clubId), [g, clubId, g.season]);
  const counts = useMemo(() => Object.fromEntries(TROPHY_CATS.map((c) => [c.key, all.filter((e) => e.cat === c.key).length])) as Record<TrophyCat, number>, [all]);
  const [cat, setCat] = useState<TrophyCat>(() => TROPHY_CATS.find((c) => counts[c.key] > 0)?.key ?? 'liga');
  const list = all.filter((e) => e.cat === cat);
  const [selId, setSelId] = useState<string | null>(null);
  const sel: TrophyEntry | undefined = list.find((e) => e.id === selId) ?? list[0];
  useEffect(() => { setSelId(null); }, [clubId]);

  const facts = sel ? trophyFacts(g, sel, clubId) : [];
  const tally = trophyTally(list);
  const label = TROPHY_CATS.find((c) => c.key === cat)!.label;

  return (
    <div className={`tro-cab ${className}`}>
      <nav className="tro-cats" role="tablist">
        {TROPHY_CATS.map((c) => (
          <button key={c.key} role="tab" aria-selected={cat === c.key} className={`tro-cat ${cat === c.key ? 'active' : ''} ${counts[c.key] ? '' : 'none'}`}
            onClick={() => { setCat(c.key); setSelId(null); }}>
            {c.label}<span className="tro-cat-n">{counts[c.key]}</span>
          </button>
        ))}
        <span className="tro-cats-sum">{all.length ? `${all.length} Erfolg${all.length === 1 ? '' : 'e'} insgesamt` : ''}</span>
      </nav>

      <section className="card dbox tro-listbox">
        <div className="dxh"><span className="dxh-title">Pokale<InfoTip k="erfolge" /></span>{list.length > 0 && <span className="dxh-right">{list.length}</span>}</div>
        <div className="dbox-body flush tro-listbody">
          {list.length ? (
            <table className="dtable tro-table">
              <thead><tr><th className="tro-col-s">Saison</th><th>Titel</th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id} className={`tro-row ${sel?.id === e.id ? 'sel' : ''}`} tabIndex={0} aria-selected={sel?.id === e.id}
                    onClick={() => setSelId(e.id)} onKeyDown={(k) => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); setSelId(e.id); } }}>
                    <td className="tro-col-s nowrap">{e.season}</td>
                    <td><span className="tro-t">{e.title}</span>{e.sub && <span className="tro-sub"> · {e.sub}</span>}{e.historic && <span className="tro-hist">vor Spielbeginn</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="tro-none">{CAT_EMPTY[cat]}</div>}
        </div>
        {tally.length > 0 && (
          <div className="tro-tally">{tally.map((t) => <span key={t.title}><b>{t.n}×</b> {t.title}</span>)}</div>
        )}
      </section>

      <section className="card dbox tro-stage">
        {sel ? (
          <div className="tro-show" key={sel.id}>
            <div className="tro-head">
              <div className="tro-kicker">{label}</div>
              <div className="tro-season">{seasonLong(sel.season)}</div>
              <div className="tro-title">{sel.title}</div>
              {sel.sub && <div className="tro-subline">{sel.sub}</div>}
            </div>
            <div className="tro-pedestal"><Trophy shape={sel.shape} /></div>
            <div className="tro-facts">
              {facts.map((f) => (
                <div key={f.k} className="tro-fact">
                  <span className="tro-fk">{f.k}</span>
                  <span className="tro-fv">{f.club ? <ClubLink id={f.club}>{f.v}</ClubLink> : f.v}</span>
                </div>
              ))}
              {sel.historic && <div className="tro-note">Historie vor Spielbeginn: überliefert sind Endstand bzw. Endspiel der echten Saison, Vereine nach Städten benannt.</div>}
              {!facts.length && !sel.historic && <div className="tro-note">Zu diesem Titel sind keine weiteren Einzelheiten gespeichert.</div>}
            </div>
          </div>
        ) : (
          <div className="tro-show tro-ghost" key={`empty-${cat}`}>
            <div className="tro-head"><div className="tro-kicker">{label}</div><div className="tro-title">Noch leer</div></div>
            <div className="tro-pedestal"><TrophyArt shape={CAT_SHAPE[cat]} /></div>
          </div>
        )}
      </section>
    </div>
  );
}
