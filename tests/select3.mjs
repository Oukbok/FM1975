// Helfer für Oberflächentests: eigene Auswahlliste ui/Select.tsx (ersetzt page.selectOption).
//   await pickOption(page, locator, 'wert')           – nach Wert (data-value)
//   await pickOption(page, locator, { label: 'Text' }) – nach sichtbarem Text (beginnt mit)
//   await pickOption(page, locator, { index: 2 })      – n-ter Eintrag
//   await optionsOf(page, locator)                     – [{ value, label, disabled }]
// `locator` zeigt auf den Knopf `.sel3` (z. B. page.locator('.cmp-select .sel3').first()).

const pop = (page) => page.locator('.sel3-pop').last();

async function openList(page, loc) {
  if (!(await page.locator('.sel3-pop').count())) await loc.click();
  await pop(page).waitFor({ state: 'visible', timeout: 3000 });
}

export async function pickOption(page, loc, want) {
  await openList(page, loc);
  const opts = pop(page).locator('[role=option]');
  let target;
  if (typeof want === 'string' || typeof want === 'number') target = pop(page).locator(`[role=option][data-value="${String(want)}"]`);
  else if (want && typeof want.index === 'number') target = opts.nth(want.index);
  else if (want && want.label != null) target = opts.filter({ hasText: want.label }).first();
  else if (want && want.value != null) target = pop(page).locator(`[role=option][data-value="${String(want.value)}"]`);
  if (!target || !(await target.count())) {
    await page.keyboard.press('Escape');
    throw new Error(`Auswahl: Eintrag ${JSON.stringify(want)} nicht gefunden`);
  }
  await target.first().click();
  await page.waitForTimeout(80);
}

export async function optionsOf(page, loc) {
  await openList(page, loc);
  const list = await pop(page).locator('[role=option]').evaluateAll((els) => els.map((e) => ({
    value: e.getAttribute('data-value'), label: e.textContent.trim(), disabled: e.getAttribute('aria-disabled') === 'true',
  })));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(60);
  return list;
}

/** Wert des Knopfs (data-value). */
export const valueOf = (loc) => loc.getAttribute('data-value');
