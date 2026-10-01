"use client";

import { useState } from "react";
import { Button } from "../Button/Button";
import type { ButtonSize } from "../Button/Button";

/**
 * ExportButton — the house "Export CSV" control: a secondary Button with a
 * download glyph. One component so every export on every screen reads the
 * same and sits at the same weight (secondary: an export is never the page's
 * primary action).
 *
 * It does not build the file. `onExport` does — usually a call to
 * downloadCsv, sometimes a fetch first. If `onExport` returns a promise the
 * button shows the Button's own loading state until it settles, so a slow
 * export cannot be fired twice. onExport owns its failures and should surface
 * them itself (a toast, an ErrorPanel); the button only clears its spinner.
 */

export interface ExportButtonProps {
  onExport: () => void | Promise<unknown>;
  label?: string;
  size?: ButtonSize;
  disabled?: boolean;
  /** Force the loading state from outside (e.g. a caller-owned save state). */
  loading?: boolean;
}

const DownloadGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </svg>
);


export function ExportButton({
  onExport,
  label = "Export CSV",
  size = "sm",
  disabled = false,
  loading = false,
}: ExportButtonProps) {
  const [busy, setBusy] = useState(false);

  const run = () => {
    const result = onExport();
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setBusy(true);
      (result as Promise<unknown>).then(
        () => setBusy(false),
        () => setBusy(false),
      );
    }
  };

  return (
    <Button
      variant="secondary"
      size={size}
      icon={DownloadGlyph}
      onClick={run}
      disabled={disabled}
      loading={loading || busy}
    >
      {label}
    </Button>
  );
}
