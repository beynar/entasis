import '@testing-library/jest-dom/vitest';
import { fireEvent, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Button from './Button.svelte';
import { renderInTheme } from '../Theme/renderInTheme.test-helper.js';

describe('Button behavior', () => {
	test('keeps enabled buttons natively interactive', async () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Save', onclick });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).not.toBeDisabled();

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		button.dispatchEvent(click);

		expect(onclick).toHaveBeenCalledOnce();
		expect(onclick.mock.calls[0]?.[0]).toBe(click);
	});

	test('uses native disabled button behavior', async () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Save', disabled: true, onclick });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeDisabled();

		await fireEvent.click(button);

		expect(onclick).not.toHaveBeenCalled();
	});

	test('keeps enabled anchors as native links', () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Continue', href: '#destination', onclick });

		const anchor = screen.getByRole('link', { name: 'Continue' });
		expect(anchor).toHaveAttribute('href', '#destination');
		expect(anchor).not.toHaveAttribute('aria-disabled');
		expect(anchor).not.toHaveAttribute('tabindex');

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(anchor.dispatchEvent(click)).toBe(true);
		expect(onclick.mock.calls[0]?.[0]).toBe(click);
	});

	test('blocks disabled anchor pointer and keyboard activation', async () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Continue', href: '#destination', disabled: true, onclick });

		const anchor = screen.getByRole('link', { name: 'Continue' });
		expect(anchor).not.toHaveAttribute('href');
		expect(anchor).toHaveAttribute('aria-disabled', 'true');
		expect(anchor).toHaveAttribute('tabindex', '-1');

		const pointerClick = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(anchor.dispatchEvent(pointerClick)).toBe(false);
		await fireEvent.keyDown(anchor, { key: 'Enter' });
		anchor.click();

		expect(onclick).not.toHaveBeenCalled();
	});

	test('passes native pointer events to pointer handlers', async () => {
		const onpointerenter = vi.fn();
		const onpointerleave = vi.fn();
		renderInTheme(Button, { children: 'Hover', onpointerenter, onpointerleave });

		const button = screen.getByRole('button', { name: 'Hover' });
		const enter = new PointerEvent('pointerenter');
		const leave = new PointerEvent('pointerleave');
		button.dispatchEvent(enter);
		button.dispatchEvent(leave);

		expect(onpointerenter).toHaveBeenCalledWith(enter);
		expect(onpointerleave).toHaveBeenCalledWith(leave);
	});
});
