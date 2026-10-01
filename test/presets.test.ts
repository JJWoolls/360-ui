// getPresetRange — pure date arithmetic. Every case pins `now` to a local
// noon so the result can never depend on the machine's time zone or the hour
// the suite runs.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPresetRange,
  defaultPresets,
  allTimePreset,
  resolvePreset,
  shownPresetKey,
  presetChange,
} from "../src/primitives/DateRangeFilter/presets.ts";

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

// Thursday 2026-10-01: first day of a month and of Q4.
const THU = at(2026, 10, 1);

test("today / yesterday", () => {
  assert.deepEqual(getPresetRange("today", THU), { from: "2026-10-01", to: "2026-10-01" });
  assert.deepEqual(getPresetRange("yesterday", THU), { from: "2026-09-30", to: "2026-09-30" });
});

test("yesterday crosses a year boundary", () => {
  assert.deepEqual(getPresetRange("yesterday", at(2026, 1, 1)), { from: "2025-12-31", to: "2025-12-31" });
});

test("weeks start on Monday by default and are whole weeks", () => {
  assert.deepEqual(getPresetRange("this_week", THU), { from: "2026-09-28", to: "2026-10-04" });
  assert.deepEqual(getPresetRange("last_week", THU), { from: "2026-09-21", to: "2026-09-27" });
});

test("a Sunday belongs to the week that started the Monday before", () => {
  assert.deepEqual(getPresetRange("this_week", at(2026, 10, 4)), { from: "2026-09-28", to: "2026-10-04" });
});

test("a Monday starts its own week", () => {
  assert.deepEqual(getPresetRange("this_week", at(2026, 9, 28)), { from: "2026-09-28", to: "2026-10-04" });
});

test("weekStartsOn: 0 gives a Sunday week", () => {
  assert.deepEqual(getPresetRange("this_week", THU, { weekStartsOn: 0 }), { from: "2026-09-27", to: "2026-10-03" });
  assert.deepEqual(getPresetRange("this_week", at(2026, 10, 4), { weekStartsOn: 0 }), { from: "2026-10-04", to: "2026-10-10" });
});

test("weeks span a year boundary", () => {
  assert.deepEqual(getPresetRange("this_week", at(2026, 1, 1)), { from: "2025-12-29", to: "2026-01-04" });
  assert.deepEqual(getPresetRange("last_week", at(2026, 1, 1)), { from: "2025-12-22", to: "2025-12-28" });
});

test("months are whole months", () => {
  assert.deepEqual(getPresetRange("this_month", THU), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(getPresetRange("last_month", THU), { from: "2026-09-01", to: "2026-09-30" });
});

test("last month from January is last December", () => {
  assert.deepEqual(getPresetRange("last_month", at(2026, 1, 15)), { from: "2025-12-01", to: "2025-12-31" });
});

test("February in a leap year ends on the 29th", () => {
  assert.deepEqual(getPresetRange("this_month", at(2028, 2, 10)), { from: "2028-02-01", to: "2028-02-29" });
  assert.deepEqual(getPresetRange("last_month", at(2027, 3, 31)), { from: "2027-02-01", to: "2027-02-28" });
});

test("quarters are whole quarters", () => {
  assert.deepEqual(getPresetRange("this_quarter", THU), { from: "2026-10-01", to: "2026-12-31" });
  assert.deepEqual(getPresetRange("this_quarter", at(2026, 2, 14)), { from: "2026-01-01", to: "2026-03-31" });
  assert.deepEqual(getPresetRange("this_quarter", at(2026, 6, 30)), { from: "2026-04-01", to: "2026-06-30" });
  assert.deepEqual(getPresetRange("this_quarter", at(2026, 9, 1)), { from: "2026-07-01", to: "2026-09-30" });
});

test("this year is year-to-date; last year is whole", () => {
  assert.deepEqual(getPresetRange("this_year", THU), { from: "2026-01-01", to: "2026-10-01" });
  assert.deepEqual(getPresetRange("last_year", THU), { from: "2025-01-01", to: "2025-12-31" });
});

test("custom and unknown keys are an open range", () => {
  assert.deepEqual(getPresetRange("custom", THU), { from: null, to: null });
  assert.deepEqual(getPresetRange("nope", THU), { from: null, to: null });
});

test("defaultPresets are the ten, in order, each with a built-in range except custom", () => {
  assert.deepEqual(
    defaultPresets.map((p) => p.label),
    ["Today", "Yesterday", "This Week", "Last Week", "This Month", "Last Month", "This Quarter", "This Year", "Last Year", "Custom"],
  );
  for (const p of defaultPresets) {
    const r = getPresetRange(p.key, THU);
    if (p.key === "custom") assert.equal(r.from, null);
    else assert.ok(r.from && r.to && r.from <= r.to, p.key);
  }
});

test("now defaults to the current moment", () => {
  const d = new Date();
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  assert.deepEqual(getPresetRange("today"), { from: iso, to: iso });
});

// ---- open-range ("no limit") presets and the Select's derived key ----------

const OPEN = { from: null, to: null };
const withAll = [...defaultPresets, allTimePreset];
const ownOpen = { key: "everything", label: "Everything", range: () => ({ from: null, to: null }) };

test("allTimePreset is opt-in, not in defaultPresets", () => {
  assert.equal(defaultPresets.some((p) => p.key === allTimePreset.key), false);
  assert.equal(allTimePreset.label, "All Time");
});

test("an open-range preset resolves to an open range; custom still resolves to nothing", () => {
  assert.deepEqual(resolvePreset(allTimePreset, THU), OPEN);
  assert.deepEqual(resolvePreset({ key: "all_time", label: "All Time" }, THU), OPEN);
  assert.deepEqual(resolvePreset(ownOpen, THU), OPEN);
  assert.equal(resolvePreset({ key: "custom", label: "Custom" }, THU), null);
  assert.equal(resolvePreset({ key: "nope", label: "Nope" }, THU), null);
});

test("picking All Time over set dates emits the open range", () => {
  const value = { from: "2026-10-01", to: "2026-10-31" };
  assert.deepEqual(presetChange(withAll, "all_time", value, THU), OPEN);
  assert.deepEqual(presetChange([ownOpen], "everything", value, THU), OPEN);
});

test("picking All Time when already open emits nothing; custom never emits", () => {
  assert.equal(presetChange(withAll, "all_time", OPEN, THU), null);
  assert.equal(presetChange(withAll, "custom", { from: "2026-10-01", to: null }, THU), null);
});

test("the Select shows All Time for open dates when offered, else the placeholder", () => {
  assert.equal(shownPresetKey(withAll, OPEN, null, THU), "all_time");
  assert.equal(shownPresetKey(withAll, OPEN, "all_time", THU), "all_time");
  assert.equal(shownPresetKey(defaultPresets, OPEN, null, THU), "");
});

test("the Select follows the dates, not the last pick", () => {
  assert.equal(shownPresetKey(withAll, { from: "2026-10-01", to: "2026-10-31" }, "all_time", THU), "this_month");
  assert.equal(shownPresetKey(withAll, { from: "2026-10-02", to: null }, null, THU), "custom");
  assert.equal(shownPresetKey(withAll, { from: "2026-10-01", to: "2026-10-31" }, "custom", THU), "custom");
});
