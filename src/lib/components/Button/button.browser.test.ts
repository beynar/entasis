// Button pointer behaviour in real engines (Chromium and WebKit): a press on a loading or
// focusable-disabled button lands on the button, so keyboard focus is not dropped to <body>.
import { afterEach, expect, test, vi } from 'vitest';
import type { Component } from 'svelte';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { engine, tab } from '$lib/testing/browser.test-helper.js';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import Button from './Button.svelte';

const mount = (props: Record<string, unknown>) =>
	render(ThemeProviderHarness, {
		props: { component: Button as unknown as Component<Record<string, unknown>>, ...props }
	});
/** The element each click lands on, seen before the button's own listeners cancel it. */
const clickTargets = () => {
	const targets: EventTarget[] = [];
	const record = (event: Event) => targets.push(event.target!);
	document.addEventListener('click', record, true);
	cleanups.push(() => document.removeEventListener('click', record, true));
	return targets;
};
const cleanups: (() => void)[] = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));
const inside = (targets: EventTarget[]) => targets.map((target) => save().contains(target as Node));
const save = () => page.getByRole('button', { name: 'Save' }).element() as HTMLElement;

test('a second click on a loading button does not fall through and keeps focus on it', async () => {
	const onclick = vi.fn();
	await mount({ children: 'Save', loading: true, onclick });
	save().focus();
	expect(document.activeElement).toBe(save());
	const targets = clickTargets();

	await userEvent.click(save(), { force: true });
	await userEvent.click(save(), { force: true });

	// Both clicks land on the button. With `pointer-events: none` they fell through to the page
	// beneath, and focus dropped to <body>. (WebKit never focuses a button on click, so its focus
	// is checked through the click target alone.)
	expect(inside(targets)).toEqual([true, true]);
	if (engine === 'chromium') expect(document.activeElement).toBe(save());
	expect(onclick).not.toHaveBeenCalled();
});

test('a click on a focusable disabled button keeps focus on it and does nothing', async () => {
	const onclick = vi.fn();
	await mount({ children: 'Save', disabled: true, focusableWhenDisabled: true, onclick });
	save().focus();
	const targets = clickTargets();

	await userEvent.click(save(), { force: true });

	expect(inside(targets)).toEqual([true]);
	if (engine === 'chromium') expect(document.activeElement).toBe(save());
	expect(onclick).not.toHaveBeenCalled();
});

test('Tab reaches a focusable disabled button but skips a natively disabled one', async () => {
	await mount({ children: 'Save', disabled: true, focusableWhenDisabled: true });
	document.body.prepend(Object.assign(document.createElement('button'), { textContent: 'Before' }));
	(document.body.firstElementChild as HTMLElement).focus();
	await tab();
	expect(document.activeElement).toBe(save());
});

test('Tab skips a natively disabled button', async () => {
	await mount({ children: 'Save', disabled: true });
	const before = Object.assign(document.createElement('button'), { textContent: 'Before' });
	document.body.prepend(before);
	before.focus();
	await tab();
	expect(document.activeElement).not.toBe(save());
});
