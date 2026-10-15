import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';
import AIReasoning from './AIReasoning.svelte';

afterEach(() => {
	vi.useRealTimers();
});

describe('AIReasoning', () => {
	test('formats completed durations, including under a second', async () => {
		const { rerender } = renderInTheme(AIReasoning, { content: 'Plan', duration: 0 });
		expect(screen.getByRole('button')).toHaveAccessibleName('Thought for less than a second');
		expect(document.querySelector('.shimmer')).toBeNull();
		await rerender({ duration: 6 });
		expect(screen.getByRole('button')).toHaveAccessibleName('Thought for 6 seconds');
		await rerender({ duration: 72 });
		expect(screen.getByRole('button')).toHaveAccessibleName('Thought for 1m 12s');
	});

	test('shows a live elapsed time while streaming and keeps a clean accessible name', () => {
		vi.useFakeTimers({
			toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date']
		});
		renderInTheme(AIReasoning, { content: 'Plan', streaming: true });
		const elapsed = () => document.querySelector('[data-slot="ai-reasoning-elapsed"]');
		expect(elapsed()).toBeNull();
		vi.advanceTimersByTime(6_000);
		flushSync();
		expect(elapsed()).toHaveTextContent('· 6s');
		expect(screen.getByRole('button')).toHaveAccessibleName('Thinking…');
	});

	test('a11y:ai-reasoning.accessible-name stacks cycled labels in one cell and names only the current one', () => {
		vi.useFakeTimers({
			toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date']
		});
		renderInTheme(AIReasoning, {
			content: 'Plan',
			streaming: true,
			thinkingMessages: ['Planning', 'Checking constraints']
		});
		const status = document.querySelector('[data-slot="ai-reasoning-status"]') as HTMLElement;
		expect(status.children).toHaveLength(2);
		expect(screen.getByRole('button')).toHaveAccessibleName('Planning');
		vi.advanceTimersByTime(2_000);
		flushSync();
		expect(status.children).toHaveLength(2);
		expect(screen.getByRole('button')).toHaveAccessibleName('Checking constraints');
		expect(status.children[0]).toHaveAttribute('aria-hidden', 'true');
	});

	test('bounds the streaming body to a window that follows the latest lines', async () => {
		const { rerender } = renderInTheme(AIReasoning, {
			content: 'Plan',
			streaming: true,
			autoCloseDelay: 60_000
		});
		const stream = document.querySelector('[data-slot="ai-reasoning-stream"]');
		expect(stream?.className).toContain('justify-end');
		expect(stream?.className).toContain('overflow-hidden');
		await rerender({ streaming: false });
		expect(document.querySelector('[data-slot="ai-reasoning-stream"]')).toBeNull();
		expect(screen.getByText('Plan')).toBeInTheDocument();
	});

	test('reads quieter than the answer and leaves spacing to the thread', () => {
		renderInTheme(AIReasoning, { content: 'Plan', duration: 3, defaultOpen: true });
		const root = document.querySelector('[data-slot="ai-reasoning"]');
		expect(root?.className).not.toContain('mb-xl');
		const paragraph = screen.getByText('Plan');
		const markdown = paragraph.closest('.text-sm');
		expect(markdown).not.toBeNull();
		// Markdown paints its paragraphs `text-neutral`; reasoning makes them inherit its muted colour.
		const content = document.querySelector(
			'[data-slot="ai-reasoning"] .text-neutral\\/70.border-s'
		);
		expect(content?.className).toContain('[&_:is(p,');
	});
});
