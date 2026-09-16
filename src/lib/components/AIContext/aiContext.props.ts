import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AIContextThemeProps } from './aiContext.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

export type AIContextUsage = {
	inputTokens?: number;
	outputTokens?: number;
	reasoningTokens?: number;
	cachedInputTokens?: number;
	totalTokens?: number;
};

export type AIContextTone = 'default' | 'warning' | 'danger';
export type AIContextLabels = {
	/** Heading shown in the default HoverCard content. */
	title: string;
	/** Formats the remaining-token sentence from an already formatted token count. */
	remaining: (tokens: string) => string;
	/** Breakdown label for prompt/input tokens. */
	input: string;
	/** Breakdown label for generated/output tokens. */
	output: string;
	/** Breakdown label for reasoning tokens. */
	reasoning: string;
	/** Breakdown label for cached input tokens. */
	cachedInput: string;
	/** Summary label for consumed tokens. */
	used: string;
	/** Summary label for the context-window limit. */
	maximum: string;
	/** Formats the trigger's accessible name from formatted token counts. */
	label: (used: string, maximum: string, remaining: string) => string;
};
export type AIContextState = {
	maxTokens: number;
	usedTokens: number;
	remainingTokens: number;
	percent: number;
	tone: AIContextTone;
	formattedUsed: string;
	formattedMax: string;
	formattedRemaining: string;
	labels: AIContextLabels;
};

export type AIContextProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class' | 'dir'> & {
		/** Bindable reference to the root context control wrapper. */
		ref?: HTMLDivElement | null;
		/** Maximum context-window size in tokens. */
		maxTokens?: number;
		/** Explicit used-token count. Takes precedence over `usage`. */
		usedTokens?: number;
		/** Structured token breakdown; falls back to conversation state when omitted or undefined. Pass `null` to suppress that fallback. */
		usage?: AIContextUsage | null;
		/** Renders only the circular meter in the trigger. */
		compact?: boolean;
		/** Percentage at which warning styling begins. */
		warningAt?: number;
		/** Percentage at which danger styling begins. */
		dangerAt?: number;
		/** Formats token counts in the trigger and details. */
		formatTokens?: (tokens: number) => string;
		/** Overrides text and accessible wording used by the default trigger and details. */
		labels?: Partial<AIContextLabels>;
		/** Text direction applied to the trigger and portalled hover content. */
		dir?: 'ltr' | 'rtl';
		/** Custom trigger content receiving the resolved usage state. */
		children?: Slot<AIContextState>;
		/** Custom hover-card content receiving the resolved usage state. */
		content?: Slot<AIContextState>;
		/** Class applied to the root wrapper. */
		class?: string;
		/** Theme overrides for every semantic context region. */
		theme?: AIContextThemeProps;
	}
>;
