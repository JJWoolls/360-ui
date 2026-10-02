import type { ElementType, ReactNode } from "react";
import { activeSectionHref } from "./match";
import type { SectionTabMatch } from "./match";
import "./SectionTabs.css";

/**
 * SectionTabs — the underline strip across the top of a multi-page section
 * ("Overview · Intake · Compare"), one LINK per page, the current page marked
 * with a brand underline.
 *
 * WHY IT IS NOT StatusTabs: StatusTabs picks a slice of a list on the same
 * page — a tablist of buttons whose selection is state. Section tabs move
 * between pages — each one is a real link, so it can be middle-clicked, opened
 * in a new tab, or bookmarked, and the selection is simply the URL. Different
 * semantics, so a different control and a different look.
 *
 * SEMANTICS: a `<nav>` landmark (named by `aria-label`, so it is told apart
 * from the app's main navigation) holding a list of links. The current page's
 * link carries aria-current="page". There is no roving tabindex and no arrow
 * keys: links are ordinary Tab stops, which is what a reader expects of
 * navigation.
 *
 * ROUTER-AGNOSTIC: the kit never imports a router. The caller passes the
 * current `pathname` (or the already-decided `activeHref`) and, if it has one,
 * its router's link component as `linkComponent`; without one a plain `<a>` is
 * drawn. An app usually wraps this once in a thin adapter so pages pass only
 * `items`.
 *
 * WHICH TAB IS ACTIVE: each item matches by "prefix" (default — the tab stays
 * lit on pages beneath it) or "exact" (the section's landing page, whose href
 * is the parent of its siblings). The longest matching href wins; a path no
 * tab claims leaves every tab unlit. See ./match.ts.
 *
 * WRAPS, never scrolls sideways: on a narrow screen the strip grows a line.
 */

export interface SectionTabItem {
  href: string;
  label: ReactNode;
  /** Drawn after the label as a small muted number. Omitted = no count. */
  count?: number;
  /** "prefix" (default) also lights the tab on pages beneath its href;
   *  "exact" lights it only on its own path. */
  match?: SectionTabMatch;
}

/** The props SectionTabs hands to `linkComponent` for each tab. */
export interface SectionTabLinkProps {
  href: string;
  className: string;
  "aria-current"?: "page";
  children: ReactNode;
}

export interface SectionTabsProps {
  items: readonly SectionTabItem[];
  /** The current path; the active tab is worked out from the items' match rules. */
  pathname?: string;
  /** The active tab's href, decided by the caller. Wins over `pathname`. */
  activeHref?: string;
  /** The router's link component (anything that renders an anchor from these
   *  props). Defaults to a plain `<a>`. */
  linkComponent?: ElementType<SectionTabLinkProps>;
  /** Names the landmark — e.g. "Acquisitions sections". */
  "aria-label": string;
}

export function SectionTabs({
  items,
  pathname,
  activeHref,
  linkComponent: LinkComponent = "a",
  "aria-label": ariaLabel,
}: SectionTabsProps) {
  const active =
    activeHref ?? (pathname != null ? activeSectionHref(items, pathname) : undefined);

  return (
    <nav className="ui-section-tabs" aria-label={ariaLabel}>
      <ul className="ui-section-tabs__list">
        {items.map((item) => {
          const current = item.href === active;
          return (
            <li key={item.href} className="ui-section-tabs__item">
              <LinkComponent
                href={item.href}
                className="ui-section-tab"
                aria-current={current ? "page" : undefined}
              >
                <span className="ui-section-tab__label">{item.label}</span>
                {item.count != null && (
                  <span className="ui-section-tab__count">{item.count}</span>
                )}
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
