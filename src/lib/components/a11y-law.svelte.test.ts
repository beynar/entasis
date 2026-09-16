// Accessibility laws every overlay and composite widget must obey. Test names start with a
// stable id (`a11y:<component>.<law>`) that docs pages reference in their verified feature
// chips (see tooling/check-feature-chips.mjs).
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import A11yLawHarness from './A11yLawHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const pressOutside = () => fireEvent.pointerDown(document.body);
/** A real press: pointerdown (what the layer stack listens to) followed by click. */
const press = async (element: Element) => {
	await fireEvent.pointerDown(element);
	await fireEvent.click(element);
};

describe('dialog', () => {
	test('a11y:dialog.initial-focus moves focus into the dialog, past the close button', async () => {
		render(A11yLawHarness, { props: { scenario: 'dialog' } });
		const trigger = screen.getByRole('button', { name: 'Open dialog' });
		trigger.focus();
		await fireEvent.click(trigger);
		const dialog = await screen.findByRole('dialog');
		await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
		expect(document.activeElement).toBe(screen.getByLabelText('First field'));
	});

	test('a11y:dialog.labelled-and-described links title and description', async () => {
		render(A11yLawHarness, { props: { scenario: 'dialog' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
		const dialog = await screen.findByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAccessibleName('Law dialog');
		expect(dialog).toHaveAccessibleDescription('Explains the law');
	});

	test('a11y:dialog.inert-siblings hides the page behind a modal and releases it on close', async () => {
		const onAfterClose = vi.fn();
		render(A11yLawHarness, { props: { scenario: 'dialog', onAfterClose } });
		const outside = screen.getByTestId('outside');
		await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
		await screen.findByRole('dialog');
		await waitFor(() => expect(outside.closest('[inert]')).not.toBeNull());
		await escape();
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(outside.closest('[inert]')).toBeNull();
	});

	test('a11y:dialog.escape-restores-focus returns focus to the trigger', async () => {
		const onAfterClose = vi.fn();
		render(A11yLawHarness, { props: { scenario: 'dialog', onAfterClose } });
		const trigger = screen.getByRole('button', { name: 'Open dialog' });
		trigger.focus();
		await fireEvent.click(trigger);
		await screen.findByRole('dialog');
		await escape();
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(screen.queryByRole('dialog')).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	test('a11y:dialog.escape-ignored-when-not-closable keeps a non-dismissable dialog open', async () => {
		render(A11yLawHarness, { props: { scenario: 'dialog', closeOnEscape: false } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
		await screen.findByRole('dialog');
		await escape();
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
});

describe('popover', () => {
	for (const scenario of ['popover', 'popover-snippet'] as const) {
		test(`a11y:popover.trigger-aria (${scenario}) exposes expanded state and the controlled panel`, async () => {
			render(A11yLawHarness, { props: { scenario } });
			const trigger = screen.getByRole('button', {
				name: scenario === 'popover' ? 'Open popover' : 'Snippet trigger'
			});
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
			expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
			await fireEvent.click(trigger);
			await screen.findByRole('button', { name: 'Inside popover' });
			await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
			const controls = trigger.getAttribute('aria-controls');
			expect(controls).toBeTruthy();
			expect(document.getElementById(controls!)).not.toBeNull();
		});
	}

	test('a11y:popover.escape-restores-focus closes the panel and refocuses the trigger', async () => {
		const onAfterClose = vi.fn();
		render(A11yLawHarness, { props: { scenario: 'popover', onAfterClose } });
		const trigger = screen.getByRole('button', { name: 'Open popover' });
		trigger.focus();
		await fireEvent.click(trigger);
		const inside = await screen.findByRole('button', { name: 'Inside popover' });
		inside.focus();
		await escape();
		await waitFor(() => expect(onAfterClose).toHaveBeenCalledOnce());
		expect(document.activeElement).toBe(trigger);
	});

	test('a11y:layers.sibling-popovers a press inside one popover dismisses the other, outside dismisses both', async () => {
		render(A11yLawHarness, { props: { scenario: 'siblings' } });
		await press(screen.getByRole('button', { name: 'Open A' }));
		await screen.findByRole('button', { name: 'Inside A' });
		// Pressing B's trigger is outside A: A closes, B opens.
		await press(screen.getByRole('button', { name: 'Open B' }));
		await screen.findByRole('button', { name: 'Inside B' });
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Inside A' })).toBeNull());
		// A press inside B keeps B open.
		await press(screen.getByRole('button', { name: 'Inside B' }));
		expect(screen.getByRole('button', { name: 'Inside B' })).toBeInTheDocument();
		// A press on the page closes it.
		await pressOutside();
		await waitFor(() => expect(screen.queryByRole('button', { name: 'Inside B' })).toBeNull());
	});
});

describe('tabs', () => {
	test('a11y:tabs.aria links every tab to its panel and marks the selected one', async () => {
		render(A11yLawHarness, { props: { scenario: 'tabs' } });
		const [overview, settings] = screen.getAllByRole('tab');
		expect(overview).toHaveAttribute('aria-selected', 'true');
		expect(settings).toHaveAttribute('aria-selected', 'false');
		const panelId = overview.getAttribute('aria-controls');
		expect(panelId).toBeTruthy();
		const panel = document.getElementById(panelId!);
		expect(panel).toHaveAttribute('role', 'tabpanel');
		expect(panel).toHaveAttribute('aria-labelledby', overview.id);
		await fireEvent.click(settings);
		expect(settings).toHaveAttribute('aria-selected', 'true');
		expect(overview).toHaveAttribute('aria-selected', 'false');
	});
});

describe('typeahead', () => {
	test('a11y:menu.typeahead typing a letter moves focus to the matching item', async () => {
		render(A11yLawHarness, { props: { scenario: 'menu' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
		const menu = await screen.findByRole('menu');
		await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
		await fireEvent.keyDown(menu, { key: 'd' });
		await waitFor(() => expect(document.activeElement).toHaveTextContent('Delete'));
	});

	test('a11y:select.typeahead typing a letter highlights the matching option', async () => {
		render(A11yLawHarness, { props: { scenario: 'select' } });
		const trigger = screen.getByRole('combobox', { name: 'Fruit' });
		trigger.focus();
		await fireEvent.keyDown(trigger, { key: 'ArrowDown' });
		await screen.findByRole('listbox');
		await fireEvent.keyDown(trigger, { key: 'c' });
		await waitFor(() => {
			const active = trigger.getAttribute('aria-activedescendant');
			expect(active).toBeTruthy();
			expect(document.getElementById(active!)).toHaveTextContent('Cherry');
		});
	});
});
