import { formatMoney, parseMoney } from "../../format/money";
import type { MoneyFormatOptions, MoneyValue } from "../../format/money";
import "./Money.css";

/**
 * Money — an amount of money on screen. The text is exactly formatMoney's;
 * this adds the look: tabular figures so a column of amounts lines up digit
 * for digit, no wrapping inside an amount, and negatives in the danger tone.
 *
 * NEGATIVE = DANGER TONE + MINUS SIGN. The colour is the at-a-glance signal;
 * the minus keeps it readable without colour. Parentheses only with
 * `accounting`, for screens that mirror a ledger or statement.
 *
 * `tone="muted"` dims the value — for zero rows and other amounts that should
 * recede, so the real figures in a column stand out. Muted wins over the
 * negative colour: a dimmed row is saying "ignore me".
 *
 * Inside a Table, mark the column `numeric`: the cell right-aligns and this
 * component brings its own tabular figures, so totals in a column `footer`
 * line up with the rows above them.
 */

export type MoneyTone = "default" | "muted";

export interface MoneyProps extends MoneyFormatOptions {
  /** The amount. number, numeric string, or nothing (renders the empty mark). */
  value: MoneyValue;
  /** "muted" dims the value — typically for zero amounts. */
  tone?: MoneyTone;
  /** Extra class on the span, for size or weight (e.g. a bold total). */
  className?: string;
}

export function Money({ value, tone = "default", className, ...opts }: MoneyProps) {
  const n = parseMoney(value);
  return (
    <span
      className={className ? `ui-money ${className}` : "ui-money"}
      data-negative={n !== null && n < 0 ? "" : undefined}
      data-empty={n === null ? "" : undefined}
      data-tone={tone === "muted" ? "muted" : undefined}
    >
      {formatMoney(value, opts)}
    </span>
  );
}
