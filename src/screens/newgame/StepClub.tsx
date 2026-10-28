import ClubCrest from '../../components/ClubCrest';
import Icon from '../../components/Icon';
import JerseySVG from '../../components/JerseySVG';
import { getClubKitDisplay } from '../../data/kits';
import type { NewGameDraft } from '../NewGameScreen';
import { ClubPreview, LEAGUES, LeagueKey, SortKey, leaguePreview, sortClubs } from './clubPreview';
import { useMemo, useState } from 'react';

// Schritt 2: Liga & Verein — Ligenbaum, Wappenraster, Detailkarte
const ROLE_COLOR: Record<ClubPreview['role'], string> = {
  Favorit: 'var(--accent)', Spitzengruppe: 'var(--green)', Mittelfeld: 'var(--text-2)', Abstiegskampf: 'var(--orange)',
};

function Dots({ n, max = 5 }: { n: number; max?: number }) {
  return <span className="ng-dots">{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>;
}

/** Ansehen 0–100 → 1–5 Punkte. */
const repDots = (rep: number) => Math.max(1, Math.min(5, Math.round((rep - 45) / 9)));

function Detail({ c, leagueName, all }: { c: ClubPreview; leagueName: string; all: ClubPreview[] }) {
  const ladder = [...all].sort((a, b) => a.rank - b.rank);
  const i = ladder.findIndex((x) => x.id === c.id);
  const near = ladder.slice(Math.max(0, Math.min(i - 2, ladder.length - 5)), Math.max(0, Math.min(i - 2, ladder.length - 5)) + 5);
  const home = getClubKitDisplay(c.club, 'home');
  const away = getClubKitDisplay(c.club, 'away');
  return (
    <section className="ng-box ng-detail">
      <div className="ng-detail-head">
        <ClubCrest club={c.club} size={112} />
        <div>
          <div className="ng-detail-name">{c.name}</div>
          <div className="ng-note">{c.city} · {c.region}{c.founded ? ` · gegründet ${c.founded}` : ''}</div>
          <div className="ng-role" style={{ color: ROLE_COLOR[c.role], borderColor: ROLE_COLOR[c.role] }}>{c.role}</div>
        </div>
      </div>
      <div className="ng-kits">
        <div><JerseySVG {...home} size={120} /><small>Heim</small></div>
        <div><JerseySVG {...away} size={120} /><small>Auswärts</small></div>
      </div>
      <div className="ng-kv"><span>Liga</span><b>{leagueName}</b></div>
      <div className="ng-kv"><span>Stadion</span><b>{c.stadium}</b></div>
      <div className="ng-kv"><span>Kapazität</span><b>{c.capacity.toLocaleString('de-DE')}</b></div>
      <div className="ng-kv"><span>Ansehen</span><Dots n={repDots(c.reputation)} /></div>
      <div className="ng-kv"><span>Finanzkraft</span><Dots n={c.finance} /></div>
      <div className="ng-kv"><span>Kaderstärke</span><b>{c.rank}. von {c.size}</b></div>
      <div className="ng-meter"><i style={{ width: `${Math.round(((c.size - c.rank + 1) / c.size) * 100)}%` }} /></div>
      <div className="ng-kv"><span>Ziel des Vorstands</span><b className="accent-text">{c.expectation}</b></div>
      <div className="ng-kv top"><span>Rivalen</span><b>{c.rivals.length ? c.rivals.join(', ') : 'keine in der Region'}</b></div>
      <div className="ng-label">Im Ligavergleich</div>
      <div className="ng-ladder">
        {near.map((x) => (
          <div key={x.id} className={`ng-ladder-row ${x.id === c.id ? 'on' : ''}`}>
            <span className="ng-ladder-rank">{x.rank}.</span>
            <ClubCrest club={x.club} size={26} />
            <span className="ng-ladder-name">{x.name}</span>
            <em style={{ color: ROLE_COLOR[x.role] }}>{x.role}</em>
          </div>
        ))}
      </div>
      <p className="ng-note">Kaderstärke und Finanzkraft sind Einschätzungen im Ligavergleich. Die Kader entstehen beim Start.</p>
    </section>
  );
}

export function StepClub({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const [sort, setSort] = useState<SortKey>('reputation');
  const previews = useMemo(() => Object.fromEntries(LEAGUES.map((l) => [l.key, leaguePreview(l.key)])) as Record<LeagueKey, ClubPreview[]>, [d.datasetId]);
  const league = LEAGUES.find((l) => l.key === d.league) ?? LEAGUES[0];
  const list = sortClubs(previews[d.league], sort);
  const sel = previews[d.league].find((c) => c.id === d.clubId) ?? list[0];
  const chooseLeague = (k: LeagueKey) => {
    if (k === d.league) return;
    set({ league: k, clubId: sortClubs(previews[k], 'reputation')[0]?.id ?? '' });
  };

  return (
    <div className="ng-club-layout">
      <section className="ng-box ng-tree">
        <h3 className="ng-box-title"><Icon name="international" size={20} /> Ligen</h3>
        <div className="ng-tree-country">Deutschland</div>
        {LEAGUES.map((l) => (
          <button key={l.key} className={`ng-tree-item ${d.league === l.key ? 'on' : ''}`} onClick={() => chooseLeague(l.key)}>
            <span>{l.name}</span><small>{previews[l.key].length}</small>
          </button>
        ))}
        <div className="ng-tree-item off" title="Die Vereine der DDR kommen 1991 mit der Wiedervereinigung in die Ligen.">
          <span>DDR-Oberliga</span><small>ab 1991</small>
        </div>
        <p className="ng-note">{league.note}</p>
      </section>

      <section className="ng-box ng-pick">
        <div className="ng-pick-bar">
          <h3 className="ng-box-title"><Icon name="dashVerein" size={20} /> {league.name} · {list.length} Vereine</h3>
          <div className="seg-group">
            {([['reputation', 'Stärke'], ['name', 'Name'], ['region', 'Region']] as [SortKey, string][]).map(([k, l]) => (
              <button key={k} type="button" className={`seg-btn ${sort === k ? 'active' : ''}`} onClick={() => setSort(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="ng-crests">
          {list.map((c) => (
            <button key={c.id} className={`ng-club ${sel?.id === c.id ? 'on' : ''}`} onClick={() => set({ clubId: c.id })}>
              <ClubCrest club={c.club} size={92} />
              <b>{c.shortName}</b>
              <small>{c.name}</small>
              <span className="ng-club-meta"><Dots n={repDots(c.reputation)} /><em style={{ color: ROLE_COLOR[c.role] }}>{sort === 'region' ? c.region : c.role}</em></span>
            </button>
          ))}
        </div>
      </section>

      {sel && <Detail c={sel} leagueName={league.name} all={previews[d.league]} />}
    </div>
  );
}
