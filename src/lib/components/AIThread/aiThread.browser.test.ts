// Scrolling, the scroll-to-latest button and the transcript's status rows need real layout.
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { AIThreadItem } from './aiThread.props.js';
import Harness from './AIThreadHarness.test.svelte';

const history = (turns: number): AIThreadItem[] =>
	Array.from({ length: turns }, (_, turn): AIThreadItem[] => [
		{ id: `u${turn}`, role: 'user', content: `Question ${turn + 1}` },
		{
			id: `a${turn}`,
			role: 'assistant',
			content: `Answer ${turn + 1}. ${'The rollout needs compatibility, telemetry, and approval gates. '.repeat(3)}`
		}
	]).flat();

const viewport = () =>
	document.querySelector<HTMLElement>('[data-slot="ai-thread-viewport"]') as HTMLElement;
const scrollButton = () =>
	document.querySelector<HTMLElement>('[data-slot="ai-thread-scroll-button"]');
const distanceToEnd = () => {
	const node = viewport();
	return node.scrollHeight - node.clientHeight - node.scrollTop;
};
const settle = () => new Promise((resolve) => setTimeout(resolve, 120));

async function renderAtEnd(props: Record<string, unknown> = {}) {
	const screen = await render(Harness, { props: { messages: history(12), ...props } });
	await expect.poll(() => viewport()?.scrollHeight > viewport()?.clientHeight).toBe(true);
	await expect.poll(() => distanceToEnd()).toBeLessThan(2);
	await settle();
	return screen;
}

describe('scroll-to-latest button', () => {
	test('appears after a wheel scroll up, sits centred, and brings the view back', async () => {
		await renderAtEnd();
		expect(scrollButton()).toBeNull();

		await page.elementLocator(viewport()).wheel({ delta: { y: -300 } });
		await expect.poll(() => scrollButton()).not.toBeNull();
		expect(distanceToEnd()).toBeGreaterThan(100);

		const container = document.querySelector('[data-testid="container"]')!.getBoundingClientRect();
		const button = scrollButton()!.getBoundingClientRect();
		expect(Math.abs(button.left + button.width / 2 - (container.left + container.width / 2))).toBe(
			0
		);
		expect(getComputedStyle(scrollButton()!).borderTopLeftRadius).not.toBe('0px');

		scrollButton()!.click();
		await expect.poll(() => distanceToEnd()).toBeLessThan(2);
		await expect.poll(() => scrollButton()).toBeNull();
	});

	test('appears after a keyboard scroll and after a scrollbar-style scroll', async () => {
		await renderAtEnd();
		viewport().focus();
		await userEvent.keyboard('{PageUp}');
		await expect.poll(() => scrollButton()).not.toBeNull();

		scrollButton()!.click();
		await expect.poll(() => scrollButton()).toBeNull();
		await settle();
		// A scrollbar drag lands as plain scroll events, like setting scrollTop.
		viewport().scrollTop = viewport().scrollTop - 60;
		await expect.poll(() => scrollButton()).not.toBeNull();
	});
});

describe('following a streaming reply', () => {
	const streamingThread = (text: string): AIThreadItem[] => [
		...history(12),
		{ id: 'u-live', role: 'user', content: 'Draft the announcement.' },
		{ id: 'a-live', role: 'assistant', content: text }
	];

	test('scrolling up during a stream is never moved, and the very end re-pins', async () => {
		const screen = await renderAtEnd({ messages: streamingThread('Starting'), streaming: true });
		await page.elementLocator(viewport()).wheel({ delta: { y: -250 } });
		await expect.poll(() => scrollButton()).not.toBeNull();
		await settle();
		const parked = viewport().scrollTop;

		let text = 'Starting';
		for (let step = 0; step < 6; step += 1) {
			text += ' and another line of the streamed reply that grows the last row.'.repeat(2);
			await screen.rerender({ messages: streamingThread(text), streaming: true });
			await settle();
			expect(Math.abs(viewport().scrollTop - parked)).toBeLessThanOrEqual(1);
		}
		expect(distanceToEnd()).toBeGreaterThan(100);

		// Reaching the very end follows again.
		viewport().scrollTop = viewport().scrollHeight;
		await expect.poll(() => distanceToEnd()).toBeLessThan(2);
		await settle();
		text += ' A final burst of output that grows the reply once more.'.repeat(4);
		await screen.rerender({ messages: streamingThread(text), streaming: true });
		await expect.poll(() => distanceToEnd()).toBeLessThan(2);
		expect(scrollButton()).toBeNull();
	});

	test('a reply that has not started shows the pending row', async () => {
		await render(Harness, {
			props: { messages: [{ id: 'u', role: 'user', content: 'Hello' }], streaming: true }
		});
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-pending-label"]')?.textContent)
			.toContain('Thinking');
		expect(
			document.querySelector('[data-slot="ai-thread-pending-label"]')?.classList.contains('shimmer')
		).toBe(true);
		expect(document.querySelector('[data-slot="ai-thread-live-region"]')?.textContent?.trim()).toBe(
			'Thinking…'
		);
	});

	test('the streaming reply shows a caret until it ends', async () => {
		const messages: AIThreadItem[] = [
			{ id: 'u', role: 'user', content: 'Hello' },
			{ id: 'a', role: 'assistant', content: 'Hi th' }
		];
		const screen = await render(Harness, { props: { messages, streaming: true } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-message-caret"]'))
			.not.toBeNull();
		await screen.rerender({ messages, streaming: false });
		await expect.poll(() => document.querySelector('[data-slot="ai-message-caret"]')).toBeNull();
	});
});

describe('turn units and status rows', () => {
	test('latest mode shows the final assistant bar and hover-hides the rest', async () => {
		await render(Harness, { props: { messages: history(2), height: 900 } });
		await expect
			.poll(() => document.querySelectorAll('[data-slot="ai-message-actions"]').length)
			.toBe(4);
		const opacities = Array.from(
			document.querySelectorAll<HTMLElement>('[data-slot="ai-message-actions"]')
		).map((node) => getComputedStyle(node).opacity);
		expect(opacities).toEqual(['0', '0', '0', '1']);
		// Hidden bars still take their row's height, so nothing is drawn under them.
		const bar = document.querySelectorAll<HTMLElement>('[data-slot="ai-message-actions"]')[1]!;
		expect(bar.getBoundingClientRect().height).toBeGreaterThan(20);
		expect(getComputedStyle(bar).position).toBe('static');
	});

	test('an error shows inline with a Retry button and no empty state behind it', async () => {
		const onErrorRetry = vi.fn();
		const screen = await render(Harness, {
			props: { messages: [], error: new Error('Provider down'), onErrorRetry }
		});
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-error"]')?.textContent)
			.toContain('Provider down');
		expect(document.querySelector('[data-slot="ai-thread-empty"]')).toBeNull();
		document.querySelector<HTMLElement>('[data-slot="ai-thread-error-retry"]')!.click();
		expect(onErrorRetry).toHaveBeenCalledOnce();
		await screen.rerender({ error: undefined });
		await expect.poll(() => document.querySelector('[data-slot="ai-thread-empty"]')).not.toBeNull();
	});

	test('follow-up suggestions show after an assistant turn, not while streaming', async () => {
		const onSelect = vi.fn();
		const screen = await render(Harness, {
			props: { messages: history(1), suggestions: ['Add owners', 'List risks'], onSelect }
		});
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-follow-ups"]')?.textContent)
			.toContain('Add owners');
		document.querySelector<HTMLElement>('[data-slot="ai-thread-follow-ups"] button')!.click();
		expect(onSelect).toHaveBeenCalledWith('Add owners');
		await screen.rerender({ streaming: true });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-follow-ups"]'))
			.toBeNull();
	});

	test('a narrow thread drops the table of contents and its gutter', async () => {
		const screen = await renderAtEnd({ showToc: true, messages: history(12), width: 720 });
		await expect.poll(() => document.querySelector('[data-slot="ai-thread-toc"]')).not.toBeNull();
		expect(parseFloat(getComputedStyle(viewport()).paddingLeft)).toBeGreaterThan(0);
		await screen.rerender({ width: 360 });
		await expect.poll(() => document.querySelector('[data-slot="ai-thread-toc"]')).toBeNull();
		expect(getComputedStyle(viewport()).paddingLeft).toBe('0px');
	});
});

describe('turn layout', () => {
	const turns: AIThreadItem[] = [
		{ id: 'u1', role: 'user', content: 'Plan the launch' },
		{
			id: 'a1',
			role: 'assistant',
			parts: [
				{ type: 'reasoning', text: 'Weighing the gates.', state: 'done' },
				{ type: 'text', text: 'First part of the answer.' },
				{
					type: 'tool-search',
					toolCallId: 's1',
					state: 'output-available',
					input: { query: 'gates' },
					output: { hits: 2 }
				},
				{ type: 'text', text: 'Second part of the answer.' }
			]
		},
		{ id: 'u2', role: 'user', content: 'Thanks' },
		{ id: 'a2', role: 'assistant', content: 'Any time.' }
	];
	const rows = () =>
		[...document.querySelectorAll<HTMLElement>('[data-slot="ai-thread-item"]')].sort(
			(a, b) => Number(a.dataset.index) - Number(b.dataset.index)
		);
	const contentRect = (row: HTMLElement) =>
		row.querySelector('[data-slot="ai-thread-item-content"]')!.getBoundingClientRect();

	test('rows of a turn share one gap and turns are a larger fixed gap apart', async () => {
		await render(Harness, { props: { messages: turns, height: 560 } });
		await expect.poll(() => rows().length).toBe(8);
		expect(rows().map((row) => row.dataset.kind)).toEqual([
			'message',
			'reasoning',
			'message',
			'tool-group',
			'message',
			'actions',
			'message',
			'message'
		]);
		const [user, reasoning, first, tools, second, , nextUser] = rows();
		const gap = (a: HTMLElement, b: HTMLElement) => contentRect(b).top - contentRect(a).bottom;
		const inTurn = [gap(reasoning!, first!), gap(first!, tools!), gap(tools!, second!)];
		// Rows sit on whole-pixel offsets, so allow a subpixel of rounding.
		expect(Math.max(...inTurn) - Math.min(...inTurn)).toBeLessThan(1.5);
		const betweenTurns = [gap(user!, reasoning!), gap(rows()[5]!, nextUser!)];
		expect(Math.abs(betweenTurns[0]! - betweenTurns[1]!)).toBeLessThan(1.5);
		expect(betweenTurns[0]!).toBeGreaterThan(inTurn[0]! + 4);
	});

	test('hovering any row of an earlier turn reveals that turn’s action bar', async () => {
		await render(Harness, { props: { messages: turns, height: 560 } });
		await expect.poll(() => rows().length).toBe(8);
		const bar = () =>
			rows()
				.find((row) => row.dataset.kind === 'actions')!
				.querySelector<HTMLElement>('[data-slot="ai-message-actions"]')!;
		await userEvent.unhover(rows()[0]!);
		await expect.poll(() => getComputedStyle(bar()).opacity).toBe('0');

		await userEvent.hover(rows()[2]!.querySelector('p')!);
		await expect.poll(() => getComputedStyle(bar()).opacity).toBe('1');

		await userEvent.hover(rows()[6]!.querySelector('p')!);
		await expect.poll(() => getComputedStyle(bar()).opacity).toBe('0');
	});

	test('a trailing system notice keeps the follow-ups and the latest bar', async () => {
		await render(Harness, {
			props: {
				messages: [
					{ id: 'u', role: 'user', content: 'hi' },
					{ id: 'a', role: 'assistant', content: 'Hello there.' },
					{ id: 's', role: 'system', content: 'Model switched' }
				],
				suggestions: ['Tell me more']
			}
		});
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-follow-ups"]')?.textContent)
			.toContain('Tell me more');
		const assistant = document.querySelector<HTMLElement>('[data-from="assistant"]')!;
		expect(assistant.dataset.actionsVisibility).toBe('always');
	});
});
