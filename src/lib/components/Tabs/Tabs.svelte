<script lang="ts" generics="Item extends TabItem = TabItem">
	import { Tabbar } from '$lib/components/Tabbar/index.js';
	import { Stepper } from '$lib/components/Stepper/index.js';
	import type { StepperValueChangePayload } from '$lib/components/Stepper/index.js';
	import type { TabItem } from '$lib/components/Tabbar/tabbar.props.js';
	import { StepperState } from '../Stepper/stepper.state.svelte.js';
	import type { TabsProps } from './tabs.props.js';
	import { useTabsTheme } from './tabs.theme.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

	let {
		items,
		defaultValue = 0,
		value = $bindable(),
		onValueChange,
		placement = 'top',
		class: className = '',
		theme,
		stepper = $bindable<StepperState<Item>>(),
		keyFramesOptions = {
			duration: 300,
			easing: 'ease-in-out',
			fill: 'both'
		},
		tabbarSize,
		tabbarOrientation,
		tabbarColor,
		tabbarAlignment,
		tabbarClass,
		tabbarTheme,
		tabbarFullWidth,
		children: panel
	}: TabsProps<Item> = $props();
	const valueState = createBindableValue(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const classes = $derived(useTabsTheme(theme));

	// Auto-set tabbar orientation based on placement if not explicitly provided
	const effectiveTabbarOrientation = $derived(
		tabbarOrientation ?? (placement === 'left' || placement === 'right' ? 'vertical' : 'horizontal')
	);

	function handleTabChange(index: number) {
		onValueChange?.(index);
	}

	function handleStepChange({ value: nextValue }: StepperValueChangePayload<Item>) {
		onValueChange?.(nextValue);
	}
</script>

<div class={classes.root({ placement, className })}>
	<Tabbar
		fullWidth={tabbarFullWidth}
		onValueChange={handleTabChange}
		{items}
		bind:value={valueState.value}
		size={tabbarSize}
		orientation={effectiveTabbarOrientation}
		color={tabbarColor}
		alignment={tabbarAlignment}
		position={placement}
		class={tabbarClass}
		theme={tabbarTheme}
	/>
	<Stepper
		class={classes.content({ placement })}
		bind:stepper
		{items}
		bind:value={valueState.value}
		onValueChange={handleStepChange}
		{keyFramesOptions}
	>
		{#snippet children(payload)}
			{@render panel?.(payload)}
		{/snippet}
	</Stepper>
</div>
