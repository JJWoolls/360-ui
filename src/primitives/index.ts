/* ============================================================================
   The primitives barrel
   ----------------------------------------------------------------------------
   Import from here, never from a native element. In a consuming app that reads:

     import { Button, Checkbox, Toggle } from "@360digilab/ui";

   src/primitives/** is the ONE place native elements are legal — that is what a
   primitive IS: the wrapper that contains the native thing so nothing else has
   to. If what you need isn't in this list, STOP and ask Josh, then build it
   HERE and make it the house default. Do not reach for the native control "for
   now" — that step is the one that costs. Each app's own eslint config is what
   enforces it on that side.
   ========================================================================== */

// buttonProps hands the button's look to an element the kit cannot render —
// a Next.js Link, a Tauri navigation anchor. For controls that NAVIGATE, where
// rendering a <button> would take away middle-click and open-in-new-tab.
export { Button, buttonProps } from "./Button/Button";
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize } from "./Button/Button";

export { Checkbox } from "./Checkbox/Checkbox";
export type { CheckboxProps } from "./Checkbox/Checkbox";

export { Toggle } from "./Toggle/Toggle";
export type { ToggleProps } from "./Toggle/Toggle";

// FilterPills — the house multi-select: toggle pills, no "All", double-click or
// shift-click isolates one. Each pill may carry its own identity colour.
export { FilterPills } from "./FilterPills/FilterPills";
export type { FilterPillsProps, FilterPillOption, FilterPillsSize } from "./FilterPills/FilterPills";

// StatusTabs — the house single-select view picker: one segmented row of
// tabs with counts, a real tablist (arrow keys move and select).
export { StatusTabs } from "./StatusTabs/StatusTabs";
export type { StatusTabsProps, StatusTabItem, StatusTabsSize } from "./StatusTabs/StatusTabs";

export { PersonChip, initialsFrom } from "./PersonChip/PersonChip";
export type { PersonChipProps, PersonChipSize } from "./PersonChip/PersonChip";

export { EmptyState } from "./EmptyState/EmptyState";
export type { EmptyStateProps } from "./EmptyState/EmptyState";

export { Spinner, Skeleton } from "./Loading/Loading";
export type { SpinnerProps, SkeletonProps } from "./Loading/Loading";

export { Badge } from "./Badge/Badge";
export type { BadgeProps, BadgeTone, BadgeKind, BadgeSize, BadgePalette } from "./Badge/Badge";

// SectionLabel — the small Title Case heading above a block of content, with
// an optional right-aligned action. Never uppercased.
export { SectionLabel } from "./SectionLabel/SectionLabel";
export type { SectionLabelProps, SectionLabelElement, SectionLabelSize } from "./SectionLabel/SectionLabel";

export { Card } from "./Card/Card";
export type { CardProps, CardTone, CardKind } from "./Card/Card";

// StatCard — the big-number tile on Card: label, value, optional sublabel /
// trend / icon, a Skeleton while loading, a real button when clickable.
export { StatCard } from "./StatCard/StatCard";
export type { StatCardProps, StatCardTrend, StatCardTrendTone } from "./StatCard/StatCard";

export { ListRow } from "./ListRow/ListRow";
export type { ListRowProps, ListRowTone } from "./ListRow/ListRow";

export { Table } from "./Table/Table";
export type { TableProps, TableColumn } from "./Table/Table";

// Pagination — the house 100-per-page rule (Josh, 2026-09-29). The Table uses
// it by default; a list that is not a Table uses the hook and the controls.
export { Pagination, usePagination, DEFAULT_PAGE_SIZE } from "./Pagination/Pagination";
export type { PaginationProps, PaginationState } from "./Pagination/Pagination";

export { Tooltip } from "./Tooltip/Tooltip";
export type { TooltipProps, TooltipPosition } from "./Tooltip/Tooltip";

export { Toast } from "./Toast/Toast";
export type { ToastProps, ToastTone } from "./Toast/Toast";

// Toaster — mount once at the app root; useToast() raises corner pop-outs
// beneath it. Danger stays until dismissed, the rest time out; four at most.
export { Toaster, useToast } from "./Toast/Toaster";
export type { ToasterProps, ToastOptions, ToastApi } from "./Toast/Toaster";

export { Modal } from "./Modal/Modal";
export type { ModalProps, ModalTone } from "./Modal/Modal";

// The alert family — one card, one colour per kind (danger, warn, info,
// success), placed four ways: Toaster in the corner for things that need no
// answer, ErrorPanel in the page when an area fails to load, AlertDialog in the
// centre for a decision, and AlertDialog emphasis="alarm" for a stop-work
// moment. PageLoader shares ErrorPanel's frame so one swaps for the other
// without moving the page.
export { AlertCard } from "./AlertCard/AlertCard";
export type { AlertCardProps, AlertTone, AlertEmphasis } from "./AlertCard/AlertCard";

export { AlertDialog } from "./AlertDialog/AlertDialog";
export type { AlertDialogProps } from "./AlertDialog/AlertDialog";

export { ErrorPanel } from "./ErrorPanel/ErrorPanel";
export type { ErrorPanelProps } from "./ErrorPanel/ErrorPanel";

export { PageLoader } from "./PageLoader/PageLoader";
export type { PageLoaderProps } from "./PageLoader/PageLoader";
export type { StateFrameSize } from "./StateFrame/StateFrame";

// AsyncBoundary — the states of a useAsyncData load in their one right order:
// PageLoader, then ErrorPanel with Try Again, then the caller's EmptyState,
// then the content. Wrap only the area that loads; the header stays outside.
export { AsyncBoundary } from "./AsyncBoundary/AsyncBoundary";
export type { AsyncBoundaryProps } from "./AsyncBoundary/AsyncBoundary";

export { DatePicker, DateField, type DatePickerProps, type DateFieldProps } from "./DatePicker/DatePicker";

export { OptionField } from "./OptionPicker/OptionField";
export type { OptionFieldProps } from "./OptionPicker/OptionField";

export { OptionPickerModal } from "./OptionPicker/OptionPickerModal";
export type { OptionPickerModalProps, OptionPickerOption } from "./OptionPicker/OptionPickerModal";

export { Select } from "./Select/Select";
export type { SelectProps, SelectOption, SelectSize } from "./Select/Select";

// Input / Textarea — the house text field, which is the Select's trigger
// without the chevron. They live next to each other in the barrel because they
// must stay identical in shape; see the note at the top of Input.css.
export { Input, Textarea } from "./Input/Input";
export type { InputProps, TextareaProps, InputSize } from "./Input/Input";

export { ContextMenu, useContextMenu } from "./ContextMenu/ContextMenu";
export type { ContextMenuProps, ContextMenuItem } from "./ContextMenu/ContextMenu";
