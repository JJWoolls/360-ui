import "./Loading.css";

/**
 * Loading — Spinner + Skeleton.
 *
 * WHY THIS IS A PRIMITIVE: feedback #1141 was exactly a missing loading state.
 * The page had no way to say "not ready", so it rendered what it had — which
 * was the WRONG DATA, shown confidently. A user cannot tell stale from real.
 * "Not ready" has to be as easy to render as the data itself, or it won't be.
 *
 * Spinner = an action you are waiting on. Skeleton = a shape you already know
 * (a list, a card) that is still filling in. Prefer Skeleton for content: it
 * holds layout, so nothing jumps when the data lands.
 */

export interface SpinnerProps {
  size?: "sm" | "md";
  /** Announced to screen readers. Defaults to "Loading". */
  label?: string;
}

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <span className="ui-spinner" data-size={size} role="status">
      <span className="ui-spinner-ring" aria-hidden="true" />
      <span className="ui-visually-hidden">{label}</span>
    </span>
  );
}

export interface SkeletonProps {
  /** How many bars to stack — one per expected row. */
  lines?: number;
  /** Bar height. `text` for a line of copy, `block` for a card/thumbnail. */
  variant?: "text" | "block";
}

export function Skeleton({ lines = 3, variant = "text" }: SkeletonProps) {
  // aria-hidden: a skeleton is a shape, not content. The Spinner's role="status"
  // is what should speak; a screen reader reading N empty bars is noise.
  return (
    <div className="ui-skeleton" data-variant={variant} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="ui-skeleton-bar" />
      ))}
    </div>
  );
}
