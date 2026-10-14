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

	test('sit on the visible option, with no input inside an option', () => {
		render(OptionIdsHarness);
		const group = screen.getByTestId(testId);
		const [first, second] = within(group).getAllByRole(role);

		expect(first.id).toMatch(/-option-0$/);
		expect(second.id).toMatch(/-option-1$/);
		// A button may not contain interactive content.
		expect(group.querySelectorAll('button input')).toHaveLength(0);
	});

	test('keep selection independent per instance', async () => {
		render(OptionIdsHarness);
		const options = within(screen.getByTestId(testId)).getAllByRole(role);

		await fireEvent.click(options[0]);
		expect(options[0]).toHaveAttribute('aria-checked', 'true');
		expect(options[2]).toHaveAttribute('aria-checked', 'false');
	});
});
