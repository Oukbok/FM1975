import ClubCrest from '../../components/ClubCrest';
import { STAFF_BY_ID, STAFF_CAPS, STAFF_GROUP_META, STAFF_ROLES, computeStaffEffects, staffAvailable, staffMonthlySalary, staffMonthlyTotal } from '../../data/staff';
import { economyScale, yearOf } from '../../engine/economy';
import { Game } from '../../game/state';
import { PageHead } from '../../ui/PageHead';
import { fmtDM } from '../../ui/format';
import { useState } from 'react';

// =============================================================================
// MITARBEITER (Personal) — anstellbare Rollen, epochenabhängig (Block p11)
// =============================================================================
export function StaffView({ g, onChange }: { g: Game; onChange: () => void }) {
  const [showFuture, setShowFuture] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const club = g.clubs[g.managedClubId];
  const curYear = yearOf(g.calendar.currentDate);
  const scale = economyScale(curYear);
  const hired = new Set(g.hiredStaff ?? []);
  const monthly = staffMonthlyTotal(g.hiredStaff ?? [], scale);
  const fx = computeStaffEffects(g.hiredStaff ?? []);

  const toggle = (id: string) => {
    const role = STAFF_BY_ID[id];
    if (!role) return;
    const list = g.hiredStaff ?? (g.hiredStaff = []);
    const idx = list.indexOf(id);
    if (idx >= 0) {
      list.splice(idx, 1);
      setMsg(`✔ ${role.name} entlassen.`);
    } else {
      list.push(id);
      setMsg(`✔ ${role.name} angestellt (${fmtDM(staffMonthlySalary(role, scale))}/Monat).`);
    }
    onChange();
    setTimeout(() => setMsg(null), 3500);
  };

  const groups: StaffGroupKey[] = ['trainer', 'medical', 'scouting', 'media', 'admin'];

  return (
    <div className="page">
      <PageHead
        left={<ClubCrest club={club} size={27} />}
        title="Mitarbeiter"
        right={<span className="dim">Personalkosten: <b style={{ color: 'var(--accent)' }}>{fmtDM(monthly)}</b>/Monat</span>}
      />

      {/* Aggregierte, gedeckelte Effekte */}
      <div className="card mt12">
        <div className="section-title">Wirkung des Mitarbeiterstabs</div>
        <div className="staff-fx-grid">
          <StaffFxPill label="Verletzungsrisiko" value={`−${Math.round(fx.injuryReduction * 100)} %`} cap={`max −${Math.round(STAFF_CAPS.injuryReduction * 100)} %`} />
          <StaffFxPill label="Ausfallzeit (Reha)" value={`−${Math.round(fx.rehabReduction * 100)} %`} cap={`max −${Math.round(STAFF_CAPS.rehabReduction * 100)} %`} />
          <StaffFxPill label="Regeneration" value={`+${fx.recovery.toFixed(1)}/Tag`} cap={`max +${STAFF_CAPS.recovery}`} />
          <StaffFxPill label="Scouting-Genauigkeit" value={`+${Math.round(fx.scouting * 100)} %`} cap={`max +${Math.round(STAFF_CAPS.scouting * 100)} %`} />
          <StaffFxPill label="Reichweite / Fanbindung" value={`+${Math.round(fx.reach * 100)} %`} cap={`max +${Math.round(STAFF_CAPS.reach * 100)} %`} />
        </div>
        <div className="dim2 mini" style={{ marginTop: 8 }}>
          Alle Effekte sind gedeckelt und wirken nur für deinen Verein. Reha-Verkürzung und Regeneration
          sind im Spiel direkt spürbar (kürzere Ausfälle, schnellere Fitness), die Scouting-Genauigkeit
          präzisiert die Talentbewertung im Nachwuchs. Es gibt bewusst KEINEN direkten Sieg-Bonus.
        </div>
      </div>

      <label className="future-toggle mt12">
        <input type="checkbox" checked={showFuture} onChange={(e) => setShowFuture(e.target.checked)} />
        <span>Zukunft anzeigen</span>
        <span className="dim2 mini">— zeigt Rollen späterer Epochen (ausgegraut, noch nicht anstellbar).</span>
      </label>

      {msg && <div className="card mt12" style={{ borderColor: 'var(--accent)' }}>{msg}</div>}

      {groups.map((grp) => {
        const roles = STAFF_ROLES.filter((r) => r.group === grp)
          .filter((r) => staffAvailable(r, curYear) || showFuture);
        if (roles.length === 0) return null;
        const meta = STAFF_GROUP_META[grp];
        return (
          <div key={grp} className="mt12">
            <div className="section-title">{meta.icon} {meta.label}</div>
            <div className="staff-grid">
              {roles.map((r) => {
                const avail = staffAvailable(r, curYear);
                const isHired = hired.has(r.id);
                const salary = staffMonthlySalary(r, scale);
                return (
                  <div key={r.id} className={`card staff-card ${!avail ? 'fac-locked' : ''} ${isHired ? 'staff-hired' : ''}`}>
                    <div className="staff-card-head">
                      <span className="staff-name">{r.name}</span>
                      <span className="pill staff-cc">{r.costClass}</span>
                    </div>
                    <div className="dim mini staff-effect">{r.effect}</div>
                    <div className="staff-card-foot">
                      {avail ? (
                        <>
                          <span className="mini">{fmtDM(salary)}<span className="dim2">/Monat</span></span>
                          <button
                            className={`btn btn-sm ${isHired ? 'btn-danger' : ''}`}
                            style={{ marginLeft: 'auto' }}
                            onClick={() => toggle(r.id)}
                          >
                            {isHired ? '✕ Entlassen' : '＋ Anstellen'}
                          </button>
                        </>
                      ) : (
                        <span className="pill" style={{ color: 'var(--yellow)' }}>ab {r.unlockYear}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type StaffGroupKey = 'trainer' | 'medical' | 'scouting' | 'media' | 'admin';

export function StaffFxPill({ label, value, cap }: { label: string; value: string; cap: string }) {
  return (
    <div className="staff-fx">
      <div className="staff-fx-val accent-text">{value}</div>
      <div className="mini">{label}</div>
      <div className="dim2 mini">{cap}</div>
    </div>
  );
}
