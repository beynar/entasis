import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, test, vi } from 'vitest';
import Button from './Button.svelte';
import ButtonInForm from './ButtonInForm.test.svelte';
import ButtonPopoverTrigger from './ButtonPopoverTrigger.test.svelte';
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

	test('a loading popover trigger stays closed on Enter or Space', async () => {
		// `{@attach popover.trigger}` listens for `click` on the button itself, ahead of Svelte's
		// delegated handlers, so the refusal has to happen on the element first.
		const settle = () => new Promise((resolve) => setTimeout(resolve, 10));
		const { rerender } = render(ButtonPopoverTrigger, { props: { loading: true } });

		const button = screen.getByRole('button', { name: 'Export' });
		button.focus();
		button.click();
		await settle();
		expect(button).toHaveAttribute('aria-expanded', 'false');
		expect(screen.queryByText('Export options')).not.toBeInTheDocument();

		await rerender({ loading: false });
		button.click();
		await settle();
		expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	test('a loading anchor portaled outside the app root is cancelled before a router on <html> sees the click', () => {
		// SvelteKit's router listens on <html>. For content a portal moved to <body>, that listener
		// runs before Svelte's delegated handlers, so it must already see a cancelled click.
		renderInTheme(Button, { children: 'Continue', href: '/next', loading: true });
		const anchor = screen.getByRole('link', { name: 'Continue' });
		document.body.append(anchor);

		const seenByRouter: boolean[] = [];
		const router = (event: MouseEvent) => seenByRouter.push(event.defaultPrevented);
		document.documentElement.addEventListener('click', router);
		try {
			const click = new MouseEvent('click', { bubbles: true, cancelable: true });
			expect(anchor.dispatchEvent(click)).toBe(false);
			expect(seenByRouter).not.toContain(false);
		} finally {
			document.documentElement.removeEventListener('click', router);
		}
	});
});

describe('Button focusableWhenDisabled', () => {
	test('a disabled button stays focusable and announces aria-disabled instead of the native attribute', () => {
		renderInTheme(Button, { children: 'Publish', disabled: true, focusableWhenDisabled: true });

		const button = screen.getByRole('button', { name: 'Publish' });
		expect(button).not.toBeDisabled();
		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(button).not.toHaveAttribute('aria-busy');

		button.focus();
		expect(document.activeElement).toBe(button);
	});

	test('does nothing without disabled', () => {
		renderInTheme(Button, { children: 'Publish', focusableWhenDisabled: true });

		const button = screen.getByRole('button', { name: 'Publish' });
		expect(button).not.toHaveAttribute('aria-disabled');
		expect(button).not.toBeDisabled();
	});

	test('disabled alone still removes the button from the tab order with the native attribute', () => {
		renderInTheme(Button, { children: 'Publish', disabled: true });

		const button = screen.getByRole('button', { name: 'Publish' });
		expect(button).toBeDisabled();
		expect(button).not.toHaveAttribute('aria-disabled');
	});

	test('cancels pointer, Enter and Space activation before the click handler runs', async () => {
		const onclick = vi.fn();
		renderInTheme(Button, {
			children: 'Publish',
			disabled: true,
			focusableWhenDisabled: true,
			onclick
		});

		const button = screen.getByRole('button', { name: 'Publish' });
		const activation = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(button.dispatchEvent(activation)).toBe(false);
		button.click();
		await fireEvent.click(button);

		expect(onclick).not.toHaveBeenCalled();
	});

	test('a disabled focusable submit button does not submit its form, and submits once enabled', async () => {
		const onSubmit = vi.fn();
		const { rerender } = render(ButtonInForm, {
			props: { disabled: true, focusableWhenDisabled: true, onSubmit }
		});

		const button = screen.getByRole('button', { name: 'Send' });
		button.click();
		expect(onSubmit).not.toHaveBeenCalled();

		await rerender({ disabled: false, focusableWhenDisabled: true, onSubmit });
		expect(button).not.toHaveAttribute('aria-disabled');
		button.click();
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	test('focus stays on the button when it becomes disabled', async () => {
		const { rerender } = renderInTheme(Button, {
			children: 'Publish',
			focusableWhenDisabled: true
		});

		const button = screen.getByRole('button', { name: 'Publish' });
		button.focus();
		await rerender({ children: 'Publish', focusableWhenDisabled: true, disabled: true });

		expect(button).toHaveAttribute('aria-disabled', 'true');
		expect(document.activeElement).toBe(button);
	});

	test('a disabled focusable anchor drops its href, takes the tab order and refuses navigation', () => {
		const onclick = vi.fn();
		renderInTheme(Button, {
			children: 'Docs',
			href: '#docs',
			disabled: true,
			focusableWhenDisabled: true,
			onclick
		});

		const anchor = screen.getByRole('link', { name: 'Docs' });
		expect(anchor).not.toHaveAttribute('href');
		expect(anchor).toHaveAttribute('tabindex', '0');
		expect(anchor).toHaveAttribute('aria-disabled', 'true');

		anchor.focus();
		expect(document.activeElement).toBe(anchor);
		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		expect(anchor.dispatchEvent(click)).toBe(false);
		expect(onclick).not.toHaveBeenCalled();
	});
});

describe('Button pointer events', () => {
	test('a loading button keeps receiving pointer events so a second click cannot fall through', () => {
		renderInTheme(Button, { children: 'Save', loading: true });

		const button = screen.getByRole('button', { name: 'Save' });
		expect(button.className).not.toContain('pointer-events-none');
	});

	test('a natively disabled button ignores pointer events; a focusable disabled one keeps them', () => {
		const { unmount } = renderInTheme(Button, { children: 'Save', disabled: true });
		expect(screen.getByRole('button', { name: 'Save' }).className).toContain('pointer-events-none');
		unmount();

		renderInTheme(Button, { children: 'Save', disabled: true, focusableWhenDisabled: true });
		expect(screen.getByRole('button', { name: 'Save' }).className).not.toContain(
			'pointer-events-none'
		);
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
