// Removing a control that has focus. Chromium sends blur and focusout while the block removing it
// is running, where Svelte refuses state writes, and an uncaught error reaches the page.
//
// An app without `experimental.async` removes a branch inside its block. This repository compiles
// with it on, which defers the removal, so the harness also removes the control from inside a
// reaction: that fails the same way in either mode.
import { afterEach, beforeEach, expect, test } from 'vitest';
import { page, server } from 'vitest/browser';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import FieldUnmountHarness from './FieldUnmountHarness.test.svelte';

const errors: string[] = [];
const onError = (event: ErrorEvent) => {
	errors.push(event.message);
	event.preventDefault();
};
beforeEach(() => {
	errors.length = 0;
	window.addEventListener('error', onError);
});
afterEach(() => window.removeEventListener('error', onError));

const FOCUSABLE = 'input:not([type=hidden]), textarea, [contenteditable=true], button, [tabindex]';

const KINDS = [
	'text',
	'number',
	'combobox',
	'autocomplete',
	'select',
	'textarea',
	'password',
	'date',
	'time',
	'color',
	'tags',
	'voice',
	'rich',
	'form'
];

const focusControl = async (kind: string) => {
	await render(FieldUnmountHarness, { props: { kind } });
	const host = page.getByTestId('host').element() as HTMLElement;
	await expect.poll(() => host.querySelector(FOCUSABLE), { timeout: 5000 }).toBeTruthy();
	const control = host.querySelector<HTMLElement>(FOCUSABLE)!;
	control.focus();
	expect(document.activeElement).toBe(control);
	if (kind !== 'form') await expect.element(page.getByTestId('focused')).toHaveTextContent('true');
	return { host, control };
};

const settle = async () => {
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 20));
};

test.each(KINDS)('a block removing a focused %s throws nothing', async (kind) => {
	const { host } = await focusControl(kind);
	(page.getByTestId('hide').element() as HTMLElement).click();
	await settle();
	expect(host.querySelector(FOCUSABLE)).toBeNull();
	expect(errors).toEqual([]);
	await expect.element(page.getByTestId('focused')).toHaveTextContent('false');
});

test.each(KINDS)('a focused %s leaving during a reaction throws nothing', async (kind) => {
	const { control } = await focusControl(kind);
	(page.getByTestId('remove-in-reaction').element() as HTMLElement).click();
	await settle();
	expect(control.isConnected).toBe(false);
	expect(errors).toEqual([]);
	// WebKit tells nothing of a node removed by hand: no blur, and no effect to notice it.
	if (server.browser === 'webkit') return;
	await expect.element(page.getByTestId('focused')).toHaveTextContent('false');
});
