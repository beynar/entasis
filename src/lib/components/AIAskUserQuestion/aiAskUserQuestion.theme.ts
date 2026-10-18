import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// Like the composer it can stand in for, the card caps itself at `--ai-chat-content-width` when a
// host sets it (AIChat docks it in place of the composer) and centres; elsewhere it spans its
// container.
const defaultRoot = cva({
	base: 'raised mx-auto grid w-full min-w-0 max-w-[var(--ai-chat-content-width,none)] gap-lg rounded-lg bg-surface-raised text-sm text-neutral'
});
const defaultHeader = cva({ base: 'grid min-w-0 px-lg pt-lg' });
const defaultHeaderTop = cva({ base: 'flex min-w-0 items-start justify-between gap-lg' });
const defaultHeaderText = cva({ base: 'grid min-w-0 gap-xs' });
const defaultRequester = cva({
	base: 'truncate text-xs text-neutral/70'
});
const defaultProgressGroup = cva({
	base: 'flex shrink-0 items-center'
});
// The negative margins let the 24px hit areas overhang, so the dots line up with the header edge
// and the row stays as tall as the progress text.
const defaultSteps = cva({ base: '-my-xs -me-md flex shrink-0 items-center' });
// A 24px pointer target (WCAG 2.5.8) drawing an 8px dot: the step dots are the way back to an
// earlier question.
const defaultStep = cva({
	base: "state-layer grid size-6 place-items-center rounded-full text-neutral transition-colors after:size-2 after:rounded-full after:bg-neutral/20 after:transition-colors after:content-[''] disabled:pointer-events-none disabled:opacity-50",
	variants: { active: { true: 'after:bg-selected', false: '' } }
});
const defaultBody = cva({
	base: 'grid min-w-0 gap-lg'
});
const defaultStepContent = cva({ base: 'grid w-full min-w-0 gap-lg px-lg pb-xs outline-none' });
const defaultQuestion = cva({ base: 'grid min-w-0 gap-xs' });
const defaultQuestionTitle = cva({
	base: 'break-words text-sm font-medium leading-snug text-neutral [overflow-wrap:anywhere]'
});
const defaultRequiredMarker = cva({ base: 'ms-xs text-danger-readable' });
const defaultOther = cva({ base: 'min-w-0' });
const defaultQuestionDescription = cva({
	base: 'break-words text-xs leading-relaxed text-neutral/70 [overflow-wrap:anywhere]'
});
const defaultTextArea = cva({ base: 'min-h-24 resize-none text-sm' });
const defaultOptions = cva({ base: 'grid w-full min-w-0 gap-md' });
const defaultFile = cva({ base: 'min-w-0' });
const defaultEmpty = cva({ base: 'm-lg min-w-0' });
// One danger message under the question; the step already carries the horizontal padding.
const defaultError = cva({ base: 'min-w-0 text-sm text-danger-readable' });
const defaultAlert = cva({ base: 'mx-lg min-w-0' });
const defaultFooter = cva({ base: 'flex min-w-0 items-center justify-end gap-md px-lg pb-lg' });
const defaultProgress = cva({ base: 'sr-only' });
const defaultTitle = cva({
	base: 'break-words text-sm font-semibold leading-snug text-neutral [overflow-wrap:anywhere]'
});
const defaultDescription = cva({
	base: 'break-words text-xs leading-relaxed text-neutral/70 [overflow-wrap:anywhere]'
});
// The answered record a transcript keeps once the request is complete: question → chosen labels.
const defaultSummary = cva({
	base: 'group/ai-ask-summary-size grid min-w-0 gap-sm text-sm data-[size=small]:text-xs data-[size=large]:text-base text-neutral'
});
const defaultSummaryTitle = cva({
	base: 'text-xs group-data-[size=large]/ai-ask-summary-size:text-sm font-medium text-neutral/70'
});
const defaultSummaryList = cva({ base: 'grid min-w-0 gap-sm' });
const defaultSummaryItem = cva({ base: 'grid min-w-0 gap-micro' });
const defaultSummaryQuestion = cva({
	base: 'break-words text-neutral/70 [overflow-wrap:anywhere]'
});
const defaultSummaryAnswer = cva({
	base: 'break-words font-medium text-neutral [overflow-wrap:anywhere]',
	variants: {
		answered: {
			true: '',
			false: 'font-normal text-neutral/70 italic'
		}
	},
	defaultVariants: { answered: true }
});
export const aiAskUserQuestionTheme = {
	root: defaultRoot,
	header: defaultHeader,
	headerTop: defaultHeaderTop,
	headerText: defaultHeaderText,
	requester: defaultRequester,
	progressGroup: defaultProgressGroup,
	steps: defaultSteps,
	step: defaultStep,
	body: defaultBody,
	stepContent: defaultStepContent,
	question: defaultQuestion,
	questionTitle: defaultQuestionTitle,
	questionDescription: defaultQuestionDescription,
	textArea: defaultTextArea,
	options: defaultOptions,
	file: defaultFile,
	empty: defaultEmpty,
	error: defaultError,
	footer: defaultFooter,
	progress: defaultProgress,
	title: defaultTitle,
	description: defaultDescription,
	requiredMarker: defaultRequiredMarker,
	other: defaultOther,
	alert: defaultAlert,
	summary: defaultSummary,
	summaryTitle: defaultSummaryTitle,
	summaryList: defaultSummaryList,
	summaryItem: defaultSummaryItem,
	summaryQuestion: defaultSummaryQuestion,
	summaryAnswer: defaultSummaryAnswer
};
export type AIAskUserQuestionTheme = typeof aiAskUserQuestionTheme;
export type AIAskUserQuestionThemeProps = InferComponentTheme<AIAskUserQuestionTheme>;
export const setAIAskUserQuestionTheme =
	setComponentTheme<AIAskUserQuestionTheme>('ai-ask-user-question');
export const useAIAskUserQuestionTheme = useComponentTheme<AIAskUserQuestionTheme>(
	'ai-ask-user-question',
	aiAskUserQuestionTheme
);
