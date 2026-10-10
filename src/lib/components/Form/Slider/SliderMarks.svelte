<script lang="ts">
	import Slot from '$lib/components/Slot/Slot.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import type { SliderMark } from './slider.props.js';
	import type { SliderState } from './slider.state.svelte.js';
	import type { useSliderTheme } from './slider.theme.js';

	type SliderClasses = ReturnType<typeof useSliderTheme>;

	let {
		marks,
		slider,
		classes,
		size
	}: {
		marks: SliderMark[];
		slider: SliderState;
		classes: SliderClasses;
		size?: Sizes;
	} = $props();

	const getMarkStyle = (value: number) => {
		const percentage = slider.getPercentage(value);
		if (slider.orientationValue === 'vertical') {
			return `bottom: ${percentage}%;`;
		}
		return `inset-inline-start: ${percentage}%;`;
	};
</script>

{#if marks.length}
	<div class={classes.marks({ orientation: slider.orientationValue, size })} aria-hidden="true">
		{#each marks as mark (mark.value)}
			{@const markPayload = slider.markPayload(mark)}
			<div
				class={classes.mark({ orientation: slider.orientationValue })}
				style={getMarkStyle(mark.value)}
			>
				<span class={classes.markDot()}></span>
				{#if mark.label}
					<Slot
						as="span"
						render={mark.label}
						payload={{ ...markPayload, mark }}
						class={classes.markLabel()}
					/>
				{/if}
			</div>
		{/each}
	</div>
{/if}
