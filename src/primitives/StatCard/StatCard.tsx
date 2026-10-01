import type { ReactNode } from "react";
import { Card } from "../Card/Card";
import type { CardKind, CardTone } from "../Card/Card";
import { Skeleton } from "../Loading/Loading";
import "./StatCard.css";

/**
 * StatCard — the big-number tile: what is counted, the number, and the line
 * that makes it actionable.
 *
 * WHY IT EXISTS: dashboards and finance pages hand-rolled this tile ~30 times —
 * a bordered div, a 24-32px bold number, a small label, sometimes a click.
 * Every copy drifted in padding, weight and empty treatment. This is the one
 * copy, built on Card so the four Card treatments (plain/stat/tile/accent)
 * stay the only looks there are.
 *
 * WHAT IT ADDS TO CARD:
 *   - `loading` swaps the number for a Skeleton bar, so the tile keeps its
 *     shape while data lands and never shows a confident wrong "0".
 *   - `sublabel` and `trend` share the foot line (a trend reads "▲ 12% vs last
 *     week" and is toned good/bad, not up/down — down is good for remakes).
 *   - `value` may be a number; it is shown as given (format before passing).
 *
 * The card takes no width. The grid owns the size. Colour goes on the value
 * OR the label (Card's tone rules), never both. Empty dims, never hides.
 * A clickable StatCard is a real <button> (Card renders one for onClick).
 */

export type StatCardTrendTone = "good" | "bad" | "neutral";

export interface StatCardTrend {
  /** Which way the number moved. Draws the arrow only. */
  direction: "up" | "down" | "flat";
  /** The words: "12% vs last week". */
  text: string;
  /** Whether that move is good news. Defaults to neutral (no colour). */
  tone?: StatCardTrendTone;
}

export interface StatCardProps {
  /** What is being counted. */
  label: string;
  /** The number, already formatted. A number is shown as-is. */
  value: ReactNode;
  /** The detail under the number ("3 assigned to Jen"). */
  sublabel?: ReactNode;
  /** Movement since the last period, shown on the foot line. */
  trend?: StatCardTrend;
  /** Header glyph (e.g. a lucide icon node). */
  icon?: ReactNode;
  /** Alarm colour — see Card. Omit unless the number is a problem (accent excepted). */
  tone?: CardTone;
  /** Which Card treatment to wear. Defaults to "stat". */
  kind?: CardKind;
  /** Counts that qualify the number (rush / at-risk pills), on its baseline. */
  extra?: ReactNode;
  /** Nothing here — the card dims. The caller decides; zero is not always empty. */
  empty?: boolean;
  /** Still fetching: the number becomes a Skeleton bar and extra/trend hide. */
  loading?: boolean;
  /** Makes the card a real button. */
  onClick?: () => void;
  /** A filter card that is currently on (only with onClick). */
  selected?: boolean;
}

const ARROW: Record<StatCardTrend["direction"], string> = { up: "▲", down: "▼", flat: "–" };

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  icon,
  tone,
  kind = "stat",
  extra,
  empty,
  loading = false,
  onClick,
  selected,
}: StatCardProps) {
  const shownValue = loading ? (
    <span className="ui-stat-card-skeleton" role="status" aria-label={`Loading ${label}`}>
      <Skeleton lines={1} variant="text" />
    </span>
  ) : (
    value
  );

  const showTrend = !loading && trend;
  const foot =
    sublabel != null || showTrend ? (
      <span className="ui-stat-card-foot">
        {showTrend && (
          <span className="ui-stat-card-trend" data-tone={trend.tone ?? "neutral"}>
            <span aria-hidden="true">{ARROW[trend.direction]}</span> {trend.text}
          </span>
        )}
        {sublabel != null && <span>{sublabel}</span>}
      </span>
    ) : undefined;

  return (
    <Card
      label={label}
      value={shownValue}
      foot={foot}
      tone={tone}
      kind={kind}
      icon={icon}
      extra={loading ? undefined : extra}
      empty={!loading && empty}
      onClick={onClick}
      selected={selected}
    />
  );
}
