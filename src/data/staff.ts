// =============================================================================
// 1975 – A Football Manager — Mitarbeiter / Personal (Staff)
// =============================================================================
// Anstellbare Rollen abseits des Spielerkaders. Jede Rolle ist einer EPOCHE
// zugeordnet (unlockYear) und wird erst ab dem jeweiligen Jahr anstellbar –
// passend zur fortschreitenden Professionalisierung des Fußballs (1975 → 2021+).
//
// KOSTEN: Jede Rolle hat eine Kostenklasse K1–K5. Das Grundgehalt (DM, Basis
// 1975) skaliert über die Wirtschafts-Basis (economyScale) mit den Jahrzehnten
// mit. Die Summe der Monatsgehälter fließt als Ausgabe in die Finanzen
// (Kategorie „staff_wages“, Betreuerstab).
//
// EFFEKTE: real & GEDECKELT. Mehrere Rollen derselben Wirkung addieren sich bis
// zu einer Obergrenze:
//   • Verletzungswahrscheinlichkeit   −20 %  (Medizin/Physio)     [prepared*]
//   • Ausfallzeit / Reha              −25 %  (Reha/Return-to-Play) [real]
//   • zusätzl. Regeneration/Tag        bis +3 Fitness             [real]
//   • Scouting-Genauigkeit            +15 %  (Scouts/Datenanalyse) [real]
//   • Reichweite / Fanbindung         +20 %  (Medien/Social/CRM)   [flavor]
//   • KEIN direkter Sieg-Bonus.
//
// (*) Die Verletzungs-Wahrscheinlichkeit wird als Faktor bereitgestellt und dort
//     angewandt, wo das Spiel Verletzungen auslöst; Ausfall-Verkürzung &
//     Regeneration wirken sofort sichtbar im Kader (siehe App.processDay).
// =============================================================================

export type StaffCostClass = 'K1' | 'K2' | 'K3' | 'K4' | 'K5';

/** Grundgehalt je Kostenklasse (DM/Monat, Basisjahr 1975). Skaliert via economyScale. */
export const STAFF_COST_BASE: Record<StaffCostClass, number> = {
  K1: 1200,
  K2: 2500,
  K3: 5000,
  K4: 10000,
  K5: 20000,
};

/** Thematische Gruppierung (nur für die Anzeige/Sortierung). */
export type StaffGroup =
  | 'trainer'    // Trainer & sportliche Leitung
  | 'medical'    // Medizin, Physio, Athletik, Reha
  | 'scouting'   // Scouting, Analyse, Daten
  | 'media'      // Medien, Marketing, Fanbindung
  | 'admin';     // Verwaltung, Recht, Organisation

export const STAFF_GROUP_META: Record<StaffGroup, { label: string; icon: string }> = {
  trainer:  { label: 'Trainerteam & sportliche Leitung', icon: '🧑‍🏫' },
  medical:  { label: 'Medizin, Reha & Athletik',          icon: '⚕️' },
  scouting: { label: 'Scouting, Analyse & Daten',         icon: '🔍' },
  media:    { label: 'Medien, Marketing & Fanbindung',    icon: '📣' },
  admin:    { label: 'Verwaltung, Recht & Organisation',  icon: '🗂️' },
};

/** Eine anstellbare Personal-Rolle. */
export interface StaffRole {
  id: string;
  name: string;
  group: StaffGroup;
  /** Jahr, ab dem die Rolle anstellbar ist (Epoche). */
  unlockYear: number;
  /** Optional: ab diesem Jahr nicht mehr anstellbar (Datensatz). */
  obsoleteYear?: number;
  costClass: StaffCostClass;
  /** Menschlich lesbare Effektbeschreibung. */
  effect: string;
  // --- Effekt-Beiträge (werden aggregiert & gedeckelt) ---
  /** Beitrag zur Verletzungs-Reduktion (Anteil, z. B. 0.08). */
  injuryReduction?: number;
  /** Beitrag zur Reha-/Ausfall-Verkürzung (Anteil). */
  rehabReduction?: number;
  /** Beitrag zur täglichen Zusatz-Regeneration (Fitness-Punkte). */
  recovery?: number;
  /** Beitrag zur Scouting-Genauigkeit (Anteil). */
  scouting?: number;
  /** Beitrag zur Reichweite/Fanbindung (Anteil). */
  reach?: number;
  /** Rein atmosphärische Rolle (Kosten, kaum messbarer Direkteffekt). */
  flavor?: boolean;
}

/** Obergrenzen der aggregierten Effekte (Spielbalance). */
export const STAFF_CAPS = {
  injuryReduction: 0.20,
  rehabReduction: 0.25,
  recovery: 3,
  scouting: 0.15,
  reach: 0.20,
};

// -----------------------------------------------------------------------------
// Rollen-Katalog nach Epochen
// -----------------------------------------------------------------------------
export const STAFF_ROLES: StaffRole[] = [
  // ===== 1975 — Grundstab =====
  { id: 'cheftrainer', name: 'Cheftrainer', group: 'trainer', unlockYear: 1975, costClass: 'K5',
    effect: 'Leitet Training & Mannschaft (Grundstein des Trainerteams).', recovery: 0.5 },
  { id: 'cotrainer', name: 'Co-Trainer', group: 'trainer', unlockYear: 1975, costClass: 'K3',
    effect: 'Unterstützt Trainingsbetrieb und Spielvorbereitung.', recovery: 0.5 },
  { id: 'mannschaftsarzt', name: 'Mannschaftsarzt', group: 'medical', unlockYear: 1975, costClass: 'K4',
    effect: 'Senkt Verletzungsrisiko und beschleunigt die Genesung.', injuryReduction: 0.08, recovery: 0.5, rehabReduction: 0.06 },
  { id: 'masseur', name: 'Masseur / Physiotherapeut', group: 'medical', unlockYear: 1975, costClass: 'K2',
    effect: 'Fördert die Regeneration nach Belastung.', recovery: 0.7, rehabReduction: 0.05 },
  { id: 'zeugwart', name: 'Zeugwart', group: 'admin', unlockYear: 1975, costClass: 'K1',
    effect: 'Kümmert sich um Ausrüstung & Trikots (atmosphärisch).', flavor: true },
  { id: 'verwaltung', name: 'Verwaltung / Geschäftsstelle', group: 'admin', unlockYear: 1975, costClass: 'K2',
    effect: 'Hält den Vereinsbetrieb organisatorisch am Laufen.', flavor: true },
  { id: 'schatzmeister', name: 'Schatzmeister', group: 'admin', unlockYear: 1975, costClass: 'K2',
    effect: 'Überwacht Kasse und Haushalt des Vereins.', flavor: true },
  { id: 'jugendtrainer', name: 'Jugendtrainer', group: 'trainer', unlockYear: 1975, costClass: 'K2',
    effect: 'Betreut den Nachwuchs (unterstützt die Jugendarbeit).', flavor: true },
  { id: 'platzwart', name: 'Platzwart', group: 'admin', unlockYear: 1975, costClass: 'K1',
    effect: 'Pflegt Rasen und Anlage (atmosphärisch).', flavor: true },
  { id: 'torwarttrainer', name: 'Torwarttrainer', group: 'trainer', unlockYear: 1980, costClass: 'K2',
    effect: 'Spezialtraining für die Torhüter – sie entwickeln sich schneller.', recovery: 0.1 },
  { id: 'scout_1975', name: 'Scout', group: 'scouting', unlockYear: 1975, costClass: 'K2',
    effect: 'Beobachtet Talente – präzisiert die Potenzial-Einschätzung.', scouting: 0.05 },

  // ===== 1983 — beginnende Professionalisierung =====
  { id: 'sportl_leiter', name: 'Sportlicher Leiter', group: 'trainer', unlockYear: 1983, costClass: 'K4',
    effect: 'Bündelt die sportliche Planung über den Trainer hinaus.', recovery: 0.3 },
  { id: 'konditionstrainer', name: 'Konditionstrainer', group: 'medical', unlockYear: 1983, costClass: 'K3',
    effect: 'Verbessert Fitness-Aufbau und Belastungssteuerung.', recovery: 0.6 },
  { id: 'physio_haupt', name: 'Hauptamtlicher Physiotherapeut', group: 'medical', unlockYear: 1983, costClass: 'K3',
    effect: 'Feste Physio-Betreuung: schnellere Reha & Regeneration.', recovery: 0.5, rehabReduction: 0.06, injuryReduction: 0.04 },
  { id: 'pressesprecher', name: 'Pressesprecher', group: 'media', unlockYear: 1983, costClass: 'K2',
    effect: 'Steuert die Außendarstellung – etwas mehr Reichweite.', reach: 0.05 },
  { id: 'kaufm_leiter', name: 'Kaufmännischer Leiter', group: 'admin', unlockYear: 1983, costClass: 'K4',
    effect: 'Professionalisiert die kaufmännische Führung.', flavor: true },
  { id: 'gegnerbeobachter', name: 'Gegnerbeobachter', group: 'scouting', unlockYear: 1983, costClass: 'K2',
    effect: 'Analysiert Gegner & Talente – bessere Scouting-Genauigkeit.', scouting: 0.04 },

  // ===== 1993 — Kommerzialisierung =====
  { id: 'sportdirektor', name: 'Sportdirektor', group: 'trainer', unlockYear: 1993, costClass: 'K5',
    effect: 'Verantwortet Kaderstrategie & Transferpolitik.', recovery: 0.2 },
  { id: 'chefscout', name: 'Chefscout', group: 'scouting', unlockYear: 1993, costClass: 'K3',
    effect: 'Leitet das Scouting-Netzwerk – deutlich präzisere Einschätzung.', scouting: 0.06 },
  { id: 'intl_scout', name: 'Internationaler Scout', group: 'scouting', unlockYear: 1993, costClass: 'K3',
    effect: 'Beobachtet Talente im Ausland – bessere Scouting-Genauigkeit.', scouting: 0.05 },
  { id: 'marketingmanager', name: 'Marketing-/Sponsoringmanager', group: 'media', unlockYear: 1993, costClass: 'K4',
    effect: 'Erschließt Sponsoren & Fanmärkte – mehr Reichweite.', reach: 0.06 },
  { id: 'reha_trainer', name: 'Reha-Trainer', group: 'medical', unlockYear: 1993, costClass: 'K3',
    effect: 'Spezialisiert auf Wiederaufbau – verkürzt Ausfallzeiten spürbar.', rehabReduction: 0.10, recovery: 0.3 },
  { id: 'videoanalyst', name: 'Videoanalyst', group: 'scouting', unlockYear: 1993, costClass: 'K2',
    effect: 'Wertet Spielszenen aus – unterstützt Scouting & Analyse.', scouting: 0.03 },
  { id: 'vertragsmanager', name: 'Vertrags-/Rechtsmanager', group: 'admin', unlockYear: 1993, costClass: 'K3',
    effect: 'Betreut Verträge & rechtliche Fragen.', flavor: true },
  { id: 'eventmanager', name: 'Stadion-/Eventmanager', group: 'media', unlockYear: 1993, costClass: 'K3',
    effect: 'Organisiert Spieltag-Events – etwas mehr Reichweite.', reach: 0.04 },

  // ===== 2003 — moderne Strukturen =====
  { id: 'leistungsdiag', name: 'Leistungsdiagnostiker', group: 'medical', unlockYear: 2003, costClass: 'K3',
    effect: 'Misst Belastung & Leistung – gezieltere Regeneration.', recovery: 0.5, injuryReduction: 0.04 },
  { id: 'athletiktrainer', name: 'Athletiktrainer', group: 'medical', unlockYear: 2003, costClass: 'K3',
    effect: 'Baut Athletik auf und senkt das Verletzungsrisiko.', injuryReduction: 0.05, recovery: 0.4 },
  { id: 'sportpsychologe', name: 'Sportpsychologe', group: 'medical', unlockYear: 2003, costClass: 'K3',
    effect: 'Stärkt die mentale Verfassung der Mannschaft.', recovery: 0.2 },
  { id: 'ernaehrung', name: 'Ernährungsberater', group: 'medical', unlockYear: 2003, costClass: 'K2',
    effect: 'Optimiert Ernährung – bessere Regeneration.', recovery: 0.4, injuryReduction: 0.02 },
  { id: 'nachwuchskoord', name: 'Nachwuchskoordinator', group: 'scouting', unlockYear: 2003, costClass: 'K3',
    effect: 'Koordiniert die Talententwicklung – präziseres Scouting.', scouting: 0.04 },
  { id: 'spielanalyst', name: 'Spielanalyst', group: 'scouting', unlockYear: 2003, costClass: 'K3',
    effect: 'Systematische Spielanalyse – bessere Einschätzung.', scouting: 0.04 },
  { id: 'it_admin', name: 'IT-Administrator', group: 'admin', unlockYear: 2003, costClass: 'K2',
    effect: 'Betreut die technische Infrastruktur des Vereins.', flavor: true },
  { id: 'lizenzmanager', name: 'Lizenzmanager', group: 'admin', unlockYear: 2003, costClass: 'K3',
    effect: 'Sichert Lizenzauflagen der Liga.', flavor: true },

  // ===== 2013 — Datenzeitalter =====
  { id: 'datenanalyst', name: 'Datenanalyst', group: 'scouting', unlockYear: 2013, costClass: 'K3',
    effect: 'Datengestütztes Scouting – deutlich höhere Genauigkeit.', scouting: 0.06 },
  { id: 'dateningenieur', name: 'Dateningenieur', group: 'scouting', unlockYear: 2013, costClass: 'K3',
    effect: 'Baut Datenpipelines für Scouting & Analyse.', scouting: 0.03 },
  { id: 'socialmedia', name: 'Social-Media-Manager', group: 'media', unlockYear: 2013, costClass: 'K3',
    effect: 'Betreut die sozialen Kanäle – mehr Reichweite.', reach: 0.07 },
  { id: 'head_performance', name: 'Head of Performance', group: 'medical', unlockYear: 2013, costClass: 'K4',
    effect: 'Leitet den gesamten Leistungsbereich – weniger Verletzungen.', injuryReduction: 0.05, recovery: 0.4, rehabReduction: 0.04 },
  { id: 'sportwissenschaftler', name: 'Sportwissenschaftler', group: 'medical', unlockYear: 2013, costClass: 'K3',
    effect: 'Wissenschaftliche Trainingssteuerung.', recovery: 0.4, injuryReduction: 0.03 },
  { id: 'compliance', name: 'Compliance-/FFP-Manager', group: 'admin', unlockYear: 2013, costClass: 'K3',
    effect: 'Überwacht Financial Fair Play & Regelwerk.', flavor: true },
  { id: 'var_koord', name: 'VAR-Koordinator', group: 'admin', unlockYear: 2013, costClass: 'K2',
    effect: 'Schnittstelle zum Video-Assistenten (organisatorisch).', flavor: true },

  // ===== 2021 — KI & Nachhaltigkeit =====
  { id: 'head_data', name: 'Head of Data Analytics', group: 'scouting', unlockYear: 2021, costClass: 'K4',
    effect: 'Leitet die Datenabteilung – maximale Scouting-Präzision.', scouting: 0.06 },
  { id: 'ml_spezialist', name: 'ML-Spezialist', group: 'scouting', unlockYear: 2021, costClass: 'K4',
    effect: 'Modelliert Spieler-Potenziale mit Machine Learning.', scouting: 0.05 },
  { id: 'belastungsmanager', name: 'Belastungsmanager', group: 'medical', unlockYear: 2021, costClass: 'K3',
    effect: 'Steuert Belastung individuell – weniger Verletzungen.', injuryReduction: 0.05, recovery: 0.3 },
  { id: 'return_to_play', name: 'Return-to-Play-Manager', group: 'medical', unlockYear: 2021, costClass: 'K3',
    effect: 'Optimiert die Rückkehr nach Verletzungen – kürzere Ausfälle.', rehabReduction: 0.08, recovery: 0.2 },
  { id: 'fussballpsychologe', name: 'Fußballpsychologe', group: 'medical', unlockYear: 2021, costClass: 'K3',
    effect: 'Moderne Sportpsychologie für den Profibereich.', recovery: 0.2 },
  { id: 'nachhaltigkeit', name: 'Nachhaltigkeitsmanager', group: 'admin', unlockYear: 2021, costClass: 'K3',
    effect: 'Verantwortet Nachhaltigkeit & CSR des Vereins.', flavor: true },
  { id: 'crm_manager', name: 'Fan-Data/CRM-Manager', group: 'media', unlockYear: 2021, costClass: 'K3',
    effect: 'Datenbasierte Fanbindung – mehr Reichweite.', reach: 0.06 },
  { id: 'ki_scouting', name: 'KI-Scouting-Leiter', group: 'scouting', unlockYear: 2021, costClass: 'K4',
    effect: 'KI-gestützte Talentsuche – höchste Scouting-Genauigkeit.', scouting: 0.05 },
];

export const STAFF_BY_ID: Record<string, StaffRole> =
  Object.fromEntries(STAFF_ROLES.map((r) => [r.id, r]));

/** Alle in der Chronik verankerten Epochen-Jahre der Personal-Rollen. */
export const STAFF_EPOCHS = [1975, 1983, 1993, 2003, 2013, 2021];

/** Grundgehalt (DM/Monat) einer Rolle im Basisjahr 1975. */
export function staffBaseSalary(role: StaffRole): number {
  return STAFF_COST_BASE[role.costClass];
}

/** Monatsgehalt einer Rolle im gegebenen Wirtschafts-Jahr (skaliert). */
export function staffMonthlySalary(role: StaffRole, scale: number): number {
  return Math.round(staffBaseSalary(role) * scale);
}

/** Summe der Monatsgehälter aller angestellten Rollen (skaliert, DM/Monat). */
export function staffMonthlyTotal(hiredIds: string[], scale: number): number {
  return hiredIds.reduce((s, id) => {
    const r = STAFF_BY_ID[id];
    return r ? s + staffMonthlySalary(r, scale) : s;
  }, 0);
}

/** Aggregierte, gedeckelte Effekte aller angestellten Rollen. */
export interface StaffEffects {
  injuryReduction: number; // 0..0.20
  rehabReduction: number;  // 0..0.25
  recovery: number;        // 0..3 (Fitness/Tag)
  scouting: number;        // 0..0.15
  reach: number;           // 0..0.20
}

export function computeStaffEffects(hiredIds: string[]): StaffEffects {
  let injuryReduction = 0, rehabReduction = 0, recovery = 0, scouting = 0, reach = 0;
  for (const id of hiredIds) {
    const r = STAFF_BY_ID[id];
    if (!r) continue;
    injuryReduction += r.injuryReduction ?? 0;
    rehabReduction += r.rehabReduction ?? 0;
    recovery += r.recovery ?? 0;
    scouting += r.scouting ?? 0;
    reach += r.reach ?? 0;
  }
  return {
    injuryReduction: Math.min(STAFF_CAPS.injuryReduction, injuryReduction),
    rehabReduction: Math.min(STAFF_CAPS.rehabReduction, rehabReduction),
    recovery: Math.min(STAFF_CAPS.recovery, recovery),
    scouting: Math.min(STAFF_CAPS.scouting, scouting),
    reach: Math.min(STAFF_CAPS.reach, reach),
  };
}

/** Ob eine Rolle im gegebenen Jahr bereits anstellbar ist. */
export function staffAvailable(role: StaffRole, year: number): boolean {
  return year >= role.unlockYear && (!role.obsoleteYear || year < role.obsoleteYear);
}
