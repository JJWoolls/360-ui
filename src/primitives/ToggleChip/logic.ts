/**
 * ToggleChip press arithmetic — pure, so it can be tested without React.
 *
 * A press from "mixed" lands on true: a partial chip is read as "some of this
 * is on", and the press that completes it is the expected one (the same rule
 * as a tri-state checkbox). Boolean states simply flip.
 */

export type ToggleChipState = boolean | "mixed";

export function nextToggleState(selected: ToggleChipState): boolean {
  return selected === "mixed" ? true : !selected;
}
