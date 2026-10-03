<script lang="ts">
	import Button from '../Button/Button.svelte';
	import type { ButtonGroupProps } from './buttonGroup.props.js';
	import { useButtonGroupTheme } from './buttonGroup.theme.js';

	let {
		items,
		children,
		label,
		size,
		color,
		variant,
		disabled,
		theme,
		class: className,
		...attachments
	}: ButtonGroupProps = $props();

	const classes = $derived(useButtonGroupTheme(theme));
</script>

<div role="group" aria-label={label} class={classes.root({ className })} {...attachments}>
	{#if children}
		{@render children()}
	{:else}
		{#each items ?? [] as button, index (index)}
			<Button {size} {color} {variant} {...button} disabled={disabled || button.disabled} />
		{/each}
	{/if}
</div>
