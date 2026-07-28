import type { CSSProperties, ReactNode } from "react";
import "./Badge.css";

/**
 * Badge — a tinted label. Ported from the LMS's StatusBadge
 * (components/status-badge.tsx + STATUS_CONFIG / STAGE_CONFIG in
 * lib/constants.ts). Josh picked this treatment on 2026-07-16 from four real
 * LMS variants shown side by side.
 *
 * A BADGE NEVER HAS A BORDER. Border means pressable — that's the house rule
 * (see Button.css). If it has an edge, it's a button; if it doesn't, it's a
 * label that does nothing. Do not add a bordered badge variant.
 *
 * WHY `tone` AND NOT A COLOR: callers say what a thing IS ("this is a bug"),
 * never what it looks like. `tone="danger"` survives a map swap and a redesign;
 * `color="red"` survives neither.
 *
 * COLOR IS NEVER THE MESSAGE. `children` is required and the word always
 * carries the meaning — the tone is reinforcement for people who can see it.
 * Roughly 1 in 12 men can't separate the danger tone from the brand one.
 *
 * NOT this component: jb-dash's filter pills. Those are clickable controls with
 * on/off states — they get their own FilterChip primitive and are supposed to
 * look heavier. Don't fold them in here.
 */

export type BadgeTone = "brand" | "danger" | "warn" | "info" | "violet" | "muted";

/**
 * What the badge is SAYING. This is deliberately not a `shape` prop.
 *
 * Shape is the consequence, not the choice. If callers could pass
 * `shape="oval"` they'd pick by taste and the distinction would be gone inside
 * a month — which is exactly how the LMS ended up with four badges. Say what it
 * means; the look follows.
 *
 *   "status" — what a thing IS right now. Live, changes over time.
 *              Open · Out for Try-In · Closed · Cancelled.
 *              -> square + dot. The dot is what reads as "live".
 *
 *   "stage"  — where a thing IS in the pipeline. A position on a journey.
 *              Intake · Design · Mfg · Final QC · Shipping.
 *              -> oval, no dot.
 *
 *   "label"  — what a thing is CALLED. A fixed category; nothing changes.
 *              Bug · Feature · Future · Audit.
 *              -> square, no dot.
 *
 * Status and stage exist as separate kinds for a concrete reason: they appear
 * TOGETHER on a case row. Rendered the same, you can't tell at a glance which
 * one you're reading. The shape is the tell.
 */
export type BadgeKind = "label" | "status" | "stage";

/**
 * How dense the surrounding text is — NOT how important the badge is.
 *
 *   "md" — the default and the LMS's real status-badge size. A badge sitting
 *          in prose, in a header, or on a card, where it is one of the larger
 *          things in view.
 *   "sm" — a badge inside a dense data row, where 11px text and 10px of side
 *          padding make a flag heavier than the case number beside it. The LMS
 *          drew its in-table flags at this size long before the kit existed.
 *
 * Josh, 2026-07-28: "maybe the badge should be resizable and not always a
 * standard size." Two steps, not a free number — a size prop that takes any
 * value is how a design system loses a scale. Pick the one that matches the
 * row, not the one that makes this badge stand out; importance is `tone`.
 */
export type BadgeSize = "sm" | "md";

export interface BadgeProps {
  /** What the thing IS. Never a color name. */
  tone?: BadgeTone;
  /** What the badge is saying. Drives the shape — see BadgeKind. */
  kind?: BadgeKind;
  /**
   * How dense its surroundings are. Defaults to "md".
   *
   * A NUMBER sets the badge's type size in px at the call site, and the rest
   * of the badge follows it — padding, gap and dot are all in em, so one
   * number produces a badge in proportion rather than four values that can
   * disagree with each other.
   *
   * Josh, 2026-07-28: "can we pick the size when we put them into place...
   * wherever it's being used has the ability to set the dimensions." Asked for
   * directly, after being told the cost: two badges on one screen CAN now be
   * different sizes for no reason, which is the thing a named step prevents.
   * Reach for "sm" or "md" first and pass a number only when neither fits.
   */
  size?: BadgeSize | number;
  /** The word. Required — the color is never the message on its own. */
  children: ReactNode;
}

export function Badge({ tone = "muted", kind = "label", size = "md", children }: BadgeProps) {
  const custom = typeof size === "number";
  return (
    <span
      className="ui-badge"
      data-tone={tone}
      data-kind={kind}
      data-size={custom ? "custom" : size}
      style={custom ? ({ "--ui-badge-size": `${size}px` } as CSSProperties) : undefined}
    >
      {/* Decorative: the word already carries the meaning, so the dot must not
          be announced to a screen reader as a separate thing. */}
      {kind === "status" && <span className="ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
