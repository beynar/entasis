// Popovers in real browsers (Chromium and WebKit): Tab order of the pickers that hold dialog
// content (OV-14b audit), the modal popover (OV-18b) and the arrow (POP-2).
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import PopoverBrowserHarness from './PopoverBrowserHarness.test.svelte';

type Scenario = Parameters<typeof PopoverBrowserHarness>[1]['scenario'];
const mount = (scenario: Scenario) => render(PopoverBrowserHarness, { props: { scenario } });
const element = (name: string | RegExp) =>
	page.getByRole('button', { name }).element() as HTMLElement;
// The tooltip a focused trigger shows is a popover too: only a dialog without one is the panel.
const panel = () =>
	[...document.querySelectorAll<HTMLElement>('dialog[open]')].find(
		(dialog) => !dialog.querySelector('[role="tooltip"]')
	) ?? null;
const panelOpen = () => !!panel();
const insidePanel = () => !!panel()?.contains(document.activeElement);

describe('pickers that hold dialog content (OV-14b audit)', () => {
	test('DateSelector: Tab on the open trigger enters the calendar, Shift+Tab returns, Tab past it moves on', async () => {
		mount('date-selector');
		const trigger = element(/choose dates/i);
		element('Before').focus();
		await tab();
		expect(document.activeElement).toBe(trigger);
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		// Named: the dialog announces what it is.
		expect(panel()?.getAttribute('aria-label')).toBe('Choose dates');
		expect(document.activeElement).toBe(trigger);

		await tab();
		expect(insidePanel()).toBe(true);
		await tab({ shift: true });
		expect(document.activeElement).toBe(trigger);
		expect(panelOpen()).toBe(true);

		await tab();
		expect(insidePanel()).toBe(true);
		for (let step = 0; step < 60 && insidePanel(); step += 1) await tab();
		expect(document.activeElement).toBe(element('After'));
		await expect.poll(panelOpen).toBe(false);
	});

	test('ColorInput: the swatch button bridges Tab into the picker, the text field moves on to the next control', async () => {
		mount('color-input');
		const swatch = element(/choose color/i);
		element('Before').focus();
		await tab();
		expect(document.activeElement).toBe(swatch);
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		expect(panel()?.getAttribute('aria-label')).toMatch(/color/i);
		await tab();
		expect(insidePanel()).toBe(true);
		await tab({ shift: true });
		expect(document.activeElement).toBe(swatch);
		await userEvent.keyboard('{Escape}');
		await expect.poll(panelOpen).toBe(false);

		// The text field opens the picker on focus; Tab leaves it for the next control and the
		// picker closes behind it instead of staying open over the page.
		const input = page.getByRole('textbox').element() as HTMLElement;
		input.focus();
		await expect.poll(panelOpen).toBe(true);
		await tab();
		expect(insidePanel()).toBe(false);
		expect(document.activeElement).toBe(element('After'));
		await expect.poll(panelOpen).toBe(false);
	});

	test('MediaVolume: Tab on the open trigger reaches the slider in the panel', async () => {
		mount('media-volume');
		const trigger = element(/volume/i);
		element('Before').focus();
		await tab();
		expect(document.activeElement).toBe(trigger);
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		expect(panel()?.getAttribute('aria-label')).toBe('Volume');
		await tab();
		expect(insidePanel()).toBe(true);
		await tab({ shift: true });
		expect(document.activeElement).toBe(trigger);
	});
});

describe('modal popover (OV-18b)', () => {
	test('Tab cycles inside the panel, the page behind is inert, Escape returns focus to the trigger', async () => {
		mount('modal');
		element('Before').focus();
		await tab();
		const trigger = element('Open modal');
		expect(document.activeElement).toBe(trigger);
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		await expect.poll(() => document.activeElement).toBe(element('First'));

		await tab();
		expect(document.activeElement).toBe(element('Second'));
		await tab();
		// The hidden close button is out of the Tab order, so Tab wraps to the first control.
		expect(document.activeElement).toBe(element('First'));
		await tab({ shift: true });
		expect(document.activeElement).toBe(element('Second'));
		// Off the control that carries a tooltip: Escape would close the tooltip, the top layer, first.
		await tab();
		expect(document.activeElement).toBe(element('First'));

		// Nothing behind the panel takes focus or clicks.
		expect(trigger.closest('[inert]')).not.toBeNull();
		expect(element('After').closest('[inert]')).not.toBeNull();

		await userEvent.keyboard('{Escape}');
		await expect.poll(panelOpen).toBe(false);
		expect(document.activeElement).toBe(trigger);
		expect(trigger.matches(':focus-visible')).toBe(true);
		expect(document.querySelector('[inert]')).toBeNull();
	});

	test('a tooltip over a control in the panel does not release the page or the Tab trap', async () => {
		mount('modal');
		element('Before').focus();
		await tab();
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		await tab();
		expect(document.activeElement).toBe(element('Second'));
		// Keyboard focus shows the tooltip: another layer is open above the panel.
		await expect.poll(() => document.querySelector('[role="tooltip"]')).not.toBeNull();
		expect(element('Before').closest('[inert]')).not.toBeNull();
		await tab();
		expect(document.activeElement).toBe(element('First'));
		expect(insidePanel()).toBe(true);
	});

	test('the tooltip over a control in the panel is not made inert, focused or hovered', async () => {
		mount('modal');
		element('Before').focus();
		await tab();
		await userEvent.keyboard('{Enter}');
		await expect.poll(panelOpen).toBe(true);
		await tab();
		await expect.poll(() => document.querySelector('[role="tooltip"]')).not.toBeNull();
		await nextFrame();
		expect(document.querySelector('[role="tooltip"]')!.closest('[inert]')).toBeNull();
	});

	test('the tooltip a hovered control in the panel shows is not made inert either', async () => {
		mount('modal');
		await userEvent.click(element('Open modal'));
		await expect.poll(panelOpen).toBe(true);
		await userEvent.hover(element('Second'));
		await expect
			.poll(() => document.querySelector('[role="tooltip"]'), { timeout: 4000 })
			.not.toBeNull();
		await nextFrame();
		expect(document.querySelector('[role="tooltip"]')!.closest('[inert]')).toBeNull();
	});
});

describe('a modal Dialog opened from the panel', () => {
	test('the popover stays open underneath it, and focus returns to the control that opened it', async () => {
		mount('dialog');
		await userEvent.click(element('Open'));
		await expect.poll(panelOpen).toBe(true);
		await userEvent.click(element('Edit'));
		await expect.poll(() => document.activeElement?.textContent?.trim()).toBe('Save');
		// Focus left the panel for the Dialog: the popover waits, its control is still there.
		await nextFrame();
		await nextFrame();
		expect(page.getByRole('button', { name: 'Edit', includeHidden: true }).elements().length).toBe(
			1
		);

		await userEvent.keyboard('{Escape}');
		await expect.poll(() => document.activeElement?.textContent?.trim()).toBe('Edit');
		expect(page.getByRole('button', { name: 'Edit', includeHidden: true }).elements().length).toBe(
			1
		);
	});
});

describe('arrow (POP-2)', () => {
	test('the arrow sits on the panel edge facing the trigger, centred on it', async () => {
		mount('arrow');
		await userEvent.click(element('Open'));
		await expect.poll(panelOpen).toBe(true);
		await nextFrame();
		const trigger = element('Open').getBoundingClientRect();
		const popup = panel()!.firstElementChild as HTMLElement;
		const arrow = popup.querySelector<HTMLElement>('[data-side][aria-hidden="true"]')!;
		await expect.poll(() => arrow.getAttribute('data-side')).toBe('bottom');
		const box = popup.getBoundingClientRect();
		const tip = arrow.getBoundingClientRect();
		// A panel below the trigger: the arrow is on its top edge, half of it poking out.
		const centerY = tip.top + tip.height / 2;
		expect(Math.abs(centerY - box.top)).toBeLessThan(2);
		// Centred under the trigger.
		const triggerCenter = trigger.left + trigger.width / 2;
		expect(Math.abs(tip.left + tip.width / 2 - triggerCenter)).toBeLessThan(2);
		expect(arrow.hasAttribute('data-uncentered')).toBe(false);
		expect(getComputedStyle(arrow).backgroundColor).toBe(getComputedStyle(popup).backgroundColor);
	});

	test('when the panel shifts to fit, the arrow stays under the trigger and reports it', async () => {
		mount('arrow-edge');
		await userEvent.click(element('E'));
		await expect.poll(panelOpen).toBe(true);
		const popup = panel()!.firstElementChild as HTMLElement;
		const arrow = popup.querySelector<HTMLElement>('[data-side][aria-hidden="true"]')!;
		await expect.poll(() => arrow.getAttribute('data-side')).toBe('bottom');
		const trigger = element('E').getBoundingClientRect();
		const triggerCenter = trigger.left + trigger.width / 2;
		const box = popup.getBoundingClientRect();
		const tip = arrow.getBoundingClientRect();
		// The panel is wider than the room left of the trigger, so it slid right to fit.
		expect(box.left).toBeGreaterThan(trigger.left + 4);
		expect(arrow.hasAttribute('data-uncentered')).toBe(true);
		// The arrow follows the trigger as far as the panel's corner allows: 10px in from the edge.
		const arrowCenter = tip.left + tip.width / 2;
		expect(arrowCenter).toBeGreaterThan(box.left + 10);
		expect(Math.abs(arrowCenter - (box.left + 15))).toBeLessThan(2);
		expect(arrowCenter - triggerCenter).toBeLessThan(box.width / 2);
	});
});
