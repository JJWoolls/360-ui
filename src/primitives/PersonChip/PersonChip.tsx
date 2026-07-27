import "./PersonChip.css";

/**
 * PersonChip — a workspace member, rendered small enough to sit in a row of
 * them. Membership lists, "loop Jen in", assignment fields.
 *
 * No photo is the common case, not the error case: initials on a tinted ground
 * are the design, not a placeholder for a missing image.
 */

export type PersonChipSize = "sm" | "md";

export interface PersonChipProps {
  name: string;
  photoUrl?: string;
  size?: PersonChipSize;
  /** Renders an x. Omit for a display-only chip. */
  onRemove?: () => void;
}

/**
 * First + last initial. Single-word names give one letter — deliberately, since
 * "JO" for "Josh" reads as two people's initials.
 */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PersonChip({
  name,
  photoUrl,
  size = "md",
  onRemove,
}: PersonChipProps) {
  return (
    <span className="ui-person" data-size={size}>
      <span className="ui-person-avatar" aria-hidden="true">
        {photoUrl ? (
          <img className="ui-person-photo" src={photoUrl} alt="" />
        ) : (
          <span className="ui-person-initials">{initialsFrom(name)}</span>
        )}
      </span>
      <span className="ui-person-name">{name}</span>
      {onRemove && (
        <button
          type="button"
          className="ui-person-remove"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
        >
          <svg viewBox="0 0 12 12" focusable="false" aria-hidden="true">
            <path
              d="M3 3 L9 9 M9 3 L3 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
