// =============================================================================
// <Icon /> — wiederverwendbare, skalierbare UI-Icon-Komponente (Set C)
// =============================================================================
// Rendert eines der 14 Duotone-Icons (Off-White + EIN Türkis-Akzent).
// Nutzung:  <Icon name="newGame" />           → Größe an font-size gekoppelt (1em)
//           <Icon name="trophy" size={20} />  → feste Pixelgröße
//           <Icon name="save" className="…" /> → zusätzliche CSS-Klasse
// Die eigentlichen SVG-Formen leben zentral in ./iconPaths.ts (Single Source),
// damit sie identisch auch als public/assets/icons/*.svg vorliegen.
// =============================================================================
import { ICON_MARKUP, IconName } from './iconPaths';

export type { IconName };

export default function Icon({
  name,
  size = '1em',
  className,
  title,
}: {
  name: IconName;
  /** Kantenlänge; Zahl = px, sonst CSS-Größe. Default 1em (folgt font-size). */
  size?: number | string;
  className?: string;
  /** Optionaler Barrierefreiheits-Text. */
  title?: string;
}) {
  const inner = ICON_MARKUP[name as string];
  if (!inner) return null;
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg
      className={`game-icon${className ? ` ${className}` : ''}`}
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title ?? name}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
