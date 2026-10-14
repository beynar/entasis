// A toolbar keeps disabled items reachable (they announce `aria-disabled` and refuse activation),
// keeps one tab stop when every item is disabled, and leaves a text field's own keys alone.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import ToggleMenuHarness from './ToggleMenuHarness.test.svelte';

const tabStops = () =>
	Array.from(screen.getByRole('toolbar').querySelectorAll<HTMLElement>('[tabindex="0"]'));

describe('disabled items stay reachable', () => {
	test('a11y:toggle-menu.disabled-reachable arrow keys land on a disabled toggle, which says so and ignores Space', async () => {
		render(ToggleMenuHarness, { props: { itemDisabled: true } });
		const bold = screen.getByRole('button', { name: 'Bold' });
		const italic = screen.getByRole('button', { name: 'Italic' });
		bold.focus();
		await fireEvent.focusIn(bold);

		await fireEvent.keyDown(bold, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(italic);
		expect(italic).toHaveAttribute('aria-disabled', 'true');
		expect(italic).not.toBeDisabled();

		await fireEvent.keyDown(italic, { key: ' ' });
		await fireEvent.click(italic);
		expect(italic).toHaveAttribute('aria-pressed', 'false');
	});

	test('a disabled radio is reachable and cannot be chosen', async () => {
		render(ToggleMenuHarness, { props: { itemDisabled: true } });
		const left = screen.getByRole('radio', { name: 'Left' });
		const right = screen.getByRole('radio', { name: 'Right' });
		left.focus();
		await fireEvent.focusIn(left);
		await fireEvent.keyDown(left, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(right);
		expect(right).toHaveAttribute('aria-disabled', 'true');

		await fireEvent.click(right);
		expect(left).toHaveAttribute('aria-checked', 'true');
		expect(right).toHaveAttribute('aria-checked', 'false');
	});

	test('a fully disabled toolbar still has exactly one tab stop', () => {
		render(ToggleMenuHarness, { props: { disabled: true } });
		const stops = tabStops();
		expect(stops).toHaveLength(1);
		expect(stops[0]).toBe(screen.getByRole('button', { name: 'Bold' }));
		expect(stops[0]).toHaveAttribute('aria-disabled', 'true');
	});

	test('an enabled toolbar keeps its single tab stop too', () => {
		render(ToggleMenuHarness);
		expect(tabStops()).toHaveLength(1);
	});
});

describe('a text field inside the toolbar', () => {
	test('spaces type and the caret moves inside the text', async () => {
		render(ToggleMenuHarness);
		const field = screen.getByRole('textbox', { name: 'Font size' }) as HTMLInputElement;
		field.focus();
		field.setSelectionRange(1, 1);

		const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
		field.dispatchEvent(space);
		expect(space.defaultPrevented).toBe(false);

		const left = new KeyboardEvent('keydown', {
			key: 'ArrowLeft',
			bubbles: true,
			cancelable: true
		});
		field.dispatchEvent(left);
		expect(left.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(field);

		const home = new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true });
		field.dispatchEvent(home);
		expect(home.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(field);
	});

	test('an arrow pointing past the caret edge moves to the next item', async () => {
		render(ToggleMenuHarness);
		const field = screen.getByRole('textbox', { name: 'Font size' }) as HTMLInputElement;
		field.focus();
		field.setSelectionRange(field.value.length, field.value.length);

		await fireEvent.keyDown(field, { key: 'ArrowRight' });
		expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Left' }));
	});
});
