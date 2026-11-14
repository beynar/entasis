// Grid-mode keys in real engines (Chromium and WebKit): the document jump uses the platform's
// modifier, ArrowLeft and ArrowRight follow the writing direction, and Alt with an arrow stays
// a browser shortcut.
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableGridKeysHarness.test.svelte';

const cell = (row: number, column: number) =>
	document.querySelector<HTMLElement>(`[data-grid-row="${row}"] [data-grid-column="${column}"]`)!;

/** `[row, column]` of the focused cell. */
const focused = () => {
	const active = document.activeElement as HTMLElement | null;
	const row = active?.closest<HTMLElement>('[data-grid-row]')?.dataset.gridRow;
	return [Number(row), Number(active?.dataset.gridColumn)];
};

/** Dispatches a keydown on the cell; returns whether the table cancelled it. */
const press = (target: HTMLElement, key: string, modifiers: KeyboardEventInit = {}) =>
	!target.dispatchEvent(
		new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers })
	);

const mount = async (dir: 'ltr' | 'rtl' = 'ltr') => {
	await render(Harness, { dir });
	await expect.poll(() => cell(0, 0)).not.toBeNull();
	cell(1, 1).focus();
	await expect.poll(focused).toEqual([1, 1]);
};

// Each test sets the platform it runs on: the engines report the host's.
const stubbed: string[] = [];
const onPlatform = (platform: string) => {
	for (const [name, value] of [
		['platform', platform],
		['userAgentData', { platform }]
	] as const) {
		Object.defineProperty(navigator, name, { configurable: true, get: () => value });
		stubbed.push(name);
	}
};
afterEach(() => {
	for (const name of stubbed.splice(0)) Reflect.deleteProperty(navigator, name);
});

describe('document jump', () => {
	test('Command+End and Command+Home reach the last and first row on Apple platforms', async () => {
		onPlatform('macOS');
		await mount();
		press(cell(1, 1), 'End', { metaKey: true });
		await expect.poll(focused).toEqual([3, 2]);
		press(cell(3, 2), 'Home', { metaKey: true });
		await expect.poll(focused).toEqual([0, 0]);
	});

	test('elsewhere Meta is the system key: Meta+End stays on the row, Control+End jumps', async () => {
		onPlatform('Windows');
		await mount();
		press(cell(1, 1), 'End', { metaKey: true });
		await expect.poll(focused).toEqual([1, 2]);
		press(cell(1, 2), 'End', { ctrlKey: true });
		await expect.poll(focused).toEqual([3, 2]);
	});
});

describe('writing direction', () => {
	test('ArrowLeft moves to the next column in right-to-left text', async () => {
		await mount('rtl');
		press(cell(1, 1), 'ArrowLeft');
		await expect.poll(focused).toEqual([1, 2]);
		press(cell(1, 2), 'ArrowRight');
		await expect.poll(focused).toEqual([1, 1]);
	});

	test('ArrowRight moves to the next column in left-to-right text', async () => {
		await mount('ltr');
		press(cell(1, 1), 'ArrowRight');
		await expect.poll(focused).toEqual([1, 2]);
	});
});

test('Alt with an arrow is left to the browser', async () => {
	await mount();
	for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
		expect(press(cell(1, 1), key, { altKey: true })).toBe(false);
	}
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	expect(focused()).toEqual([1, 1]);
});
