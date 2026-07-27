import type { ReactNode } from "react";
import "./Card.css";

/**
 * Card — one number and what it means.
 *
 * The three parts are not decoration: `label` says what is being counted,
 * `value` is the number, `foot` is the detail that makes the number
 * actionable ("3 assigned to Jen", "Oldest 2 days"). A card without a foot is
 * usually a card that hasn't decided what the reader should do about it.
 *
 * TONE IS FOR ALARM, NOT CATEGORY (kind="plain"/"stat"/"tile"). Leave it off and
 * the value is plain — that is the correct default and should be the common case.
 * Colouring every card is the same as colouring none: if Open tasks, Captures and
 * Overdue are all tinted, nothing draws the eye. Reach for a tone only when the
 * number itself is a problem. The EXCEPTION is kind="accent" — there the tint IS
 * the identity of the card (see CardKind below), so a tone is expected, not alarm.
 *
 * KIND is the LMS treatment this card wears — Josh picks the house standards from
 * these named ports; see Card.css for the source file:line and per-variant values.
 */

export type CardTone = "brand" | "danger" | "warn" | "info" | "violet";

/**
 * Which real LMS card treatment to wear. Named after what the card IS, not how
 * big it looks — the look is the consequence of the meaning.
 *
 *   "plain"  — the current in-app card (invented from a mockup, kept as the
 *              default so existing screens render unchanged). NOT an LMS port.
 *   "stat"   — the shared dashboard StatCard: a compact neutral top-grid tile,
 *              icon + label header, the count, hover lifts to secondary + brand.
 *              The one genuinely shared LMS stat card (4 call sites).
 *   "tile"   — jb-dash's 220px centred tile: heavier, sentence-case label, a big
 *              32px number, hover to surface-hover. The most-used LMS treatment
 *              (~34 call sites) but never extracted to a component.
 *   "accent" — josh-dash's tinted card: the whole card is an 8% wash of the tone
 *              with a 25% border; the tint carries the category. Josh likes these.
 *              A third, distinct treatment — not a duplicate of stat or tile.
 */
export type CardKind = "plain" | "stat" | "tile" | "accent";

export interface CardProps {
  /** What is being counted. Uppercased by CSS (except tile) — pass normal prose. */
  label: string;
  /** The number. A string so callers can format ("14", "$7.2M", "—"). */
  value: string;
  /** The detail that makes the number actionable. */
  foot?: string;
  /**
   * Colours per kind: on plain/tile it colours the VALUE; on stat it colours the
   * icon + label (the number stays foreground, matching StatCard); on accent it
   * colours the whole tint (background, border, icon, value). Omit on
   * plain/stat/tile unless the number is a problem; accent defaults to brand.
   */
  tone?: CardTone;
  /** Which LMS treatment to wear. Defaults to "plain" (byte-compatible original). */
  kind?: CardKind;
  /** Optional header glyph (e.g. a lucide icon node). Shown on stat/tile/accent. */
  icon?: ReactNode;
  /**
   * Sits on the value's baseline, to its right. For the counts that qualify the
   * number rather than replace it — the LMS dashboard's rush / at-risk /
   * snoozed pills are the reason this exists.
   *
   * It is NOT a general children slot. A card is a number and what it means; if
   * what you want to put here isn't attached to the number, you want a different
   * component. Omit it and the DOM is unchanged from before this prop existed.
   */
  extra?: ReactNode;
  /**
   * There is nothing here. The card greys out and the value fades nearly into
   * the border, so an empty card stops competing for the eye — Josh's rule,
   * 2026-07-27, promoted from the dashboards where it grew up.
   *
   * EXPLICIT, not inferred from value === "0". A count of zero is usually
   * nothing to see; "$0.00" owed on an overdue account is the opposite, and a
   * component cannot tell those apart from the string. The caller knows.
   *
   * This is NOT how you hide a card. A card never removes itself — whoever
   * builds the list of cards decides which ones exist, because only the row
   * knows whether losing one leaves a hole. See the LMS's own visibleForView
   * predicate, which is the house pattern.
   */
  empty?: boolean;
  /**
   * Makes the card a button. Hover treatment is applied only when clickable, and
   * only for kinds that have one — stat lifts, tile lifts, accent does NOT change
   * on hover (josh-dash's cards are clickable but only fade via transition-colors).
   */
  onClick?: () => void;
}

export function Card({
  label,
  value,
  foot,
  tone,
  kind = "plain",
  icon,
  extra,
  empty = false,
  onClick,
}: CardProps) {
  const clickable = typeof onClick === "function";

  // Plain is the untouched original: same DOM, same classes, data-tone on the
  // value element. Keeps every existing screen call site rendering byte-for-byte.
  if (kind === "plain" && !clickable && !extra && !empty) {
    return (
      <div className="ui-card">
        <div className="ui-card-label">{label}</div>
        <div className="ui-card-value" data-tone={tone}>
          {value}
        </div>
        {foot && <div className="ui-card-foot">{foot}</div>}
      </div>
    );
  }

  const body = (
    <>
      {kind === "plain" ? (
        <div className="ui-card-label">{label}</div>
      ) : (
        <div className="ui-card-head">
          {icon && <span className="ui-card-icon">{icon}</span>}
          <span className="ui-card-label">{label}</span>
        </div>
      )}
      {/* No extra means no wrapper — the value element stays exactly where it
          was, so nothing already on screen shifts. */}
      {extra ? (
        <div className="ui-card-valuerow">
          <div className="ui-card-value" data-tone={tone}>
            {value}
          </div>
          <div className="ui-card-extra">{extra}</div>
        </div>
      ) : (
        <div className="ui-card-value">{value}</div>
      )}
      {foot && <div className="ui-card-foot">{foot}</div>}
    </>
  );

  const dataKind = kind === "plain" ? undefined : kind;

  if (clickable) {
    return (
      <button
        type="button"
        className="ui-card is-clickable"
        data-kind={dataKind}
        data-tone={tone}
        data-empty={empty ? "" : undefined}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }

  return (
    <div
      className="ui-card"
      data-kind={dataKind}
      data-tone={tone}
      data-empty={empty ? "" : undefined}
    >
      {body}
    </div>
  );
}
