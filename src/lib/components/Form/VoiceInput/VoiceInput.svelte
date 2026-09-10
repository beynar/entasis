<script lang="ts">
	import { untrack } from 'svelte';
	import { microphoneIcon } from '$lib/components/Icons/microphone.js';
	import { pauseIcon } from '$lib/components/Icons/pause.js';
	import { playIcon } from '$lib/components/Icons/play.js';
	import { stopIconFill } from '$lib/components/Icons/stop.js';
	import { xIcon } from '$lib/components/Icons/x.js';
	import { tooltip } from '$lib/components/Tooltip/tooltip.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import VoiceInputContent from './VoiceInputContent.svelte';
	import type { VoiceInputProps } from './voiceInput.props.js';
	import { VoiceInputState } from './voiceInput.state.svelte.js';
	import {
		formatVoiceInputDuration,
		formatVoiceInputDurationRequirement,
		normalizeVoiceInputDuration
	} from './voiceInput.time.js';
	import { useVoiceInputTheme } from './voiceInput.theme.js';

	let {
		defaultValue = null,
		value = $bindable(),
		duration = $bindable(0),
		minDuration = 0,
		maxDuration,
		errors = $bindable([]),
		focused = $bindable(false),
		required = false,
		disabled = false,
		name,
		onValidate,
		onValueChange,
		onStart,
		onStop,
		onError,
		visible,
		color = 'primary',
		size = 'normal',
		variant = 'default',
		ariaLabel = 'Start voice recording',
		stopLabel = 'Stop recording',
		playLabel = 'Play recording',
		pauseLabel = 'Pause recording',
		seekLabel = 'Seek recording',
		clearLabel = 'Clear recording',
		fieldAttrs,
		theme,
		...rest
	}: VoiceInputProps = $props();
	if (value === undefined) value = untrack(() => defaultValue);

	const id = $props.id();
	const normalizedMinDuration = $derived(normalizeVoiceInputDuration(minDuration) ?? 0);
	const normalizedMaxDuration = $derived(normalizeVoiceInputDuration(maxDuration));
	const field = createFieldState({
		id,
		get value() {
			return value;
		},
		set value(nextValue) {
			value = nextValue;
		},
		get errors() {
			return errors;
		},
		set errors(nextErrors) {
			errors = nextErrors;
		},
		get focused() {
			return focused;
		},
		set focused(nextFocused) {
			focused = nextFocused;
		},
		get required() {
			return required;
		},
		get disabled() {
			return disabled;
		},
		set disabled(nextDisabled) {
			disabled = nextDisabled ?? false;
		},
		get name() {
			return name;
		},
		set name(nextName) {
			name = nextName;
		},
		onValidate: (currentValue) => {
			if (duration < normalizedMinDuration) {
				return [`Record at least ${formatVoiceInputDurationRequirement(normalizedMinDuration)}.`];
			}
			if (normalizedMaxDuration !== null && duration > normalizedMaxDuration) {
				return [
					`Record no longer than ${formatVoiceInputDurationRequirement(normalizedMaxDuration)}.`
				];
			}
			return onValidate?.(currentValue) || false;
		},
		get visible() {
			return visible;
		},
		onValueChange: (nextValue) => onValueChange?.(nextValue),
		type: 'voice'
	});

	const recorder = new VoiceInputState({
		getDisabled: () => !!field.disabled,
		getDuration: () => duration,
		getMaxDuration: () => normalizedMaxDuration,
		getValue: () => field.value ?? null,
		setControlNode: (node) => {
			field.node = node;
		},
		setFocused: (nextFocused) => {
			field.focused = nextFocused;
		},
		setValue: (nextValue) => {
			field.value = nextValue;
		},
		setDuration: (nextDuration) => {
			duration = nextDuration;
		},
		onStart: () => {
			field.errors = [];
			onStart?.();
		},
		onStop: (result) => {
			field.validate(result.blob);
			onStop?.(result);
		},
		onError: (error) => onError?.(error)
	});

	const classes = $derived(useVoiceInputTheme(theme));
	const hasPlayback = $derived(!!field.value && !recorder.isRecording && !recorder.isStopping);
	const isExpanded = $derived.by(() => {
		if (variant === 'default') return true;
		if (variant === 'compact') return !!recorder.errorMessage;
		return hasPlayback || recorder.isRecording || recorder.isStopping || !!recorder.errorMessage;
	});
	const fieldTheme = $derived({
		...(theme || {}),
		root: {
			...(theme?.root || {}),
			base: classes.root({ variant, expanded: isExpanded, class: theme?.root?.base })
		},
		inputContainer: {
			...(theme?.inputContainer || {}),
			base: classes.inputContainer({
				class: theme?.inputContainer?.base,
				size,
				variant,
				expanded: isExpanded,
				recording: recorder.isRecording,
				playback: hasPlayback,
				error: !!recorder.errorMessage,
				disabled: field.disabled
			})
		}
	});
	const buttonLabel = $derived(
		recorder.status === 'requesting'
			? 'Waiting for microphone access'
			: recorder.isRecording || recorder.isStopping
				? stopLabel
				: ariaLabel
	);
	const playbackButtonLabel = $derived(recorder.isPlaying ? pauseLabel : playLabel);
	const statusMessage = $derived.by(() => {
		if (recorder.errorMessage) return recorder.errorMessage;
		if (recorder.status === 'requesting') return 'Waiting for microphone permission.';
		if (recorder.isRecording) return 'Recording in progress.';
		if (recorder.isStopping) return 'Finishing recording.';
		if (recorder.isPlaying) return 'Playing recording.';
		if (field.value) return `Recording ready, ${formatVoiceInputDuration(duration)}.`;
		return 'Ready to record.';
	});

	function clearRecording() {
		recorder.clear();
		field.errors = [];
	}

	$effect(() => {
		if (!field.disabled) return;
		if (recorder.isRecording) recorder.stop();
		else recorder.cancelPending();
		recorder.pausePlayback();
	});
</script>

<Field
	{field}
	{size}
	theme={fieldTheme}
	fieldAttrs={{
		...fieldAttrs,
		'data-color': color,
		'data-state': recorder.status,
		'data-variant': variant,
		'data-expanded': isExpanded
	}}
	{...rest}
>
	{#if hasPlayback}
		<FieldActionButton
			id={`${id}-playback`}
			{size}
			color={recorder.isPlaying ? color : 'neutral'}
			label={playbackButtonLabel}
			disabled={field.disabled}
			edge={variant === 'compact' ? 'none' : 'start'}
			class={classes.playbackAction({
				size,
				variant,
				playing: recorder.isPlaying,
				class: theme?.playbackAction?.base
			})}
			prefix={recorder.isPlaying ? pauseIcon : playIcon}
			onclick={recorder.togglePlayback}
			{@attach tooltip({ content: playbackButtonLabel, position: 'top', size: 'small' })}
		/>
	{/if}
	<VoiceInputContent
		{id}
		{size}
		{variant}
		expanded={isExpanded}
		{hasPlayback}
		disabled={!!field.disabled}
		{duration}
		{seekLabel}
		{recorder}
		{classes}
		{theme}
		onFocusChange={(nextFocused) => (field.focused = nextFocused)}
	/>
	{#if hasPlayback}
		<FieldActionButton
			id={`${id}-clear`}
			{size}
			color="danger"
			label={clearLabel}
			disabled={field.disabled}
			edge="none"
			class={classes.clearAction({
				size,
				variant,
				class: theme?.clearAction?.base
			})}
			prefix={xIcon}
			onclick={clearRecording}
			{@attach tooltip({ content: clearLabel, position: 'top', size: 'small' })}
		/>
	{/if}
	<FieldActionButton
		{id}
		{size}
		color={recorder.isRecording ? color : 'neutral'}
		label={buttonLabel}
		disabled={field.disabled || recorder.isBusy}
		edge={isExpanded ? 'end' : 'none'}
		class={classes.action({
			size,
			variant,
			recording: recorder.isRecording,
			class: theme?.action?.base
		})}
		prefix={recorder.isRecording || recorder.isStopping ? stopIconFill : microphoneIcon}
		onclick={recorder.isRecording ? recorder.stop : recorder.start}
		{@attach recorder.trigger}
		{@attach tooltip({ content: buttonLabel, position: 'top', size: 'small' })}
	/>
	<span class="sr-only" aria-live="polite">{statusMessage}</span>
</Field>
