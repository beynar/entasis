<script lang="ts">
	import { microphoneIcon } from '$lib/components/Icons/microphone.js';
	import { pauseIcon } from '$lib/components/Icons/pause.js';
	import { playIcon } from '$lib/components/Icons/play.js';
	import { stopIconFill } from '$lib/components/Icons/stop.js';
	import { xIcon } from '$lib/components/Icons/x.js';
	import { tooltip } from '$lib/components/Tooltip/tooltip.attachment.svelte.js';
	import Field from '../Field/Field.svelte';
	import FieldActionButton from '../Field/FieldActionButton.svelte';
	import { createFieldState } from '../Field/field.state.svelte.js';
	import VoiceInputContent from './VoiceInputContent.svelte';
	import type { VoiceInputProps } from './voiceInput.props.js';
	import { VoiceInputState } from './voiceInput.state.svelte.js';
	import { formatVoiceInputDuration, normalizeVoiceInputDuration } from './voiceInput.time.js';
	import { useVoiceInputTheme } from './voiceInput.theme.js';
	import { useDefaultColor } from '../../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';

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
		color,
		size = 'normal',
		variant = 'default',
		startLabel,
		stopLabel,
		playLabel,
		pauseLabel,
		seekLabel,
		clearLabel,
		fieldAttrs,
		theme,
		...rest
	}: VoiceInputProps = $props();
	const valueState = createBindableValue<Blob | null>(
		() => value,
		(next) => {
			value = next;
		},
		() => defaultValue
	);

	const id = $props.id();
	const t = $derived(useI18n());
	const resolvedColor = $derived(useDefaultColor(color));
	const resolvedStopLabel = $derived(stopLabel ?? t.voiceInputStop);
	const resolvedSeekLabel = $derived(seekLabel ?? t.voiceInputSeek);
	const resolvedClearLabel = $derived(clearLabel ?? t.voiceInputClear);
	const normalizedMinDuration = $derived(normalizeVoiceInputDuration(minDuration) ?? 0);
	const normalizedMaxDuration = $derived(normalizeVoiceInputDuration(maxDuration));
	const field = createFieldState({
		id,
		get value() {
			return valueState.value;
		},
		set value(nextValue) {
			valueState.value = nextValue;
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
				return [t.voiceInputMinDuration(normalizedMinDuration)];
			}
			if (normalizedMaxDuration !== null && duration > normalizedMaxDuration) {
				return [t.voiceInputMaxDuration(normalizedMaxDuration)];
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
		onError: (error) => onError?.(error),
		getMessages: () => t
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
			? t.voiceInputWaitingForMicrophone
			: recorder.isRecording || recorder.isStopping
				? resolvedStopLabel
				: (startLabel ?? t.voiceInputStart)
	);
	const playbackButtonLabel = $derived(
		recorder.isPlaying ? (pauseLabel ?? t.voiceInputPause) : (playLabel ?? t.voiceInputPlay)
	);
	const statusMessage = $derived.by(() => {
		if (recorder.errorMessage) return recorder.errorMessage;
		if (recorder.status === 'requesting') return t.voiceInputStatusRequesting;
		if (recorder.isRecording) return t.voiceInputStatusRecording;
		if (recorder.isStopping) return t.voiceInputStatusFinishing;
		if (recorder.isPlaying) return t.voiceInputStatusPlaying;
		if (field.value) return t.voiceInputStatusReady(formatVoiceInputDuration(duration));
		return t.voiceInputStatusIdle;
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
		'data-color': resolvedColor,
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
			color={recorder.isPlaying ? resolvedColor : 'neutral'}
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
		seekLabel={resolvedSeekLabel}
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
			label={resolvedClearLabel}
			disabled={field.disabled}
			edge="none"
			class={classes.clearAction({
				size,
				variant,
				class: theme?.clearAction?.base
			})}
			prefix={xIcon}
			onclick={clearRecording}
			{@attach tooltip({ content: resolvedClearLabel, position: 'top', size: 'small' })}
		/>
	{/if}
	<FieldActionButton
		{id}
		{size}
		color={recorder.isRecording ? resolvedColor : 'neutral'}
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
