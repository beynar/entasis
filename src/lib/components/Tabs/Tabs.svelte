<script lang="ts" generics="Item extends TabItem = TabItem">
	import { Tabbar } from '$lib/components/Tabbar/index.js';
	import { Stepper } from '$lib/components/Stepper/index.js';
	import { getTabValue, type TabItem } from '$lib/components/Tabbar/tabbar.props.js';
	import {
		getDefaultTabValue,
		isTabDisabled,
		useTabSelection
	} from '$lib/components/Tabbar/tabbar.selection.svelte.js';
	import { StepperState } from '../Stepper/stepper.state.svelte.js';
	import type { TabsProps, TabsValueChangeReason } from './tabs.props.js';
	import { useTabsMotion, useTabsTheme } from './tabs.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		items,
		defaultValue,
		value = $bindable(),
		onValueChange,
		placement = 'top',
		class: className = '',
		theme,
		api = $bindable<StepperState<Item>>(),
		transition,
		tabbar,
		mount = 'lazy',
		children: panel,
		...attachments
	}: TabsProps<Item> = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue ?? getDefaultTabValue(items)
	);

	const id = $props.id();
	const tabValues = $derived(items.map(getTabValue));
	const emitChange = (index: number, reason: TabsValueChangeReason) => {
		onValueChange?.({ value: tabValues[index], item: items[index], index, reason });
	};
	// One effective selection drives both the tab list and the panels, so a disabled or unknown
	// value can never show one tab as selected next to another tab's panel.
	const selection = useTabSelection({
		items: () => items,
		value: () => valueState.value,
		onFallback: (next, { index, reason }) => {
			valueState.value = next;
			emitChange(index, reason);
		}
	});
	const activeIndex = $derived(selection.index);
	/** The value the Tabbar shows: the resolved tab's, or the raw value when none resolves. */
	const activeValue = $derived(tabValues[activeIndex] ?? valueState.value);
	const isSelectable = (index: number) => index in items && !isTabDisabled(items[index]);
	// Stepper works in indexes; Tabs speaks values. Map both ways here, once. The `api` handle
	// cannot activate a disabled tab: the request is dropped and the panels stay put.
	const setActiveIndex = (index: number) => {
		if (!isSelectable(index)) return;
		const next = tabValues[index];
		if (next !== valueState.value) valueState.value = next;
	};
	const handleStepChange = (index: number) => {
		if (index === activeIndex) {
			emitChange(index, 'user');
			return;
		}
		// `goTo` slides before it reports; slide back to the panel of the selected tab.
		api?.translate();
	};

	const classes = $derived(useTabsTheme(theme));
	// Tabs owns its own motion preset and forwards the resolved `{ in, out }` to the
	// Stepper, where it lands on the Stepper's `transition` prop and wins over the
	// stepper preset.
	const resolveMotion = useTabsMotion();
	const panelTransition = $derived(resolveMotion(undefined, { motion: theme?.motion, transition }));

	// Auto-set tabbar orientation based on placement if not explicitly provided
	const effectiveTabbarOrientation = $derived(
		tabbar?.orientation ??
			(placement === 'left' || placement === 'right' ? 'vertical' : 'horizontal')
	);
</script>

<div class={classes.root({ placement, className })} {...attachments}>
	<Tabbar
		id={`${id}-tabs`}
		controlsPanels
		fullWidth={tabbar?.fullWidth}
		label={tabbar?.label}
		onValueChange={(next) => emitChange(tabValues.indexOf(next), 'user')}
		{items}
		bind:value={() => activeValue, (next) => (valueState.value = next)}
		size={tabbar?.size}
		orientation={effectiveTabbarOrientation}
		color={tabbar?.color}
		alignment={tabbar?.alignment}
		variant={tabbar?.variant}
		scrollFade={tabbar?.scrollFade}
		position={placement}
		class={tabbar?.class}
		theme={tabbar?.theme}
	/>
	<Stepper
		class={classes.content({ placement })}
		bind:api
		{items}
		bind:value={() => activeIndex, setActiveIndex}
		onValueChange={({ value: index }) => handleStepChange(index)}
		panelRole="tabpanel"
		panelId={(index) => `${id}-tabs-panel-${index}`}
		panelAriaLabelledby={({ index }) => `${id}-tabs-tab-${index}`}
		transition={panelTransition}
		{mount}
	>
		{#snippet children(payload)}
			{@render panel?.(payload)}
		{/snippet}
	</Stepper>
</div>
