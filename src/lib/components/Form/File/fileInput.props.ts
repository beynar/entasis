import type { InputProps } from '../Field/field.js';
import type { FileInputThemeProps } from './fileInput.theme.js';
import type { Snippet } from 'svelte';
import type { FileRejection } from './fileAcceptance.js';

export type FileInputMode = 'single' | 'multiple';
export type FileInputType<Mode extends FileInputMode> = Mode extends 'multiple' ? 'files' : 'file';
export type FileInputValue<Mode extends FileInputMode> = Mode extends 'single'
	? File | null
	: File[] | null;

export type FileInputProps<Mode extends FileInputMode = 'single'> = Omit<
	InputProps<FileInputType<Mode>>,
	'value' | 'defaultValue' | 'placeholder'
> & {
	/** Selects single-file or multiple-file upload mode. */
	mode?: Mode;
	/** Bindable selected file in single mode, or file array in multiple mode. */
	value?: FileInputValue<Mode>;
	/** Initial selected file or files when `value` is omitted. */
	defaultValue?: FileInputValue<Mode>;
	/** Called whenever the selected file(s) change. */
	onValueChange?: (value: FileInputValue<Mode>) => void;
	/** Called with each file rejected by type, size, duplicate, or count validation. */
	onReject?: (rejections: FileRejection[]) => void;
	/** Accepted MIME types or extensions for the hidden input accept attribute and drag validation. */
	types?: string[];
	/** Maximum number of files allowed; in multiple mode caps the combined selection. */
	maxFiles?: number;
	/** Reflected as data-clickable on the dropzone container (defaults to true). */
	clickable?: boolean;
	/** Maximum file size in bytes; files larger than this are rejected. */
	maxSize?: number;
	/** Text shown in the empty dropzone before any files are selected. */
	placeholder?: string;
	// Slot props
	/** Custom snippet to render the list of selected files. */
	fileList?: Snippet;
	/** Additional CSS classes for the file list container. */
	fileListClass?: string;
	/** Custom snippet to render each selected file row. */
	file?: Snippet;
	/** Additional CSS classes for each file row. */
	fileClass?: string;
	/** Additional CSS classes for the empty dropzone placeholder. */
	placeholderClass?: string;
	/** Theme overrides for the file input dropzone and field parts. */
	theme?: FileInputThemeProps & InputProps<FileInputType<Mode>>['theme'];
};
