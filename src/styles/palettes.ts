/* ============================================================================
   Palettes — the list a picker offers. The colours themselves live in
   palettes.css (keyed by <html data-palette="id">); this is only their names.
   test/palettes.test.ts holds the two in step: every id here has a dark and a
   light block there (atlas excepted — it is the base, with no block), and every
   block there has an id here.
   ========================================================================== */

export const PALETTE_IDS = ["atlas", "ocean", "sand", "forest", "plum", "graphite"] as const;

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
  { id: "ocean", label: "Ocean", description: "Navy and steel grounds with a clear blue accent." },
  { id: "sand", label: "Sand", description: "Warm brown and tan grounds with a caramel accent." },
  { id: "forest", label: "Forest", description: "Deep green grounds with a moss accent." },
  { id: "plum", label: "Plum", description: "Aubergine grounds with an orchid accent." },
  { id: "graphite", label: "Graphite", description: "Near-black neutral, brighter text and firmer borders. Maximum contrast." },
];

/** Narrow an unknown value (a stored preference) to a palette id, else the default. */
export function toPaletteId(value: unknown): PaletteId {
  return typeof value === "string" && (PALETTE_IDS as readonly string[]).includes(value)
    ? (value as PaletteId)
    : DEFAULT_PALETTE;
}
