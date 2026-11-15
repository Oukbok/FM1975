import { useMemo, useState } from 'react';
import ClubCrest from '../../components/ClubCrest';
import JerseySVG from '../../components/JerseySVG';
import { CountryFlag } from '../../components/competition/CountryFlag';
import { getClubKitDisplay } from '../../data/kits';
import { ClubPreview, LeagueKey, SortKey, backgroundLevels, leaguePreview, leaguesFor, sortClubs } from './clubPreview';
import { COUNTRY_BY_CC } from '../../data/world/countries';
import { playableCountries } from '../../game/worldCompose';
import { clubBandVars, type CareerOffer, type NewGameDraft } from './draft';

// Schritt 4: Verein — Teammanager: Land → Liga → Verein (Wunsch Pascal: klar zweistufig – erst die
// Ligen des Landes mit Ebene und Zahl der Vereine, dann die Vereine der gewählten Liga); Karriere: drei Angebote.
// Rechts jeweils die große Vorschau (Wappen, Trikots, Stadion, Stärke, Ziel).
/** Vereinsfarben als CSS-Variablen (Band an der Vorschau, Kante der gewählten Zeile). */
const clubVars = (c: ClubPreview) => clubBandVars(c.primary, c.secondary);

const repDots =(rep: number) => Math.max(1, Math.min(5, Math.round((rep - 45) / 9)));

function Dots({ n, max = 5 }: { n: number; max?: number }) {
  return <span className="ng-dots">{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}</span>;
}

function ClubDetail({ c, leagueName }: { c: ClubPreview; leagueName: string }) {
  const home = getClubKitDisplay(c.club, 'home');
  const away = getClubKitDisplay(c.club, 'away');
  const pct = Math.round(((c.size - c.rank + 1) / c.size) * 100);
  return (
    <section className="ng-card ng-detail ng-clubband" style={clubVars(c)}>
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
      <p className="ng-note ng-hint ng-push">Kaderstärke und Finanzkraft sind Einschätzungen im Ligavergleich; die Kader entstehen beim Start.</p>
    </section>
  );
}

function ManagerPick({ d, set, chooseCountry }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; chooseCountry: (cc: string) => void }) {
  const [sort, setSort] = useState<SortKey>('reputation');
  // Stufe 1 = Liga wählen, Stufe 2 = Verein dieser Liga wählen.
  const [step, setStep] = useState<'league' | 'club'>('league');
  const leagues = useMemo(() => leaguesFor(d.country, d.startYear), [d.datasetId, d.country, d.startYear]);
  const lower = useMemo(() => backgroundLevels(d.country, d.startYear), [d.country, d.startYear]);
  const previews = useMemo(() => Object.fromEntries(leagues.map((l) => [l.key, leaguePreview(l.key, d.country, d.startYear)])) as Record<LeagueKey, ClubPreview[]>, [leagues]);
  const countries = useMemo(() => playableCountries(d.startYear), [d.datasetId, d.startYear]);
  const league = leagues.find((l) => l.key === d.league) ?? leagues[0];
  const list = sortClubs(previews[league.key] ?? [], sort);
  const sel = (previews[league.key] ?? []).find((c) => c.id === d.clubId) ?? list[0];
  const chooseLeague = (k: LeagueKey) => {
    if (k !== d.league) set({ league: k, clubId: sortClubs(previews[k], 'reputation')[0]?.id ?? '' });
    setStep('club');
  };
  const pickCountry = (cc: string) => { chooseCountry(cc); setStep('league'); };
  const favourite = (k: LeagueKey) => sortClubs(previews[k] ?? [], 'reputation')[0];
  return (
    <div className="ng-cols ng-cols-club">
      <section className="ng-card ng-tree">
        <h3 className="ng-h">Land</h3>
        <div className="rl rl-sm ng-countries" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {countries.map((cc) => (
            <button key={cc} type="button" data-cc={cc} className={`rl-row ng-tree-row ${d.country === cc ? 'on' : ''}`} onClick={() => pickCountry(cc)}>
              <span className="ng-tree-flag"><CountryFlag country={COUNTRY_BY_CC[cc].key} height={14} /></span><span className="rl-name">{COUNTRY_BY_CC[cc].name}</span>
            </button>
          ))}
          {d.country === 'ger' && d.startYear <= 1990 && <div className="rl-row ng-tree-row off" title="DDR-Vereine sind nicht wählbar; sie spielen im Hintergrund mit."><span className="ng-tree-flag"><CountryFlag country="DDR" height={14} /></span><span className="rl-name">DDR</span><span className="rl-num">nicht wählbar</span></div>}
        </div>
        <p className="ng-note ng-push">{step === 'club' ? league.note : 'Wähle zuerst die Liga, danach deinen Verein.'}{countries.length === 1 ? ' Weitere Länder sind wählbar, sobald für das Startjahr echte Vereine hinterlegt sind (Editor › Weltdaten).' : ''}</p>
      </section>

      {step === 'league' ? (
        <section className="ng-card ng-pick">
          <div className="ng-h-row">
            <h3 className="ng-h">Schritt 1 · Liga wählen</h3>
            <span className="ng-h-side">{COUNTRY_BY_CC[d.country]?.name ?? ''}</span>
          </div>
          <div className="rl ng-clubs">
            {leagues.map((l) => (
              <button key={l.key} type="button" className={`rl-row ng-tree-row ng-league ${d.league === l.key ? 'on' : ''}`} style={{ gridTemplateColumns: '1fr auto auto' }} onClick={() => chooseLeague(l.key)}>
                <span className="rl-name">{l.name}</span>
                <span className="ng-club-role">{l.tier}. Ebene{favourite(l.key) ? ` · Favorit ${favourite(l.key).name}` : ''}</span>
                <span className="rl-num">{previews[l.key]?.length ?? 0} Vereine</span>
              </button>
            ))}
            {lower.map((l) => (
              <div key={l.tier} className="rl-row ng-tree-row off" style={{ gridTemplateColumns: '1fr auto auto' }}
                title="Läuft im Hintergrund: Diese Ebene füllt das Spiel beim Start aus dem Amateur-Pool, ihre Vereine haben keinen vollen Kader.">
                <span className="rl-name">{l.name}</span>
                <span className="ng-club-role">{l.tier}. Ebene · {l.clubs ? `${l.staffeln > 1 ? `${l.staffeln} Staffeln · ` : ''}im Hintergrund` : 'ohne Spielbetrieb'}</span>
                <span className="rl-num">{l.clubs ? `${l.clubs} Vereine` : 'nicht wählbar'}</span>
              </div>
            ))}
          </div>
          <p className="ng-note">Wählbar sind die Ligen mit vollen Kadern (1. und 2. Ebene). Tiefere Ebenen laufen im Hintergrund mit – dorthin führt nur der Weg über Auf- und Abstieg.</p>
        </section>
      ) : (
        <section className="ng-card ng-pick">
          <div className="ng-h-row">
            <div className="ng-seg small"><button type="button" className="ng-back" onClick={() => setStep('league')}>‹ Ligen</button></div>
            <h3 className="ng-h">Schritt 2 · {league.name}</h3>
            <div className="ng-seg small">
              {([['reputation', 'Stärke'], ['name', 'Name'], ['region', 'Region']] as [SortKey, string][]).map(([k, l]) => (
                <button key={k} type="button" className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="rl ng-clubs">
            {list.map((c) => (
              <button key={c.id} type="button" className={`rl-row ng-club ${sel?.id === c.id ? 'on' : ''}`} style={clubVars(c)} onClick={() => set({ clubId: c.id })}>
                <span className="rl-club"><ClubCrest club={c.club} size={30} /><span className="rl-name">{c.name}</span></span>
                <span className="ng-club-role">{sort === 'region' ? c.region : c.role}</span>
                <Dots n={repDots(c.reputation)} />
              </button>
            ))}
          </div>
        </section>
      )}

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
            <button key={o.club.id} type="button" className={`ng-offer ${sel?.club.id === o.club.id ? 'on' : ''}`} style={clubVars(o.club)} onClick={() => set({ clubId: o.club.id, league: o.league })}>
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

export function StepClub({ d, set, offers, chooseCountry }: { d: NewGameDraft; set: (p: Partial<NewGameDraft>) => void; offers: CareerOffer[]; chooseCountry: (cc: string) => void }) {
  return d.mode === 'career' ? <CareerPick d={d} set={set} offers={offers} /> : <ManagerPick d={d} set={set} chooseCountry={chooseCountry} />;
}
