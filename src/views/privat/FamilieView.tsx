// =============================================================================
// PRIVAT › FAMILIE (Wunsch Pascal #47): Partner (Beziehung, Antrag, Kinderwunsch),
// Kinder (Anlagen als Einschätzung, Weg, Jugend), Nachfolge (Generationswechsel)
// und Stammbaum über alle Generationen. Logik game/private/.
// =============================================================================
import { useState } from 'react';
import type { Game } from '../../game/state';
import { ageOf, ensurePrivate, fullName, kidsOf, partnerOf, type Person } from '../../game/private/privateState';
import { canPropose, endRelationship, gift, heirScore, heirsOf, joinYouth, propose, setSeeking, setWish } from '../../game/private/privateGame';
import { canHandOverExternal, handOver } from '../../game/private/succession';
import { HEIR_MIN_AGE } from '../../data/privateLife';
import { CalendarEngine } from '../../engine/calendar';
import { DashBox, DashPage, Empty, KV } from '../../ui/DashPage';
import Seg from '../../ui/Seg';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import { Bar, Feedback, MeterRow, personLine, ROLE_DE, yearsTxt, talentWord, useFeedback } from './parts';

const PATH_DE: Record<NonNullable<Person['path']>, string> = { offen: 'noch offen', spieler: 'Fußballer', manager: 'Sportmanagement', eigen: 'eigener Weg' };

function KidRow({ g, k, act }: { g: Game; k: Person; act: (t: string) => void }) {
  const st = ensurePrivate(g);
  const a = ageOf(g, k);
  const pl = k.playerId ? (g.players[k.playerId] ?? g.youthPlayers[k.playerId]) : undefined;
  const clubName = pl ? g.clubs[pl.clubId]?.shortName ?? '' : '';
  const canYouth = k.sex === 'm' && !k.playerId && a >= 7 && a <= 17;
  return (
    <tr>
      <td className="rl-main">{k.first}<div className="pv-sub">{yearsTxt(a)}</div></td>
      <td><Bar v={k.fussball ?? 0} /></td>
      <td>{a >= 6 ? talentWord(k.talent ?? 0) : '–'}</td>
      <td><Bar v={k.fuehrung ?? 0} /></td>
      <td><Bar v={k.bond ?? 0} /></td>
      <td className="car-cut">{pl ? <><PlayerLink id={pl.id}>{PATH_DE.spieler}</PlayerLink><div className="pv-sub">{clubName} · Stärke {pl.overall}</div></> : PATH_DE[k.path ?? 'offen']}</td>
      <td className="pv-acts">
        {canYouth && <button type="button" className="btn btn-sm" onClick={() => act(joinYouth(g, st, k))}>In die Jugend</button>}
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => act(gift(g, k.id))}>Geschenk</button>
      </td>
    </tr>
  );
}

function TreeCard({ g, p, cur }: { g: Game; p: Person; cur: string }) {
  return (
    <div className={`pv-tree-card ${p.id === cur ? 'me' : ''} ${p.alive ? '' : 'dead'}`}>
      <b>{fullName(p)}</b>
      <span className="pv-sub">{personLine(g, p)} · {p.id === cur ? 'du' : ROLE_DE[p.role]}</span>
      {p.managed && <span className="pv-tree-mgr">Manager {p.managed.from.slice(0, 4)}–{p.managed.to?.slice(0, 4) ?? 'heute'}</span>}
    </div>
  );
}

export function FamilieView({ g, onChange }: { g: Game; onChange: () => void }) {
  const st = ensurePrivate(g);
  const [fb, setFb] = useFeedback();
  const [confirm, setConfirm] = useState<string>('');
  const act = (t: string) => { setFb(t); onChange(); };
  const partner = partnerOf(st);
  const kids = kidsOf(st);
  const heirs = heirsOf(g, st);
  const ext = canHandOverExternal(g);
  const self = st.persons[st.selfId];
  // Stammbaum: alle Personen außer Kurzbekanntschaften, nach Generation.
  const people = Object.values(st.persons).filter((p) => p.role !== 'ex' || p.id === st.partnerId || p.parents?.length);
  const gens = [...new Set(people.map((p) => p.gen))].sort((a, b) => a - b);

  return (
    <DashPage className="pv-page">
      <DashBox title={partner ? (st.married ? 'Ehe' : 'Partnerschaft') : 'Partnersuche'} info="privatfamilie">
        {partner ? (
          <>
            <KV k={fullName(partner)} v={personLine(g, partner)} strong />
            {st.married && <KV k="Verheiratet seit" v={CalendarEngine.formatDate(st.married)} />}
            <MeterRow k="Beziehung" v={st.rel} />
            <div className="pv-toggle-row">
              <span>Kinderwunsch</span>
              <Seg size="s" value={st.wish ? 1 : 0} options={[{ v: 0, label: 'nein' }, { v: 1, label: 'ja' }]} onChange={(v) => { setWish(g, v === 1); onChange(); }} />
            </div>
            {st.expecting && <div className="dnote">Nachwuchs kommt ab {CalendarEngine.formatDate(st.expecting)}.</div>}
            <div className="dbtnrow mt8">
              <button type="button" className="btn btn-sm" onClick={() => act(gift(g, partner.id))}>Geschenk</button>
              {canPropose(st) && <button type="button" className="btn btn-sm btn-primary" onClick={() => act(propose(g))}>Heiratsantrag</button>}
              {confirm === 'sep'
                ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setConfirm(''); act(endRelationship(g)); }}>Wirklich trennen</button>
                : <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirm('sep')}>Trennen</button>}
            </div>
            <div className="dnote">Beziehung wächst mit Zeit für den Partner (Freizeit) und Urlauben, sie sinkt, wenn nur der Verein zählt. {!st.married && st.rel < 65 ? 'Ab 65 kannst du einen Antrag machen.' : ''}</div>
          </>
        ) : (
          <>
            <div className="dnote">Du bist Single. Wer Zeit für Partner und Hobby einplant, lernt eher jemanden kennen – du bekommst dann eine Nachricht.</div>
            <div className="pv-toggle-row">
              <span>Interesse an</span>
              <Seg size="s" value={st.seeking} options={[{ v: 'w', label: 'Frauen' }, { v: 'm', label: 'Männern' }]} onChange={(v) => { setSeeking(g, v); onChange(); }} />
            </div>
          </>
        )}
        <Feedback text={fb} />
      </DashBox>

      <DashBox title="Kinder" span={2} flush right={kids.length ? `${kids.length}` : undefined}>
        {kids.length ? (
          <table className="dtable rl-sm pv-kids">
            <thead><tr><th>Name</th><th>Fußball</th><th>Talent</th><th>Führung</th><th>Bindung</th><th>Weg</th><th /></tr></thead>
            <tbody>{kids.map((k) => <KidRow key={k.id} g={g} k={k} act={act} />)}</tbody>
          </table>
        ) : <Empty icon="fans">{partner ? 'Noch keine Kinder. Mit Kinderwunsch und guter Beziehung kann es klappen.' : 'Noch keine Kinder.'}</Empty>}
        <div className="dnote pv-pad">Fußball: Lust auf den Sport, wächst mit gemeinsamer Zeit. Talent: Einschätzung der Jugendtrainer ab 6. Führung: Eignung als Nachfolger. Söhne können ab 7 in deine Jugend; mit 16 fällt die Entscheidung über den Weg.</div>
      </DashBox>

      <DashBox title="Nachfolge" info="privatnachfolge">
        {heirs.length ? (
          <div className="pv-heirs">
            {heirs.map((h) => (
              <div key={h.id} className="pv-heir">
                <span className="pv-heir-n">{fullName(h)}<span className="pv-sub">{ageOf(g, h)} · {PATH_DE[h.path ?? 'offen']} · Eignung {Math.round(heirScore(h))}</span></span>
                {confirm === h.id
                  ? <button type="button" className="btn btn-sm btn-primary" onClick={() => { setConfirm(''); act(handOver(g, h.id)); }}>Bestätigen</button>
                  : <button type="button" className="btn btn-sm" onClick={() => setConfirm(h.id)}>Verein übergeben</button>}
              </div>
            ))}
          </div>
        ) : ext ? (
          <div className="pv-heir">
            <span className="pv-heir-n">Nachfolger von außen<span className="pv-sub">Dein Assistent – mit ihm beginnt eine neue Familie.</span></span>
            {confirm === 'ext'
              ? <button type="button" className="btn btn-sm btn-primary" onClick={() => { setConfirm(''); act(handOver(g, 'extern')); }}>Bestätigen</button>
              : <button type="button" className="btn btn-sm" onClick={() => setConfirm('ext')}>Übergeben</button>}
          </div>
        ) : <Empty icon="whistle">Ab {HEIR_MIN_AGE} kann ein Kind übernehmen. Dann spielst du mit {kids[0] ? kids[0].first : 'ihm oder ihr'} weiter – eine neue Generation am selben Verein.</Empty>}
        <div className="dnote">Bei der Übergabe wechselst du die Person: Name, Alter, Privatleben und Familie sind dann die deines Nachfolgers. Die Hälfte des Vermögens geht mit, das Haus bleibt bei den Eltern. Spielt das Kind noch, endet seine Spielerkarriere.</div>
      </DashBox>

      <DashBox title="Stammbaum" span={2} right={`${gens.length} ${gens.length === 1 ? 'Generation' : 'Generationen'}`}>
        <div className="pv-tree">
          {gens.map((gen) => (
            <div key={gen} className="pv-tree-gen">
              <div className="dsec">{gen === 0 ? 'Eltern' : `Generation ${gen}`}</div>
              <div className="pv-tree-row">
                {people.filter((p) => p.gen === gen).sort((a, b) => a.birth.localeCompare(b.birth)).map((p) => <TreeCard key={p.id} g={g} p={p} cur={self.id} />)}
              </div>
            </div>
          ))}
        </div>
      </DashBox>
    </DashPage>
  );
}
