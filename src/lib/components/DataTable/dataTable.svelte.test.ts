import '@testing-library/jest-dom/vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness from './DataTableInFlowHarness.test.svelte';

const people = Array.from({ length: 40 }, (_, index) => ({
	id: `person-${index}`,
	name: `Person ${index}`,
	role: index % 2 === 0 ? 'Engineer' : 'Designer'
}));

describe('DataTable virtualize={false}', () => {
	test('renders every row in normal flow without absolute positioning', async () => {
		const { container } = render(Harness, { props: { items: people } });

		await waitFor(() =>
			expect(container.querySelectorAll('tbody tr[data-row-id]')).toHaveLength(people.length)
		);

		const rows = [...container.querySelectorAll<HTMLElement>('tbody tr[data-row-id]')];
		expect(rows.map((row) => row.dataset.rowId)).toEqual(people.map((person) => person.id));
		for (const row of rows) {
			expect(row.style.position).not.toBe('absolute');
			expect(row.style.transform).toBe('');
		}
		// The virtual spacer rows carry the scroll offsets; non-virtual mode must not emit them.
		expect(container.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(0);
	});
});

describe('DataTable pagination footer', () => {
	test('summarises the page through the catalog and names the size select once', async () => {
		const { container, getAllByText, getByRole } = render(Harness, {
			props: { items: people, pagination: { pageSize: 20 } }
		});

		await waitFor(() => expect(container.textContent).toContain('1–20 of 40'));
		expect(getAllByText('Rows per page')).toHaveLength(1);
		// 20 is not among the default sizes; the select still shows it instead of its placeholder.
		const select = getByRole('combobox', { name: 'Rows per page' });
		expect(select).toHaveTextContent('20');
	});
});

describe('DataTable row activation', () => {
	test('activates a row from a cell click but not from a control inside it', async () => {
		const onRowActivate = vi.fn();
		const { container, getAllByRole, getByText } = render(Harness, {
			props: { items: people.slice(0, 3), onRowActivate, withRowActions: true }
		});

		await fireEvent.click(await waitFor(() => getByText('Person 1')));
		expect(onRowActivate).toHaveBeenCalledTimes(1);
		expect(onRowActivate.mock.calls[0]?.[0]).toMatchObject({ rowId: 'person-1' });
		expect(container.querySelector('tr[data-row-id="person-1"]')).toHaveClass('cursor-pointer');

		await fireEvent.click(getAllByRole('button', { name: 'Open' })[0]!);
		expect(onRowActivate).toHaveBeenCalledTimes(1);
		// The actions column takes the requested width instead of the one-icon default.
		const row = container.querySelector<HTMLElement>('tr[data-row-id="person-0"]');
		expect(row?.style.gridTemplateColumns).toContain('96px');
	});
});
