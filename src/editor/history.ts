// =============================================================================
// RÜCKGÄNGIG / WIEDERHOLEN (Wunsch Pascal: QoL für Modder)
// Die Bereiche ändern den Datensatz direkt; deshalb hält der Verlauf Schnappschüsse
// als JSON-Text. Änderungen innerhalb von 500 ms (Tippen) fallen zu einem Schritt
// zusammen. Höchstens 40 Schritte (Standard-Datensatz ≈ 1,3 MB je Schritt).
// =============================================================================
const MAX = 40;

export class EditHistory {
  private base: string;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private timer: number | undefined;
  private read: () => string;

  constructor(read: () => string) { this.read = read; this.base = read(); }

  /** Neuer Ausgangspunkt (Datei geöffnet, neuer Datensatz): Verlauf leeren. */
  reset(): void { window.clearTimeout(this.timer); this.timer = undefined; this.base = this.read(); this.undoStack = []; this.redoStack = []; }

  /** Nach jeder Änderung aufrufen – der Schritt wird verzögert festgehalten. */
  touch(onCommit?: () => void): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => { this.timer = undefined; if (this.commit()) onCommit?.(); }, 500);
  }

  /** Offenen Schritt sofort festhalten; true, wenn sich etwas geändert hat. */
  commit(): boolean {
    window.clearTimeout(this.timer); this.timer = undefined;
    const now = this.read();
    if (now === this.base) return false;
    this.undoStack.push(this.base);
    if (this.undoStack.length > MAX) this.undoStack.shift();
    this.redoStack = [];
    this.base = now;
    return true;
  }

  canUndo(): boolean { return this.undoStack.length > 0 || (this.timer !== undefined && this.read() !== this.base); }
  canRedo(): boolean { return this.redoStack.length > 0; }
  get steps(): { undo: number; redo: number } { return { undo: this.undoStack.length, redo: this.redoStack.length }; }

  /** Liefert den Stand vor dem letzten Schritt (JSON) oder null. */
  undo(): string | null {
    this.commit();
    const prev = this.undoStack.pop();
    if (prev == null) return null;
    this.redoStack.push(this.base);
    this.base = prev;
    return prev;
  }

  redo(): string | null {
    this.commit();
    const next = this.redoStack.pop();
    if (next == null) return null;
    this.undoStack.push(this.base);
    this.base = next;
    return next;
  }
}
