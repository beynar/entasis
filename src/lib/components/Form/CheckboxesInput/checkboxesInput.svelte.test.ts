import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import ChoiceFormHarness from './ChoiceFormHarness.test.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import ChoiceControlsHarness from './ChoiceControlsHarness.test.svelte';
import CheckboxesInput from './CheckboxesInput.svelte';
import type { CheckboxesInputProps, CheckboxOption } from './checkboxesInput.props.js';

const nativeForm = () => screen.getByTestId('native-form') as HTMLFormElement;
const group = () => within(nativeForm()).getByRole('group', { name: 'Topics' });
const option = (name: string) => within(group()).getByRole('checkbox', { name });
const selectAll = () => option('Select all');
const checkedNames = () =>
	within(group())
		.getAllByRole('checkbox')
		.filter((box) => box.getAttribute('aria-checked') === 'true')
		.map((box) => box.textContent?.trim());
const submitted = () => {
	const onNativeSubmit = vi.fn();
	return { onNativeSubmit, data: () => onNativeSubmit.mock.calls.at(-1)![0] as FormData };
};

describe('CC-1 · Enter', () => {
	test('does not toggle an option and submits the surrounding <form>', () => {
		const onTopicsChange = vi.fn();
		const { onNativeSubmit } = submitted();
		render(ChoiceControlsHarness, { props: { onTopicsChange, onNativeSubmit } });

		const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		option('News').dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(option('News')).toHaveAttribute('aria-checked', 'false');
		expect(onTopicsChange).not.toHaveBeenCalled();
		expect(onNativeSubmit).toHaveBeenCalledOnce();
	});
});

describe('CC-4 · hidden inputs', () => {
	test('one input per selected option, beside the buttons and never inside one', async () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { onNativeSubmit, topicsDefault: ['news'] } });
		await fireEvent.click(option('Tips'));
		nativeForm().requestSubmit();

		expect(data().getAll('topics')).toEqual(['news', 'tips']);
		expect(nativeForm().querySelectorAll('button input')).toHaveLength(0);
	});

	test('a required group blocks a native submit while nothing is selected', async () => {
		const { container } = renderInTheme(CheckboxesInput, {
			name: 'topics',
			label: 'Topics',
			required: true,
			items: [{ value: 'news', label: 'News' }]
		});
		const form = document.createElement('form');
		form.append(...Array.from(container.children));
		document.body.append(form);

		expect(form.checkValidity()).toBe(false);
		await fireEvent.click(screen.getByRole('checkbox', { name: 'News' }));
		expect(form.checkValidity()).toBe(true);
		form.remove();
	});
});

describe('CC-8 · disabled options', () => {
	test('a native form leaves a disabled but selected option out', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, {
			props: { onNativeSubmit, topicsDefault: ['news', 'legal'] }
		});
		nativeForm().requestSubmit();

		expect(option('Legal')).toBeDisabled();
		expect(option('Legal')).toHaveAttribute('aria-checked', 'true');
		expect(data().getAll('topics')).toEqual(['news']);
	});

	test('the field value, and so an entasis Form value, keeps it', async () => {
		const onSubmit = vi.fn();
		const onValueChange = vi.fn();
		render(ChoiceFormHarness, {
			props: {
				inputs: {
					topics: {
						type: 'checkboxes',
						label: 'Topics',
						defaultValue: ['news', 'legal'],
						items: [
							{ value: 'news', label: 'News' },
							{ value: 'legal', label: 'Legal', disabled: true }
						],
						onValueChange
					}
				},
				onSubmit
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ topics: ['news', 'legal'] }));

		await fireEvent.click(screen.getByRole('checkbox', { name: 'News' }));
		expect(onValueChange).toHaveBeenLastCalledWith(['legal']);
	});
});

describe('CC-2 · read-only', () => {
	test('every option is focusable and announced, and ignores clicks', async () => {
		const onTopicsChange = vi.fn();
		render(ChoiceControlsHarness, { props: { readOnly: true, onTopicsChange } });

		for (const box of within(group()).getAllByRole('checkbox')) {
			expect(box).toHaveAttribute('aria-readonly', 'true');
		}
		option('News').focus();
		expect(option('News')).toHaveFocus();
		await fireEvent.click(option('News'));
		expect(option('News')).toHaveAttribute('aria-checked', 'false');
		expect(onTopicsChange).not.toHaveBeenCalled();
	});

	test('a read-only group still submits its selection', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, {
			props: { readOnly: true, topicsDefault: ['tips'], onNativeSubmit }
		});
		nativeForm().requestSubmit();

		expect(data().getAll('topics')).toEqual(['tips']);
	});
});

describe('names and descriptions', () => {
	test('an option is named by its label and described by its description', () => {
		renderInTheme(CheckboxesInput, {
			label: 'Channels',
			items: [{ value: 'email', label: 'Email', description: 'Sent every morning' }]
		});

		const email = screen.getByRole('checkbox', { name: 'Email' });
		expect(email).toHaveAccessibleDescription('Sent every morning');
	});
});

describe('CC-5 · select all', () => {
	test('is mixed while some, but not all, enabled options are selected', async () => {
		render(ChoiceControlsHarness, { props: { selectAll: true } });

		expect(selectAll()).toHaveAttribute('aria-checked', 'false');
		await fireEvent.click(option('News'));
		expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');
		await fireEvent.click(option('Tips'));
		await fireEvent.click(option('Offers'));
		expect(selectAll()).toHaveAttribute('aria-checked', 'true');
	});

	test('controls every option and is named by the catalog message', () => {
		render(ChoiceControlsHarness, { props: { selectAll: true } });

		const controlled = selectAll().getAttribute('aria-controls')!.split(' ');
		const ids = within(group())
			.getAllByRole('checkbox')
			.filter((box) => box !== selectAll())
			.map((box) => box.id);
		expect(controlled).toEqual(ids);
	});

	test('cycles mixed, all, none, and back to the partial selection', async () => {
		const onTopicsChange = vi.fn();
		render(ChoiceControlsHarness, {
			props: { selectAll: true, topicsDefault: ['tips'], onTopicsChange }
		});

		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual(['Select all', 'News', 'Tips', 'Offers'].filter(Boolean));
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual([]);
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual(['Tips']);
		expect(selectAll()).toHaveAttribute('aria-checked', 'mixed');
		// One change per click.
		expect(onTopicsChange).toHaveBeenCalledTimes(3);
		expect(onTopicsChange.mock.calls.map(([value]) => value)).toEqual([
			['news', 'tips', 'offers'],
			[],
			['tips']
		]);
	});

	test('with no partial selection it toggles between all and none', async () => {
		render(ChoiceControlsHarness, { props: { selectAll: true } });

		await fireEvent.click(selectAll());
		expect(selectAll()).toHaveAttribute('aria-checked', 'true');
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual([]);
		await fireEvent.click(selectAll());
		expect(selectAll()).toHaveAttribute('aria-checked', 'true');
	});

	test('an edit between clicks ends the cycle: the next round restores the new partial selection', async () => {
		render(ChoiceControlsHarness, { props: { selectAll: true, topicsDefault: ['tips'] } });

		await fireEvent.click(selectAll());
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual([]);
		await fireEvent.click(option('News'));
		await fireEvent.click(selectAll());
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual([]);
		await fireEvent.click(selectAll());
		expect(checkedNames()).toEqual(['News']);
	});

	test('disabled options keep their state through all and none', async () => {
		const { onNativeSubmit } = submitted();
		render(ChoiceControlsHarness, {
			props: { selectAll: true, topicsDefault: ['legal'], onNativeSubmit }
		});

		// A selected disabled option alone is not a selection of the enabled ones.
		expect(selectAll()).toHaveAttribute('aria-checked', 'false');
		await fireEvent.click(selectAll());
		expect(option('Legal')).toHaveAttribute('aria-checked', 'true');
		expect(selectAll()).toHaveAttribute('aria-checked', 'true');
		await fireEvent.click(selectAll());
		expect(option('Legal')).toHaveAttribute('aria-checked', 'true');
		expect(option('News')).toHaveAttribute('aria-checked', 'false');
	});

	test('a disabled group disables the row; a read-only one leaves the value alone', async () => {
		const { rerender } = renderInTheme(CheckboxesInput, {
			label: 'Topics',
			selectAll: true,
			disabled: true,
			items: [{ value: 'a', label: 'A' }]
		});
		expect(screen.getByRole('checkbox', { name: 'Select all' })).toBeDisabled();

		await rerender({ disabled: false, readOnly: true });
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
		expect(screen.getByRole('checkbox', { name: 'A' })).toHaveAttribute('aria-checked', 'false');
	});

	test('required validation reads the options only: the row never counts as a selection', async () => {
		const onSubmit = vi.fn();
		render(ChoiceFormHarness, {
			props: {
				inputs: {
					topics: {
						type: 'checkboxes',
						label: 'Topics',
						required: true,
						selectAll: true,
						items: [
							{ value: 'news', label: 'News' },
							{ value: 'tips', label: 'Tips' }
						]
					}
				},
				onSubmit
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
		await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
		expect(onSubmit).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ topics: ['news', 'tips'] }));
	});

	test('submits the options, never a select-all entry', async () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { selectAll: true, onNativeSubmit } });
		await fireEvent.click(selectAll());
		nativeForm().requestSubmit();

		expect(data().getAll('topics')).toEqual(['news', 'tips', 'offers']);
	});
});

describe('CC-7 · literal value types', () => {
	test('value, defaultValue and onValueChange follow the option values', () => {
		type Plan = 'free' | 'pro';
		type Props = CheckboxesInputProps<CheckboxOption<Plan>>;
		expectTypeOf<Props['value']>().toEqualTypeOf<Plan[] | undefined>();
		expectTypeOf<Props['defaultValue']>().toEqualTypeOf<Plan[] | undefined>();
		expectTypeOf<Props['onValueChange']>().toEqualTypeOf<((value: Plan[]) => void) | undefined>();
		// Unchanged for options with plain string values.
		expectTypeOf<CheckboxesInputProps['value']>().toEqualTypeOf<string[] | undefined>();
	});
});
