// Keyboard behaviour of the choice controls in real engines (Chromium and WebKit): the radio
// group's single Tab stop and arrow selection, Enter continuing a form, and the native button
// semantics of Checkbox and Switch (Space acts once, on release).
import { describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import ChoiceControlsHarness from './ChoiceControlsHarness.test.svelte';

const radio = (name: string) =>
	page.getByRole('radio', { name, exact: true }).element() as HTMLElement;
const checkbox = (name: string) =>
	page.getByRole('checkbox', { name, exact: true }).element() as HTMLElement;
const switchControl = () => page.getByRole('switch', { name: 'Alerts' }).element() as HTMLElement;
const button = (name: string) =>
	page.getByRole('button', { name, exact: true }).element() as HTMLElement;
const checked = (element: HTMLElement) => element.getAttribute('aria-checked');
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe('radio group keyboard model (CC-9)', () => {
	test('a11y:radios.single-tab-stop Tab lands on the checked option and leaves the value alone', async () => {
		const onPlanChange = vi.fn();
		await render(ChoiceControlsHarness, { onPlanChange });
		await settle();
		button('Before').focus();

		// Walk the whole form with Tab: exactly one radio is visited, the checked one.
		const visited: Element[] = [];
		for (let step = 0; step < 10; step += 1) {
			await tab();
			if (document.activeElement?.getAttribute('role') === 'radio') {
				visited.push(document.activeElement);
			}
		}
		expect(visited).toEqual([radio('Pro')]);
		expect(document.querySelectorAll('[role="radio"][tabindex="0"]')).toHaveLength(1);
		expect(onPlanChange).not.toHaveBeenCalled();
	});

	test('a11y:radios.arrow-keys arrows move focus and select, skipping disabled options and wrapping', async () => {
		const onPlanChange = vi.fn();
		await render(ChoiceControlsHarness, { onPlanChange });
		await settle();
		radio('Pro').focus();

		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(radio('Max'));
		expect(checked(radio('Max'))).toBe('true');
		expect(checked(radio('Pro'))).toBe('false');
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(radio('Free'));
		expect(checked(radio('Free'))).toBe('true');
		await userEvent.keyboard('{ArrowUp}');
		expect(document.activeElement).toBe(radio('Max'));
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(radio('Pro'));
		expect(onPlanChange.mock.calls.map(([value]) => value)).toEqual(['max', 'free', 'max', 'pro']);
		expect(checked(radio('Team'))).toBe('false');
	});

	test('right-to-left swaps the horizontal arrows', async () => {
		await render(ChoiceControlsHarness, { dir: 'rtl' });
		await settle();
		radio('Pro').focus();

		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(radio('Max'));
		expect(checked(radio('Max'))).toBe('true');
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(radio('Pro'));
		// Vertical arrows keep their meaning.
		await userEvent.keyboard('{ArrowDown}');
		expect(document.activeElement).toBe(radio('Max'));
	});

	test('arrows with Alt, Ctrl or Meta are left to the browser', async () => {
		const onPlanChange = vi.fn();
		await render(ChoiceControlsHarness, { onPlanChange });
		await settle();
		radio('Pro').focus();

		for (const modifier of ['altKey', 'ctrlKey', 'metaKey'] as const) {
			const event = new KeyboardEvent('keydown', {
				key: 'ArrowDown',
				[modifier]: true,
				bubbles: true,
				cancelable: true
			});
			radio('Pro').dispatchEvent(event);
			expect(event.defaultPrevented).toBe(false);
		}
		expect(document.activeElement).toBe(radio('Pro'));
		expect(onPlanChange).not.toHaveBeenCalled();
	});

	test('a read-only group moves focus and selects nothing', async () => {
		const onPlanChange = vi.fn();
		await render(ChoiceControlsHarness, { readOnly: true, onPlanChange });
		await settle();
		radio('Pro').focus();

		await userEvent.keyboard('{ArrowDown}');

		expect(document.activeElement).toBe(radio('Max'));
		expect(checked(radio('Max'))).toBe('false');
		expect(checked(radio('Pro'))).toBe('true');
		expect(onPlanChange).not.toHaveBeenCalled();
	});

	test('Space selects the focused option', async () => {
		const onPlanChange = vi.fn();
		await render(ChoiceControlsHarness, { onPlanChange });
		await settle();
		radio('Free').focus();

		await userEvent.keyboard(' ');

		expect(checked(radio('Free'))).toBe('true');
		expect(onPlanChange).toHaveBeenCalledWith('free');
	});

	test('Enter submits the form and never selects', async () => {
		const onPlanChange = vi.fn();
		const onNativeSubmit = vi.fn();
		await render(ChoiceControlsHarness, { onPlanChange, onNativeSubmit });
		await settle();
		radio('Free').focus();

		await userEvent.keyboard('{Enter}');

		expect(onNativeSubmit).toHaveBeenCalledOnce();
		expect(checked(radio('Free'))).toBe('false');
		expect(onPlanChange).not.toHaveBeenCalled();
	});
});

describe('checkbox (CC-1)', () => {
	test('Space toggles once; Enter submits the form without toggling', async () => {
		const onTermsChange = vi.fn();
		const onNativeSubmit = vi.fn();
		await render(ChoiceControlsHarness, { onTermsChange, onNativeSubmit });
		await settle();
		checkbox('Terms').focus();

		await userEvent.keyboard(' ');
		expect(checked(checkbox('Terms'))).toBe('true');
		expect(onTermsChange).toHaveBeenCalledOnce();

		await userEvent.keyboard('{Enter}');
		expect(checked(checkbox('Terms'))).toBe('true');
		expect(onTermsChange).toHaveBeenCalledOnce();
		expect(onNativeSubmit).toHaveBeenCalledOnce();
	});

	test('a select-all row is reachable and works from the keyboard', async () => {
		await render(ChoiceControlsHarness, { selectAll: true });
		await settle();
		checkbox('Select all').focus();

		await userEvent.keyboard(' ');
		expect(checked(checkbox('Select all'))).toBe('true');
		expect(checked(checkbox('News'))).toBe('true');
		expect(checked(checkbox('Legal'))).toBe('false');
		await userEvent.keyboard(' ');
		expect(checked(checkbox('News'))).toBe('false');
	});
});

describe('switch on a native button (CC-13)', () => {
	test('Space toggles once, on release, and holding it does not repeat', async () => {
		const onSwitchChange = vi.fn();
		await render(ChoiceControlsHarness, { onSwitchChange });
		await settle();
		switchControl().focus();

		await userEvent.keyboard('{ >5}');
		expect(checked(switchControl())).toBe('false');
		await userEvent.keyboard('{/ }');
		expect(checked(switchControl())).toBe('true');
		expect(onSwitchChange).toHaveBeenCalledTimes(1);
	});

	test('a11y:switch.keyboard-toggle toggles with Enter and Space', async () => {
		await render(ChoiceControlsHarness);
		await settle();
		switchControl().focus();

		await userEvent.keyboard('{Enter}');
		expect(checked(switchControl())).toBe('true');
		await userEvent.keyboard(' ');
		expect(checked(switchControl())).toBe('false');
	});

	test('Enter toggles once', async () => {
		const onSwitchChange = vi.fn();
		await render(ChoiceControlsHarness, { onSwitchChange });
		await settle();
		switchControl().focus();

		await userEvent.keyboard('{Enter}');

		expect(checked(switchControl())).toBe('true');
		expect(onSwitchChange).toHaveBeenCalledTimes(1);
	});

	test('a click on the label toggles the switch once', async () => {
		const onSwitchChange = vi.fn();
		await render(ChoiceControlsHarness, { onSwitchChange });
		await settle();

		await userEvent.click(page.getByText('Alerts', { exact: true }));

		expect(checked(switchControl())).toBe('true');
		expect(onSwitchChange).toHaveBeenCalledTimes(1);
	});
});
