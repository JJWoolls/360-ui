// Palettes — every palette is complete, its -rgb twins agree with their colours,
// it touches only what a palette may touch, and the swatches tell the truth.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PALETTE_IDS, DEFAULT_PALETTE, RETIRED_PALETTES, toPaletteId } from "../src/styles/palettes.ts";

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

// What a scheme family sets on top: its own status tones and accents. Graphite
// (a neutral variant of the base, not a scheme) keeps the base's for these.
const FAMILY = [
  "--danger", "--danger-rgb", "--warn", "--warn-rgb", "--success", "--success-rgb",
  "--accent-red", "--accent-red-rgb", "--accent-amber", "--accent-amber-rgb",
  "--pink", "--pink-rgb", "--cyan", "--cyan-rgb", "--orange", "--orange-rgb", "--lime", "--lime-rgb",
  "--gold", "--gold-rgb", "--pink-ink", "--pink-ink-rgb", "--cyan-ink", "--cyan-ink-rgb",
  "--orange-ink", "--orange-ink-rgb", "--lime-ink", "--lime-ink-rgb", "--destructive",
];
const NOT_A_FAMILY = ["graphite"];

// Never a palette's to move: identities people read as "which stage / department / place".
const FORBIDDEN = [/^--stage-/, /^--dept-/, /^--location-/, /^--route-/, /^--pan-/];

// Everything a palette may set: the required set plus nothing else.
const ALLOWED = new Set([...REQUIRED, ...FAMILY]);
const FAMILIES = NON_BASE.filter((p) => !NOT_A_FAMILY.includes(p));

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
      const need = (FAMILIES as readonly string[]).includes(id) ? [...REQUIRED, ...FAMILY] : REQUIRED;
      const missing = need.filter((t) => !(t in block));
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

test("a palette never sets an identity token", () => {
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
    for (const t of ["--brand", "--info", "--violet", "--neutral", "--danger", "--warn", "--success", "--accent-red",
      "--accent-amber", "--pink", "--cyan", "--orange", "--lime", "--gold", "--pink-ink", "--cyan-ink", "--orange-ink",
      "--lime-ink"]) {
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

test("a palette sets nothing outside the allowed list", () => {
  const bad: string[] = [];
  for (const [sel, block] of R) {
    if (sel === ":root") continue;
    for (const t of Object.keys(block)) if (!ALLOWED.has(t)) bad.push(`${sel} ${t}`);
  }
  assert.deepEqual(bad, []);
});

const hueOf = (h: string) => {
  const [r, g, b] = hexToRgb(h).split(", ").map((v) => Number(v) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0) return { h: 0, s: 0 };
  const l = (mx + mn) / 2;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h0 = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h0 * 60, s };
};

test("danger stays a red, warn an amber / yellow, success a green", () => {
  // Loose hue bands: wide enough for every family's own take (Gruvbox's olive
  // green, Rosé Pine's pink-leaning love), narrow enough that no family can
  // make danger blue or success orange.
  const bands: Record<string, (h: number) => boolean> = {
    "--danger": (h) => h >= 335 || h <= 15,
    "--warn": (h) => h >= 20 && h <= 52,
    "--success": (h) => h >= 55 && h <= 170,
  };
  const bad: string[] = [];
  for (const id of FAMILIES) {
    for (const sel of [darkSel(id), lightSel(id)]) {
      const b = R.get(sel)!;
      for (const [t, ok] of Object.entries(bands)) {
        const { h, s } = hueOf(b[t]);
        if (!ok(h) || s < 0.25) bad.push(`${sel} ${t} ${b[t]} hue ${h.toFixed(0)} sat ${s.toFixed(2)}`);
      }
      // The app's aliases name the same colour as the tone they stand for.
      if (b["--accent-red"] !== b["--danger"]) bad.push(`${sel} --accent-red differs from --danger`);
      if (b["--accent-amber"] !== b["--warn"]) bad.push(`${sel} --accent-amber differs from --warn`);
    }
  }
  assert.deepEqual(bad, []);
});

test("tones and accent inks read on their ground", () => {
  const bad: string[] = [];
  for (const id of FAMILIES) {
    for (const [sel, light] of [[darkSel(id), false], [lightSel(id), true]] as const) {
      const b = R.get(sel)!;
      for (const t of ["--info", "--violet", "--danger", "--warn", "--success"]) {
        const c = contrast(b[t], b["--surface"]);
        if (c < 3) bad.push(`${sel} ${t} ${c.toFixed(2)}:1`);
      }
      // Inks are text on their own faint tint: light grounds need the margin.
      for (const t of ["--pink-ink", "--cyan-ink", "--orange-ink", "--lime-ink"]) {
        const c = contrast(b[t], b["--surface"]);
        if (c < (light ? 5 : 4.5)) bad.push(`${sel} ${t} ${c.toFixed(2)}:1`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("graphite is kept exactly: a palette, not a scheme family", () => {
  assert.ok((NON_BASE as readonly string[]).includes("graphite"));
  for (const sel of [darkSel("graphite"), lightSel("graphite")]) {
    const set = FAMILY.filter((t) => t in R.get(sel)!);
    assert.deepEqual(set, [], `${sel} sets family tokens`);
  }
});

test("toPaletteId accepts a known id, maps a retired one, and falls back otherwise", () => {
  assert.equal(toPaletteId("nord"), "nord");
  assert.equal(toPaletteId("rose-pine"), "rose-pine");
  assert.equal(toPaletteId("ocean"), "nord");
  assert.equal(toPaletteId("graphite"), "graphite");
  assert.equal(toPaletteId("plum"), "dracula");
  assert.equal(toPaletteId("nope"), DEFAULT_PALETTE);
  assert.equal(toPaletteId("toString"), DEFAULT_PALETTE);
  assert.equal(toPaletteId(null), DEFAULT_PALETTE);
  for (const [old, to] of Object.entries(RETIRED_PALETTES)) {
    assert.ok(!(PALETTE_IDS as readonly string[]).includes(old), `${old} is retired but still offered`);
    assert.ok((PALETTE_IDS as readonly string[]).includes(to), `${old} maps to unknown ${to}`);
  }
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
