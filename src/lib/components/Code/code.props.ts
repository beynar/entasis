import type { WithAttachments } from '$lib/types/props.js';
import type { WithSlot } from '../Slot/slot.js';
import type { CodeThemeProps } from './code.theme.js';

/** Payload passed to the `header` slot, letting a custom header drive the copy button. */
export type CodeHeaderPayload = {
	/** Resolved language id (e.g. `ts`, `svelte`; `plaintext` when unknown). */
	language: string;
	/** Header label — `title` when set, otherwise the language's display name. */
	label: string;
	/** Whether the copy button is currently in its "copied" state. */
	copied: boolean;
	/** Copies the code to the clipboard and toggles `copied` for 2 seconds. */
	copy: () => void;
};

export type CodeProps = WithSlot<
	WithAttachments<{
		/**
		 * Source code string to highlight and display. This is also what the copy
		 * button writes to the clipboard.
		 */
		code: string;
		/**
		 * Language id or alias used for highlighting — e.g. `ts`, `svelte`,
		 * `css`, `bash`. Aliases are resolved; unknown ids fall back to plain text.
		 * Defaults to `'text'`.
		 */
		language?: string;
		/**
		 * Header label. Defaults to the language's human-friendly display name.
		 */
		title?: string;
		/**
		 * When true, renders a line-number gutter to the left of the code.
		 */
		showLineNumbers?: boolean;
		/**
		 * When true, long lines soft-wrap instead of scrolling horizontally.
		 */
		wrap?: boolean;
		/**
		 * Caps the code block height and makes it vertically scrollable (via ScrollArea).
		 * A number is treated as pixels; a string is used as-is (e.g. `'20rem'`, `'60vh'`).
		 */
		maxHeight?: number | string;
		/**
		 * Tab width for the rendered code, in spaces. Defaults to 2.
		 */
		tabSize?: number;
		/**
		 * When true (default), renders the default header row (title + copy button).
		 * Set to false to show only the code block. Ignored when a custom `header`
		 * snippet is provided.
		 */
		showHeader?: boolean;
		/**
		 * When true (default), shows the copy-to-clipboard button in the header.
		 */
		copyable?: boolean;
		/**
		 * The class name of the code block. First element the component outputs in
		 * the DOM.
		 */
		class?: string;
		/**
		 * Custom theme overrides for the code container, header, title, footer, and
		 * scroll container.
		 */
		theme?: CodeThemeProps;
	}>,
	'header' | 'footer',
	CodeHeaderPayload
>;
