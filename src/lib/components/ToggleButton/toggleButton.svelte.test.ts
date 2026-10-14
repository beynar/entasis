import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import ToggleButton from './ToggleButton.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

describe('ToggleButton disabled', () => {
	test('disabled alone removes the button from the tab order with the native attribute', async () => {
		const onValueChange = vi.fn();
		renderInTheme(ToggleButton, { children: 'Bold', disabled: true, onValueChange });

		const button = screen.getByRole('button', { name: 'Bold' });
		expect(button).toBeDisabled();
		expect(button).not.toHaveAttribute('aria-disabled');
		expect(button.className).toContain('pointer-events-none');

		await fireEvent.click(button);
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('focusableWhenDisabled keeps the button focusable and announces aria-disabled', () => {
		renderInTheme(ToggleButton, {
			children: 'Bold',
			disabled: true,
			focusableWhenDisabled: true
		});

		const button = screen.getByRole('button', { name: 'Bold' });
		expect(button).not.toBeDisabled();
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(button.className).not.toContain('pointer-events-none');

		button.focus();
		expect(document.activeElement).toBe(button);
	});

	test('focusableWhenDisabled does nothing without disabled', () => {
		renderInTheme(ToggleButton, { children: 'Bold', focusableWhenDisabled: true });

		const button = screen.getByRole('button', { name: 'Bold' });
		expect(button).not.toBeDisabled();
		expect(button).not.toHaveAttribute('aria-disabled');
	});

	test('a focusable disabled toggle refuses clicks, Enter and Space before any handler runs', async () => {
		const onValueChange = vi.fn();
		const onclick = vi.fn();
		renderInTheme(ToggleButton, {
			children: 'Bold',
			disabled: true,
			focusableWhenDisabled: true,
			onValueChange
		});

		const button = screen.getByRole('button', { name: 'Bold' });
		button.addEventListener('click', onclick);
		const activation = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(button.dispatchEvent(activation)).toBe(false);
		button.click();
		await fireEvent.click(button);

		expect(onValueChange).not.toHaveBeenCalled();
		expect(onclick).not.toHaveBeenCalled();
		expect(button).toHaveAttribute('aria-pressed', 'false');
	});

	test('toggles again once enabled', async () => {
		const onValueChange = vi.fn();
		const { rerender } = renderInTheme(ToggleButton, {
			children: 'Bold',
			disabled: true,
			focusableWhenDisabled: true,
			onValueChange
		});

		const button = screen.getByRole('button', { name: 'Bold' });
		button.click();
		expect(onValueChange).not.toHaveBeenCalled();

		await rerender({
			children: 'Bold',
			disabled: false,
			focusableWhenDisabled: true,
			onValueChange
		});
		expect(button).not.toHaveAttribute('aria-disabled');
		button.click();
		expect(onValueChange).toHaveBeenCalledWith(true);
	});
});
