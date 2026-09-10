<script lang="ts" module>
	export type { StepperState } from './stepper.state.svelte.js';
</script>

<script lang="ts" generics="Item">
	/* eslint-disable no-useless-assignment -- bindableStepper is an output binding. */
	import { onMount, tick, untrack } from 'svelte';
	import BeforeHydratation from '../Utils/BeforeHydratation.svelte';
	import { type StepperProps } from './stepper.props.js';
	import { useStepperTheme } from './stepper.theme.js';
	import { StepperState as StepperStateClass } from './stepper.state.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	let {
		items = [],
		defaultValue = 0,
		value = $bindable(),
		stepper: bindableStepper = $bindable<StepperStateClass<Item>>(),
		class: className,
		children,
		onValueChange,
		keyFramesOptions = {
			duration: 300,
			easing: 'ease-in-out',
			fill: 'both'
		},
		mode = 'classic',
		panelRole = 'tabpanel',
		panelAriaLabelledby,
		panelAriaLabel
	}: StepperProps<Item> = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const id = $props.id();

	const stepper = new StepperStateClass({
		get value() {
			return valueState.value;
		},
		set value(nextValue) {
			valueState.value = nextValue;
		},
		get items() {
			return items;
		},
		get onValueChange() {
			return onValueChange;
		},
		get keyFramesOptions() {
			return keyFramesOptions;
		}
	});

	bindableStepper = stepper;
	const classes = $derived(useStepperTheme());
	const stepCount = $derived(Math.max(items.length, 1));
	const trackWidth = $derived(`${stepCount * 100}%`);
	const activeHeight = $derived(stepper.activeHeight);

	onMount(() => {
		void tick().then(() => stepper.measureStepHeights());
	});

	$effect(() => {
		const targetStep = valueState.value;
		if (items.length === 0) return;
		untrack(() => stepper.syncActiveStep(targetStep));
	});

	const getPanelAriaLabelledby = (item: Item, index: number) => {
		if (panelAriaLabelledby === false) return undefined;
		if (typeof panelAriaLabelledby === 'function') {
			return panelAriaLabelledby({ stepper, item, index });
		}
		if (typeof panelAriaLabelledby === 'string') return panelAriaLabelledby;
		if (panelRole === 'tabpanel') return `stepper-${index}`;
		return undefined;
	};

	const getPanelAriaLabel = (item: Item, index: number) => {
		if (typeof panelAriaLabel === 'function') {
			return panelAriaLabel({ stepper, item, index });
		}
		return panelAriaLabel;
	};
</script>

<BeforeHydratation
	once
	scripts={[
		`const setStepperHeight_${id} = () => {	
const container = document.getElementById('stepper-${id}');
if(!container) return;
const firstSlide = container.querySelector('[data-step-active="true"]');
if(!firstSlide) return;		
container.style.height = firstSlide.clientHeight + 'px';			
	};
	setStepperHeight_${id}();
`
	]}
/>

<div
	{@attach stepper.scroller}
	class={classes.root({
		mode,
		className
	})}
	id="stepper-{id}"
	style:will-change="height"
	style:height={activeHeight == null ? undefined : `${activeHeight}px`}
	style:transition-duration={`${keyFramesOptions.duration}ms`}
	style:transition-timing-function={keyFramesOptions.easing}
>
	<div
		bind:this={stepper.stepContainer}
		class={classes.container({
			mode
		})}
		style:width={trackWidth}
		style:grid-template-columns="repeat({stepCount}, minmax(0, 1fr))"
	>
		{#each items as item, index (index)}
			{@const isActiveStep = stepper.value === index}
			{@const ariaLabelledby = getPanelAriaLabelledby(item, index)}
			{@const ariaLabel = getPanelAriaLabel(item, index)}
			{@const panelTabindex = panelRole === 'tabpanel' ? (isActiveStep ? 0 : -1) : undefined}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				bind:clientHeight={
					() => stepper?.stepHeights?.[index] ?? undefined,
					(value) => {
						stepper.setStepHeight(index, value || 0);
					}
				}
				data-step-active={isActiveStep ? 'true' : undefined}
				data-step={index}
				tabindex={panelTabindex}
				inert={!isActiveStep}
				role={panelRole ?? undefined}
				aria-label={ariaLabel}
				aria-labelledby={ariaLabelledby}
				aria-hidden={!isActiveStep ? 'true' : undefined}
				style:transition-duration={`${keyFramesOptions.duration}ms`}
				style:transition-timing-function={keyFramesOptions.easing}
				class={classes.step({
					mode
				})}
			>
				{@render children?.({ stepper, item, index })}
			</div>
		{/each}
	</div>
</div>
