// Gemeinsamer Ablauf „Neues Spiel“ für die Oberflächentests (Assistent in drei Schritten).
//   startNewGame(page, { name, clubIndex, league, speed, shots, keepBriefing })
export async function startNewGame(page, opts = {}) {
  const { name = 'Test', clubIndex = 0, league, speed = '300', shots } = opts;
  await page.click('text=Neues Spiel');
  await page.waitForSelector('.ng-root');
  // 1) Spielwelt: Tempo
  await page.locator('.ng-speed input[type=range]').fill(speed);
  if (shots) await shots('1_spielwelt');
  await page.click('.ng-foot button:has-text("Weiter")');
  // 2) Liga & Verein
  if (league) await page.click(`.ng-tree-item:has-text("${league}")`);
  await page.click(`.ng-club >> nth=${clubIndex}`);
  if (shots) await shots('2_verein');
  await page.click('.ng-foot button:has-text("Weiter")');
  // 3) Manager & Start
  await page.fill('.ng-form input[placeholder*="Mustermann"]', name);
  if (shots) await shots('3_manager');
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
