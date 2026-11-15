// =============================================================================
// MITARBEITER-SEITE (Wunsch Pascal: Mitarbeiter wie Spieler) — eine Seite für
// zwei Menüpunkte: Training › Trainerteam (`scope="team"`) und
// Verein › Mitarbeiter (`scope="club"`).
// Links der Stellenplan (wer sitzt wo, was fehlt) bzw. die Wirkung, rechts oben
// der Arbeitsmarkt – ein Pool für alle Stellen, sortiert nach Eignung für die
// gesuchte Stelle, filterbar nach Fähigkeit, Alter, Herkunft –, rechts unten
// das Profil der gewählten Person mit ihrer Eignung für jede Stelle.
// Verhandelt wird am Verhandlungstisch (`openContractScreen({ kind: 'staff' })`).
// =============================================================================
import { useMemo, useState } from 'react';
import { yearOf } from '../../engine/economy';
import type { StaffMember } from '../../engine/staffPeople';
import { type CoachSkill, staffValueOf } from '../../engine/staffSkills';
import type { Game } from '../../game/state';
import { ensureStaff } from '../../game/staffGame';
import { ensureStaffWorld, findPerson, staffMarket } from '../../game/staffWorld';
import { DashBox, DashPage } from '../../ui/DashPage';
import Seg from '../../ui/Seg';
import { StaffEffectsPanel } from './StaffEffects';
import { openContractScreen } from '../../screens/contract/contractOpen';
import { MarketFilters, MarketTable, type MarketState } from './StaffMarket';
import { StaffProfile } from './StaffProfile';
import { StaffSlots } from './StaffSlots';
import { availableIn, scopeRoles, type StaffScope } from './staffUi';

const MARKET_ROWS = 60;

export function StaffPage({ g, scope, onChange }: { g: Game; scope: StaffScope; onChange: () => void }) {
  const [, setTick] = useState(0);
  const [view, setView] = useState<'slots' | 'fx'>('slots');
  const [f, setF] = useState<MarketState>({ role: 'all', skill: '', minLvl: 0, maxAge: 0, onlyFree: true, exPro: false });
  const [sel, setSel] = useState<{ id: string; own: boolean } | null>(null);
  // Verhandelt wird am Verhandlungstisch (screens/negotiation/StaffTalk.tsx); danach zeichnet die Shell die Seite neu.
  const setTalk = (t: { id: string; role: string }) => openContractScreen({ kind: 'staff', id: t.id, role: t.role });
  const [msg, setMsg] = useState<string | null>(null);
  const refresh = (text?: string) => { if (text) setMsg(text); setTick((t) => t + 1); onChange(); };

  const year = yearOf(g.calendar.currentDate);
  ensureStaffWorld(g);
  const staff = ensureStaff(g);
  const roles = useMemo(() => availableIn(scopeRoles(scope), year), [scope, year]);
  const rows = staffMarket(g, {
    role: f.role, onlyFree: f.onlyFree, exPro: f.exPro || undefined, maxAge: f.maxAge || undefined, roles,
    min: f.skill && f.minLvl ? { [f.skill as CoachSkill]: staffValueOf(f.minLvl) } : undefined,
  });
  const shown = rows.slice(0, MARKET_ROWS);

  const selected: StaffMember | null = sel ? (sel.own ? staff.find((m) => m.id === sel.id) ?? null : findPerson(g, sel.id)) : null;
  // Stelle, auf die sich Profil und Verhandlung beziehen: die gesuchte, sonst die der gewählten Zeile.
  const rowRole = sel && !sel.own ? rows.find((r) => r.m.id === sel.id)?.role : undefined;
  const ctxRole = selected ? (sel?.own ? selected.roleId : f.role !== 'all' ? f.role : rowRole ?? selected.roleId) : f.role;

  return (
    <DashPage className="sf-page">
      <DashBox title={scope === 'team' ? 'Dein Trainerteam' : 'Deine Mitarbeiter'} info={scope === 'team' ? 'trainerniveau' : 'mitarbeiter'} rows={2} className="sf-left"
        right={<span className="sf-headr"><Seg<'slots' | 'fx'> size="s" value={view} onChange={setView} options={[{ v: 'slots', label: 'Stellen' }, { v: 'fx', label: 'Wirkung' }]} /></span>}>
        {view === 'slots'
          ? <StaffSlots g={g} scope={scope} selId={sel?.own ? sel.id : null} msg={msg}
              onSelect={(id) => setSel({ id, own: true })}
              onSearch={(roleId) => { setF((x) => ({ ...x, role: roleId })); setSel(null); }} />
          : <StaffEffectsPanel g={g} scope={scope} />}
      </DashBox>

      <DashBox title="Arbeitsmarkt" info="arbeitsmarktStab" span={2} className="sf-market" flush
        right={<span className="sf-count">{rows.length > MARKET_ROWS ? `beste ${MARKET_ROWS} von ${rows.length}` : `${rows.length} ${rows.length === 1 ? 'Person' : 'Personen'}`}</span>}>
        <MarketFilters g={g} roles={roles} f={f} set={(p) => { setF((x) => ({ ...x, ...p })); if (p.role) setSel(null); }} />
        <MarketTable g={g} rows={shown} role={f.role} selId={sel && !sel.own ? sel.id : null}
          onSelect={(id) => setSel({ id, own: false })} onTalk={(id, role) => setTalk({ id, role })} />
      </DashBox>

      <DashBox title={selected ? selected.name : 'Profil'} info="staffEignung" span={2} className="sf-person">
        <StaffProfile g={g} m={selected} own={!!sel?.own} role={ctxRole} scope={scope}
          onOffer={(roleId) => selected && setTalk({ id: selected.id, role: roleId })}
          onAct={(text, gone) => { if (gone) setSel(null); refresh(text); }} />
      </DashBox>

    </DashPage>
  );
}
