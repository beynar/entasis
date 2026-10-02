<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';

	import type { PopoverProps } from './popover.props.js';

	let {
		inline = false,
		open = true,
		positionPanel
	}: { inline?: boolean; open?: boolean; positionPanel?: PopoverProps['positionPanel'] } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<div data-testid="host">
		<Popover
			{inline}
			{open}
			{positionPanel}
			transition={zero}
			trigger={{ content: 'Open popover' }}
		>
			<button type="button">Inside popover</button>
		</Popover>
	</div>
</Theme>
