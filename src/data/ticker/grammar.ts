// =============================================================================
// Mini-Grammatik für den Textmodus (ähnlich Tracery):
//   #symbol#   → zufällige Regel des Symbols (rekursiv)
//   {slot}     → Wert aus dem Kontext (Spielername, Verein, Minute …)
//   [a|b|c]    → Inline-Auswahl
// Regeln können mit Bedingungen beginnen:
//   "@1990- "  nur ab 1990,  "@-1991 " nur bis 1991,  "@1980-1995 " Bereich
//   "?regen "  nur wenn Flag gesetzt, "!derby " nur wenn Flag NICHT gesetzt
// Ein Gedächtnis je Symbol verhindert, dass dieselbe Variante kurz
// hintereinander wiederkommt.
// =============================================================================

export type Grammar = Record<string, string[]>;

export interface TextCtx {
  year: number;
  flags: Set<string>;
  slots: Record<string, string | number | undefined>;
}

interface Parsed { text: string; from: number; to: number; need: string[]; not: string[] }

const parsedCache = new WeakMap<string[], Parsed[]>();

function parseRules(rules: string[]): Parsed[] {
  let p = parsedCache.get(rules);
  if (p) return p;
  p = rules.map((raw) => {
    let text = raw;
    let from = 0, to = 9999;
    const need: string[] = [], not: string[] = [];
    for (;;) {
      const m = /^([@?!])(\S*)\s/.exec(text);
      if (!m) break;
      text = text.slice(m[0].length);
      if (m[1] === '@') {
        const [a, b] = m[2].split('-');
        if (a) from = Number(a);
        if (b) to = Number(b);
      } else if (m[1] === '?') need.push(m[2]);
      else not.push(m[2]);
    }
    return { text, from, to, need, not };
  });
  parsedCache.set(rules, p);
  return p;
}

export class Speaker {
  private memory = new Map<string, string[]>();
  constructor(private grammar: Grammar, private rng: () => number) {}

  add(g: Grammar): void { Object.assign(this.grammar, g); }

  /** Wählt eine Regel des Symbols, die zu Jahr/Flags passt und zuletzt nicht dran war. */
  pick(symbol: string, ctx: TextCtx): string | null {
    const rules = this.grammar[symbol];
    if (!rules || !rules.length) return null;
    const ok = parseRules(rules).filter((r) => ctx.year >= r.from && ctx.year <= r.to
      && r.need.every((f) => ctx.flags.has(f)) && !r.not.some((f) => ctx.flags.has(f)));
    if (!ok.length) return null;
    const mem = this.memory.get(symbol) ?? [];
    const keep = Math.min(ok.length - 1, Math.max(2, Math.floor(ok.length * 0.6)));
    let cands = ok.filter((r) => !mem.includes(r.text));
    if (!cands.length) cands = ok;
    const choice = cands[Math.floor(this.rng() * cands.length)];
    mem.push(choice.text);
    while (mem.length > keep) mem.shift();
    this.memory.set(symbol, mem);
    return choice.text;
  }

  /** Expandiert einen Text vollständig. */
  expand(text: string, ctx: TextCtx, depth = 0): string {
    if (depth > 8) return text;
    let out = text.replace(/#([a-zA-Z0-9_]+)#/g, (_, sym: string) => {
      const r = this.pick(sym, ctx);
      return r == null ? '' : this.expand(r, ctx, depth + 1);
    });
    out = out.replace(/\[([^\[\]]*\|[^\[\]]*)\]/g, (_, alts: string) => {
      const parts = alts.split('|');
      return parts[Math.floor(this.rng() * parts.length)];
    });
    out = out.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, k: string) => {
      const v = ctx.slots[k];
      return v == null ? '' : String(v);
    });
    return depth === 0 ? tidy(out) : out;
  }

  /** Symbol expandieren (leer, wenn keine Regel passt). */
  say(symbol: string, ctx: TextCtx): string {
    const r = this.pick(symbol, ctx);
    return r == null ? '' : this.expand(r, ctx);
  }
}

/** Leerzeichen, doppelte Satzzeichen und Großschreibung am Satzanfang aufräumen. */
export function tidy(s: string): string {
  let t = s.replace(/\s+/g, ' ').replace(/\s+([,.!?:;])/g, '$1').replace(/([.!?])\1+/g, '$1').replace(/,\./g, '.').trim();
  t = t.replace(/(^|[.!?]\s+)([a-zäöü])/g, (_m, a: string, b: string) => a + b.toUpperCase());
  return t;
}
