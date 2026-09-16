<script lang="ts" generics="Item extends TabItem = TabItem">
	import { Tabbar } from '$lib/components/Tabbar/index.js';
	import { Stepper } from '$lib/components/Stepper/index.js';
	import { getTabValue, type TabItem } from '$lib/components/Tabbar/tabbar.props.js';
	import { StepperState } from '../Stepper/stepper.state.svelte.js';
	import type { TabsProps } from './tabs.props.js';
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
		() => defaultValue ?? (items[0] === undefined ? '' : getTabValue(items[0], 0))
	);

	const id = $props.id();
	const tabValues = $derived(items.map(getTabValue));
	// Stepper works in indexes; Tabs speaks values. Map both ways here, once.
	const activeIndex = $derived(Math.max(0, tabValues.indexOf(valueState.value)));
	const setActiveIndex = (index: number) => {
		const next = tabValues[index];
		if (next !== undefined && next !== valueState.value) valueState.value = next;
	};
	const emitChange = (index: number) => {
		onValueChange?.({ value: tabValues[index], item: items[index], index });
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

	function handleTabChange(nextValue: string) {
		emitChange(tabValues.indexOf(nextValue));
	}
</script>

<div class={classes.root({ placement, className })} {...attachments}>
	<Tabbar
		id={`${id}-tabs`}
		controlsPanels
		fullWidth={tabbar?.fullWidth}
		label={tabbar?.label}
		onValueChange={handleTabChange}
		{items}
		bind:value={valueState.value}
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
		onValueChange={({ value: index }) => emitChange(index)}
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
