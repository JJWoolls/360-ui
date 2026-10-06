// Palettes — every palette is complete, its -rgb twins agree with their colours,
// it touches only what a palette may touch, and the swatches tell the truth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PALETTE_IDS, DEFAULT_PALETTE, toPaletteId } from "../src/styles/palettes.ts";

const read = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

const css = read("../src/styles/palettes.css");

/** selector -> { token: value } for every rule in the file. */
function rules(src: string): Map<string, Record<string, string>> {
  const out = new Map<string, Record<string, string>>();
  for (const m of src.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim().replace(/\s+/g, " ");
    const decls: Record<string, string> = {};
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls[d[1]] = d[2].trim();
    out.set(sel, decls);
  }
  return out;
}
const R = rules(css);
const darkSel = (id: string) => `:root[data-palette="${id}"]`;
const lightSel = (id: string) => `:root[data-palette="${id}"][data-theme="light"]`;
const NON_BASE = PALETTE_IDS.filter((p) => p !== DEFAULT_PALETTE);

// The complete set a palette must define, in both modes.
const REQUIRED = [
  "--bg", "--surface", "--surface-inset", "--surface-sunken", "--surface-raised", "--surface-hover",
  "--surface-elevated", "--surface-deep", "--surface-is-light",
  "--border-subtle", "--border-default", "--border-strong",
  "--text-primary", "--foreground-soft", "--text-secondary", "--text-tertiary", "--text-quaternary",
  "--text-hint", "--text-disabled", "--muted-rgb",
  "--brand", "--brand-rgb", "--brand-hover", "--brand-on",
  "--info", "--info-rgb", "--violet", "--violet-rgb", "--neutral", "--neutral-rgb",
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted",
  "--muted-foreground", "--accent", "--accent-foreground", "--border", "--input", "--ring",
  "--sidebar-bg", "--sidebar-hover", "--sidebar-text", "--sidebar-text-hover", "--sidebar-icon",
  "--sidebar-icon-hover", "--sidebar-badge-text", "--sidebar-user-text",
];

// Never a palette's to move: identities and alarm meanings.
const FORBIDDEN = [/^--stage-/, /^--dept-/, /^--location-/, /^--route-/, /^--pan-/, /^--danger/, /^--warn/,
  /^--success/, /^--accent-red/, /^--accent-amber/, /^--destructive/];

const hexToRgb = (h: string) => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)).join(", ");
};
const lum = (h: string) => {
  const c = hexToRgb(h).split(", ").map((v) => {
    const x = Number(v) / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

test("every palette defines the full set in dark and light", () => {
  for (const id of NON_BASE) {
    for (const sel of [darkSel(id), lightSel(id)]) {
      const block = R.get(sel);
      assert.ok(block, `missing block ${sel}`);
      const missing = REQUIRED.filter((t) => !(t in block));
      assert.deepEqual(missing, [], `${sel} is missing ${missing.join(", ")}`);
    }
  }
});

test("the base palette has no block — the app's own tokens are atlas", () => {
  assert.equal(R.has(darkSel(DEFAULT_PALETTE)), false);
  assert.equal(R.has(lightSel(DEFAULT_PALETTE)), false);
});

test("every palette block in the CSS is a known palette id", () => {
  for (const sel of R.keys()) {
    if (sel === ":root") continue;
    const m = /^:root\[data-palette="([a-z-]+)"\](\[data-theme="light"\])?$/.exec(sel);
    assert.ok(m, `unexpected selector ${sel}`);
    assert.ok((NON_BASE as readonly string[]).includes(m[1]), `unknown palette ${m[1]}`);
  }
});

test("a palette never sets an identity or alarm token", () => {
  const bad: string[] = [];
  for (const [sel, block] of R) for (const t of Object.keys(block)) if (FORBIDDEN.some((re) => re.test(t))) bad.push(`${sel} ${t}`);
  assert.deepEqual(bad, []);
});

test("every -rgb twin names the same colour as its token", () => {
  const bad: string[] = [];
  for (const [sel, block] of R) {
    for (const [t, v] of Object.entries(block)) {
      if (!t.endsWith("-rgb") || t === "--muted-rgb") continue;
      const base = block[t.slice(0, -4)];
      if (!base) { bad.push(`${sel} ${t} has no colour beside it`); continue; }
      if (hexToRgb(base) !== v.replace(/\s+/g, " ")) bad.push(`${sel} ${t}=${v} vs ${base}`);
    }
    // And the other way: a colour that has a twin anywhere must carry it here.
    for (const t of ["--brand", "--info", "--violet", "--neutral"]) {
      if (t in block && !(`${t}-rgb` in block)) bad.push(`${sel} sets ${t} without ${t}-rgb`);
    }
  }
  assert.deepEqual(bad, []);
});

test("text reads on its ground (>= 4.5:1 for primary, secondary, tertiary)", () => {
  const bad: string[] = [];
  for (const id of NON_BASE) {
    for (const sel of [darkSel(id), lightSel(id)]) {
      const b = R.get(sel)!;
      for (const t of ["--text-primary", "--text-secondary", "--text-tertiary"]) {
        const c = contrast(b[t], b["--surface"]);
        if (c < 4.5) bad.push(`${sel} ${t} ${c.toFixed(2)}:1`);
      }
      const on = contrast(b["--brand-on"], b["--brand"]);
      if (on < 4.5) bad.push(`${sel} brand-on ${on.toFixed(2)}:1`);
    }
  }
  assert.deepEqual(bad, []);
});

test("--surface-is-light says what the ground is", () => {
  for (const id of NON_BASE) {
    assert.equal(R.get(darkSel(id))!["--surface-is-light"], "0");
    assert.equal(R.get(lightSel(id))!["--surface-is-light"], "1");
    assert.ok(lum(R.get(darkSel(id))!["--surface"]) < 0.2);
    assert.ok(lum(R.get(lightSel(id))!["--surface"]) > 0.6);
  }
});

test("each preview swatch is its palette's dark brand", () => {
  const root = R.get(":root")!;
  for (const id of NON_BASE) assert.equal(root[`--palette-preview-${id}`], R.get(darkSel(id))!["--brand"], id);
  assert.ok(root[`--palette-preview-${DEFAULT_PALETTE}`]);
});

test("toPaletteId accepts a known id and falls back otherwise", () => {
  assert.equal(toPaletteId("ocean"), "ocean");
  assert.equal(toPaletteId("nope"), DEFAULT_PALETTE);
  assert.equal(toPaletteId(null), DEFAULT_PALETTE);
});

test("the retired data-map switch is gone from the kit's CSS", () => {
  assert.doesNotMatch(read("../src/styles/tokens.css"), /data-map/);
  assert.doesNotMatch(read("../src/primitives/Button/Button.css"), /data-map/);
});

test("Button names no colour for its identity hues", () => {
  const btn = read("../src/primitives/Button/Button.css");
  const block = btn.slice(btn.indexOf('[data-variant="pink"]'));
  assert.doesNotMatch(block.slice(0, block.indexOf(".ui-btn-icon")), /#[0-9a-f]{3,8}\b/i);
});
