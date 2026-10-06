/* ============================================================================
   Palettes — the list a picker offers. The colours themselves live in
   palettes.css (keyed by <html data-palette="id">); this is only their names.
   test/palettes.test.ts holds the two in step: every id here has a dark and a
   light block there (atlas excepted — it is the base, with no block), and every
   block there has an id here.
   ========================================================================== */

export const PALETTE_IDS = [
  "atlas",
  "graphite",
  "nord",
  "gruvbox",
  "catppuccin",
  "tokyo-night",
  "dracula",
  "solarized",
  "rose-pine",
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

/** The palette an app renders when none is chosen: the base tokens, no override. */
export const DEFAULT_PALETTE: PaletteId = "atlas";

export interface PaletteInfo {
  id: PaletteId;
  /** Title Case name for a picker. */
  label: string;
  /** One line on its character. */
  description: string;
}

export const PALETTES: readonly PaletteInfo[] = [
  { id: "atlas", label: "Atlas", description: "Charcoal grounds with the house green." },
  { id: "graphite", label: "Graphite", description: "Near-black neutral, brighter text and firmer borders. Maximum contrast." },
  { id: "nord", label: "Nord", description: "Cool arctic blues and frost." },
  { id: "gruvbox", label: "Gruvbox", description: "Warm retro browns with orange and amber." },
  { id: "catppuccin", label: "Catppuccin", description: "Soft pastels on deep indigo, with a mauve accent." },
  { id: "tokyo-night", label: "Tokyo Night", description: "Neon city blues and magentas after dark." },
  { id: "dracula", label: "Dracula", description: "Vivid neon accents on a dark violet-grey." },
  { id: "solarized", label: "Solarized", description: "Precise teal and cream with balanced accents." },
  { id: "rose-pine", label: "Rosé Pine", description: "Muted rose, gold and pine. Soft and low-key." },
];

/** Ids that were once offered, mapped to the family closest in feel, so a
 *  stored choice keeps rendering something like what its owner picked. */
export const RETIRED_PALETTES: Readonly<Record<string, PaletteId>> = {
  ocean: "nord",
  sand: "gruvbox",
  forest: "gruvbox",
  plum: "dracula",
};

/** Narrow an unknown value (a stored preference) to a palette id: a known id
 *  as is, a retired id as its successor, anything else as the default. */
export function toPaletteId(value: unknown): PaletteId {
  if (typeof value !== "string") return DEFAULT_PALETTE;
  if ((PALETTE_IDS as readonly string[]).includes(value)) return value as PaletteId;
  return Object.prototype.hasOwnProperty.call(RETIRED_PALETTES, value) ? RETIRED_PALETTES[value] : DEFAULT_PALETTE;
}
