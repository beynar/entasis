import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { AIAskUserQuestionThemeProps } from './aiAskUserQuestion.theme.js';
import type { HTMLAttributes } from 'svelte/elements';

export type AIQuestionOption = {
	id: string;
	label: string;
	description?: string;
	disabled?: boolean;
};

type AIQuestionBase = {
	id: string;
	title: string;
	description?: string;
	required?: boolean;
};

export type AITextQuestion = AIQuestionBase & {
	type?: 'text';
	placeholder?: string;
	rows?: number;
};
export type AISingleQuestion = AIQuestionBase & {
	type: 'single';
	options: readonly AIQuestionOption[];
};
export type AIMultipleQuestion = AIQuestionBase & {
	type: 'multiple';
	options: readonly AIQuestionOption[];
};
export type AIFileQuestion = AIQuestionBase & {
	type: 'file';
	accept?: string | readonly string[];
	multiple?: boolean;
	maxFiles?: number;
	maxSize?: number;
};
export type AIAskQuestion = AITextQuestion | AISingleQuestion | AIMultipleQuestion | AIFileQuestion;
export type AIAskAnswer = string | string[] | File[];
export type AIAskAnswers = Record<string, AIAskAnswer | undefined>;

export type AIAskUserQuestionAnswer =
	| {
			question: AITextQuestion;
			questionId: string;
			type: 'text';
			value: string;
	  }
	| {
			question: AISingleQuestion;
			questionId: string;
			type: 'single';
			value: string;
	  }
	| {
			question: AIMultipleQuestion;
			questionId: string;
			type: 'multiple';
			value: string[];
	  }
	| {
			question: AIFileQuestion;
			questionId: string;
			type: 'file';
			value: File[];
	  };

export type AIAskUserQuestionSubmitDetail = {
	answers: AIAskUserQuestionAnswer[];
	values: AIAskAnswers;
	questions: readonly AIAskQuestion[];
};

export type AIAskUserQuestionQuestionState = {
	question: AIAskQuestion;
	value: AIAskAnswer | undefined;
	setValue: (value: AIAskAnswer) => void;
};

export type AIAskUserQuestionState = {
	questions: readonly AIAskQuestion[];
	value: AIAskAnswers;
	activeIndex: number;
	activeQuestion: AIAskQuestion | undefined;
	error: string | undefined;
	isSubmitting: boolean;
	isDiscarding: boolean;
	isWorking: boolean;
	isFirst: boolean;
	isLast: boolean;
	goTo: (index: number) => void;
	previous: () => void;
	next: () => void;
	submit: () => Promise<void>;
	discard: () => Promise<void>;
};

export type AIAskUserQuestionProps = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
		/** Bindable reference to the root question flow. */
		ref?: HTMLDivElement | null;
		/** Ordered questions rendered as steps. */
		questions: readonly AIAskQuestion[];
		/** Bindable answers keyed by question id. */
		value?: AIAskAnswers;
		/** Initial answers used only when value is omitted. Later changes do not reset answers. */
		defaultValue?: AIAskAnswers;
		/** Bindable active question index. */
		activeIndex?: number;
		/** Automatically advances after a single-choice answer. Takes precedence over `autoAdvanceSingle`. */
		autoAdvance?: boolean;
		/** Svelte Pro-compatible alias for `autoAdvance`. */
		autoAdvanceSingle?: boolean;
		/** Delay before automatic single-choice advancement, in milliseconds. Takes precedence over `autoAdvanceSingleDelay`. */
		autoAdvanceDelay?: number;
		/** Svelte Pro-compatible alias for `autoAdvanceDelay`. */
		autoAdvanceSingleDelay?: number;
		/** Disables answer controls and actions. */
		disabled?: boolean;
		/** Marks submission as externally in progress and disables the complete flow. */
		submitting?: boolean;
		/** Heading for the complete answer request. */
		title?: string;
		/** Optional name of the model, tool, or agent requesting the answers. */
		requester?: string;
		/** Optional context displayed above the active question. */
		context?: string;
		/** Final submit action label. */
		submitLabel?: string;
		/** Final action label while internal or external submission is active. */
		submittingLabel?: string;
		/** Optional discard action label. */
		discardLabel?: string;
		/** Previous-step action label. */
		previousLabel?: string;
		/** Next-step action label. */
		nextLabel?: string;
		/** Title used by the default empty state. Takes precedence over `emptyTitle`. */
		emptyLabel?: string;
		/** Svelte Pro-compatible alias for `emptyLabel`. */
		emptyTitle?: string;
		/** Description used by the default empty state. */
		emptyDescription?: string;
		/** Formats the default progress label. */
		progressLabel?: (active: number, total: number) => string;
		/** Required-answer validation message or per-question formatter. */
		requiredMessage?: string | ((question: AIAskQuestion) => string);
		/** Called after all required answers validate. */
		onSubmit?: (detail: AIAskUserQuestionSubmitDetail) => void | Promise<void>;
		/** Called by the optional discard action. */
		onDiscard?: () => void | Promise<void>;
		/** Called once with the complete answer map after a user changes an answer. */
		onValueChange?: (value: AIAskAnswers) => void;
		/** Replaces the default question-step region while retaining the header and footer. */
		children?: Slot<AIAskUserQuestionState>;
		/** Custom header receiving navigation and submission state. */
		header?: Slot<AIAskUserQuestionState>;
		/** Custom footer receiving navigation and submission actions. */
		footer?: Slot<AIAskUserQuestionState>;
		/** Custom empty state. */
		empty?: Slot<AIAskUserQuestionState>;
		/** Custom renderer for an individual question. */
		question?: Slot<AIAskUserQuestionQuestionState>;
		/** Class applied to the root question flow. */
		class?: string;
		/** Theme overrides for the question shell and semantic regions. */
		theme?: AIAskUserQuestionThemeProps;
	}
>;

export type AIAskUserQuestionType = 'text' | 'single' | 'multiple' | 'file';
export type AIAskUserQuestionOption = AIQuestionOption;
export type AIAskUserQuestionTextQuestion = AITextQuestion;
export type AIAskUserQuestionChoiceQuestion = AISingleQuestion | AIMultipleQuestion;
export type AIAskUserQuestionFileQuestion = AIFileQuestion;
export type AIAskUserQuestionQuestion = AIAskQuestion;
export type AIAskUserQuestionValue = AIAskAnswer;
export type AIAskUserQuestionValues = AIAskAnswers;
