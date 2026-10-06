"use client";

import { createContext, useContext, useMemo } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { resolveScale, scaleVars, type ScaleSize, type ScaleValue } from "./presets";

/**
 * Scale — one screen, the same parts, a different size.
 *
 * A wall display, a bench tablet and a desk monitor want the same Button and
 * the same Card at different sizes. Forking a component per screen is the
 * thing the kit exists to stop, so the size is a variable instead: wrap the
 * screen once and every primitive inside it reads the multipliers.
 *
 *   <Scale size="wall">...</Scale>
 *   <Scale size="large" spaceScale={1}>...</Scale>   // bigger type, same gaps
 *
 * HOW: the wrapper sets --ui-type-scale, --ui-space-scale and --ui-icon-scale,
 * and every primitive's stylesheet multiplies its sizes by them (fallback 1).
 * Outside a Scale nothing is set, so nothing changes.
 *
 * A PLAIN BLOCK DIV, NOT display: contents. The variables are inherited, so
 * the wrapper must be a real ancestor in the box tree; className and style
 * pass through for whatever layout the screen needs.
 *
 * PORTALS. A Modal, a Select list, a Tooltip, a ContextMenu and a toast render
 * into <body>, outside the wrapper, so they cannot inherit the variables. Each
 * of those roots reads useScale() and sets the same three variables on itself,
 * so a pop-up opened from a scaled screen matches the screen.
 *
 * NESTING: an inner Scale replaces the outer one's values (it does not
 * multiply them). A screen states its size; it does not inherit a fraction of
 * someone else's.
 */

export type { ScaleSize, ScaleValue } from "./presets";

export interface ScaleProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** The preset. Default "default" (every multiplier 1). */
  size?: ScaleSize;
  /** Overrides the preset's font-size multiplier. */
  typeScale?: number;
  /** Overrides the preset's padding / gap / control-height / width multiplier. */
  spaceScale?: number;
  /** Overrides the preset's icon and graphic-mark multiplier. */
  iconScale?: number;
  children?: ReactNode;
}

const ScaleContext = createContext<ScaleValue | null>(null);

/** The scale in force here, or null outside any <Scale>. */
export function useScale(): ScaleValue | null {
  return useContext(ScaleContext);
}

/**
 * Props for an element that escapes the Scale (a portal root): the data
 * attribute and the three variables merged under the element's own style.
 * Outside a Scale it hands the style back untouched, so the element renders
 * exactly as it did before.
 */
export function scaleRootProps(
  scale: ScaleValue | null,
  style?: CSSProperties,
): { "data-ui-scale"?: ScaleSize; style?: CSSProperties } {
  if (!scale) return { style };
  return {
    "data-ui-scale": scale.size,
    style: { ...(scaleVars(scale) as CSSProperties), ...style },
  };
}

export function Scale({ size = "default", typeScale, spaceScale, iconScale, style, children, ...rest }: ScaleProps) {
  const value = useMemo(
    () => resolveScale(size, { typeScale, spaceScale, iconScale }),
    [size, typeScale, spaceScale, iconScale],
  );
  const root = scaleRootProps(value, style);
  return (
    <ScaleContext.Provider value={value}>
      <div {...rest} data-ui-scale={root["data-ui-scale"]} style={root.style}>
        {children}
      </div>
    </ScaleContext.Provider>
  );
}
