<script lang="ts">
	import {
		VideoPlayer,
		type VideoPlayerControl,
		type VideoPlayerSource,
		type VideoPlayerTrack
	} from '$lib/components/VideoPlayer/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { sizes } from '$lib/utils/tokens.js';

	const sampleVideo = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
	const sampleWebm = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm';
	const sources: VideoPlayerSource[] = [
		{ src: sampleWebm, type: 'video/webm' },
		{ src: sampleVideo, type: 'video/mp4' }
	];
	const tracks: VideoPlayerTrack[] = [
		{
			id: 'en',
			src: '/captions/flower-en.vtt',
			kind: 'captions',
			srclang: 'en',
			label: 'English',
			default: true
		},
		{
			id: 'fr',
			src: '/captions/flower-fr.vtt',
			kind: 'subtitles',
			srclang: 'fr',
			label: 'French'
		}
	];
	const minimalControls: VideoPlayerControl[] = ['play', 'seek', 'time', 'volume', 'fullscreen'];

	let paused = $state(true);
	let currentTime = $state(0);

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false },
		{ name: 'autoHideControls', type: 'switch', label: 'Auto-hide', value: true }
	]);

	const minimalCode = `<VideoPlayer
	src="${sampleVideo}"
	title="Compact preview"
	controls={['play', 'seek', 'time', 'volume', 'fullscreen']}
	size="small"
/>`;

	const tracksCode = `<VideoPlayer
	title="Captioned sample"
	sources={[
		{ src: '${sampleWebm}', type: 'video/webm' },
		{ src: '${sampleVideo}', type: 'video/mp4' }
	]}
	tracks={[
		{ id: 'en', src: '/captions/flower-en.vtt', kind: 'captions', srclang: 'en', label: 'English', default: true },
		{ id: 'fr', src: '/captions/flower-fr.vtt', kind: 'subtitles', srclang: 'fr', label: 'French' }
	]}
/>`;

	const autoHideCode = `<VideoPlayer
	src="${sampleVideo}"
	title="Auto-hide controls"
/>`;

	const controlledCode = `<script lang="ts">
	let paused = $state(true);
	let currentTime = $state(0);
${'</' + 'script>'}

<VideoPlayer
	src="${sampleVideo}"
	title="Controlled playback"
	bind:paused
	bind:currentTime
	controls={['play', 'seek', 'time', 'volume', 'settings', 'fullscreen']}
/>`;
</script>

<DocPage
	title="Video player"
	subtitle="Native video playback with Svelai controls, settings, captions, fullscreen, Picture-in-Picture, and download."
	component="VideoPlayer"
	features={[
		'Native video engine with source and track rendering',
		'Propsified controls and playback state bindings',
		'Seek, volume, speed, loop, captions, PiP, download, fullscreen',
		'Auto-hide controls that start hiding when playback begins',
		'Theme parts for media, overlays, controls, sliders, and menus'
	]}
>
	<ComponentCard
		{controls}
		description="Default controls include transport, seek, time, volume, settings, Picture-in-Picture, download, and fullscreen."
		class="!min-h-fit !items-stretch !justify-start"
		code={`<VideoPlayer
	src="${sampleVideo}"
	title="Flower sample"
	size="${controls.value.size}"
	disabled={${controls.value.disabled}}
	autoHideControls={${controls.value.autoHideControls}}
/>`}
	>
		<VideoPlayer
			src={sampleVideo}
			title="Flower sample"
			size={controls.value.size}
			disabled={controls.value.disabled}
			autoHideControls={controls.value.autoHideControls}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Pass controls to render only the chrome a context needs."
			class="!min-h-fit !items-stretch !justify-start"
			code={minimalCode}
		>
			<VideoPlayer
				src={sampleVideo}
				title="Compact preview"
				controls={minimalControls}
				size="small"
			/>
		</ComponentCard>

		<ComponentCard
			description="Multiple source candidates and native text tracks feed the settings and captions controls."
			class="!min-h-fit !items-stretch !justify-start"
			code={tracksCode}
		>
			<VideoPlayer title="Captioned sample" {sources} {tracks} />
		</ComponentCard>

		<ComponentCard
			description="Auto-hide is enabled by default, starts when playback begins, and keeps controls visible while volume/settings popovers are open."
			class="!min-h-fit !items-stretch !justify-start"
			code={autoHideCode}
		>
			<VideoPlayer src={sampleVideo} title="Auto-hide controls" />
		</ComponentCard>

		<ComponentCard
			description="Playback state can be controlled through bindable props."
			class="!min-h-fit !items-stretch !justify-start"
			code={controlledCode}
		>
			<div class="grid w-full gap-3">
				<VideoPlayer
					src={sampleVideo}
					title="Controlled playback"
					bind:paused
					bind:currentTime
					controls={['play', 'seek', 'time', 'volume', 'settings', 'fullscreen']}
				/>
				<p class="text-neutral/70 text-sm">
					{paused ? 'Paused' : 'Playing'} at {currentTime.toFixed(1)}s
				</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
