// The request AIThread and AIChat dock carries the tool call's settings to AIAskUserQuestion.
import { describe, expect, test } from 'vitest';
import type { AIToolCall } from '../AITool/aiTool.props.js';
import type { AIThreadItem } from './aiThread.props.js';
import { toAskUserQuestionRequest } from './threadAskUserQuestion.js';

const questions = [
	{ id: 'scope', type: 'single', title: 'Scope', options: [{ id: 'beta', label: 'Beta' }] }
];
const request = (input: Record<string, unknown>) => {
	const tool = { id: 't1', name: 'ask_user_question', status: 'running', input } as AIToolCall;
	const message = { id: 'm1', role: 'tool', tools: [tool] } as AIThreadItem;
	return toAskUserQuestionRequest(message, 0, 'm1', tool, 0, {});
};

describe('ask_user_question requests', () => {
	test('showOther from the tool input reaches the request; unset keeps the default', () => {
		expect(request({ questions, showOther: false })?.showOther).toBe(false);
		expect(request({ questions, showOther: true })?.showOther).toBe(true);
		expect(request({ questions })?.showOther).toBeUndefined();
		expect(request({ questions, showOther: 'no' })?.showOther).toBeUndefined();
	});
});
