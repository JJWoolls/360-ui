/* ============================================================================
   formatMoney — the one way an amount of money becomes text
   ----------------------------------------------------------------------------
   Pure: no React, no CSS. It lives outside src/primitives so non-UI code
   (server routes, exports, PDF builders) can import it on its own through the
   "@360digilab/ui/format" entry without pulling a single component or
   stylesheet with it. The <Money> primitive renders whatever this returns, so
   the text in a table cell and the text in a CSV never disagree.

   WHY ONE FORMATTER: hand-rolled `"$" + n.toFixed(2)` drifts — no thousands
   separators, "$-5.00" instead of "-$5.00", a different empty mark per page.
   Every rule about how money reads is written here once.

   Rules:
     - Missing (null / undefined / "" / unparseable) is the empty mark, never
       "$0.00". Zero is a real value and prints as one.
     - A minus sign by default. Parentheses only when asked (`accounting`),
       because they read as a ledger convention, not as everyday UI.
     - Grouped thousands, fixed decimals, en-US — the locale is not a knob.
   ========================================================================== */

export interface MoneyFormatOptions {
  /** Fraction digits shown. Default 2 (compact: up to 1). */
  decimals?: number;
  /** Short form for tight spaces: $12.3K, $4.1M. */
  compact?: boolean;
  /** Always show the sign: +$5.00 / -$5.00 (zero stays unsigned). */
  signed?: boolean;
  /** ISO currency code, default "USD". `false` prints the grouped number with
   *  no symbol — for columns whose header already says the unit. */
  currency?: string | false;
  /** Negatives in parentheses — ($5.00) — instead of a minus sign. */
  accounting?: boolean;
  /** What a missing value prints as. Default an em dash. */
  empty?: string;
}

export type MoneyValue = number | string | null | undefined;

const EMPTY = "—";

/** Turn the input into a finite number, or null when there is nothing to show.
 *  Strings may carry a symbol, commas or spaces ("$1,234.50"). */
export function parseMoney(value: MoneyValue): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = value.trim().replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Intl.NumberFormat construction is the expensive part; build each shape once.
const cache = new Map<string, Intl.NumberFormat>();

function formatter(opts: MoneyFormatOptions, signed: boolean): Intl.NumberFormat {
  const currency = opts.currency === undefined ? "USD" : opts.currency;
  const compact = !!opts.compact;
  const max = opts.decimals ?? (compact ? 1 : 2);
  const min = compact ? 0 : max;
  const key = `${currency}|${compact}|${min}|${max}|${signed}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", {
      ...(currency ? { style: "currency", currency } : {}),
      ...(compact ? { notation: "compact" } : {}),
      minimumFractionDigits: min,
      maximumFractionDigits: max,
      signDisplay: signed ? "exceptZero" : "auto",
    });
    cache.set(key, f);
  }
  return f;
}

export function formatMoney(value: MoneyValue, opts: MoneyFormatOptions = {}): string {
  const n = parseMoney(value);
  if (n === null) return opts.empty ?? EMPTY;
  if (opts.accounting && n < 0) {
    // Format the magnitude and wrap it; the sign is the parentheses.
    return `(${formatter(opts, false).format(-n)})`;
  }
  return formatter(opts, !!opts.signed).format(n);
}
