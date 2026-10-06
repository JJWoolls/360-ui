/**
 * MultiSelect — the pure rules, kept apart from React so they can be tested
 * on their own (node --test) and read in one place.
 *
 * THE PRIMARY RULE. When a MultiSelect offers a "primary" (the starred item),
 * the primary is always one of the selected values, or nothing when nothing is
 * selected. It is never left pointing at a value that was just removed — a
 * primary outside the selection is exactly the drift the star exists to stop.
 * So: the first value picked becomes primary; removing the primary hands it to
 * the first value still selected; starring an unselected value selects it.
 */

export interface MultiSelectState {
  values: string[];
  primary: string | null;
}

/** Keep `primary` inside `values`: the current one if still there, else the first. */
export function settlePrimary(values: readonly string[], primary: string | null): string | null {
  if (values.length === 0) return null;
  if (primary != null && values.includes(primary)) return primary;
  return values[0];
}

/** Add or remove one value. New values go on the end, in the order picked. */
export function toggleValue(state: MultiSelectState, value: string): MultiSelectState {
  const has = state.values.includes(value);
  const values = has ? state.values.filter((v) => v !== value) : [...state.values, value];
  return { values, primary: settlePrimary(values, state.primary) };
}

/** Star one value: it is selected if it was not, and becomes the primary. */
export function makePrimary(state: MultiSelectState, value: string): MultiSelectState {
  const values = state.values.includes(value) ? [...state.values] : [...state.values, value];
  return { values, primary: value };
}

/**
 * What the closed trigger shows: the first `max` chosen labels as chips and a
 * "+N" for the rest. The primary is always shown first, so the one that
 * matters most is never the one hidden behind the count.
 */
export function chipSummary<T extends { value: string }>(
  selected: readonly T[],
  primary: string | null,
  max: number,
): { shown: T[]; more: number } {
  const ordered =
    primary == null
      ? [...selected]
      : [...selected.filter((s) => s.value === primary), ...selected.filter((s) => s.value !== primary)];
  const cap = Math.max(0, Math.floor(max));
  return { shown: ordered.slice(0, cap), more: Math.max(0, ordered.length - cap) };
}

/**
 * Filter by every word typed, anywhere in label + sublabel + searchText, then
 * rank: exact label, starts with, contains, the rest — stable within a tier.
 * The same rule the single Select uses, so the two search alike.
 */
export function rankByQuery<T extends { label: string; sublabel?: string; searchText?: string }>(
  options: readonly T[],
  query: string,
): T[] {
  const q = query.toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...options];
  const matched = options.filter((o) => {
    const text = `${o.label} ${o.sublabel ?? ""} ${o.searchText ?? ""}`.toLowerCase();
    return terms.every((t) => text.includes(t));
  });
  const rank = (label: string) => (label === q ? 0 : label.startsWith(q) ? 1 : label.includes(q) ? 2 : 3);
  return matched
    .map((o, i) => ({ o, i, r: rank(o.label.toLowerCase()) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.o);
}

/** The trigger's spoken value: "Monroe (primary), Ann Arbor" or the placeholder. */
export function spokenValue(
  labels: readonly { value: string; label: string }[],
  primary: string | null,
  placeholder: string,
): string {
  if (labels.length === 0) return placeholder;
  return labels.map((l) => (l.value === primary ? `${l.label} (primary)` : l.label)).join(", ");
}
