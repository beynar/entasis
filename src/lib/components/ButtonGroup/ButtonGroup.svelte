<script lang="ts">
	import Button from '../Button/Button.svelte';
	import type { ButtonGroupProps } from './buttonGroup.props.js';
	import { useButtonGroupTheme } from './buttonGroup.theme.js';

	let {
		items,
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

<div class={classes.root({ className })} {...attachments}>
	{#each items as button, index (index)}
		<Button {size} {color} {variant} {disabled} {...button} />
	{/each}
</div>
