// The input follows a value that arrives from outside, and leaves what a person is typing alone.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import TimeInputValueHarness from './TimeInputValueHarness.test.svelte';

const field = () => page.getByRole('textbox', { name: 'Field', exact: true });
const press = (id: string) => (page.getByTestId(id).element() as HTMLElement).click();

test('a value set after mounting shows in the input', async () => {
	await render(TimeInputValueHarness);
	await expect.element(field()).toHaveValue('');
	press('noon');
	await expect.element(field()).toHaveValue('12:00');
});

test('midnight shows, and clearing the value empties the input', async () => {
	await render(TimeInputValueHarness, { props: { value: 3600000 } });
	await expect.element(field()).toHaveValue('01:00');
	press('midnight');
	await expect.element(field()).toHaveValue('00:00');
	press('clear');
	await expect.element(field()).toHaveValue('');
});

test('a value in another unit shows in the format asked for', async () => {
	await render(TimeInputValueHarness, {
		props: { as: 'millisecondSinceMidnight', format: 'HH:MM:SS' }
	});
	press('noon');
	await expect.element(field()).toHaveValue('12:00:00');
});

test('a value a Form receives after mounting shows in its field', async () => {
	await render(TimeInputValueHarness);
	const inForm = page.getByRole('textbox', { name: 'Form field' });
	await expect.element(inForm).toHaveValue('');
	press('form-now');
	await expect.element(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Set');
	await expect.element(inForm).toHaveValue('09:30');
});

test('the initial value of a Form shows in its field', async () => {
	await render(TimeInputValueHarness, { props: { formStart: 8 * 3600000 } });
	await expect.element(page.getByRole('textbox', { name: 'Form field' })).toHaveValue('08:00');
});

test('a value set while the field has focus waits for it to leave', async () => {
	await render(TimeInputValueHarness);
	await userEvent.click(field());
	await userEvent.keyboard('08');
	await expect.element(field()).toHaveValue('08');
	press('noon');
	await expect.element(page.getByTestId('value')).toHaveTextContent('43200000');
	await expect.element(field()).toHaveValue('08');
	(field().element() as HTMLElement).blur();
	await expect.element(field()).toHaveValue('12:00');
});

test('what a person typed stays as typed when they leave', async () => {
	await render(TimeInputValueHarness);
	await userEvent.click(field());
	await userEvent.keyboard('08');
	(field().element() as HTMLElement).blur();
	await expect.element(page.getByTestId('value')).toHaveTextContent('28800000');
	await expect.element(field()).toHaveValue('08');
});

test('emptying the input and leaving does not write midnight back', async () => {
	await render(TimeInputValueHarness, { props: { value: 3600000 } });
	await userEvent.click(field());
	await userEvent.clear(field());
	(field().element() as HTMLElement).blur();
	await expect.element(field()).toHaveValue('');
});

test('typing right after the click that opens the picker goes in the input', async () => {
	await render(TimeInputValueHarness);
	await userEvent.click(field());
	await userEvent.keyboard('0930');
	await expect.element(field()).toHaveValue('09:30');
	await expect.element(page.getByTestId('value')).toHaveTextContent('34200000');
});

test('a value typed, moved from outside and moved back shows again', async () => {
	await render(TimeInputValueHarness);
	await userEvent.click(field());
	await userEvent.keyboard('12:00');
	(field().element() as HTMLElement).blur();
	press('midnight');
	await expect.element(field()).toHaveValue('00:00');
	press('noon');
	await expect.element(field()).toHaveValue('12:00');
});
