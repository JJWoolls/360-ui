// Button look — which colour attributes a Button draws from its props.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buttonLook } from "../src/primitives/Button/look.ts";

test("hierarchy and tone name the variant; secondary is the default", () => {
  assert.deepEqual(buttonLook({}), { "data-variant": "secondary" });
  assert.deepEqual(buttonLook({ variant: "primary" }), { "data-variant": "primary" });
  assert.deepEqual(buttonLook({ tone: "warn" }), { "data-variant": "warn" });
});

test("an identity colour tints by default and travels as a property", () => {
  assert.deepEqual(buttonLook({ color: "var(--x)" }), {
    "data-variant": "color",
    "data-fill": "tint",
    colorVar: { "--ui-btn-color": "var(--x)" },
  });
  assert.equal(buttonLook({ color: "#123456", variant: "secondary" })["data-fill"], "tint");
});

test("variant sets how loudly the colour is worn", () => {
  assert.equal(buttonLook({ color: "red", variant: "primary" })["data-fill"], "solid");
  assert.equal(buttonLook({ color: "red", variant: "ghost" })["data-fill"], "ghost");
});

test("an empty colour falls back to the plain button", () => {
  assert.deepEqual(buttonLook({ color: "" }), { "data-variant": "secondary" });
  assert.deepEqual(buttonLook({ color: "", variant: "primary" }), { "data-variant": "primary" });
});

// Sizes are pure CSS, so the bench step is checked in the stylesheets: the
// Button and the ToggleChip must agree on it, or a chip row and a bench button
// bar stop lining up.
const sheet = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function decls(css: string, sel: string): string {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].trim() === sel) return m[2];
  }
  assert.fail(`no rule for ${sel}`);
}

const BENCH_HEIGHT =
  "calc(var(--bench-target, 56px) * max(1, var(--ui-space-scale, 1), var(--ui-type-scale, 1)))";

test("bench is 56px, grown like touch, square when icon-only, on button and chip alike", () => {
  const btn = sheet("../src/primitives/Button/Button.css");
  const chip = sheet("../src/primitives/ToggleChip/ToggleChip.css");
  const b = decls(btn, '.ui-btn[data-size="bench"]');
  assert.ok(b.includes(`min-height: ${BENCH_HEIGHT}`));
  assert.ok(b.includes(`min-width: ${BENCH_HEIGHT}`));
  assert.match(b, /font-size:\s*max\(16px/);
  assert.ok(decls(chip, '.ui-chip[data-size="bench"]').includes(`min-height: ${BENCH_HEIGHT}`));
  decls(btn, '.ui-btn[data-size="bench"]:not(:has(.ui-btn-label))');
  // Colour never keys on size: no colour rule mentions a size.
  for (const m of btn.matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    if (m[1].includes("data-variant")) assert.doesNotMatch(m[1], /data-size/);
  }
});

test("touch is untouched by the bench step", () => {
  const b = decls(sheet("../src/primitives/Button/Button.css"), '.ui-btn[data-size="touch"]');
  assert.match(b, /min-height:\s*calc\(var\(--touch-target\)/);
});
