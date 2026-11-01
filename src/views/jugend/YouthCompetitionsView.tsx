import { Game } from '../../game/state';
import { DashBox, DashPage, Empty } from '../../ui/DashPage';

// =============================================================================
// JUGEND › JUGENDWETTBEWERBE — Platzhalter. Die Wettbewerbe (Jugendmeisterschaft,
// Jugendpokal …) folgen in einem eigenen Arbeitsschritt.
// =============================================================================
export function YouthCompetitionsView({ g }: { g: Game }) {
  void g;
  return (
    <DashPage rows={1}>
      <DashBox title="Jugendwettbewerbe" icon="trophy" span={3}>
        <Empty icon="trophy">Die Jugendwettbewerbe folgen bald: Meisterschaften und Pokale deiner Jugendmannschaften erscheinen hier.</Empty>
      </DashBox>
    </DashPage>
  );
}
