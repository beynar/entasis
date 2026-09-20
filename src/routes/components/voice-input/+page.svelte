<script lang="ts">
	import Form from '$lib/components/Form/Form/Form.svelte';
	import VoiceInput from '$lib/components/Form/VoiceInput/VoiceInput.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { densities, sizes } from '$lib/utils/tokens.js';

	let recording = $state<Blob | null>(null);
	let duration = $state(0);
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: densities
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'default',
			options: ['default', 'expandable', 'compact']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	const usageCode = $derived(`<script lang="ts">
	import { VoiceInput } from 'entasis/voice-input';

	let recording = $state<Blob | null>(null);
	let duration = $state(0);
${'</' + 'script>'}

<VoiceInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	variant="${controls.value.variant}"
	disabled={${controls.value.disabled}}
	label="Voice note"
	description="Record a short message."
	bind:value={recording}
	bind:duration
	minDuration={1}
	maxDuration={60}
/>`);

	const durationCode = `<VoiceInput
	label="Status update"
	minDuration={1}
	maxDuration={5}
/>`;

	const sizeCode = `<div class="grid w-full gap-6">
	<VoiceInput size="small" startLabel="Start small recording" />
	<VoiceInput size="normal" startLabel="Start normal recording" />
	<VoiceInput size="large" startLabel="Start large recording" />
</div>`;

	const expandableCode = `<VoiceInput
	class="max-w-2xl"
	variant="expandable"
	startLabel="Start voice message"
/>`;

	const compactCode = `<VoiceInput
	variant="compact"
	startLabel="Start compact recording"
/>`;

	const formCode = `<Form
	inputs={{
		message: {
			type: 'voice',
			label: 'Voice message',
			required: true,
			minDuration: 1,
			maxDuration: 60
		}
	}}
	onSubmit={(value) => uploadVoiceMessage(value.message)}
/>`;

	const formatSize = (bytes: number) => `${Math.max(0.1, bytes / 1024).toFixed(1)} KB`;
</script>

<DocPage
	title="Voice input"
	subtitle="Microphone recording input with a responsive live waveform, constrained duration, seekable playback, and bindable audio Blob."
	component="VoiceInput"
	features={[
		'Live waveform streams from right to left',
		'Logarithmic response keeps quiet speech visible',
		'Minimum duration validation and automatic maximum cutoff',
		'Full-width responsive canvas at every size',
		'Optional left-expanding recording surface',
		'Mic-only level rings for compact interfaces',
		'Play, pause, scrub, and clear finalized recordings',
		'Native range input for waveform seeking',
		'Bindable Blob value and recording duration',
		'Permission, recorder, timer, and stream lifecycle handling',
		'Field validation and configuration-driven Form support'
	]}
>
	<ComponentCard
		{controls}
		description="The control fills its parent. Stop to finalize the message, then play it, seek on its waveform, or clear it."
		class="!min-h-fit"
		code={usageCode}
	>
		<div class="w-full max-w-3xl">
			<VoiceInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				variant={controls.value.variant}
				disabled={controls.value.disabled}
				label="Voice note"
				description="Record a message between 1 and 60 seconds."
				bind:value={recording}
				bind:duration
				minDuration={1}
				maxDuration={60}
			/>
			{#if recording}
				<p class="text-neutral/70 mt-2 text-xs">
					Recording ready · {formatSize(recording.size)} · {duration.toFixed(1)}s
				</p>
			{/if}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Recordings shorter than one second fail Field validation. Capture stops automatically after five seconds."
			class="!min-h-fit"
			code={durationCode}
		>
			<div class="w-full max-w-2xl">
				<VoiceInput label="Status update" minDuration={1} maxDuration={5} />
			</div>
		</ComponentCard>

		<ComponentCard
			description="The microphone remains anchored on the right; after finalization the saved waveform stays open with playback and clear actions."
			class="!min-h-fit"
			code={expandableCode}
		>
			<VoiceInput class="max-w-2xl" variant="expandable" startLabel="Start voice message" />
		</ComponentCard>

		<ComponentCard
			description="Compact mode uses level-responsive rings while recording, then exposes playback and clear controls."
			class="!min-h-fit"
			code={compactCode}
		>
			<VoiceInput variant="compact" startLabel="Start compact recording" />
		</ComponentCard>

		<ComponentCard
			description="Small, normal, and large controls all consume the available row width."
			class="!min-h-fit"
			code={sizeCode}
		>
			<div class="grid w-full max-w-3xl gap-6">
				<VoiceInput size="small" startLabel="Start small recording" />
				<VoiceInput size="normal" startLabel="Start normal recording" />
				<VoiceInput size="large" startLabel="Start large recording" />
			</div>
		</ComponentCard>

		<ComponentCard
			description="VoiceInput uses the voice field discriminator inside Form."
			class="!min-h-fit"
			code={formCode}
		>
			<div class="w-full max-w-xl">
				<Form
					inputs={{
						message: {
							type: 'voice',
							label: 'Voice message',
							description: 'Required before submission.',
							required: true,
							minDuration: 1,
							maxDuration: 60
						}
					}}
					onSubmit={() => undefined}
				/>
			</div>
		</ComponentCard>

		<ComponentCard description="Disabled" class="!min-h-fit">
			<div class="w-full max-w-xl">
				<VoiceInput disabled label="Voice note" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
