<script lang="ts">
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { SegmentedControlItem } from '$lib/components/SegmentedControl/segmentedControl.props.js';
	import Slider from '$lib/components/Form/Slider/Slider.svelte';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
	import type { ComponentControlOption, ComponentControls } from './componentControls.svelte.js';

	let { controls }: { controls: ComponentControls } = $props();

	function getSegmentedItems(options: readonly ComponentControlOption[]): SegmentedControlItem[] {
		return options.map((option) =>
			typeof option === 'string' ? { value: option, label: option } : option
		);
	}
</script>

{#each controls.definitions as control (control.name)}
	<div class={controls.isVisible(control) ? 'contents' : 'hidden'}>
		{#if control.type === 'segmented'}
			<div class="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-2">
				<span class="text-neutral/60 text-xs font-medium">{control.label}</span>
				<SegmentedControl
					items={getSegmentedItems(control.options)}
					bind:value={
						() => controls.value[control.name] as string,
						(value) => controls.setValue(control.name, value)
					}
					size={control.size ?? 'small'}
					color={control.color}
					variant={control.variant ?? 'pill'}
					disabled={control.disabled}
					ariaLabel={control.ariaLabel ?? control.label}
					class={control.class}
				/>
			</div>
		{:else if control.type === 'switch'}
			<Switch
				label={control.label}
				value={controls.value[control.name] as boolean}
				onValueChange={(value) => controls.setValue(control.name, !!value)}
				size={control.size ?? 'small'}
				disabled={control.disabled}
			/>
		{:else}
			<Slider
				label={control.label}
				value={controls.value[control.name] as number}
				onValueChange={(value) => {
					if (typeof value === 'number') controls.setValue(control.name, value);
				}}
				min={control.min}
				max={control.max}
				step={control.step}
				size={control.size ?? 'small'}
				color={control.color}
				variant={control.variant}
				showValue={control.showValue}
				disabled={control.disabled}
				class={control.class}
			/>
		{/if}
	</div>
{/each}
