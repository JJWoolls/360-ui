import type { CSSProperties } from "react";
import { initialsFrom } from "../PersonChip/PersonChip";
import "./Avatar.css";

/**
 * Avatar — one person as a round mark: their photo, else their initials on a
 * tinted ground. The bare circle for lists, headers and author badges; when the
 * name belongs inside a pill, use PersonChip instead.
 *
 * Decorative by default (the name is printed beside it). Standing alone — an
 * author dot, a tech mark in a grid cell — pass decorative={false} so it is
 * announced by name.
 */

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  name: string;
  /** Curated initials (e.g. employees.initials). Default: first + last initial of name. */
  initials?: string | null;
  photoUrl?: string | null;
  /** xs 20, sm 24, md 28, lg 32, xl 56. */
  size?: AvatarSize;
  /**
   * A colour the circle is tinted from (role, location). Text takes the colour,
   * the ground a soft wash of it. Default: brand.
   */
  tint?: string | null;
  decorative?: boolean;
  className?: string;
}

export function Avatar({
  name,
  initials,
  photoUrl,
  size = "md",
  tint,
  decorative = true,
  className,
}: AvatarProps) {
  const text = (initials ?? "").trim() || initialsFrom(name);
  const style = tint ? ({ "--ui-avatar-tint": tint } as CSSProperties) : undefined;
  return (
    <span
      className={["ui-avatar", className].filter(Boolean).join(" ")}
      data-size={size}
      data-tinted={tint ? "" : undefined}
      style={style}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      {photoUrl ? (
        <img className="ui-avatar-photo" src={photoUrl} alt="" />
      ) : (
        <span className="ui-avatar-initials">{text}</span>
      )}
    </span>
  );
}
