// toCsv / csvCell — escaping and file shape.
import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv, csvCell, CSV_BOM } from "../src/format/csv.ts";

test("plain values are not quoted", () => {
  assert.equal(csvCell("abc"), "abc");
  assert.equal(csvCell(42), "42");
  assert.equal(csvCell(-1.5), "-1.5");
  assert.equal(csvCell("it's fine"), "it's fine");
});

test("null and undefined are empty cells", () => {
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
});

test("a comma forces quotes", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
});

test("quotes are doubled and force quotes", () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('"'), '""""');
});

test("LF, CR and CRLF force quotes and are kept verbatim", () => {
  assert.equal(csvCell("a\nb"), '"a\nb"');
  assert.equal(csvCell("a\rb"), '"a\rb"');
  assert.equal(csvCell("a\r\nb"), '"a\r\nb"');
});

test("booleans, objects and dates have one shape each", () => {
  assert.equal(csvCell(true), "true");
  assert.equal(csvCell(false), "false");
  assert.equal(csvCell({ a: 1, b: "x" }), '"{""a"":1,""b"":""x""}"');
  assert.equal(csvCell([1, 2]), '"[1,2]"');
  assert.equal(csvCell(new Date(Date.UTC(2026, 9, 1))), "2026-10-01T00:00:00.000Z");
  assert.equal(csvCell(new Date(NaN)), "");
});

test("toCsv: BOM, header, CRLF between records, no trailing newline", () => {
  const rows = [
    { name: "Plain", n: 1 },
    { name: "Comma, Inc", n: 2 },
    { name: 'Quote "Q"', n: null },
    { name: "Two\nLines", n: 0 },
  ];
  const out = toCsv(rows, [
    { key: "name", header: "Name" },
    { key: "n", header: "Count, Total" },
  ]);
  assert.ok(out.startsWith(CSV_BOM));
  assert.equal(CSV_BOM, "﻿");
  assert.equal(
    out,
    CSV_BOM +
      'Name,"Count, Total"\r\n' +
      "Plain,1\r\n" +
      '"Comma, Inc",2\r\n' +
      '"Quote ""Q""",\r\n' +
      '"Two\nLines",0',
  );
  assert.ok(!out.endsWith("\r\n"));
});

test("toCsv: accessors get the row and its index", () => {
  const out = toCsv([{ a: 2 }, { a: 3 }], [
    { accessor: (_r, i) => i + 1, header: "#" },
    { accessor: (r) => r.a * 10, header: "Ten A" },
  ]);
  assert.equal(out, CSV_BOM + "#,Ten A\r\n1,20\r\n2,30");
});

test("toCsv: no rows is just the header", () => {
  assert.equal(toCsv([], [{ key: "x", header: "X" }]), CSV_BOM + "X");
});
