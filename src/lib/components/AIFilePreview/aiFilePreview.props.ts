import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIFilePreviewThemeProps } from './aiFilePreview.theme.js';

export type AIFilePreviewSource =
	| File
	| {
			id?: string | number | bigint;
			name: string;
			size?: number;
			type?: string;
			previewUrl?: string;
	  };

export type AIFilePreviewProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** Bindable reference to the root preview element. */
		ref?: HTMLDivElement | null;
		/** File or file metadata to display. */
		file: AIFilePreviewSource;
		/** File name override. */
		name?: string;
		/** Image preview URL override. */
		previewUrl?: string;
		/** Current upload status. */
		status?: 'pending' | 'uploading' | 'uploaded' | 'failed';
		/** Error message displayed for the file. */
		error?: string;
		/** Called when the remove button is selected. */
		onRemove?: () => void;
		/** Called when the retry button is selected. */
		onRetry?: () => void;
		/** Additional classes applied to the root element. */
		class?: string;
		/** Theme overrides for the preview parts. */
		theme?: AIFilePreviewThemeProps;
	}
>;
