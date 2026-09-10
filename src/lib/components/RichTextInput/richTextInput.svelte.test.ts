import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness from './richTextInputLawHarness.test.svelte';

describe('RichTextInput state changes', () => {
	test('initializes defaults and accepts parent values without publishing changes', async () => {
		const onValueChange = vi.fn();
		const view = render(Harness, { defaultValue: 'Initial draft', onValueChange });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Initial draft'));
		expect(onValueChange).not.toHaveBeenCalled();
		await view.rerender({ defaultValue: 'Ignored replacement default' });
		expect(screen.getByRole('textbox')).toHaveTextContent('Initial draft');

		await view.rerender({ value: 'Parent draft' });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Parent draft'));
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('publishes clear once and keeps an unchanged value silent', async () => {
		const onValueChange = vi.fn();
		const view = render(Harness, { defaultValue: 'Initial draft', onValueChange });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Initial draft'));
		onValueChange.mockClear();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear editor' }));
		await waitFor(() => expect(onValueChange).toHaveBeenCalledOnce());
		expect(onValueChange).toHaveBeenCalledWith({ markdown: '', tokens: [], isEmpty: true });
		await view.rerender({ defaultValue: 'Later default' });
		await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
		expect(onValueChange).toHaveBeenCalledOnce();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear editor' }));
		await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
		expect(onValueChange).toHaveBeenCalledOnce();
	});
});
