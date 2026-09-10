<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import Slider from '../Form/Slider/Slider.svelte';
	import { getVideoPlayerSliderTheme } from './videoPlayer.slider.theme.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		classes,
		size,
		label,
		value,
		min = 0,
		max = 100,
		step = 1,
		buffered,
		disabled = false,
		showValue = false,
		orientation = 'horizontal',
		format = (nextValue: number) => `${nextValue}`,
		onValueChange
	}: {
		classes: VideoPlayerClasses;
		size: Sizes;
		label: string;
		value: number;
		min?: number;
		max?: number;
		step?: number;
		buffered?: number;
		disabled?: boolean;
		showValue?: boolean;
		orientation?: 'horizontal' | 'vertical';
		format?: (value: number) => string;
		onValueChange: (value: number) => void;
	} = $props();

	const maxValue = $derived(Math.max(min, max));
	const bufferedPercentage = $derived.by(() => {
		if (!buffered || maxValue <= min) return 0;
		return Math.min(100, Math.max(0, ((buffered - min) / (maxValue - min)) * 100));
	});
	const bufferedStyle = $derived(`--video-player-slider-buffered: ${bufferedPercentage}%;`);
	const sliderTheme = $derived(getVideoPlayerSliderTheme(orientation));

	function handleChange(nextValue: number | number[] | null) {
		onValueChange(Array.isArray(nextValue) ? (nextValue[0] ?? min) : (nextValue ?? min));
	}
</script>

<div
	data-slot="video-player-slider"
	class={classes.slider({ size, disabled })}
	style={bufferedStyle}
>
	<Slider
		{label}
		{value}
		{min}
		max={maxValue}
		{step}
		{disabled}
		{showValue}
		formatValue={(nextValue) => format(nextValue)}
		thumbLabels={[label]}
		color="primary"
		variant="thick"
		{orientation}
		{size}
		theme={sliderTheme}
		onValueChange={handleChange}
	/>
</div>
