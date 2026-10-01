import type { ReactNode } from "react";
import "./SectionLabel.css";

/**
 * SectionLabel — the small heading that sits above a block of content
 * ("Recent Activity", "Notes", "Attachments").
 *
 * WHY IT EXISTS: pages kept hand-rolling this as a span with five utility
 * classes, or an inline-styled heading with its own letter-spacing. Each copy
 * drifted a little — size, weight, colour, gap below — so two sections on one
 * screen stopped matching. One component, one look.
 *
 * TITLE CASE, NEVER UPPERCASE. Pass the words the way they should read
 * ("Recent Activity"); this component does not transform them. Uppercase
 * labels shout, are harder to scan, and hide the difference between a name
 * and a sentence. The same rule the Badge follows.
 *
 * `as` picks the element, not the look. Leave it as a div when the label is
 * only a visual divider; use h2/h3 when the section really is a level in the
 * page outline, so screen readers can jump between sections. The look is
 * identical either way — the heading's UA margins and size are reset.
 *
 * `action` is a right-aligned slot on the same row: a count, a small Button,
 * a "View All" link. It is not a second title.
 */

export type SectionLabelElement = "div" | "h2" | "h3" | "span";

/**
 *   "md" — the default: the size pages were hand-rolling (12px).
 *   "sm" — for dense panels and sidebars (11px).
 */
export type SectionLabelSize = "sm" | "md";

export interface SectionLabelProps {
  /** The label, in Title Case. Rendered as written — never uppercased. */
  children: ReactNode;
  /** Which element to render. Defaults to "div"; use h2/h3 for real outline levels. */
  as?: SectionLabelElement;
  /** Right-aligned slot on the same row — a count or a small control. */
  action?: ReactNode;
  /** "md" (default) or "sm". */
  size?: SectionLabelSize;
}

export function SectionLabel({ children, as = "div", action, size = "md" }: SectionLabelProps) {
  const Tag = as;

  // No action means no row wrapper: the label is the element itself, so a
  // heading stays a heading in the outline rather than a heading inside a div.
  if (!action) {
    return (
      <Tag className="ui-section-label" data-size={size}>
        {children}
      </Tag>
    );
  }

  return (
    <div className="ui-section-label-row">
      <Tag className="ui-section-label" data-size={size}>
        {children}
      </Tag>
      <div className="ui-section-label-action">{action}</div>
    </div>
  );
}
