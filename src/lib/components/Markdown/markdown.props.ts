import type { Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { StreamdownProps } from 'svelte-streamdown';
import type { MarkdownThemeProps } from './markdown.theme.js';

/** Type/spacing scale for the rendered markdown. */
export type MarkdownSize = Sizes;

export type MarkdownProps = WithAttachments<
	Omit<
		StreamdownProps,
		| 'content'
		| 'theme'
		| 'baseTheme'
		| 'mergeTheme'
		| 'class'
		| 'code'
		| 'mermaid'
		| 'mdxComponents'
		| 'children'
		| 'streamdown'
		| 'element'
	> & {
		/** The markdown source. Re-renders reactively; incomplete/streaming markdown is handled gracefully. */
		content: string;
		/** Type/spacing scale: 'small' for chat messages, 'normal' default, 'large' for long-form documents. @default 'normal' */
		size?: MarkdownSize;
		/** Additional classes on the root wrapper. */
		class?: string;
		/** Per-instance theme overrides (root part). */
		theme?: MarkdownThemeProps;
		/** Custom MDX components. Matching names override Markdown's built-in entasis components. */
		mdxComponents?: StreamdownProps['mdxComponents'];
	}
>;
