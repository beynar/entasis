<script lang="ts">
	// One option row of a Select. It is the markup MenuOption renders for a titled listbox option,
	// without the Slot wrappers MenuOption builds for the parts a Select never uses (prefix,
	// description, custom children): a list of a thousand options mounts about half the nodes and
	// components. It reads MenuOption's theme, so rows look the same as every other listbox row.
	import type { Snippet } from 'svelte';
	import type { Density, Sizes } from '$lib/types/theme.js';
	import { useMenuOptionTheme } from '../../MenuOption/menuOption.theme.js';

	let {
		id,
		label,
		size,
		density,
		highlighted,
		selected,
		disabled,
		check,
		onactivate,
		onhover
	}: {
		id: string;
		label: string;
		size: Sizes;
		density: Density;
		highlighted: boolean;
		selected: boolean;
		disabled: boolean;
		/** The selected-state indicator, shown in the row's suffix while selected. */
		check: Snippet;
		onactivate: (event: MouseEvent) => void;
		onhover: (event: PointerEvent) => void;
	} = $props();

	const classes = useMenuOptionTheme();
</script>

<button
	type="button"
	role="option"
	{id}
	tabindex={-1}
	data-color="neutral"
	data-size={size}
	data-density={density}
	data-highlighted={highlighted ? 'true' : undefined}
	data-selected={selected ? 'true' : undefined}
	data-disabled={disabled ? '' : undefined}
	aria-selected={selected}
	aria-disabled={disabled ? true : undefined}
	{disabled}
	class={classes.root({
		color: 'neutral',
		size,
		density,
		disabled,
		highlighted,
		active: false
	})}
	onclick={onactivate}
	onpointermove={disabled ? undefined : onhover}
>
	<div class={classes.content({ density })}>
		<div class="{classes.title({ size })} leading-none">{label}</div>
	</div>
	{#if selected}
		<div class={classes.suffix({ size })}>{@render check()}</div>
	{/if}
</button>
