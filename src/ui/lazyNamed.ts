// Nachladen benannter Komponenten (Code-Splitting, scripts/build.mjs) ohne Flackern:
// Ist das Stück schon geladen (vorgeladen im Leerlauf), wird die Komponente beim Einhängen
// direkt gezeichnet – sonst über React.lazy mit Suspense-Platzhalter. Die Wahl gilt je
// eingehängter Instanz fest, damit nichts mitten im Leben neu eingehängt wird.
import { ComponentType, createElement, lazy, useState } from 'react';

export interface Named<M, K extends keyof M> { component: M[K]; preload: () => Promise<unknown> }

export function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, key: K): Named<M, K> {
  let mod: M | null = null;
  const keep = () => load().then((m) => { mod = m; return m; });
  const Lazy = lazy(() => keep().then((m) => ({ default: m[key] as unknown as ComponentType<unknown> })));
  function LazyNamed(props: Record<string, unknown>) {
    const [direct] = useState(() => !!mod);
    return direct && mod ? createElement(mod[key] as unknown as ComponentType<unknown>, props) : createElement(Lazy, props);
  }
  LazyNamed.displayName = `Lazy(${String(key)})`;
  return { component: LazyNamed as unknown as M[K], preload: keep };
}
