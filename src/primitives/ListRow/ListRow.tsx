import type { ReactNode } from "react";
import "./ListRow.css";

/**
 * ListRow — the feedback-list row: id, type marker, title, status, who.
 *
 * THE ID SITS FIRST, AT A FIXED WIDTH (Josh's constraint, and the reason this
 * component exists rather than a div per screen). Left-justified inside that
 * fixed box, so "#77" and "#1168" both start on the same rail and every icon
 * tile after them stays aligned no matter how many digits the id has. Right-
 * justifying the id would align the digits and misalign the markers — the
 * markers are what you actually scan down.
 *
 * `meta` (who) is the first thing to go under 640px. It is the least load-
 * bearing thing in the row: you can find a row without knowing who filed it,
 * but not without the id or the title.
 *
 * The whole row is one button. Not a div with an onClick — a real button, so
 * Enter and Space work and a screen reader announces it as actionable. Nothing
 * focusable may go inside it; a button inside a button is invalid HTML and the
 * inner one becomes unreachable. Badges and tiles are inert spans for exactly
 * that reason.
 */

export type ListRowTone = "brand" | "danger" | "warn" | "info" | "violet" | "muted";

export interface ListRowProps {
  /**
   * The bare id — "1168", NOT "#1168". The row renders the hash itself.
   *
   * Two reasons it works this way. The hash is house vocabulary (ids are
   * #-prefixed everywhere, same as case numbers), so owning it here means no
   * caller can ship a bare "1168" that reads as a quantity. And a literal
   * "#1168" in a call site is indistinguishable from a 4-digit hex color —
   * lint flags it, correctly, and the honest fix is to stop writing colors and
   * ids in the same shape rather than to teach the linter to look away.
   */
  id: string;
  /** The type marker's glyph. An inert <svg> using currentColor. */
  icon?: ReactNode;
  /** Tints the icon tile. The type vocabulary (Bug/Feature/Future) maps here. */
  iconTone?: ListRowTone;
  title: string;
  /** A <Badge>. Status, usually. */
  badge?: ReactNode;
  /** Right-aligned, hidden under 640px. Who filed it, usually. */
  meta?: string;
  onClick?: () => void;
}

export function ListRow({
  id,
  icon,
  iconTone = "muted",
  title,
  badge,
  meta,
  onClick,
}: ListRowProps) {
  return (
    <button type="button" className="ui-row" onClick={onClick}>
      <span className="ui-row-id">#{id}</span>
      {icon && (
        <span className="ui-row-tile" data-tone={iconTone} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ui-row-title">{title}</span>
      {badge}
      {meta && <span className="ui-row-meta">{meta}</span>}
    </button>
  );
}
