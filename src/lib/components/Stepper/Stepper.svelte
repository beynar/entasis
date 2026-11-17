<script lang="ts" module>
	export type { StepperState } from './stepper.state.svelte.js';
</script>

<script lang="ts" generics="Item">
	/* eslint-disable no-useless-assignment -- bindableApi is an output binding. */
	import { BROWSER } from 'esm-env';
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
		panelActivationDirection,
		mount = 'eager',
		fit = 'container'
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
		},
		get fit() {
			return fit;
		}
	});

	// Published in the browser only: a server write would make Svelte replay the parent's markup.
	if (BROWSER) bindableApi = stepper;
	const classes = $derived(useStepperTheme(theme));
	const stepCount = $derived(Math.max(items.length, 1));
	const fitsContent = $derived(fit === 'content');
	const trackWidth = $derived(
		fitsContent ? 'max-content' : stepper.expanded ? `${stepCount * 100}%` : '100%'
	);
	const trackColumns = $derived(
		`repeat(${stepper.expanded ? stepCount : 1}, ${fitsContent ? 'max-content' : 'minmax(0, 1fr)'})`
	);
	const activeHeight = $derived(stepper.activeHeight);
	const activeWidth = $derived(stepper.activeWidth);

	// With `fit: 'content'` each panel's own width is read from its border box: unlike
	// `clientWidth` it keeps the fraction, so the root never rounds a panel's text into wrapping,
	// and unlike `getBoundingClientRect` it ignores a transform on an ancestor (a popup scaling in).
	const measureWidth = (index: number) => (node: HTMLElement) => {
		if (!fitsContent || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(([entry]) => {
			const size = entry?.borderBoxSize?.[0]?.inlineSize ?? node.offsetWidth;
			stepper.setStepWidth(index, node.hidden ? 0 : size);
		});
		observer.observe(node);
		return () => observer.disconnect();
	};

	onMount(() => {
		void tick().then(() => stepper.measureStepHeights());
	});

	$effect(() => {
		const targetStep = valueState.value;
		if (items.length === 0) return;
		// Panels of their own width are placed from the layout, which shows the new panel only
		// once this update has reached the DOM: the slide starts in the microtask after it, before
		// any paint (`tick()` would wait for the next frame in async mode).
		if (untrack(() => fit) === 'content') {
			queueMicrotask(() => {
				if (valueState.value === targetStep) stepper.syncActiveStep(targetStep);
			});
			return;
		}
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
if (container.dataset.fit === 'content') container.style.width = firstSlide.getBoundingClientRect().width + 'px';
	};
	setStepperHeight_${id}();
`
	]}
/>

<div
	{@attach stepper.scroller}
	class={classes.root({
		mode,
		fit,
		className
	})}
	id="stepper-{id}"
	data-animating={stepper.isAnimating}
	data-fit={fit}
	style:will-change={fitsContent ? 'width, height' : 'height'}
	style:height={activeHeight == null ? undefined : `${activeHeight}px`}
	style:width={activeWidth == null ? undefined : `${activeWidth}px`}
	style:transition-duration={`${stepper.timing.duration}ms`}
	style:transition-timing-function={stepper.timing.easing}
>
	<div
		bind:this={stepper.stepContainer}
		class={classes.container({
			mode,
			fit
		})}
		style:width={trackWidth}
		style:grid-template-columns={trackColumns}
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
				data-activation-direction={panelActivationDirection?.(index)}
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
					mode,
					fit
				})}
				{@attach measureWidth(index)}
			>
				{#if mounted}
					{@render children?.({ api: stepper, item, index })}
				{/if}
			</div>
		{/each}
	</div>
</div>
