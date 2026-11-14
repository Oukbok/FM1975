import type { Game } from '../../game/state';
import { StaffPage } from '../staff/StaffPage';

// =============================================================================
// VEREIN › MITARBEITER — alle Stellen außerhalb des Trainerteams (sportliche
// Leitung, Medizin, Scouting, Medien, Verwaltung); gemeinsame Seite
// views/staff/StaffPage.tsx.
// =============================================================================
export function StaffView({ g, onChange }: { g: Game; onChange: () => void }) {
  return <StaffPage g={g} scope="club" onChange={onChange} />;
}
