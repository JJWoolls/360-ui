import { useMemo, useState } from "react";
import { Button } from "../Button/Button";
import "./Pagination.css";

/**
 * Pagination — the house page controls, and the hook that slices for them.
 *
 * THE RULE (Josh, 2026-09-29, standing, every list in both apps): "we always
 * paginate to 100... across the board." That is why DEFAULT_PAGE_SIZE is not
 * a suggestion — the house Table uses it unless a caller opts out with
 * `pageSize={null}`, and the LMS lint ratchet refuses any other page size on a
 * changed line.
 *
 * Search, filters and sort belong to the FULL set: the caller (or the Table)
 * filters and sorts first, then hands the finished list here to be sliced.
 * Slicing first and sorting the slice is the bug this ordering prevents.
 */
export const DEFAULT_PAGE_SIZE = 100;

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
}

/**
 * Previous / Page X of Y / Next, with "Showing X–Y of N". Renders nothing when
 * everything fits on one page, so a short list looks exactly as it always did.
 */
export function Pagination({ page, pageCount, total, pageSize, onPage }: PaginationProps) {
  if (!pageSize || pageCount <= 1) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <span className="ui-pagination-range">
        Showing {fmt(start)}–{fmt(end)} of {fmt(total)}
      </span>
      <div className="ui-pagination-controls">
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
      </div>
    </nav>
  );
}
