"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { Tooltip } from "../Tooltip/Tooltip";
import {
  SWATCH_TONES,
  SWATCH_TONE_LABELS,
  isSwatchTone,
  parseSwatchValue,
  swatchCss,
  type SwatchValue,
} from "./logic";
import "./ColorSwatch.css";

/**
 * ColorSwatchPicker — the house way to choose a colour someone stores (a hold
 * type, a tag, a category). A row of round swatches, one per house tone and
 * accent hue, and a last "Custom" swatch that opens the system colour chooser.
 *
 * WHY TONE NAMES. A stored hex is frozen: it ignores the person's palette and
 * the light theme, and two screens drift the moment one is retinted. A stored
 * tone name ("warn") is drawn by the token, so every reader follows the theme.
 * Custom hex stays as the escape hatch for a colour no tone names. Read a
 * stored value back with swatchCss() / swatchTint() — never by hand.
 *
 * The row is a radiogroup: one tab stop, arrows move and choose, as RadioGroup.
 * The native colour input lives here, inside the primitive, so no page holds
 * one.
 */

export interface ColorSwatchPickerProps {
  /** A tone name, a "#rrggbb" custom colour, or null when unset. */
  value: string | null;
  onChange: (value: SwatchValue | null) => void;
  /** Offer the Custom swatch. Default true. */
  allowCustom?: boolean;
  /** Offer a "None" swatch that clears the value. Default false. */
  allowNone?: boolean;
  /** Names the group for assistive tech ("Hold Type Colour"). */
  ariaLabel: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function ColorSwatchPicker({
  value,
  onChange,
  allowCustom = true,
  allowNone = false,
  ariaLabel,
  disabled = false,
  size = "md",
}: ColorSwatchPickerProps) {
  const parsed = parseSwatchValue(value);
  const custom = parsed != null && !isSwatchTone(parsed) ? parsed : null;
  const colorRef = useRef<HTMLInputElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  type Slot = { key: string; label: string; pick: () => void; on: boolean; css?: string; kind: "tone" | "none" | "custom" };
  const slots: Slot[] = [
    ...(allowNone
      ? [{ key: "none", label: "None", pick: () => onChange(null), on: parsed == null, kind: "none" as const }]
      : []),
    ...SWATCH_TONES.map(t => ({
      key: t,
      label: SWATCH_TONE_LABELS[t],
      pick: () => onChange(t),
      on: parsed === t,
      css: swatchCss(t),
      kind: "tone" as const,
    })),
    ...(allowCustom
      ? [{
          key: "custom",
          label: custom ? `Custom ${custom}` : "Custom",
          pick: () => colorRef.current?.click(),
          on: custom != null,
          css: custom ?? undefined,
          kind: "custom" as const,
        }]
      : []),
  ];

  const onIndex = slots.findIndex(s => s.on);
  const tabStop = onIndex >= 0 ? onIndex : 0;

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const j = (i + step + slots.length) % slots.length;
    refs.current[j]?.focus();
    if (slots[j].kind !== "custom") slots[j].pick(); // arrows never pop the system chooser
  }

  return (
    <div className="ui-swatches" role="radiogroup" aria-label={ariaLabel} data-size={size} aria-disabled={disabled || undefined}>
      {slots.map((s, i) => (
        <Tooltip key={s.key} label={s.label}>
          <button
            ref={el => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={s.on}
            aria-label={s.label}
            className="ui-swatch"
            data-kind={s.kind}
            data-on={s.on || undefined}
            disabled={disabled}
            tabIndex={i === tabStop ? 0 : -1}
            style={s.css ? { ["--ui-swatch" as string]: s.css } : undefined}
            onKeyDown={e => onKeyDown(e, i)}
            onClick={s.pick}
          >
            {s.kind === "custom" && !custom && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
            {s.kind === "none" && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="M5 19 19 5" />
              </svg>
            )}
          </button>
        </Tooltip>
      ))}
      {allowCustom && (
        <input
          ref={colorRef}
          type="color"
          className="ui-swatch-native"
          tabIndex={-1}
          aria-hidden="true"
          value={custom && custom.length === 7 ? custom : "#7c3aed"}
          onChange={e => onChange(e.target.value.toLowerCase() as `#${string}`)}
        />
      )}
    </div>
  );
}
