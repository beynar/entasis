// Select in real engines: where the panel lands, what a consumer's max-height does to it, how a
// touch open differs from a mouse open, and what a label click does with real focus.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SelectHarness from './SelectHarness.test.svelte';

const items = Array.from({ length: 30 }, (_, index) => ({
	value: `item-${index}`,
	label: `Item ${String(index).padStart(2, '0')}`
}));

const trigger = () => page.getByRole('combobox', { name: 'Fruit' });
const rect = (element: Element) => element.getBoundingClientRect();
const middle = (element: Element) => rect(element).top + rect(element).height / 2;

test('an item-aligned list puts the selected option on the trigger', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items, defaultValue: 'item-12' } });
	await userEvent.click(trigger());
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();

	const selected = page.getByRole('option', { name: 'Item 12' }).element();
	expect(Math.abs(middle(selected) - middle(trigger().element()))).toBeLessThanOrEqual(1);
});

test('a max-height the theme puts on the list caps an item-aligned list (SC-6)', async () => {
	await render(SelectHarness, {
		props: {
			label: 'Fruit',
			items,
			defaultValue: 'item-12',
			theme: { list: { base: 'max-h-[120px]' } }
		}
	});
	await userEvent.click(trigger());
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();

	expect(rect(listbox.element()).height).toBeLessThanOrEqual(120);
	// Still aligned: the selected option sits on the trigger inside the shorter window.
	const selected = page.getByRole('option', { name: 'Item 12' }).element();
	expect(Math.abs(middle(selected) - middle(trigger().element()))).toBeLessThanOrEqual(1);
});

test('a touch open is a dropdown below the trigger, a mouse open covers it (SC-6)', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items, defaultValue: 'item-12' } });
	const button = trigger().element() as HTMLElement;

	button.dispatchEvent(
		new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', isPrimary: true })
	);
	button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();
	// The dropdown starts at the trigger's bottom edge (plus the popover offset).
	expect(rect(listbox.element()).top).toBeGreaterThanOrEqual(rect(button).bottom - 1);
	// ...and is capped like a dropdown.
	expect(rect(listbox.element()).height).toBeLessThanOrEqual(240);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
	await userEvent.click(trigger());
	await expect.element(page.getByRole('listbox')).toBeVisible();
	expect(rect(page.getByRole('listbox').element()).top).toBeLessThan(rect(button).bottom - 1);
});

test('clicking the label focuses the trigger and leaves the list closed (SC-3)', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items } });
	await userEvent.click(page.getByText('Fruit', { exact: true }));
	await expect.element(trigger()).toHaveFocus();
	await expect.element(trigger()).toHaveAttribute('aria-expanded', 'false');
});

test('a screen reader moving focus onto an option keeps the list open (SC-21)', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items } });
	await userEvent.click(trigger());
	await expect.element(page.getByRole('listbox')).toBeVisible();

	(page.getByRole('option', { name: 'Item 03' }).element() as HTMLElement).focus();
	await expect.element(trigger()).toHaveAttribute('aria-expanded', 'true');
	await expect.element(page.getByRole('listbox')).toBeVisible();

	await userEvent.keyboard('{Escape}');
	await expect.element(trigger()).toHaveAttribute('aria-expanded', 'false');
	await expect.element(trigger()).toHaveFocus();
});

test('the listbox is the scroll viewport and holds no tab stop of its own (SC-1c)', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items } });
	await userEvent.click(trigger());
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();

	const element = listbox.element() as HTMLElement;
	expect(element.hasAttribute('data-scroll-area-viewport')).toBe(true);
	expect(element.scrollHeight).toBeGreaterThan(element.clientHeight);
	expect(element.getAttribute('tabindex')).toBe('-1');
	expect(element.querySelector('[role="group"]')).toBeNull();
});

test('a list opened from outside measures its own session (SC-8)', async () => {
	await render(SelectHarness, { props: { label: 'Fruit', items, defaultValue: 'item-12' } });
	const button = trigger().element() as HTMLElement;
	const external = page.getByRole('button', { name: 'External open' });
	const selected = () => page.getByRole('option', { name: 'Item 12' }).element();

	await userEvent.click(trigger());
	await expect.element(page.getByRole('listbox')).toBeVisible();
	const first = rect(page.getByRole('listbox').element()).height;
	expect(Math.abs(middle(selected()) - middle(button))).toBeLessThanOrEqual(1);
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();

	await userEvent.click(external);
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await expect.element(trigger()).toHaveFocus();
	// The new list is sized and scrolled like the first, not left at its natural height.
	expect(rect(page.getByRole('listbox').element()).height).toBeLessThanOrEqual(first + 1);
	expect(Math.abs(middle(selected()) - middle(button))).toBeLessThanOrEqual(1);

	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
});
