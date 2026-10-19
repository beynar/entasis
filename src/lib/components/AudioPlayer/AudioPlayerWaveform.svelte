<script lang="ts">
	import type { Colors, Sizes } from '$lib/types/theme.js';
	import type { AudioPlayerWaveformVariant } from './audioPlayer.props.js';
	import type { useAudioPlayerTheme } from './audioPlayer.theme.js';
	import { formatAudioPlayerTime } from './audioPlayer.time.js';
	import { getAudioPlayerBarFill, getAudioPlayerBarHeight } from './audioPlayer.waveform.js';

	type AudioPlayerClasses = ReturnType<typeof useAudioPlayerTheme>;

	let {
		classes,
		size,
		color,
		variant,
		samples,
		currentTime,
		duration,
		buffered,
		disabled = false,
		label,
		onSeek
	}: {
		classes: AudioPlayerClasses;
		size: Sizes;
		color: Colors;
		variant: AudioPlayerWaveformVariant;
		samples: number[];
		currentTime: number;
		duration: number;
		buffered: number;
		disabled?: boolean;
		label: string;
		onSeek: (time: number) => void;
	} = $props();

	const maxValue = $derived(Math.max(0, duration));
	const currentValue = $derived(clamp(currentTime, 0, maxValue));
	const progressPercentage = $derived(maxValue > 0 ? (currentValue / maxValue) * 100 : 0);
	const bufferedPercentage = $derived(
		maxValue > 0 ? (clamp(buffered, 0, maxValue) / maxValue) * 100 : 0
	);
	const disabledInput = $derived(disabled || maxValue <= 0);
	const formattedValue = $derived(formatAudioPlayerTime(currentValue, maxValue));
	const gridStyle = $derived(`grid-template-columns: repeat(${samples.length}, minmax(1px, 1fr));`);

	function handleInput(event: Event) {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		onSeek(Number(input.value));
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}
</script>

<div
	data-slot="audio-player-waveform"
	data-color={color}
	class={classes.waveform({ size, variant, disabled: disabledInput })}
>
	<div
		data-slot="audio-player-waveform-bars"
		class={classes.waveformBars({ variant })}
		style={gridStyle}
		aria-hidden="true"
	>
		{#each samples as sample, index (index)}
			<span
				data-slot="audio-player-waveform-bar"
				class={classes.waveformBar({ variant })}
				style={`height: ${getAudioPlayerBarHeight(sample)};`}
			>
				<span
					data-slot="audio-player-waveform-bar-buffered"
					class={classes.waveformBarBuffered()}
					style={`width: ${getAudioPlayerBarFill(index, samples.length, bufferedPercentage)};`}
				></span>
				<span
					data-slot="audio-player-waveform-bar-fill"
					data-color={color}
					class={classes.waveformBarFill()}
					style={`width: ${getAudioPlayerBarFill(index, samples.length, progressPercentage)};`}
				></span>
			</span>
		{/each}
	</div>

	<input
		data-slot="audio-player-waveform-input"
		class={classes.waveformInput()}
		type="range"
		aria-label={label}
		aria-valuetext={formattedValue}
		min={0}
		max={maxValue}
		step={0.1}
		value={currentValue}
		disabled={disabledInput}
		oninput={handleInput}
		onchange={handleInput}
	/>
</div>
