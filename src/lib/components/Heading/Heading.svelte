<script lang="ts">
	import type { HeadingProps } from './heading.props.js';
	import { useHeadingTheme } from './heading.theme.js';
	let {
		class: className = '',
		underline = false,
		size = 'h2',
		children,
		as,
		weight = 'normal',
		trim = 'both',
		balanced = true,
		align = 'left',
		muted = false,
		theme,
		...attachments
	}: HeadingProps = $props();

	const classes = $derived(useHeadingTheme(theme));
</script>

<svelte:element
	this={as || size || 'h2'}
	data-level={size}
	data-underline={underline}
	data-balanced={balanced}
	data-trim={trim}
	data-muted={muted}
	data-align={align}
	data-weight={weight}
	class={classes.root({ size, weight, align, balanced, underline, muted, trim, className })}
	{...attachments}
>
	{#if children}
		{@render children()}
	{/if}
</svelte:element>
