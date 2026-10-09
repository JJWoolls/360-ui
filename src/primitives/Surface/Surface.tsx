import type { HTMLAttributes, ReactNode } from "react";
import "./Surface.css";

/**
 * Surface — a plain bordered box: card ground, default border, rounded corners,
 * and nothing else. No heading, no number, no header row.
 *
 * WHY IT EXISTS: screens kept hand-writing the same two inline declarations
 * (card background + 1px border) on a div to fence off a block. Every copy
 * picked its own radius and padding, so neighbouring boxes stopped matching.
 *
 * WHICH ONE TO USE:
 *   - A number and what it means          -> Card / StatCard.
 *   - A block with its own icon + heading  -> the app's ContentPanel.
 *   - A small heading over loose content   -> SectionLabel (no box at all).
 *   - Just a fenced-off area, no heading   -> Surface. Put a SectionLabel
 *     inside it if the block later needs a name.
 *
 * `tone="sunken"` is the inset ground (--surface-inset) for a box that sits
 * INSIDE another surface — a read-only detail well, a summary block —
 * so it reads as recessed rather than as a second card stacked on the first.
 *
 * `as` picks the element, not the look: section/article/aside when the box is
 * a real landmark or outline region, li inside a list. The look is identical.
 *
 * The Surface takes no width. The grid or flex row around it owns the size,
 * the same rule Card follows.
 */

export type SurfaceElement = "div" | "section" | "article" | "aside" | "li" | "header" | "footer";

/**
 *   "none" — no padding (the content brings its own, e.g. a Table or list).
 *   "sm"   — 12px, for dense panels.
 *   "md"   — 16px, the default; matches Card.
 *   "lg"   — 24px, for a roomy form or summary block.
 */
export type SurfacePadding = "none" | "sm" | "md" | "lg";

/**
 *   "default" — the card ground.
 *   "sunken"  — the inset ground, for a box nested inside another surface.
 */
export type SurfaceTone = "default" | "sunken";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  /** Which element to render. Defaults to "div". */
  as?: SurfaceElement;
  /** Inner padding step. Defaults to "md". */
  padding?: SurfacePadding;
  /** Ground colour. Defaults to "default". */
  tone?: SurfaceTone;
  /** Extra classes for layout from the caller (grid placement, gap, margin). */
  className?: string;
  children?: ReactNode;
}

export function Surface({
  as = "div",
  padding = "md",
  tone = "default",
  className,
  children,
  ...rest
}: SurfaceProps) {
  const Tag = as;
  return (
    <Tag
      {...rest}
      className={className ? `ui-surface ${className}` : "ui-surface"}
      data-padding={padding}
      data-tone={tone === "default" ? undefined : tone}
    >
      {children}
    </Tag>
  );
}
