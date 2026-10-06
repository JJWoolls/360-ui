/* ============================================================================
   @360digilab/ui — the house kit
   ----------------------------------------------------------------------------
   ONE home for the parts both apps are built from. The 360 Workspace app and
   the LMS import from here; neither keeps its own copy. Change a part once and
   both apps get it on their next update.

   Two imports in a consuming app:

     import "@360digilab/ui/tokens.css";          // once, at the app root
     import { Button, Badge } from "@360digilab/ui";

   The tokens file is the paint, the primitives are the parts. An app that wants
   to look different overrides token VALUES; it never forks a component.
   ========================================================================== */

export * from "./primitives";

// Palettes — the names a picker offers; the colours are in palettes.css.
export { PALETTES, PALETTE_IDS, DEFAULT_PALETTE, RETIRED_PALETTES, toPaletteId } from "./styles/palettes";
export type { PaletteId, PaletteInfo } from "./styles/palettes";

// Hooks that are not parts but carry a house rule. useAsyncData is the one way
// a screen loads its data: loading, error and race-safety written once.
export { useAsyncData } from "./hooks/useAsyncData";
export type { AsyncData, AsyncDataOptions } from "./hooks/useAsyncData";
// useSaveState is the one way a screen runs a write: in-flight flag, no double
// submit, a short "saved", and a failure that is always surfaced.
export { useSaveState } from "./hooks/useSaveState";
export type { SaveState, SaveStateOptions } from "./hooks/useSaveState";
// useKeyedSaveState is the same contract per key (row id): writes on different
// rows run together; a second write on the same row is ignored.
export { useKeyedSaveState } from "./hooks/useKeyedSaveState";
export type { KeyedSaveState, KeyedSaveStateOptions } from "./hooks/useKeyedSaveState";
// useDebouncedValue is the one debounce for search-as-you-type: one timer,
// cleared on every change and on unmount.
export { useDebouncedValue } from "./hooks/useDebouncedValue";

// formatMoney is the one money formatter: USD, grouped, an em dash for nothing.
// Pure — also reachable as "@360digilab/ui/format" for code that must not pull
// in components or CSS (server routes, exports, PDF builders).
export { formatMoney, parseMoney } from "./format/money";
export type { MoneyFormatOptions, MoneyValue } from "./format/money";

// toCsv / downloadCsv — the one CSV writer: BOM, CRLF, quote only when needed.
// Pure like formatMoney, and on "@360digilab/ui/format" for the same reason.
export { toCsv, downloadCsv, csvCell, CSV_BOM } from "./format/csv";
export type { CsvColumn, CsvRow } from "./format/csv";
