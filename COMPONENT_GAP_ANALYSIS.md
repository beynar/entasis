# Component Gap Analysis — svelte-pro vs entasis

Comparison of `svelte-pro/src/lib/components` against `src/lib/components` (2026-07-02).
AI elements (`svelte-pro/src/lib/ai-elements`) deliberately excluded.

## Missing from our lib

### Overlays / navigation

| Component                                | Notes                                                               |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Command                                  | Command palette (cmdk-style): filterable list, keyboard nav, groups |
| ContextMenu                              | Right-click menu — our Menu/PopupMenu are dropdown-only             |
| Menubar                                  | App-style horizontal menu bar                                       |
| NavigationMenu                           | Site nav with panels                                                |
| HoverCard                                | Rich preview card on hover                                          |
| Drawer / Sheet                           | Edge-anchored sliding panels                                        |
| ResponsiveDialog / ResponsiveAlertDialog | Dialog on desktop ↔ drawer on mobile                                |

### Data / display

| Component                            | Notes                                                      |
| ------------------------------------ | ---------------------------------------------------------- |
| Chart                                |                                                            |
| DataTable                            | TanStack-powered; we only have plain `Table`               |
| Diff                                 | Code diff viewer; we have `Code` only                      |
| Tree                                 |                                                            |
| Pagination                           |                                                            |
| Empty                                | Empty-state block (icon + title + description + actions)   |
| Kbd                                  | Keyboard-key badge                                         |
| Item / ItemGroup / ItemSeparator     | Generic list-row primitives                                |
| InputGroup (+ Addon / Button / Text) | Input with attached affordances                            |
| Sidebar (+ SidebarMenuButton)        | Full app-shell sidebar                                     |
| Resizable                            | Resizable split panes                                      |
| Spinner                              | Standalone component — we only ship a spinner _attachment_ |

### Form

| Component                | Notes |
| ------------------------ | ----- |
| _None currently tracked_ |       |

## Near-equivalents (present under a different name — not gaps)

| svelte-pro                                                                                                    | entasis                           |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Progress                                                                                                      | Meter                            |
| AlertDialog                                                                                                   | Confirmation                     |
| DropdownMenu / AnchoredPopup                                                                                  | Menu / PopupMenu                 |
| Sonner                                                                                                        | Toast                            |
| Toggle / ToggleGroup                                                                                          | ToggleButton / ToggleButtonGroup |
| Field* granular parts                                                                                         | Form/Field                       |
| Checkbox, Combobox, DatePicker, Dropzone, Select, Switch, Textarea, RadioGroup, Input, Calendar, NativeSelect | Form/* inputs                    |
| Breadcrumb                                                                                                    | Breadcrumbs                      |
| AvatarGroup                                                                                                   | Avatar/AvatarGroup               |

## Port status

- [x] Empty — ported (2026-07-02): `src/lib/components/Empty`, docs at `/components/empty`
- [x] Kbd — ported (2026-07-02): `src/lib/components/Kbd`, docs at `/components/kbd`
- [x] Command — ported (2026-07-02): `src/lib/components/Command`, docs at `/components/command`; dialog mode reuses the Dialog primitive (theme prop + sr-only title)
- [x] Spinner — ported (2026-07-04): `src/lib/components/Spinner`, docs at `/components/spinner`; reuses the global `.ui-spinner` Tailwind engine
- [x] Pagination — ported (2026-07-04): `src/lib/components/Pagination`, docs at `/components/pagination`; supports button and anchor controls
- [x] Slider — ported (2026-07-05): `src/lib/components/Form/Slider`, docs at `/components/slider`; supports native range input, marks, and Form `type: 'slider'`

Deliberately skipped from the Command reference: `inputAction` slot and `showCloseButton` (the `footer` slot covers the hint-bar use case); nova's dialog-mode row-radius rule (keyed on a `data-slot=dialog-content` hook our Dialog doesn't have).
