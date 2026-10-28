// Gemeinsamer Ablauf „Neues Spiel“ für die Oberflächentests (Assistent in drei Schritten).
//   startNewGame(page, { name, clubIndex, league, speed, shots })
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
}
