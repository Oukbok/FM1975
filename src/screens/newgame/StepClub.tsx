import { useMemo, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import JerseySVG from '../../components/JerseySVG';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { getClubKitDisplay } from '../../data/kits';
import { ClubPreview, LEAGUES, LeagueKey, SortKey, leaguePreview, sortClubs } from './clubPreview';
import type { CareerOffer, NewGameDraft } from './draft';

// Schritt 4: Verein — Teammanager: Land → Liga → Verein; Karriere: drei Angebote.
// Rechts jeweils die große Vorschau (Wappen, Trikots, Stadion, Stärke, Ziel).
const repDots = (rep: number) => Math.max(1, Math.min(5, Math.round((rep - 45) / 9)));

function Dots({ n, max = 5 }: { n: number; max?: number }) {
  return <span className="ng-dots">{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>;
}

function ClubDetail({ c, leagueName }: { c: ClubPreview; leagueName: string }) {
  const home = getClubKitDisplay(c.club, 'home');
  const away = getClubKitDisplay(c.club, 'away');
  const pct = Math.round(((c.size - c.rank + 1) / c.size) * 100);
  return (
    <section className="ng-card ng-detail">
      <div className="ng-detail-head">
        <ClubCrest club={c.club} size={150} />
        <div className="ng-detail-id">
          <div className="ng-detail-name">{c.name}</div>
          <div className="ng-detail-sub">{c.city} · {c.region}{c.founded ? ` · gegründet ${c.founded}` : ''}</div>
          <span className="ng-tag">{c.role}</span>
        </div>
      </div>
      <div className="ng-detail-grid">
        <div className="ng-stat"><span>Liga</span><b>{leagueName}</b></div>
        <div className="ng-stat"><span>Kaderstärke</span><b>{c.rank}. von {c.size}</b></div>
        <div className="ng-stat"><span>Ansehen</span><Dots n={repDots(c.reputation)} /></div>
        <div className="ng-stat"><span>Finanzkraft</span><Dots n={c.finance} /></div>
      </div>
      <div className="ng-meter"><i style={{ width: `${pct}%` }} /></div>
      <div className="ng-kv"><span>Stadion</span><b>{c.stadium}</b></div>
      <div className="ng-kv"><span>Plätze</span><b>{c.capacity.toLocaleString('de-DE')}</b></div>
      <div className="ng-kv"><span>Ziel des Vorstands</span><b>{c.expectation}</b></div>
      <div className="ng-kv"><span>Rivalen</span><b>{c.rivals.length ? c.rivals.join(', ') : 'keine in der Region'}</b></div>
      <div className="ng-kits">
        <div><JerseySVG {...home} size={96} /><small>Heim</small></div>
        <div><JerseySVG {...away} size={96} /><small>Auswärts</small></div>
      </div>
      <p className="ng-note ng-push">Kaderstärke und Finanzkraft sind Einschätzungen im Ligavergleich; die Kader entstehen beim Start.</p>
    </section>
  );
}

function ManagerPick({ d, set }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void }) {
  const [sort, setSort] = useState<SortKey>('reputation');
  const previews = useMemo(() => Object.fromEntries(LEAGUES.map((l) => [l.key, leaguePreview(l.key)])) as Record<LeagueKey, ClubPreview[]>, [d.datasetId]);
  const league = LEAGUES.find((l) => l.key === d.league) ?? LEAGUES[0];
  const list = sortClubs(previews[league.key], sort);
  const sel = previews[league.key].find((c) => c.id === d.clubId) ?? list[0];
  const chooseLeague = (k: LeagueKey) => { if (k !== d.league) set({ league: k, clubId: sortClubs(previews[k], 'reputation')[0]?.id ?? '' }); };
  return (
    <div className="ng-cols ng-cols-club">
      <section className="ng-card ng-tree">
        <h3 className="ng-h">Land</h3>
        <div className="rl rl-sm">
          <div className="rl-row ng-tree-row on"><span className="ng-tree-flag"><CountryFlag country="Deutschland" height={14} /></span><span className="rl-name">Deutschland</span></div>
          <div className="rl-row ng-tree-row off" title="DDR-Vereine sind nicht wählbar; sie spielen im Hintergrund mit."><span className="ng-tree-flag"><CountryFlag country="DDR" height={14} /></span><span className="rl-name">DDR</span><span className="rl-num">nicht wählbar</span></div>
        </div>
        <h3 className="ng-h">Liga</h3>
        <div className="rl rl-sm">
          {LEAGUES.map((l) => (
            <button key={l.key} type="button" className={`rl-row ng-tree-row ng-league ${d.league === l.key ? 'on' : ''}`} onClick={() => chooseLeague(l.key)}>
              <span className="rl-name">{l.name}</span><span className="rl-num">{previews[l.key].length}</span>
            </button>
          ))}
        </div>
        <p className="ng-note ng-push">{league.note}</p>
      </section>

      <section className="ng-card ng-pick">
        <div className="ng-h-row">
          <h3 className="ng-h">{league.name}</h3>
          <div className="ng-seg small">
            {([['reputation', 'Stärke'], ['name', 'Name'], ['region', 'Region']] as [SortKey, string][]).map(([k, l]) => (
              <button key={k} type="button" className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="rl ng-clubs">
          {list.map((c) => (
            <button key={c.id} type="button" className={`rl-row ng-club ${sel?.id === c.id ? 'on' : ''}`} onClick={() => set({ clubId: c.id })}>
              <span className="rl-club"><ClubCrest club={c.club} size={30} /><span className="rl-name">{c.name}</span></span>
              <span className="ng-club-role">{sort === 'region' ? c.region : c.role}</span>
              <Dots n={repDots(c.reputation)} />
            </button>
          ))}
        </div>
      </section>

      {sel && <ClubDetail c={sel} leagueName={league.name} />}
    </div>
  );
}

function CareerPick({ d, set, offers }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; offers: CareerOffer[] }) {
  const sel = offers.find((o) => o.club.id === d.clubId) ?? offers[0];
  return (
    <div className="ng-cols ng-cols-career">
      <section className="ng-card">
        <h3 className="ng-h">Deine Angebote</h3>
        <p className="ng-note">Noch kennt dich keiner. Diese drei Vereine trauen dir den Job zu – wähle eines der Angebote.</p>
        <div className="ng-offers">
          {offers.map((o) => (
            <button key={o.club.id} type="button" className={`ng-offer ${sel?.club.id === o.club.id ? 'on' : ''}`} onClick={() => set({ clubId: o.club.id, league: o.league })}>
              <ClubCrest club={o.club.club} size={64} />
              <span className="ng-offer-txt">
                <b>{o.club.name}</b>
                <small>{o.leagueName} · Kaderstärke {o.club.rank}. von {o.club.size}</small>
                <em>Ziel: {o.club.expectation}</em>
              </span>
              <span className="ng-radio" aria-hidden />
            </button>
          ))}
        </div>
      </section>
      {sel && <ClubDetail c={sel.club} leagueName={sel.leagueName} />}
    </div>
  );
}

export function StepClub({ d, set, offers }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; offers: CareerOffer[] }) {
  return d.mode === 'career' ? <CareerPick d={d} set={set} offers={offers} /> : <ManagerPick d={d} set={set} />;
}
