<script lang="ts" generics="T = unknown">
	import type { MeterProps, MeterStep } from './meter.props.js';
	import { useMeterTheme } from './meter.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import { useSpringState } from '$lib/utils/spring.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import {
		clampRange,
		formatRangeValue,
		rangeAriaAttributes,
		toPercent
	} from '$lib/utils/range.js';
	import { untrack } from 'svelte';

	let {
		value,
		color = 'primary',
		class: className,
		showIndicatorAs = 'percentage',
		showLegend = false,
		indicator,
		size = 'normal',
		stiffness = 0.05,
		damping = 1,
		precision = 0.001,
		soft = 0.1,
		min = 0,
		max = 100,
		format,
		getAriaValueText,
		locale: localeProp,
		header,
		label,
		helper,
		description,
		theme
	}: MeterProps<T> = $props();
	const t = $derived(useI18n());
	const locale = $derived(localeProp ?? t.locale);

	const id = $props.id();
	const labelId = `${id}-label`;
	const helperId = `${id}-helper`;
	const descriptionId = `${id}-description`;

	const spring = useSpringState({
		get stiffness() {
			return stiffness;
		},
		get damping() {
			return damping;
		},
		get precision() {
			return precision;
		}
	});

	const meterSteps: MeterStep<T>[] = $derived(
		typeof value === 'number'
			? [{ value, label: String(value) } as MeterStep<T>]
			: Array.isArray(value)
				? value
				: [value]
	);

	// One source of truth for the fill, the visible text and the ARIA values: the segment value is
	// clamped into [min, max] and measured as (clamped - min) / (max - min). A non-finite value
	// reads as `min`.
	const finiteValue = (stepValue: number) => (Number.isFinite(stepValue) ? stepValue : min);
	const percentOf = (stepValue: number) => toPercent(finiteValue(stepValue), min, max);

	const createMeterSprings = (steps: MeterStep<T>[]) =>
		steps.map((step) => ({ width: spring(percentOf(step.value)) }));

	let springs = $state(untrack(() => createMeterSprings(meterSteps)));

	$effect(() => {
		const currentSteps = meterSteps;
		if (springs.length !== currentSteps.length) {
			springs = createMeterSprings(currentSteps);
			return;
		}
		for (const [index, step] of currentSteps.entries()) {
			springs[index].width.set(percentOf(step.value), { soft });
		}
	});

	const classes = $derived(useMeterTheme(theme));

	// Accessibility. One segment makes the root a `meter`; several make it a `group` of meters,
	// one per segment. Either root is described by the helper and description. The value text is the indicator text, so what is announced matches what is
	// drawn, and aria-valuenow is clamped to the scale.
	const stacked = $derived(meterSteps.length !== 1);
	const labelRendered = $derived(!header && !!label);
	// `format` shapes the value text in value mode; the percentage text is the share of the scale.
	const rangeOptions = (stepValue: number) => ({
		value: finiteValue(stepValue),
		min,
		max,
		locale,
		format: showIndicatorAs === 'value' ? (format ?? {}) : undefined
	});
	const valueText = (step: MeterStep<T>) => formatRangeValue(rangeOptions(step.value));
	const ariaValues = (step: MeterStep<T>) =>
		rangeAriaAttributes({
			...rangeOptions(step.value),
			getAriaValueText:
				getAriaValueText &&
				((formattedValue, rawValue) =>
					getAriaValueText({
						value: clampRange(rawValue ?? min, min, max),
						formattedValue,
						min,
						max
					}))
		});
	const rootAria = $derived(stacked ? undefined : ariaValues(meterSteps[0]));
	// A custom `header` replaces the rendered label, so a string label still names the meter
	// directly. A single segment object can name it with its own label; the catalog name is the
	// last resort so every meter is announced with a name.
	const rootName = $derived.by(() => {
		if (labelRendered) return undefined;
		if (typeof label === 'string' && label) return label;
		if (stacked) return undefined;
		if (typeof value !== 'number' && meterSteps[0]?.label) return meterSteps[0].label;
		return t.meter;
	});
	const describedBy = $derived(
		[!header && helper ? helperId : undefined, description ? descriptionId : undefined]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const labelsPositions = $derived(meterSteps.map((step) => step.position || 'top'));
	const labelsPosition: 'top' | 'bottom' | 'both' | undefined = $derived(
		labelsPositions.includes('top') && labelsPositions.includes('bottom')
			? 'both'
			: labelsPositions.includes('top')
				? 'top'
				: undefined
	);
</script>

{#snippet meter(index: number, meter: MeterStep<T>)}
	{@const spring = springs[index]}
	{@const aria = stacked ? ariaValues(meter) : undefined}
	<div
		data-first={index === 0}
		data-last={index === springs.length - 1}
		data-color={meter.color ?? color}
		role={stacked ? 'meter' : undefined}
		aria-label={stacked ? meter.label || t.meterSegment(index + 1, meterSteps.length) : undefined}
		aria-valuemin={aria?.['aria-valuemin']}
		aria-valuemax={aria?.['aria-valuemax']}
		aria-valuenow={aria?.['aria-valuenow']}
		aria-valuetext={aria?.['aria-valuetext']}
		style:width="{spring.width.current}%"
		class={classes.container({ first: index === 0, last: index === springs.length - 1 })}
	>
		{#snippet indicatorContent()}
			{showIndicatorAs ? valueText(meter) : ''}
		{/snippet}
		<Slot
			as="span"
			class={classes.indicator({ size, position: meter.position || 'top' })}
			render={indicator}
			children={showIndicatorAs ? indicatorContent : undefined}
			attrs={{
				'data-position': meter.position || 'top'
			}}
		/>

		<div class={classes.progress({ size })}></div>
		{#if stacked}
			<!-- Forces NVDA to read the meter's name (mui/base-ui#4184). -->
			<span role="presentation" class="sr-only">x</span>
		{/if}
	</div>
{/snippet}

{#snippet headerSnippet()}
	{#if label}
		<!-- role="presentation" completes the NVDA workaround (mui/base-ui#4200): NVDA skips a name
		     that comes from a label inside the meter (nvaccess/nvda#16204). aria-labelledby still
		     resolves through a presentational element. -->
		<div id={labelId} role="presentation" class={classes.label({ size })}>
			{#if typeof label === 'string'}{label}{:else}{@render label()}{/if}
		</div>
	{/if}
	<Slot class={classes.helper({ size })} render={helper} attrs={{ id: helperId }} />
{/snippet}
<div
	class={classes.root({ size, className })}
	role={stacked ? 'group' : 'meter'}
	aria-labelledby={labelRendered ? labelId : undefined}
	aria-label={rootName}
	aria-describedby={describedBy}
	aria-valuemin={rootAria?.['aria-valuemin']}
	aria-valuemax={rootAria?.['aria-valuemax']}
	aria-valuenow={rootAria?.['aria-valuenow']}
	aria-valuetext={rootAria?.['aria-valuetext']}
>
	<Slot
		class={classes.header({ size })}
		renderIf={!!(header || label || helper)}
		render={header ? header : label || helper ? headerSnippet : undefined}
	/>
	<div class={classes.track({ size, labelsPosition })}>
		{#each meterSteps as step, i (i)}
			{@render meter(i, step)}
		{/each}
	</div>
	{#if showLegend}
		<div class={classes.legend({ size })}>
			{#each meterSteps as meterItem, i (i)}
				<div data-color={meterItem.color ?? color} class={classes.legendItem({ size })}>
					{#if meterItem.icon}
						<div class={classes.legendIcon({ size })}>
							{@render meterItem.icon()}
						</div>
					{/if}
					{#if meterItem.label}
						<span class={classes.legendLabel({ size })}>{meterItem.label}</span>
					{/if}
					<span class={classes.legendPercentage({ size })}>
						{formatRangeValue({ value: finiteValue(meterItem.value), min, max, locale })}
					</span>
				</div>
			{/each}
		</div>
	{/if}
	<Slot class={classes.description({ size })} render={description} attrs={{ id: descriptionId }} />
	{#if !stacked}
		<!-- Forces NVDA to read the meter's name (mui/base-ui#4184). -->
		<span role="presentation" class="sr-only">x</span>
	{/if}
</div>
