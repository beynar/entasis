// ToggleButtonGroup keyboard behaviour in real engines (Chromium and WebKit): the single Tab stop,
// where Tab and Shift+Tab land, arrow keys per orientation and focusable-while-disabled buttons.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import Harness from './ToggleButtonGroupHarness.test.svelte';

const button = (name: string) =>
	page.getByRole('button', { name, exact: true }).element() as HTMLElement;
const radio = (name: string) =>
	page.getByRole('radio', { name, exact: true }).element() as HTMLElement;
const group = () => document.querySelector('[data-type]') as HTMLElement;
const tabStops = () => Array.from(group().querySelectorAll('[tabindex="0"]'));
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe('single tab stop', () => {
	test('a11y:toggle-button-group.single-tab-stop the group element is not focusable and only the pressed button is a tab stop', async () => {
		await render(Harness, { value: ['italic'] });
		await settle();
		expect(group().hasAttribute('tabindex')).toBe(false);
		expect(tabStops()).toEqual([button('Italic')]);
	});

	test('Tab lands on the pressed button, not the first one', async () => {
		await render(Harness, { value: ['underline'] });
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('Underline'));
		await tab();
		expect(document.activeElement).toBe(button('After'));
	});

	test('Tab lands on the first enabled button when nothing is pressed', async () => {
		await render(Harness, {
			items: [
				{ value: 'bold', children: 'Bold', disabled: true },
				{ value: 'italic', children: 'Italic' },
				{ value: 'underline', children: 'Underline' }
			]
		});
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('Italic'));
	});

	test('the tab stop follows the pressed button when the value is pressed with the pointer', async () => {
		await render(Harness, { value: ['bold'] });
		await settle();
		await userEvent.click(button('Underline'));
		await userEvent.click(button('Bold'));
		await settle();
		expect(tabStops().length).toBe(1);
		button('Before').focus();
		await tab();
		expect(group().contains(document.activeElement)).toBe(true);
	});

	test('Shift+Tab leaves the group in one step', async () => {
		await render(Harness, { value: ['italic'] });
		await settle();
		button('After').focus();
		await tab({ shift: true });
		expect(document.activeElement).toBe(button('Italic'));
		await tab({ shift: true });
		expect(document.activeElement).toBe(button('Before'));
	});

	test('a disabled group has no tabbable element', async () => {
		await render(Harness, { value: ['italic'], disabled: true });
		await settle();
		expect(tabStops()).toEqual([]);
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('After'));
	});

	test('a single group lands on the checked radio', async () => {
		await render(Harness, { type: 'single', value: 'underline' });
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(radio('Underline'));
	});
});

describe('orientation and loopFocus', () => {
	test('horizontal: ArrowRight moves, ArrowDown does not, and the group has no aria-orientation', async () => {
		await render(Harness, { value: ['bold'] });
		await settle();
		expect(group().getAttribute('data-orientation')).toBe('horizontal');
		expect(group().hasAttribute('aria-orientation')).toBe(false);
		button('Bold').focus();
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Italic'));
	});

	test('vertical: ArrowDown moves, ArrowRight does not', async () => {
		await render(Harness, { value: ['bold'], orientation: 'vertical' });
		await settle();
		expect(group().getAttribute('data-orientation')).toBe('vertical');
		expect(group().hasAttribute('aria-orientation')).toBe(false);
		button('Bold').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(button('Italic'));
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(button('Bold'));
	});

	test('vertical groups stack their buttons', async () => {
		await render(Harness, { orientation: 'vertical' });
		const bold = button('Bold').getBoundingClientRect();
		const italic = button('Italic').getBoundingClientRect();
		expect(italic.top).toBeGreaterThanOrEqual(bold.bottom);
		expect(Math.abs(italic.left - bold.left)).toBeLessThan(1);
	});

	test('loops from the last button to the first by default', async () => {
		await render(Harness, { value: ['underline'] });
		await settle();
		button('Underline').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(button('Underline'));
	});

	test('loopFocus={false} stops at both ends, and Home and End still jump', async () => {
		await render(Harness, { value: ['underline'], loopFocus: false });
		await settle();
		button('Underline').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Underline'));
		await userEvent.keyboard('{Home}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.keyboard('{End}');
		expect(document.activeElement).toBe(button('Underline'));
	});
});

describe('runtime and layout', () => {
	test('loopFocus is read on every arrow press, not captured at mount', async () => {
		await render(Harness, { value: ['underline'] });
		await settle();
		button('Underline').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Bold'));
		await userEvent.click(button('Stop looping'));
		button('Underline').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Underline'));
	});

	test('in RTL the arrows mirror: ArrowLeft moves to the next button', async () => {
		document.documentElement.dir = 'rtl';
		try {
			await render(Harness, { value: ['bold'] });
			await settle();
			button('Bold').focus();
			await userEvent.keyboard('{ArrowLeft}');
			expect(document.activeElement).toBe(button('Italic'));
			await userEvent.keyboard('{ArrowRight}');
			expect(document.activeElement).toBe(button('Bold'));
		} finally {
			document.documentElement.removeAttribute('dir');
		}
	});

	test('a single group is a radiogroup that reports its orientation', async () => {
		await render(Harness, { type: 'single', value: 'bold', orientation: 'vertical' });
		await settle();
		expect(group().getAttribute('role')).toBe('radiogroup');
		expect(group().getAttribute('aria-orientation')).toBe('vertical');
	});

	test('a multiple group never carries aria-orientation', async () => {
		await render(Harness, { orientation: 'vertical' });
		await settle();
		expect(group().getAttribute('role')).toBe('group');
		expect(group().hasAttribute('aria-orientation')).toBe(false);
	});

	test('a joined vertical group rounds only the outer corners of the first and last button', async () => {
		await render(Harness, { joined: true, orientation: 'vertical' });
		await settle();
		const radius = (name: string, corner: 'borderTopLeftRadius' | 'borderBottomLeftRadius') =>
			parseFloat(getComputedStyle(button(name))[corner]);
		expect(radius('Bold', 'borderTopLeftRadius')).toBeGreaterThan(0);
		expect(radius('Bold', 'borderBottomLeftRadius')).toBe(0);
		expect(radius('Italic', 'borderTopLeftRadius')).toBe(0);
		expect(radius('Italic', 'borderBottomLeftRadius')).toBe(0);
		expect(radius('Underline', 'borderTopLeftRadius')).toBe(0);
		expect(radius('Underline', 'borderBottomLeftRadius')).toBeGreaterThan(0);
	});
});

describe('focusableWhenDisabled', () => {
	const items = [
		{ value: 'bold', children: 'Bold' },
		{ value: 'italic', children: 'Italic', disabled: true, focusableWhenDisabled: true },
		{ value: 'underline', children: 'Underline', disabled: true }
	];

	test('arrow keys stop on a focusable disabled button and skip a natively disabled one', async () => {
		await render(Harness, { items, value: ['bold'] });
		await settle();
		button('Bold').focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Italic'));
		expect(button('Italic').getAttribute('aria-disabled')).toBe('true');
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(button('Bold'));
	});

	test('Enter and Space do not press a focusable disabled button', async () => {
		await render(Harness, { items, value: ['bold'] });
		await settle();
		button('Bold').focus();
		await userEvent.keyboard('{ArrowRight}');
		await userEvent.keyboard('{Enter}');
		await userEvent.keyboard(' ');
		expect(button('Italic').getAttribute('aria-pressed')).toBe('false');
		expect(button('Bold').getAttribute('aria-pressed')).toBe('true');
	});

	test('a disabled group of focusable buttons keeps one tab stop', async () => {
		await render(Harness, {
			disabled: true,
			items: [
				{ value: 'bold', children: 'Bold', focusableWhenDisabled: true },
				{ value: 'italic', children: 'Italic', focusableWhenDisabled: true }
			]
		});
		await settle();
		expect(tabStops()).toEqual([button('Bold')]);
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('Bold'));
		await tab();
		expect(document.activeElement).toBe(button('After'));
	});
});
