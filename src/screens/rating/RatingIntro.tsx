// =============================================================================
// Startbildschirm der Bewertungsrunde: Anlass, Monat, Trainerteam, Anzahl
// Spieler und die Regeln (so, wie engine/development.ts rechnet). Die Show
// beginnt erst per Knopf „Starten“.
// =============================================================================
import Icon from '../../components/Icon';
import { STAFF_BY_ID } from '../../data/staff';
import { ensureStaff } from '../../game/staffGame';
import type { Game } from '../../game/state';

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const COACH_ROLES = ['cheftrainer', 'cotrainer', 'konditionstrainer', 'athletiktrainer', 'torwarttrainer', 'sportpsychologe', 'fussballpsychologe'];

export type RoundKind = 'small' | 'medium' | 'large';
export const kindOf = (label: string): RoundKind => (label.includes('Große') ? 'large' : label.includes('Herbst') ? 'small' : 'medium');

export function monthLabel(iso: string): string {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

function payoutRule(kind: RoundKind): string {
  if (kind === 'small') return 'Die Hälfte der gesammelten Entwicklungspunkte wird ausgezahlt, höchstens 2 Punkte auf oder ab. Der Rest bleibt für die nächste Runde stehen.';
  if (kind === 'medium') return '70 % der gesammelten Entwicklungspunkte werden ausgezahlt, höchstens 3 Punkte auf oder ab. Danach schätzen die Scouts das Potenzial neu ein.';
  return 'Alle gesammelten Punkte werden ausgezahlt, bis zu 6 auf oder ab. Dazu kommen Durchbrüche junger Spieler, Spätzünder und Leistungsknicke; das Potenzial junger Spieler entfaltet sich – oder nicht.';
}

export function RatingIntro({ g, label, date, count, onStart, onSkip }: {
  g: Game; label: string; date: string; count: number; onStart: () => void; onSkip: () => void;
}) {
  const club = g.clubs[g.managedClubId];
  const staff = ensureStaff(g).filter((m) => COACH_ROLES.includes(m.roleId))
    .sort((a, b) => COACH_ROLES.indexOf(a.roleId) - COACH_ROLES.indexOf(b.roleId));
  const kind = kindOf(label);
  const items = [
    { t: 'Wer wird bewertet', x: `Alle ${count} Profis deines Kaders, alphabetisch nach Nachnamen. Jugendspieler entwickeln sich getrennt in ihren Mannschaften.` },
    { t: 'Was zählt', x: 'Alter, Spielpraxis (auch in der zweiten Mannschaft), Training mit Anlagen, Trainerteam, Spezialtrainern, Schwerpunkt und Trainingsplan, Förderspieler, Charakter und Moral – und wie weit der Spieler noch von seinem Potenzial entfernt ist.' },
    { t: kind === 'large' ? 'Große Saison-Bewertung' : kind === 'small' ? 'Herbst-Bewertung' : 'Winter-Bewertung', x: payoutRule(kind) },
    { t: 'Begründung', x: 'Zu jedem Spieler nennt das Trainerteam die wichtigsten Ursachen seit der letzten Runde – aus der tatsächlichen Rechnung, nach Gewicht sortiert.' },
  ];
  return (
    <div className="dr-intro rt-intro">
      <div className="dr-intro-kicker">{club?.name ?? ''} · Saison {g.season}</div>
      <div className="dr-intro-title">Bewertungsrunde</div>
      <div className="dr-intro-round">{label} · {monthLabel(date)}</div>
      <div className="dr-intro-facts">
        <span>{count} Spieler</span>
        <span>Trainerteam: {staff.length ? staff.slice(0, 4).map((m) => `${m.name} (${STAFF_BY_ID[m.roleId]?.name ?? m.roleId})`).join(', ') + (staff.length > 4 ? ` und ${staff.length - 4} weitere` : '') : 'nur du als Trainer'}</span>
      </div>
      <div className="dr-rulebox">
        <div className="dr-rulebox-head">So wird bewertet</div>
        <div className="dr-rulegrid">
          {items.map((it) => (
            <div key={it.t} className="dr-rule">
              <div className="dr-rule-t">{it.t}</div>
              <div className="dr-rule-x">{it.x}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="dr-intro-actions">
        <button className="dr-close dr-start" onClick={onStart} autoFocus>
          <Icon name="play" size={24} /> Starten
        </button>
        <button className="ms-btn" onClick={onSkip}>Ergebnis sofort zeigen</button>
      </div>
    </div>
  );
}
