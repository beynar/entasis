// Toast announcements, labelling and focus (DF-4): an always-present region with persistent live
// regions, toasts as labelled groups, and focus that follows a toast leaving instead of dropping
// to the page.
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './ToasterHarness.test.svelte';
import { toast, type Toaster } from './toast.state.svelte.js';

const toaster = () => window.toaster as Toaster;
const items = () => document.querySelectorAll<HTMLElement>('section[data-live-region] > li');
const region = () => screen.getByRole('region', { name: 'Notifications' });
const liveRegion = (politeness: 'polite' | 'assertive') =>
	region().querySelector<HTMLElement>(`[data-live-region="${politeness}"]`)!;

describe('Toaster region and announcements', () => {
	test('the region and both live regions exist before the first toast', async () => {
		render(Harness);
		await tick();
		expect(region()).toBeVisible();
		expect(region()).not.toHaveAttribute('hidden');
		expect(liveRegion('polite')).toHaveAttribute('role', 'status');
		expect(liveRegion('polite')).toHaveAttribute('aria-live', 'polite');
		expect(liveRegion('assertive')).toHaveAttribute('role', 'alert');
		expect(liveRegion('assertive')).toHaveAttribute('aria-live', 'assertive');
		expect(liveRegion('polite')).toBeEmptyDOMElement();
	});

	test('a toast is announced in the persistent polite region with its title and description', async () => {
		render(Harness);
		toast.success({ title: 'Saved', description: 'Your changes are live.', duration: false });
		await waitFor(() =>
			expect(liveRegion('polite')).toHaveTextContent('Saved. Your changes are live.')
		);
		expect(liveRegion('assertive')).toBeEmptyDOMElement();
	});

	test('an important toast is announced in the assertive region', async () => {
		render(Harness);
		toast.danger({ title: 'Payment failed', important: true, duration: false });
		await waitFor(() => expect(liveRegion('assertive')).toHaveTextContent('Payment failed'));
		expect(liveRegion('polite')).toBeEmptyDOMElement();
	});

	test('a toast queued before the Toaster mounted is announced once it shows', async () => {
		toast.info({ title: 'Early', duration: false });
		render(Harness);
		await waitFor(() => expect(liveRegion('polite')).toHaveTextContent('Early'));
	});

	test('updating a toast announces its new text', async () => {
		render(Harness);
		const shown = toast.primary({ id: 'save', title: 'Saving', loading: true, duration: false });
		await waitFor(() => expect(liveRegion('polite')).toHaveTextContent('Saving'));
		shown.update({ title: 'Saved', loading: false });
		await waitFor(() => expect(liveRegion('polite')).toHaveTextContent('Saved'));
		expect(liveRegion('polite')).not.toHaveTextContent('Saving');
	});

	test('the toasts are not live regions of their own', async () => {
		render(Harness);
		toast.info({ title: 'Plain', duration: false });
		toast.danger({ title: 'Loud', important: true, duration: false });
		await tick();
		for (const li of items()) {
			expect(li).not.toHaveAttribute('aria-live');
			expect(li).not.toHaveAttribute('role', 'status');
			expect(li).not.toHaveAttribute('role', 'alert');
		}
	});

	test('the region stays in the document, empty, after the last toast leaves', async () => {
		render(Harness);
		const shown = toast.info({ title: 'Brief', duration: false });
		await tick();
		shown.remove();
		await waitFor(() => expect(items()).toHaveLength(0));
		expect(region()).toBeInTheDocument();
		expect(liveRegion('polite')).toBeInTheDocument();
	});

	test('toasts created in the same tick are all announced, in one message', async () => {
		render(Harness);
		await tick();
		const seen: string[] = [];
		const observer = new MutationObserver(() => {
			const text = liveRegion('polite').textContent ?? '';
			if (text) seen.push(text);
		});
		observer.observe(liveRegion('polite'), { childList: true, characterData: true, subtree: true });
		toast.info({ title: 'Alpha', duration: false });
		toast.info({ title: 'Beta', duration: false });
		await waitFor(() => expect(liveRegion('polite')).toHaveTextContent('Alpha'));
		expect(liveRegion('polite')).toHaveTextContent('Alpha. Beta');
		observer.disconnect();
		expect(seen.every((text) => text.includes('Alpha'))).toBe(true);
	});

	test('direction sets the text and layout direction of the region', async () => {
		render(Harness, { direction: 'rtl' });
		await tick();
		expect(region()).toHaveAttribute('dir', 'rtl');
	});

	test('without a direction the region inherits the page', async () => {
		render(Harness);
		await tick();
		expect(region()).not.toHaveAttribute('dir');
	});
});

describe('F6 and the region', () => {
	test('F6 with no toast on screen leaves focus where it is', async () => {
		const input = document.createElement('input');
		document.body.append(input);
		render(Harness);
		await tick();
		input.focus();
		toaster().focusRegion();
		expect(document.activeElement).toBe(input);
		input.remove();
	});

	test('focus on the region holds the timers of every stack, and releases them when it leaves', async () => {
		const outside = document.createElement('button');
		document.body.append(outside);
		render(Harness);
		const shown = toast.info({ title: 'Timed', duration: 5000 });
		await tick();
		outside.focus();
		toaster().focusRegion();
		expect(document.activeElement).toBe(region());
		expect(shown.timer?.heldBy).toEqual(['focus']);

		outside.focus();
		expect(shown.timer?.heldBy).toEqual([]);
		outside.remove();
	});

	test('focus that reaches the region without the keyboard holds nothing', async () => {
		render(Harness);
		const shown = toast.info({ title: 'Timed', duration: 5000 });
		await tick();
		// jsdom never reports a programmatic focus as `:focus-visible`, as for a pointer user.
		region().focus();
		expect(document.activeElement).toBe(region());
		expect(shown.timer?.heldBy).toEqual([]);
		// F6 is keyboard intent even while the region already has focus.
		toaster().focusRegion();
		expect(shown.timer?.heldBy).toEqual(['focus']);
	});

	test('moving from the region to a toast keeps the hold', async () => {
		render(Harness);
		const shown = toast.info({ title: 'Timed', duration: 5000 });
		await tick();
		toaster().focusRegion();
		expect(shown.timer?.heldBy).toEqual(['focus']);
		items()[0].focus();
		// A programmatic focus is not `:focus-visible` in jsdom; only the region's hold is gone.
		expect(document.activeElement).toBe(items()[0]);
	});

	test('the element F6 left is forgotten once focus goes elsewhere on its own', async () => {
		const a = document.createElement('button');
		const b = document.createElement('button');
		document.body.append(a, b);
		render(Harness);
		toast.info({ title: 'Only', duration: false });
		await tick();
		a.focus();
		toaster().focusRegion();
		b.focus();
		items()[0].focus();
		toaster().toasts[0].remove();
		await tick();
		await tick();
		expect(document.activeElement).not.toBe(a);
		a.remove();
		b.remove();
	});
});

describe('toast labelling', () => {
	test('a toast is a group named by its title and described by its description', async () => {
		render(Harness);
		toast.info({ title: 'Update ready', description: 'Restart to apply it.', duration: false });
		const group = await screen.findByRole('group', { name: 'Update ready' });
		expect(group).toHaveAccessibleDescription('Restart to apply it.');
	});

	test('a toast with a description only is named by it', async () => {
		render(Harness);
		toast.info({ description: 'Copied to the clipboard', duration: false });
		const group = await screen.findByRole('group', { name: 'Copied to the clipboard' });
		expect(group).not.toHaveAttribute('aria-describedby');
	});

	test('every toast has its own ids', async () => {
		render(Harness);
		toast.info({ title: 'One', duration: false });
		toast.info({ title: 'Two', duration: false });
		await tick();
		const ids = [...items()].map((li) => li.getAttribute('aria-labelledby'));
		expect(new Set(ids).size).toBe(2);
		for (const li of items()) {
			expect(document.getElementById(li.getAttribute('aria-labelledby')!)).toBeInTheDocument();
		}
	});
});

describe('focus when a toast leaves', () => {
	test('dismissing the focused toast moves focus to the next toast of its stack', async () => {
		render(Harness, { position: 'bottom-right' });
		const first = toast.info({ title: 'First', duration: false });
		toast.info({ title: 'Second', duration: false });
		toast.info({ title: 'Third', duration: false });
		await tick();
		const [, second, third] = [...items()];
		second.focus();
		expect(document.activeElement).toBe(second);
		void first;

		toaster().toasts[1].remove();
		await tick();
		await tick();
		// The next newer toast takes over the position.
		expect(document.activeElement).toBe(third);
	});

	test('the newest toast dismissed hands focus to the one behind it', async () => {
		render(Harness, { position: 'bottom-right' });
		toast.info({ title: 'Older', duration: false });
		toast.info({ title: 'Newer', duration: false });
		await tick();
		const [older, newer] = [...items()];
		newer.focus();
		toaster().toasts[1].remove();
		await tick();
		await tick();
		expect(document.activeElement).toBe(older);
	});

	test('pressing Enter on the close button of the last toast returns focus to where F6 left', async () => {
		const outside = document.createElement('button');
		outside.textContent = 'Outside';
		document.body.append(outside);
		render(Harness);
		toast.info({ title: 'Only', duration: false });
		await tick();
		outside.focus();
		toaster().focusRegion();
		expect(document.activeElement).toBe(region());

		const close = screen.getByRole('button', { name: 'Dismiss notification' });
		close.focus();
		close.click();
		await tick();
		await tick();
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	test('with no earlier focus the region keeps it instead of the page body', async () => {
		render(Harness);
		toast.info({ title: 'Only', duration: false });
		await tick();
		items()[0].focus();
		toaster().toasts[0].remove();
		await tick();
		await tick();
		expect(document.activeElement).toBe(region());
	});

	test('focus that moved elsewhere on its own is left alone', async () => {
		const outside = document.createElement('button');
		document.body.append(outside);
		render(Harness);
		toast.info({ title: 'Only', duration: false });
		await tick();
		items()[0].focus();
		toaster().toasts[0].remove();
		outside.focus();
		await tick();
		await tick();
		expect(document.activeElement).toBe(outside);
		outside.remove();
	});

	test('a focused toast pushed past visibleToasts hands its focus to a visible one', async () => {
		render(Harness, { position: 'bottom-right', visibleToasts: 1 });
		toast.info({ title: 'Old', duration: false });
		await tick();
		items()[0].focus();
		toast.info({ title: 'New', duration: false });
		await tick();
		await tick();
		const [old, fresh] = [...items()];
		expect(old).toHaveAttribute('inert');
		expect(document.activeElement).toBe(fresh);
	});
});
