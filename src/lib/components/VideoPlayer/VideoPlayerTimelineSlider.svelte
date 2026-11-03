<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
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
		buffered = 0,
		disabled = false,
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
		format?: (value: number) => string;
		onValueChange: (value: number) => void;
	} = $props();

	const maxValue = $derived(Math.max(min, max));
	const isDisabled = $derived(disabled || maxValue <= min);
	const currentValue = $derived(clampValue(value));
	const currentPercentage = $derived(getPercentage(currentValue));
	const bufferedPercentage = $derived(getPercentage(buffered));
	const formattedValue = $derived(format(currentValue));

	function clampValue(nextValue: number) {
		return Math.min(maxValue, Math.max(min, nextValue));
	}

	function getPercentage(nextValue: number) {
		if (maxValue <= min) return 0;
		return ((clampValue(nextValue) - min) / (maxValue - min)) * 100;
	}

	function handleInput(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		onValueChange(Number(input.value));
	}
</script>

<div
	data-slot="video-player-timeline-slider"
	class={classes.slider({ size, disabled: isDisabled })}
>
	<!-- Positions go on the parts themselves: the value changes through playback, and a variable
		 on the root would restyle every part on each change (WebKit also keeps each restyle). -->
	<div
		data-slot="video-player-timeline-track"
		class={classes.timelineTrack({ disabled: isDisabled })}
	>
		<div data-slot="video-player-timeline-rail" class={classes.timelineRail()}>
			<div
				data-slot="video-player-timeline-buffered"
				class={classes.timelineBuffered()}
				style:width="{bufferedPercentage}%"
			></div>
			<div
				data-slot="video-player-timeline-range"
				class={classes.timelineRange()}
				style:width="{currentPercentage}%"
			></div>
		</div>
		<div
			data-slot="video-player-timeline-thumb"
			class={classes.timelineThumb()}
			style:left="{currentPercentage}%"
		></div>
		<input
			data-slot="video-player-timeline-input"
			class={classes.timelineInput()}
			type="range"
			aria-label={label}
			aria-valuetext={formattedValue}
			{min}
			max={maxValue}
			{step}
			value={currentValue}
			disabled={isDisabled}
			oninput={handleInput}
			onchange={handleInput}
		/>
	</div>
</div>
