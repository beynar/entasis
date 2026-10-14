import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import FocusScopeHarness from './FocusScopeHarness.test.svelte';
import { clearFocusHistory } from './focusHistory.js';
import { isRestoringFocus } from './useFocusScope.svelte.js';

const button = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement;
const settled = () => new Promise((resolve) => setTimeout(resolve, 120));

describe('useFocusScope · stacked scopes (OV-2)', () => {
	test('a11y:dialog.stacked-restore closing a Confirmation over a Dialog returns focus to the button that asked', async () => {
		render(FocusScopeHarness, { props: { scenario: 'stacked' } });
		await fireEvent.click(button('Open parent'));
		await screen.findByRole('dialog', { name: 'Parent' });
		await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Name')));

		const ask = button('Delete');
		ask.focus();
		await fireEvent.click(ask);
		await screen.findByRole('alertdialog');
		await waitFor(() => expect(document.activeElement).toBe(button('Keep')));

		// While the Confirmation animates out, the Dialog must not pull focus to its first field.
		const seen: Array<Element | null> = [];
		const record = () => seen.push(document.activeElement);
		document.addEventListener('focusin', record);
		await fireEvent.click(button('Keep'));
		await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
		await settled();
		document.removeEventListener('focusin', record);

		expect(seen).not.toContain(screen.getByLabelText('Name'));
		expect(document.activeElement).toBe(ask);
	});
});

describe('useFocusScope · restore targets (CX-3)', () => {
	test('a disabled opener hands focus to the most recent element still on the page', async () => {
		render(FocusScopeHarness, { props: { scenario: 'disabled-opener' } });
		clearFocusHistory();
		const notes = screen.getByLabelText('Notes');
		notes.focus();
		const opener = button('Open and disable');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		expect(opener).toBeDisabled();
		await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await waitFor(() => expect(document.activeElement).toBe(notes));
	});
});

describe('useFocusScope · focusOnClose (CX-3b)', () => {
	const openAndClose = async () => {
		const opener = button('Open dialog');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settled();
		return opener;
	};

	test('false leaves focus off the trigger', async () => {
		render(FocusScopeHarness, { props: { scenario: 'focus-on-close', focusOnClose: false } });
		const opener = await openAndClose();
		expect(document.activeElement).not.toBe(opener);
	});

	test('an element receives focus', async () => {
		let elsewhere: HTMLElement | null = null;
		render(FocusScopeHarness, {
			props: {
				scenario: 'focus-on-close',
				focusOnClose: (() => elsewhere) as unknown as () => HTMLElement
			}
		});
		elsewhere = button('Elsewhere');
		await openAndClose();
		expect(document.activeElement).toBe(elsewhere);
	});

	test('a function receives the details of the change that closed the dialog', async () => {
		const choose = vi.fn(() => undefined);
		render(FocusScopeHarness, { props: { scenario: 'focus-on-close', focusOnClose: choose } });
		const opener = await openAndClose();
		expect(choose).toHaveBeenCalledWith(
			expect.objectContaining({ reason: 'escape-key', interaction: 'keyboard' })
		);
		// Returning nothing restores as usual.
		expect(document.activeElement).toBe(opener);
	});

	test('a close through the bound open flag reports no details, not the ones that opened it', async () => {
		const choose = vi.fn(() => undefined);
		render(FocusScopeHarness, { props: { scenario: 'bound-close', focusOnClose: choose } });
		const opener = button('Open bound');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog', { name: 'Bound' });
		await fireEvent.click(button('Cancel'));
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settled();
		expect(choose).toHaveBeenCalledWith(null);
		expect(document.activeElement).toBe(opener);
	});

	test('Popover takes the same option', async () => {
		render(FocusScopeHarness, {
			props: { scenario: 'popover-focus-on-close', popoverFocusOnClose: false }
		});
		const opener = button('Open popover');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('button', { name: 'Inside popover' });
		await waitFor(() => expect(document.activeElement).toBe(button('Inside popover')));
		await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
		await waitFor(() =>
			expect(screen.queryByRole('button', { name: 'Inside popover' })).toBeNull()
		);
		await settled();
		expect(document.activeElement).not.toBe(opener);
	});
});

describe('useFocusScope · Tab containment', () => {
	test('Tab moves focus itself through every tabbable and wraps at both ends', async () => {
		render(FocusScopeHarness, { props: { scenario: 'trap' } });
		await fireEvent.click(button('Open trap'));
		await screen.findByRole('dialog', { name: 'Trap' });
		const [one, two, three] = ['One', 'Two', 'Three'].map(button);
		// The close button is the first tabbable; start from the first named button.
		one.focus();
		// `fireEvent` reports false when the handler called preventDefault: the scope moved focus,
		// instead of leaving it to the engine (WebKit skips buttons and would leave the dialog).
		expect(await fireEvent.keyDown(one, { key: 'Tab' })).toBe(false);
		expect(document.activeElement).toBe(two);
		expect(await fireEvent.keyDown(two, { key: 'Tab' })).toBe(false);
		expect(document.activeElement).toBe(three);
		expect(await fireEvent.keyDown(three, { key: 'Tab' })).toBe(false);
		const first = document.activeElement;
		expect(first).not.toBe(three);
		expect(await fireEvent.keyDown(first!, { key: 'Tab', shiftKey: true })).toBe(false);
		expect(document.activeElement).toBe(three);
		expect(await fireEvent.keyDown(three, { key: 'Tab', shiftKey: true })).toBe(false);
		expect(document.activeElement).toBe(two);
	});
});

describe('useFocusScope · text fields on close', () => {
	test('a focused text field is blurred before focus returns, so Safari does not scroll', async () => {
		const agent = vi.spyOn(navigator, 'vendor', 'get').mockReturnValue('Apple Computer, Inc.');
		const blur = vi.spyOn(HTMLElement.prototype, 'blur');
		render(FocusScopeHarness, { props: { scenario: 'focus-on-close' } });
		const opener = button('Open dialog');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Inside field')));
		await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settled();
		expect(blur).toHaveBeenCalled();
		expect(document.activeElement).toBe(opener);
		agent.mockRestore();
		blur.mockRestore();
	});

	test('Chromium keeps the field focused until focus moves', async () => {
		const agent = vi.spyOn(navigator, 'vendor', 'get').mockReturnValue('Google Inc.');
		const blur = vi.spyOn(HTMLElement.prototype, 'blur');
		render(FocusScopeHarness, { props: { scenario: 'focus-on-close' } });
		const opener = button('Open dialog');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Inside field')));
		await fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settled();
		expect(blur).not.toHaveBeenCalled();
		agent.mockRestore();
		blur.mockRestore();
	});
});

describe('useFocusScope · isRestoringFocus (DF-6)', () => {
	test('is true inside the focusin of the focus a closing dialog hands back, and only there', async () => {
		render(FocusScopeHarness, { props: { scenario: 'focus-on-close' } });
		const seen: Array<{ target: EventTarget | null; restoring: boolean }> = [];
		const record = (event: Event) =>
			seen.push({ target: event.target, restoring: isRestoringFocus() });
		document.addEventListener('focusin', record);
		const opener = button('Open dialog');
		opener.focus();
		await fireEvent.click(opener);
		await screen.findByRole('dialog');
		await fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
		await settled();
		document.removeEventListener('focusin', record);

		const onOpener = seen.filter((entry) => entry.target === opener);
		// The user's own focus first, then the restore.
		expect(onOpener.map((entry) => entry.restoring)).toEqual([false, true]);
		expect(isRestoringFocus()).toBe(false);
	});
});
