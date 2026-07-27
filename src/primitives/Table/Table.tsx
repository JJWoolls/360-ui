import type { ReactNode } from "react";
import "./Table.css";

/**
 * Table — fixed layout, explicit widths, tabular numerals.
 *
 * NO SORT ARROWS. House rule: the active sort column is marked by COLOR, and
 * only by color. Do not add a caret "for clarity" — Josh has ruled on this and
 * the ruling is the whole reason this component exists instead of a <table>
 * per screen. `aria-sort` still carries the direction to screen readers, which
 * is where that information belongs; it costs no pixels and tells the truth.
 *
 * WIDTH IS REQUIRED, not optional-with-a-default. `table-layout: fixed` means
 * the browser sizes columns from the first row and never re-measures — that is
 * what stops the layout from lurching as data loads, and it is only true if
 * the widths are declared. Exactly one column should usually take "auto" (the
 * one that absorbs slack — the title). Making the prop required forces that to
 * be a decision instead of an accident.
 *
 * The overflow-x wrapper is not optional either: fixed columns do not reflow,
 * so on a narrow window the table must scroll rather than crush its content.
 */

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  /**
   * Explicit CSS width — "96px", or "auto" for the one column that absorbs
   * slack. Required on purpose; see above.
   */
  width: string;
  /** Right-aligns the cell. For money and counts, where the digits should rail. */
  align?: "left" | "right";
  /** Tabular numerals. Set it on anything where digits should line up. */
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Stable identity. Never the array index — it breaks on sort, which is the
      one thing this table is for. */
  rowKey: (row: T) => string | number;
  /** `key` of the column currently sorted. Marked by color alone. */
  sortKey?: string;
  /** Direction — announced via aria-sort, never drawn. */
  sortDir?: "asc" | "desc";
  /** Omit to render plain, unsortable headers. */
  onSort?: (key: string) => void;
  /** Screen-reader name for the table. Say what these rows ARE. */
  caption?: string;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDir = "asc",
  onSort,
  caption,
}: TableProps<T>) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        {caption && <caption className="ui-table-caption">{caption}</caption>}
        <colgroup>
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = c.key === sortKey;
              return (
                <th
                  key={c.key}
                  data-active={active || undefined}
                  data-align={c.align}
                  aria-sort={
                    active
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {onSort ? (
                    <button
                      type="button"
                      className="ui-table-sort"
                      onClick={() => onSort(c.key)}
                    >
                      {c.header}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  data-align={c.align}
                  data-numeric={c.numeric || undefined}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
