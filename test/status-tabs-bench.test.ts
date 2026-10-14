// StatusTabs bench size — pure CSS, so the rules are checked in the stylesheet.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../src/primitives/StatusTabs/StatusTabs.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

function decls(sel: string): string {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].trim() === sel) return m[2];
  }
  assert.fail(`no rule for ${sel}`);
}

const TAB = '.ui-status-tabs[data-size="bench"] .ui-status-tab';

test("bench tabs are 64px, grown with the space or type scale like Button's bench", () => {
  assert.ok(
    decls(TAB).includes(
      "min-height: calc(var(--bench-tab-target, 64px) * max(1, var(--ui-space-scale, 1), var(--ui-type-scale, 1)))",
    ),
  );
  assert.match(decls(TAB), /font-size:\s*max\(18px, calc\(18px \* var\(--ui-type-scale, 1\)\)\)/);
});

test("bench tabs share the row evenly and the track fills it", () => {
  assert.match(decls(TAB), /flex:\s*1 1 0/);
  const track = decls('.ui-status-tabs[data-size="bench"]');
  assert.match(track, /display:\s*flex/);
  assert.match(track, /width:\s*100%/);
});

test("bench count is a bubble on a wash of the tab's own colour", () => {
  const c = decls(`${TAB}__count`);
  assert.match(c, /background:\s*color-mix\(in srgb, currentColor/);
  assert.match(c, /min-width:/);
});

test("colour and selection rules never key on size", () => {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/data-size/.test(m[1])) assert.doesNotMatch(m[2], /--ui-status-tab-color|--brand\b/);
  }
  // md and sm keep their boxes.
  assert.match(decls('.ui-status-tabs[data-size="md"] .ui-status-tab'), /min-height:\s*calc\(\(var\(--s6\) - var\(--s1\)\)/);
  assert.match(decls('.ui-status-tabs[data-size="sm"] .ui-status-tab'), /min-height:\s*calc\(\(var\(--s5\) - var\(--s1\)\)/);
});
