import { useMemo, useState } from "react";
import { Button } from "../Button/Button";
import "./Pagination.css";

/**
 * Pagination — the house page controls, and the hook that slices for them.
 *
 * THE RULE (Josh, 2026-11-06, replacing 100 of 2026-09-29): "Let's set it to
 * 25 and see how that goes. But I think it should be able to be different for
 * different tables." Every list starts at DEFAULT_PAGE_SIZE (25); the reader
 * picks 25 / 50 / 100 from the page controls, and the house Table remembers the
 * choice per table. A caller may start a table at another PAGE_SIZE_OPTIONS
 * value; `pageSize={null}` opts out of paging.
 *
 * Search, filters and sort belong to the FULL set: the caller (or the Table)
 * filters and sorts first, then hands the finished list here to be sliced.
 * Slicing first and sorting the slice is the bug this ordering prevents.
 */
export const DEFAULT_PAGE_SIZE = 25;
/** The sizes a reader can pick from the page controls. */
export const PAGE_SIZE_OPTIONS: readonly number[] = [25, 50, 100];

const SIZE_STORE = "ui.pageSize.";

/**
 * The rows-per-page a reader chose for one table, remembered in this browser.
 * `storageKey` names the table; without one the choice lasts while the screen
 * is open. Returns the size to use and the setter the page controls call.
 */
export function usePageSizeChoice(
  initial: number | null,
  storageKey?: string,
): [number | null, (size: number) => void] {
  const [chosen, setChosen] = useState<number | null>(() => {
    if (initial == null || !storageKey || typeof window === "undefined") return null;
    try {
      const saved = Number(window.localStorage.getItem(SIZE_STORE + storageKey));
      return PAGE_SIZE_OPTIONS.includes(saved) ? saved : null;
    } catch {
      return null;
    }
  });
  const set = (size: number) => {
    setChosen(size);
    if (!storageKey || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SIZE_STORE + storageKey, String(size));
    } catch {
      /* storage blocked: the choice still holds for this screen */
    }
  };
  return [initial == null ? null : (chosen ?? initial), set];
}

export interface PaginationState<T> {
  /** The rows of the current page — the whole list when pagination is off. */
  pageRows: T[];
  /** 1-based, always within 1..pageCount. */
  page: number;
  pageCount: number;
  total: number;
  /** null = pagination off. */
  pageSize: number | null;
  setPage: (page: number) => void;
}

/**
 * Slices `rows` to the current page.
 *
 * `resetKey` is what "the data or the sort changed" means to the caller. When
 * it changes, the view goes back to page 1. It is a STRING on purpose: most
 * callers rebuild their row array on every render (`rows.filter(...)` inline),
 * so resetting on array identity would throw the reader back to page 1 every
 * time anything on the screen re-rendered. The house Table builds it from the
 * row keys in their displayed order plus the sort, so a new filter, a new sort
 * or a row arriving resets, and an unrelated re-render does not.
 */
export function usePagination<T>(
  rows: T[],
  pageSize: number | null = DEFAULT_PAGE_SIZE,
  resetKey?: string,
): PaginationState<T> {
  const [page, setPageState] = useState(1);
  const [seenKey, setSeenKey] = useState(resetKey);

  // Reset during render rather than in an effect, so the reader never sees a
  // frame of the new data on the old page number.
  let current = page;
  if (resetKey !== seenKey) {
    setSeenKey(resetKey);
    setPageState(1);
    current = 1;
  }

  const size = pageSize != null && pageSize > 0 ? pageSize : null;
  const total = rows.length;
  const pageCount = size ? Math.max(1, Math.ceil(total / size)) : 1;
  // Clamp: a list that shrank under the reader lands on its last real page.
  const clamped = Math.min(Math.max(1, current), pageCount);

  const pageRows = useMemo(
    () => (size ? rows.slice((clamped - 1) * size, clamped * size) : rows),
    [rows, size, clamped],
  );

  return {
    pageRows,
    page: clamped,
    pageCount,
    total,
    pageSize: size,
    setPage: (p: number) => setPageState(Math.min(Math.max(1, p), pageCount)),
  };
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  /** null = pagination off; renders nothing. */
  pageSize: number | null;
  onPage: (page: number) => void;
  /** Shows the Rows 25 / 50 / 100 picker; called with the size picked. */
  onPageSize?: (size: number) => void;
}

/**
 * Previous / Page X of Y / Next, with "Showing X–Y of N", and the Rows picker
 * when `onPageSize` is given. Renders nothing when the list fits in the
 * smallest page, so a short list looks exactly as it always did.
 */
export function Pagination({ page, pageCount, total, pageSize, onPage, onPageSize }: PaginationProps) {
  if (!pageSize) return null;
  const picker = !!onPageSize && total > PAGE_SIZE_OPTIONS[0];
  if (pageCount <= 1 && !picker) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <span className="ui-pagination-range">
        Showing {fmt(start)}–{fmt(end)} of {fmt(total)}
      </span>
      {picker && (
        <div className="ui-pagination-sizes" role="group" aria-label="Rows per page">
          <span className="ui-pagination-sizes-label">Rows</span>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              className="ui-pagination-size"
              aria-pressed={n === pageSize}
              onClick={() => n !== pageSize && onPageSize!(n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      {pageCount > 1 && <div className="ui-pagination-controls">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <span className="ui-pagination-page" aria-live="polite">
          Page {fmt(page)} of {fmt(pageCount)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>}
    </nav>
  );
}
