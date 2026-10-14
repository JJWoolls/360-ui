// Modal frame — which size attribute and max-width a Modal draws, the layer a
// nested modal sits on, and the stylesheet rules that make "screen" edge to edge
// while "full" keeps its inset.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { modalFrame, modalLayer } from "../src/primitives/Modal/logic.ts";

const css = readFileSync(
  fileURLToPath(new URL("../src/primitives/Modal/Modal.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** The declarations of one exact selector, as written. */
function rule(sel: string): string {
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (m[1].trim() === sel) return m[2];
  }
  assert.fail(`no rule for ${sel}`);
}

test("default: no size attribute; width only when asked, scaled under a Scale", () => {
  assert.deepEqual(modalFrame("default", undefined, false), {});
  assert.deepEqual(modalFrame("default", 640, false), { maxWidth: 640 });
  assert.deepEqual(modalFrame("default", 640, true), {
    maxWidth: "calc(640px * var(--ui-space-scale, 1))",
  });
});

test("full and screen name themselves and ignore width", () => {
  assert.deepEqual(modalFrame("full", 640, false), { dataSize: "full" });
  assert.deepEqual(modalFrame("screen", 640, true), { dataSize: "screen" });
  assert.deepEqual(modalFrame("screen", undefined, false), { dataSize: "screen" });
});

test("the first modal keeps the stylesheet layer; each nested one steps above", () => {
  assert.equal(modalLayer(0), undefined);
  assert.equal(modalLayer(1), "calc(var(--z-modal) + 1)");
  assert.equal(modalLayer(2), "calc(var(--z-modal) + 2)");
  assert.equal(modalLayer(Number.NaN), undefined);
});

test("screen is edge to edge: no inset, radius, border or max-width", () => {
  const overlay = rule('.ui-modal-overlay[data-size="screen"]');
  assert.match(overlay, /height:\s*100dvh/);
  assert.match(overlay, /height:\s*100vh/);
  assert.match(overlay, /safe-area-inset-top/);
  assert.match(overlay, /safe-area-inset-bottom/);
  const dialog = rule('.ui-modal[data-size="screen"]');
  assert.match(dialog, /max-width:\s*none/);
  assert.match(dialog, /border:\s*none/);
  assert.match(dialog, /border-radius:\s*0/);
  assert.match(dialog, /min-height:\s*0/);
});

test("the body is the only thing that scrolls", () => {
  const body = rule(".ui-modal-body");
  assert.match(body, /min-height:\s*0/);
  assert.match(body, /overflow-y:\s*auto/);
  assert.match(rule(".ui-modal-head"), /flex:\s*none/);
  assert.match(rule(".ui-modal-foot"), /flex:\s*none/);
});

test("full keeps its small inset", () => {
  assert.match(rule('.ui-modal-overlay[data-size="full"]'), /padding:\s*calc\(var\(--s4\)/);
  assert.doesNotMatch(rule('.ui-modal[data-size="full"]'), /border/);
});
