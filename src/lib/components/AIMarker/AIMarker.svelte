<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import Separator from '../Separator/Separator.svelte';
	import type { AIMarkerProps } from './aiMarker.props.js';
	import { useAIMarkerTheme } from './aiMarker.theme.js';

	let {
		ref = $bindable(),
		size = 'normal',
		variant = 'default',
		icon,
		content,
		children,
		class: className,
		theme,
		...attachments
	}: AIMarkerProps = $props();

	const classes = $derived(useAIMarkerTheme(theme));
</script>

<div
	bind:this={ref}
	data-slot="ai-marker"
	data-variant={variant}
	data-size={size}
	class={classes.root({ variant, className })}
	{...attachments}
>
	{#if variant === 'separator'}<Separator decorative class={classes.rule()} />{/if}
	{#if icon}<Slot
			as="span"
			render={icon}
			class={classes.icon()}
			attrs={{ 'aria-hidden': 'true', 'data-slot': 'ai-marker-icon' }}
		/>{/if}
	<Slot
		as="span"
		render={content ?? children}
		class={classes.content({ centered: variant === 'separator' })}
		attrs={{ 'data-slot': 'ai-marker-content' }}
	/>
	{#if variant === 'separator'}<Separator decorative class={classes.rule()} />{/if}
</div>
