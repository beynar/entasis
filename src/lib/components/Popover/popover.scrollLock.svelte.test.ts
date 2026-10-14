// When an open popover locks page scroll (CX-11): a press with a pointer does, a finger does only
// when the panel spans the viewport, and the lock is the attribute on <html>, not inline styles.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import PopoverScrollLockHarness from './PopoverScrollLockHarness.test.svelte';

const LOCK = 'data-entasis-scroll-lock';
const trigger = () => screen.getByRole('button', { name: 'Open popover' });
const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

const touchPress = async () => {
	await fireEvent.pointerDown(trigger(), { pointerType: 'touch' });
	await fireEvent.pointerUp(trigger(), { pointerType: 'touch' });
	await fireEvent.click(trigger(), { detail: 1 });
};
const mousePress = async () => {
	await fireEvent.pointerDown(trigger(), { pointerType: 'mouse' });
	await fireEvent.click(trigger(), { detail: 1 });
};

afterEach(() => vi.restoreAllMocks());

describe('popover scroll lock', () => {
	test('a press with a mouse locks the page with the attribute, not inline styles', async () => {
		render(PopoverScrollLockHarness);
		await mousePress();
		await screen.findByRole('button', { name: 'Inside popover' });
		await waitFor(() => expect(document.documentElement).toHaveAttribute(LOCK));
		expect(document.body.style.overflow).toBe('');
		expect(document.body.style.paddingRight).toBe('');
	});

	test('a tap opens it without locking: the page still scrolls under a narrow panel', async () => {
		render(PopoverScrollLockHarness);
		await touchPress();
		await screen.findByRole('button', { name: 'Inside popover' });
		await settle();
		expect(document.documentElement).not.toHaveAttribute(LOCK);
	});

	test('a tap locks when the panel spans the viewport', async () => {
		const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect');
		rect.mockReturnValue(new DOMRect(0, 0, window.innerWidth - 8, 200));
		render(PopoverScrollLockHarness);
		await touchPress();
		await screen.findByRole('button', { name: 'Inside popover' });
		await waitFor(() => expect(document.documentElement).toHaveAttribute(LOCK));
	});

	test('lockScroll={false} never locks, whatever opened it', async () => {
		render(PopoverScrollLockHarness, { props: { lockScroll: false } });
		await mousePress();
		await screen.findByRole('button', { name: 'Inside popover' });
		await settle();
		expect(document.documentElement).not.toHaveAttribute(LOCK);
	});

	test('closing releases the lock', async () => {
		render(PopoverScrollLockHarness);
		await mousePress();
		await waitFor(() => expect(document.documentElement).toHaveAttribute(LOCK));
		await fireEvent.keyDown(window, { key: 'Escape' });
		await waitFor(() => expect(document.documentElement).not.toHaveAttribute(LOCK));
	});
});
