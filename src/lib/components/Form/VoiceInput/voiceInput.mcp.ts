export const voiceInputDescription = `
# VoiceInput Component

VoiceInput records microphone audio into a bindable Blob, renders live microphone feedback, and previews the finalized recording with a seekable waveform. It can stay full width, expand leftward during capture, or remain mic-only with level-responsive rings.

## Import

\`\`\`svelte
<script lang="ts">
	import { VoiceInput } from 'svelai/voice-input';
</script>
\`\`\`

## Basic usage

\`\`\`svelte
<script lang="ts">
	import { VoiceInput } from 'svelai/voice-input';

	let recording = $state<Blob | null>(null);
	let duration = $state(0);
</script>

<VoiceInput
	label="Voice note"
	bind:value={recording}
	bind:duration
	minDuration={1}
	maxDuration={60}
/>
\`\`\`

## Props

- **value**: \`Blob | null\` (bindable, default: \`null\`) - Finalized microphone recording. Starting a successful new recording or using Clear removes the previous value.
- **duration**: \`number\` (bindable, default: \`0\`) - Current or finalized duration in seconds.
- **minDuration**: \`number\` (default: \`0\`) - Minimum accepted finalized duration in seconds. Shorter recordings surface a Field validation error.
- **maxDuration**: \`number | undefined\` - Maximum duration in seconds. Recording stops automatically at this limit.
- **color**: \`Colors\` (default: \`'primary'\`) - Focus and active recording color.
- **variant**: \`'default' | 'expandable' | 'compact'\` (default: \`'default'\`) - Keeps the waveform full width, expands it only while recording or previewing, or renders a mic-only level indicator.
- **size**: \`'small' | 'normal' | 'large'\` (default: \`'normal'\`) - Control height, waveform height, timer size, and action size.
- **disabled**: \`boolean\` (default: \`false\`) - Prevents microphone, playback, seeking, and clear interactions.
- **required**: \`boolean\` (default: \`false\`) - Requires a recorded Blob during Field/Form validation.
- **ariaLabel**: \`string\` (default: \`'Start voice recording'\`) - Start-button accessible label and tooltip.
- **stopLabel**: \`string\` (default: \`'Stop recording'\`) - Stop-button accessible label and tooltip.
- **playLabel**: \`string\` (default: \`'Play recording'\`) - Playback-button label and tooltip while paused.
- **pauseLabel**: \`string\` (default: \`'Pause recording'\`) - Playback-button label and tooltip while playing.
- **seekLabel**: \`string\` (default: \`'Seek recording'\`) - Accessible label for the finalized waveform seek control.
- **clearLabel**: \`string\` (default: \`'Clear recording'\`) - Clear-button accessible label and tooltip.
- **onValueChange**: \`(value: Blob | null) => void\` - Runs when the field value changes, including Clear.
- **onStart**: \`() => void\` - Runs after microphone capture starts.
- **onStop**: \`({ blob, duration }: VoiceInputResult) => void\` - Runs after MediaRecorder finalizes the recording.
- **onError**: \`(error: Error) => void\` - Runs when permission, recording, or playback fails.
- **theme**: \`VoiceInputThemeProps & FieldThemeProps\` - Overrides voice-input and inherited Field theme parts.

VoiceInput also accepts the standard Field props and slots, including \`label\`, \`description\`, \`helper\`, errors, and attachments.

## Form configuration

\`\`\`svelte
<Form
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
/>
\`\`\`

## Behavior

- The waveform is drawn on a responsive canvas and maps live microphone RMS through a logarithmic decibel scale so quiet speech remains visible.
- New samples enter from the right and push older samples left.
- \`maxDuration\` schedules a hard automatic stop and caps the published duration at the configured limit.
- \`minDuration\` participates in normal Field validation after MediaRecorder publishes the final Blob.
- The \`expandable\` variant has no hidden full-width footprint while collapsed, then anchors the action on the right and animates the waveform surface toward the left while recording, finalizing, or previewing saved audio.
- The \`compact\` variant omits the waveform and timer, uses a solid active surface while recording, and scales two concentric rings with the same logarithmic microphone level.
- Finalized recordings expose play/pause and clear actions. The saved waveform becomes a native range-based playback timeline with elapsed progress, pointer scrubbing, and keyboard seeking.
- Clear pauses playback, revokes the Blob URL, resets duration and waveform state, and publishes \`null\` through the normal field value contract.
- Playback creates its Blob URL lazily and revokes it when the value changes or the component unmounts.
- Stopping waits for MediaRecorder's final \`dataavailable\` event before publishing the Blob.
- Starting another recording replaces the previous value only once microphone setup succeeds.
- Permission denial, missing microphones, and unsupported browser APIs are surfaced in the control and through \`onError\`.
- Microphone tracks, cutoff timers, animation frames, audio graph nodes, observers, and the AudioContext are released on stop, failure, or unmount.

## Accessibility

- The visible field label targets the current microphone/stop button.
- Microphone, stop, play, pause, and clear actions have accessible labels and tooltips.
- Recording and playback state changes are announced through a polite live region without announcing the timer every second.
- Operational errors use \`role="alert"\`; duration requirements use the inherited Field error rendering.
- The canvas is decorative and hidden from assistive technology. A transparent native range input exposes the finalized waveform as a labelled slider with elapsed and total time.
- Compact rings are decorative pseudo-elements and add no accessibility-tree content.

## Browser requirements

Microphone capture requires a secure context (HTTPS, with localhost allowed by browsers), user permission, MediaRecorder, and Web Audio API support.

## Theme parts

- \`root\` - Field root and variant width behavior.
- \`inputContainer\` - Input-like recording surface.
- \`content\` - Waveform, operational error, and timer region.
- \`action\` - Microphone/stop action, including compact level rings.
- \`playbackAction\` - Play/pause action shown for a finalized recording.
- \`clearAction\` - Clear action shown for a finalized recording.
- \`waveformContainer\` - Relative live/playback waveform surface and focus treatment.
- \`waveform\` - Responsive visual canvas.
- \`waveformInput\` - Native range hitbox layered over a finalized waveform.
- \`timer\` - Stable tabular duration.
- \`error\` - Operational error message.

## State contract

- **value**: current bindable editable value.
- **defaultValue**: initial value used only when \`value\` is omitted.
- **onValueChange**: called with the new value when the component changes it.

`;
