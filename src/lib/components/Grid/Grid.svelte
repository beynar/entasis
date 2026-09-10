<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import { toLayoutSpacingKey } from '../Layout/layoutSpacing.js';
	import type { GridProps } from './grid.props.js';
	import { getGridTemplate } from './gridTemplate.js';
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
	const resolvedColumnGap = $derived(columnGap ?? gap);
	const template = $derived(getGridTemplate(columns, resolvedColumnGap));
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
	style:grid-template-columns={template}
	style:grid-auto-rows={autoRows}
	style:width={cssSize(width)}
	style:height={cssSize(height)}
	style:max-width={cssSize(maxWidth)}
	style:min-height={cssSize(minHeight)}
	class={classes.root({
		gap: toLayoutSpacingKey(gap),
		rowGap: rowGap === undefined ? undefined : toLayoutSpacingKey(rowGap),
		columnGap: columnGap === undefined ? undefined : toLayoutSpacingKey(columnGap),
		align,
		justify,
		className
	})}
	{...attributes}
>
	<Slot render={children} />
</div>
