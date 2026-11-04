// Seitenwahl des laufenden Spiels mit Verlauf „Zurück“/„Vorwärts“ (je bis zu 20 Seiten,
// geleert, sobald ein neuer Tag beginnt) und Tastatur Alt+← / Alt+→ (nicht in Eingabefeldern).
// 'chronicle' ist kein Menüpunkt, sondern öffnet das große Chronik-Fenster.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Screen } from './navigation';

export function useScreenHistory(currentDate: string) {
  const [screen, setScreenRaw] = useState<Screen>('dashboard');
  const [chronicleOpen, setChronicleOpen] = useState(false);
  const [hist, setHist] = useState<{ back: Screen[]; fwd: Screen[] }>({ back: [], fwd: [] });
  const histRef = useRef(hist);
  histRef.current = hist;
  const screenRef = useRef<Screen>('dashboard');
  useEffect(() => { screenRef.current = screen; }, [screen]);

  const setScreen = useCallback((s: Screen) => {
    if (s === 'chronicle') { setChronicleOpen(true); return; }
    const cur = screenRef.current;
    if (s !== cur) setHist((h) => ({ back: [...h.back, cur].slice(-20), fwd: [] }));
    screenRef.current = s;
    setScreenRaw(s);
  }, []);
  const goBack = useCallback(() => {
    const h = histRef.current;
    if (!h.back.length) return;
    const to = h.back[h.back.length - 1];
    setHist({ back: h.back.slice(0, -1), fwd: [...h.fwd, screenRef.current].slice(-20) });
    screenRef.current = to;
    setScreenRaw(to);
  }, []);
  const goForward = useCallback(() => {
    const h = histRef.current;
    if (!h.fwd.length) return;
    const to = h.fwd[h.fwd.length - 1];
    setHist({ back: [...h.back, screenRef.current].slice(-20), fwd: h.fwd.slice(0, -1) });
    screenRef.current = to;
    setScreenRaw(to);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') goBack(); else goForward();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goBack, goForward]);
  useEffect(() => { setHist({ back: [], fwd: [] }); }, [currentDate]);

  return {
    screen, setScreen, chronicleOpen, setChronicleOpen,
    onBack: hist.back.length ? goBack : undefined,
    onForward: hist.fwd.length ? goForward : undefined,
  };
}
