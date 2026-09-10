<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import Separator from '../Separator/Separator.svelte';
	import type { StatProps } from './stat.props.js';
	import { useStatTheme } from './stat.theme.js';

	let {
		ref = $bindable(),
		class: className,
		color = 'neutral',
		variant = 'solid',
		size = 'normal',
		density = 'normal',
		theme,
		label,
		value,
		indicator,
		indicatorVariant = 'default',
		indicatorColor = 'neutral',
		onclick,
		indicatorLabel,
		indicatorType = 'button',
		indicatorDisabled,
		showSeparator = false,
		trend,
		trendDirection = 'neutral',
		description,
		children,
		...attachments
	}: StatProps = $props();

	const classes = $derived(useStatTheme(theme));
</script>

<div
	bind:this={ref}
	data-slot="stat"
	data-color={color}
	data-variant={variant}
	data-size={size}
	data-density={density}
	class={classes.root({ color, variant, size, density, className })}
	{...attachments}
>
	<Slot
		renderIf={!!label}
		render={label}
		attrs={{
			'data-slot': 'stat-label',
			'data-size': size
		}}
		class={classes.label({ size })}
	/>

	<Slot
		renderIf={!!value}
		render={value}
		attrs={{
			'data-slot': 'stat-value',
			'data-size': size
		}}
		class={classes.value({ size })}
	/>

	{#if indicator}
		{#if onclick}
			<button
				data-slot="stat-indicator"
				data-variant={indicatorVariant}
				data-color={indicatorColor}
				data-size={size}
				type={indicatorType}
				disabled={indicatorDisabled}
				aria-label={indicatorLabel}
				{onclick}
				class={classes.indicator({
					size,
					variant: indicatorVariant,
					color: indicatorColor
				})}
			>
				<Slot render={indicator} />
			</button>
		{:else}
			<div
				data-slot="stat-indicator"
				data-variant={indicatorVariant}
				data-color={indicatorColor}
				data-size={size}
				class={classes.indicator({
					size,
					variant: indicatorVariant,
					color: indicatorColor
				})}
			>
				<Slot render={indicator} />
			</div>
		{/if}
	{/if}

	{#if showSeparator}
		<div data-slot="stat-separator" data-density={density} class={classes.separator({ density })}>
			<Separator decorative class="my-0" />
		</div>
	{/if}

	<Slot
		renderIf={!!trend}
		render={trend}
		attrs={{
			'data-slot': 'stat-trend',
			'data-trend': trendDirection,
			'data-size': size
		}}
		class={classes.trend({ size, trend: trendDirection })}
	/>

	<Slot
		renderIf={!!description}
		render={description}
		attrs={{
			'data-slot': 'stat-description',
			'data-size': size
		}}
		class={classes.description({ size })}
	/>

	<Slot render={children} />
</div>
