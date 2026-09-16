<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import type { GridSpanProps } from './gridSpan.props.js';
	import { getGridSpanVariables, toInlineVariables } from './gridTemplate.js';
	import { useGridSpanTheme } from './gridSpan.theme.js';

	let {
		ref = $bindable(null),
		class: className,
		style,
		columns,
		rows,
		theme,
		children,
		...attributes
	}: GridSpanProps = $props();

	const classes = $derived(useGridSpanTheme(theme));
	// The span steps with the Grid around it: these properties feed the `@min-[…]/grid:` rules,
	// which query that grid's container, so nothing is measured here either.
	const variables = $derived(toInlineVariables(getGridSpanVariables({ columns, rows })));
	// One element, so the consumer's `style` and the span properties share the attribute.
	const inlineStyle = $derived([style?.replace(/;\s*$/, ''), variables].filter(Boolean).join(';'));
	/** A plain value stays readable in the DOM; a record or a function reads as `responsive`. */
	const dataValue = (value: unknown) => {
		if (value === undefined) return undefined;
		return typeof value === 'object' || typeof value === 'function' ? 'responsive' : String(value);
	};
</script>

<div
	bind:this={ref}
	data-slot="grid-span"
	data-columns={dataValue(columns)}
	data-rows={dataValue(rows)}
	style={inlineStyle}
	class={classes.root({ className })}
	{...attributes}
>
	<Slot render={children} />
</div>
