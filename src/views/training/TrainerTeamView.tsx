import type { Game } from '../../game/state';
import { StaffPage } from '../staff/StaffPage';

// =============================================================================
// TRAINING › TRAINERTEAM — Stellenplan des Trainerteams, Arbeitsmarkt und
// Personenprofil (gemeinsame Seite views/staff/StaffPage.tsx).
// =============================================================================
export function TrainerTeamView({ g, onChange }: { g: Game; onChange: () => void }) {
  return <StaffPage g={g} scope="team" onChange={onChange} />;
}
