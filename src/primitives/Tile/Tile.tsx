import type { AnchorHTMLAttributes, ElementType, HTMLAttributes, ReactNode } from "react";
import "./Tile.css";

/**
 * Tile — a clickable card: a settings tile, a choice card, a way into another
 * page. Caption row (optional icon + label, optional badge), then a short
 * value line, then one muted line of description.
 *
 * WHY IT EXISTS: screens kept hand-rolling the same raised, strong-bordered,
 * rounded button-or-link with a brand edge on hover, and each copy picked its
 * own padding, caption style and truncation — or none, so long descriptions
 * stretched their grid track.
 *
 * WHICH ONE TO USE:
 *   - A number and what it means           -> Card / StatCard (also clickable).
 *   - A fenced-off block, nothing to press -> Surface.
 *   - Something to PRESS or GO TO, named by a caption with a short value
 *     ("3 active", "Manage") or a centred choice -> Tile.
 *
 * WHAT IT RENDERS:
 *   - `href`    -> an anchor, drawn by `linkComponent` (a plain <a> without one).
 *                  A link, not a button, so middle-click / open-in-new-tab work.
 *   - `onClick` -> <button type="button">.
 *   - neither   -> a plain div; no hover, no focus — it is a display tile.
 * Pass one of href / onClick, not both; if both arrive, href wins, because a
 * thing that navigates must stay a link.
 *
 * ROUTER-AGNOSTIC, the same way SectionTabs is: the kit never imports a router.
 * Pass your router's link component as `linkComponent`; an app usually wraps
 * Tile once in a thin adapter so pages pass only `href`.
 *
 * TONE colours the icon only. The caption and value stay neutral so a grid of
 * tiles is one quiet block with coloured marks, not a wall of colours.
 *
 * SELECTED is hover, held: the brand edge stays on. On a button it is also
 * announced as aria-pressed, so the state is not carried by colour alone.
 * Left undefined it is not a toggle at all and aria-pressed is omitted.
 *
 * The Tile takes no width. The grid or flex row around it owns the size;
 * `className` is for layout only (grid placement, margin).
 */

export type TileTone = "brand" | "success" | "info" | "warn" | "danger" | "violet" | "muted";

/** "start" — left-aligned settings / navigation tile (default).
 *  "center" — centred choice card; the badge moves to the top-right corner. */
export type TileAlign = "start" | "center";

/** "lg" — 24px, the default.  "md" — 16px, for dense grids. */
export type TilePadding = "md" | "lg";

/** The props Tile hands to `linkComponent`. */
export interface TileLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children"> {
  href: string;
  className: string;
  children: ReactNode;
}

export interface TileProps extends Omit<HTMLAttributes<HTMLElement>, "onClick" | "children"> {
  /** The caption — a name in normal case, small and muted. Not uppercased. */
  label: ReactNode;
  /** Glyph beside the caption, drawn at 15px and coloured by `tone`. */
  icon?: ReactNode;
  /** Colours the icon only. Omit for the neutral muted glyph. */
  tone?: TileTone;
  /** The semibold line under the caption ("3 active", "Manage", "12%"). */
  value?: ReactNode;
  /** One muted line under the value; truncates with an ellipsis. */
  description?: ReactNode;
  /** Right-aligned in the caption row (top-right corner when centred). */
  badge?: ReactNode;
  /** Makes the tile a link. */
  href?: string;
  /** Your router's link component; defaults to a plain <a>. Used only with href. */
  linkComponent?: ElementType<TileLinkProps>;
  /** Passed through to the anchor when `href` is set. */
  target?: string;
  /** Passed through to the anchor when `href` is set. */
  rel?: string;
  /** Makes the tile a button. */
  onClick?: () => void;
  /** Defaults to "start". */
  align?: TileAlign;
  /** Defaults to "lg". */
  padding?: TilePadding;
  /** Holds the brand edge; aria-pressed on a button. */
  selected?: boolean;
  /** Greys the tile out. A disabled link renders without its href, so it
   *  cannot be followed or focused. */
  disabled?: boolean;
  /** Layout only (grid placement, margin). */
  className?: string;
}

export function Tile({
  label,
  icon,
  tone,
  value,
  description,
  badge,
  href,
  linkComponent: LinkComponent = "a",
  target,
  rel,
  onClick,
  align = "start",
  padding = "lg",
  // Not defaulted: undefined means "not a toggle", so aria-pressed is omitted.
  selected,
  disabled = false,
  className,
  ...rest
}: TileProps) {
  const isLink = href != null;
  const isButton = !isLink && typeof onClick === "function";
  const interactive = (isLink || isButton) && !disabled;

  const body = (
    <>
      <span className="ui-tile-head">
        {icon && (
          <span className="ui-tile-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span className="ui-tile-label">{label}</span>
        {badge != null && <span className="ui-tile-badge">{badge}</span>}
      </span>
      {value != null && <span className="ui-tile-value">{value}</span>}
      {description != null && <span className="ui-tile-desc">{description}</span>}
    </>
  );

  const shared = {
    className: className ? `ui-tile ${className}` : "ui-tile",
    "data-tone": tone,
    "data-align": align,
    "data-padding": padding,
    "data-selected": selected ? "" : undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-interactive": interactive ? "" : undefined,
  };

  if (isLink && !disabled) {
    return (
      <LinkComponent {...(rest as Omit<TileLinkProps, "href" | "className" | "children">)} {...shared} href={href} target={target} rel={rel}>
        {body}
      </LinkComponent>
    );
  }

  if (isButton) {
    return (
      <button
        {...(rest as HTMLAttributes<HTMLButtonElement>)}
        {...shared}
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div {...(rest as HTMLAttributes<HTMLDivElement>)} {...shared} aria-disabled={disabled || undefined}>
      {body}
    </div>
  );
}
