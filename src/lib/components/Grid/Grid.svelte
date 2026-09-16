<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { GridProps } from './grid.props.js';
	import { getGridVariables, toInlineVariables } from './gridTemplate.js';
	import { useGridTheme } from './grid.theme.js';

	let {
		ref = $bindable(null),
		class: className,
		style,
		columns = 1,
		gap = 'none',
		rowGap,
		columnGap,
		rowHeight,
		align = 'stretch',
		justify = 'stretch',
		width,
		height,
		maxWidth,
		minHeight,
		theme,
		children,
		...attributes
	}: GridProps = $props();

	const classes = $derived(useGridTheme(theme));
	// Resolved for all five breakpoints here, on the server, and picked by the container rules in
	// grid.theme.ts — the grid never measures itself and is right on first paint.
	const variables = $derived(
		toInlineVariables(getGridVariables({ columns, gap, rowGap, columnGap }))
	);
	const autoRows = $derived(
		rowHeight !== undefined && Number.isFinite(rowHeight) && rowHeight >= 0
			? `${rowHeight}px`
			: undefined
	);
	const cssSize = (value: number | string | undefined) =>
		typeof value === 'number' ? (Number.isFinite(value) ? `${value}px` : undefined) : value;
</script>

<div
	bind:this={ref}
	data-slot="grid"
	data-columns={typeof columns === 'number' ? columns : 'responsive'}
	{style}
	style:width={cssSize(width)}
	style:height={cssSize(height)}
	style:max-width={cssSize(maxWidth)}
	style:min-height={cssSize(minHeight)}
	class={classes.root({ className })}
	{...attributes}
>
	<div
		data-slot="grid-tracks"
		style={variables}
		style:grid-auto-rows={autoRows}
		class={classes.tracks({ align, justify })}
	>
		<Slot render={children} />
	</div>
</div>
