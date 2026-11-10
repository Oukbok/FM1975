// =============================================================================
// ZENTRALE › BRIEFING — Archiv aller Saison-Briefings (Layout nach Pascals Mockup)
//   links: Archiv (Suche, Jahrzehnt, Saisons) · oben: Aufmacher der Saison mit Foto
//   und zwei Nebenthemen · unten: Ausgangslage zum Saisonstart (beim Saisonwechsel
//   gespeichert, ändert sich danach nie) · Neu im Spiel als Bildkarten.
//   „Ganzes Briefing“ öffnet das Briefing-Fenster (BriefingModal, ohne Auftakt).
// Bilder: data/briefingImages.ts (Slots je Ereignis, gezeichneter Ersatz).
// =============================================================================
import { useMemo, useState } from 'react';
import { briefingFor, topicMeta } from '../../data/briefings';
import { cardsOf, storiesOf } from '../../game/briefingStories';
import { briefingPhoto } from '../../data/briefingImages';
import { BriefingRecord, briefingLog, briefingOfRecord, shorten } from '../../game/seasonBriefing';
import { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';
import Select from '../../ui/Select';
import Icon, { type IconName } from '../../components/Icon';
import type { Screen } from '../../shell/navigation';
import { BriefingModal, BriefingTab } from './BriefingModal';
import { Situation } from './briefing/BriefingParts';

/** Foto oder ruhiger, gezeichneter Ersatz mit Themen-Symbol. */
function Photo({ src, icon, label, className = '' }: { src: string | null; icon: string; label: string; className?: string }) {
  const [bad, setBad] = useState(false);
  return (
    <div className={`bf2-photo ${className} ${src && !bad ? 'has' : 'ph'}`}>
      {src && !bad ? <img src={src} alt={label} loading="lazy" onError={() => setBad(true)} />
        : <span className="bf2-ph"><Icon name={icon as IconName} size={44} /></span>}
    </div>
  );
}

const decadeOf = (season: string) => Math.floor(parseInt(season.slice(0, 4), 10) / 10) * 10;

export function BriefingView({ g, onGoto, onOpen }: { g: Game; onGoto?: (s: Screen) => void; onOpen?: () => void }) {
  const records: BriefingRecord[] = useMemo(() => [...briefingLog(g).records].reverse(), [g, g.briefing?.records.length]);
  const [sel, setSel] = useState<string | null>(records[0]?.season ?? null);
  const [q, setQ] = useState('');
  const [dec, setDec] = useState('all');
  const [modal, setModalRaw] = useState<BriefingTab | null>(null);
  const setModal = (t: BriefingTab | null) => { if (t) onOpen?.(); setModalRaw(t); };
  const rec = records.find((r) => r.season === sel) ?? records[0];
  const b = useMemo(() => (rec ? briefingOfRecord(rec) : null), [rec]);
  const decades = [...new Set(records.map((r) => decadeOf(r.season)))].sort((a, c) => c - a);
  const head = (r: BriefingRecord) => briefingFor(r.season)?.headline ?? (r.first ? 'Spielbeginn' : 'Saisonwechsel');
  const list = records.filter((r) => (dec === 'all' || decadeOf(r.season) === Number(dec))
    && (!q.trim() || `${r.season} ${head(r)}`.toLowerCase().includes(q.trim().toLowerCase())));
  const st = b ? storiesOf(b) : [];
  const cards = b ? cardsOf(b) : [];
  const [hero, ...side] = st;

  return (
    <DashPage className="bf2">
      <DashBox title="Archiv" rows={2} right={`${records.length} ${records.length === 1 ? 'Saison' : 'Saisons'}`} className="bf2-arch">
        <div className="bf2-arch-tools">
          <label className="bf2-search"><input placeholder="Saison suchen …" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div className="bf2-lbl">Jahrzehnt</div>
          <Select value={dec} onChange={setDec} options={[{ value: 'all', label: 'Alle Jahrzehnte' },
            ...decades.map((d) => ({ value: String(d), label: `${d}er (${d}/${String((d + 1) % 100).padStart(2, '0')} – ${d + 9}/${String((d + 10) % 100).padStart(2, '0')})` }))]} />
        </div>
        <div className="bf2-arch-list">
          {list.map((r) => (
            <button key={r.season} className={`bf2-arch-item ${r.season === rec?.season ? 'sel' : ''}`} onClick={() => setSel(r.season)}>
              <b>{r.season}</b><span>{head(r)}</span>
            </button>
          ))}
          {!list.length && <div className="dnote">Keine Saison gefunden.</div>}
        </div>
        <div className="bf2-arch-foot">
          {records[0] && rec?.season !== records[0].season && <button className="bf2-link" onClick={() => setSel(records[0].season)}>Zur aktuellen Saison</button>}
          {b && <button className="bf2-link" onClick={() => setModal('overview')}>Ganzes Briefing</button>}
        </div>
      </DashBox>

      <DashBox title={b ? `Archiv · Saison ${b.season}` : 'Briefing'} span={2} right={b ? b.headline : undefined} className="bf2-hero-box">
        {b && hero ? (
          <div className="bf2-hero">
            <article className="bf2-lead">
              <h2><span className="bf2-slash">/</span> {hero.title}</h2>
              <p>{hero.text}</p>
              <figure>
                <Photo src={briefingPhoto(hero.key)} icon={topicMeta(hero.topic).icon} label={hero.title} className="big" />
                <figcaption><Icon name={topicMeta(hero.topic).icon as IconName} size={16} /><b>{topicMeta(hero.topic).label}</b><span>{hero.inGame ?? shorten(hero.text, 90)}</span></figcaption>
              </figure>
            </article>
            <div className="bf2-side">
              {side.map((s) => (
                <article key={s.key} className="bf2-feat">
                  <Photo src={briefingPhoto(s.key)} icon={topicMeta(s.topic).icon} label={s.title} />
                  <div>
                    <h3><span className="bf2-slash">/</span> {s.title}</h3>
                    <div className="bf2-kick">{s.kicker} · {topicMeta(s.topic).label}</div>
                    <p>{s.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : <Empty icon="briefing">Wähle links eine Saison.</Empty>}
      </DashBox>

      <DashBox title={b ? `Deine Ausgangslage · zum Saisonstart ${b.season}` : 'Deine Ausgangslage'} info="ausgangslage" className="bf2-sit">
        {b ? <Situation sit={b.situation} year={b.startYear} /> : null}
      </DashBox>

      <DashBox title="Neu im Spiel" right={b && b.inGame.length ? `${b.inGame.length}` : undefined} className="bf2-new"
        onClick={b && b.inGame.length ? () => setModal('ingame') : undefined}>
        {cards.length ? (
          <div className="bf2-cards">
            {cards.map((c, i) => (
              <article key={i} className="bf2-card">
                <Photo src={c.photo} icon={c.icon} label={c.title} />
                <div className="bf2-card-h"><Icon name={c.icon as IconName} size={18} /><span><b>{c.title}</b><small>{c.label}</small></span></div>
                <p>{c.text}</p>
              </article>
            ))}
          </div>
        ) : <Empty icon="unlock">Keine Änderungen im Spiel.</Empty>}
      </DashBox>

      {b && modal && <BriefingModal b={b} g={g} initialTab={modal} onClose={() => setModal(null)} onGoto={onGoto} />}
    </DashPage>
  );
}
