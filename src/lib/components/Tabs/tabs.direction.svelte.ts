import { untrack } from 'svelte';
import type { Direction } from '$lib/utils/useDirection.svelte.js';

/**
 * Where the active tab sits relative to the previously active one, along the tab list's axis:
 * `left` or `right` for a horizontal list (mirrored in a right-to-left document), `up` or `down`
 * for a vertical one, and `none` before the first change or when no tab is selected.
 */
export type TabsActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

/** The direction from `previous` to `next`; `none` when either is not a tab or they are equal. */
export const getActivationDirection = (
	previous: number,
	next: number,
	orientation: 'horizontal' | 'vertical',
	direction: Direction
): TabsActivationDirection => {
	if (previous < 0 || next < 0 || previous === next) return 'none';
	const forward = next > previous;
	if (orientation === 'vertical') return forward ? 'down' : 'up';
	return forward === (direction === 'ltr') ? 'right' : 'left';
};

type ActivationDirectionOptions = {
	/** The index of the selected tab; -1 when none is. */
	index: () => number;
	orientation: () => 'horizontal' | 'vertical';
	direction: () => Direction;
};

/**
 * Tracks the activation direction across selection changes. It updates before the DOM does
 * (`$effect.pre`), so the attribute and the new panel arrive in the same render, for a click, a
 * key, `api` navigation and a parent changing a bound `value` alike. The direction persists
 * until the next change and starts as `none`.
 */
export const useActivationDirection = (options: ActivationDirectionOptions) => {
	// -1 until a tab is selected, so the first selection has no direction.
	let previous = untrack(options.index);
	let current = $state<TabsActivationDirection>('none');

	$effect.pre(() => {
		const next = options.index();
		const orientation = options.orientation();
		const direction = options.direction();
		untrack(() => {
			if (next === previous) return;
			// Losing the selection keeps the last direction and the last selected tab as reference.
			if (next < 0) return;
			current = getActivationDirection(previous, next, orientation, direction);
			previous = next;
		});
	});

	return {
		get value() {
			return current;
		}
	};
};
