import type { CSSProperties, ReactNode } from "react";
import "./Badge.css";

/**
 * Badge — a tinted label. Ported from the LMS's StatusBadge
 * (components/status-badge.tsx + STATUS_CONFIG / STAGE_CONFIG in
 * lib/constants.ts). Josh picked this treatment on 2026-07-16 from four real
 * LMS variants shown side by side.
 *
 * A BADGE NEVER HAS A BORDER. Border means pressable — that's the house rule
 * (see Button.css). If it has an edge, it's a button; if it doesn't, it's a
 * label that does nothing. Do not add a bordered badge variant.
 *
 * WHY `tone` AND NOT A COLOR: callers say what a thing IS ("this is a bug"),
 * never what it looks like. `tone="danger"` survives a map swap and a redesign;
 * `color="red"` survives neither.
 *
 * COLOUR CARRIES MEANING — Josh, 2026-07-28: "colour absolutely means
 * something and we could use it." An earlier version of this comment claimed
 * colour is never the message on its own and presented that as a house rule.
 * It was not one; it was this file's own invention, and it was used to argue
 * against a design Josh wanted. Colour-only signals are allowed in this house.
 *
 * What is still true and is why `children` is required: a BADGE is a word on a
 * ground, so if you are drawing one, put the word in it. Something that has no
 * word to say is not a badge — it is a dot, a stripe or a toned value, and
 * those are fine, they are just not this component.
 *
 * NOT this component: jb-dash's filter pills. Those are clickable controls with
 * on/off states — they get their own FilterChip primitive and are supposed to
 * look heavier. Don't fold them in here.
 */

export type BadgeTone = "brand" | "danger" | "warn" | "info" | "violet" | "muted";

/**
 * What the badge is SAYING. This is deliberately not a `shape` prop.
 *
 * Shape is the consequence, not the choice. If callers could pass
 * `shape="oval"` they'd pick by taste and the distinction would be gone inside
 * a month — which is exactly how the LMS ended up with four badges. Say what it
 * means; the look follows.
 *
 *   "status" — what a thing IS right now. Live, changes over time.
 *              Open · Out for Try-In · Closed · Cancelled.
 *              -> square + dot. The dot is what reads as "live".
 *
 *   "facet"  — WHICH ONE of an axis a thing is filed under. Department,
 *              location, pipeline stage: the answers to "where does this
 *              live", the things you sort and filter by.
 *              -> pill, no dot.
 *
 *   "label"  — what a thing is CALLED. A fixed tag; nothing changes.
 *              Bug · Feature · Future · Audit.
 *              -> square, no dot.
 *
 * "facet" REPLACED "stage" on 2026-07-28. Josh, looking at a case row where
 * department and location were square and stage was a pill: "I think we should
 * pick one — department, location and stages are kind of like our core sorting
 * things to decide where something lives." They are one class of thing, so they
 * must not render as three; and the name of the class is not "stage", which is
 * only one of its members.
 *
 * The pill is the shape they share, because these are what you filter by and a
 * pill reads as a chip. Status keeps its own shape for the original reason —
 * status and stage sit on the same case row, and rendered alike you cannot tell
 * which you are reading. The DOT is what carries that now.
 */
export type BadgeKind = "label" | "status" | "facet";

/**
 * The two sizes the LMS actually draws, as named shortcuts. Any other size is
 * a number of px — see the `size` prop.
 *
 *   "md" — the default, and the LMS's real status-badge size.
 *   "sm" — the size the LMS drew its in-table flags at (RUSH, HOLD, shipping).
 *
 * Josh, 2026-07-28: "I want them to look the same and have the same layout but
 * different sizes are fine." Size is free; the treatment is not.
 */
export type BadgeSize = "sm" | "md";

/**
 * A palette IDENTITY — which member of which named colour family this badge is.
 *
 * Josh, 2026-07-28: "a badge needs to be able to accept identity from a
 * palette, so that if it's being used for one thing it gets that palette of
 * colors, if it's being used for another thing it gets that palette of colors."
 *
 * WHY THIS IS NOT A SIXTH TONE. `tone` is a STATUS vocabulary — five ways of
 * saying how alarmed to be. A department, a location and a pipeline stage are
 * not degrees of alarm; they are peer identities in a set, and the set is
 * bigger than five. Collapsing seven departments onto five tones puts two of
 * them in the same colour in a column whose entire job is telling them apart.
 *
 * The value is `family-member`, matching the token pair an app already
 * publishes: `palette="dept-implant"` reads `var(--dept-implant)` for the text
 * and `rgba(var(--dept-implant-rgb), 0.12)` for the ground — the same 12% tint
 * recipe every tone uses, so a palette badge is the same badge wearing a
 * different colour.
 *
 * THE KIT DOES NOT KNOW YOUR FAMILIES, and that is deliberate: an app owns its
 * tokens and the kit only reads them (incident 1616). Publish `--x` and
 * `--x-rgb` and the badge can wear it. If the pair does not exist the badge
 * falls back to the muted treatment rather than rendering colourless — an
 * invalid var() is dropped silently by the browser, and a badge that vanished
 * would be indistinguishable from one nobody styled.
 *
 * Mutually exclusive with `tone` — a badge saying "this is the Implant
 * department" is not also saying "this is a danger". Passing both will not
 * compile.
 */
export type BadgePalette = `${string}-${string}`;

/**
 * Colour comes from EITHER the status vocabulary or a palette identity, never
 * both. Written as a union so passing both is a compile error rather than a
 * question the component has to answer at runtime — the same shape the Checkbox
 * uses for label-or-ariaLabel.
 */
type BadgeColour =
  | { tone?: BadgeTone; palette?: never }
  | { palette: BadgePalette; tone?: never };

export type BadgeProps = BadgeColour & {
  /** What the badge is saying. Drives the shape — see BadgeKind. */
  kind?: BadgeKind;
  /**
   * How big this badge is. "sm", "md" (default), or a number of px.
   *
   * A NUMBER sets the type size at the call site and the rest of the badge
   * follows it — padding, gap and dot are all in em. That is the whole point:
   * one number, and the badge keeps its proportions.
   *
   * SIZE IS FREE; THE LOOK IS NOT. Josh, 2026-07-28: "I don't see any reason
   * why they can't be [different sizes]. I want them to look the same and have
   * the same layout but different sizes are fine." So two badges sitting side
   * by side at different sizes is not a smell — a badge in a dense table row
   * SHOULD be smaller than one in a header. What must never vary is the
   * treatment: same tint recipe, same shape rules, same proportions.
   *
   * This is why the size knob is one number rather than a padding/gap/radius
   * set. Anything that would let a call site change the LOOK belongs on tone
   * or kind, where it means something, or nowhere at all.
   */
  size?: BadgeSize | number;
  /** The word. Required — the color is never the message on its own. */
  children: ReactNode;
};

export function Badge({ tone, palette, kind = "label", size = "md", children }: BadgeProps) {
  const custom = typeof size === "number";

  // A palette badge is coloured inline because the family names belong to the
  // consuming app, not to this file — there is no fixed set to write rules for.
  // The fallbacks matter more than they look: an undefined token makes the
  // whole declaration invalid and the browser drops it without a word, so a
  // typo would otherwise render a colourless badge that looks deliberate.
  const style: CSSProperties = {};
  if (custom) (style as Record<string, string>)["--ui-badge-size"] = `${size}px`;
  if (palette) {
    style.color = `var(--${palette}, var(--text-tertiary))`;
    style.background = `rgba(var(--${palette}-rgb, var(--muted-rgb)), 0.12)`;
  }

  return (
    <span
      className="ui-badge"
      // Falling back to muted here keeps the CSS honest: with a palette there
      // is no tone, and an element with neither would have no ground at all.
      data-tone={palette ? undefined : tone ?? "muted"}
      data-kind={kind}
      data-size={custom ? "custom" : size}
      style={custom || palette ? style : undefined}
    >
      {/* Decorative: the word already carries the meaning, so the dot must not
          be announced to a screen reader as a separate thing. */}
      {kind === "status" && <span className="ui-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
