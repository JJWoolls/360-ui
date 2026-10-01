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
