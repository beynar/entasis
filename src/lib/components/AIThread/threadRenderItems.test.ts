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
		expect(kinds(settled)).toEqual(['reasoning', 'message', 'reasoning', 'actions']);
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
		expect(kinds(items)).toEqual(['question-summary', 'actions']);
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

	test('a turn that ends with tools gets an actions row', () => {
		const items = derive([
			{ id: 'u', role: 'user', content: 'Search' },
			{ id: 't', role: 'tool', tools: [{ id: 'search', name: 'search', status: 'success' }] }
		]);
		expect(kinds(items)).toEqual(['message', 'tool-group', 'actions']);
		expect(ofKind(items, 'actions')[0]?.actions).toMatchObject({ content: '', latest: true });
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
