<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import {
		toLayoutSpacingKey,
		type LayoutSpacing,
		type LayoutSpacingKey
	} from '../Layout/layoutSpacing.js';
	import type { StackProps } from './stack.props.js';
	import { useStackTheme } from './stack.theme.js';

	let {
		ref = $bindable(null),
		class: className,
		as = 'div',
		style,
		orientation = 'vertical',
		align = 'stretch',
		justify = 'start',
		gap = 'none',
		padding,
		paddingInline,
		paddingBlock,
		wrap = 'nowrap',
		isScrollable = false,
		width,
		height,
		maxWidth,
		minHeight,
		theme,
		children,
		...attributes
	}: StackProps = $props();

	const classes = $derived(useStackTheme(theme));
	const resolvedPaddingInline = $derived(paddingInline ?? padding);
	const resolvedPaddingBlock = $derived(paddingBlock ?? padding);

	const spacingKey = (value: LayoutSpacing | undefined): LayoutSpacingKey | undefined =>
		value === undefined ? undefined : toLayoutSpacingKey(value);
	const cssSize = (value: number | string | undefined) =>
		typeof value === 'number' ? (Number.isFinite(value) ? `${value}px` : undefined) : value;
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="stack"
	data-orientation={orientation}
	data-wrap={wrap}
	{style}
	style:width={cssSize(width)}
	style:height={cssSize(height)}
	style:max-width={cssSize(maxWidth)}
	style:min-height={cssSize(minHeight)}
	class={classes.root({
		direction: orientation,
		mainAlign: justify,
		crossAlign: align,
		gap: spacingKey(gap),
		paddingInline: spacingKey(resolvedPaddingInline),
		paddingBlock: spacingKey(resolvedPaddingBlock),
		wrap,
		scrollable: isScrollable,
		className
	})}
	{...attributes}
>
	<Slot render={children} />
</svelte:element>
