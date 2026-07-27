import "./Toast.css";

/**
 * Toast — the notify popup. THIS IS WHAT REPLACES window.alert.
 *
 * That is not a footnote, it is the reason the component exists. LMS #874
 * ("Replace window.alert() with the reusable notify popup app-wide") is still
 * open a year later because nothing ever blocked the native call. Here, lint
 * blocks it from commit one — so this has to be good enough that nobody wants
 * the alert back. It is non-blocking, it is styled, it can carry two lines,
 * and it does not freeze the app.
 *
 * ERRORS SAY WHAT HAPPENED AND WHAT TO DO ABOUT IT. No apologies:
 *   NOT  "Oops! Something went wrong."
 *   YES  title="Couldn't save"
 *        body="You're not a member of this project. Ask Josh to loop you in."
 * `body` is optional in the type and near-mandatory in practice for anything
 * that isn't a plain success.
 *
 * `role` is derived from tone, not exposed as a prop, because getting it wrong
 * is silent: alert interrupts a screen reader mid-sentence and status waits
 * its turn. A failure has earned the interruption; "Task assigned" has not.
 *
 * `muted` (added 2026-07-17 for the voice-command channel) is the quiet one:
 * something happened, nothing is wrong, nothing to do — "Didn't understand
 * that command". Neutral stripe, neutral icon, role="status".
 */

export type ToastTone = "success" | "warn" | "danger" | "muted";

export interface ToastProps {
  tone?: ToastTone;
  /** What happened. Short. */
  title: string;
  /** What to do about it. Skip only when there is genuinely nothing to do. */
  body?: string;
  /** Renders a dismiss x. Omit for a toast that only auto-expires. */
  onDismiss?: () => void;
}

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M20 6 L9 17 l-5 -5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "warn") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "muted") {
    // An "i" in a circle: information, no severity.
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 8h.01M12 12v4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M15 9l-6 6M9 9l6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Toast({ tone = "success", title, body, onDismiss }: ToastProps) {
  return (
    <div
      className="ui-toast"
      data-tone={tone}
      // A failure interrupts; a confirmation waits its turn. See note above.
      role={tone === "danger" ? "alert" : "status"}
    >
      <span className="ui-toast-icon" aria-hidden="true">
        <ToastIcon tone={tone} />
      </span>
      <div className="ui-toast-text">
        <div className="ui-toast-title">{title}</div>
        {body && <div className="ui-toast-body">{body}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="ui-toast-x"
          aria-label={`Dismiss: ${title}`}
          onClick={onDismiss}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M18 6L6 18M6 6l12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
