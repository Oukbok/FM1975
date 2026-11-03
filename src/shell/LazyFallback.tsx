// Platzhalter, solange ein nachgeladenes Stück (shell/lazyParts.ts) unterwegs ist.
// Seite: füllt die Inhaltsfläche genau wie eine DashPage (kein Springen des Layouts).
// Fenster: ruhige Abdunklung wie `.modal-overlay`, darüber nur ein kleiner Hinweis.
import { ReactNode, Suspense } from 'react';

export function PageLoading() {
  return <div className="lazy-page" role="status" aria-live="polite"><span className="lazy-note">Lädt …</span></div>;
}

export function OverlayLoading() {
  return <div className="lazy-overlay" role="status" aria-live="polite"><span className="lazy-note">Lädt …</span></div>;
}

/** Suspense-Grenze für ein Fenster: eigene Grenze je Fenster, damit nichts anderes verschwindet. */
export function LazyWin({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OverlayLoading />}>{children}</Suspense>;
}
