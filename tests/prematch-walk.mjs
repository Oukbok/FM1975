// Fensterkette bis zur Vorschau „Nächstes Spiel“ (`.pm-root`) abarbeiten – genutzt von
// tests/match-ui.mjs und tests/report-shots.mjs.
import { skipIntro } from './newgame-flow.mjs';
import { openWindows } from './popup-probe.mjs';

/**
 * Fensterkette bis zur Vorschau „Nächstes Spiel“ (`.pm-root`) abarbeiten – wie tests/season-walk.mjs:
 * jedes Fenster mit dem kleinsten nötigen Klick schließen, sonst „Weiter“ in der Kopfleiste und warten,
 * bis die Zeit wieder steht. Rückgabe: Protokoll der gesehenen Fenster; Abbruch nach `maxSec`.
 */
export async function walkToPrematch(page, label, maxSec = 150, abort = async (m) => { throw new Error(m); }) {
  const visible = (sel) => page.locator(sel).first().isVisible().catch(() => false);
  const tryClick = async (sel, timeout = 2000) => page.locator(sel).first().click({ timeout }).then(() => true).catch(() => false);
  const t = Date.now();
  const seen = [];
  const saw = (k) => { if (seen[seen.length - 1] !== k) seen.push(k); };
  let idle = 0;
  while (Date.now() - t < maxSec * 1000) {
    if (await visible('.pm-root')) { console.log(`${label}: Vorschau nach ${Math.round((Date.now() - t) / 1000)} s (${seen.join(' → ') || 'ohne Fenster'})`); return seen; }
    if (await visible('.si-stage')) { saw('Briefing-Auftakt'); await skipIntro(page); continue; }
    if (await visible('.bf-modal')) { saw('Briefing'); await tryClick('.bf-modal .bf-continue'); await page.waitForTimeout(300); continue; }
    if (await visible('.bud-modal')) { saw('Budget'); await tryClick('.bud-modal .bud-confirm'); await page.waitForTimeout(300); continue; }
    if (await visible('.ft-modal')) { saw('Erstes Training'); await tryClick('.ft-modal button:has-text("Ohne Versprechen")'); await page.waitForTimeout(300); continue; }
    if (await visible('.dr-root')) {
      // Auslosung (Gala): Esc springt ans Ende, „Weiter“ schließt.
      saw('Auslosung');
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      if (await visible('.dr-root')) { if (!(await tryClick('.dr-root .dg-go:has-text("Weiter")'))) await page.keyboard.press('Escape'); }
      await page.waitForTimeout(300); continue;
    }
    if (await visible('.rb2-overlay')) {
      saw('Bewertungsrunde');
      const ok = page.locator('.rb2-overlay .rb2-ok').first();
      if ((await ok.innerText().catch(() => '')).trim() === 'OK') await ok.click().catch(() => {});
      else if (!(await tryClick('.rb2-overlay button:has-text("Bis zum Ende")'))) await ok.click().catch(() => {});
      await page.waitForTimeout(400); continue;
    }
    if (await visible('.gb-root')) {
      saw('Goldener Stern');
      if (!(await tryClick('.gb-root footer button:has-text("Überspringen")', 1000))) await tryClick('.gb-root .btn-primary');
      await page.waitForTimeout(400); continue;
    }
    if (await visible('.ix-root')) {
      saw('Hallenturnier');
      if (!(await tryClick('.ix-root .ix-btn:has-text("Schließen")', 1000))) await tryClick('.ix-root .ix-btn:has-text("Alles simulieren"):not([disabled])', 1000);
      await page.waitForTimeout(600); continue;
    }
    if (await visible('.aw-modal')) { saw('Die Besten der Saison'); await tryClick('.aw-modal .aw-foot .btn-primary'); await page.waitForTimeout(300); continue; }
    if (await visible('.tw-panel')) { saw('Transferbilanz'); await tryClick('.tw-foot button:has-text("Schließen")'); await page.waitForTimeout(300); continue; }
    if (await visible('.cr-root')) { saw('Trainingslager-Bilanz'); await page.locator('.cr-root').click({ position: { x: 20, y: 20 } }).catch(() => {}); await page.waitForTimeout(400); continue; }
    if (await visible('.mr-modal')) { saw('Spielbericht'); await tryClick('.mr-modal .modal-close'); await page.waitForTimeout(300); continue; }
    if (await visible('.reveal-overlay')) {
      saw('Bewertung (Liste)');
      await tryClick('.reveal-overlay button:has-text("Überspringen"), .reveal-overlay button:has-text("Alle")', 1000);
      if (!(await tryClick('.reveal-overlay .reveal-close, .reveal-overlay button:has-text("Weiter"), .reveal-overlay button:has-text("Schließen")', 1000))) await tryClick('.reveal-overlay button >> nth=-1', 1000);
      await page.waitForTimeout(300); continue;
    }
    if (await visible('.modal-overlay')) { saw('Fenster ' + (await openWindows(page)).join(', ')); await page.keyboard.press('Escape'); await page.waitForTimeout(300); continue; }

    // Kein Fenster offen: Kopfleiste
    if (await visible('.hd-continue.pm-next')) { saw('Vorschau wieder öffnen'); await tryClick('.hd-continue.pm-next'); await page.waitForTimeout(400); continue; }
    if (await visible('.hd-continue.mail')) {
      // offene Entscheidung sperrt „Weiter“: roter Brief wählt sie an, erste Antwort wählen
      saw('Entscheidung');
      await tryClick('.hd-continue.mail'); await page.waitForTimeout(400);
      if (!(await tryClick('.dz-read .ev-choice', 1500))) { idle++; if (idle > 5) await abort(`${label}: offene Entscheidung nicht auffindbar`); }
      continue;
    }
    const before = await page.locator('.tn-date, .tn-right, .topnav-date').first().textContent().catch(() => '');
    if (!(await tryClick('.hd-continue:not(.running)'))) { idle++; if (idle > 5) await abort(`${label}: Knopf „Weiter“ nicht klickbar`); continue; }
    // Zeitlauf: warten, bis er anhält (Fenster/Vorschau/Pause), höchstens 30 s
    for (let k = 0; k < 120 && (await page.locator('.hd-continue.running').count()); k++) await page.waitForTimeout(250);
    const after = await page.locator('.tn-date, .tn-right, .topnav-date').first().textContent().catch(() => '');
    if (after === before && !(await openWindows(page)).length) { idle++; if (idle > 5) await abort(`${label}: „Weiter“ ohne Fortschritt (${after})`); }
    else idle = 0;
  }
  await abort(`${label}: keine Vorschau „Nächstes Spiel“ nach ${maxSec} s (${seen.join(' → ')})`);
}

