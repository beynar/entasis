// The trigger width needs real layout: the live count must not push the chevron as it grows.
import type { Component } from 'svelte';
import { flushSync } from 'svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import AIReasoning from './AIReasoning.svelte';

afterEach(() => {
	vi.useRealTimers();
});

test('the trigger keeps its width when the elapsed count gains a digit', async () => {
	vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
	render(ThemeProviderHarness, {
		props: {
			component: AIReasoning as unknown as Component<Record<string, unknown>>,
			content: 'Plan',
			streaming: true
		}
	});
	const trigger = () => document.querySelector<HTMLElement>('button')!;
	// The visible count is the last child; the first is the invisible widest reading.
	const count = () =>
		document.querySelector('[data-slot="ai-reasoning-elapsed"]')?.lastElementChild?.textContent;
	vi.advanceTimersByTime(9_000);
	flushSync();
	expect(count()).toBe('· 9s');
	const atNine = trigger().getBoundingClientRect().width;
	vi.advanceTimersByTime(1_000);
	flushSync();
	expect(count()).toBe('· 10s');
	expect(trigger().getBoundingClientRect().width).toBe(atNine);
	vi.advanceTimersByTime(49_000);
	flushSync();
	expect(trigger().getBoundingClientRect().width).toBe(atNine);
});

test('the default trigger is compact: about 28px tall, never below a 24px pointer target', async () => {
	render(ThemeProviderHarness, {
		props: {
			component: AIReasoning as unknown as Component<Record<string, unknown>>,
			content: 'Plan',
			duration: 4
		}
	});
	const trigger = document.querySelector<HTMLElement>('[data-slot="ai-reasoning"] button')!;
	const { height } = trigger.getBoundingClientRect();
	expect(height).toBeGreaterThanOrEqual(24);
	expect(height).toBeLessThanOrEqual(30);
});
