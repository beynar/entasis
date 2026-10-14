<script lang="ts">
	// Harness for `popover.position.svelte.test.ts`: a floating popover whose placement inputs and
	// open state the test changes while it stays mounted. `update` changes only the inputs it is
	// given, so nothing else the panel reads changes with them. The other props are fixed at
	// render. `dir` installs the i18n direction context the popover resolves logical sides with;
	// `inset` keeps the trigger that many px away from the page edges.
	import { untrack } from 'svelte';
	import { setI18nDirection } from '$lib/i18n/context.svelte.js';
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	type PlacementInputs = Pick<PopoverProps, 'position' | 'offset' | 'fitTrigger' | 'open'>;
	type HarnessProps = PlacementInputs &
		Pick<
			PopoverProps,
			| 'directedTransition'
			| 'closeOnMouseLeave'
			| 'positionPanel'
			| 'onOpenChange'
			| 'focusOnOpen'
			| 'anchorTo'
			| 'collisionBoundary'
			| 'fallbackAxisSide'
		> & {
			dir?: 'ltr' | 'rtl';
			inset?: number;
			/** Start closed and open when the pointer rests on the trigger, instead of open. */
			openedByHover?: boolean;
		};
	let {
		position = 'bottom-start',
		offset,
		fitTrigger = false,
		open = true,
		directedTransition = true,
		closeOnMouseLeave = false,
		positionPanel,
		onOpenChange,
		openedByHover = false,
		focusOnOpen = false,
		anchorTo,
		collisionBoundary,
		fallbackAxisSide,
		dir,
		inset = 0
	}: HarnessProps = $props();

	// Fixed at render; without it the popover reads the trigger's computed direction.
	const contextDirection = untrack(() => dir);
	if (contextDirection) setI18nDirection(() => contextDirection);

	let changed = $state<PlacementInputs>({});
	export function update(next: PlacementInputs) {
		changed = { ...changed, ...next };
	}
</script>

<Theme>
	<div style:padding="{inset}px">
		<Popover
			open={openedByHover ? undefined : 'open' in changed ? changed.open : open}
			openOnHover={openedByHover}
			delay={0}
			position={'position' in changed ? changed.position : position}
			offset={'offset' in changed ? changed.offset : offset}
			fitTrigger={'fitTrigger' in changed ? changed.fitTrigger : fitTrigger}
			{directedTransition}
			{closeOnMouseLeave}
			{positionPanel}
			{onOpenChange}
			{focusOnOpen}
			{anchorTo}
			{collisionBoundary}
			{fallbackAxisSide}
			trigger={{ content: 'Open popover' }}
		>
			<button type="button">Inside popover</button>
		</Popover>
	</div>
</Theme>
