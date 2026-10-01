/* ============================================================================
   "@360digilab/ui/format" — the pure formatters
   ----------------------------------------------------------------------------
   No React, no CSS, nothing that touches the DOM on import. This is the entry
   for code that must not pull a component in with it: server routes, export
   builders, PDF code. Everything here is also exported from the package root.
   ========================================================================== */

export { formatMoney, parseMoney } from "./money";
export type { MoneyFormatOptions, MoneyValue } from "./money";

export { toCsv, downloadCsv, csvCell, CSV_BOM } from "./csv";
export type { CsvColumn, CsvRow } from "./csv";

export { getPresetRange, defaultPresets, allTimePreset } from "../primitives/DateRangeFilter/presets";
export type {
  DateRange,
  DateRangePreset,
  DateRangePresetKey,
  PresetRangeOptions,
} from "../primitives/DateRangeFilter/presets";
