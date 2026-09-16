<script lang="ts">
	import MediaVolumeControl from '../MediaVolume/MediaVolumeControl.svelte';
	import type { Sizes } from '$lib/types/theme.js';
	import { getVideoPlayerSliderTheme } from './videoPlayer.slider.theme.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		player,
		classes,
		size,
		volumeStep,
		disabled
	}: {
		player: VideoPlayerState;
		classes: VideoPlayerClasses;
		size: Sizes;
		volumeStep: number;
		disabled: boolean;
	} = $props();

	const volumeSliderTheme = getVideoPlayerSliderTheme('horizontal');
</script>

<div data-menu-keep-open="true" class="mt-1 border-t border-white/10 pt-2">
	<MediaVolumeControl
		mode="inline"
		volume={player.volume}
		muted={player.muted}
		{size}
		{volumeStep}
		{disabled}
		color="primary"
		buttonColor="neutral"
		buttonClass={classes.controlButton({ size })}
		orientation="horizontal"
		panelClass={classes.volumePanel()}
		sliderClass={classes.slider({ size, disabled })}
		sliderTheme={volumeSliderTheme}
		onToggleMuted={() => player.runInteraction(() => player.toggleMuted())}
		onVolumeChange={(nextVolume) => player.runInteraction(() => player.setVolume(nextVolume))}
	/>
</div>
