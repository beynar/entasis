import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AIChatThemeProps } from './aiChat.theme.js';

type AIChatSkeletonRootAttributes = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'>;

export type AIChatSkeletonProps = WithAttachments<
	AIChatSkeletonRootAttributes & {
		/** Bindable reference to the skeleton root. */
		ref?: HTMLDivElement | null;
		/** Number of transcript placeholders, clamped from one to eight. */
		messageCount?: number;
		/** Displays a chat-header placeholder. */
		showHeader?: boolean;
		/** Displays a composer placeholder. */
		showComposer?: boolean;
		/** Displays a chat-footer placeholder. */
		showFooter?: boolean;
		/**
		 * Width of the centred column, matching AIChat's `contentWidth` so the skeleton lines up with
		 * the chat that replaces it. @default '48rem'
		 */
		contentWidth?: string | number;
		/** Class applied to the skeleton root. */
		class?: string;
		/** AI chat theme overrides reused by the skeleton layout. */
		theme?: AIChatThemeProps;
	}
>;
