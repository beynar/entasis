// The chart keeps one roving tab stop across three kinds of target (tree cells, task bars and
// dependency connectors). It re-homes that tab stop when the focused row or dependency leaves the
// model — clamping the previous index into the new list — and restores DOM focus from an
// animation frame, announcing the restore. These tests pin that observable behaviour so it can be
// verified unchanged across refactors of the focus plumbing.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import Harness from './GanttChartFocusHarness.test.svelte';

// The restore runs on a frame, so drive frames by hand instead of waiting for a real one.
let frames: (() => void)[] = [];
let originalRaf: typeof globalThis.requestAnimationFrame;
let originalCancelRaf: typeof globalThis.cancelAnimationFrame;

beforeEach(() => {
	frames = [];
	originalRaf = globalThis.requestAnimationFrame;
	originalCancelRaf = globalThis.cancelAnimationFrame;
	globalThis.requestAnimationFrame = ((frame: FrameRequestCallback) => {
		frames.push(() => frame(0));
		return frames.length;
	}) as typeof globalThis.requestAnimationFrame;
	globalThis.cancelAnimationFrame = ((handle: number) => {
		frames[handle - 1] = () => {};
	}) as typeof globalThis.cancelAnimationFrame;
});

afterEach(() => {
	globalThis.requestAnimationFrame = originalRaf;
	globalThis.cancelAnimationFrame = originalCancelRaf;
});

const runFrames = async (rounds = 4) => {
	for (let round = 0; round < rounds; round += 1) {
		const pending = frames;
		frames = [];
		for (const frame of pending) frame();
		await tick();
	}
};

const tasks = [
	{
		id: 'a',
		title: 'Alpha',
		start: new Date('2026-07-01T08:00:00.000Z'),
		end: new Date('2026-07-03T16:00:00.000Z')
	},
	{
		id: 'b',
		title: 'Bravo',
		start: new Date('2026-07-06T08:00:00.000Z'),
		end: new Date('2026-07-08T16:00:00.000Z')
	},
	{
		id: 'c',
		title: 'Charlie',
		start: new Date('2026-07-09T08:00:00.000Z'),
		end: new Date('2026-07-10T16:00:00.000Z')
	}
];

const dependencies = [
	{ id: 'a-b', fromTaskId: 'a', toTaskId: 'b', type: 'finish-start' as const },
	{ id: 'b-c', fromTaskId: 'b', toTaskId: 'c', type: 'finish-start' as const }
];

/** Every element the chart currently offers as a tab stop, as `part|id`. */
const tabStops = () =>
	[...document.querySelectorAll<HTMLElement>('[data-gantt-chart-part][tabindex]')]
		.filter((node) => node.tabIndex === 0)
		.map(
			(node) =>
				`${node.dataset.ganttChartPart}|${node.dataset.taskId ?? node.dataset.dependencyId ?? ''}`
		);

const taskBar = (taskId: string) => {
	const node = document.querySelector<HTMLElement>(
		`[data-gantt-chart-part="task"][data-task-id="${taskId}"]`
	);
	if (!node) throw new Error(`no task bar for ${taskId}`);
	return node;
};

const connector = (dependencyId: string) => {
	const node = document.querySelector<HTMLElement>(
		`[data-gantt-chart-part="connector-control"][data-dependency-id="${dependencyId}"]`
	);
	if (!node) throw new Error(`no connector for ${dependencyId}`);
	return node;
};

const activeId = () => (document.activeElement as HTMLElement).dataset.taskId ?? null;

/**
 * The live region is rewritten for every announcement (and blanked in between), so collect the
 * texts it passes through instead of reading whichever one happens to be last.
 */
const trackAnnouncements = () => {
	const region = document.querySelector<HTMLElement>('[data-gantt-chart-part="live-region"]');
	if (!region) throw new Error('no live region');
	const seen: string[] = [];
	const observer = new MutationObserver(() => {
		const text = region.textContent?.trim() ?? '';
		if (text && seen.at(-1) !== text) seen.push(text);
	});
	observer.observe(region, { characterData: true, childList: true, subtree: true });
	return seen;
};

describe('gantt chart roving focus', () => {
	test('offers no tab stop until a target is chosen', async () => {
		render(Harness, { props: { tasks: [...tasks] } });
		await tick();

		// The first-cell fallback in `isCellTabStop` is read once, before the navigation model is
		// published, and the model is not reactive — so nothing is tabbable until focus lands.
		expect(tabStops()).toEqual([]);
	});

	test('makes the focused task the only tab stop', async () => {
		render(Harness, { props: { tasks: [...tasks] } });
		await tick();

		taskBar('b').focus();
		await tick();

		expect(document.activeElement).toBe(taskBar('b'));
		expect(tabStops()).toEqual(['task|b']);
	});

	test('moves the tab stop down the rows with the arrow keys', async () => {
		render(Harness, { props: { tasks: [...tasks] } });
		await tick();
		taskBar('b').focus();
		await tick();

		await fireEvent.keyDown(taskBar('b'), { key: 'ArrowDown' });
		await tick();
		expect(activeId()).toBe('c');
		expect(tabStops()).toEqual(['task|c']);

		await fireEvent.keyDown(taskBar('c'), { key: 'ArrowUp' });
		await tick();
		expect(activeId()).toBe('b');
		expect(tabStops()).toEqual(['task|b']);
	});

	test('stops at the last row instead of wrapping', async () => {
		render(Harness, { props: { tasks: [...tasks] } });
		await tick();
		taskBar('c').focus();
		await tick();

		await fireEvent.keyDown(taskBar('c'), { key: 'ArrowDown' });
		await runFrames();

		expect(activeId()).toBe('c');
		expect(tabStops()).toEqual(['task|c']);
	});

	test('clamps focus onto the surviving neighbour when the focused row is removed', async () => {
		const view = render(Harness, { props: { tasks: [...tasks] } });
		await tick();
		taskBar('c').focus();
		await tick();
		const announcements = trackAnnouncements();

		await view.rerender({ tasks: tasks.filter((task) => task.id !== 'c') });
		await runFrames();

		expect(document.querySelector('[data-task-id="c"]')).toBeNull();
		expect(activeId()).toBe('b');
		expect(tabStops()).toEqual(['task|b']);
		expect(announcements).toContain('Focus restored to Bravo');
	});

	test('clamps focus onto the surviving neighbour when the focused dependency is removed', async () => {
		const view = render(Harness, {
			props: { tasks: [...tasks], dependencies: [...dependencies] }
		});
		await tick();
		connector('b-c').focus();
		await tick();
		expect(tabStops()).toEqual(['connector-control|b-c']);

		await view.rerender({
			tasks: [...tasks],
			dependencies: dependencies.filter((dependency) => dependency.id !== 'b-c')
		});
		await runFrames();

		expect(document.querySelector('[data-dependency-id="b-c"]')).toBeNull();
		expect(tabStops()).toEqual(['connector-control|a-b']);
		expect(document.activeElement).toBe(connector('a-b'));
	});

	test('does not focus a detached node when the chart unmounts mid-restore', async () => {
		const view = render(Harness, { props: { tasks: [...tasks] } });
		await tick();
		taskBar('c').focus();
		await tick();

		await view.rerender({ tasks: tasks.filter((task) => task.id !== 'c') });
		view.unmount();
		await expect(runFrames()).resolves.toBeUndefined();

		expect(document.activeElement).toBe(document.body);
	});
});
