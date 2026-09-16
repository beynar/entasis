<script lang="ts">
	import type { Sizes } from '$lib/types/theme.js';
	import MediaVolumeControl from '../MediaVolume/MediaVolumeControl.svelte';
	import { getVideoPlayerSliderTheme } from './videoPlayer.slider.theme.js';
	import type { VideoPlayerState } from './videoPlayer.state.svelte.js';
	import type { useVideoPlayerTheme } from './videoPlayer.theme.js';

	type VideoPlayerClasses = ReturnType<typeof useVideoPlayerTheme>;

	let {
		player,
		classes,
		size,
		disabled,
		volumeStep,
		onOverlayOpenChange
	}: {
		player: VideoPlayerState;
		classes: VideoPlayerClasses;
		size: Sizes;
		disabled: boolean;
		volumeStep: number;
		onOverlayOpenChange: (open: boolean) => void;
	} = $props();

	const sliderTheme = getVideoPlayerSliderTheme('vertical');
</script>

<MediaVolumeControl
	volume={player.volume}
	muted={player.muted}
	{size}
	{volumeStep}
	{disabled}
	color="primary"
	buttonColor="neutral"
	buttonClass={classes.controlButton({ size })}
	orientation="vertical"
	position="top"
	popover={{ class: classes.popoverPanel({ className: 'p-1.5' }) }}
	panelClass={classes.volumePanel({
		className: 'w-auto flex-col justify-center gap-1.5 px-0 py-0.5'
	})}
	sliderClass={classes.slider({ size, disabled })}
	{sliderTheme}
	onOpenChange={onOverlayOpenChange}
	onToggleMuted={() => player.runInteraction(() => player.toggleMuted())}
	onVolumeChange={(nextVolume) => player.runInteraction(() => player.setVolume(nextVolume))}
/>
