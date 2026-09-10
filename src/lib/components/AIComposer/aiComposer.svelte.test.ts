import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness from './aiComposerLawHarness.test.svelte';

describe('AIComposer value contract', () => {
	test('retains an uncontrolled edit when parent props change', async () => {
		const onValueChange = vi.fn();
		const view = render(Harness, { defaultValue: 'Draft to clear', onValueChange });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Draft to clear'));
		await fireEvent.click(screen.getByRole('button', { name: 'Clear composer' }));
		await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
		await view.rerender({ defaultValue: 'Later default' });
		await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('');
	});

	test('keeps initialization and controlled updates silent, then emits clear once', async () => {
		const onValueChange = vi.fn();
		const view = render(Harness, { defaultValue: 'Initial draft', onValueChange });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Initial draft'));
		expect(onValueChange).not.toHaveBeenCalled();
		await view.rerender({ defaultValue: 'Ignored replacement default' });
		expect(screen.getByRole('textbox')).toHaveTextContent('Initial draft');

		await view.rerender({ value: 'Parent draft' });
		await waitFor(() => expect(screen.getByRole('textbox')).toHaveTextContent('Parent draft'));
		expect(onValueChange).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: 'Clear composer' }));
		await waitFor(() => expect(screen.getByRole('textbox').textContent).toBe(''));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('');

		await fireEvent.click(screen.getByRole('button', { name: 'Clear composer' }));
		expect(onValueChange).toHaveBeenCalledOnce();
	});
});
