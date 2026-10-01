import type { ReactNode } from "react";
import type { AsyncData } from "../../hooks/useAsyncData";
import { Button } from "../Button/Button";
import { ErrorPanel } from "../ErrorPanel/ErrorPanel";
import { PageLoader } from "../PageLoader/PageLoader";
import type { StateFrameSize } from "../StateFrame/StateFrame";
import "./AsyncBoundary.css";

/**
 * AsyncBoundary — renders the right state for a useAsyncData result.
 *
 * WHY IT EXISTS. The order of the states is the rule, and it is easy to get
 * backwards one screen at a time:
 *
 *   1. loading  -> PageLoader. Never an EmptyState while the answer is not in:
 *                  "we don't know yet" is not "there is nothing".
 *   2. error    -> ErrorPanel with Try Again wired to reload(). A failed load
 *                  never falls through to an empty list.
 *   3. empty    -> the caller's EmptyState, when `isEmpty` says so.
 *   4. data     -> children(data).
 *
 * Writing that order once means every screen gets it right by using this, and
 * the loader and the error panel share one frame (StateFrame), so the swap
 * between them does not move the page.
 *
 * It renders ONLY the area that loads. The page's header stays outside it, so
 * the person keeps the title, the back arrow and the way to report a problem
 * while the content is loading or broken.
 *
 * A refresh that keeps previous data shows the data, not the loader — that is
 * the point of `refreshing`. A refresh that FAILS while earlier data is still
 * held (`stale`) keeps that data on screen under a slim notice with Try Again.
 * Replacing it with the ErrorPanel would blank a board that polls every few
 * seconds on one dropped request; the notice still says plainly that what is
 * shown may be out of date. With nothing held, a failure is the ErrorPanel.
 */

export interface AsyncBoundaryProps<D> {
  state: Pick<AsyncData<D>, "data" | "loading" | "error" | "reload"> &
    Partial<Pick<AsyncData<D>, "stale">>;
  /** Rendered once data is in. Receives data with `undefined` ruled out. */
  children: (data: NonNullable<D>) => ReactNode;
  /** Said under the loader and announced. */
  loadingLabel?: string;
  /** ErrorPanel title. Defaults to ErrorPanel's own. */
  errorTitle?: string;
  /** True when the loaded data has nothing to show. */
  isEmpty?: (data: NonNullable<D>) => boolean;
  /** What to render when isEmpty is true — usually an EmptyState. */
  empty?: ReactNode;
  /** page fills the area; section is compact, for one panel. */
  size?: StateFrameSize;
}

export function AsyncBoundary<D>({
  state,
  children,
  loadingLabel,
  errorTitle,
  isEmpty,
  empty,
  size = "page",
}: AsyncBoundaryProps<D>) {
  const { data, loading, error, reload, stale } = state;
  const held = data !== undefined && data !== null;

  if (error && !(stale && held)) {
    return (
      <ErrorPanel
        title={errorTitle}
        message={error.message}
        onRetry={() => void reload()}
        size={size}
      />
    );
  }
  if (loading || !held) {
    return <PageLoader label={loadingLabel} size={size} />;
  }
  const loaded = data as NonNullable<D>;
  const body =
    isEmpty && empty !== undefined && isEmpty(loaded) ? empty : children(loaded);
  if (!error) return <>{body}</>;
  return (
    <>
      <div className="ui-async-stale" role="alert">
        <span className="ui-async-stale__text">
          Couldn't refresh. Showing the last data that loaded.
        </span>
        <Button size="xs" onClick={() => void reload()}>
          Try Again
        </Button>
      </div>
      {body}
    </>
  );
}
