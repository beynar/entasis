import type { AIAskAnswers, AIAskQuestion } from '../AIAskUserQuestion/aiAskUserQuestion.props.js';
import type { AIToolCall } from '../AITool/aiTool.props.js';
import type {
	AIThreadAskUserQuestion,
	AIThreadAskUserQuestionState,
	AIThreadItem,
	AIThreadMessageKey
} from './aiThread.props.js';
import { collectAIThreadMessageTools } from './threadTools.js';

type UnknownRecord = Record<string, unknown>;

export function findActiveAskUserQuestion<TMessage extends AIThreadItem>(
	messages: readonly TMessage[],
	getMessageKey: (message: TMessage, index: number) => string,
	stateOverrides: Record<string, AIThreadAskUserQuestionState | undefined>
): AIThreadAskUserQuestion<TMessage> | null {
	for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
		const message = messages[messageIndex];
		if (!message) continue;
		const tools = collectAIThreadMessageTools(
			message,
			messageIndex,
			getMessageKey(message, messageIndex)
		);
		for (let toolIndex = tools.length - 1; toolIndex >= 0; toolIndex -= 1) {
			const tool = tools[toolIndex];
			if (!tool || !isAskUserQuestionTool(tool)) continue;
			const request = toAskUserQuestionRequest(
				message,
				messageIndex,
				getMessageKey(message, messageIndex),
				tool,
				toolIndex,
				stateOverrides
			);
			return request?.state === 'pending' ? request : null;
		}
	}
	return null;
}

export function toAskUserQuestionRequest<TMessage extends AIThreadItem>(
	message: TMessage,
	messageIndex: number,
	messageKey: AIThreadMessageKey,
	tool: AIToolCall,
	toolIndex: number,
	stateOverrides: Record<string, AIThreadAskUserQuestionState | undefined>
): AIThreadAskUserQuestion<TMessage> | undefined {
	const input = recordValue(tool.input);
	const output = recordValue(tool.output);
	const questions = questionList(output?.questions ?? input?.questions);
	if (questions.length === 0) return undefined;
	const key = `${String(messageKey)}:${toolKey(tool, toolIndex)}`;
	const state =
		stateOverrides[key] ?? questionState(output?.state ?? terminalToolState(tool) ?? input?.state);
	return {
		key,
		tool,
		toolIndex,
		message,
		messageIndex,
		state,
		questions,
		value: valuesRecord(output?.value ?? output?.values ?? input?.value ?? input?.values),
		title: stringValue(output?.title ?? input?.title) ?? tool.title,
		requester: stringValue(output?.requester ?? input?.requester),
		context: stringValue(output?.context ?? input?.context),
		submitLabel: stringValue(output?.submitLabel ?? input?.submitLabel),
		submittingLabel: stringValue(output?.submittingLabel ?? input?.submittingLabel),
		nextLabel: stringValue(output?.nextLabel ?? input?.nextLabel),
		previousLabel: stringValue(output?.previousLabel ?? input?.previousLabel),
		discardLabel: stringValue(output?.discardLabel ?? input?.discardLabel)
	};
}

export function isAskUserQuestionTool(tool: AIToolCall): boolean {
	const name = normalizedName(tool.name ?? tool.title);
	return ['askuserquestion', 'askquestion', 'requestuserquestion', 'requestuserinput'].includes(
		name
	);
}

function questionState(value: unknown): AIThreadAskUserQuestionState {
	const normalized = normalizedName(value);
	if (['completed', 'complete', 'success', 'submitted'].includes(normalized)) return 'completed';
	if (['discarded', 'discard', 'cancelled', 'canceled'].includes(normalized)) return 'discarded';
	return 'pending';
}

function terminalToolState(tool: AIToolCall): AIThreadAskUserQuestionState | undefined {
	if (tool.status === 'success') return 'completed';
	if (tool.status === 'cancelled' || tool.status === 'error') return 'discarded';
	return undefined;
}

function toolKey(tool: AIToolCall, index: number): string {
	return String(tool.id ?? tool.name ?? tool.title ?? index);
}

function normalizedName(value: unknown): string {
	return typeof value === 'string' ? value.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
}

function recordValue(value: unknown): UnknownRecord | undefined {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: undefined;
}

function valuesRecord(value: unknown): AIAskAnswers | undefined {
	const record = recordValue(value);
	return record as AIAskAnswers | undefined;
}

function questionList(value: unknown): AIAskQuestion[] {
	return Array.isArray(value) ? value.filter(isQuestion) : [];
}

function isQuestion(value: unknown): value is AIAskQuestion {
	const question = recordValue(value);
	if (!question || typeof question.id !== 'string' || typeof question.title !== 'string') {
		return false;
	}
	if (question.type === 'single' || question.type === 'multiple') {
		return Array.isArray(question.options);
	}
	return question.type === undefined || question.type === 'text' || question.type === 'file';
}

function stringValue(value: unknown): string | undefined {
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}
