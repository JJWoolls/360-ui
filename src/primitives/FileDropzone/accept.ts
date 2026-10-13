/**
 * Does a file match an `accept` string — pure, kept apart from the component so
 * it can be tested without a DOM.
 *
 * The same grammar as the native <input accept>, because the dropzone hands
 * that string to its input as well and the two must agree:
 *
 *   ".pdf"             an extension, case-insensitive
 *   "image/*"          a MIME family
 *   "application/pdf"  an exact MIME type
 *
 * WHY THE DROPZONE FILTERS AT ALL. The browser applies `accept` to nothing it
 * does not have to: a drag-and-drop delivers whatever was dragged, and the file
 * picker treats it as a suggestion the user can switch off ("All files"). So
 * the filter runs on every path in, and a file it rejects never reaches the
 * caller.
 *
 * A file with no MIME type (common for less usual extensions) can still match
 * by extension, never by a MIME rule. An empty or missing `accept` takes all.
 */

export interface FileLike {
  name: string;
  type: string;
}

export function parseAccept(accept: string | undefined): string[] {
  if (!accept) return [];
  return accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

export function fileMatchesAccept(file: FileLike, accept: string | undefined): boolean {
  const rules = parseAccept(accept);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (!type) return false;
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/**
 * The files the caller should receive: those `accept` allows, and only the
 * first of them when the zone is single-file.
 */
export function acceptFiles<T extends FileLike>(
  files: readonly T[],
  accept: string | undefined,
  multiple: boolean,
): T[] {
  const kept = files.filter((f) => fileMatchesAccept(f, accept));
  return multiple ? kept : kept.slice(0, 1);
}
