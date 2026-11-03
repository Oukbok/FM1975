// Gemeinsamer Ablauf „Neues Spiel“ für die Oberflächentests (Assistent in sechs Schritten:
// Manager · Spielmodus · Spielwelt · Verein · Ligensystem · Willkommen).
//   startNewGame(page, { name, clubIndex, league, speed, shots, keepBriefing, career })
export async function startNewGame(page, opts = {}) {
  const { name = 'Test', clubIndex = 0, league, speed = '300', shots, career = false } = opts;
  const next = () => page.click('.ng-foot button:has-text("Weiter")');
  const shot = async (n) => { if (!shots) return; await page.waitForTimeout(450); await shots(n); };
  await page.click('text=Neues Spiel');
  await page.waitForSelector('.ng-root');
  // 1) Manager: Vor- und Nachname
  await page.fill('.ng-field input[placeholder*="Max"]', name);
  await page.fill('.ng-field input[placeholder*="Mustermann"]', 'Tester');
  await shot('1_manager');
  await next();
  // 2) Spielmodus: Tempo (+ optional Karriere)
  await page.waitForSelector('.ng-modes');
  if (career) await page.click('.ng-modecard:has-text("Karriere")');
  await page.locator('.ng-speed input[type=range]').fill(speed);
  await shot('2_spielmodus');
  await next();
  // 3) Spielwelt
  await page.waitForSelector('.ng-ctable');
  await shot('3_spielwelt');
  await next();
  // 4) Verein
  if (career) {
    await page.click(`.ng-offer >> nth=${clubIndex}`);
  } else {
    if (league) await page.click(`.ng-league:has-text("${league}")`);
    await page.click(`.ng-club >> nth=${clubIndex}`);
  }
  await shot('4_verein');
  await next();
  // 5) Ligensystem
  await page.waitForSelector('.lp-levels');
  await shot('5_ligensystem');
  await next();
  // 6) Willkommen: warten, bis die Spielwelt steht
  await page.waitForSelector('.ng-welcome-hero', { timeout: 20000 });
  await page.waitForTimeout(450);
  await shot('6_willkommen');
  await page.click('.ng-foot button:has-text("Karriere starten")');
  // Saison-Briefing (öffnet automatisch zu Spielbeginn) schließen – ausser es soll offen bleiben.
  if (!opts.keepBriefing) await closeBriefing(page);
}

/** Überspringt die Auftakt-Animation des Saison-Briefings (Esc), falls sie läuft. */
export async function skipIntro(page) {
  const stage = page.locator('.si-stage');
  try { await stage.waitFor({ state: 'visible', timeout: 2500 }); } catch { return false; }
  await page.keyboard.press('Escape');
  await stage.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  return true;
}

/** Schließt das Saison-Briefing-Fenster (inkl. Auftakt-Animation), falls es offen ist. */
export async function closeBriefing(page) {
  await skipIntro(page);
  const btn = page.locator('.bf-modal .bf-continue');
  try { await btn.waitFor({ state: 'visible', timeout: 4000 }); } catch { return false; }
  await btn.click();
  await page.locator('.bf-modal').waitFor({ state: 'detached', timeout: 4000 }).catch(() => {});
  return true;
}
