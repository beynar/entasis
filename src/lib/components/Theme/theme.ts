/**
 * A prop that can differ per breakpoint. Two forms, both resolved by `resolveResponsive`
 * (pure, in `responsive.ts`) or by `ThemeState.resolveResponsiveProps` (viewport-driven):
 *
 * - a plain `T` — used at every breakpoint.
 * - `Partial<Record<Breakpoint, T>>` — the nearest DEFINED key at or below the active breakpoint
 *   wins, so `{ sm: 2, lg: 4 }` is 2 from `sm` through `md` and 4 from `lg` up; below `sm` the
 *   component's own default applies. An object is only read as this form when every one of its
 *   keys is a breakpoint name, so object-valued props (`{ in, out }`, `{ minWidth, max }`) are
 *   still passed through as values.
 *
 * There is no function form: a record is declarative, serialisable and inspectable, and the five
 * steps it produces cannot disagree the way a non-deterministic callback's could.
 */
export type ResponsiveProps<T> = T | Partial<Record<Breakpoint, T>>;

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
