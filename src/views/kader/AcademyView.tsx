// =============================================================================
// AKADEMIE — Nachwuchs-Investitionen (Kader → Akademie)
// Bausteine ausbauen, Jugendetat, Wirkung mit Verzögerung, Kosten, Wettbewerb
// um Talente, Akademien der Liga. Rechnung: engine/youthAcademy.ts,
// Spielablauf: game/youthInvest.ts.
// =============================================================================
import Icon from '../../components/Icon';
import { ClubLink } from '../../components/club/ClubLink';
import { lastRevenue } from '../../engine/clubEconomy';
import { economyScale, yearOf } from '../../engine/economy';
import {
  academyGrowthOf, ageCapBonus, annualCostBase, BLOCK_BY_KEY, coachCountMax, coachesNeeded, costBreakdown, ETAT_MAX, ETAT_MIN,
  ETAT_REC, ETAT_STEP, intakeCountOf, maxLevelIn, nlzDutyYear, nlzMissing, pitchLevel, targetQuality, YouthBlockKey, YOUTH_BLOCKS,
} from '../../engine/youthAcademy';
import { leagueClubs } from '../../game/season';
import { Game } from '../../game/state';
import { downgrade, quoteUpgrade, setCoachCount, setYouthBudget, startUpgrade, youthInvestOf } from '../../game/youthInvest';
import { DashBox, DashPage, Empty, Kpi, KV, Meter } from '../../ui/DashPage';
import { fmtDay, fmtPrice } from '../../ui/format';
import { attraction } from '../../engine/youthAcademy';

const MILESTONES: { year: number; text: string }[] = [
  { year: 1985, text: 'Partnerschulen, nationales Sichtungsnetz, Kunstrasen & Halle' },
  { year: 1988, text: 'Erste Jugendinternate – verbreitet in den 90ern' },
  { year: 1994, text: 'Regionalliga: zweite Mannschaft als U23' },
  { year: 1996, text: 'Bosman: internationales Scouting' },
  { year: 2001, text: 'Leistungszentrum Pflicht (Bundesliga; 2. Liga ab 2002)' },
  { year: 2002, text: 'DFB-Talentförderprogramm: Stützpunkte sichten flächendeckend' },
  { year: 2006, text: 'Eliteschule des Fußballs' },
  { year: 2012, text: 'Athletik- und Analyse-Teams' },
];

function Pips({ n, max, pending }: { n: number; max: number; pending?: number }) {
  return (
    <span className="dpips" title={`Stufe ${n} von ${max}`}>
      {Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : pending != null && i < pending ? 'ac-pend' : ''} />)}
    </span>
  );
}

export function AcademyView({ g, onChange }: { g: Game; onChange: () => void }) {
  const club = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const year = yearOf(today);
  const inv = youthInvestOf(club, year);
  const scale = economyScale(year);
  const target = targetQuality(club, inv, year);
  const annual = annualCostBase(inv);
  const revenueBase = lastRevenue(club, year, g.leagues?.playerDivision?.tier ?? 1) / scale;
  const act = (fn: () => unknown) => { fn(); onChange(); };
  const tier = g.leagues?.playerDivision?.tier ?? 1;
  const duty = nlzDutyYear(tier);
  const missing = nlzMissing(club, inv);
  const clubs = leagueClubs(g);
  const ranked = [...clubs].sort((a, b) => (b.youthInvest?.reputation ?? 0) - (a.youthInvest?.reputation ?? 0));
  const attrRank = [...clubs].sort((a, b) => attraction(b) - attraction(a)).findIndex((c) => c.id === club.id) + 1;
  const race = g.youthRace;
  const raceRows = race ? race.entries.filter((e) => e.known || e.to === club.id).sort((a, b) => Number(b.to === club.id) - Number(a.to === club.id) || b.stars - a.stars) : [];

  const blockRow = (key: YouthBlockKey) => {
    const def = BLOCK_BY_KEY[key];
    const lvl = key === 'pitches' ? pitchLevel(club, inv) : inv.levels[key] ?? 0;
    const max = def.levels.length - 1;
    const avail = maxLevelIn(key, year);
    const pending = inv.builds.find((b) => b.key === key);
    const q = quoteUpgrade(club, key, year);
    const next = def.levels[(pending?.target ?? lvl) + 1];
    const label = `${def.levels[lvl].name}${key === 'coaches' ? ` · ${inv.coachCount} Trainer` : ''}`;
    return (
      <div key={key} className="ac-card" title={def.what}>
        <span className="ac-ico"><Icon name={def.icon} size={18} /></span>
        <div className="ac-main">
          <div className="ac-name"><b>{def.name}</b> <Pips n={lvl} max={max} pending={pending?.target} /></div>
          <div className="dnote">{label}</div>
          <div className="dnote ac-next">
            {pending ? <>→ {def.levels[pending.target].name} ab {fmtDay(pending.done)}</> : next ? (q.ok ? <>→ {next.name}{q.build > 0 ? ` · Bau ${fmtPrice(q.build)}` : ''}{q.months > 0 ? ` · ${q.months} Mon.` : ''} · +{fmtPrice(q.upkeepDelta)}/J.</>
              : <>→ {next.name}: {q.reason}</>) : avail < max ? <>mehr ab {def.levels[avail + 1].from}</> : <>höchste Stufe</>}
          </div>
        </div>
        <div className="ac-act">
          {key === 'coaches' && (
            <span className="ac-count" title={`Für volle Betreuung nötig: ${coachesNeeded(year)}`}>
              <button className="btn-sm" disabled={inv.coachCount <= 2} onClick={() => act(() => setCoachCount(club, inv.coachCount - 1, year))}>−</button>
              <b>{inv.coachCount}</b>
              <button className="btn-sm" disabled={inv.coachCount >= coachCountMax(year)} onClick={() => act(() => setCoachCount(club, inv.coachCount + 1, year))}>+</button>
            </span>
          )}
          {next && <button className="btn-sm btn-primary" disabled={!q.ok} onClick={() => act(() => startUpgrade(g, club, key, today))}>Ausbauen</button>}
          {(pending || lvl > (key === 'coaches' ? 1 : 0)) && key !== 'pitches' && (
            <button className="btn-sm btn-ghost" onClick={() => act(() => downgrade(club, key, year))}>{pending ? 'Abbrechen' : 'Zurück'}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashPage>
      <DashBox title="Bausteine der Nachwuchsarbeit" info="jugendEtat" icon="youth" span={2}
        right={<span className="dnote">Kosten/Jahr {fmtPrice(annual)}</span>}>
        <div className="ac-grid">
          <div className="ac-card" title="Fahrten, Turniere, Material, Sichtungstage – mehr Breite und etwas mehr Qualität">
            <span className="ac-ico"><Icon name="finances" size={18} /></span>
            <div className="ac-main">
              <div className="ac-name"><b>Jugendetat</b> <b className="ac-val">{fmtPrice(inv.budget)}</b></div>
              <input className="ac-range" type="range" min={ETAT_MIN} max={ETAT_MAX} step={ETAT_STEP} value={inv.budget}
                onChange={(e) => act(() => setYouthBudget(club, Number(e.target.value), year))} />
              <div className="dnote">je Saison · empfohlen {fmtPrice(ETAT_REC)}</div>
            </div>
          </div>
          {YOUTH_BLOCKS.map((b) => blockRow(b.key))}
        </div>
      </DashBox>

      <DashBox title="Wirkung" info="ausbildung" icon="training" right={<span className="dnote">verzögert</span>}>
        <div className="dkpis">
          <Kpi value={Math.round(inv.quality)} label="Ausbildung" info="akaAusbildung" sub={`Ziel ${Math.round(target)}`} />
          <Kpi value={Math.round(inv.reputation)} label="Ruf" info="jugendRuf" sub={`Platz ${ranked.findIndex((c) => c.id === club.id) + 1} der Liga`} />
          <Kpi value={Math.round(inv.perspective)} label="Durchlässigkeit" info="durchlaessigkeit" />
        </div>
        <Meter label="Weg zum Ziel" info="akaWeg" value={target > 0 ? Math.min(inv.quality, target) : 0} max={Math.max(1, target)} text={`${Math.round(inv.quality)} / ${Math.round(target)}`} />
        <KV k="Bambini je Jahrgang" info="akaBambini" v={intakeCountOf(club)} />
        <KV k="Lernrate der Talente" info="akaLernrate" v={`× ${academyGrowthOf(club).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
        <KV k="Reife mit 19 Jahren" info="akaReife" v={`+${Math.round(ageCapBonus(club, 19) * 100)} % Spielstärke`} />
        <KV k="Zweite Mannschaft" info="akaZweite" v={BLOCK_BY_KEY.reserve.levels[inv.levels.reserve ?? 0].name} />
        <div className="dnote mt8">Die Ausbildung folgt dem Ziel um etwa ein Fünftel pro Jahr, der Ruf noch langsamer – er wächst mit erfolgreichen eigenen Talenten. Kürzungen wirken schneller.</div>
      </DashBox>

      <DashBox title="Kosten & Bauprojekte" info="nlz" icon="finances" right={revenueBase > 0 ? <span className="dnote">{(annual / revenueBase * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} % vom Umsatz</span> : undefined}>
        <div className="ac-kv2">{costBreakdown(inv).map((r) => <KV key={r.label} k={r.label} v={fmtPrice(r.base)} />)}</div>
        <KV k="Summe je Saison" v={fmtPrice(annual)} strong />
        <div className="dsec">Laufende Bauprojekte</div>
        {inv.builds.length ? inv.builds.map((b) => (
          <KV key={b.key} k={BLOCK_BY_KEY[b.key].levels[b.target].name} v={fmtDay(b.done)} />
        )) : <div className="dnote">Keine.</div>}
        <div className="dsec">Leistungszentrum</div>
        {duty == null ? <div className="dnote">In deiner Liga keine Pflicht.</div>
          : missing.length === 0 ? <div className="dnote">Anforderungen erfüllt{year < duty ? ` – Pflicht ab ${duty}` : ''}.</div>
            : <div className="dnote" title={missing.join(' · ')} style={{ color: year >= duty ? 'var(--red)' : undefined }}>{year >= duty ? 'Pflicht verletzt' : `Pflicht ab ${duty}`} – noch {missing.length} Punkt(e) offen (Maus drüber).</div>}
      </DashBox>

      <DashBox title="Wettbewerb um Talente" info="talentWettbewerb" icon="watchlist" right={<span className="dnote">Anziehung Platz {attrRank}/{clubs.length}</span>}>
        {!race ? <Empty icon="youth">Der erste Wettbewerb um die besten 12- bis 16-Jährigen findet zum 1. Juli statt.</Empty> : raceRows.length ? raceRows.slice(0, 9).map((e, i) => (
          <div key={i} className="dlist-row">
            <span className="pos-badge">{e.pos}</span>
            <span className="grow">{e.name} <span className="muted">· {e.age} J.{e.foreign ? ' · Ausland' : ''}{e.home ? ' · aus deiner Stadt' : ''}</span></span>
            {e.to === club.id ? <span className="val" style={{ color: 'var(--green)' }}>Zusage</span>
              : <span className="meta">{e.to ? <ClubLink id={e.to}>{e.toName}</ClubLink> : e.toName}</span>}
          </div>
        )) : <Empty icon="youth">Deine Scouts kannten im Sommer {race.year} keines der begehrten Talente – ein größeres Scouting-Netz hilft.</Empty>}
        <div className="dnote mt8">Talente gehen dorthin, wo Ruf, Vereinsgröße, Einsatzchancen und Ausbildung stimmen. Auswärtige brauchen ein Internat; kennen musst du sie über dein Scouting-Netz.</div>
      </DashBox>

      <DashBox title="Akademien der Liga" icon="trophy">
        {ranked.slice(0, 6).map((c, i) => (
          <div key={c.id} className={`dlist-row ${c.id === club.id ? 'ac-me' : ''}`}>
            <span className="meta">{i + 1}.</span>
            <span className="grow"><ClubLink id={c.id}>{c.name}</ClubLink></span>
            <span className="meta">Ausb. {Math.round(c.youthInvest?.quality ?? 0)}</span>
            <span className="val">{Math.round(c.youthInvest?.reputation ?? 0)}</span>
          </div>
        ))}
        <div className="dsec">Meilensteine</div>
        {MILESTONES.filter((m) => m.year >= year - 2).slice(0, 3).map((m) => (
          <KV key={m.year} k={<span style={{ color: m.year <= year ? 'var(--text-3)' : 'var(--accent)' }}>{m.year}</span>} v={<span className="dnote">{m.text}</span>} />
        ))}
      </DashBox>
    </DashPage>
  );
}
