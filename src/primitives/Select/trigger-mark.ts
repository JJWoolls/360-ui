/**
 * Which marks the CLOSED trigger draws before the selected label.
 *
 * The trigger repeats the chosen row's mark (dot, icon, avatar, thumbnail) so
 * the field reads the same as the row that was picked — a colour-coded list
 * otherwise loses its colour the moment it closes. On a searchable Select the
 * open state is typing mode: the mark steps aside so the field reads as a
 * search, not a choice already made.
 */
export interface TriggerMarkInput {
  /** The selected option, or undefined when nothing is picked. */
  selected?: { leading?: unknown; imageUrl?: string | null };
  searchable: boolean;
  open: boolean;
}

export interface TriggerMarks {
  leading: boolean;
  thumb: boolean;
}

export function triggerMarks({
  selected,
  searchable,
  open,
}: TriggerMarkInput): TriggerMarks {
  if (!selected || (searchable && open)) return { leading: false, thumb: false };
  return {
    leading: selected.leading != null,
    thumb: selected.imageUrl !== undefined,
  };
}
