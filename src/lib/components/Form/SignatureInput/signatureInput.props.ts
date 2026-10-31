import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { InputProps } from '../Field/field.js';
import type { SignatureFormat } from './signatureInput.strokes.js';
import type { SignatureInputThemeProps } from './signatureInput.theme.js';

export type SignatureInputProps = WithAttachments<
	Omit<InputProps<'signature'>, 'theme'> & {
		/**
		 * Image the value holds, as a data URL cropped to the ink: `'png'` (default, drawn at twice
		 * the pad's resolution) or `'svg'`.
		 */
		format?: SignatureFormat;
		/**
		 * CSS color of the ink in the exported image. Defaults to black, so a signature reads on a
		 * white document whatever the app's theme; the pad itself draws in the theme's text color.
		 */
		inkColor?: string;
		/** Line width in CSS pixels at a medium pen pressure. Defaults to 2.5. */
		strokeWidth?: number;
		/** Hint on the signing line while the pad is empty. Defaults to the i18n `signatureInputPlaceholder`. */
		placeholder?: string;
		/** Accessible label and tooltip of the clear button. */
		clearLabel?: string;
		/** Accessible label and tooltip of the undo button. */
		undoLabel?: string;
		/** Per-instance translations merged over the global i18n catalog. */
		i18n?: Partial<Messages>;
		/** Theme overrides for the pad parts and the surrounding field. */
		theme?: SignatureInputThemeProps & InputProps<'signature'>['theme'];
	}
>;
