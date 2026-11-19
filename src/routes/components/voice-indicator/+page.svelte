<script lang="ts">
	import { onDestroy } from 'svelte';
	import Button from '$lib/components/Button/Button.svelte';
	import Slider from '$lib/components/Form/Slider/Slider.svelte';
	import Stack from '$lib/components/Stack/Stack.svelte';
	import { VoiceIndicator, VoiceMicrophone } from '$lib/components/VoiceIndicator/index.js';
	import type {
		VoiceIndicatorAppearance,
		VoiceIndicatorColor,
		VoiceIndicatorMotion,
		VoiceIndicatorState,
		VoiceIndicatorVariant
	} from '$lib/components/VoiceIndicator/index.js';
	import type { Sizes } from '$lib/types/theme.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	// A stand-in for a voice, so the page moves without a microphone: phrases with pauses between
	// them, and four to five syllables a second inside each phrase, as in speech.
	const speech = () => {
		const t = performance.now() / 1000;
		const phrase = Math.max(0, Math.sin(t * 0.9) + 0.35);
		const syllable = 0.5 + 0.5 * Math.sin(t * 27 + Math.sin(t * 3.1) * 3);
		return Math.min(1, phrase * (0.35 + 0.65 * syllable) * 0.9);
	};

	const states: VoiceIndicatorState[] = [
		'idle',
		'connecting',
		'listening',
		'thinking',
		'speaking',
		'error'
	];
	const colors: VoiceIndicatorColor[] = [
		'spectrum',
		'primary',
		'secondary',
		'info',
		'success',
		'warning',
		'danger',
		'neutral'
	];

	const controls = createComponentControls([
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'ring',
			options: ['ring', 'orb']
		},
		{
			name: 'appearance',
			type: 'segmented',
			label: 'Appearance',
			value: 'light',
			options: ['light', 'solid']
		},
		{
			name: 'state',
			type: 'segmented',
			label: 'State',
			value: 'speaking',
			options: states
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'spectrum',
			options: colors
		},
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'large',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'motion',
			type: 'segmented',
			label: 'Motion',
			value: 'balanced',
			options: ['calm', 'balanced', 'expressive']
		}
	]);

	// Only what differs from the defaults is written in the Usage code.
	const usageProps = $derived(
		[
			controls.value.variant !== 'ring' && `variant="${controls.value.variant}"`,
			controls.value.appearance !== 'light' && `appearance="${controls.value.appearance}"`,
			controls.value.color !== 'spectrum' && `color="${controls.value.color}"`,
			controls.value.size !== 'normal' && `size="${controls.value.size}"`,
			controls.value.motion !== 'balanced' && `motion="${controls.value.motion}"`
		]
			.filter(Boolean)
			.map((line) => `\n\t${line}`)
			.join('')
	);

	// The session of the microphone example: the indicator is its start and stop button.
	const microphone = new VoiceMicrophone();
	onDestroy(() => microphone.stop());
	const session = $derived<VoiceIndicatorState>(
		microphone.status === 'requesting'
			? 'connecting'
			: microphone.active
				? 'listening'
				: microphone.status === 'idle'
					? 'idle'
					: 'error'
	);

	let side = $state(0.6);
	let level = $state(0);
</script>

<DocPage
	title="Voice indicator"
	subtitle="Shows where a voice conversation is and how loud the voice is, as a ring or an orb."
	component="VoiceIndicator"
	features={[
		'Two shapes, each in light or solid: four looks',
		'Six states that ease into each other: idle, connecting, listening, thinking, speaking, error',
		'Follows a microphone stream, an AnalyserNode or a plain level',
		'The spectrum or any colour role, crossfaded',
		'Leans toward where the voice comes from',
		'Can be the button that starts and stops the session',
		'Holds still under reduced motion and stops drawing off screen'
	]}
>
	<ComponentCard
		{controls}
		description="Give it the state of the conversation and what to listen to. Here the voice is simulated."
		class="mx-auto max-w-3xl"
		code={`<VoiceIndicator${usageProps}
	state="${controls.value.state}"
	input={microphone.stream}
	output={() => player.level}
/>`}
	>
		<div class="py-lg flex w-full justify-center">
			<VoiceIndicator
				variant={controls.value.variant as VoiceIndicatorVariant}
				appearance={controls.value.appearance as VoiceIndicatorAppearance}
				state={controls.value.state as VoiceIndicatorState}
				color={controls.value.color as VoiceIndicatorColor}
				size={controls.value.size as Sizes}
				motion={controls.value.motion as VoiceIndicatorMotion}
				input={speech}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Four looks"
			description="`variant` is the shape, `appearance` what it is made of: light blooms and glows, solid is matter: lit tubes, a matt ball of clouds."
			class="mx-auto max-w-4xl"
			code={`<VoiceIndicator variant="ring" appearance="light" state="speaking" output={level} />
<VoiceIndicator variant="ring" appearance="solid" state="speaking" output={level} />
<VoiceIndicator variant="orb" appearance="light" state="speaking" output={level} />
<VoiceIndicator variant="orb" appearance="solid" state="speaking" output={level} />`}
		>
			<div class="gap-md grid w-full grid-cols-2 justify-items-center md:grid-cols-4">
				<VoiceIndicator variant="ring" appearance="light" state="speaking" output={speech} />
				<VoiceIndicator variant="ring" appearance="solid" state="speaking" output={speech} />
				<VoiceIndicator variant="orb" appearance="light" state="speaking" output={speech} />
				<VoiceIndicator variant="orb" appearance="solid" state="speaking" output={speech} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="States"
			description="Idle drifts, connecting dims, listening and speaking follow their source, thinking turns the colours like a loader, and an error takes the danger colour."
			class="mx-auto max-w-4xl"
			code={`<VoiceIndicator state="idle" />
<VoiceIndicator state="connecting" />
<VoiceIndicator state="listening" input={microphone.stream} />
<VoiceIndicator state="thinking" />
<VoiceIndicator state="speaking" output={() => player.level} />
<VoiceIndicator state="error" />`}
		>
			<Stack gap="lg" class="w-full">
				{#each ['ring', 'orb'] as const as variant (variant)}
					<div class="gap-md grid w-full grid-cols-3 justify-items-center md:grid-cols-6">
						{#each states as state (state)}
							<Stack gap="sm" align="center">
								<VoiceIndicator {variant} {state} diameter={96} input={speech} />
								<span class="text-neutral-readable text-xs">{state}</span>
							</Stack>
						{/each}
					</div>
				{/each}
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Colours"
			description="`color` takes a role, or `spectrum` for the indicator's own colours. A role keeps a breath of its neighbouring hues, and a change of colour crossfades."
			class="mx-auto max-w-4xl"
			code={`<VoiceIndicator color="primary" />
<VoiceIndicator variant="orb" color="success" />
<VoiceIndicator appearance="solid" color="neutral" />`}
		>
			<Stack gap="lg" class="w-full">
				{#each [['ring', 'light'], ['orb', 'light'], ['ring', 'solid'], ['orb', 'solid']] as const as [variant, appearance] (`${variant}-${appearance}`)}
					<div class="gap-md grid w-full grid-cols-4 justify-items-center md:grid-cols-8">
						{#each colors as color (color)}
							<Stack gap="sm" align="center">
								<VoiceIndicator
									{variant}
									{appearance}
									{color}
									diameter={80}
									state="speaking"
									output={speech}
								/>
								<span class="text-neutral-readable text-xs">{color}</span>
							</Stack>
						{/each}
					</div>
				{/each}
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="A microphone, and the indicator as its button"
			description="With `onStart` or `onStop` the indicator is a button: a press starts the session while idle, and stops it otherwise. `VoiceMicrophone` holds the stream as reactive state."
			class="mx-auto max-w-3xl"
			code={`<script>
	import { VoiceIndicator, VoiceMicrophone } from 'entasis/voice-indicator';
	import { onDestroy } from 'svelte';

	const microphone = new VoiceMicrophone();
	onDestroy(() => microphone.stop());

	const state = $derived(
		microphone.status === 'requesting' ? 'connecting'
		: microphone.active ? 'listening'
		: microphone.status === 'idle' ? 'idle'
		: 'error'
	);
</${'script'}>

<VoiceIndicator
	{state}
	size="large"
	input={microphone.stream}
	onStart={() => microphone.start()}
	onStop={() => microphone.stop()}
/>`}
		>
			<Stack gap="md" align="center" class="w-full">
				<VoiceIndicator
					state={session}
					size="large"
					input={microphone.stream}
					onStart={() => microphone.start()}
					onStop={() => microphone.stop()}
				/>
				<p class="text-neutral-readable text-sm">
					{#if microphone.status === 'idle'}
						Press the ring to listen to your microphone.
					{:else if microphone.status === 'requesting'}
						Waiting for the microphone.
					{:else if microphone.active}
						Listening. Press the ring to stop.
					{:else if microphone.status === 'denied'}
						The microphone was refused. Press the ring to ask again.
					{:else}
						No microphone is available here.
					{/if}
				</p>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Where the voice comes from"
			description="`direction` runs from -1 (left) to 1 (right). While a voice is heard the indicator leans that way, and settles back in silence. A leaning ring is drawn past its box."
			class="mx-auto max-w-3xl"
			code={`<VoiceIndicator state="speaking" output={level} direction={side} />`}
		>
			<Stack gap="md" align="center" class="w-full">
				<Stack orientation="horizontal" gap="xl" justify="center" class="w-full">
					<VoiceIndicator state="speaking" output={speech} direction={side} />
					<VoiceIndicator variant="orb" state="speaking" output={speech} direction={side} />
				</Stack>
				<div class="w-full max-w-xs">
					<Slider bind:value={side} min={-1} max={1} step={0.1} label="Direction" />
				</div>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Bend toward the pointer"
			description="With `hoverBend`, a ring that waits or thinks is drawn toward the pointer as it nears the rim. Fine pointers only."
			class="mx-auto max-w-3xl"
			code={`<VoiceIndicator hoverBend />
<VoiceIndicator appearance="solid" state="thinking" hoverBend={0.8} />`}
		>
			<Stack orientation="horizontal" gap="xl" justify="center" class="w-full">
				<VoiceIndicator hoverBend size="large" />
				<VoiceIndicator appearance="solid" state="thinking" hoverBend={0.8} size="large" />
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Reading the level"
			description="`onLevelChange` gives the shaped level, from 0 to 1, each frame it changes. `paused` holds the indicator on its frame."
			class="mx-auto max-w-3xl"
			code={`<script>
	let level = $state(0);
</${'script'}>

<VoiceIndicator state="speaking" output={source} onLevelChange={(next) => (level = next)} />
<p>{Math.round(level * 100)}%</p>`}
		>
			<Stack orientation="horizontal" gap="xl" align="center" justify="center" class="w-full">
				<VoiceIndicator
					variant="orb"
					state="speaking"
					output={speech}
					onLevelChange={(next) => (level = next)}
				/>
				<Stack gap="sm">
					<p class="text-sm tabular-nums">Level {Math.round(level * 100)}%</p>
					<VoiceIndicator diameter={64} state="speaking" output={0.6} paused />
				</Stack>
			</Stack>
		</ComponentCard>

		<ComponentCard
			title="Response curve"
			description="`curve` sets how a loudness becomes the level shown: `soft` rounds a shout off, `linear` leaves it as it is, `log` lifts quiet sounds, `exp` holds them down. `curveAmount` sets how far it bends, and a function gives a curve of your own."
			class="mx-auto max-w-4xl"
			code={`<VoiceIndicator curve="soft" ... />
<VoiceIndicator curve="linear" ... />
<VoiceIndicator curve="log" curveAmount={20} ... />
<VoiceIndicator curve="exp" curveAmount={4} ... />
<VoiceIndicator curve={(level) => level ** 2} ... />`}
		>
			<div class="gap-md grid w-full grid-cols-2 justify-items-center md:grid-cols-4">
				{#each [['soft', undefined], ['linear', undefined], ['log', 20], ['exp', 4]] as const as [curve, curveAmount] (curve)}
					<Stack gap="sm" align="center">
						<VoiceIndicator
							variant="orb"
							diameter={112}
							state="speaking"
							output={speech}
							{curve}
							{curveAmount}
						/>
						<span class="text-neutral-readable text-xs">{curve}</span>
					</Stack>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="`size` is 48, 128 or 224 pixels; `diameter` sets any size. Small sizes carry fewer, bolder marks."
			class="mx-auto max-w-3xl"
			code={`<VoiceIndicator size="small" />
<VoiceIndicator size="normal" />
<VoiceIndicator size="large" />
<VoiceIndicator diameter={24} />`}
		>
			<Stack orientation="horizontal" gap="lg" align="center" justify="center" class="w-full">
				<VoiceIndicator diameter={24} state="speaking" output={speech} />
				<VoiceIndicator size="small" state="speaking" output={speech} />
				<VoiceIndicator size="normal" state="speaking" output={speech} />
				<VoiceIndicator size="large" state="speaking" output={speech} />
				<Button variant="outline">
					<VoiceIndicator variant="orb" diameter={20} state="speaking" output={speech} />
					Talking
				</Button>
			</Stack>
		</ComponentCard>
	{/snippet}
</DocPage>
