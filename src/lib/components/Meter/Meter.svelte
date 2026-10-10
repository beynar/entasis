<script lang="ts" generics="T = unknown, S = unknown">
	import type { MeterProps, MeterStep } from './meter.props.js';
	import { useMeterTheme } from './meter.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import { useSpringState } from '$lib/utils/spring.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
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
		header,
		label,
		helper,
		description,
		theme
	}: MeterProps<T, S> = $props();
	const t = $derived(useI18n());

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

	const percentOf = (stepValue: number) => (stepValue / max) * 100;

	const createMeterSprings = (steps: MeterStep<T>[]) =>
		steps.map((step) => ({
			value: spring(step.value),
			width: spring(percentOf(step.value))
		}));

	let springs = $state(untrack(() => createMeterSprings(meterSteps)));

	$effect(() => {
		const currentSteps = meterSteps;
		if (springs.length !== currentSteps.length) {
			springs = createMeterSprings(currentSteps);
			return;
		}
		for (const [index, step] of currentSteps.entries()) {
			springs[index].value.set(step.value || 0, { soft });
			springs[index].width!.set(percentOf(step.value), { soft });
		}
	});

	const classes = $derived(useMeterTheme(theme));

	// Accessibility. One segment makes the root a `meter`; several make it a `group` of meters,
	// one per segment. The value text is the indicator text, so what is announced matches what is
	// drawn, and aria-valuenow is clamped to the scale.
	const stacked = $derived(meterSteps.length !== 1);
	const labelRendered = $derived(!header && !!label);
	const clampToScale = (stepValue: number) =>
		Number.isFinite(stepValue) ? Math.min(max, Math.max(min, stepValue)) : min;
	const valueText = (step: MeterStep<T>) =>
		showIndicatorAs === 'value' ? step.value.toFixed(0) : `${percentOf(step.value).toFixed(0)}%`;
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
	<div
		data-first={index === 0}
		data-last={index === springs.length - 1}
		data-color={meter.color ?? color}
		role={stacked ? 'meter' : undefined}
		aria-label={stacked ? meter.label || t.meterSegment(index + 1, meterSteps.length) : undefined}
		aria-valuemin={stacked ? min : undefined}
		aria-valuemax={stacked ? max : undefined}
		aria-valuenow={stacked ? clampToScale(meter.value) : undefined}
		aria-valuetext={stacked ? valueText(meter) : undefined}
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
		<div id={labelId} class={classes.label({ size })}>
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
	aria-describedby={stacked ? undefined : describedBy}
	aria-valuemin={stacked ? undefined : min}
	aria-valuemax={stacked ? undefined : max}
	aria-valuenow={stacked ? undefined : clampToScale(meterSteps[0].value)}
	aria-valuetext={stacked ? undefined : valueText(meterSteps[0])}
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
				{@const percentage = percentOf(meterItem.value)}
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
						{percentage.toFixed(0)}%
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
