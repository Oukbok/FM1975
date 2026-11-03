// =============================================================================
// ZENTRALE › KARRIERE — dein Ansehen, offene Jobangebote, Stationen, Chronik
//   Daten: game/careerState.ts (Zustand), game/careerGame.ts (Angebote/Entlassung).
//   Die Entscheidung läuft über dieselbe Nachricht wie im Newscenter.
// =============================================================================
import ClubCrest from '../../components/ClubCrest';
import { ClubLink } from '../../components/club/ClubLink';
import { chooseEventOption } from '../../game/eventsGame';
import { recordText } from '../../game/coachRecord';
import {
  CareerStint, JobOffer, currentStint, ensureCareer, isCareerMode, jobLevel, repLabel, stintRecord,
} from '../../game/careerState';
import { Game } from '../../game/state';
import { Club } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi, Meter } from '../../ui/DashPage';
import { fmtDateShort, fmtPrice, vColor } from '../../ui/format';
import { CalendarEngine } from '../../engine/calendar';

const LEAGUE = (t: number) => (t === 1 ? '1. Liga' : t === 2 ? '2. Liga' : `${t}. Ebene`);

function crestOf(g: Game, id: string): Club | null {
  return g.clubs[id] ?? ((g.simClubs?.[id] as unknown as Club) || null);
}

function OfferCard({ g, o, onChange }: { g: Game; o: JobOffer; onChange: () => void }) {
  const msg = g.messages.find((m) => m.eventRef?.data?.offer === o.id && !m.eventRef.resolved);
  const club = crestOf(g, o.clubId);
  const pick = (id: string) => { if (msg) { chooseEventOption(g, msg, id); msg.read = true; onChange(); } };
  return (
    <div className="car-offer">
      <div className="car-offer-head">
        {club && <ClubCrest club={club} size={40} />}
        <div className="grow">
          <ClubLink id={o.clubId}><span className="car-offer-name">{o.clubName}</span></ClubLink>
          <div className="car-offer-sub">{LEAGUE(o.tier)} · {o.when === 'sofort' ? 'Wechsel sofort' : 'Wechsel zum 1. Juli'}{o.forced ? ' · nach deiner Entlassung' : ''}</div>
        </div>
        <span className="car-offer-dl">bis {fmtDateShort(o.deadline).dmy}</span>
      </div>
      <div className="car-offer-terms">
        <KV k="Jahresgehalt" v={fmtPrice(o.wage)} info="trainerGehalt" />
        <KV k="Saisonziel" v={o.goal} />
        <KV k="Transferbudget" v={fmtPrice(o.budget)} />
        <KV k="Größe des Vereins" v={o.level} info="vereinsgroesse" />
      </div>
      {msg?.choices?.length ? (
        <div className="dbtnrow car-offer-btns">
          {msg.choices.filter((c) => c.id === 'ja' || c.id === `o:${o.id}`).map((c) => (
            <button key={c.id} className="btn btn-primary btn-sm" onClick={() => pick(c.id)}>Annehmen</button>
          ))}
          {msg.choices.filter((c) => c.id === 'mehr' || c.id === 'nein').map((c) => (
            <button key={c.id} className="btn btn-ghost btn-sm" title={c.hint} onClick={() => pick(c.id)}>{c.label}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StintRow({ g, s, live }: { g: Game; s: CareerStint; live: boolean }) {
  const rec = stintRecord(g, s);
  const club = crestOf(g, s.clubId);
  const ok = s.seasons.filter((x) => x.ok).length;
  const titles = s.seasons.flatMap((x) => x.titles ?? []);
  return (
    <div className={`rl-row car-stint ${live ? 'me' : ''}`}>
      <span className="rl-club">{club && <ClubCrest club={club} size={28} />}
        <ClubLink id={s.clubId}><span className="rl-name">{s.clubName}</span></ClubLink></span>
      <span className="rl-num car-when">{s.approx ? 'ab ' : ''}{s.from.slice(0, 4)}–{s.to ? s.to.slice(0, 4) : 'heute'}</span>
      <span className="rl-num car-rec" title="Liga: Siege-Remis-Niederlagen (Punkte je Spiel, 3-Punkte-Wertung)">{recordText(rec)}</span>
      <span className="rl-num car-goal" title="Saisonziel erreicht">{s.seasons.length ? `${ok}/${s.seasons.length} Ziele` : '–'}</span>
      <span className="rl-num car-titles">{titles.length ? titles.join(', ') : ''}</span>
      <span className="rl-num car-end">{live ? 'im Amt' : s.end === 'entlassen' ? 'entlassen' : 'gewechselt'}</span>
    </div>
  );
}

export function CareerView({ g, onChange }: { g: Game; onChange: () => void }) {
  const c = ensureCareer(g);
  const st = currentStint(g);
  const rec = stintRecord(g, st);
  const own = g.clubs[g.managedClubId];
  const lvl = jobLevel(g, g.managedClubId);
  const days = Math.max(0, Math.round((Date.parse(g.calendar.currentDate) - Date.parse(st.from)) / 86400000));
  const stints = [...c.stints].reverse();
  const mv = c.pendingMove;

  return (
    <DashPage className="car-page">
      <DashBox title="Dein Ansehen" icon="whistle" info="trainerAnsehen" right={isCareerMode(g) ? 'Karriere-Modus' : 'Teammanager'}>
        <div className="dkpis">
          <Kpi value={Math.round(c.rep)} label="Ansehen" color={vColor(c.rep)} />
          <Kpi value={lvl} label="Größe deines Vereins" info="vereinsgroesse" />
        </div>
        <Meter label={repLabel(c.rep)} value={c.rep} color={vColor(c.rep)} />
        <KV k="Verein" v={own?.name ?? '–'} strong />
        <KV k="Im Amt seit" v={`${CalendarEngine.formatDate(st.from)}${st.approx ? ' (geschätzt)' : ''} · ${days >= 365 ? `${(days / 365).toFixed(1).replace('.', ',')} Jahre` : `${days} Tage`}`} />
        <KV k="Ligabilanz" v={recordText(rec)} />
        {st.wage ? <KV k="Jahresgehalt" v={fmtPrice(st.wage)} info="trainerGehalt" /> : null}
        <KV k="Angebote · Entlassungen" v={`${c.offerCount} · ${c.sacked}`} />
      </DashBox>

      <DashBox title="Jobangebote" icon="contracts" span={2} info="jobangebote" right={c.offers.length ? `${c.offers.length} offen` : undefined}>
        {mv && (
          <div className="car-move">
            Zugesagt: Du wechselst zum 1. Juli zu <b>{mv.clubName}</b> ({LEAGUE(mv.tier)}, Ziel „{mv.goal}“, {fmtPrice(mv.wage)} im Jahr).
          </div>
        )}
        {c.offers.length ? (
          <div className="car-offers">{c.offers.map((o) => <OfferCard key={o.id} g={g} o={o} onChange={onChange} />)}</div>
        ) : !mv ? (
          <Empty icon="contracts">
            Gerade liegt kein Angebot vor. Größere Vereine melden sich, wenn dein Ansehen ihrer Größe entspricht – vor allem, wenn deine Saison besser läuft als erwartet.
          </Empty>
        ) : null}
      </DashBox>

      <DashBox title="Stationen" icon="trophy" span={2} flush right={`${c.stints.length}`}>
        <div className="rl rl-sm car-stints">
          {stints.map((s, i) => <StintRow key={s.clubId + s.from} g={g} s={s} live={i === 0 && !s.to} />)}
        </div>
      </DashBox>

      <DashBox title="Karriere-Chronik" icon="briefing" right={c.log.length ? `${c.log.length}` : undefined}>
        {c.log.length || st.seasons.length ? (
          <div className="car-log">
            {[...c.stints.flatMap((s) => s.seasons.map((x) => ({ date: `${x.season.slice(0, 4)}-06-30`, text: `${x.season}: Platz ${x.pos} (${LEAGUE(x.tier)}) mit ${s.clubName}${x.ok ? ' – Ziel erreicht' : ' – Ziel verfehlt'}${x.dRep ? `, Ansehen ${x.dRep > 0 ? '+' : ''}${x.dRep.toString().replace('.', ',')}` : ''}` }))), ...c.log]
              .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40).map((e, i) => (
                <div key={i} className="car-log-row"><span className="car-log-date">{fmtDateShort(e.date).dmy}</span><span>{e.text}</span></div>
              ))}
          </div>
        ) : <Empty icon="briefing">Deine Karriere hat gerade erst begonnen.</Empty>}
      </DashBox>
    </DashPage>
  );
}
