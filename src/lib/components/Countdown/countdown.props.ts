import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { CountdownFormat, CountdownInstant, CountdownPayload } from './countdown.js';
import type { CountdownThemeProps } from './countdown.theme.js';

export type CountdownProps = WithAttachments<
	WithSlot<
		Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'role'> & {
			/** The moment the countdown reaches: a `Date`, an ISO 8601 string, or epoch milliseconds. */
			until: CountdownInstant;
			/**
			 * The moment the countdown started. Only feeds `fraction`, the elapsed share of
			 * `from` → `until` passed to `children` (for a `Progress`, say).
			 */
			from?: CountdownInstant;
			/**
			 * `relative` reads "3 days, 4 hours" in the active locale; `clock` reads "2:14:05", with
			 * the days in front when there are any.
			 * @default 'relative'
			 */
			format?: CountdownFormat;
			/**
			 * How many units the relative text shows, counted from the largest non-zero one (days,
			 * hours, minutes, seconds). `1` reads "3 days"; `2` reads "3 days, 4 hours". Units below
			 * the last shown one are truncated, and zero units are left out.
			 * @default 1
			 */
			units?: number;
			/** Locale of the text. Defaults to the I18n locale. */
			locale?: Intl.LocalesArgument;
			/** Called once when `until` is reached, including on mount when it is already past. */
			onComplete?: () => void;
			/** Bindable reference to the root `<time>`. */
			ref?: HTMLElement | null;
			/** Additional classes for the root `<time>`. */
			class?: string;
			/** Theme overrides for the root, clock, and spoken parts. */
			theme?: CountdownThemeProps;
		},
		'children',
		CountdownPayload
	>
>;
