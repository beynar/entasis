import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
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
