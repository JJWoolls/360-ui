/* ============================================================================
   toCsv / downloadCsv — the one way rows become a CSV file
   ----------------------------------------------------------------------------
   Pure apart from downloadCsv's last step (it needs a browser). Lives with the
   formatters so server code and exports can import it through
   "@360digilab/ui/format" without pulling in a component or a stylesheet.

   The file is shaped for the program most people open a CSV in — a
   spreadsheet — not for the RFC alone:
     - UTF-8 with a byte-order mark. Without the BOM, Excel on Windows reads
       the file in the legacy code page and every accented name turns to
       mojibake.
     - CRLF between records (RFC 4180, and what Excel writes itself).
     - A cell is quoted only when it must be: it holds a comma, a double
       quote, CR or LF. Inside quotes a quote is doubled. Quoting every cell
       would also work, but it makes the file noisier to diff and read.
     - null / undefined are an empty cell, never the text "null".
     - Objects are written as JSON, booleans as true/false, Dates as ISO
       strings — one predictable shape per type rather than "[object Object]".

   What it does NOT do is defuse spreadsheet formulas (a cell starting with
   = + - @). Prefixing those changes the data — a negative number becomes
   text — so it is the caller's call, made with a column accessor, not a
   silent rule here.
   ========================================================================== */

export type CsvRow = Record<string, unknown>;

export type CsvColumn<T = CsvRow> =
  | { key: keyof T & string; header: string; accessor?: never }
  | { accessor: (row: T, index: number) => unknown; header: string; key?: never };

export const CSV_BOM = "﻿";
const CRLF = "\r\n";

/** One value as one CSV cell, quoted and escaped as needed. */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) s = Number.isNaN(value.getTime()) ? "" : value.toISOString();
  else if (typeof value === "object") s = JSON.stringify(value);
  else if (typeof value === "boolean") s = value ? "true" : "false";
  else s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * The whole file as a string: BOM, a header record, then one record per row,
 * CRLF between records and no trailing line break.
 */
export function toCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[]): string {
  const lines = [columns.map((c) => csvCell(c.header)).join(",")];
  rows.forEach((row, i) => {
    lines.push(
      columns
        .map((c) =>
          csvCell(c.accessor ? c.accessor(row, i) : (row as Record<string, unknown>)[c.key as string]),
        )
        .join(","),
    );
  });
  return CSV_BOM + lines.join(CRLF);
}

/**
 * Build the CSV and hand it to the browser as a download. ".csv" is added to
 * the filename if missing. Browser only — it throws on a server.
 */
export function downloadCsv<T>(
  filename: string,
  rows: readonly T[],
  columns: readonly CsvColumn<T>[],
): void {
  if (typeof document === "undefined") {
    throw new Error("downloadCsv runs in the browser only; use toCsv on the server.");
  }
  const name = /\.csv$/i.test(filename) ? filename : `${filename}.csv`;
  const blob = new Blob([toCsv(rows, columns)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick: some browsers start the download asynchronously
  // and a synchronous revoke can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
