// Tab order for a portaled popover, with real Tab presses in Chromium and WebKit: the panel sits at
// the end of <body>, so only the bridge puts it between its trigger and the controls after it.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import TabBridgeHarness from './TabBridgeHarness.test.svelte';

type Scenario = Parameters<typeof TabBridgeHarness>[1]['scenario'];
const mount = (scenario: Scenario) => render(TabBridgeHarness, { props: { scenario } });
const element = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;

/** Reach `name` with a real Tab from the button before it. */
async function tabTo(name: string, from = 'Before') {
	element(from).focus();
	await tab();
	expect(document.activeElement).toBe(element(name));
}

const panelOpen = () => !!document.querySelector('dialog[open]');

describe('portaled popover tab order (OV-14)', () => {
	test('a11y:popover.tab-into-panel Tab on the open trigger enters the panel, and Tab past its end continues after the trigger and closes it', async () => {
		mount('basic');
		await tabTo('Open popover');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('button', { name: 'First' })).toBeInTheDocument();
		// Focus stays on the trigger until the user moves: the default `focusOnOpen`.
		expect(document.activeElement).toBe(element('Open popover'));

		await tab();
		expect(document.activeElement).toBe(element('First'));
		await tab();
		expect(document.activeElement).toBe(element('Second'));
		await tab();
		expect(document.activeElement).toBe(element('After'));
		await expect.poll(panelOpen).toBe(false);
	});

	test('a11y:popover.shift-tab-to-trigger Shift+Tab on the first control returns to the trigger and keeps the popover open', async () => {
		mount('basic');
		await tabTo('Open popover');
		await userEvent.keyboard('{Enter}');
		await tab();
		expect(document.activeElement).toBe(element('First'));
		await tab({ shift: true });
		expect(document.activeElement).toBe(element('Open popover'));
		expect(panelOpen()).toBe(true);
		expect(element('Open popover').matches(':focus-visible')).toBe(true);
	});

	test('a11y:popover.no-loop with nothing after the trigger, Tab past the end does not loop back into the popover', async () => {
		mount('last');
		await tabTo('Open popover');
		await userEvent.keyboard('{Enter}');
		await tab();
		await tab();
		expect(document.activeElement).toBe(element('Second'));
		await tab();
		await nextFrame();
		// The engine moves on (to the browser or the start of the page); the bridge must not send
		// focus back to the trigger or the first control.
		expect(document.activeElement).not.toBe(element('Open popover'));
		expect(document.activeElement).not.toBe(element('First'));
		expect(document.activeElement).not.toBe(element('Second'));
	});

	test('a11y:popover.aria-owns a screen reader finds the panel straight after the trigger through aria-owns', async () => {
		mount('basic');
		await tabTo('Open popover');
		expect(document.querySelector('[aria-owns]')).toBeNull();
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('button', { name: 'First' })).toBeInTheDocument();
		const trigger = element('Open popover');
		const owner = trigger.nextElementSibling as HTMLElement;
		expect(owner.getAttribute('aria-owns')).toBe(document.querySelector('dialog[open]')!.id);
		expect(owner.textContent).toBe('');
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => document.querySelector('[aria-owns]')).toBeNull();
	});

	test('a popup that manages its own focus keeps the engine Tab order', async () => {
		mount('listbox');
		await tabTo('Open list');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('option', { name: 'Option' })).toBeInTheDocument();
		expect(document.querySelector('[aria-owns]')).toBeNull();
	});

	test('inside a modal dialog, Tab moves through the popover and on to the dialog control after it', async () => {
		mount('in-dialog');
		await expect.element(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
		element('Dialog first').focus();
		await tab();
		expect(document.activeElement).toBe(element('Open popover'));
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('button', { name: 'First' })).toBeInTheDocument();
		await tab();
		expect(document.activeElement).toBe(element('First'));
		// The dialog's own Tab trap must leave a popover panel above it alone.
		await tab();
		expect(document.activeElement).toBe(element('Second'));
		await tab();
		expect(document.activeElement).toBe(element('Dialog last'));
	});

	test('a nested popover tabs on inside the outer panel', async () => {
		mount('nested');
		await tabTo('Open outer');
		await userEvent.keyboard('{Enter}');
		await tab();
		expect(document.activeElement).toBe(element('Outer first'));
		await tab();
		expect(document.activeElement).toBe(element('Open inner'));
		await userEvent.keyboard('{Enter}');
		await tab();
		expect(document.activeElement).toBe(element('Inner first'));
		await tab();
		expect(document.activeElement).toBe(element('Outer last'));
	});

	test('an empty panel lets Tab continue after the trigger', async () => {
		mount('empty');
		await tabTo('Open popover');
		await userEvent.keyboard('{Enter}');
		await tab();
		expect(document.activeElement).toBe(element('After'));
	});
});
