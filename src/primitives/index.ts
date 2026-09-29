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

export { PersonChip, initialsFrom } from "./PersonChip/PersonChip";
export type { PersonChipProps, PersonChipSize } from "./PersonChip/PersonChip";

export { EmptyState } from "./EmptyState/EmptyState";
export type { EmptyStateProps } from "./EmptyState/EmptyState";

export { Spinner, Skeleton } from "./Loading/Loading";
export type { SpinnerProps, SkeletonProps } from "./Loading/Loading";

export { Badge } from "./Badge/Badge";
export type { BadgeProps, BadgeTone, BadgeKind, BadgeSize, BadgePalette } from "./Badge/Badge";

export { Card } from "./Card/Card";
export type { CardProps, CardTone, CardKind } from "./Card/Card";

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

export { Modal } from "./Modal/Modal";
export type { ModalProps, ModalTone } from "./Modal/Modal";

export { DatePicker, DateField, type DatePickerProps, type DateFieldProps } from "./DatePicker/DatePicker";

export { OptionField } from "./OptionPicker/OptionField";
export type { OptionFieldProps } from "./OptionPicker/OptionField";

export { OptionPickerModal } from "./OptionPicker/OptionPickerModal";
export type { OptionPickerModalProps, OptionPickerOption } from "./OptionPicker/OptionPickerModal";

export { Select } from "./Select/Select";
export type { SelectProps, SelectOption } from "./Select/Select";

// Input / Textarea — the house text field, which is the Select's trigger
// without the chevron. They live next to each other in the barrel because they
// must stay identical in shape; see the note at the top of Input.css.
export { Input, Textarea } from "./Input/Input";
export type { InputProps, TextareaProps, InputSize } from "./Input/Input";

export { ContextMenu, useContextMenu } from "./ContextMenu/ContextMenu";
export type { ContextMenuProps, ContextMenuItem } from "./ContextMenu/ContextMenu";
