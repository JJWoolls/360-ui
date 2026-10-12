/**
 * ChipGroup selection arithmetic — pure, so it can be tested without React.
 *
 * Multi: a press adds or removes that value; the result follows the order of
 * the options, so the caller gets a stable list whatever the click order was.
 * Single: a press selects that value; pressing the selected one clears it
 * (null), unless `required` — then the row always keeps one choice.
 */

export function nextMultiValue<T>(options: readonly T[], current: readonly T[], pressed: T): T[] {
  const on = new Set<T>(current);
  if (on.has(pressed)) on.delete(pressed);
  else on.add(pressed);
  const ordered = options.filter((v) => on.has(v));
  // Keep values the caller holds that are not (or no longer) shown as options.
  for (const v of current) if (on.has(v) && !options.includes(v)) ordered.push(v);
  return ordered;
}

export function nextSingleValue<T>(current: T | null, pressed: T, required = false): T | null {
  if (current === pressed) return required ? current : null;
  return pressed;
}
