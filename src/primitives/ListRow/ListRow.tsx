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
   *
   * Optional: a list whose records have no number a person reads (practices,
   * people) leaves it out and the row starts at the marker or the title.
   */
  id?: string;
  /** The type marker's glyph. An inert <svg> using currentColor. */
  icon?: ReactNode;
  /** Tints the icon tile. The type vocabulary (Bug/Feature/Future) maps here. */
  iconTone?: ListRowTone;
  title: string;
  /** A <Badge>. Status, usually. */
  badge?: ReactNode;
  /** Right-aligned, hidden under 640px. Who filed it, usually. */
  meta?: string;
  /** A second, quieter line under the title — a city, a code. Truncates. */
  subtitle?: string;
  /**
   * The row is the current choice in a pick-one list (a picker window, a
   * master list beside its detail). Brand edge and tint, and aria-pressed so
   * a screen reader hears which row is on. Leave undefined on a plain
   * navigation list — that row is not a toggle and must not announce as one.
   */
  selected?: boolean;
  onClick?: () => void;
  /** Double-click — a picker's "choose and close". */
  onDoubleClick?: () => void;
}

export function ListRow({
  id,
  icon,
  iconTone = "muted",
  title,
  badge,
  meta,
  subtitle,
  selected,
  onClick,
  onDoubleClick,
}: ListRowProps) {
  return (
    <button
      type="button"
      className="ui-row"
      aria-pressed={selected}
      data-selected={selected || undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {id != null && <span className="ui-row-id">#{id}</span>}
      {icon && (
        <span className="ui-row-tile" data-tone={iconTone} aria-hidden="true">
          {icon}
        </span>
      )}
      {subtitle ? (
        <span className="ui-row-text">
          <span className="ui-row-title">{title}</span>
          <span className="ui-row-subtitle">{subtitle}</span>
        </span>
      ) : (
        <span className="ui-row-title">{title}</span>
      )}
      {badge}
      {meta && <span className="ui-row-meta">{meta}</span>}
    </button>
  );
}
