// The column menu and the Columns menu are plain menus: every choice is a menu row (option, radio,
// checkbox, submenu), and only the fields of a text, number, date or custom filter sit above them.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './DataTableColumnMenuHarness.test.svelte';

const items = [
	{ id: 'a', name: 'Ada', status: 'active', team: 'core', remote: true },
	{ id: 'b', name: 'Bob', status: 'invited', team: 'docs', remote: false },
	{ id: 'c', name: 'Cy', status: 'active', team: 'docs', remote: false }
];

const visibleRows = () =>
	[...document.querySelectorAll<HTMLElement>('tbody tr[data-row-id]')].map(
		(row) => row.dataset.rowId
	);

const menu = () => document.querySelector<HTMLElement>('[role="menu"]')!;

// The trigger shows on hover or focus of its header, as a person reaches it.
const openColumnMenu = async (name: string) => {
	const trigger = page.getByRole('button', { name: new RegExp(`^Column options for ${name}`) });
	await userEvent.hover(trigger.element().closest('th')!);
	await trigger.click();
	await expect.poll(() => document.querySelector('[role="menu"]')).not.toBeNull();
};

const closeMenus = async () => {
	await userEvent.keyboard('{Escape}');
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => document.querySelector('[role="menu"]')).toBeNull();
};

const renderTable = async () => {
	await render(Harness, { props: { items } });
	await expect.poll(visibleRows).toEqual(['a', 'b', 'c']);
};

test('the rows are sort radios, a Pin submenu and the layout actions, in separated groups', async () => {
	await renderTable();
	await openColumnMenu('Name');

	const rows = [...menu().querySelectorAll<HTMLElement>('[role^="menuitem"], [role="separator"]')];
	expect(rows.map((row) => row.getAttribute('role'))).toEqual([
		'menuitemradio',
		'menuitemradio',
		'separator',
		'menuitem',
		'separator',
		'menuitem',
		'menuitem'
	]);
	expect(rows.map((row) => row.textContent?.trim()).filter(Boolean)).toEqual([
		'Sort ascending',
		'Sort descending',
		'Pin column',
		'Reset width',
		'Hide column'
	]);
	// No row the column cannot use: nothing to unpin, no filter to clear.
	expect(menu().textContent).not.toContain('Unpin');
	expect(menu().textContent).not.toContain('Clear filter');
});

test('a sort row checks its direction, and pressing the checked one clears the sort', async () => {
	await renderTable();
	const header = () => document.querySelector('th[data-column-id="name"]')!;

	await openColumnMenu('Name');
	await page.getByRole('menuitemradio', { name: 'Sort descending' }).click();
	await expect.poll(() => header().getAttribute('aria-sort')).toBe('descending');
	await expect.poll(visibleRows).toEqual(['c', 'b', 'a']);

	await openColumnMenu('Name');
	const checked = page.getByRole('menuitemradio', { name: 'Sort descending' });
	await expect.element(checked).toHaveAttribute('aria-checked', 'true');
	await checked.click();
	await expect.poll(() => header().getAttribute('aria-sort')).toBeNull();
});

test('a text filter is a field above the rows, and Clear filter appears once it applies', async () => {
	await renderTable();
	await openColumnMenu('Name');

	const field = page.getByRole('textbox', { name: 'Filter Name' });
	await expect.element(field).toHaveAttribute('data-1p-ignore');
	// Above the rows, outside the role="menu" element.
	expect(menu().contains(field.element())).toBe(false);
	await field.fill('bo');
	await expect.poll(visibleRows).toEqual(['b']);

	await closeMenus();
	await openColumnMenu('Name');
	await page.getByRole('menuitem', { name: 'Clear filter' }).click();
	await expect.poll(visibleRows).toEqual(['a', 'b', 'c']);
});

test('a multi-select filter is checkbox rows in the Filter submenu', async () => {
	await renderTable();
	await openColumnMenu('Status');
	await page.getByRole('menuitem', { name: 'Filter' }).click();

	const invited = page.getByRole('menuitemcheckbox', { name: 'Invited' });
	await invited.click();
	await expect.element(invited).toHaveAttribute('aria-checked', 'true');
	await expect.poll(visibleRows).toEqual(['b']);

	await page.getByRole('menuitemcheckbox', { name: 'Active' }).click();
	await expect.poll(visibleRows).toEqual(['a', 'b', 'c']);
	await invited.click();
	await expect.poll(visibleRows).toEqual(['a', 'c']);
});

test('select and boolean filters are radio rows that start on All values', async () => {
	await renderTable();
	await openColumnMenu('Team');
	await page.getByRole('menuitem', { name: 'Filter' }).click();
	await expect
		.element(page.getByRole('menuitemradio', { name: 'All values' }))
		.toHaveAttribute('aria-checked', 'true');
	await page.getByRole('menuitemradio', { name: 'Docs' }).click();
	await expect.poll(visibleRows).toEqual(['b', 'c']);
	await closeMenus();

	await openColumnMenu('Remote');
	await page.getByRole('menuitem', { name: 'Filter' }).click();
	await page.getByRole('menuitemradio', { name: 'On site' }).click();
	await expect.poll(visibleRows).toEqual(['b', 'c']);
	await page.getByRole('menuitemradio', { name: 'Remote' }).click();
	await expect.poll(visibleRows).toEqual([]);
	await page.getByRole('menuitemradio', { name: 'All values' }).click();
	await expect.poll(visibleRows).toEqual(['b', 'c']);
});

test('the Pin submenu is one radio group, and grouping is a checkbox row', async () => {
	await renderTable();
	const header = () => document.querySelector('th[data-column-id="team"]')!;

	await openColumnMenu('Team');
	await page.getByRole('menuitem', { name: 'Pin column' }).click();
	await expect
		.element(page.getByRole('menuitemradio', { name: 'Not pinned' }))
		.toHaveAttribute('aria-checked', 'true');
	await page.getByRole('menuitemradio', { name: 'Right' }).click();
	await expect.poll(() => header().getAttribute('data-pinned')).toBe('right');
	await page.getByRole('menuitemradio', { name: 'Not pinned' }).click();
	await expect.poll(() => header().getAttribute('data-pinned')).toBeNull();
	await closeMenus();

	await openColumnMenu('Team');
	const group = page.getByRole('menuitemcheckbox', { name: 'Group by this column' });
	await expect.element(group).toHaveAttribute('aria-checked', 'false');
	await group.click();
	await expect.element(group).toHaveAttribute('aria-checked', 'true');
});

test('the Columns menu is checkbox rows, and the last visible column cannot be unchecked', async () => {
	await renderTable();
	await page.getByRole('button', { name: 'Choose visible columns' }).click();

	const status = page.getByRole('menuitemcheckbox', { name: 'Status' });
	await expect.element(status).toHaveAttribute('aria-checked', 'true');
	await status.click();
	await expect.element(status).toHaveAttribute('aria-checked', 'false');
	await expect.poll(() => document.querySelector('th[data-column-id="status"]')).toBeNull();

	for (const name of ['Team', 'Remote']) {
		await page.getByRole('menuitemcheckbox', { name }).click();
	}
	await expect
		.element(page.getByRole('menuitemcheckbox', { name: 'Name' }))
		.toHaveAttribute('aria-disabled', 'true');
});
