// The assembled chat: centred column, inline error with retry, empty state and skeleton layout.
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import type { AIThreadItem } from '../AIThread/aiThread.props.js';
import Harness from './AIChatHarness.test.svelte';

const turn: AIThreadItem[] = [
	{ id: 'u', role: 'user', content: 'Draft the release notes.' },
	{ id: 'a', role: 'assistant', content: 'Here are the release notes for the beta.' }
];
const chat = () => document.querySelector<HTMLElement>('[data-slot="ai-chat"]')!;
const rect = (selector: string) =>
	document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();

describe('AIChat', () => {
	test('transcript and composer share one centred 48rem column', async () => {
		await render(Harness, { props: { messages: turn } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-item-content"]'))
			.not.toBeNull();
		expect(chat().style.getPropertyValue('--ai-chat-content-width')).toBe('48rem');
		const content = rect('[data-slot="ai-thread-item-content"]');
		const container = rect('[data-testid="container"]');
		const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
		expect(Math.round(content.width)).toBe(48 * rem);
		expect(
			Math.abs(content.left + content.width / 2 - (container.left + container.width / 2))
		).toBeLessThan(2);
		// The assistant reply is flat prose and the user bubble is the neutral grey one.
		expect(document.querySelector('[data-from="assistant"]')?.getAttribute('data-variant')).toBe(
			'minimal'
		);
		expect(document.querySelector('[data-from="user"]')?.getAttribute('data-color')).toBe(
			'neutral'
		);
	});

	test('a number content width is pixels; none spans the chat', async () => {
		const screen = await render(Harness, { props: { messages: turn, contentWidth: 600 } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-item-content"]'))
			.not.toBeNull();
		expect(Math.round(rect('[data-slot="ai-thread-item-content"]').width)).toBe(600);
		await screen.rerender({ contentWidth: 'none' });
		await expect
			.poll(() => Math.round(rect('[data-slot="ai-thread-item-content"]').width))
			.toBeGreaterThan(800);
	});

	test.each(['compact', 'normal', 'comfortable'] as const)(
		'below the column width, rows and the composer card share their edges (%s)',
		async (density) => {
			await render(Harness, { props: { messages: turn, contentWidth: 'none', density } });
			await expect
				.poll(() => document.querySelector('[data-slot="ai-chat-composer"] > *'))
				.not.toBeNull();
			const row = rect('[data-slot="ai-thread-item-content"]');
			const card = rect('[data-slot="ai-chat-composer"] > *');
			expect(Math.abs(row.left - card.left)).toBeLessThan(0.5);
			expect(Math.abs(row.right - card.right)).toBeLessThan(0.5);
		}
	);

	test('an error shows at the failed turn with a Retry wired to the conversation', async () => {
		const onRetry = vi.fn();
		await render(Harness, {
			props: { messages: [turn[0]!], error: new Error('Provider down'), onRetry }
		});
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-error"]')?.textContent)
			.toContain('Provider down');
		expect(document.querySelector('[data-slot="ai-chat-error"]')).toBeNull();
		expect(document.querySelector('[data-slot="ai-thread-empty"]')).toBeNull();
		document.querySelector<HTMLElement>('[data-slot="ai-thread-error-retry"]')!.click();
		expect(onRetry).toHaveBeenCalledOnce();
		expect(onRetry.mock.calls[0]![0]).toMatchObject({ target: { index: 0 } });
		// Retry clears the error.
		await expect.poll(() => document.querySelector('[data-slot="ai-thread-error"]')).toBeNull();
	});

	test('an empty chat with an error shows the error, not the greeting', async () => {
		await render(Harness, { props: { error: new Error('Provider down') } });
		await expect.poll(() => document.querySelector('[data-slot="ai-thread-error"]')).not.toBeNull();
		expect(document.querySelector('[data-slot="ai-thread-empty"]')).toBeNull();
	});

	test('a custom error region keeps its place above the transcript', async () => {
		await render(Harness, {
			props: { messages: turn, error: new Error('Provider down'), customErrorRegion: true }
		});
		await expect.poll(() => document.querySelector('[data-testid="custom-error"]')).not.toBeNull();
		expect(document.querySelector('[data-slot="ai-thread-error"]')).toBeNull();
	});

	test('the empty state centres a greeting with wrapping suggestion chips', async () => {
		await render(Harness, { props: { suggestions: ['Add owners', 'List launch risks'] } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-greeting"]'))
			.not.toBeNull();
		const greeting = rect('[data-slot="ai-thread-greeting"]');
		const viewport = rect('[data-slot="ai-thread-viewport"]');
		const middle = viewport.top + viewport.height / 2;
		expect(greeting.top).toBeGreaterThan(viewport.top + 60);
		expect(Math.abs(greeting.bottom - middle)).toBeLessThan(viewport.height / 3);
		expect(
			document.querySelectorAll('[data-slot="ai-thread-empty-suggestions"] button')
		).toHaveLength(2);
	});

	test('follow-up suggestions sit above the composer after the reply', async () => {
		await render(Harness, { props: { messages: turn, suggestions: ['Add owners'] } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-thread-follow-ups"]'))
			.not.toBeNull();
		expect(rect('[data-slot="ai-thread-follow-ups"]').bottom).toBeLessThanOrEqual(
			rect('[data-slot="ai-chat-composer"]').top + 1
		);
	});

	test('on a phone the follow-ups stay one scrollable row instead of wrapping', async () => {
		await render(Harness, {
			props: {
				messages: turn,
				width: 390,
				suggestions: ['Add owners', 'Identify launch risks', 'Draft release notes']
			}
		});
		await expect
			.poll(() => document.querySelectorAll('[data-slot="ai-thread-follow-ups"] button').length)
			.toBe(3);
		const chips = [
			...document.querySelectorAll<HTMLElement>('[data-slot="ai-thread-follow-ups"] button')
		].map((chip) => chip.getBoundingClientRect());
		expect(new Set(chips.map((chip) => Math.round(chip.top))).size).toBe(1);
		const row = rect('[data-slot="ai-thread-follow-ups"]');
		expect(row.height).toBeLessThan(chips[0]!.height * 2);
		expect(row.right).toBeLessThanOrEqual(rect('[data-testid="container"]').right);
		// The first chip keeps the transcript rows' inline edge.
		expect(
			Math.abs(chips[0]!.left - rect('[data-slot="ai-thread-item-content"]').left)
		).toBeLessThan(0.5);
	});

	test('the composer band has no rule above it', async () => {
		await render(Harness, { props: { messages: turn } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-chat-composer"]'))
			.not.toBeNull();
		expect(
			getComputedStyle(document.querySelector('[data-slot="ai-chat-composer"]')!).borderTopWidth
		).toBe('0px');
	});

	test('the skeleton mirrors the chat: no avatars, user bubbles, a bordered composer card', async () => {
		await render(Harness, { props: { scenario: 'skeleton' } });
		await expect
			.poll(() => document.querySelector('[data-slot="ai-chat-skeleton"]'))
			.not.toBeNull();
		expect(document.querySelector('[data-slot="ai-chat-skeleton"] .rounded-full')).toBeNull();
		expect(document.querySelectorAll('[data-slot="ai-chat-skeleton-user"]').length).toBeGreaterThan(
			0
		);
		const card = document.querySelector<HTMLElement>(
			'[data-slot="ai-chat-skeleton-composer"] > div'
		)!;
		expect(getComputedStyle(card).borderTopWidth).not.toBe('0px');
		expect(getComputedStyle(card).borderTopLeftRadius).not.toBe('0px');
	});
});
