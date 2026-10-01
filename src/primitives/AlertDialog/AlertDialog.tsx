"use client";

import { AlertCard, type AlertCardProps, type AlertTone } from "../AlertCard/AlertCard";
import { Modal, type ModalTone } from "../Modal/Modal";

/**
 * AlertDialog — a decision in the middle of the screen, drawn as an AlertCard.
 *
 * BUILT ON Modal, NOT BESIDE IT. The overlay, focus trap, Escape handling,
 * stacking and scroll lock are the hard parts of any dialog, and the Modal
 * already gets them right — a second overlay would be a second set of those
 * bugs. Modal's `bare` mode drops its own surface, head and footer so the card
 * is the whole dialog, with no box drawn inside a box.
 *
 * QUIET vs ALARM:
 *   quiet — an ordinary decision. Backdrop and Escape both close, as any
 *           dialog does; the actions are still the real answer.
 *   alarm — a stop-work moment. The backdrop goes darker and takes the tone,
 *           and neither a click outside nor Escape dismisses it: only one of
 *           the actions does. Something that must be acknowledged cannot be
 *           acknowledged by a stray click. Give it at least one action, or it
 *           cannot be closed at all.
 *
 * `onClose` is what the backdrop and Escape call in quiet mode. Actions call
 * their own handlers and close the dialog themselves.
 */

export interface AlertDialogProps extends AlertCardProps {
  open: boolean;
  onClose: () => void;
}

/** The kit has no success token; success is drawn in brand everywhere. */
const BACKDROP_TONE: Record<AlertTone, ModalTone> = {
  danger: "danger",
  warn: "warn",
  info: "info",
  success: "brand",
};

export function AlertDialog({
  open,
  onClose,
  emphasis = "quiet",
  ...card
}: AlertDialogProps) {
  const alarm = emphasis === "alarm";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={card.title}
      bare
      width={420}
      closeOnBackdrop={!alarm}
      closeOnEscape={!alarm}
      backdropTone={alarm ? BACKDROP_TONE[card.tone] : undefined}
    >
      <AlertCard {...card} emphasis={emphasis} />
    </Modal>
  );
}
