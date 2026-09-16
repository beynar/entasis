// The shared class recipes for states every component paints the same way. A theme file imports
// the recipe instead of re-deriving it, so "selected" reads identically in the sidebar, a menu
// option, a table row and a chip — and `tooling/check-semantic-theme-tokens.mjs` sweeps the
// classes through the importing theme.

/**
 * The one soft selected/active recipe: a muted fill of the **current** role with the text tuned
 * for that tint. Role-agnostic on purpose — `data-color` (and `<Theme designTokens.defaultColor>`)
 * moves every selected surface together, so a theme must never name a fixed role
 * (`bg-primary-muted`, `bg-neutral-muted`) for a selected state, and `bg-color-muted` is no longer
 * it either: selection reads the `selected` STATE ROLE, which falls back to the current role.
 *
 * Use it for persistent selection that sits inside a list: sidebar rows, menu options, toggle
 * buttons, table and data-table rows, tree nodes, chips and tags.
 */
export const selectedSoft = 'bg-selected-muted text-selected-muted-readable';

/**
 * The solid counterpart, for the one selected element that must read as the loudest thing in its
 * group — a "current page" pill in Pagination, a chosen segment that carries no other affordance.
 * Same role-agnostic rule: the fill is the current role, never a named one.
 */
export const selectedSolid = 'bg-selected text-selected-contrast';

/**
 * The one focus ring: two pixels of the `focus` state role at 50 %. `ring-focus` falls back to
 * `--color`, so an unpinned theme rings in the control's own role exactly as `ring-color/50` did;
 * a theme that sets `designTokens.focusColor` moves every ring in the library at once.
 */
export const focusRing = 'focus-visible:ring-2 focus-visible:ring-focus/50';
