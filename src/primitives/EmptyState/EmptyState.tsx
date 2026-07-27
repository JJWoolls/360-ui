import type { ReactNode } from "react";
import "./EmptyState.css";

/**
 * EmptyState — small, one line of text, NO illustration.
 *
 * WHY IT EXISTS: a blank screen has three meanings — no data yet, filtered to
 * nothing, or broken — and the user cannot tell which. The empty state's whole
 * job is to say which one. That is why `title` is required and why the copy
 * should be specific ("No messages in this loop yet", not "Nothing here").
 *
 * WHY IT IS SMALL, NO ILLUSTRATION (Josh's constraint): a big friendly drawing
 * makes "broken" look like "fine". The state is information, not decoration.
 *
 * NEVER RENDER THIS WHILE LOADING. An empty state during a pending fetch is a
 * lie — it says "there is nothing" when the truth is "we don't know yet". Show
 * <Spinner /> or <Skeleton /> until the data has actually resolved, THEN decide
 * whether it's empty. This is the #1141 failure wearing a different hat.
 *
 *   if (loading) return <Skeleton />;
 *   if (!rows.length) return <EmptyState title="No cases match this filter" />;
 */

export interface EmptyStateProps {
  /** Say WHICH empty this is. Required — that's the point of the component. */
  title: string;
  /** Optional second line: what to do about it. */
  body?: string;
  /** A <Button>. The way out of the empty state, if there is one. */
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="ui-empty" role="status">
      <p className="ui-empty-title">{title}</p>
      {body && <p className="ui-empty-body">{body}</p>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}
