import type { HTMLAttributes, ReactNode } from "react";
import "./StateFrame.css";

/**
 * StateFrame — the box a whole-area state sits in. Internal: not exported.
 *
 * WHY IT IS ITS OWN PIECE. PageLoader and ErrorPanel stand in for the same
 * content at different moments — loading, then (sometimes) failed. If each
 * centred itself its own way, the swap from one to the other would make the
 * page jump. Both render inside this frame, so the centring and the padding
 * are written once and cannot drift apart.
 *
 *   page    — fills the available height and centres, with generous room.
 *   section — compact, for one panel or card on a page that otherwise loaded.
 */

export type StateFrameSize = "page" | "section";

interface StateFrameProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "className" | "style"> {
  size: StateFrameSize;
  children: ReactNode;
}

export function StateFrame({ size, children, ...rest }: StateFrameProps) {
  return (
    <div {...rest} className="ui-state-frame" data-size={size}>
      {children}
    </div>
  );
}
