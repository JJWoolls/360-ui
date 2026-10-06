// Scale — presets, overrides, and the stylesheet invariant that keeps an
// unscaled screen exactly as it was.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { SCALE_PRESETS, resolveScale, scaleVars } from "../src/primitives/Scale/presets.ts";

test("default is every multiplier 1", () => {
  assert.deepEqual(resolveScale(), { size: "default", type: 1, space: 1, icon: 1 });
  assert.deepEqual(SCALE_PRESETS.default, { type: 1, space: 1, icon: 1 });
});

test("a preset is used as written", () => {
  assert.deepEqual(resolveScale("wall"), { size: "wall", ...SCALE_PRESETS.wall });
  assert.deepEqual(resolveScale("compact"), { size: "compact", ...SCALE_PRESETS.compact });
});

test("an override replaces only its own axis", () => {
  const s = resolveScale("large", { typeScale: 1.4 });
  assert.equal(s.type, 1.4);
  assert.equal(s.space, SCALE_PRESETS.large.space);
  assert.equal(s.icon, SCALE_PRESETS.large.icon);
});

test("a nonsense override falls back to the preset", () => {
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(resolveScale("large", { spaceScale: bad }).space, SCALE_PRESETS.large.space);
  }
});

test("scaleVars writes the three custom properties", () => {
  assert.deepEqual(scaleVars({ type: 1.5, space: 1.35, icon: 1.5 }), {
    "--ui-type-scale": "1.5",
    "--ui-space-scale": "1.35",
    "--ui-icon-scale": "1.5",
  });
});

// The no-op guarantee: outside a <Scale> none of the variables is set, so every
// use must fall back to 1 — calc(x * 1) is x. A bare var(--ui-type-scale)
// without the fallback would make the whole declaration invalid instead.
test("every scale variable in the primitives' CSS falls back to 1", () => {
  const dir = fileURLToPath(new URL("../src/primitives/", import.meta.url));
  const bad: string[] = [];
  for (const d of readdirSync(dir)) {
    const p = join(dir, d);
    if (!statSync(p).isDirectory()) continue;
    for (const f of readdirSync(p).filter((n) => n.endsWith(".css"))) {
      const css = readFileSync(join(p, f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const m of css.matchAll(/var\(--ui-(type|space|icon)-scale([^)]*)\)/g)) {
        if (m[2].trim() !== ", 1") bad.push(`${d}/${f}: ${m[0]}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});
