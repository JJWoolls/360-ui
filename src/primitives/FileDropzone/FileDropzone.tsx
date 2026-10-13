"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from "react";
import { acceptFiles, fileMatchesAccept } from "./accept";
import "./FileDropzone.css";

/**
 * FileDropzone — the house file picker: drop files on it, or click (or press
 * Enter / Space) to browse.
 *
 * This is a primitive, so it is the place a native <input type="file"> is
 * legal. The input is hidden and only ever opened by the zone; everything the
 * user sees and focuses is the zone itself, a role="button" with the kit's
 * focus ring, so Tab reaches it and the keyboard opens the same picker a click
 * does.
 *
 * WHY IT FILTERS. `accept` goes to the input as the picker's hint AND is
 * applied to every file that arrives, dropped or picked (see accept.ts): the
 * browser enforces it on neither path. Rejected files never reach `onFiles`,
 * which is only called when at least one file survived; they go to `onReject`
 * instead, so the caller can say why nothing happened — a drop that does
 * nothing and says nothing reads as a broken zone. Single-file zones (the
 * default) pass the first accepted file.
 *
 * WHY THE INPUT IS RESET. A file input only fires `change` when its value
 * changes, so picking the same file twice in a row would do nothing the
 * second time — after a failed upload, the retry. The value is cleared after
 * every pick.
 *
 * The drag highlight is the brand tint on a brand dashed edge, the same hue the
 * kit uses for focus: "this is where it will land". A counter, not a boolean,
 * tracks the drag, because dragenter / dragleave also fire as the pointer
 * crosses the zone's own children and a boolean would flicker.
 *
 *   <FileDropzone accept=".csv,text/csv" onFiles={([f]) => importCsv(f)}
 *     hint="CSV, up to 5 MB" />
 */

/** "md" (default) for a page or a form; "sm" for a modal or a dense panel. */
export type FileDropzoneSize = "sm" | "md";

export interface FileDropzoneProps {
  /** The native accept grammar: extensions (".pdf") and MIME types ("image/*"). */
  accept?: string;
  /** Allow several files at once. Defaults to false: one file per pick. */
  multiple?: boolean;
  /** The accepted files. Never called with an empty list. */
  onFiles: (files: File[]) => void;
  /** Files that did not match `accept`, from the same drop or pick. Called
   *  whether or not anything was accepted; never with an empty list. */
  onReject?: (files: File[]) => void;
  disabled?: boolean;
  /** Main line. Defaults to "Drop files here or click to browse". */
  label?: ReactNode;
  /** Secondary line — what is accepted, a size limit. */
  hint?: ReactNode;
  /** Shown above the label, in the hint colour (brand while dragging). */
  icon?: ReactNode;
  size?: FileDropzoneSize;
  /** Extra classes for layout from the caller (grid placement, margin). */
  className?: string;
  /** When the visible label is not enough to name the control. */
  "aria-label"?: string;
}

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  onReject,
  disabled = false,
  label = "Drop files here or click to browse",
  hint,
  icon,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);

  function deliver(list: FileList | null) {
    if (!list || disabled) return;
    const all = Array.from(list);
    const files = acceptFiles(all, accept, multiple);
    const rejected = all.filter((f) => !fileMatchesAccept(f, accept));
    if (rejected.length > 0) onReject?.(rejected);
    if (files.length > 0) onFiles(files);
  }

  function browse() {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // Space must not scroll the page
      browse();
    }
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    depth.current += 1;
    setDragging(true);
  }

  // Without preventDefault here the browser refuses the drop and opens the
  // file in the tab instead.
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = disabled ? "none" : "copy";
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (disabled) return;
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    depth.current = 0;
    setDragging(false);
    deliver(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    deliver(e.target.files);
    e.target.value = "";
  }

  return (
    <div
      className={className ? `ui-dropzone ${className}` : "ui-dropzone"}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      data-size={size}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onClick={browse}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {icon != null && (
        <span className="ui-dropzone-icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="ui-dropzone-label">{label}</span>
      {hint != null && <span className="ui-dropzone-hint">{hint}</span>}
      <input
        ref={inputRef}
        type="file"
        className="ui-dropzone-input"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
        // The zone already handled the click; the input's own click must not
        // bubble back up and open the picker a second time.
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
