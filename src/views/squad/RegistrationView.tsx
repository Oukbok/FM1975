// =============================================================================
// KADER › SPIELERMELDUNG (Wunsch Pascal, #35): Regeln der Saison, Kaderauflagen
// der Liga, Ausländer im Kader, Europapokal-Meldeliste mit Vorauswahl und
// Homegrown-Quote, Spielberichtsbogen der aktuellen Aufstellung.
// Logik: game/registrationGame.ts, Regeln: data/registrationRules.ts.
// =============================================================================
import { useState } from 'react';
import { DOMESTIC_RULES, EURO_RULES, domesticRulesFor, euroRulesFor } from '../../data/registrationRules';
import { countsAsForeign, isAssimilated, isNational, isNonEuropean, matchForeignCap } from '../../engine/registration';
import { EUROPE_NATS } from '../../data/registrationRules';
import {
  assocTrained, bListEligible, checkEuroList, clubTrained, domesticStatus, euroAList, euroListOpen, ownInEurope, setEuroList, suggestEuroList,
} from '../../game/registrationGame';
import type { Game } from '../../game/state';
import type { Player } from '../../types';
import { DashBox, DashPage, Empty, KV, Kpi } from '../../ui/DashPage';
import { vColor } from '../../ui/format';
import { NatFlag } from '../../components/competition/CountryFlag';
import { PlayerLink } from '../../components/playerMenu/PlayerLink';
import PosBadge from '../../components/PosBadge';
import { seasonLabelOf } from '../../data/world/countries';

const GROUP_ORDER: Record<string, number> = { TW: 0, LIB: 1, IV: 1, RV: 1, LV: 1, DM: 2, ZM: 2, RM: 2, LM: 2, OM: 2, RA: 3, LA: 3, HS: 3, MS: 3 };

function foreignStatus(p: Player, year: number): { text: string; counts: boolean } {
  if (isNational(p, year)) return { text: 'Einheimisch', counts: false };
  const counts = countsAsForeign(p, year);
  const d = domesticRulesFor(year);
  if (!counts && d.scope === 'nonEurope' && EUROPE_NATS.has(p.nationality)) return { text: 'Europäer – frei', counts };
  if (!counts && d.assimilated && isAssimilated(p)) return { text: 'Fußball-Deutscher', counts };
  if (!counts) return { text: 'ohne Beschränkung', counts };
  return { text: isNonEuropean(p, year) && d.scope === 'nonEurope' ? 'Nicht-Europäer – zählt' : 'Ausländer – zählt', counts };
}

export function RegistrationView({ g, onChange }: { g: Game; onChange?: () => void }) {
  const club = g.clubs[g.managedClubId];
  const year = parseInt(g.season.slice(0, 4), 10);
  const dr = domesticRulesFor(year), er = euroRulesFor(year);
  const st = domesticStatus(g);
  const squad = club.playerIds.map((id) => g.players[id]).filter(Boolean)
    .sort((a, b) => (GROUP_ORDER[a.naturalPosition] ?? 9) - (GROUP_ORDER[b.naturalPosition] ?? 9) || b.overall - a.overall);
  const inEurope = ownInEurope(g);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const list = draft ?? euroAList(g);
  const chk = checkEuroList(g, list);
  const open = euroListOpen(g);
  const foreigners = squad.filter((p) => !isNational(p, year));
  const t = club.tactics;
  const xiIds = t?.startingXI?.length ? t.startingXI : Object.values(t?.lineupMap ?? {});
  const sheet = [...new Set([...xiIds, ...(t?.substitutes ?? [])])].map((id) => g.players[id]).filter(Boolean);
  const cap = matchForeignCap(year);
  const sheetForeign = sheet.filter((p) => countsAsForeign(p, year)).length;
  const toggle = (id: string) => setDraft((d) => { const cur = d ?? list; return cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]; });
  const save = () => { const r = setEuroList(g, list); setNote(r ?? 'Meldeliste gespeichert.'); if (!r) { setDraft(null); onChange?.(); } };

  return (
    <DashPage className="reg-page">
      <DashBox title={`Regeln ${seasonLabelOf(year)}`} info="spielermeldung">
        <div className="dsec">Liga & Pokal</div>
        <div className="reg-rule">{dr.text}</div>
        <div className="dsec">Europapokal</div>
        <div className="reg-rule">{er.text}</div>
        <div className="dsec">Verlauf</div>
        {DOMESTIC_RULES.filter((r) => r.from >= 1975 || r === DOMESTIC_RULES[0]).map((r) => (
          <div key={r.from} className={`reg-era ${r === dr ? 'on' : ''}`}><b>{r.from < 1975 ? 'bis 1991' : `ab ${seasonLabelOf(r.from)}`}</b><span>{r.text}</span></div>
        ))}
        {EURO_RULES.filter((r) => r.from >= 1991).map((r) => (
          <div key={`e${r.from}`} className={`reg-era ${r === er ? 'on' : ''}`}><b>Europa {seasonLabelOf(r.from)}</b><span>{r.text}</span></div>
        ))}
      </DashBox>

      <DashBox title="Kaderauflagen der Liga" right={st.issues.length ? `${st.issues.length} offen` : 'erfüllt'}>
        <div className="dkpis">
          <Kpi value={cap == null ? '–' : `${st.foreignCount}`} label={cap == null ? 'Ausländer ohne Grenze' : `Ausländer (je Spiel ${cap})`} />
          {st.minNational != null && <Kpi value={`${st.national}/${st.minNational}`} label="Einheimische" color={st.national < st.minNational ? 'var(--red)' : undefined} />}
          {st.nonEuropeMax != null && <Kpi value={`${st.nonEurope}/${st.nonEuropeMax}`} label="Nicht-Europäer" color={st.nonEurope > st.nonEuropeMax ? 'var(--red)' : undefined} />}
          {st.local && <Kpi value={`${st.localAssoc}/${st.local[0]}`} label={`Local Player (${st.localClub}/${st.local[1]} im Verein)`} color={st.localAssoc < st.local[0] || st.localClub < st.local[1] ? 'var(--red)' : undefined} />}
        </div>
        {st.issues.length ? st.issues.map((x) => <div key={x} className="dnote" style={{ color: 'var(--red)' }}>{x}</div>)
          : <div className="dnote">Alle Auflagen erfüllt. Geprüft wird jeweils nach dem Transferfenster (1.9. und 1.2.); Verstöße kosten eine Geldstrafe.</div>}
        <div className="dsec">Spielberichtsbogen (aktuelle Aufstellung)</div>
        <KV k="Ausländer in Startelf + Bank" v={cap == null ? `${sheetForeign} – keine Grenze` : `${sheetForeign} / ${cap}`} color={cap != null && sheetForeign > cap ? 'var(--red)' : undefined} strong />
        <div className="dnote">Überzählige Ausländer ersetzt der Co-Trainer beim Anpfiff durch den passendsten Einheimischen.</div>
      </DashBox>

      <DashBox title="Ausländer im Kader" right={`${foreigners.length}`}>
        {foreigners.length ? (
          <div className="reg-flist">
            {foreigners.map((p) => { const s = foreignStatus(p, year); return (
              <div key={p.id} className="reg-frow" data-pid={p.id}>
                <span className="reg-flag"><NatFlag nat={p.nationality} /></span>
                <span className="reg-fname"><PlayerLink id={p.id}>{p.fullName}</PlayerLink></span>
                <span className={`reg-st ${s.counts ? 'counts' : ''}`}>{s.text}</span>
              </div>
            ); })}
          </div>
        ) : <Empty icon="squad">Nur einheimische Spieler im Kader.</Empty>}
      </DashBox>

      <DashBox title="Europapokal-Meldeliste" span={3} info="meldeliste"
        right={inEurope && er.listMax != null ? <span className="reg-head-r">
          <span className={chk.ok ? '' : 'bad'}>{chk.count} / {chk.effMax ?? er.listMax}</span>
          {er.homegrown && <span>Homegrown {chk.assoc}/{er.homegrown[0]} · Verein {chk.club}/{er.homegrown[1]}</span>}
          <button className="dchip" disabled={!open.open} onClick={() => { setDraft(suggestEuroList(g)); setNote(null); }}>Vorauswahl</button>
          <button className="dchip on" disabled={!open.open || !draft} onClick={save}>Speichern</button>
        </span> : undefined}>
        {!inEurope ? <Empty icon="international">Dein Verein spielt in dieser Saison nicht im Europapokal.</Empty>
          : er.listMax == null ? <Empty icon="international">{er.text} Alle Spieler des Kaders sind spielberechtigt.</Empty> : (
          <>
            <div className="dnote">{open.text} {chk.reason ?? ''} {note ? `· ${note}` : ''}</div>
            <div className="reg-grid">
              {squad.map((p) => {
                const on = list.includes(p.id);
                const b = er.bList && bListEligible(p, club) && !on;
                return (
                  <label key={p.id} className={`reg-p ${on ? 'on' : ''} ${b ? 'blist' : ''}`} data-pid={p.id}>
                    <input type="checkbox" checked={on} disabled={!open.open} onChange={() => toggle(p.id)} />
                    <PosBadge p={p} compact single />
                    <span className="reg-p-name">{p.fullName}</span>
                    <NatFlag nat={p.nationality} />
                    <span className="reg-p-tags">{clubTrained(p, club) ? 'V' : assocTrained(p) ? 'L' : ''}{b ? ' · B-Liste' : ''}</span>
                    <b style={{ color: vColor(p.overall) }}>{p.overall}</b>
                  </label>
                );
              })}
            </div>
            <div className="dnote">V = im Verein ausgebildet, L = im Land ausgebildet. U21-Eigengewächse stehen zusätzlich auf der B-Liste und sind ohne A-Liste spielberechtigt. Nur Gemeldete spielen im Europapokal.</div>
          </>
        )}
      </DashBox>
    </DashPage>
  );
}
