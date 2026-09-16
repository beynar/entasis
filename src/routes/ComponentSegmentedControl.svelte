<script lang="ts" generics="Value extends string">
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type { SegmentedControlItem } from '$lib/components/SegmentedControl/segmentedControl.props.js';

	type Option = Value | { value: Value; label: string };

	let {
		label,
		value = $bindable(),
		options
	}: {
		label: string;
		value: Value;
		options: readonly Option[];
	} = $props();

	const items = $derived(
		options.map((option) => {
			const choice = typeof option === 'string' ? { value: option, label: option } : option;
			return { value: choice.value, label: choice.label } satisfies SegmentedControlItem<Value>;
		})
	);
</script>

<div class="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-2">
	<span class="text-neutral/70 text-xs font-medium">{label}</span>
	<SegmentedControl {items} bind:value size="small" variant="pill" {label} />
</div>
