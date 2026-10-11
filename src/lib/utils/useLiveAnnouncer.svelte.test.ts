import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LiveRegionsListHarness from './LiveRegionsListHarness.test.svelte';
import { useLiveAnnouncer, useLiveRegions } from './useLiveAnnouncer.svelte.js';

const flush = () => new Promise<void>((resolve) => queueMicrotask(() => resolve()));

describe('useLiveAnnouncer', () => {
	it('derives the region id from the instance id', () => {
		expect(useLiveAnnouncer('cal-1', 'status').regionId).toBe('cal-1-status');
		expect(useLiveAnnouncer('gantt-1').regionId).toBe('gantt-1-live');
	});

	it('blanks the region first so a repeated message is re-announced', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('Moved to Monday');
		await flush();
		expect(announcer.message).toBe('Moved to Monday');

		announcer.announce('Moved to Monday');
		expect(announcer.message).toBe('');
		await flush();
		expect(announcer.message).toBe('Moved to Monday');
	});

	it('keeps only the last of a burst', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('first');
		announcer.announce('second');
		announcer.announce('third');
		await flush();
		expect(announcer.message).toBe('third');
	});

	it('drops a pending announcement after reset', async () => {
		const announcer = useLiveAnnouncer('x');
		announcer.announce('too late');
		announcer.reset();
		await flush();
		expect(announcer.message).toBe('');
	});
});

describe('useLiveAnnouncer politeness', () => {
	it('describes a polite status region by default and an assertive alert region on request', () => {
		expect(useLiveAnnouncer('x').regionAttrs).toEqual({
			id: 'x-live',
			role: 'status',
			'aria-live': 'polite',
			'aria-atomic': 'true'
		});
		expect(useLiveAnnouncer('x', 'urgent', { politeness: 'assertive' }).regionAttrs).toEqual({
			id: 'x-urgent',
			role: 'alert',
			'aria-live': 'assertive',
			'aria-atomic': 'true'
		});
	});
});

describe('useLiveRegions', () => {
	let cleanups: (() => void)[] = [];
	afterEach(() => {
		cleanups.forEach((cleanup) => cleanup());
		cleanups = [];
		document.body.replaceChildren();
		vi.useRealTimers();
	});

	const mountHost = (live: ReturnType<typeof useLiveRegions>) => {
		const host = document.createElement('section');
		document.body.append(host);
		let detach: void | (() => void);
		const destroy = $effect.root(() => {
			detach = live.host(host);
		});
		flushSync();
		cleanups.push(() => {
			detach?.();
			destroy();
		});
		return { host, unmount: () => (detach?.(), destroy()) };
	};
	const region = (host: HTMLElement, politeness: string) =>
		host.querySelector<HTMLElement>(`[data-live-region="${politeness}"]`)!;

	it('inserts both regions empty as soon as the host mounts', () => {
		const live = useLiveRegions('toaster');
		const { host } = mountHost(live);
		const polite = region(host, 'polite');
		const assertive = region(host, 'assertive');
		expect(polite).toHaveAttribute('role', 'status');
		expect(polite).toHaveAttribute('aria-live', 'polite');
		expect(polite).toHaveAttribute('aria-atomic', 'true');
		expect(polite.id).toBe('toaster-live-polite');
		expect(assertive).toHaveAttribute('role', 'alert');
		expect(assertive).toHaveAttribute('aria-live', 'assertive');
		expect(polite.textContent).toBe('');
		expect(assertive.textContent).toBe('');
		expect(polite.style.position).toBe('absolute');
		expect(polite.style.clip).toBe('rect(0px, 0px, 0px, 0px)');
	});

	it('holds a message until the regions have settled, then writes it', async () => {
		vi.useFakeTimers();
		const live = useLiveRegions('toaster', 'live', { settleDelay: 100, clearAfter: 0 });
		const { host } = mountHost(live);
		live.announce('Saved');
		await vi.advanceTimersByTimeAsync(0);
		flushSync();
		expect(region(host, 'polite').textContent).toBe('');
		await vi.advanceTimersByTimeAsync(100);
		flushSync();
		expect(region(host, 'polite').textContent).toBe('Saved');
	});

	it('routes assertive messages to the alert region and clears them later', async () => {
		vi.useFakeTimers();
		const live = useLiveRegions('toaster', 'live', { settleDelay: 0, clearAfter: 5000 });
		const { host } = mountHost(live);
		live.announce('Connection lost', 'assertive');
		await vi.advanceTimersByTimeAsync(0);
		flushSync();
		expect(region(host, 'assertive').textContent).toBe('Connection lost');
		expect(region(host, 'polite').textContent).toBe('');
		await vi.advanceTimersByTimeAsync(4999);
		flushSync();
		expect(region(host, 'assertive').textContent).toBe('Connection lost');
		await vi.advanceTimersByTimeAsync(1);
		flushSync();
		expect(region(host, 'assertive').textContent).toBe('');
	});

	it('a newer message restarts the clear delay', async () => {
		vi.useFakeTimers();
		const live = useLiveRegions('toaster', 'live', { settleDelay: 0, clearAfter: 1000 });
		const { host } = mountHost(live);
		live.announce('First');
		await vi.advanceTimersByTimeAsync(800);
		live.announce('Second');
		await vi.advanceTimersByTimeAsync(800);
		flushSync();
		expect(region(host, 'polite').textContent).toBe('Second');
		await vi.advanceTimersByTimeAsync(200);
		flushSync();
		expect(region(host, 'polite').textContent).toBe('');
	});

	it('keeps the regions when Svelte empties a host whose only child is a list', async () => {
		const { component, rerender } = render(LiveRegionsListHarness, { items: ['a', 'b'] });
		const host = screen.getByTestId('host');
		expect(host.querySelectorAll('[data-live-region]')).toHaveLength(2);

		component.announce('2 results');
		await flush();
		flushSync();
		expect(region(host, 'polite').textContent).toBe('2 results');

		await rerender({ items: [] });
		await flush();
		expect(host.querySelectorAll('li')).toHaveLength(0);
		expect(host.querySelectorAll('[data-live-region]')).toHaveLength(2);
		expect(region(host, 'polite').textContent).toBe('2 results');

		component.announce('No results');
		await flush();
		flushSync();
		expect(region(host, 'polite').isConnected).toBe(true);
		expect(region(host, 'polite').textContent).toBe('No results');

		// The list renders again ahead of the regions.
		await rerender({ items: ['c'] });
		expect(host.querySelectorAll('li')).toHaveLength(1);
		expect(host.querySelectorAll('[data-live-region]')).toHaveLength(2);
	});

	it('removes the regions with the host', () => {
		const live = useLiveRegions('toaster');
		const { host, unmount } = mountHost(live);
		unmount();
		expect(host.querySelector('[data-live-region]')).toBeNull();
	});
});
