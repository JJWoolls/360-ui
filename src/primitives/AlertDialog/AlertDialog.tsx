"use client";

import { AlertCard, type AlertCardProps, type AlertTone } from "../AlertCard/AlertCard";
import { Button } from "../Button/Button";
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
 *
 * ACKNOWLEDGE (OK-only): pass `okLabel` and no `actions` for a notice that has
 * one answer — "this can't be done, here is why". It draws a single primary
 * button that calls `onClose` and takes focus, so Enter dismisses it. There is
 * no Cancel because there is nothing to cancel; Escape and the backdrop (quiet
 * mode) mean the same thing as OK, since every way out is an acknowledgement.
 */

export interface AlertDialogProps extends AlertCardProps {
  open: boolean;
  onClose: () => void;
  /**
   * OK-only mode: the label of the single acknowledge button ("OK", "Got it").
   * Used only when `actions` is not given. The button calls `onClose`.
   */
  okLabel?: string;
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
  okLabel,
  actions,
  ...card
}: AlertDialogProps) {
  const alarm = emphasis === "alarm";
  const shown =
    actions ??
    (okLabel != null ? (
      <Button variant="primary" autoFocus onClick={onClose}>
        {okLabel}
      </Button>
    ) : undefined);

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
      <AlertCard {...card} actions={shown} emphasis={emphasis} />
    </Modal>
  );
}
