import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import Collapsible from './Collapsible/Collapsible.svelte';
import Command from './Command/Command.svelte';
import PopoverControls from './Form/PopoverControls.test.svelte';
import TextInput from './Form/TextInput/TextInput.svelte';
import SegmentedControl from './SegmentedControl/SegmentedControl.svelte';
import Tabbar from './Tabbar/Tabbar.svelte';
import ToggleButton from './ToggleButton/ToggleButton.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;

beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});

afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

describe('state and event law', () => {
	test('ToggleButton applies defaultValue and emits one value change', async () => {
		const onValueChange = vi.fn();
		render(ToggleButton, {
			props: { ariaLabel: 'Preview', defaultValue: true, onValueChange }
		});

		const button = screen.getByRole('button', { name: 'Preview' });
		expect(button).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(button);

		expect(button).toHaveAttribute('aria-pressed', 'false');
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith(false);
	});

	test('SegmentedControl ignores no-op selection and emits one accepted change', async () => {
		const onValueChange = vi.fn();
		render(SegmentedControl, {
			props: {
				items: [
					{ value: 'grid', label: 'Grid' },
					{ value: 'list', label: 'List' }
				] as const,
				defaultValue: 'list',
				onValueChange
			}
		});

		await fireEvent.click(screen.getByRole('radio', { name: 'List' }));
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('radio', { name: 'Grid' }));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith('grid');
	});

	test('Tabbar emits only when its selected value changes', async () => {
		const onValueChange = vi.fn();
		render(Tabbar, {
			props: {
				items: ['Overview', 'Settings'],
				defaultValue: 1,
				onValueChange
			}
		});

		await fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('tab', { name: 'Overview' }));
		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith(0);
	});

	test('Collapsible applies defaultOpen and emits one disclosure change', async () => {
		const onOpenChange = vi.fn();
		render(Collapsible, {
			props: { defaultOpen: true, onOpenChange }
		});

		const button = screen.getByRole('button');
		expect(button).toHaveAttribute('aria-expanded', 'true');
		await fireEvent.click(button);

		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(onOpenChange).toHaveBeenCalledOnce();
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});

	test('Command uses value for its editable query', async () => {
		const onValueChange = vi.fn();
		render(Command, {
			props: {
				items: [],
				defaultValue: 'initial',
				onValueChange
			}
		});

		const input = screen.getByRole('combobox');
		expect(input).toHaveValue('initial');
		await fireEvent.input(input, { target: { value: 'updated' } });

		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith('updated');
	});

	test('TextInput applies defaultValue and emits one value change', async () => {
		const onValueChange = vi.fn();
		render(TextInput, {
			props: { defaultValue: 'initial', onValueChange }
		});

		const input = screen.getByRole('textbox');
		expect(input).toHaveValue('initial');
		await fireEvent.input(input, { target: { value: 'updated' } });

		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith('updated');
	});

	test('Combobox emits a named value and option payload', async () => {
		const onValueChange = vi.fn();
		render(PopoverControls, {
			props: {
				combobox: {
					defaultValue: 'us',
					items: [{ value: 'us', label: 'United States' }],
					onValueChange
				}
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

		expect(onValueChange).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledWith({ value: null, option: null });
	});
});
