import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import NativeFormHarness from './NativeFormHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const form = () => screen.getByTestId('form') as HTMLFormElement;
const otherForm = () => screen.getByTestId('other-form') as HTMLFormElement;
const entries = (target = form()) =>
	[...new FormData(target).entries()].map(([key, value]) => `${key}=${String(value)}`);
const nameInput = () => screen.getByRole('textbox', { name: 'Name' }) as HTMLInputElement;
const alerts = () => screen.getByRole('switch', { name: 'Alerts' });
const nextTask = () => new Promise((resolve) => setTimeout(resolve));

const initialEntries = ['name=Ada', 'colors=red', 'size=s', 'plan=free', 'tags=red'];

describe('native form reset', () => {
	test('returns every control to its initial value, visible state and submitted value alike', async () => {
		render(NativeFormHarness);
		expect(entries()).toEqual(initialEntries);

		await fireEvent.input(nameInput(), { target: { value: 'Grace' } });
		await fireEvent.click(alerts());
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Terms' }));
		await fireEvent.click(screen.getByRole('checkbox', { name: 'Green' }));
		await fireEvent.click(screen.getByRole('radio', { name: 'Medium' }));
		await fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
		expect(entries()).toEqual([
			'name=Grace',
			'alerts=true',
			'terms=true',
			'colors=red',
			'colors=green',
			'size=m',
			'plan=free',
			'tags=red',
			'tags=green'
		]);

		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
		await waitFor(() => expect(alerts()).toHaveAttribute('aria-checked', 'false'));
		expect(nameInput()).toHaveValue('Ada');
		expect(screen.getByRole('checkbox', { name: 'Terms' })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect(screen.getByRole('checkbox', { name: 'Red' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('checkbox', { name: 'Green' })).toHaveAttribute(
			'aria-checked',
			'false'
		);
		expect(screen.getByRole('radio', { name: 'Small' })).toHaveAttribute('aria-checked', 'true');
		expect(entries()).toEqual(initialEntries);
	});

	test('publishes the restored value once through onValueChange', async () => {
		const onNameChange = vi.fn();
		const onSwitchChange = vi.fn();
		render(NativeFormHarness, { props: { onNameChange, onSwitchChange } });
		await fireEvent.input(nameInput(), { target: { value: 'Grace' } });
		await fireEvent.click(alerts());
		onNameChange.mockClear();
		onSwitchChange.mockClear();

		form().reset();
		await waitFor(() => expect(onNameChange).toHaveBeenCalledOnce());
		expect(onNameChange).toHaveBeenCalledWith('Ada');
		expect(onSwitchChange).toHaveBeenCalledExactlyOnceWith(null);
	});

	test('an untouched switch that is on by default stays on, its input included', async () => {
		render(NativeFormHarness, { props: { switchDefault: true } });
		const input = form().querySelector<HTMLInputElement>('input[name="alerts"]')!;
		expect(input.checked).toBe(true);

		form().reset();
		await nextTask();
		await nextTask();
		expect(alerts()).toHaveAttribute('aria-checked', 'true');
		expect(input.checked).toBe(true);
		expect(nameInput()).toHaveValue('Ada');
		expect(entries()).toContain('alerts=true');
	});

	test('a switch on by default comes back on after it was turned off', async () => {
		render(NativeFormHarness, { props: { switchDefault: true } });
		await fireEvent.click(alerts());
		expect(entries()).not.toContain('alerts=true');

		form().reset();
		await waitFor(() => expect(alerts()).toHaveAttribute('aria-checked', 'true'));
		expect(entries()).toContain('alerts=true');
	});

	test('a reset cancelled by a later listener leaves the controls as they are', async () => {
		const onSwitchChange = vi.fn();
		render(NativeFormHarness, { props: { onSwitchChange } });
		await fireEvent.input(nameInput(), { target: { value: 'Grace' } });
		await fireEvent.click(alerts());
		onSwitchChange.mockClear();
		form().addEventListener('reset', (event) => event.preventDefault());

		form().reset();
		await nextTask();
		await nextTask();
		expect(nameInput()).toHaveValue('Grace');
		expect(alerts()).toHaveAttribute('aria-checked', 'true');
		expect(entries()).toContain('alerts=true');
		expect(onSwitchChange).not.toHaveBeenCalled();
	});

	test('clears the errors a field showed, as a native reset clears user-invalid state', async () => {
		render(NativeFormHarness, { props: { switchRequired: true } });
		// A blocked submit reports the switch's input, and the switch shows its error.
		form().querySelector<HTMLInputElement>('input[name="alerts"]')!.focus();
		await waitFor(() => expect(alerts()).toHaveAttribute('aria-invalid', 'true'));
		const field = alerts().closest('[id$="-field"]') as HTMLElement;
		expect(within(field).getByRole('alert')).toBeInTheDocument();

		alerts().focus();
		alerts().blur();
		await waitFor(() => expect(field).toHaveAttribute('data-touched'));

		form().reset();
		await waitFor(() => expect(alerts()).not.toHaveAttribute('aria-invalid'));
		expect(within(field).queryByRole('alert')).toBeNull();
		expect(field).not.toHaveAttribute('data-touched');
	});

	test('the reset of another form leaves the fields alone', async () => {
		render(NativeFormHarness);
		await fireEvent.input(nameInput(), { target: { value: 'Grace' } });

		otherForm().reset();
		await nextTask();
		await nextTask();
		expect(nameInput()).toHaveValue('Grace');
	});

	test('fields inside an entasis Form follow the native reset and publish one Form value each', async () => {
		const onFormValueChange = vi.fn();
		render(NativeFormHarness, {
			props: {
				scenario: 'entasis-form',
				formValue: { nickname: 'Ada', digest: true },
				onFormValueChange
			}
		});
		const nickname = screen.getByRole('textbox', { name: 'Nickname' });
		const digest = screen.getByRole('switch', { name: 'Weekly digest' });
		await waitFor(() => expect(nickname).toHaveValue('Ada'));
		expect(digest).toHaveAttribute('aria-checked', 'true');

		await fireEvent.input(nickname, { target: { value: 'Grace' } });
		await fireEvent.click(digest);
		onFormValueChange.mockClear();

		form().reset();
		await waitFor(() => expect(nickname).toHaveValue('Ada'));
		expect(digest).toHaveAttribute('aria-checked', 'true');
		expect(onFormValueChange).toHaveBeenLastCalledWith({ nickname: 'Ada', digest: true });
	});
});

describe('form attribute', () => {
	test('controls outside their form submit with the form their form prop names', async () => {
		const onSubmit = vi.fn();
		render(NativeFormHarness, { props: { scenario: 'outside', onSubmit } });
		await fireEvent.click(alerts());

		expect(nameInput()).toHaveAttribute('form', 'profile');
		expect(nameInput().form).toBe(form());
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(onSubmit).toHaveBeenCalledOnce();
		expect(
			[...(onSubmit.mock.calls[0][0] as FormData).entries()].map(
				([key, value]) => `${key}=${value}`
			)
		).toEqual(['name=Ada', 'alerts=true', 'tags=red']);
		expect(entries(otherForm())).toEqual([]);
	});

	test('the named form resets them; the form around them does not', async () => {
		render(NativeFormHarness, { props: { scenario: 'outside' } });
		await fireEvent.input(nameInput(), { target: { value: 'Grace' } });

		otherForm().reset();
		await nextTask();
		await nextTask();
		expect(nameInput()).toHaveValue('Grace');

		form().reset();
		await waitFor(() => expect(nameInput()).toHaveValue('Ada'));
	});

	test('inputs a control renders later join the same form', async () => {
		render(NativeFormHarness, { props: { scenario: 'outside' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
		await waitFor(() =>
			expect([...new FormData(form()).getAll('tags')].map(String)).toEqual(['red', 'green'])
		);
	});
});

describe('form attribute on buttons', () => {
	test('buttons without a type do not become submit buttons of the named form', async () => {
		const onSubmit = vi.fn();
		render(NativeFormHarness, { props: { scenario: 'buttons', onSubmit } });
		const buttons = [...otherForm().querySelectorAll('button')];
		expect(buttons.length).toBeGreaterThan(0);
		for (const button of buttons) expect(button).not.toHaveAttribute('form');

		for (const button of buttons) await fireEvent.click(button);
		await nextTask();
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

describe('native reset of search drafts', () => {
	test('uncommitted text in a combobox or tags input is cleared with the form', async () => {
		render(NativeFormHarness, { props: { scenario: 'drafts' } });
		const combobox = screen.getAllByRole('combobox')[0] as HTMLInputElement;
		const tags = form().querySelector<HTMLInputElement>('input[name="topics"]')!;
		await fireEvent.input(combobox, { target: { value: 'zzz' } });
		await fireEvent.input(tags, { target: { value: 'qqq' } });
		expect(combobox).toHaveValue('zzz');

		form().reset();
		await nextTask();
		await nextTask();
		expect(combobox).toHaveValue('');
		expect(tags).toHaveValue('');
	});
});
