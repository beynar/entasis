<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import Command from './Command.svelte';
	import type { CommandProps } from './command.props.js';

	let props: CommandProps = $props();
</script>

<Theme>
	<Command {...props}>
		{#snippet trigger({ open })}
			<button type="button" onclick={open}>Open command</button>
		{/snippet}
	</Command>
</Theme>
