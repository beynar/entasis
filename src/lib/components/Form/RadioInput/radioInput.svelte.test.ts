import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import ChoiceControlsHarness from '../CheckboxesInput/ChoiceControlsHarness.test.svelte';
import ChoiceFormHarness from '../CheckboxesInput/ChoiceFormHarness.test.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import RadioInput from './RadioInput.svelte';
import type { RadioInputProps, RadioOption } from './radioInput.props.js';

const nativeForm = () => screen.getByTestId('native-form') as HTMLFormElement;
const group = () => within(nativeForm()).getByRole('radiogroup', { name: 'Plan' });
const radio = (name: string) => within(group()).getByRole('radio', { name });
const radios = () => within(group()).getAllByRole('radio');
const submitted = () => {
	const onNativeSubmit = vi.fn();
	return { onNativeSubmit, data: () => onNativeSubmit.mock.calls.at(-1)![0] as FormData };
};

describe('CC-9 · one tab stop', () => {
	const tabStops = () => radios().filter((option) => option.getAttribute('tabindex') === '0');

	test('is the checked option', () => {
		render(ChoiceControlsHarness, { props: { radioDefault: 'max' } });

		expect(tabStops()).toEqual([radio('Max')]);
	});

	test('is the first enabled option when nothing is checked', () => {
		render(ChoiceControlsHarness, { props: { radioDefault: null } });

		expect(tabStops()).toEqual([radio('Free')]);
	});

	test('skips a checked option that is disabled', () => {
		render(ChoiceControlsHarness, { props: { radioDefault: 'team' } });

		expect(radio('Team')).toBeDisabled();
		expect(tabStops()).toEqual([radio('Free')]);
	});

	test('focusing an option does not select it', async () => {
		const onPlanChange = vi.fn();
		render(ChoiceControlsHarness, { props: { onPlanChange } });

		radio('Free').focus();
		await fireEvent.focus(radio('Free'));

		expect(radio('Pro')).toHaveAttribute('aria-checked', 'true');
		expect(onPlanChange).not.toHaveBeenCalled();
	});

	test('a click selects once', async () => {
		const onPlanChange = vi.fn();
		render(ChoiceControlsHarness, { props: { onPlanChange } });

		await fireEvent.click(radio('Max'));

		expect(radio('Max')).toHaveAttribute('aria-checked', 'true');
		expect(onPlanChange).toHaveBeenCalledExactlyOnceWith('max');
	});
});

describe('CC-1 · Enter', () => {
	test('does not select, and submits the surrounding <form>', () => {
		const onPlanChange = vi.fn();
		const { onNativeSubmit } = submitted();
		render(ChoiceControlsHarness, { props: { onPlanChange, onNativeSubmit } });

		const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
		radio('Free').dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(radio('Free')).toHaveAttribute('aria-checked', 'false');
		expect(onPlanChange).not.toHaveBeenCalled();
		expect(onNativeSubmit).toHaveBeenCalledOnce();
	});

	test('inside an entasis Form it moves to the next field', async () => {
		render(ChoiceControlsHarness, { props: { scenario: 'entasis', radioDefault: 'pro' } });
		const pro = screen.getByRole('radio', { name: 'Pro' });
		pro.focus();

		pro.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
		);

		await waitFor(() => expect(screen.getByRole('textbox', { name: 'Nickname' })).toHaveFocus());
		expect(pro).toHaveAttribute('aria-checked', 'true');
	});
});

describe('CC-10 · group ARIA', () => {
	test('a11y:radios.group-aria required and read-only sit on the radiogroup, never on a radio', () => {
		renderInTheme(RadioInput, {
			label: 'Plan',
			required: true,
			readOnly: true,
			items: [
				{ value: 'free', label: 'Free' },
				{ value: 'pro', label: 'Pro' }
			]
		});

		const radioGroup = screen.getByRole('radiogroup', { name: 'Plan' });
		expect(radioGroup).toHaveAttribute('aria-required', 'true');
		expect(radioGroup).toHaveAttribute('aria-readonly', 'true');
		for (const option of within(radioGroup).getAllByRole('radio')) {
			expect(option).not.toHaveAttribute('aria-required');
			expect(option).not.toHaveAttribute('aria-readonly');
		}
	});

	test('options are named by their text and described by their description', () => {
		render(ChoiceControlsHarness);

		expect(radio('Free')).not.toHaveAttribute('aria-label');
		expect(radio('Free')).toHaveAccessibleDescription('For trying things out');
		expect(radio('Pro')).not.toHaveAttribute('aria-describedby');
	});

	test('the group points at its label only when one is painted', () => {
		const { unmount } = renderInTheme(RadioInput, {
			label: 'Plan',
			items: [{ value: 'free', label: 'Free' }]
		});
		const labelled = screen.getByRole('radiogroup', { name: 'Plan' });
		expect(labelled.getAttribute('aria-labelledby')).toBeTruthy();
		unmount();

		renderInTheme(RadioInput, { items: [{ value: 'free', label: 'Free' }] });
		expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-labelledby');
	});

	test('an option without a label is named by its value', () => {
		renderInTheme(RadioInput, { items: [{ value: 'free' }] });

		expect(screen.getByRole('radio', { name: 'free' })).toBeInTheDocument();
	});
});

describe('CC-2 · read-only', () => {
	test('options stay focusable; clicks select nothing and report nothing', async () => {
		const onPlanChange = vi.fn();
		render(ChoiceControlsHarness, { props: { readOnly: true, onPlanChange } });

		expect(group()).toHaveAttribute('aria-readonly', 'true');
		expect(radio('Max')).not.toBeDisabled();
		expect(radio('Max')).toHaveAttribute('data-readonly');
		radio('Max').focus();
		expect(radio('Max')).toHaveFocus();
		await fireEvent.click(radio('Max'));
		expect(radio('Pro')).toHaveAttribute('aria-checked', 'true');
		expect(radio('Max')).toHaveAttribute('aria-checked', 'false');
		expect(onPlanChange).not.toHaveBeenCalled();
	});

	test('a read-only group still submits its value', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { readOnly: true, onNativeSubmit } });
		nativeForm().requestSubmit();

		expect(data().get('plan')).toBe('pro');
	});
});

describe('CC-4 · hidden input', () => {
	test('submits the selected value beside the options, never inside one', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { onNativeSubmit } });
		nativeForm().requestSubmit();

		expect(data().getAll('plan')).toEqual(['pro']);
		expect(group().querySelectorAll('button input')).toHaveLength(0);
	});

	test('submits nothing while nothing is selected', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { onNativeSubmit, radioDefault: null } });
		nativeForm().requestSubmit();

		expect(data().has('plan')).toBe(false);
	});

	test('a required group blocks a native submit until an option is selected', async () => {
		const { container } = renderInTheme(RadioInput, {
			name: 'plan',
			label: 'Plan',
			required: true,
			items: [{ value: 'free', label: 'Free' }]
		});
		const form = document.createElement('form');
		form.append(...Array.from(container.children));
		document.body.append(form);

		expect(form.checkValidity()).toBe(false);
		await fireEvent.click(screen.getByRole('radio', { name: 'Free' }));
		expect(form.checkValidity()).toBe(true);
		form.remove();
	});
});

describe('CC-8 · disabled options', () => {
	test('a native form leaves a disabled selected option out', () => {
		const { onNativeSubmit, data } = submitted();
		render(ChoiceControlsHarness, { props: { onNativeSubmit, radioDefault: 'team' } });
		nativeForm().requestSubmit();

		expect(radio('Team')).toHaveAttribute('aria-checked', 'true');
		expect(data().has('plan')).toBe(false);
	});

	test('the field value, and so an entasis Form value, keeps it', async () => {
		const onSubmit = vi.fn();
		render(ChoiceFormHarness, {
			props: {
				inputs: {
					plan: {
						type: 'radio',
						label: 'Plan',
						defaultValue: 'team',
						items: [
							{ value: 'free', label: 'Free' },
							{ value: 'team', label: 'Team', disabled: true }
						]
					}
				},
				onSubmit
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ plan: 'team' }));
	});
});

describe('invalid submit', () => {
	test('an entasis Form focuses the checked option', async () => {
		render(ChoiceControlsHarness, { props: { scenario: 'entasis', radioDefault: 'max' } });

		await fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));

		await waitFor(() => expect(screen.getByRole('radio', { name: 'Max' })).toHaveFocus());
	});
});

describe('CC-7 · literal value types', () => {
	test('value, defaultValue and onValueChange follow the option values', () => {
		type Plan = 'free' | 'pro';
		type Props = RadioInputProps<RadioOption<Plan>>;
		expectTypeOf<Props['value']>().toEqualTypeOf<Plan | null | undefined>();
		expectTypeOf<Props['defaultValue']>().toEqualTypeOf<Plan | null | undefined>();
		expectTypeOf<Props['onValueChange']>().toEqualTypeOf<
			((value: Plan | null) => void) | undefined
		>();
		// Unchanged for options with plain string values.
		expectTypeOf<RadioInputProps['value']>().toEqualTypeOf<string | null | undefined>();
	});
});
