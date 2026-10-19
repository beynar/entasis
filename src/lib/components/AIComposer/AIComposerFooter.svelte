<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import Button from '../Button/Button.svelte';
	import VoiceInput from '../Form/VoiceInput/VoiceInput.svelte';
	import type { VoiceInputResult } from '../Form/VoiceInput/voiceInput.props.js';
	import type { VoiceInputThemeProps } from '../Form/VoiceInput/voiceInput.theme.js';
	import { listPlusIcon } from '../Icons/listPlus.js';
	import { paperPlaneRightIcon } from '../Icons/paperPlaneRight.js';
	import { paperclipIcon } from '../Icons/paperclip.js';
	import { stopIconFill } from '../Icons/stop.js';
	import Slot from '../Slot/Slot.svelte';
	import type { Slot as SlotType } from '../Slot/slot.js';
	import type { Colors } from '../../types/theme.js';
	import type { AIComposerSubmitState, AIComposerVoiceInputVariant } from './aiComposer.props.js';
	import { useAIComposerTheme, type AIComposerThemeProps } from './aiComposer.theme.js';

	let {
		state: submitState,
		footer,
		footerStart,
		actions,
		modelSelector,
		voiceInput,
		voiceInputVariant,
		voiceInputMinDuration,
		voiceInputMaxDuration,
		voiceInputColor,
		voiceInputAriaLabel,
		voiceInputStopLabel,
		voiceInputProcessingLabel,
		voiceInputFailedLabel,
		onVoiceInput,
		onVoiceError,
		fileDropzone,
		attachDisabled,
		disabled,
		isWorking,
		isSubmitting,
		isStopping,
		isEditing,
		queueWhileBusy,
		submitLabel,
		stopLabel,
		queueLabel,
		attachLabel,
		onAttach,
		onStop,
		theme,
		voiceInputTheme
	}: {
		state: AIComposerSubmitState;
		footer?: SlotType<AIComposerSubmitState>;
		footerStart?: SlotType<AIComposerSubmitState>;
		actions?: SlotType<AIComposerSubmitState>;
		modelSelector?: SlotType;
		voiceInput: boolean;
		voiceInputVariant: AIComposerVoiceInputVariant;
		voiceInputMinDuration?: number;
		voiceInputMaxDuration?: number;
		voiceInputColor: Colors;
		voiceInputAriaLabel: string;
		voiceInputStopLabel: string;
		voiceInputProcessingLabel: string;
		voiceInputFailedLabel: string;
		/** A microphone, recording or transcription failure for the composer's error banner. */
		onVoiceError: (message: string | null) => void;
		onVoiceInput?: (audioBuffer: ArrayBuffer) => Promise<void>;
		fileDropzone: boolean;
		attachDisabled: boolean;
		disabled: boolean;
		isWorking: boolean;
		isSubmitting: boolean;
		isStopping: boolean;
		isEditing: boolean;
		queueWhileBusy: boolean;
		submitLabel: string;
		stopLabel: string;
		queueLabel: string;
		attachLabel: string;
		onAttach: () => void;
		onStop: () => void;
		theme?: AIComposerThemeProps;
		voiceInputTheme?: VoiceInputThemeProps;
	} = $props();

	const classes = $derived(useAIComposerTheme(theme));
	let voiceInputValue = $state<Blob | null>(null);
	let voiceInputDuration = $state(0);
	let isVoiceInputProcessing = $state(false);

	// The footer's other controls grow to 36px through the theme's `@max-md` container query and
	// `pointer-coarse`; VoiceInput sizes its mic, playback and clear buttons from its `size` prop, so
	// the same two conditions pick its 36px `normal` size here. 28rem is Tailwind's `@md` container.
	const coarsePointer = new MediaQuery('(pointer: coarse)', false);
	let narrowFooter = $state(false);
	const touchControls = $derived(narrowFooter || coarsePointer.current);

	function observeFooterWidth(node: HTMLElement) {
		const observer = new ResizeObserver(([entry]) => {
			const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
			narrowFooter = entry.contentRect.width < 28 * rem;
		});
		observer.observe(node);
		return () => observer.disconnect();
	}

	async function processVoiceInput(result: VoiceInputResult): Promise<void> {
		voiceInputValue = null;
		voiceInputDuration = 0;
		onVoiceError(null);
		if (!onVoiceInput) return;

		isVoiceInputProcessing = true;
		try {
			await onVoiceInput(await result.blob.arrayBuffer());
		} catch (cause) {
			onVoiceError(cause instanceof Error ? cause.message : voiceInputFailedLabel);
		} finally {
			isVoiceInputProcessing = false;
		}
	}
</script>

{#if footer}
	<Slot render={footer} payload={submitState} class={classes.footer()} />
{:else}
	<!-- Attach sits at the far start; the model picker, voice and the send position share the end,
	     so the send/stop control is always last and never pushed out of the composer. -->
	<div
		data-slot="ai-composer-footer"
		class={classes.footer()}
		{@attach voiceInput ? observeFooterWidth : undefined}
	>
		<div class={classes.actions({ side: 'start' })}>
			{#if fileDropzone}
				<Button
					type="button"
					squared
					size="small"
					variant="ghost"
					color="neutral"
					label={attachLabel}
					disabled={attachDisabled}
					onclick={onAttach}
				>
					{@render paperclipIcon({ size: 16 })}
				</Button>
			{/if}
			<Slot render={footerStart} payload={submitState} />
		</div>
		<div class={classes.actions({ side: 'end' })}>
			<Slot render={actions} payload={submitState} />
			<Slot render={modelSelector} />
			{#if voiceInput}
				<div
					data-slot="ai-composer-voice-input"
					class={classes.voiceInput({ variant: voiceInputVariant })}
				>
					{#if isVoiceInputProcessing}
						<Button
							type="button"
							squared
							size={touchControls ? 'large' : 'small'}
							variant="ghost"
							color="neutral"
							label={voiceInputProcessingLabel}
							loading
							disabled
						/>
					{:else}
						<!-- startLabel names the mic button; no Field label, so nothing renders above it. -->
						<VoiceInput
							bind:value={voiceInputValue}
							bind:duration={voiceInputDuration}
							size={touchControls ? 'normal' : 'small'}
							variant={voiceInputVariant}
							minDuration={voiceInputMinDuration}
							maxDuration={voiceInputMaxDuration}
							color={voiceInputColor}
							startLabel={voiceInputAriaLabel}
							stopLabel={voiceInputStopLabel}
							disabled={disabled || isWorking}
							onStop={processVoiceInput}
							inlineError={false}
							onStart={() => onVoiceError(null)}
							onError={(error) => onVoiceError(error.message)}
							theme={voiceInputTheme}
						/>
					{/if}
				</div>
			{/if}
			{#if submitState.isBusy && !isEditing}
				{#if queueWhileBusy && !submitState.isEmpty}
					<Button
						type="submit"
						squared
						size="small"
						variant="ghost"
						color="neutral"
						data-slot="ai-composer-queue-action"
						label={queueLabel}
						disabled={disabled || isWorking}
					>
						{@render listPlusIcon({ size: 16 })}
					</Button>
				{/if}
				<Button
					type="button"
					squared
					size="small"
					data-slot="ai-composer-stop"
					label={stopLabel}
					loading={isStopping}
					disabled={disabled || isWorking}
					onclick={onStop}
				>
					{@render stopIconFill({ size: 14 })}
				</Button>
			{:else}
				<Button
					type="submit"
					squared
					size="small"
					data-slot="ai-composer-submit"
					label={submitLabel}
					loading={isSubmitting}
					disabled={disabled ||
						isWorking ||
						submitState.isEmpty ||
						(submitState.isBusy && !queueWhileBusy && !isEditing)}
				>
					{@render paperPlaneRightIcon({ size: 16 })}
				</Button>
			{/if}
		</div>
	</div>
{/if}
