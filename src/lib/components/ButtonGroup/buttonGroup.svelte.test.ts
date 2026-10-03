import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import Harness from './ButtonGroupHarness.test.svelte';

describe('ButtonGroup', () => {
	test('composes buttons passed as children in a named group', () => {
		const { getByRole } = render(Harness, { props: { mode: 'children' } });
		const group = getByRole('group', { name: 'History' });
		expect([...group.children].map((child) => child.textContent?.trim())).toEqual(['Undo', 'Redo']);
	});

	test('a disabled group disables every item, whatever the item says', () => {
		const { getByRole } = render(Harness, { props: { mode: 'items' } });
		expect(getByRole('group', { name: 'Alignment' })).toBeInTheDocument();
		expect(getByRole('button', { name: 'Left' })).toBeDisabled();
		expect(getByRole('button', { name: 'Right' })).toBeDisabled();
	});
});
