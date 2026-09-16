<script lang="ts" generics="T = unknown, S = unknown">
	import type { MeterProps, MeterStep } from './meter.props.js';
	import { useMeterTheme } from './meter.theme.js';
	import Slot from '../Slot/Slot.svelte';
	import { useSpringState } from '$lib/utils/spring.svelte.js';
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
		max = 100,
		header,
		label,
		helper,
		description,
		theme
	}: MeterProps<T, S> = $props();

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

	const createMeterSprings = (steps: MeterStep<T>[]) =>
		steps.map((step) => {
			const percentage = (step.value / max) * 100;
			return {
				percentage,
				value: spring(step.value),
				width: spring(percentage)
			};
		});

	let springs = $state(untrack(() => createMeterSprings(meterSteps)));

	$effect(() => {
		const currentSteps = meterSteps;
		if (springs.length !== currentSteps.length) {
			springs = createMeterSprings(currentSteps);
			return;
		}
		for (const [index, step] of currentSteps.entries()) {
			springs[index].percentage = (step.value / max) * 100;
			springs[index].value.set(step.value || 0, { soft });
			springs[index].width!.set((step.value / max) * 100, { soft });
		}
	});

	const classes = $derived(useMeterTheme(theme));

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
		style:width="{spring.width.current}%"
		class={classes.container({ first: index === 0, last: index === springs.length - 1 })}
	>
		{#snippet indicatorContent()}
			{showIndicatorAs === 'value'
				? meter.value.toFixed(0)
				: showIndicatorAs === 'percentage'
					? `${spring.percentage.toFixed(0)}%`
					: ''}
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
	</div>
{/snippet}

{#snippet headerSnippet()}
	<Slot class={classes.label({ size })} render={label} />
	<Slot class={classes.helper({ size })} render={helper} />
{/snippet}
<div class={classes.root({ size, className })}>
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
				{@const percentage = (meterItem.value / max) * 100}
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
	<Slot class={classes.description({ size })} render={description} />
</div>
