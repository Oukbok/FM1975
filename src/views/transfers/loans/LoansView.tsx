// =============================================================================
// TRANSFERS › LEIHEN (Wunsch Pascal: Leihen gut erreichbar)
// -----------------------------------------------------------------------------
// Drei Reiter:
//   • Ausgeliehen – deine Leihspieler (Einsätze, Minuten, Tore, Stärke seit Beginn,
//     Bedingungen), laufende Leihgespräche, Leihkandidaten anderer Vereine mit
//     „Leihe anfragen“, Regeln der Saison.
//   • Verliehen – deine verliehenen Spieler mit Entwicklung beim Leihverein,
//     Einsatzgarantie, Kaufoption/Kaufpflicht und Rückruf; die Leihliste und
//     Vorschläge aus deinem Kader („Zur Leihe anbieten“).
//   • Angebote – Leihangebote anderer Vereine (annehmen, bessere Bedingungen fordern,
//     ablehnen).
// Logik: game/loanTalks.ts, game/loanMarket.ts, game/loanLife.ts, Regeln data/loanRules.ts.
// =============================================================================
import { useState } from 'react';
import PosBadge from '../../../components/PosBadge';
import { CalendarEngine } from '../../../engine/calendar';
import { expectedRole, loanStats, ROLE_DE, termsLines } from '../../../engine/loanDeal';
import { isAiClub } from '../../../game/aiClubs';
import { loanCandidates } from '../../../game/aiLoans';
import { incomingOffers } from '../../../game/incomingOffers';
import { canRecall, loanCount, loanRulesNow, recallLoan } from '../../../game/loanLife';
import { toggleLoanListed } from '../../../game/loanMarket';
import { activeLoanTalks, loanTalkBlocker, startLoanTalk } from '../../../game/loanTalks';
import type { Game } from '../../../game/state';
import { openContractScreen } from '../../../screens/contract/contractOpen';
import type { Player } from '../../../types';
import { DashBox, DashPage, Empty } from '../../../ui/DashPage';
import { fmtPrice, fmtWage } from '../../../ui/format';
import { InfoTip } from '../../../ui/InfoTip';
import { SubTabsPage, useSubTab } from '../../../ui/SubTabs';
import { IncomingOffersList, useOfferAnswers } from '../IncomingOffers';
import { ClubName, windowInfo } from '../NegotiationsOverview';
import FaceThumb from '../../../components/FaceThumb';
import { PlayerLink } from '../../../components/playerMenu/PlayerLink';

/** Gesicht + Name (Klick öffnet das Profil). */
function PlayerCell({ g, p }: { g: Game; p: Player }) {
  return <span className="tm-name"><FaceThumb p={p} club={g.clubs[p.clubId]} size={26} /><PlayerLink id={p.id}>{p.fullName}</PlayerLink></span>;
}

type Tab = 'aus' | 'ver' | 'angebote';
const date = (iso: string) => CalendarEngine.formatDate(iso);

/** Kurzfassung der Bedingungen für eine Tabellenzelle. */
function condText(p: Player): string {
  const l = p.loan!, d = l.deal;
  const parts = [d ? `${Math.round(d.share * 100)} % Gehalt` : 'volles Gehalt'];
  if (l.optionFee && !l.noOption) parts.push(`Option ${fmtPrice(l.optionFee)}`);
  if (d?.obligation) parts.push(`Pflicht ${fmtPrice(d.obligation.fee)}`);
  if (d?.recall) parts.push('Rückruf');
  if (d?.noParent) parts.push('nicht gegen Stammverein');
  return parts.join(' · ');
}

function Delta({ p }: { p: Player }) {
  const d0 = p.loan?.deal?.ov0;
  const now = Math.round(p.overall);
  if (d0 == null) return <b>{now}</b>;
  const d = now - d0;
  return <><b>{now}</b><span className={d > 0 ? 'pos' : d < 0 ? 'neg' : 'muted'}> ({d > 0 ? `+${d}` : d})</span></>;
}

function Guarantee({ p }: { p: Player }) {
  const d = p.loan?.deal;
  if (!d?.minApps) return <span className="muted">–</span>;
  const st = loanStats(p);
  return <span className={st.apps >= d.minApps ? 'pos' : ''}>{st.apps}/{d.minApps}</span>;
}

function LoanTable({ g, list, out, onChange }: { g: Game; list: Player[]; out: boolean; onChange: () => void }) {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <>
      <table className="dtable rl-players">
        <thead><tr>
          <th>Spieler</th><th className="ctr">Pos</th><th className="num">Alter</th><th>{out ? 'Leihverein' : 'Stammverein'}</th><th className="num">Bis</th>
          <th className="num">Spiele</th><th className="num">Min.</th><th className="num">Tore</th><th className="num">Stärke</th><th className="num">Garantie</th><th>Bedingungen</th>{out && <th />}
        </tr></thead>
        <tbody>
          {list.map((p) => {
            const st = loanStats(p);
            return (
              <tr key={p.id} data-pid={p.id}>
                <td className="nowrap rl-name"><PlayerCell g={g} p={p} /></td>
                <td className="ctr"><PosBadge p={p} compact /></td>
                <td className="num">{p.age}</td>
                <td className="nowrap"><ClubName g={g} id={out ? p.clubId : p.loan!.fromClubId} /></td>
                <td className="num muted nowrap">{date(p.loan!.until)}</td>
                <td className="num">{st.apps}{st.starts ? <span className="muted"> ({st.starts})</span> : null}</td>
                <td className="num">{st.minutes.toLocaleString('de-DE')}</td>
                <td className="num">{st.goals}</td>
                <td className="num nowrap"><Delta p={p} /></td>
                <td className="num"><Guarantee p={p} /></td>
                <td className="muted ln-cond">{condText(p)}</td>
                {out && <td className="nowrap">{p.loan?.deal?.recall
                  ? <button type="button" className="b3 b3-s" disabled={!canRecall(g, p)} title={canRecall(g, p) ? 'Rückrufklausel ziehen' : 'Zurückholen geht nur im Januar'}
                    onClick={() => { setMsg(recallLoan(g, p.id)); onChange(); }}>Zurückholen</button> : null}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
      {msg && <div className="dnote ln-msg">{msg}</div>}
    </>
  );
}

function RulesBox({ g }: { g: Game }) {
  const r = loanRulesNow(g);
  const c = loanCount(g, g.managedClubId);
  const w = windowInfo(g.calendar.currentDate);
  return (
    <DashBox title={`Regeln ${g.season}`} info="leihgrenze">
      <div className="ln-rules">
        <div className="ln-kv"><span>Transferfenster</span><b>{w.text}</b></div>
        <div className="ln-kv"><span>Leihspieler (zählen zur Grenze)</span><b>{c.in} aus · {c.out} ver{r.maxLoans != null ? ` · Grenze ${r.maxLoans}` : ''}</b></div>
        <ul className="ln-notes">{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </div>
    </DashBox>
  );
}

/** Junge Spieler anderer Vereine, die dort kaum spielen und bei dir Spielpraxis bekämen. */
function candidatesFor(g: Game): Player[] {
  const own = g.clubs[g.managedClubId];
  const today = g.calendar.currentDate;
  const mine = own.playerIds.map((id) => g.players[id]).filter(Boolean);
  const out: Player[] = [];
  for (const c of Object.values(g.clubs)) {
    if (c.id === own.id || !isAiClub(g, c)) continue;
    for (const p of loanCandidates(g, c, today)) if (expectedRole(p, mine) !== 'bench') out.push(p);
  }
  return out.sort((a, b) => b.overall - a.overall).slice(0, 60);
}

function AusgeliehenTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const own = g.clubs[g.managedClubId];
  const inn = own.playerIds.map((id) => g.players[id]).filter((p) => p?.loan);
  const talks = activeLoanTalks(g);
  const [note, setNote] = useState<string | null>(null);
  const mine = own.playerIds.map((id) => g.players[id]).filter(Boolean);
  const cands = candidatesFor(g);
  const ask = (p: Player) => {
    const r = startLoanTalk(g, p.id);
    if (typeof r === 'string') { setNote(r); return; }
    setNote(null); onChange(); openContractScreen({ kind: 'loan', talkId: r.id });
  };
  return (
    <DashPage>
      <DashBox title="Deine Leihspieler" info="leihspieler" span={2} flush right={`${inn.length} ausgeliehen`}>
        {inn.length ? <LoanTable g={g} list={inn} out={false} onChange={onChange} />
          : <Empty icon="swap">Du hast keinen Spieler ausgeliehen. Unten findest du Kandidaten; jeden anderen Spieler fragst du über Spielerprofil oder Rechtsklick an („Leihe anfragen“).</Empty>}
      </DashBox>
      <RulesBox g={g} />
      <DashBox title="Leihkandidaten" info="leihen" span={2} flush right={`${cands.length} Spieler`}>
        {note && <div className="dnote ln-msg bad">{note}</div>}
        {cands.length ? (
          <table className="dtable rl-players">
            <thead><tr><th>Spieler</th><th className="ctr">Pos</th><th className="num">Alter</th><th>Verein</th><th className="num">Stärke</th><th>Bei dir</th><th className="num">Gehalt</th><th /></tr></thead>
            <tbody>
              {cands.map((p) => {
                const block = loanTalkBlocker(g, p);
                return (
                  <tr key={p.id} data-pid={p.id}>
                    <td className="nowrap rl-name"><PlayerCell g={g} p={p} /></td>
                    <td className="ctr"><PosBadge p={p} compact /></td>
                    <td className="num">{p.age}</td>
                    <td className="nowrap"><ClubName g={g} id={p.clubId} /></td>
                    <td className="num"><b>{Math.round(p.overall)}</b></td>
                    <td className="nowrap">{ROLE_DE[expectedRole(p, mine)]}</td>
                    <td className="num nowrap muted">{fmtWage(p.contract.weeklyWage)}</td>
                    <td className="nowrap"><button type="button" className="b3 b3-s" disabled={!!block} title={block ?? 'Verhandlungstisch öffnen'} onClick={() => ask(p)}>Leihe anfragen</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <Empty icon="watchlist">Gerade bietet sich kein junger Spieler an, der bei dir spielen würde.</Empty>}
      </DashBox>
      <DashBox title="Leihgespräche" right={`${talks.length} laufend`}>
        {talks.length ? talks.map((t) => {
          const p = g.players[t.playerId];
          return (
            <div key={t.id} className="dlist-row clickable" data-pid={p?.id} onClick={() => openContractScreen({ kind: 'loan', talkId: t.id })}>
              <span className="grow"><b>{p?.fullName ?? 'Spieler'}</b><span className="muted"> · <ClubName g={g} id={t.lenderId} /> · {t.phase === 'agreed' ? 'Einigung – beginnt im nächsten Fenster' : t.round ? `Runde ${t.round}` : 'noch kein Angebot'}</span></span>
            </div>
          );
        }) : <Empty icon="negotiations">Keine laufenden Leihgespräche.</Empty>}
      </DashBox>
    </DashPage>
  );
}

function VerliehenTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const own = g.clubs[g.managedClubId];
  const out = Object.values(g.players).filter((p) => p.loan?.fromClubId === own.id && p.clubId !== own.id);
  const squad = own.playerIds.map((id) => g.players[id]).filter(Boolean);
  const listed = squad.filter((p) => p.loanListed);
  const sugg = loanCandidates(g, own, g.calendar.currentDate).filter((p) => !p.loanListed);
  const toggle = (p: Player) => { toggleLoanListed(g, p.id); onChange(); };
  return (
    <DashPage>
      <DashBox title="Verliehene Spieler" info="leihspieler" span={3} flush right={`${out.length} verliehen`}>
        {out.length ? <LoanTable g={g} list={out} out onChange={onChange} />
          : <Empty icon="swap">Kein Spieler ist verliehen. Setze junge Ergänzungsspieler auf die Leihliste – im Transferfenster melden sich Vereine, bei denen sie spielen würden.</Empty>}
      </DashBox>
      <DashBox title="Zur Leihe angeboten" info="leihangebote" span={2} right={`${listed.length} Spieler`}>
        {listed.length ? listed.map((p) => (
          <div key={p.id} className="dlist-row" data-pid={p.id}>
            <PosBadge p={p} compact />
            <span className="grow"><b><PlayerLink id={p.id}>{p.fullName}</PlayerLink></b><span className="muted"> · {p.age} J. · Stärke {Math.round(p.overall)} · {p.seasonStats.appearances} Einsätze diese Saison</span></span>
            <button type="button" className="b3 b3-s" onClick={() => toggle(p)}>Zurückziehen</button>
          </div>
        )) : <Empty icon="transfers">Niemand steht auf der Leihliste. „Zur Leihe anbieten“ gibt es im Spielerprofil, per Rechtsklick und rechts bei den Vorschlägen.</Empty>}
        <div className="dnote mt8">Angebote kommen nur im Transferfenster (montags und donnerstags) – von Vereinen, bei denen der Spieler spielen würde.</div>
      </DashBox>
      <DashBox title="Vorschläge aus deinem Kader" right={`${sugg.length}`}>
        {sugg.length ? sugg.map((p) => (
          <div key={p.id} className="dlist-row" data-pid={p.id}>
            <PosBadge p={p} compact />
            <span className="grow"><b><PlayerLink id={p.id}>{p.fullName}</PlayerLink></b><span className="muted"> · {p.age} J. · {Math.round(p.overall)}</span></span>
            <button type="button" className="b3 b3-s" onClick={() => toggle(p)}>Anbieten</button>
          </div>
        )) : <Empty icon="squad">Kein junger Ergänzungsspieler bräuchte gerade Spielpraxis woanders.</Empty>}
      </DashBox>
    </DashPage>
  );
}

function AngeboteTab({ g, onChange }: { g: Game; onChange: () => void }) {
  const offers = incomingOffers(g).filter((o) => o.kind === 'loan');
  const [done, setDone] = useOfferAnswers();
  const first = offers[0]?.terms;
  return (
    <DashPage>
      <DashBox title="Leihangebote für deine Spieler" info="leihangebote" span={2} rows={2} right={`${offers.length} offen`}>
        {offers.length || done.length ? <IncomingOffersList g={g} offers={offers} done={done} setDone={setDone} onChange={onChange} />
          : <Empty icon="negotiations">Kein offenes Leihangebot. Angebote kommen im Transferfenster für Spieler auf deiner Leihliste und für junge Ergänzungsspieler.</Empty>}
      </DashBox>
      <DashBox title="Bedingungen im Detail" rows={2}>
        {offers[0]?.player && first ? (
          <div className="ln-rules">
            <div className="ln-kv"><span>{offers[0].player.fullName}</span><b>{offers[0].clubName}</b></div>
            {termsLines(first, fmtPrice, date, fmtWage(offers[0].player.contract.weeklyWage * first.share)).map((l) => <div key={l.k} className="ln-kv"><span>{l.k}</span><b>{l.v}</b></div>)}
            <div className="dnote mt8">„Bessere Bedingungen fordern“ verlangt volles Gehalt und eine Leihgebühr <InfoTip k="leihangebote" />. Braucht der Verein den Spieler dringend, geht er mit – sonst ist das Angebot vom Tisch.</div>
          </div>
        ) : <Empty icon="info">Hier stehen die Bedingungen des nächsten Angebots.</Empty>}
      </DashBox>
    </DashPage>
  );
}

export function LoansView({ g, onChange = () => {} }: { g: Game; onChange?: () => void }) {
  const [tab, setTab] = useSubTab<Tab>('transfers.leihen', 'aus');
  const own = g.clubs[g.managedClubId];
  const inn = own.playerIds.filter((id) => g.players[id]?.loan).length;
  const out = Object.values(g.players).filter((p) => p.loan?.fromClubId === own.id && p.clubId !== own.id).length;
  const offers = incomingOffers(g).filter((o) => o.kind === 'loan').length;
  return (
    <SubTabsPage active={tab} onSelect={setTab}
      tabs={[{ id: 'aus', label: 'Ausgeliehen', count: inn || undefined }, { id: 'ver', label: 'Verliehen', count: out || undefined }, { id: 'angebote', label: 'Angebote', count: offers || undefined }]}>
      {tab === 'aus' ? <AusgeliehenTab g={g} onChange={onChange} /> : tab === 'ver' ? <VerliehenTab g={g} onChange={onChange} /> : <AngeboteTab g={g} onChange={onChange} />}
    </SubTabsPage>
  );
}
