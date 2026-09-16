import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { MarkdownProps } from '$lib/components/Markdown/markdown.props.js';
import type { AIReasoningThemeProps } from './aiReasoning.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

export type AIReasoningLabels = {
	/** Default streaming status when thinking messages are empty or omitted. */
	thinking: string;
	/** Completed status when no measured or explicit duration is available. */
	thoughtForFewSeconds: string;
	/** Formats the completed status from a duration in seconds. */
	duration: (seconds: number) => string;
};

export type AIReasoningState = {
	open: boolean;
	streaming: boolean;
	duration: number | undefined;
	message: string;
	labels: AIReasoningLabels;
};
export type AIReasoningProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'content'> & {
		/** Bindable reference to the collapsible root. */
		ref?: HTMLElement | null;
		/** Markdown reasoning content. Takes precedence over custom children when provided. */
		content?: string;
		/** Bindable controlled open state. */
		open?: boolean;
		/** Initial open state when uncontrolled. Set false to opt out of streaming auto-open. */
		defaultOpen?: boolean;
		/** Called once after a user or stream lifecycle change updates `open`. */
		onOpenChange?: (open: boolean) => void;
		/** Keeps reasoning open and displays cycling progress labels. */
		streaming?: boolean;
		/** Elapsed reasoning duration in seconds; measured automatically when omitted. */
		duration?: number;
		/** Delay before the first streamed completion closes, in milliseconds. @default 1000 */
		autoCloseDelay?: number;
		/** Supplied labels cycle while streaming; otherwise the trigger displays "Thinking…". */
		thinkingMessages?: readonly string[];
		/** Overrides default streaming and completed-status copy. */
		labels?: Partial<AIReasoningLabels>;
		/** Replaces the default trigger row and receives open, streaming, duration, and message state. */
		trigger?: Slot<AIReasoningState>;
		/** Custom body used only when `content` is omitted. */
		children?: Slot<AIReasoningState>;
		/** Props forwarded to Markdown except for its owned content. */
		markdown?: Omit<MarkdownProps, 'content' | 'renderHtml'>;
		/** Class applied to the collapsible root. */
		class?: string;
		/** Theme overrides for the reasoning trigger and body. */
		theme?: AIReasoningThemeProps;
	}
>;
