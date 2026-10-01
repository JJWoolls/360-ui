import { Spinner } from "../Loading/Loading";
import { StateFrame, type StateFrameSize } from "../StateFrame/StateFrame";
import "./PageLoader.css";

/**
 * PageLoader — "this area is not ready yet", for a whole page or one section.
 *
 * It sits in the same frame as ErrorPanel, so when a load fails and one is
 * swapped for the other, nothing on the page moves. Use it when the shape of
 * what is coming is not known; when it is (a list, a card), a Skeleton holds
 * the layout better.
 *
 * The label is shown under the spinner when given, and is what a screen
 * reader hears either way. Say what is loading if it helps ("Loading
 * schedule"); a bare "Loading" is fine for a whole page.
 */

export interface PageLoaderProps {
  /** Shown under the spinner and announced. Omitted = announced "Loading". */
  label?: string;
  size?: StateFrameSize;
}

export function PageLoader({ label, size = "page" }: PageLoaderProps) {
  return (
    <StateFrame size={size} aria-busy="true">
      <Spinner size="md" label={label ?? "Loading"} />
      {/* aria-hidden: the Spinner's status already speaks this label; saying
          it twice is noise. */}
      {label && (
        <span className="ui-page-loader-label" aria-hidden="true">
          {label}
        </span>
      )}
    </StateFrame>
  );
}
