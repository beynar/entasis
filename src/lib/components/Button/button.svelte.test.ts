import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Button from './Button.svelte';
import ButtonInForm from './ButtonInForm.test.svelte';
import type { ButtonPrimitiveProps } from './button.props.js';
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

	test('renders a button, never an anchor without href, whatever stray props it receives', () => {
		// `as` was a dead prop that turned the root into an <a> with no href, which is not focusable.
		const stray = { as: 'a' } as Record<string, unknown>;
		renderInTheme(Button, { children: 'Save', ...stray });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.tagName).toBe('BUTTON');
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});
});

describe('Button loading', () => {
	test('a11y:button.loading-stays-focusable marks the button busy and unavailable without native disabled', () => {
		renderInTheme(Button, { children: 'Save', loading: true });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).not.toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).toHaveAttribute('aria-disabled', 'true');

		button.focus();
		expect(document.activeElement).toBe(button);
	});

	test('ignores keyboard activation while loading', async () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Save', loading: true, onclick });

		const button = screen.getByRole('button', { name: 'Save' });
		button.focus();
		// Enter and Space on a focused <button> dispatch a click; that click must be cancelled.
		const activation = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(button.dispatchEvent(activation)).toBe(false);
		button.click();
		await fireEvent.click(button);

		expect(onclick).not.toHaveBeenCalled();
	});

	test('a loading submit button does not submit its form', async () => {
		const onSubmit = vi.fn();
		render(ButtonInForm, { props: { loading: true, onSubmit } });

		const button = screen.getByRole('button', { name: 'Send' });
		button.click();
		await fireEvent.click(button);

		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('a loading submit button with a click handler neither calls it nor submits', async () => {
		const onSubmit = vi.fn();
		const onclick = vi.fn();
		render(ButtonInForm, { props: { loading: true, onSubmit, onclick } });

		screen.getByRole('button', { name: 'Send' }).click();

		expect(onSubmit).not.toHaveBeenCalled();
		expect(onclick).not.toHaveBeenCalled();
	});

	test('submits again once loading ends', async () => {
		const onSubmit = vi.fn();
		const { rerender } = render(ButtonInForm, { props: { loading: true, onSubmit } });

		const button = screen.getByRole('button', { name: 'Send' });
		button.click();
		expect(onSubmit).not.toHaveBeenCalled();

		await rerender({ loading: false, onSubmit });
		expect(button).not.toHaveAttribute('aria-busy');
		expect(button).not.toHaveAttribute('aria-disabled');
		button.click();
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	test('keeps focus on the button when loading turns on', async () => {
		const { rerender } = renderInTheme(Button, { children: 'Save' });

		const button = screen.getByRole('button', { name: 'Save' });
		button.focus();
		await rerender({ children: 'Save', loading: true });

		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).not.toBeDisabled();
		expect(document.activeElement).toBe(button);
	});

	test('a disabled and loading button keeps native disabled without a second aria-disabled', () => {
		renderInTheme(Button, { children: 'Save', loading: true, disabled: true });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute('aria-busy', 'true');
		expect(button).not.toHaveAttribute('aria-disabled');
	});

	test('a loading anchor stays focusable but does not navigate', () => {
		const onclick = vi.fn();
		renderInTheme(Button, { children: 'Continue', href: '#next', loading: true, onclick });

		const anchor = screen.getByRole('link', { name: 'Continue' });
		expect(anchor).toHaveAttribute('href', '#next');
		expect(anchor).not.toHaveAttribute('tabindex');
		expect(anchor).toHaveAttribute('aria-disabled', 'true');
		expect(anchor).toHaveAttribute('aria-busy', 'true');

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(anchor.dispatchEvent(click)).toBe(false);
		expect(onclick).not.toHaveBeenCalled();
	});
});

describe('Button props', () => {
	test('has no `as` prop: href alone makes the root an anchor', () => {
		const props: ButtonPrimitiveProps = {
			children: 'Save',
			// @ts-expect-error `as` was removed; render an anchor with `href`.
			as: 'string'
		};
		expect(props.children).toBe('Save');
	});
});
