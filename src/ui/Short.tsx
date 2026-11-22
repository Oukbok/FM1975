// Kurzform für Spaltenköpfe (Regel docs/research/table-rules.md): `<th><Short s="Fr.">Frische</Short></th>`
// zeigt „Frische“, in eingepassten Tabellen (`data-fit`, ui/stableTables.ts) „Fr.“ – der volle
// Name bleibt als Tooltip. CSS `.th-full`/`.th-short` in styles/33-tables.css.
import type { ReactNode } from 'react';

export default function Short({ s, title, children }: { s: string; title?: string; children: ReactNode }) {
  return (
    <>
      <span className="th-full">{children}</span>
      <span className="th-short" title={title ?? (typeof children === 'string' ? children : undefined)}>{s}</span>
    </>
  );
}
