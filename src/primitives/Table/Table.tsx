"use client";

import { Fragment, useId, useMemo, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { Checkbox } from "../Checkbox/Checkbox";
import { EmptyState } from "../EmptyState/EmptyState";
import { Skeleton } from "../Loading/Loading";
import { DEFAULT_PAGE_SIZE, Pagination, usePagination } from "../Pagination/Pagination";
import "./Table.css";

/**
 * Table — the one house table. Config-driven: a column is declared once as a
 * TableColumn, and each placement passes an ordered list of columns plus rows.
 *
 * NO SORT ARROWS. The active sort column is marked by COLOR, and only by
 * color. Do not add a caret "for clarity" — Josh has ruled on this and the
 * ruling is part of why this component exists instead of a <table> per screen.
 * `aria-sort` still carries the direction to screen readers, which is where
 * that information belongs; it costs no pixels and tells the truth.
 *
 * NO ZEBRA STRIPES. Rows are separated by a single rule. Stripes compete with
 * the colours rows legitimately carry (status tints, selection, pinned rows).
 *
 * CONTROLLED SORT. The caller owns `sortCol` / `sortDir` and flips them in
 * `onSort`. With a `sortAccessor` per column the Table does the sorting; with
 * `manualSort` the caller pre-sorts and the Table only paints the header.
 *
 * PAGES OF 100 BY DEFAULT (Josh, 2026-09-29: "we always paginate to 100...
 * across the board"). The Table sorts the FULL list, then slices, and goes back
 * to page 1 when the rows or the sort change. `pageSize={null}` opts out — only
 * for a list that is genuinely short. A server-paged list passes `totalRows`
 * (plus `page` / `onPageChange`) and the Table draws the controls without
 * slicing — never page twice.
 *
 * LOOK HOOKS. The colours are read through a small set of `--ui-table-*`
 * custom properties declared on the <table> (see Table.css), each defaulting to a
 * semantic token. An app that paints its tables differently overrides those
 * VALUES through `style` — it never forks the component.
 */

export type TableRowKey = string | number;

export interface TableColumn<T> {
  key: string;
  /** Header content. A string, or any node (an icon plus a label, a tooltip). */
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Makes the column sortable by the Table itself. */
  sortAccessor?: (row: T) => string | number | null | undefined;
  /** Default true when a sortAccessor (or manualSort) and onSort are present;
      set false to force off. */
  sortable?: boolean;
  align?: "left" | "right" | "center";
  /** px (number) or any CSS width. Used by the <colgroup> under fixedLayout. */
  width?: number | string;
  nowrap?: boolean;
  /** Tabular numerals — for money and counts, where digits should line up. */
  numeric?: boolean;
  /** Extra classes on the <td>. */
  tdClassName?: string;
  /** Extra style on the <td>. */
  cellStyle?: (row: T) => CSSProperties;
  /**
   * The totals cell for this column in the <tfoot>. A node, or a function of
   * ALL the rows the Table was given (every page, not the visible slice; for a
   * server-paged list that is the loaded page). The footer row renders when
   * any column declares one.
   */
  footer?: ReactNode | ((rows: T[]) => ReactNode);
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  /** Stable identity. Never the array index — it breaks on sort. */
  rowKey: (row: T) => TableRowKey;
  /** Row click opens the row's detail. */
  onRowClick?: (row: T) => void;
  /**
   * RIGHT-CLICK: the row's context menu — operations on that row (see
   * ContextMenu). Pair it with useContextMenu: `onRowContextMenu={(row, e) =>
   * menu.openAt(e, row)}`; openAt cancels the browser's own menu. The event is
   * a real contextmenu MouseEvent, so clientX / clientY place the menu.
   *
   * Keyboard: setting it makes each row focusable (Tab reaches it, with a
   * visible ring), and Shift+F10 or the Menu key on a focused row — or on a
   * link or button inside it — opens the same menu, anchored under the row's
   * left edge. A text field inside a row keeps its own menu.
   */
  onRowContextMenu?: (row: T, event: ReactMouseEvent<HTMLTableRowElement>) => void;
  rowStyle?: (row: T) => CSSProperties;
  rowClassName?: (row: T) => string | undefined;
  /** Rows where this returns true float to the top whatever the sort. Ignored
      under manualSort — the caller's comparator owns pinning there. */
  pinToTop?: (row: T) => boolean;

  /** `key` of the sorted column. Marked by color alone. */
  sortCol?: string | null;
  /** Announced via aria-sort, never drawn. */
  sortDir?: "asc" | "desc";
  /** Omit for plain, unsortable headers. */
  onSort?: (key: string) => void;
  /** The caller pre-sorts `rows`; the Table only paints the active header and
      forwards header clicks to onSort. */
  manualSort?: boolean;

  /** EmptyState title when there are no rows. Say WHICH empty this is. */
  emptyText?: string;
  /** Skeleton rows in place of the body while the data is not ready. */
  loading?: boolean;
  /** How many skeleton rows to draw while loading. */
  loadingRows?: number;
  /** Screen-reader name for the table. Visually hidden. */
  caption?: string;
  headerRowStyle?: CSSProperties;

  /** table-layout: fixed + a <colgroup> from each column's `width`. Stops the
      grid re-measuring as rows stream in; only true if widths are declared. */
  fixedLayout?: boolean;
  /** Floor width in px; below it the table scrolls instead of crushing. */
  minWidth?: number;
  /** Caps the scroll box (e.g. "80vh") so a sticky header sticks to it. */
  maxHeight?: string;
  stickyHeader?: boolean;
  /** The identifying column stays put while the table scrolls sideways. */
  stickyFirstColumn?: boolean;

  /** Rows per page. Defaults to the house 100; `null` turns paging off. */
  pageSize?: number | null;
  /** SERVER PAGING: the total row count on the server. Setting it switches the
      Table to server mode — `rows` is taken as the current page, nothing is
      sliced, and the controls are driven by `page` / `onPageChange`. */
  totalRows?: number;
  /** Server mode: the current page, 1-based. */
  page?: number;
  onPageChange?: (page: number) => void;

  /** EXPAND: content for a full-width row under the row. Adds a toggle column;
      with no onRowClick, a row click toggles too. */
  renderExpanded?: (row: T) => ReactNode;
  /** Rows that have nothing to expand. Default: every row. */
  canExpand?: (row: T) => boolean;
  /** Controlled expanded set. Omit for uncontrolled. */
  expandedKeys?: ReadonlySet<TableRowKey>;
  onExpandedChange?: (keys: Set<TableRowKey>) => void;

  /** GROUP: a full-width section row before each group. Groups appear in the
      order their first row appears in `rows`; sorting happens within groups. */
  groupBy?: (row: T) => string;
  /** Section row content. `rows` is every row of the group, not just the page. */
  renderGroupHeader?: (group: string, rows: T[]) => ReactNode;

  /** SELECT: providing either prop adds a checkbox column. The header box
      selects ALL rows the Table was given (every page), not just the visible
      page; a server-paged list therefore selects the loaded page. */
  selectedKeys?: ReadonlySet<TableRowKey>;
  onSelectionChange?: (keys: Set<TableRowKey>) => void;
  /** Rows that cannot be selected. Default: every row. */
  canSelect?: (row: T) => boolean;

  /** On the <table>. `style` is where an app sets `--ui-table-*` overrides. */
  className?: string;
  style?: CSSProperties;
}

/** Set state that is controlled when the caller passes a set, uncontrolled
    otherwise; the change callback fires either way. */
function useKeySet(
  controlled: ReadonlySet<TableRowKey> | undefined,
  onChange: ((keys: Set<TableRowKey>) => void) | undefined,
) {
  const [own, setOwn] = useState<ReadonlySet<TableRowKey>>(() => new Set());
  const value = controlled ?? own;
  const set = (next: Set<TableRowKey>) => {
    if (controlled === undefined) setOwn(next);
    onChange?.(next);
  };
  return [value, set] as const;
}

/**
 * Shift+F10 / the Menu key on a focused row (or a control inside it). Browsers
 * disagree on where — and whether — they fire `contextmenu` for the key, and
 * some report the pointer's last position or 0,0. So the key is taken over:
 * the native event is cancelled and a contextmenu event is dispatched on the
 * row itself, positioned under its left edge, which runs the same
 * onContextMenu handler a right-click does. One code path, one menu position
 * rule. A text field keeps the key — its own menu (paste, spelling) matters
 * more there.
 */
function openMenuFromKeyboard(e: ReactKeyboardEvent<HTMLTableRowElement>) {
  const isMenuKey = e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey);
  if (!isMenuKey) return;
  const t = e.target as HTMLElement;
  if (t.closest("input, textarea, select, [contenteditable='true']")) return;
  e.preventDefault();
  const tr = e.currentTarget;
  const r = tr.getBoundingClientRect();
  tr.dispatchEvent(
    new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: Math.round(r.left + 16),
      clientY: Math.round(r.bottom),
      button: 2,
    }),
  );
}

function compare(
  av: string | number | null | undefined,
  bv: string | number | null | undefined,
  dir: number,
): number {
  // Blanks sink to the bottom in both directions — a blank is not "smallest".
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
  return (av < bv ? -1 : av > bv ? 1 : 0) * dir;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  onRowContextMenu,
  rowStyle,
  rowClassName,
  pinToTop,
  sortCol,
  sortDir = "asc",
  onSort,
  manualSort = false,
  emptyText = "Nothing to show",
  loading = false,
  loadingRows = 5,
  caption,
  headerRowStyle,
  fixedLayout = false,
  minWidth,
  maxHeight,
  stickyHeader = false,
  stickyFirstColumn = false,
  pageSize = DEFAULT_PAGE_SIZE,
  totalRows,
  page,
  onPageChange,
  renderExpanded,
  canExpand,
  expandedKeys,
  onExpandedChange,
  groupBy,
  renderGroupHeader,
  selectedKeys,
  onSelectionChange,
  canSelect,
  className,
  style,
}: TableProps<T>) {
  const idBase = useId();
  const serverMode = totalRows !== undefined;
  const selecting = selectedKeys !== undefined || onSelectionChange !== undefined;
  const expanding = renderExpanded !== undefined;

  const [expanded, setExpanded] = useKeySet(expandedKeys, onExpandedChange);
  const [selected, setSelected] = useKeySet(selectedKeys, onSelectionChange);

  // Sort the FULL list, then group, then page — slicing first and sorting the
  // slice is the bug this ordering prevents.
  const sorted = useMemo(() => {
    if (manualSort) return rows;
    const col = sortCol ? columns.find((c) => c.key === sortCol) : null;
    const acc = col?.sortAccessor;
    if (!acc && !pinToTop) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (pinToTop) {
        const pa = pinToTop(a) ? 0 : 1;
        const pb = pinToTop(b) ? 0 : 1;
        if (pa !== pb) return pa - pb;
      }
      return acc ? compare(acc(a), acc(b), dir) : 0;
    });
  }, [rows, columns, sortCol, sortDir, manualSort, pinToTop]);

  // Groups keep the order of their first row in the INPUT, so a re-sort moves
  // rows within a group and never shuffles the sections themselves.
  const { ordered, groupRows } = useMemo(() => {
    if (!groupBy) return { ordered: sorted, groupRows: null };
    const order = new Map<string, T[]>();
    for (const r of rows) {
      const g = groupBy(r);
      if (!order.has(g)) order.set(g, []);
    }
    for (const r of sorted) order.get(groupBy(r))!.push(r);
    return { ordered: [...order.values()].flat(), groupRows: order };
  }, [rows, sorted, groupBy]);

  // The reset key is the displayed keys in order plus the sort, not array
  // identity — most callers rebuild `rows` every render.
  const resetKey = `${sortCol ?? ""}|${sortDir}|${ordered.map(rowKey).join("\n")}`;
  const pager = usePagination(ordered, serverMode ? null : pageSize, resetKey);

  const serverSize = pageSize != null && pageSize > 0 ? pageSize : null;
  const paging = serverMode
    ? {
        page: page ?? 1,
        pageCount: serverSize ? Math.max(1, Math.ceil(totalRows / serverSize)) : 1,
        total: totalRows,
        pageSize: serverSize,
        onPage: (p: number) => onPageChange?.(p),
      }
    : {
        page: pager.page,
        pageCount: pager.pageCount,
        total: pager.total,
        pageSize: pager.pageSize,
        onPage: pager.setPage,
      };

  // Utility columns (checkbox, expand toggle) lead the data columns.
  const utilCount = (selecting ? 1 : 0) + (expanding ? 1 : 0);
  const span = columns.length + utilCount;
  const utilLeft = (i: number) => `calc(var(--ui-table-util-w) * ${i})`;
  const stuck = (left: string) => (stickyFirstColumn ? { left } : undefined);

  const selectable = useMemo(
    () => (selecting ? rows.filter((r) => !canSelect || canSelect(r)).map(rowKey) : []),
    [selecting, rows, canSelect, rowKey],
  );
  const selectedCount = selectable.filter((k) => selected.has(k)).length;
  const allSelected = selectable.length > 0 && selectedCount === selectable.length;

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) selectable.forEach((k) => next.delete(k));
    else selectable.forEach((k) => next.add(k));
    setSelected(next);
  };
  const flip = (set: ReadonlySet<TableRowKey>, k: TableRowKey) => {
    const next = new Set(set);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    return next;
  };

  const hasFooter = columns.some((c) => c.footer !== undefined);
  const visible = serverMode ? ordered : pager.pageRows;

  const sortableCol = (c: TableColumn<T>) =>
    c.sortable !== false && !!onSort && (manualSort || !!c.sortAccessor);

  const header = (
    <thead data-sticky={stickyHeader || undefined}>
      <tr style={headerRowStyle}>
        {selecting && (
          <th className="ui-table-util" data-stuck={stickyFirstColumn || undefined} style={stuck(utilLeft(0))}>
            <Checkbox
              ariaLabel="Select all rows"
              checked={allSelected}
              indeterminate={selectedCount > 0 && !allSelected}
              disabled={selectable.length === 0}
              onChange={toggleAll}
            />
          </th>
        )}
        {expanding && (
          <th
            className="ui-table-util"
            data-stuck={stickyFirstColumn || undefined}
            style={stuck(utilLeft(selecting ? 1 : 0))}
          >
            <span className="ui-visually-hidden">Details</span>
          </th>
        )}
        {columns.map((c, i) => {
          const sortable = sortableCol(c);
          const active = sortCol === c.key;
          return (
            <th
              key={c.key}
              scope="col"
              data-align={c.align ?? "left"}
              data-active={active || undefined}
              data-sortable={sortable || undefined}
              data-stuck={(stickyFirstColumn && i === 0) || undefined}
              aria-sort={
                active ? (sortDir === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined
              }
              style={{
                width: c.width,
                whiteSpace: c.nowrap ? "nowrap" : undefined,
                ...(i === 0 ? stuck(utilLeft(utilCount)) : null),
              }}
            >
              {sortable ? (
                <button type="button" className="ui-table-sort" onClick={() => onSort!(c.key)}>
                  {c.header}
                </button>
              ) : (
                c.header
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );

  const renderRow = (row: T) => {
    const key = rowKey(row);
    const expandable = expanding && (!canExpand || canExpand(row));
    const isOpen = expandable && expanded.has(key);
    const isSelected = selecting && selected.has(key);
    const rowSelectable = selecting && (!canSelect || canSelect(row));
    const panelId = `${idBase}-x-${key}`;
    const toggle = () => setExpanded(flip(expanded, key));
    const click = onRowClick ? () => onRowClick(row) : expandable ? toggle : undefined;
    const extraClass = rowClassName?.(row);
    const menu = onRowContextMenu
      ? (e: ReactMouseEvent<HTMLTableRowElement>) => onRowContextMenu(row, e)
      : undefined;

    return (
      <Fragment key={key}>
        <tr
          className={extraClass || undefined}
          data-clickable={click ? "" : undefined}
          data-selected={isSelected || undefined}
          data-open={isOpen || undefined}
          onClick={click}
          onContextMenu={menu}
          onKeyDown={menu ? openMenuFromKeyboard : undefined}
          tabIndex={menu ? 0 : undefined}
          style={rowStyle?.(row)}
        >
          {selecting && (
            <td
              className="ui-table-util"
              data-stuck={stickyFirstColumn || undefined}
              style={stuck(utilLeft(0))}
              onClick={(e) => e.stopPropagation()}
            >
              <Checkbox
                ariaLabel="Select row"
                checked={isSelected}
                disabled={!rowSelectable}
                onChange={() => setSelected(flip(selected, key))}
              />
            </td>
          )}
          {expanding && (
            <td
              className="ui-table-util"
              data-stuck={stickyFirstColumn || undefined}
              style={stuck(utilLeft(selecting ? 1 : 0))}
              onClick={(e) => e.stopPropagation()}
            >
              {expandable && (
                <button
                  type="button"
                  className="ui-table-toggle"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? panelId : undefined}
                  aria-label={isOpen ? "Hide details" : "Show details"}
                  onClick={toggle}
                >
                  <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                    <path
                      d="M6 4 L10 8 L6 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </td>
          )}
          {columns.map((c, i) => (
            <td
              key={c.key}
              className={c.tdClassName}
              data-align={c.align}
              data-numeric={c.numeric || undefined}
              data-stuck={(stickyFirstColumn && i === 0) || undefined}
              style={{
                whiteSpace: c.nowrap ? "nowrap" : undefined,
                ...(i === 0 ? stuck(utilLeft(utilCount)) : null),
                ...(c.cellStyle ? c.cellStyle(row) : null),
              }}
            >
              {c.cell(row)}
            </td>
          ))}
        </tr>
        {isOpen && (
          <tr className="ui-table-expanded">
            <td id={panelId} colSpan={span}>
              {renderExpanded!(row)}
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <tbody>
        {Array.from({ length: loadingRows }, (_, r) => (
          <tr key={r}>
            {utilCount > 0 && <td colSpan={utilCount} className="ui-table-util" />}
            {columns.map((c) => (
              <td key={c.key}>
                <Skeleton lines={1} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  } else if (ordered.length === 0) {
    body = (
      <tbody>
        <tr>
          <td colSpan={span} className="ui-table-empty">
            <EmptyState title={emptyText} />
          </td>
        </tr>
      </tbody>
    );
  } else if (groupRows) {
    // One <tbody> per run of a group on this page; a group split across pages
    // repeats its section row at the top of the next page.
    const runs: { group: string; rows: T[] }[] = [];
    for (const r of visible) {
      const g = groupBy!(r);
      const last = runs[runs.length - 1];
      if (last && last.group === g) last.rows.push(r);
      else runs.push({ group: g, rows: [r] });
    }
    body = runs.map((run, i) => {
      const all = groupRows.get(run.group) ?? run.rows;
      return (
        <tbody key={`${run.group}-${i}`}>
          <tr className="ui-table-group">
            <th scope="rowgroup" colSpan={span}>
              {renderGroupHeader ? (
                renderGroupHeader(run.group, all)
              ) : (
                <>
                  {run.group}
                  <span className="ui-table-group-count">{all.length}</span>
                </>
              )}
            </th>
          </tr>
          {run.rows.map(renderRow)}
        </tbody>
      );
    });
  } else {
    body = <tbody>{visible.map(renderRow)}</tbody>;
  }

  const footer =
    hasFooter && !loading && ordered.length > 0 ? (
      <tfoot>
        <tr>
          {utilCount > 0 && <td colSpan={utilCount} className="ui-table-util" />}
          {columns.map((c) => (
            <td key={c.key} data-align={c.align} data-numeric={c.numeric || undefined}>
              {typeof c.footer === "function"
                ? (c.footer as (rows: T[]) => ReactNode)(ordered)
                : c.footer}
            </td>
          ))}
        </tr>
      </tfoot>
    ) : null;

  const table = (
    <table
      className={className ? `ui-table ${className}` : "ui-table"}
      data-fixed={fixedLayout || undefined}
      aria-busy={loading || undefined}
      style={{ ...style, minWidth }}
    >
      {caption && <caption className="ui-visually-hidden">{caption}</caption>}
      {fixedLayout && (
        <colgroup>
          {Array.from({ length: utilCount }, (_, i) => (
            <col key={`u${i}`} style={{ width: "var(--ui-table-util-w)" }} />
          ))}
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
      )}
      {header}
      {body}
      {footer}
    </table>
  );

  // No wrapper element: the table (or its scroll box) and the pagination are
  // siblings in the caller's container, so a parent's spacing utilities and
  // flex gaps land on them exactly as on a bare <table>. The scroll box exists
  // only when asked for; the pagination sits OUTSIDE it so it never scrolls away.
  const scrolls = !!minWidth || !!maxHeight || stickyHeader;
  return (
    <>
      {scrolls ? (
        <div className="ui-table-scroll" style={{ maxHeight }}>
          {table}
        </div>
      ) : (
        table
      )}
      <Pagination
        page={paging.page}
        pageCount={paging.pageCount}
        total={paging.total}
        pageSize={paging.pageSize}
        onPage={paging.onPage}
      />
    </>
  );
}
