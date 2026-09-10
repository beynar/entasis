<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { SeparatorProps } from './separator.props.js';
	import { useSeparatorTheme } from './separator.theme.js';

	let {
		children,
		decorative = false,
		class: className = '',
		orientation = 'horizontal',
		align = 'center',
		line = true,
		color = 'neutral',
		thickness = 1,
		theme,
		...attachments
	}: SeparatorProps = $props();

	const classes = $derived(useSeparatorTheme(theme));
</script>

<div
	class={classes.root({ orientation, color, align, line, className })}
	data-orientation={orientation}
	data-color={color}
	aria-orientation={orientation}
	role={decorative ? 'none' : 'separator'}
	style="--separator-border-width: {thickness}px"
	{...attachments}
>
	{#if children}
		<Slot render={children} class={classes.label({ orientation })} />
	{/if}
</div>
