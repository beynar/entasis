<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Popover from './Popover.svelte';

	let { inline = false, open = true }: { inline?: boolean; open?: boolean } = $props();

	const zero = { in: { duration: 0 }, out: { duration: 0 } };
</script>

<Theme>
	<div data-testid="host">
		<Popover {inline} {open} transition={zero} trigger={{ content: 'Open popover' }}>
			<button type="button">Inside popover</button>
		</Popover>
	</div>
</Theme>
