"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { Modal } from "../Modal/Modal";
import "./OptionPickerModal.css";

/**
 * OptionPickerModal — the picker half of the house modal-picker pattern.
 *
 * Ported from the LMS (lab-portal/components/OptionPickerModal.tsx): a small
 * single-select modal that stacks above whatever opened it. Pick an option ->
 * onChange fires, then the modal closes. The search box appears automatically
 * only when there are more than 8 options (LMS rule), filtering by
 * case-insensitive substring on the label.
 *
 * Built on the house Modal, so stacking, Escape-closes-top-only, focus trap
 * and focus return all come from there.
 *
 * Keyboard: ArrowUp/ArrowDown move focus through the option rows, Enter picks
 * (Enter in the search box picks the first match), Escape closes (Modal).
 */

export interface OptionPickerOption {
  value: string;
  /** Human-readable. Title Case, per house rule. */
  label: string;
}

export interface OptionPickerModalProps {
  open: boolean;
  title: string;
  options: OptionPickerOption[];
  value: string | null;
  /** An option was picked. Fires, then the modal closes itself via onClose. */
  onChange: (value: string) => void;
  onClose: () => void;
  /** Allow the search box (it still only renders past 8 options). */
  search?: boolean;
  emptyText?: string;
  /** Glyph for the Modal head tile. An inert <svg> using currentColor. */
  icon?: ReactNode;
}

export function OptionPickerModal({
  open,
  title,
  options,
  value,
  onChange,
  onClose,
  search = true,
  emptyText = "No Options",
  icon,
}: OptionPickerModalProps) {
  const [q, setQ] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // A reopened picker starts with a clean search, like the LMS's (which
  // remounts each time it is conditionally rendered).
  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  // Focus the search box on open (LMS autoFocus); with no search box, focus
  // the current selection so arrows start from it. Runs synchronously: React
  // fires the child Modal's move-focus-in effect (which grabs the first
  // focusable — the close X) BEFORE this parent effect, so this one wins.
  useEffect(() => {
    if (!open) return;
    if (searchRef.current) {
      searchRef.current.focus();
      return;
    }
    const first = listRef.current?.querySelector<HTMLButtonElement>(
      ".ui-optionpicker-row",
    );
    const selected = listRef.current?.querySelector<HTMLButtonElement>(
      ".ui-optionpicker-row[data-selected]",
    );
    (selected ?? first)?.focus();
  }, [open]);

  const filtered = q.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(q.trim().toLowerCase()),
      )
    : options;

  const pick = (v: string) => {
    onChange(v);
    onClose();
  };

  const rows = (): HTMLButtonElement[] =>
    Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        ".ui-optionpicker-row",
      ) ?? [],
    );

  // Arrows rove focus through the rows; a focused row is a <button>, so Enter
  // on it clicks natively. Enter while still in the search box picks the
  // first match. Escape is the Modal's job (top-of-stack only).
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const r = rows();
      if (r.length === 0) return;
      const i = r.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        i === -1
          ? e.key === "ArrowDown"
            ? 0
            : r.length - 1
          : Math.min(Math.max(i + (e.key === "ArrowDown" ? 1 : -1), 0), r.length - 1);
      r[next]?.focus();
      return;
    }
    if (
      e.key === "Enter" &&
      (e.target as HTMLElement).tagName === "INPUT" &&
      filtered.length > 0
    ) {
      e.preventDefault();
      pick(filtered[0].value);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} icon={icon}>
      <div onKeyDown={onKeyDown}>
        {search && options.length > 8 && (
          <div className="ui-optionpicker-search">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle
                cx="11"
                cy="11"
                r="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.3-4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              aria-label="Search options"
            />
          </div>
        )}

        <div className="ui-optionpicker-list" ref={listRef}>
          {filtered.length === 0 ? (
            <div className="ui-optionpicker-empty">{emptyText}</div>
          ) : (
            filtered.map((o) => {
              const selected = value === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  className="ui-optionpicker-row"
                  data-selected={selected || undefined}
                  onClick={() => pick(o.value)}
                >
                  <span className="ui-optionpicker-row-label">{o.label}</span>
                  {selected && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        d="M20 6 9 17l-5-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
