import type { AudioPlayerControl } from '$lib/components/AudioPlayer/index.js';

export const sampleAudio =
	'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

export const trackControls: AudioPlayerControl[] = ['play', 'time', 'volume'];
export const transportControls: AudioPlayerControl[] = [
	'play',
	'seekBackward',
	'seekForward',
	'time',
	'loop'
];

export const histogramWaveform = createWaveform(29, 64);
export const controlledWaveform = createWaveform(47, 72);

export const customSeekTheme = {
	root: { base: 'w-full gap-0' },
	header: { base: 'sr-only' },
	label: { base: 'sr-only' },
	inputContainer: { base: 'w-full gap-0' },
	control: { base: 'w-full' },
	track: { base: 'min-w-0 focus-visible:ring-offset-0' }
};

export const basicCode = `<AudioPlayer
	src="${sampleAudio}"
	title="Field recording"
	artist="Entasis archives"
/>`;

export const histogramCode = `<AudioPlayer
	src="${sampleAudio}"
	title="Histogram mode"
	waveformVariant="histogram"
	waveform={waveform}
/>`;

export const trackCode = `<AudioPlayer
	src="${sampleAudio}"
	title="Track progress"
	variant="track"
	layout="inline"
	color="info"
	controls={['play', 'time', 'volume']}
/>`;

export const dropUploadCode = `<script lang="ts">
	import { AudioPlayer } from '$lib/components/AudioPlayer/index.js';
	import { FileInput } from '$lib/components/Form/File/index.js';

	let file = $state<File | null>(null);
	let audioSrc = $state<string | undefined>();

	$effect(() => {
		audioSrc = undefined;
		if (!file) return;

		const objectUrl = URL.createObjectURL(file);
		audioSrc = objectUrl;
		return () => URL.revokeObjectURL(objectUrl);
	});
${'</' + 'script>'}

<FileInput
	label="MP3 file"
	mode="single"
	types={['audio/mpeg', '.mp3']}
	bind:value={file}
/>

{#if audioSrc}
	<AudioPlayer src={audioSrc} title={file?.name} download={false} />
{/if}`;

export const slotCode = `<script lang="ts">
	import { AudioPlayer } from '$lib/components/AudioPlayer/index.js';
	import { Button } from '$lib/components/Button/index.js';
	import { Slider } from '$lib/components/Form/Slider/index.js';
	import { pauseIcon } from '$lib/components/Icons/pause.js';
	import { playIcon } from '$lib/components/Icons/play.js';
${'</' + 'script>'}

{#snippet controlsSlot(player)}
	<Button
		squared
		color="success"
		label={player.paused || player.ended ? 'Play' : 'Pause'}
		prefix={player.paused || player.ended ? playIcon : pauseIcon}
		onclick={() => player.runInteraction(() => player.togglePlay())}
	/>
{/snippet}

{#snippet seek(player)}
	<Slider
		label="Seek"
		value={player.currentTime}
		min={0}
		max={Math.max(player.duration, 0.1)}
		step={0.1}
		color="success"
		variant="thick"
		onValueChange={(value) => player.runInteraction(() => player.seekTo(Array.isArray(value) ? (value[0] ?? 0) : value))}
	/>
{/snippet}

<AudioPlayer
	src="${sampleAudio}"
	title="Custom chrome"
	variant="track"
	color="success"
	{controlsSlot}
	{seek}
/>`;

export const controlledCode = `<script lang="ts">
	let paused = $state(true);
	let currentTime = $state(0);
${'</' + 'script>'}

<AudioPlayer
	src="${sampleAudio}"
	title="Controlled playback"
	bind:paused
	bind:currentTime
	controls={['play', 'seekBackward', 'seekForward', 'time', 'loop']}
/>`;

export function formatTime(value: number) {
	if (!Number.isFinite(value) || value <= 0) return '0:00';
	const minutes = Math.floor(value / 60);
	const seconds = Math.floor(value % 60);
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createWaveform(seed: number, count: number) {
	return Array.from({ length: count }, (_, index) => {
		const position = count === 1 ? 0 : index / (count - 1);
		const envelope = 0.36 + Math.sin(position * Math.PI) * 0.56;
		const carrier = Math.sin((index + 1) * seed * 0.19);
		const accent = Math.sin((index + 5) * (seed + 4) * 0.11);
		return Math.min(1, Math.max(0.08, (0.2 + Math.abs(carrier * 0.68 + accent * 0.32)) * envelope));
	});
}
