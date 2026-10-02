/**
 * Which section tab is the current page — pure path arithmetic, kept apart
 * from the component so it can be tested without a DOM and reused by a caller
 * that needs the answer for something else (a document title, a breadcrumb).
 *
 * "exact"  — the tab is active only on its own path. For a section's landing
 *            page whose href is also the parent of every sibling tab.
 * "prefix" — the tab is active on its own path and anything beneath it, so a
 *            record opened from a list keeps its list's tab lit. Matching is
 *            by whole path segment: "/reports" does not light up on
 *            "/reports-archive".
 *
 * When several tabs match, the longest href wins — the most specific section
 * is the one the reader is in. A path no tab claims leaves every tab unlit;
 * the strip never guesses.
 */

export type SectionTabMatch = "exact" | "prefix";

export interface SectionTabTarget {
  href: string;
  match?: SectionTabMatch;
}

// "/a/b/" and "/a/b" are the same page; the root stays "/".
function normalise(path: string): string {
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function sectionTabMatches(
  href: string,
  pathname: string,
  match: SectionTabMatch = "prefix",
): boolean {
  const h = normalise(href);
  const p = normalise(pathname);
  if (p === h) return true;
  if (match === "exact") return false;
  return p.startsWith(h === "/" ? "/" : `${h}/`);
}

/** The href of the active tab for `pathname`, or undefined when none matches. */
export function activeSectionHref(
  items: readonly SectionTabTarget[],
  pathname: string,
): string | undefined {
  let best: string | undefined;
  for (const item of items) {
    if (!sectionTabMatches(item.href, pathname, item.match)) continue;
    if (best === undefined || normalise(item.href).length > normalise(best).length) {
      best = item.href;
    }
  }
  return best;
}
