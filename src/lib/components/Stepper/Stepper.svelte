<script lang="ts" module>
	export type { StepperState } from './stepper.state.svelte.js';
</script>

<script lang="ts" generics="Item">
	/* eslint-disable no-useless-assignment -- bindableApi is an output binding. */
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
		api: bindableApi = $bindable<StepperStateClass<Item>>(),
		class: className,
		children,
		onValueChange,
		transition,
		theme,
		mode = 'classic',
		panelRole = 'tabpanel',
		panelAriaLabelledby,
		panelAriaLabel,
		panelId,
		mount = 'eager'
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
		get transition() {
			return transition;
		},
		get motion() {
			return theme?.motion;
		}
	});

	bindableApi = stepper;
	const classes = $derived(useStepperTheme(theme));
	const stepCount = $derived(Math.max(items.length, 1));
	const trackWidth = $derived(stepper.expanded ? `${stepCount * 100}%` : '100%');
	const activeHeight = $derived(stepper.activeHeight);

	onMount(() => {
		void tick().then(() => stepper.measureStepHeights());
	});

	$effect(() => {
		const targetStep = valueState.value;
		if (items.length === 0) return;
		untrack(() => stepper.syncActiveStep(targetStep));
	});

	// `once` keeps a panel after its first activation, so the steps that have been reached are
	// recorded here rather than inferred from the current value. `eager` — the default, because a
	// wizard's earlier steps stay live — mounts everything up front, and `lazy` only ever keeps
	// the active panel alive. Tabs asks for `lazy` instead: its panels are whole screens.
	const activated = $state<Record<number, boolean>>({});
	$effect(() => {
		activated[valueState.value] = true;
	});
	// `hidden` is `display:none`: a panel dropped on the same tick as the value change cannot slide
	// out, cannot fade out, and reports `clientHeight` 0 while the root is still animating to the
	// new height. The panel the track currently shows (`visualStep`) therefore stays rendered —
	// inert and `aria-hidden`, so it is out of the accessibility tree — until the slide settles and
	// `visualStep` catches up with `value`. Keyed on `visualStep` alone, not on `isAnimating`: the
	// value changes one flush before the slide starts, and gating on the animation flag hid the
	// outgoing panel for that frame, which collapsed the track and reset its fade.
	const isLeaving = (index: number) => index === stepper.visualStep;
	const isMounted = (index: number, isActiveStep: boolean) =>
		mount === 'eager' ||
		isActiveStep ||
		(mount === 'once' && activated[index] === true) ||
		isLeaving(index);

	const getPanelAriaLabelledby = (item: Item, index: number) => {
		if (panelAriaLabelledby === false) return undefined;
		if (typeof panelAriaLabelledby === 'function') {
			return panelAriaLabelledby({ api: stepper, item, index });
		}
		if (typeof panelAriaLabelledby === 'string') return panelAriaLabelledby;
		if (panelRole === 'tabpanel') return `stepper-${index}`;
		return undefined;
	};

	const getPanelAriaLabel = (item: Item, index: number) => {
		if (typeof panelAriaLabel === 'function') {
			return panelAriaLabel({ api: stepper, item, index });
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
	data-animating={stepper.isAnimating}
	style:will-change="height"
	style:height={activeHeight == null ? undefined : `${activeHeight}px`}
	style:transition-duration={`${stepper.timing.duration}ms`}
	style:transition-timing-function={stepper.timing.easing}
>
	<div
		bind:this={stepper.stepContainer}
		class={classes.container({
			mode
		})}
		style:width={trackWidth}
		style:grid-template-columns="repeat({stepper.expanded ? stepCount : 1}, minmax(0, 1fr))"
	>
		{#each items as item, index (index)}
			{@const isActiveStep = stepper.value === index}
			{@const ariaLabelledby = getPanelAriaLabelledby(item, index)}
			{@const label = getPanelAriaLabel(item, index)}
			{@const panelTabindex = panelRole === 'tabpanel' ? (isActiveStep ? 0 : -1) : undefined}
			{@const mounted = isMounted(index, isActiveStep)}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				bind:clientHeight={
					() => stepper?.stepHeights?.[index] ?? undefined,
					(value) => {
						stepper.setStepHeight(index, value || 0);
					}
				}
				id={panelId?.(index)}
				data-step-active={isActiveStep ? 'true' : undefined}
				data-step={index}
				tabindex={panelTabindex}
				hidden={!isActiveStep && !isLeaving(index)}
				inert={!isActiveStep}
				role={panelRole ?? undefined}
				aria-label={label}
				aria-labelledby={ariaLabelledby}
				aria-hidden={!isActiveStep ? 'true' : undefined}
				style:transition-duration={`${stepper.timing.duration}ms`}
				style:transition-timing-function={stepper.timing.easing}
				style:grid-column={stepper.expanded ? index + 1 : 1}
				class={classes.step({
					mode
				})}
			>
				{#if mounted}
					{@render children?.({ api: stepper, item, index })}
				{/if}
			</div>
		{/each}
	</div>
</div>
