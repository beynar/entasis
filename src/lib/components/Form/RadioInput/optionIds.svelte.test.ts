import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import OptionIdsHarness from './OptionIdsHarness.test.svelte';

const idsIn = (container: HTMLElement) =>
	Array.from(container.querySelectorAll<HTMLElement>('[id]'), (element) => element.id);

describe.each([
	['RadioInput', 'radios', 'radio'],
	['CheckboxesInput', 'checkboxes', 'checkbox']
] as const)('%s option ids', (_, testId, role) => {
	test('stay unique and valid across instances that share a name', () => {
		render(OptionIdsHarness);
		const ids = idsIn(screen.getByTestId(testId));

		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^\S+$/);
	});

	test('sit on the visible option, with a derived id on its hidden input', () => {
		render(OptionIdsHarness);
		const [first, second] = within(screen.getByTestId(testId)).getAllByRole(role);

		expect(first.id).toMatch(/-option-0$/);
		expect(second.id).toMatch(/-option-1$/);
		expect(first.querySelector('input')).toHaveAttribute('id', `${first.id}-input`);
	});

	test('keep selection independent per instance', async () => {
		render(OptionIdsHarness);
		const options = within(screen.getByTestId(testId)).getAllByRole(role);

		await fireEvent.click(options[0]);
		expect(options[0]).toHaveAttribute('aria-checked', 'true');
		expect(options[2]).toHaveAttribute('aria-checked', 'false');
	});
});
