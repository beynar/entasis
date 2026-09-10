import type { WithAttachments } from '$lib/types/props.js';
import type { Colors } from '$lib/types/theme.js';
import type { InputProps } from '../Field/field.js';
import type { VoiceInputThemeProps } from './voiceInput.theme.js';

export type VoiceInputResult = {
	blob: Blob;
	duration: number;
};

export type VoiceInputVariant = 'default' | 'expandable' | 'compact';

export type VoiceInputProps = WithAttachments<
	Omit<InputProps<'voice'>, 'onValueChange' | 'theme' | 'value'> & {
		/** Recorded audio. Starting a new recording clears the previous value. */
		value?: Blob | null;
		/** Recording duration in seconds. Bind to retain it alongside the Blob value. */
		duration?: number;
		/** Minimum accepted recording duration in seconds. */
		minDuration?: number;
		/** Maximum recording duration in seconds. Recording stops automatically at this limit. */
		maxDuration?: number;
		/** Semantic color used while recording and for the focus treatment. */
		color?: Colors;
		/** Chooses a full waveform, a recording-only expansion, or a mic-only level indicator. */
		variant?: VoiceInputVariant;
		/** Accessible label and tooltip for the microphone trigger. */
		ariaLabel?: string;
		/** Accessible label and tooltip for the stop action. */
		stopLabel?: string;
		/** Accessible label and tooltip for playing the finalized recording. */
		playLabel?: string;
		/** Accessible label and tooltip for pausing recording playback. */
		pauseLabel?: string;
		/** Accessible label for the finalized waveform seek control. */
		seekLabel?: string;
		/** Accessible label and tooltip for clearing the finalized recording. */
		clearLabel?: string;
		/** Called whenever the recorded Blob changes. */
		onValueChange?: (value: Blob | null) => void;
		/** Called after microphone capture has started. */
		onStart?: () => void;
		/** Called after the recording has been finalized. */
		onStop?: (result: VoiceInputResult) => void;
		/** Called when microphone access or recording fails. */
		onError?: (error: Error) => void;
		/** Theme overrides for the voice input and inherited Field parts. */
		theme?: VoiceInputThemeProps & InputProps<'voice'>['theme'];
	}
>;
