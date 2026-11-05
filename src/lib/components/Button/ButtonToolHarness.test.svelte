<script lang="ts">
	// Mounts Buttons, and the <Ask /> host on demand, under a Theme whose `webmcp` the test chooses.
	import type { ButtonProps } from './button.props.js';
	import Button from './Button.svelte';
	import Ask from '../Form/Ask/Ask.svelte';
	import Theme from '../Theme/Theme.svelte';

	let {
		webmcp,
		ask = false,
		buttons
	}: { webmcp?: boolean; ask?: boolean; buttons: (ButtonProps & { text: string })[] } = $props();
</script>

<Theme {webmcp}>
	{#if ask}
		<Ask />
	{/if}
	<div data-testid="page">
		{#each buttons as { text, ...button } (text)}
			<Button {...button}>{text}</Button>
		{/each}
	</div>
</Theme>
