<script lang="ts">
	// Harness for `popover.position.svelte.test.ts`: an open floating popover whose placement
	// inputs the test changes while it stays open. `update` changes only the inputs it is given,
	// so nothing else the panel reads changes with them. The other props are fixed at render.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	type PlacementInputs = Pick<PopoverProps, 'position' | 'offset' | 'fitTrigger'>;
	type HarnessProps = PlacementInputs &
		Pick<
			PopoverProps,
			'directedTransition' | 'closeOnMouseLeave' | 'positionPanel' | 'onOpenChange'
		>;
	let {
		position = 'bottom-start',
		offset,
		fitTrigger = false,
		directedTransition = true,
		closeOnMouseLeave = false,
		positionPanel,
		onOpenChange
	}: HarnessProps = $props();

	let changed = $state<PlacementInputs>({});
	export function update(next: PlacementInputs) {
		changed = { ...changed, ...next };
	}
</script>

<Theme>
	<Popover
		open
		position={'position' in changed ? changed.position : position}
		offset={'offset' in changed ? changed.offset : offset}
		fitTrigger={'fitTrigger' in changed ? changed.fitTrigger : fitTrigger}
		{directedTransition}
		{closeOnMouseLeave}
		{positionPanel}
		{onOpenChange}
		trigger={{ content: 'Open popover' }}
	>
		<button type="button">Inside popover</button>
	</Popover>
</Theme>
