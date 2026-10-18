import { describe, expect, test } from 'vitest';
import type { AIThreadItem } from './aiThread.props.js';
import { deriveAIThreadRenderItems, type AIThreadRenderItem } from './threadRenderItems.js';

const derive = (
	messages: AIThreadItem[],
	options: Partial<Parameters<typeof deriveAIThreadRenderItems>[1]> = {}
) =>
	deriveAIThreadRenderItems(messages, {
		getMessageKey: (message, index) => String(message.id ?? index),
		...options
	});

const kinds = (items: AIThreadRenderItem[]) => items.map((item) => item.kind);
const ofKind = <K extends AIThreadRenderItem['kind']>(items: AIThreadRenderItem[], kind: K) =>
	items.filter((item): item is Extract<AIThreadRenderItem, { kind: K }> => item.kind === kind);

const question = {
	id: 'scope',
	type: 'single',
	title: 'Which release?',
	options: [
		{ id: 'beta', label: 'Private beta' },
		{ id: 'ga', label: 'General availability' }
	]
};

describe('AI SDK parts', () => {
	test('reasoning parts render as reasoning, streaming only while they are being written', () => {
		const message: AIThreadItem = {
			id: 'a',
			role: 'assistant',
			parts: [
				{ type: 'reasoning', text: 'Weighing the options.', state: 'done' },
				{ type: 'text', text: 'Here is the plan.' },
				{ type: 'reasoning', text: 'Checking one more thing.' }
			]
		};
		const settled = derive([message]);
		// The bar rides on the text answer, not on the thinking that follows it.
		expect(kinds(settled)).toEqual(['reasoning', 'message', 'reasoning']);
		expect(ofKind(settled, 'message')[0]?.actions).toMatchObject({ content: 'Here is the plan.' });
		expect(ofKind(settled, 'reasoning').map((item) => item.streaming)).toEqual([false, false]);

		const streaming = derive([message], { streaming: true });
		expect(ofKind(streaming, 'reasoning').map((item) => item.streaming)).toEqual([false, true]);
		expect(
			derive([{ ...message, parts: [{ type: 'reasoning', text: 'x', state: 'streaming' }] }])
				.filter((item) => item.kind === 'reasoning')
				.map((item) => item.kind === 'reasoning' && item.streaming)
		).toEqual([true]);
	});

	test('approval states map onto AITool statuses instead of spinning', () => {
		const items = derive([
			{
				id: 'a',
				role: 'assistant',
				parts: [
					{ type: 'tool-deploy', toolCallId: 'one', state: 'approval-requested', input: {} },
					{
						type: 'tool-deploy',
						toolCallId: 'two',
						state: 'output-denied',
						approval: { id: 'x', approved: false }
					},
					{ type: 'tool-deploy', toolCallId: 'three', state: 'approval-responded' }
				]
			}
		]);
		const [group] = ofKind(items, 'tool-group');
		expect(group?.tools.map((tool) => tool.status)).toEqual([
			'approval-requested',
			'output-denied',
			'approval-responded'
		]);
		expect(group?.tools[1]?.approval).toEqual({ id: 'x', approved: false });
	});

	test('source parts render as one sources row and unsafe links stay plain', () => {
		const items = derive([
			{
				id: 'a',
				role: 'assistant',
				parts: [
					{ type: 'text', text: 'Answer.' },
					{ type: 'source-url', sourceId: 's1', url: 'https://www.example.com/a', title: '' },
					{ type: 'source-url', sourceId: 's2', url: 'javascript:alert(1)', title: 'Bad' },
					{ type: 'source-document', sourceId: 's3', mediaType: 'application/pdf', title: 'Spec' }
				]
			}
		]);
		const [sources] = ofKind(items, 'sources');
		expect(sources?.sources).toEqual([
			{ id: 's1', url: 'https://www.example.com/a', title: 'example.com' },
			{ id: 's2', url: undefined, title: 'Bad' },
			{ id: 's3', title: 'Spec' }
		]);
	});

	test('file parts sit on the text segment, or on a segment of their own', () => {
		const file = {
			type: 'file',
			mediaType: 'image/png',
			filename: 'chart.png',
			url: 'https://cdn.example.com/chart.png'
		};
		const withText = derive([
			{ id: 'u', role: 'user', parts: [file, { type: 'text', text: 'What is this?' }] }
		]);
		const [message] = ofKind(withText, 'message');
		expect(message?.files).toEqual([
			{
				id: 'u:part-0',
				name: 'chart.png',
				type: 'image/png',
				previewUrl: 'https://cdn.example.com/chart.png'
			}
		]);

		const filesOnly = derive([
			{ id: 'u', role: 'user', parts: [{ ...file, url: 'javascript:void(0)', filename: '' }] }
		]);
		expect(kinds(filesOnly)).toEqual(['message']);
		expect(ofKind(filesOnly, 'message')[0]?.files?.[0]).toMatchObject({
			name: 'image/png',
			previewUrl: undefined
		});
	});
});

describe('answered questions', () => {
	const askPart = (state: string, output?: unknown) => ({
		type: 'tool-askUserQuestion',
		toolCallId: 'ask',
		state,
		input: { title: 'Release scope', questions: [question] },
		output
	});

	test('a completed question becomes a question → answer summary', () => {
		const items = derive([
			{
				id: 'a',
				role: 'assistant',
				parts: [askPart('output-available', { state: 'completed', values: { scope: 'ga' } })]
			}
		]);
		// No text answer, so no copy/retry bar.
		expect(kinds(items)).toEqual(['question-summary']);
		expect(ofKind(items, 'question-summary')[0]).toMatchObject({
			title: 'Release scope',
			value: { scope: 'ga' }
		});
	});

	test('a locally resolved question uses the submitted values even before the messages update', () => {
		const items = derive([{ id: 'a', role: 'assistant', parts: [askPart('input-available')] }], {
			questionStates: { 'a:ask': 'completed' },
			questionValues: { 'a:ask': { scope: 'beta' } }
		});
		expect(ofKind(items, 'question-summary')[0]?.value).toEqual({ scope: 'beta' });
		expect(ofKind(items, 'tool-group')).toEqual([]);
	});

	test('a dismissed question settles as a cancelled call', () => {
		const items = derive([{ id: 'a', role: 'assistant', parts: [askPart('input-available')] }], {
			questionStates: { 'a:ask': 'discarded' }
		});
		expect(ofKind(items, 'tool-group')[0]?.tools[0]?.status).toBe('cancelled');
	});
});

describe('one action bar per unit', () => {
	const conversation: AIThreadItem[] = [
		{ id: 'u1', role: 'user', content: 'First question' },
		{ id: 'a1', role: 'assistant', content: 'First answer' },
		{ id: 'u2', role: 'user', content: 'Second question' },
		{ id: 'a2', role: 'assistant', content: 'I checked the docs.' },
		{ id: 't2', role: 'tool', tools: [{ id: 'search', name: 'search', status: 'success' }] },
		{ id: 'a3', role: 'assistant', content: 'Here is the summary.' }
	];

	test('a turn split by tools has one bar at its end that copies the whole turn', () => {
		const items = derive(conversation);
		expect(kinds(items)).toEqual([
			'message',
			'message',
			'message',
			'message',
			'tool-group',
			'message',
			'actions'
		]);
		const messages = ofKind(items, 'message');
		expect(messages[3]?.actions).toBe(false);
		expect(messages[4]?.actions).toBe(false);
		const [bar] = ofKind(items, 'actions');
		expect(bar?.actions).toMatchObject({
			role: 'assistant',
			messageIndex: 5,
			content: 'I checked the docs.\n\nHere is the summary.',
			latest: true
		});
	});

	test('a single-segment turn keeps its bar on the message; earlier turns are not latest', () => {
		const messages = ofKind(derive(conversation), 'message');
		expect(messages[0]?.actions).toMatchObject({ role: 'user', latest: false });
		expect(messages[1]?.actions).toMatchObject({
			role: 'assistant',
			content: 'First answer',
			latest: false
		});
		expect(messages[2]?.actions).toMatchObject({ role: 'user', content: 'Second question' });
	});

	test('an assistant turn without text (only tools or thinking) has no bar', () => {
		const items = derive([
			{ id: 'u', role: 'user', content: 'Search' },
			{ id: 't', role: 'tool', tools: [{ id: 'search', name: 'search', status: 'success' }] },
			{ id: 'r', role: 'assistant', parts: [{ type: 'reasoning', text: 'Hmm.', state: 'done' }] }
		]);
		expect(kinds(items)).toEqual(['message', 'tool-group', 'reasoning']);
		expect(ofKind(items, 'message')[0]?.actions).toMatchObject({ role: 'user' });
	});

	test('a turn whose text is followed by tools keeps its bar on the text', () => {
		const items = derive([
			{ id: 'u', role: 'user', content: 'Search' },
			{ id: 'a', role: 'assistant', content: 'Searching now.' },
			{ id: 't', role: 'tool', tools: [{ id: 'search', name: 'search', status: 'success' }] }
		]);
		expect(kinds(items)).toEqual(['message', 'message', 'tool-group']);
		expect(ofKind(items, 'message')[1]?.actions).toMatchObject({
			content: 'Searching now.',
			latest: true
		});
	});
});

describe('streaming and errors', () => {
	test('a streaming reply to a user turn shows the pending row', () => {
		const items = derive([{ id: 'u', role: 'user', content: 'Hello' }], { streaming: true });
		expect(kinds(items)).toEqual(['message', 'pending']);
		expect(kinds(derive([{ id: 'u', role: 'user', content: 'Hello' }]))).toEqual(['message']);
	});

	test('the streaming segment carries the caret and no bar until the reply ends', () => {
		const messages: AIThreadItem[] = [
			{ id: 'u', role: 'user', content: 'Hello' },
			{ id: 'a', role: 'assistant', content: 'Hi th' }
		];
		const items = ofKind(derive(messages, { streaming: true }), 'message');
		expect(items[1]).toMatchObject({ streaming: true, actions: false });
		expect(kinds(derive(messages, { streaming: true }))).toEqual(['message', 'message']);
	});

	test('an error row ends the transcript instead of the pending row', () => {
		const items = derive([{ id: 'u', role: 'user', content: 'Hello' }], {
			streaming: true,
			error: true
		});
		expect(kinds(items)).toEqual(['message', 'error']);
		expect(kinds(derive([], { error: true }))).toEqual(['error']);
	});
});

describe('review fixes', () => {
	test('a files-only user message after a tool-ending reply keeps the tool group before it', () => {
		const items = derive([
			{ id: 'u1', role: 'user', content: 'hi' },
			{
				id: 'a1',
				role: 'assistant',
				parts: [
					{ type: 'text', text: 'Looking' },
					{
						type: 'tool-search',
						toolCallId: 's1',
						state: 'output-available',
						input: {},
						output: {}
					}
				]
			},
			{
				id: 'u2',
				role: 'user',
				parts: [{ type: 'file', mediaType: 'image/png', url: 'https://example.com/a.png' }]
			}
		]);
		expect(
			items.map((item) => `${item.kind}:${'messageIndex' in item ? item.messageIndex : ''}`)
		).toEqual(['message:0', 'message:1', 'tool-group:1', 'message:2']);
		// The reply's bar sits on its text, before the tool group.
		const bar = ofKind(items, 'message').find((item) => item.messageIndex === 1);
		expect(bar?.actions).toMatchObject({ messageIndex: 1, latest: false });
		const assistantUnits = new Set(
			items
				.filter((item) => 'messageIndex' in item && item.messageIndex === 1)
				.map((item) => item.unit)
		);
		expect(assistantUnits.size).toBe(1);
	});

	test.each([
		['no parts', []],
		['only step-start', [{ type: 'step-start' }]],
		['an empty text part', [{ type: 'text', text: '' }]],
		['an empty reasoning part', [{ type: 'reasoning', text: '' }]]
	])('an assistant message with %s keeps the pending row while streaming', (_, parts) => {
		const messages: AIThreadItem[] = [
			{ id: 'u', role: 'user', content: 'hi' },
			{ id: 'a', role: 'assistant', parts }
		];
		expect(kinds(derive(messages, { streaming: true }))).toEqual(['message', 'pending']);
		expect(kinds(derive(messages))).toEqual(['message']);
	});

	test('an empty assistant placeholder without parts keeps the pending row while streaming', () => {
		const messages: AIThreadItem[] = [
			{ id: 'u', role: 'user', content: 'hi' },
			{ id: 'a', role: 'assistant', content: '' }
		];
		expect(kinds(derive(messages, { streaming: true }))).toEqual(['message', 'pending']);
	});

	test('a trailing system notice does not end the latest assistant turn', () => {
		const items = derive([
			{ id: 'u', role: 'user', content: 'hi' },
			{ id: 'a', role: 'assistant', content: 'yo' },
			{ id: 's', role: 'system', content: 'Model switched' }
		]);
		const messages = ofKind(items, 'message');
		expect(messages[1]?.actions).toMatchObject({ role: 'assistant', latest: true });
		expect(messages[2]?.unit).not.toBe(messages[1]?.unit);
	});

	test('every row of a turn shares one unit key, distinct from the next turn', () => {
		const items = derive([
			{ id: 'u', role: 'user', content: 'Search' },
			{
				id: 'a',
				role: 'assistant',
				parts: [
					{ type: 'reasoning', text: 'Planning.', state: 'done' },
					{ type: 'text', text: 'One' },
					{
						type: 'tool-search',
						toolCallId: 's1',
						state: 'output-available',
						input: {},
						output: {}
					},
					{ type: 'text', text: 'Two' }
				]
			}
		]);
		expect(kinds(items)).toEqual([
			'message',
			'reasoning',
			'message',
			'tool-group',
			'message',
			'actions'
		]);
		const [user, ...turn] = items;
		expect(new Set(turn.map((item) => item.unit)).size).toBe(1);
		expect(turn[0]?.unit).not.toBe(user?.unit);
	});
});
