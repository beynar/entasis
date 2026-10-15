import type {
	AIAskAnswer,
	AIAskAnswers,
	AIAskQuestion,
	AIAskUserQuestionAnswer,
	AIAskUserQuestionType,
	AIFileQuestion,
	AIMultipleQuestion,
	AISingleQuestion,
	AITextQuestion,
	AIAskUserQuestionSummaryItem
} from './aiAskUserQuestion.props.js';

/** Internal option value of the "Other…" choice. Never part of an answer. */
export const AI_ASK_OTHER_VALUE = '__entasis-ask-other__';

export function getAIAskQuestionType(question: AIAskQuestion): AIAskUserQuestionType {
	return question.type ?? 'text';
}

/** Questions are optional unless they set `required: true`. */
export function isAIAskQuestionRequired(question: AIAskQuestion): boolean {
	return question.required ?? false;
}

export function getAIAskStringAnswer(answer: AIAskAnswer | undefined): string {
	return typeof answer === 'string' ? answer : '';
}

export function getAIAskStringArrayAnswer(answer: AIAskAnswer | undefined): string[] {
	if (!Array.isArray(answer)) return [];
	return answer.filter((entry): entry is string => typeof entry === 'string');
}

export function getAIAskFileAnswer(answer: AIAskAnswer | undefined): File[] {
	if (!Array.isArray(answer) || typeof File === 'undefined') return [];
	return answer.filter((entry): entry is File => entry instanceof File);
}

export function hasSameAIAskAnswer(
	question: AIAskQuestion,
	currentAnswer: AIAskAnswer | undefined,
	nextAnswer: AIAskAnswer
): boolean {
	const type = getAIAskQuestionType(question);
	if (type === 'text' || type === 'single') {
		return getAIAskStringAnswer(currentAnswer) === getAIAskStringAnswer(nextAnswer);
	}

	const currentValues =
		type === 'file' ? getAIAskFileAnswer(currentAnswer) : getAIAskStringArrayAnswer(currentAnswer);
	const nextValues =
		type === 'file' ? getAIAskFileAnswer(nextAnswer) : getAIAskStringArrayAnswer(nextAnswer);
	return (
		currentValues.length === nextValues.length &&
		currentValues.every((value, index) => value === nextValues[index])
	);
}

/** Whether the question already holds an answer, required or not. */
export function hasAIAskAnswer(question: AIAskQuestion, values: AIAskAnswers): boolean {
	const answer = values[question.id];
	const type = getAIAskQuestionType(question);
	if (type === 'text' || type === 'single') return getAIAskStringAnswer(answer).trim().length > 0;
	if (type === 'file') return getAIAskFileAnswer(answer).length > 0;
	return getAIAskStringArrayAnswer(answer).some((entry) => entry.trim().length > 0);
}

/** Whether the question lets the flow continue: answered, or optional. */
export function isAIAskQuestionAnswered(question: AIAskQuestion, values: AIAskAnswers): boolean {
	return !isAIAskQuestionRequired(question) || hasAIAskAnswer(question, values);
}

/** The free-text "Other…" answer of a choice question: an answer that is no option id. */
export function getAIAskCustomAnswer(
	question: AIAskQuestion,
	answer: AIAskAnswer | undefined
): string | undefined {
	if (question.type !== 'single' && question.type !== 'multiple') return undefined;
	const ids = new Set(question.options.map((option) => option.id));
	if (question.type === 'single') {
		const text = getAIAskStringAnswer(answer);
		return text && !ids.has(text) ? text : undefined;
	}
	return getAIAskStringArrayAnswer(answer).find((entry) => !ids.has(entry));
}

/** The option ids of a multiple-choice answer, without its free-text entry. */
export function getAIAskOptionAnswers(
	question: AIAskQuestion,
	answer: AIAskAnswer | undefined
): string[] {
	if (question.type !== 'multiple') return [];
	const ids = new Set(question.options.map((option) => option.id));
	return getAIAskStringArrayAnswer(answer).filter((entry) => ids.has(entry));
}

/**
 * A compact, display-ready record of a completed request: each question with the labels the user
 * chose. Option ids become their labels, free-text "Other…" answers and text answers are shown as
 * typed (trimmed), files by name. Unanswered questions have no labels and `answered: false`.
 */
export function summarizeAIAskAnswers(
	questions: readonly AIAskQuestion[],
	values: AIAskAnswers
): AIAskUserQuestionSummaryItem[] {
	return questions.map((question) => {
		const answer = values[question.id];
		const labels = answerLabels(question, answer)
			.map((label) => label.trim())
			.filter(Boolean);
		return { question, questionId: question.id, labels, answered: labels.length > 0 };
	});
}

function answerLabels(question: AIAskQuestion, answer: AIAskAnswer | undefined): string[] {
	if (question.type === 'file') return getAIAskFileAnswer(answer).map((file) => file.name);
	if (question.type === 'single' || question.type === 'multiple') {
		const labels = new Map(question.options.map((option) => [option.id, option.label]));
		const entries =
			question.type === 'single'
				? [getAIAskStringAnswer(answer)]
				: getAIAskStringArrayAnswer(answer);
		return entries.map((entry) => labels.get(entry) ?? entry);
	}
	return [getAIAskStringAnswer(answer)];
}

export function getFirstMissingAIAskQuestionIndex(
	questions: readonly AIAskQuestion[],
	values: AIAskAnswers
): number {
	return questions.findIndex((question) => !isAIAskQuestionAnswered(question, values));
}

export function toAIAskAnswerList(
	questions: readonly AIAskQuestion[],
	values: AIAskAnswers
): AIAskUserQuestionAnswer[] {
	return questions.map((question) => toAnswer(question, values[question.id]));
}

function toAnswer(
	question: AIAskQuestion,
	answer: AIAskAnswer | undefined
): AIAskUserQuestionAnswer {
	if (question.type === 'single') return toSingleAnswer(question, answer);
	if (question.type === 'multiple') return toMultipleAnswer(question, answer);
	if (question.type === 'file') return toFileAnswer(question, answer);
	return toTextAnswer(question, answer);
}

function toTextAnswer(
	question: AITextQuestion,
	answer: AIAskAnswer | undefined
): AIAskUserQuestionAnswer {
	return {
		question,
		questionId: question.id,
		type: 'text',
		value: getAIAskStringAnswer(answer).trim()
	};
}

function toSingleAnswer(
	question: AISingleQuestion,
	answer: AIAskAnswer | undefined
): AIAskUserQuestionAnswer {
	return {
		question,
		questionId: question.id,
		type: 'single',
		value: getAIAskStringAnswer(answer)
	};
}

function toMultipleAnswer(
	question: AIMultipleQuestion,
	answer: AIAskAnswer | undefined
): AIAskUserQuestionAnswer {
	return {
		question,
		questionId: question.id,
		type: 'multiple',
		value: getAIAskStringArrayAnswer(answer)
	};
}

function toFileAnswer(
	question: AIFileQuestion,
	answer: AIAskAnswer | undefined
): AIAskUserQuestionAnswer {
	return {
		question,
		questionId: question.id,
		type: 'file',
		value: getAIAskFileAnswer(answer)
	};
}
