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

The reasoning is written at the top of
`src/primitives/StatusTabs/StatusTabs.tsx`.

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
<StatCard label="Week" value={n} loading={loading} empty={n === 0} selected={week === w} onClick={() => setWeek(w)} />
```

- `kind` picks the Card treatment (`stat` by default, or `plain`/`tile`/`accent`).
- `loading` shows a Skeleton bar where the number goes; the card keeps its size.
- `trend.tone` is good/bad news, not up/down; the arrow follows `direction`.
- `onClick` makes it a real button; `selected` marks a filter card that is on.
- `empty` dims the card — the caller decides; a card never hides itself.
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
