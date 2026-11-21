<script lang="ts">
	import Slot from '../Slot/Slot.svelte';
	import Separator from '../Separator/Separator.svelte';
	import AnimatedNumber from '../AnimatedNumber/AnimatedNumber.svelte';
	import Sparkline from '../Sparkline/Sparkline.svelte';
	import { sparklineTrend } from '../Sparkline/sparkline.geometry.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { getNumberFormatter } from '$lib/utils/number.js';
	import { arrowDownRightIcon } from '../Icons/arrowDownRight.js';
	import { arrowUpRightIcon } from '../Icons/arrowUpRight.js';
	import { statDefaultOrder, type StatPart, type StatProps } from './stat.props.js';
	import { useStatTheme } from './stat.theme.js';

	let {
		ref = $bindable(),
		class: className,
		color = 'neutral',
		variant = 'solid',
		size = 'normal',
		density = 'normal',
		theme,
		order = statDefaultOrder,
		label,
		value,
		animatedNumber = true,
		unit,
		indicator,
		indicatorVariant = 'default',
		indicatorColor = 'neutral',
		action,
		onAction,
		actionLabel,
		actionDisabled,
		trendIcon,
		trend,
		trendDirection: trendDirectionProp,
		sparkline,
		sparklineBleed = false,
		description,
		children,
		...attachments
	}: StatProps = $props();

	const classes = $derived(useStatTheme(theme));
	const messages = $derived(useI18n());
	const numberProps = $derived(typeof animatedNumber === 'object' ? animatedNumber : {});
	const sparklineProps = $derived.by(() => {
		if (!sparkline) return null;
		const props = 'data' in sparkline ? sparkline : { data: sparkline };
		// The values read like the figure: same format, same locale, unless the sparkline sets its own.
		return {
			size,
			format: numberProps.format,
			locale: numberProps.locale,
			label: typeof label === 'string' ? label : undefined,
			...props
		};
	});
	const trendDirection = $derived(
		trendDirectionProp ?? (sparklineProps ? sparklineTrend(sparklineProps.data) : 'neutral')
	);

	const hasPart = (part: StatPart) => {
		switch (part) {
			case 'label':
				return !!label;
			case 'value':
				return typeof value === 'number' || !!value || !!unit;
			case 'indicator':
				return !!indicator;
			case 'separator':
				return true;
			case 'trend':
				return !!trend || !!trendIcon;
			case 'description':
				return !!description;
			case 'sparkline':
				return !!sparklineProps;
		}
	};

	// `order` is the single source of truth for what renders: a region left out of the list is
	// left out of the DOM. Duplicates are dropped so the keyed loop below stays stable.
	const parts = $derived(
		order.filter((part, index) => order.indexOf(part) === index && hasPart(part))
	);
	const flow = $derived(parts.filter((part) => part !== 'indicator'));
	const showIndicator = $derived(parts.includes('indicator'));
	const hasAside = $derived(showIndicator || !!action);
	// A bleeding sparkline takes back the card's padding on both sides, and at the bottom too when
	// nothing comes under it.
	const bleed = $derived(
		!sparklineBleed || !parts.includes('sparkline')
			? 'none'
			: flow.at(-1) === 'sparkline' && !children
				? 'end'
				: 'sides'
	);
	const directionArrow = $derived(
		trendDirection === 'up'
			? arrowUpRightIcon
			: trendDirection === 'down'
				? arrowDownRightIcon
				: undefined
	);
</script>

<div
	bind:this={ref}
	data-slot="stat"
	data-color={color}
	data-variant={variant}
	data-size={size}
	data-density={density}
	class={classes.root({ color, variant, size, density, bleed: bleed !== 'none', className })}
	{...attachments}
>
	{#each flow as part, index (part)}
		{@const region = classes.region({ span: hasAside && index < 2 ? 'narrow' : 'wide' })}
		{#if part === 'label'}
			<Slot
				render={label}
				attrs={{
					'data-slot': 'stat-label',
					'data-size': size
				}}
				class={classes.label({ size, variant, className: region })}
			/>
		{:else if part === 'value'}
			<div
				data-slot="stat-value"
				data-size={size}
				class={classes.value({ size, className: region })}
			>
				{#if typeof value === 'number'}
					{#if animatedNumber === false}
						{getNumberFormatter(messages.locale).format(value)}
					{:else}
						<!--
							Set on a line of text, as the plain number is: the value's line height then
							gives both the same height, where a flex item would be one em tall.
						-->
						<span data-slot="stat-number"><AnimatedNumber {...numberProps} {value} /></span>
					{/if}
				{:else}
					<Slot render={value} />
				{/if}
				<Slot
					renderIf={!!unit}
					render={unit}
					as="span"
					attrs={{
						'data-slot': 'stat-unit',
						'data-size': size
					}}
					class={classes.unit({ size })}
				/>
			</div>
		{:else if part === 'separator'}
			<div
				data-slot="stat-separator"
				data-density={density}
				class={classes.separator({ density, className: region })}
			>
				<Separator decorative class="my-0" />
			</div>
		{:else if part === 'trend'}
			<div
				data-slot="stat-trend"
				data-trend={trendDirection}
				data-size={size}
				class={classes.trend({ size, className: region })}
			>
				<Slot
					renderIf={!!trendIcon}
					render={trendIcon}
					as="span"
					attrs={{ 'data-slot': 'stat-trend-icon' }}
					class={classes.trendIcon()}
				/>
				<span data-slot="stat-trend-text" class={classes.trendText({ trend: trendDirection })}>
					<Slot render={trend} />
					{#if directionArrow}
						{@render directionArrow()}
					{/if}
				</span>
			</div>
		{:else if part === 'sparkline' && sparklineProps}
			<div
				data-slot="stat-sparkline"
				data-size={size}
				data-bleed={bleed === 'none' ? undefined : bleed}
				class={classes.sparkline({ size, density, bleed, className: region })}
			>
				<Sparkline
					{...sparklineProps}
					class={classes.sparklineChart({ className: sparklineProps.class })}
				/>
			</div>
		{:else if part === 'description'}
			<Slot
				render={description}
				attrs={{
					'data-slot': 'stat-description',
					'data-size': size
				}}
				class={classes.description({ size, variant, className: region })}
			/>
		{/if}
	{/each}

	{#if hasAside}
		<div
			data-slot="stat-aside"
			class={classes.aside({ rows: flow.length > 1 ? 'pair' : 'single' })}
		>
			{#if action}
				<button
					data-slot="stat-action"
					data-size={size}
					type="button"
					disabled={actionDisabled}
					aria-label={actionLabel}
					onclick={onAction}
					class={classes.action({ size })}
				>
					<Slot render={action} />
				</button>
			{/if}
			{#if showIndicator}
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
		</div>
	{/if}

	<Slot render={children} />
</div>
