// Miniatur-Kopf für Listen (Bestenlisten, Aufstellung, Spielbericht …): freigestelltes Foto
// in fester Box (Breite `size`, Höhe × 600/512 wie die Bilder) – die Zeilenhöhe ändert sich nie. Ohne Foto
// bleibt die Box leer (ruhiger als eine Zeichnung mit Kasten zwischen freien Köpfen).
// Lädt lazy; CSS `.fthumb` in 28-faces.css.
import type { Club, Player } from '../types';
import PlayerAvatar from './PlayerAvatar';

type Who = Pick<Player, 'id' | 'face' | 'dateOfBirth' | 'age' | 'fullName'>;

export default function FaceThumb({ p, club, size = 22, className }: { p?: Who | null; club?: Club; size?: number; className?: string }) {
  return (
    <span className={`fthumb${className ? ` ${className}` : ''}`} style={{ width: size, height: Math.round(size * 600 / 512) }} aria-hidden="true">
      {p && <PlayerAvatar key={p.id} player={p as Player} club={club} size={size} photoOnly />}
    </span>
  );
}
