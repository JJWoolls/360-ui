/**
 * Which look a Button draws — pure attribute arithmetic, kept apart from the
 * component so it can be tested without a DOM.
 *
 * Three vocabularies name a colour: the hierarchy (`variant`), the house tones
 * (`tone`) and an identity colour (`color`). They never combine, except that
 * `color` borrows `variant` for its WEIGHT — how loudly the colour is worn:
 *
 *   color + variant "secondary" (default)  tint + border, the house recipe
 *   color + variant "primary"              solid fill, derived label
 *   color + variant "ghost"                no ground, no border; hover tints
 *
 * The colour itself travels as a custom property, so the CSS can derive every
 * state from it without the component knowing what colour it is.
 */

export type ButtonFill = "tint" | "solid" | "ghost";

export interface ButtonLookInput {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  tone?: string;
  color?: string;
}

export interface ButtonLook {
  "data-variant": string;
  "data-fill"?: ButtonFill;
  /** The identity colour as a custom property, or nothing. */
  colorVar?: { "--ui-btn-color": string };
}

export function buttonLook({ variant, tone, color }: ButtonLookInput): ButtonLook {
  // An empty string is "no colour", so a call site passing an unset lookup
  // falls back to the plain button instead of drawing an invisible one.
  if (color) {
    const fill: ButtonFill =
      variant === "primary" ? "solid" : variant === "ghost" ? "ghost" : "tint";
    return {
      "data-variant": "color",
      "data-fill": fill,
      colorVar: { "--ui-btn-color": color },
    };
  }
  return { "data-variant": tone ?? variant ?? "secondary" };
}
