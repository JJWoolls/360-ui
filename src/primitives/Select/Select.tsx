"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import "./Select.css";

/**
 * Select — the inline house select. NEVER a native <select>.
 *
 * Ported from the LMS StyledSelect (lab-portal/components/styled-select.tsx),
 * the dominant inline select there (130 call sites vs SearchableSelect's 76).
 * Josh's standing preference is the MODAL picker (OptionField +
 * OptionPickerModal) — reach for this only where an inline dropdown is truly
 * the right shape, and know its fate is pending Josh's ruling.
 *
 * Anatomy (all LMS): a <button> trigger with a chevron, and a portaled,
 * fixed-position popover that flips upward when fewer than 250px remain below,
 * repositions on any scroll/resize, and closes on outside mousedown.
 * `searchable` (opt-in, like the LMS) adds a filter box that autofocuses on
 * open and resets on close. Options may carry `group` for labeled sections.
 *
 * Additions over the LMS StyledSelect (reported, not silent): Escape closes
 * the popover — its sibling SearchableSelect already did this.
 */

export interface SelectOption {
  value: string;
  /** Human-readable. Title Case, per house rule. */
  label: string;
  /** Optional section header this option renders under. */
  group?: string;
}

export interface SelectProps {
  options: SelectOption[];
  /** Controlled value; "" shows the placeholder. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Adds the filter box. LMS default is off; most call sites leave it off. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // When searchable, live-filter by case-insensitive substring on label (LMS).
  const visibleOptions =
    searchable && search.trim()
      ? options.filter((o) =>
          o.label.toLowerCase().includes(search.trim().toLowerCase()),
        )
      : options;

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current || !isOpen) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 250;

    setDropdownStyle({
      position: "fixed",
      minWidth: Math.max(rect.width, 140),
      left: rect.left,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, [isOpen]);

  // Reposition on any ancestor scroll (capture) and on resize — the popover is
  // position:fixed, so it must chase its trigger.
  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const handleReposition = () => updateDropdownPosition();
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, updateDropdownPosition]);

  // Outside mousedown closes — checked against BOTH the trigger container and
  // the portaled popover, since they live in different DOM branches.
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset the search whenever the popover closes; focus it on open (deferred
  // until the portal has mounted).
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    } else if (searchable) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
    }
  };

  // Group options if any carry a group (LMS behavior).
  const hasGroups = visibleOptions.some((o) => o.group);
  let groupedOptions: { group: string; items: SelectOption[] }[] = [];
  if (hasGroups) {
    const groupMap = new Map<string, SelectOption[]>();
    visibleOptions.forEach((o) => {
      const g = o.group || "";
      if (!groupMap.has(g)) groupMap.set(g, []);
      groupMap.get(g)!.push(o);
    });
    groupedOptions = Array.from(groupMap.entries()).map(([group, items]) => ({
      group,
      items,
    }));
  }

  const renderOption = (option: SelectOption) => (
    <button
      key={option.value}
      type="button"
      className="ui-select-row"
      data-selected={value === option.value || undefined}
      onClick={() => handleSelect(option.value)}
    >
      <svg
        className="ui-select-check"
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
      <span className="ui-select-row-label">{option.label}</span>
    </button>
  );

  const dropdown = isOpen ? (
    <div
      ref={dropdownRef}
      className="ui-select-panel"
      style={dropdownStyle}
      onKeyDown={handleKeyDown}
    >
      {searchable && (
        <div className="ui-select-searchwrap">
          <input
            ref={searchInputRef}
            type="text"
            className="ui-select-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Filter options"
          />
        </div>
      )}
      <div className="ui-select-list">
        {visibleOptions.length === 0 ? (
          <div className="ui-select-empty">
            {searchable && search.trim() ? "No Matches" : "No Options"}
          </div>
        ) : hasGroups ? (
          groupedOptions.map(({ group, items }) => (
            <div key={group}>
              {group && <div className="ui-select-group">{group}</div>}
              {items.map(renderOption)}
            </div>
          ))
        ) : (
          visibleOptions.map(renderOption)
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className="ui-select" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="ui-select-trigger"
        data-placeholder={selectedOption ? undefined : true}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
      >
        <span className="ui-select-trigger-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className="ui-select-chevron"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m6 9 6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {typeof window !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}
