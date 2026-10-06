# @360digilab/ui

The house kit: the primitives both apps are built from, and the design tokens
they are painted with. **This is the only home.** The 360 Workspace app and the
LMS import from here; neither keeps its own copy of a button.

## Why it exists

Two apps, one look. Before this repo, the Workspace app and the LMS each carried
their own primitives, so fixing a button in one left the other wrong. The rule
was already set — one primitive with variants, never a per-app copy — and this
repo is where that rule finally has somewhere to live.

## Using it

In an app's `package.json`:

```json
"@360digilab/ui": "github:JJWoolls/360-ui#main"
```

Then once, at the app root:

```ts
import "@360digilab/ui/tokens.css";
```

and anywhere a part is needed:

```ts
import { Button, Badge, Modal } from "@360digilab/ui";
```

The package ships TypeScript source, not a build, so each app compiles it with
its own toolchain and its own React version.

- **Next (the LMS)** — add `transpilePackages: ["@360digilab/ui"]` to
  `next.config.js`. Components that hold state carry `"use client"` already.
- **Vite (the Workspace app)** — nothing to configure.

## Loading a screen's data

One way, in both apps: `useAsyncData` for the state, `AsyncBoundary` for the
picture.

```tsx
const rows = useAsyncData(() => fetchRows(filter), [filter], { initial: [] });

<AsyncBoundary
  state={rows}
  isEmpty={(r) => r.length === 0}
  empty={<EmptyState title="No rows match this filter" />}
>
  {(r) => <RowList rows={r} />}
</AsyncBoundary>
```

- `loading` is true only while there is nothing to show yet; a reload keeps the
  old data on screen and sets `refreshing` instead.
- Only the newest call can write its result; anything after unmount is dropped.
- A failed fetch becomes `error` (always an `Error`) and never throws to the
  page. `AsyncBoundary` shows it as an `ErrorPanel` with Try Again on `reload()`.
- After a mutation, `setData` edits in place; `await reload()` refetches.

The reasoning is written at the top of `src/hooks/useAsyncData.ts`.

## Saving

One way to run a write: `useSaveState`.

```tsx
const save = useSaveState({ onError: (e) => showToast(e.message) });

<Button
  loading={save.saving}
  onClick={() => save.run(async () => { await writeRow(row); })}
>
  {save.saved ? "Saved" : "Save"}
</Button>
```

- A second `run` while one is in flight is ignored, so a double click writes once.
- `run` resolves `true` or `false` and never rejects. The write must THROW on
  failure; a client that returns `{ error }` is unwrapped inside the function.
- `saved` stays true for two seconds after a write that worked.
- Each app passes `onError` to show the failure its own way; it is never silent.

The reasoning is written at the top of `src/hooks/useSaveState.ts`.

## Search as you type

One debounce: `useDebouncedValue`, so pages don't hand-roll
`setTimeout`/`clearTimeout`.

```tsx
const q = useDebouncedValue(search, 300);
const rows = useAsyncData(() => findRows(q), [q], { initial: [] });
```

- Run the query off `q`, not `search`; `q` settles once typing pauses for 300ms.
- The timer is cleared on every change and on unmount.
- Pass a primitive (the search string); an object rebuilt every render never
  settles.

The reasoning is written at the top of `src/hooks/useDebouncedValue.ts`.

### The search field

One search field: `Input` with a search icon and `onClear`. No hand-made
clear-X buttons beside the field.

```tsx
<Input
  prefix={<Search />}
  value={q}
  onChange={(e) => setQ(e.target.value)}
  onClear={() => setQ("")}
  clearLabel="Clear search"
/>
```

- `onClear?: () => void` — shows a small X inside the field's right edge while
  `value` is a non-empty string. Clicking it calls `onClear` and puts the cursor
  back in the field. The caller empties the value; the field is controlled.
- `clearLabel?: string` — the button's accessible name. Default `"Clear"`;
  name what it clears.
- The clear button takes the `suffix` slot. Given both, the clear button shows
  while there is a value and the suffix while the field is empty.
- Not shown on a `disabled` or `readOnly` field.
- `onPrefixClick?: () => void` makes the prefix a real button (named by
  `prefixLabel`, default `"Search"`): the magnifier that runs the search, or a
  mode glyph that switches what is searched. After it runs, the cursor goes
  back into the field. Without it the prefix is decoration.
- `size="touch"` is the finger-sized field for touch surfaces: 44px tall
  (`--touch-target`), 16px type so iOS does not zoom on focus, larger icon and
  clear/prefix hit areas. `sm` and `md` are unchanged.
- `Input` forwards its ref to the `<input>` (focus, or anchor a dropdown).

## Scale

One set of parts, sized per screen: wrap the screen in `Scale` instead of
forking a component.

```tsx
<Scale size="wall">...</Scale>
<Scale size="large" spaceScale={1}>...</Scale>   {/* bigger type, same gaps */}
```

- Three multipliers, each 1 by default: `--ui-type-scale` (font sizes),
  `--ui-space-scale` (padding, gaps, margins, control heights, container
  widths) and `--ui-icon-scale` (icon boxes, kit-set svg sizes, dots, check
  boxes, toggles, spinners, avatars).
- Presets (type / space / icon): `compact` 0.9 / 0.85 / 0.9, `default` 1 / 1 /
  1, `large` 1.2 / 1.15 / 1.2, `wall` 1.5 / 1.35 / 1.5. `typeScale`,
  `spaceScale`, `iconScale` override one axis.
- Outside a `Scale` nothing is set and every primitive renders exactly as
  before; every multiplier in the stylesheets falls back to 1.
- Pop-ups follow the screen that opened them: Modal (and AlertDialog,
  DatePicker, OptionPickerModal on it), the Select list, Tooltip, ContextMenu
  and toasts raised with `useToast()` read `useScale()` and set the variables
  on their portal root. `scaleRootProps(useScale(), style)` does the same for
  an app's own portal.
- A fixed-height field (Input, Select trigger, DateField) grows by the larger
  of type and space, so bigger text never clips. Touch sizes never drop below
  `--touch-target` or 16px type.
- Not scaled: borders, radii, letter-spacing, caller-set widths (Table column
  `width`, `maxHeight`), and svg glyphs a caller sizes itself outside a Button.
- `Scale` renders a plain block `div` (className and style pass through). An
  inner `Scale` replaces the outer one's values rather than multiplying them.

## Palettes

Colour is two independent switches on `<html>`:

- `data-theme` — the mode: `dark` (default) or `light`.
- `data-palette` — the colour family: `atlas` (default), `graphite`, `nord`,
  `gruvbox`, `catppuccin`, `tokyo-night`, `dracula`, `solarized`, `rose-pine`.
  Any palette works in either mode.

```ts
import "@360digilab/ui/palettes.css";   // once, after the app's own tokens
import { PALETTES, toPaletteId } from "@360digilab/ui";   // the picker's list
```

Each palette is a whole colour family taken from an established editor /
terminal scheme (credited in `palettes.css`): its own backgrounds, text and
matched accents, not the base re-tinted. Graphite is the exception: a neutral,
maximum-contrast variant of the base that keeps the base's status tones and
accents.

| Palette | Scheme (dark / light) | Dark surface / brand |
|---|---|---|
| Atlas | The base: charcoal grounds, the house green. | `#1c1c1c` / `#3ecf8e` |
| Graphite | Near-black neutral, brighter text, firmer borders, silver accent. | `#171819` / `#e4e4e7` |
| Nord | Nord Polar Night / Snow Storm. Frost brand. | `#2e3440` / `#88c0d0` |
| Gruvbox | Gruvbox dark / light. Orange brand. | `#282828` / `#fe8019` |
| Catppuccin | Mocha / Latte. Mauve brand. | `#1e1e2e` / `#cba6f7` |
| Tokyo Night | Night / Day. Blue brand. | `#1a1b26` / `#7aa2f7` |
| Dracula | Dracula / Alucard. Purple brand. | `#282a36` / `#bd93f9` |
| Solarized | Solarized dark / light. Blue brand. | `#002b36` / `#268bd2` |
| Rosé Pine | Main / Dawn. Rose brand (pine in Dawn). | `#1f1d2e` / `#ebbcba` |

- **Atlas has no block.** With no attribute, or `data-palette="atlas"`, the
  app's own token file is in charge, so the default looks exactly as it did.
- **A scheme family sets:** grounds (`--bg`, `--surface*`), borders, the text
  ramp, `--brand` (+ `-hover`, `-on`), the `info` / `violet` / `neutral`
  tones, `--danger` / `--warn` / `--success` (+ the `--accent-red` /
  `--accent-amber` aliases), the decorative accents (`pink`, `cyan`,
  `orange`, `lime`, `gold`) and their `-ink` variants, `--muted-rgb`,
  `--surface-is-light`, and the legacy HSL set (`--card`, `--primary`,
  `--destructive`, `--sidebar-*` …) that utility classes read as
  `hsl(var(--x))`. The test refuses any other token.
- **Meaning holds:** danger is the family's red, warn its amber / yellow,
  success its green; the test checks each hue band.
- **A palette may not set:** `--stage-*`, `--dept-*`, `--location-*`,
  `--route-*` or the pan contrast pair. Those are identities (which stage,
  department, place) and look the same for everyone. Shadows stay with the base.
- **Twins:** every colour a palette sets with an `-rgb` companion is set
  together with it; the test proves each pair agrees, so
  `rgba(var(--x-rgb), a)` always follows a palette swap.
- **`--surface-is-light`** (0 / 1) says what the ground actually is. Code that
  picks ink for an arbitrary colour reads it, never the mode name.
- **Specificity, not load order:** every palette selector starts
  `:root[data-palette=…]`, which outranks an app's `:root` /
  `[data-theme="light"]` defaults however the bundler orders the stylesheets.
- Adding a palette: a dark and a light block in `src/styles/palettes.css`, its
  id in `src/styles/palettes.ts`, its swatch `--palette-preview-<id>`.
  `npm test` checks completeness, the allowed list, twins, identity tokens,
  status hues, and contrast (primary, secondary, tertiary text >= 4.5:1 on
  `--surface`; brand-on >= 4.5:1; tones >= 3:1; inks >= 4.5 / 5:1).
- **Retired ids:** `ocean`, `sand`, `forest`, `plum` (the first, tinted
  set). `toPaletteId` maps each to the nearest family (`RETIRED_PALETTES`:
  nord, gruvbox, gruvbox, dracula) so a stored choice keeps working.
- **Retired: `data-map`.** The old single switch (`atlas-dark`, `atlas-light`,
  `midnight`, `ember`, `pine`, `paper`) fused mode and colour, so "warm, but
  light" was impossible. Its ideas became ocean, sand and forest. The
  `--map-preview-*` swatches are now `--palette-preview-*`. An app still
  setting `data-map` keeps whatever its own copy of the tokens says; nothing in
  the kit reads it.
- The identity hues as button text use `--pink-ink`, `--cyan-ink`,
  `--orange-ink`, `--lime-ink` (+ `-rgb`): the bright hue in dark, a darker
  readable shade in light. An app that does not define them falls back to the
  plain hue.

## Windows

`Modal` (and `AlertDialog` on top of it) is the only pop-up window.

- A form or anything holding typed input passes `closeOnBackdrop={false}`;
  where losing that input really hurts, `closeOnEscape={false}` too.
- The field that should take the cursor carries `autoFocus` or
  `data-autofocus`; otherwise the first focusable element gets it.
- Escape goes to an open dropdown first (its trigger carries `aria-haspopup`
  and `aria-expanded`), and to a field marked `data-handles-escape` (an inline
  row edit cancelling itself). Only then does it close the window.
- Actions go in `footer`: Cancel left, primary right.
- `subtitle` is the quieter line under the title (a count, the record, a
  status) — muted and a step smaller.
- `size="full"` fills the window less a small inset; head and footer stay put
  and the body scrolls. For boards, long grids and viewers only.
- A notice with one answer is `AlertDialog` with `okLabel` and no `actions`:
  one primary button, no Cancel; Escape and the backdrop mean OK too.

## Dropdowns

One dropdown: `Select`. Never a native `<select>`, and never a local copy.

- Plain lists use it as is; groups come from each option's `group`.
- Any list too long to scan gets `searchable`. Typing on the closed field opens
  it with the search already started; search matches every word across
  `label`, `sublabel` and `searchText`, best matches first.
- Rows can carry a `sublabel`, an `imageUrl` thumbnail, or any `leading` mark.
- `size="sm"` for inline use, matching `Input`. Give it an `id` for a
  `<label htmlFor>`, or `ariaLabel` when there is no visible label.
- The list is portaled, so a scrolling Modal never clips it, and inside a Modal
  the first Escape closes the list and the second the window.

A form field that holds a set is `MultiSelect`, the same field and panel with
check marks that toggle and a list that stays open:

```tsx
<MultiSelect ariaLabel="Teams" options={teams} value={ids}
             withPrimary primary={main}
             onChange={(next, primary) => { setIds(next); setMain(primary); }} />
```

- Always searchable. The closed field shows chips, the primary first, then "+N".
- `withPrimary` adds a star per row; the primary always stays one of the
  selected values (first pick becomes it, removing it hands it on).
- Keys: Enter toggles, Space toggles until a search is typed, Shift+Enter stars.
- For filtering a list on screen use `FilterPills`; this is for forms.

## SectionLabel

One section heading: `SectionLabel`, so pages don't hand-roll a small
uppercase span or an inline-styled `h3`.

```tsx
<SectionLabel>Recent Activity</SectionLabel>
<SectionLabel as="h3" action={<Button size="sm">Add</Button>}>Notes</SectionLabel>
```

- Pass Title Case; it renders as written and is never uppercased.
- `as` picks the element (`div` by default, or `h2`/`h3`/`span`); the look is
  the same for every element.
- `action` is a right-aligned slot on the same row: a count or a small control.
- `size="sm"` for dense panels; `md` is the default.

The reasoning is written at the top of
`src/primitives/SectionLabel/SectionLabel.tsx`.

## StatusTabs

One status-tab row: `StatusTabs`, for picking which slice of a list is shown.
Single-select; for any-of-these filtering use `FilterPills`.

```tsx
<StatusTabs
  aria-label="Status"
  items={[
    { value: "open", label: "Open", count: 12 },
    { value: "waiting", label: "Waiting", count: 3 },
    { value: "done", label: "Done" },
  ]}
  value={status}
  onChange={setStatus}
/>
```

- Generic over the value: `StatusTabs<"open" | "waiting" | "done">` types
  `onChange` to the union.
- A real tablist: Left/Right move and select (wrapping), Home/End jump; only
  the selected tab is in the Tab order.
- `count` is a small muted number after the label; omit it and none is drawn.
- `size="sm"` for dense boards; `md` is the default. The track wraps on narrow
  screens rather than scrolling.
- `color` on an item (any CSS colour, hex or `var(--token)`) makes that tab
  wear its own hue when selected instead of brand green — for rows whose tabs
  are identities. Items without one keep the brand look, so "All" plus
  coloured entries mixes freely.

The reasoning is written at the top of
`src/primitives/StatusTabs/StatusTabs.tsx`.

## SectionTabs

One underline strip of links across a multi-page section: `SectionTabs`. For
moving between pages; to filter a list on one page use `StatusTabs`.

```tsx
<SectionTabs
  aria-label="Reports sections"
  items={[
    { href: "/reports", label: "Overview", match: "exact" },
    { href: "/reports/sales", label: "Sales" },
    { href: "/reports/queue", label: "Queue", count: 4 },
  ]}
  pathname={pathname}
  linkComponent={Link}
/>
```

- A `<nav>` landmark of real links; the current page's link has
  `aria-current="page"` and a brand underline.
- `match`: `"prefix"` (default) keeps the tab lit on pages beneath its href;
  `"exact"` for a landing page whose href is the parent of its siblings. The
  longest match wins; a path no tab claims lights none.
- Pass `pathname` and let the strip decide, or `activeHref` to decide yourself.
- The kit imports no router: pass your router's link as `linkComponent`
  (defaults to `<a>`). It receives `href`, `className`, `aria-current`,
  `children`. Wrap it once in an app adapter.
- `count` is a small muted number after the label. The strip wraps on narrow
  screens.
- `activeSectionHref(items, pathname)` / `sectionTabMatches(href, pathname,
  match)` are the same rules as plain functions.

The reasoning is written at the top of
`src/primitives/SectionTabs/SectionTabs.tsx` and `match.ts`.

## DateRangeFilter

One from/to date bar: a preset Select and two `DateField`s. Never a native
date input.

```tsx
const [range, setRange] = useState<DateRange>(getPresetRange("this_month"));
<DateRangeFilter value={range} onChange={setRange} />
```

- Value is `{ from, to }`, each `"YYYY-MM-DD"` or null, local calendar.
- `defaultPresets`: Today, Yesterday, This Week, Last Week, This Month, Last
  Month, This Quarter, This Year, Last Year, Custom. Pass `presets` for a
  subset, or presets with their own `range(now)`.
- `getPresetRange(key, now?, { weekStartsOn? })` is the pure arithmetic, also
  on `@360digilab/ui/format`. Weeks, months and quarters are whole periods;
  This Year is year-to-date; weeks start Monday unless `weekStartsOn: 0`.
- The Select follows the dates: editing a date by hand shows Custom.
- `allTimePreset` (All Time, both ends open) is opt-in, not in
  `defaultPresets`: `presets={[...defaultPresets, allTimePreset]}`. Picking it
  emits `{ from: null, to: null }`. Any preset whose own `range` returns both
  ends null behaves the same way.
- `min` / `max` (`"YYYY-MM-DD"`, inclusive) go to both fields, e.g.
  `max={today}` to block future dates. `DateField` and `DatePicker` take the
  same two props.

The reasoning is written at the top of
`src/primitives/DateRangeFilter/presets.ts` and `DateRangeFilter.tsx`.

## CSV export

`toCsv(rows, columns)` returns the file as a string; `downloadCsv(filename,
rows, columns)` saves it in the browser. `ExportButton` is the control.

```tsx
const columns: CsvColumn<Row>[] = [
  { key: "name", header: "Name" },
  { accessor: (r) => formatMoney(r.total), header: "Total" },
];
<ExportButton onExport={() => downloadCsv("orders", rows, columns)} />
```

- UTF-8 with a BOM, CRLF line endings; a cell is quoted only when it holds a
  comma, quote or line break, and quotes are doubled.
- Pure, and on `@360digilab/ui/format` for server code.
- `ExportButton` shows its loading state while a returned promise settles.

Tests: `npm test` (Node's built-in runner, no dependencies).

## StatCard

One big-number tile: `StatCard`, built on `Card`, so pages stop hand-rolling a
bordered div with a large bold number.

```tsx
<StatCard label="Open Cases" value={open} icon={<Inbox size={14} />} />
<StatCard label="Remakes" value={pct} trend={{ direction: "down", text: "2% vs last month", tone: "good" }} />
<StatCard label="Overdue" value={money(overdue)} tone="danger" sublabel="Oldest 41 days" onClick={openOverdue} />
<StatCard label="Week" value={n} loading={loading} zero="dim" selected={week === w} onClick={() => setWeek(w)} />
```

- `kind` picks the Card treatment (`stat` by default, or `plain`/`tile`/`accent`).
- `loading` shows a Skeleton bar where the number goes; the card keeps its size.
- `trend.tone` is good/bad news, not up/down; the arrow follows `direction`.
- `onClick` makes it a real button; `selected` marks a filter card that is on.
- **A zero hides the tile by default.** `zero="dim"` keeps it, dimmed — for
  dashboards whose fixed tile set is the layout; `zero="show"` leaves it as-is.
  Zero = a number 0 or a string whose digits are all zeros ("$0.00", "0%").
  Never hidden while `loading` or `selected`. The older `empty` flag still
  works and overrides the detection.
- No width: the grid owns the size. Colour on the value or the label, not both.

The reasoning is written at the top of `src/primitives/StatCard/StatCard.tsx`.

## Tables

One table: `Table`. Never a hand-rolled `<table>`, and never a local copy.

The rules:

- **No zebra stripes.** Rows are separated by one rule.
- **No sort arrows.** The active sort column is marked by colour (`--brand`)
  and nothing else; `aria-sort` carries the direction to screen readers.
- **100 rows a page.** The default. `pageSize={null}` only for a list that is
  genuinely short; a server-paged list passes `totalRows` instead.
- **Row click opens the row's detail.** `onRowClick` is for that, not for
  inline edits; controls inside a cell stop the click themselves.
- **Right-click a row for its menu.** `onRowContextMenu={(row, e) =>
  menu.openAt(e, row)}` with `useContextMenu` + `ContextMenu`. Rows become
  focusable, and Shift+F10 / the Menu key opens the same menu under the row.

Basic:

```tsx
const columns: TableColumn<Case>[] = [
  { key: "no", header: "Case", cell: (c) => c.no, width: 120 },
  { key: "doctor", header: "Doctor", cell: (c) => c.doctor },
  { key: "total", header: "Total", cell: (c) => money(c.total), align: "right", numeric: true },
];

<Table columns={columns} rows={cases} rowKey={(c) => c.id} onRowClick={openCase}
       emptyText="No cases match this filter" />
```

Sort — controlled. Give a column a `sortAccessor` and the Table sorts; pass
`manualSort` when the caller (or the server) already sorted:

```tsx
const [sortCol, setSortCol] = useState("no");
const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
const onSort = (key: string) => {
  if (key === sortCol) setSortDir(sortDir === "asc" ? "desc" : "asc");
  else { setSortCol(key); setSortDir("asc"); }
};

<Table columns={columns} rows={cases} rowKey={(c) => c.id}
       sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
```

Footer — per column. `footer` is a node or a function of every row the Table
was given (all pages, not the visible one); a `<tfoot>` renders when any
column has one, and hides while loading or empty:

```tsx
{ key: "total", header: "Total", cell: (c) => money(c.total), align: "right", numeric: true,
  footer: (rows) => money(rows.reduce((s, c) => s + c.total, 0)) }
```

Expand — a full-width row under the row. A toggle column appears; with no
`onRowClick`, clicking the row toggles too. Uncontrolled by default; pass
`expandedKeys` / `onExpandedChange` to control it:

```tsx
<Table columns={columns} rows={cases} rowKey={(c) => c.id}
       renderExpanded={(c) => <CaseNotes id={c.id} />}
       canExpand={(c) => c.noteCount > 0} />
```

Group — a section row before each group. Groups keep the order their first
row has in `rows`; sorting happens within each group:

```tsx
<Table columns={columns} rows={cases} rowKey={(c) => c.id}
       groupBy={(c) => c.department}
       renderGroupHeader={(dept, rows) => `${dept} · ${rows.length}`} />
```

Select — a checkbox column. The header box is checked, mixed or clear, and
selects **every row the Table was given** (all pages), not just the visible
page; for a server-paged list that is the loaded page:

```tsx
const [picked, setPicked] = useState<Set<TableRowKey>>(new Set());

<Table columns={columns} rows={cases} rowKey={(c) => c.id}
       selectedKeys={picked} onSelectionChange={setPicked}
       canSelect={(c) => !c.invoiced} />
```

Server paging — `totalRows` switches the Table to server mode: `rows` is the
current page, nothing is sliced, and the controls drive `page`. Pair it with
`manualSort` for RPC-paged lists:

```tsx
<Table columns={columns} rows={data.rows} rowKey={(c) => c.id}
       manualSort sortCol={sortCol} sortDir={sortDir} onSort={onSort}
       totalRows={data.total} page={page} onPageChange={setPage}
       loading={loading} />
```

Also: `header` takes any node; `loading` draws skeleton rows; `rowClassName`
and `rowStyle` per row; `pinToTop` floats rows above the sort; `fixedLayout`
(with column `width`s), `minWidth`, `maxHeight`, `stickyHeader` and
`stickyFirstColumn` for wide grids; `caption` names the table for screen
readers. The default `emptyText` is "Nothing to show" — say which empty it is.

An app paints its tables through the `--ui-table-*` properties declared in
`Table.css`, passed on `style`; it never forks the component.

## The rules that govern what goes in here

- **One primitive, with variants.** Format, tone, size, theme and viewport are
  props. An app that wants to look different overrides token *values*; it never
  forks a component. A divergent format may be a sibling exported from the same
  module — never a re-implementation in an app.
- **Tokens only.** Nothing in here names a color, a spacing value, a radius or a
  font except `src/styles/tokens.css`. That contract is what makes "change the
  primitive and it changes everywhere" true rather than aspirational.
- **`src/primitives/**` is the one place native elements are legal.** That is
  what a primitive *is*: the wrapper that contains the native thing so nothing
  else has to.
- **If the part you need isn't here, stop and ask Josh, then build it here** and
  make it the house default. Do not reach for a native control "for now" — that
  step is the one that costs.
- **Touch is a behaviour of the primitive, never a separate component.** On a
  touch screen (`@media (pointer: coarse)`) every `Button` offers a 44px finger
  tap (`--touch-target`): `sm`/`md` grow to at least 44x44, `xs` keeps its row
  height and gets an invisible 44x44 tap area. A mouse never matches, so desktop
  is unchanged. An app that does not import `tokens.css` must define
  `--touch-target` itself.
- **React 18 surface only.** The LMS runs React 18 and the Workspace app runs
  19. Nothing in here may use an API that only exists in 19, until the LMS is
  upgraded.

## Where it came from

Seeded 2026-07-27 from the Workspace app's `src/components/primitives`, which
were themselves ported from the LMS. The LMS is the basis: where it has one
answer, that answer is the standard; where it has forked, Josh picks by eye and
his pick becomes the standard for both.

## Checks

```
npm run check
```
