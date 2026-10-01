import type { ReactNode } from "react";
import { AlertCard } from "../AlertCard/AlertCard";
import { Button } from "../Button/Button";
import { StateFrame, type StateFrameSize } from "../StateFrame/StateFrame";

/**
 * ErrorPanel — a page or section that failed to load.
 *
 * It replaces the content that could not be fetched, in the same place and
 * frame the PageLoader held a moment ago. It is never a blank area and never
 * an EmptyState: "nothing here" and "this broke" are different news, and a
 * person acts on them differently.
 *
 * The ways out are buttons, not advice in the text: Try Again when a retry
 * can work, Go Back when the person needs to leave. Try Again is the primary
 * and comes LAST, where the eye lands.
 *
 * role="alert": the failure interrupts a screen reader, as a danger Toast does.
 */

export interface ErrorPanelProps {
  /** What failed. Defaults to a plain "This couldn't load". */
  title?: string;
  /** What to do about it, if more than the buttons say. */
  message?: ReactNode;
  /** Renders a Try Again button. */
  onRetry?: () => void;
  /** Renders a Go Back button. */
  onBack?: () => void;
  size?: StateFrameSize;
}

export function ErrorPanel({
  title = "This couldn't load",
  message,
  onRetry,
  onBack,
  size = "page",
}: ErrorPanelProps) {
  const actions =
    onRetry || onBack ? (
      <>
        {onBack && <Button onClick={onBack}>Go Back</Button>}
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <StateFrame size={size} role="alert">
      <AlertCard tone="danger" title={title} message={message} actions={actions} />
    </StateFrame>
  );
}
