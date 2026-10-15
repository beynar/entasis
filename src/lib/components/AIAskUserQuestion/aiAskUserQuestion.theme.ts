import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
import { selectedSolid } from '$lib/components/Theme/theme.recipes.js';

const defaultRoot = cva({
	base: 'raised grid min-w-0 gap-lg rounded-lg bg-surface-raised text-sm text-neutral'
});
const defaultHeader = cva({ base: 'grid min-w-0 px-lg pt-lg' });
const defaultHeaderTop = cva({ base: 'flex min-w-0 items-start justify-between gap-lg' });
const defaultHeaderText = cva({ base: 'grid min-w-0 gap-xs' });
const defaultRequester = cva({
	base: 'truncate text-xs text-neutral/60'
});
const defaultProgressGroup = cva({
	base: 'flex shrink-0 items-center'
});
const defaultSteps = cva({ base: 'flex shrink-0 items-center gap-sm' });
const defaultStep = cva({
	base: 'state-layer size-2 rounded-full bg-neutral/20 text-neutral transition-colors disabled:pointer-events-none disabled:opacity-50',
	variants: { active: { true: selectedSolid, false: '' } }
});
const defaultBody = cva({
	base: 'grid min-w-0 gap-lg'
});
const defaultStepContent = cva({ base: 'grid w-full min-w-0 gap-lg px-lg pb-xs' });
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
const defaultSummary = cva({ base: 'grid min-w-0 gap-sm text-sm text-neutral' });
const defaultSummaryTitle = cva({ base: 'text-xs font-medium text-neutral/60' });
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
			false: 'font-normal text-neutral/60 italic'
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
