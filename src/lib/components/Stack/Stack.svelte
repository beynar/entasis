<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import {
		layoutSpacingCssValues,
		toLayoutSpacingKey,
		type LayoutSpacing,
		type LayoutSpacingKey
	} from '../Layout/layoutSpacing.js';
	import { responsiveVariables } from '../Theme/responsive.js';
	import type {
		StackAlign,
		StackJustify,
		StackOrientation,
		StackProps,
		StackWrap
	} from './stack.props.js';
	import { useStackTheme } from './stack.theme.js';

	/**
	 * The defaults of the five responsive axes. They are the fallback handed to
	 * `responsiveVariables` rather than a destructuring default so a record that starts at a wider
	 * step — `orientation={{ md: 'horizontal' }}` — still lands on the documented default below
	 * `md` instead of on nothing.
	 */
	const fallbacks = {
		orientation: 'vertical',
		align: 'stretch',
		justify: 'start',
		gap: 'none',
		wrap: 'nowrap'
	} as const satisfies {
		orientation: StackOrientation;
		align: StackAlign;
		justify: StackJustify;
		gap: LayoutSpacing;
		wrap: StackWrap;
	};

	let {
		ref = $bindable(null),
		class: className,
		as = 'div',
		style,
		orientation,
		align,
		justify,
		gap,
		padding,
		paddingInline,
		paddingBlock,
		wrap,
		scrollable = false,
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

	const flexDirection = { horizontal: 'row', vertical: 'column' } as const;
	const alignItems = {
		start: 'flex-start',
		center: 'center',
		end: 'flex-end',
		stretch: 'stretch'
	} as const;
	const justifyContent = {
		start: 'flex-start',
		center: 'center',
		end: 'flex-end',
		between: 'space-between',
		around: 'space-around',
		evenly: 'space-evenly'
	} as const;

	/**
	 * Direction, gap, alignment, distribution and wrapping for ALL FIVE breakpoints, written as
	 * custom properties on the layout element. The `@min-[…]/stack:` rules in `stack.theme.ts` pick
	 * the set matching the width the host actually gave the root, so the first painted frame and
	 * the server-rendered HTML are already laid out — nothing is measured and no JS runs.
	 */
	const layoutStyle = $derived(
		Object.entries({
			...responsiveVariables(
				'stack-direction',
				orientation,
				fallbacks.orientation,
				(value) => flexDirection[value]
			),
			...responsiveVariables(
				'stack-gap',
				gap,
				fallbacks.gap,
				(value) => layoutSpacingCssValues[toLayoutSpacingKey(value)]
			),
			...responsiveVariables('stack-align', align, fallbacks.align, (value) => alignItems[value]),
			...responsiveVariables(
				'stack-justify',
				justify,
				fallbacks.justify,
				(value) => justifyContent[value]
			),
			...responsiveVariables('stack-wrap', wrap, fallbacks.wrap)
		})
			.map(([property, value]) => `${property}:${value}`)
			.join(';')
	);
</script>

<svelte:element
	this={as}
	bind:this={ref}
	data-slot="stack"
	{style}
	style:width={cssSize(width)}
	style:height={cssSize(height)}
	style:max-width={cssSize(maxWidth)}
	style:min-height={cssSize(minHeight)}
	class={classes.root({
		paddingInline: spacingKey(resolvedPaddingInline),
		paddingBlock: spacingKey(resolvedPaddingBlock),
		scrollable,
		className
	})}
	{...attributes}
>
	<div data-slot="stack-layout" class={classes.inner()} style={layoutStyle}>
		<Slot render={children} />
	</div>
</svelte:element>
