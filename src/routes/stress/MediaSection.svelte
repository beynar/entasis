<script lang="ts">
	import { AudioPlayer } from '$lib/components/AudioPlayer/index.js';
	import { ImageZoom } from '$lib/components/ImageZoom/index.js';
	import { MediaVolumeControl } from '$lib/components/MediaVolume/index.js';
	import { VideoPlayer } from '$lib/components/VideoPlayer/index.js';
	import type { Sizes } from '$lib/types/theme.js';
	import Matrix from './Matrix.svelte';
	import Section from './Section.svelte';
	import { colors, imageOne, posterImage, silentAudio, sizes } from './fixtures.js';

	let { size = 'normal' }: { size?: Sizes } = $props();

	const waveform = Array.from(
		{ length: 48 },
		(_, index) => 0.25 + Math.abs(Math.sin(index / 3)) * 0.7
	);
</script>

<Section
	id="media"
	title="Media"
	description="AudioPlayer, VideoPlayer (poster only, never autoplaying), ImageZoom, MediaVolumeControl."
>
	<Matrix
		caption="AudioPlayer"
		varies="variant (waveform, track), color, size, layout"
		note="Source is a 20ms inline silent WAV, so nothing is fetched and nothing plays on load."
		layout="stack"
	>
		{#each colors as color (color)}
			<AudioPlayer
				src={silentAudio}
				title="Track — {color}"
				artist="Stress test"
				{color}
				{size}
				{waveform}
				artwork={false}
			/>
		{/each}
		<AudioPlayer
			src={silentAudio}
			title="Track variant"
			variant="track"
			color="primary"
			{size}
			artwork={false}
		/>
		<AudioPlayer
			src={silentAudio}
			title="Inline layout"
			layout="inline"
			color="neutral"
			{size}
			artwork={false}
		/>
		{#each sizes as playerSize (playerSize)}
			<AudioPlayer
				src={silentAudio}
				title="Size {playerSize}"
				size={playerSize}
				{waveform}
				artwork={false}
			/>
		{/each}
	</Matrix>

	<Matrix
		caption="VideoPlayer"
		varies="ratio, size"
		note="Poster only — no src, no autoplay, so no media is loaded."
		layout="grid"
		class="items-start"
	>
		{#each sizes as playerSize (playerSize)}
			<VideoPlayer
				poster={posterImage}
				title="Size {playerSize}"
				size={playerSize}
				autoplay={false}
				preload="none"
				ratio="16x9"
			/>
		{/each}
		<VideoPlayer
			poster={posterImage}
			title="Square"
			autoplay={false}
			preload="none"
			ratio="1x1"
			{size}
		/>
	</Matrix>

	<Matrix caption="ImageZoom" varies="disabled, indicator" layout="wrap">
		<ImageZoom src={imageOne} alt="Zoomable landscape" width={200} height={125} />
		<ImageZoom src={imageOne} alt="Disabled zoom" width={200} height={125} disabled />
	</Matrix>

	<Matrix caption="MediaVolumeControl" varies="mode, color, size, muted">
		{#each colors as color (color)}
			<MediaVolumeControl
				volume={0.6}
				muted={false}
				{color}
				{size}
				onVolumeChange={() => {}}
				onToggleMuted={() => {}}
			/>
		{/each}
		<MediaVolumeControl
			volume={0.4}
			muted={false}
			mode="inline"
			color="primary"
			{size}
			onVolumeChange={() => {}}
			onToggleMuted={() => {}}
		/>
		<MediaVolumeControl
			volume={0}
			muted={true}
			color="neutral"
			{size}
			onVolumeChange={() => {}}
			onToggleMuted={() => {}}
		/>
	</Matrix>
</Section>
