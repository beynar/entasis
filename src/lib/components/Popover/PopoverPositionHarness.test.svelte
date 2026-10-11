<script lang="ts">
	// Harness for `popover.position.svelte.test.ts`: an open floating popover whose placement
	// inputs the test changes while it stays open. `update` changes only the inputs it is given,
	// so nothing else the panel reads changes with them.
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';
	import type { PopoverProps } from './popover.props.js';

	type PlacementInputs = Pick<PopoverProps, 'position' | 'offset' | 'fitTrigger'>;
	let { position = 'bottom-start', offset, fitTrigger = false }: PlacementInputs = $props();

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
		trigger={{ content: 'Open popover' }}
	>
		<button type="button">Inside popover</button>
	</Popover>
</Theme>
