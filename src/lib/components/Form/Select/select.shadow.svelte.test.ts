// The open Select's page-scroll guard in a shadow root (CX-12): the panel mounts in the root, where
// `document.getElementById` cannot see it, and a window listener hears the root's events with the
// host as their target.
import '@testing-library/jest-dom/vitest';
import { render, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import SelectHarness from './SelectHarness.test.svelte';

const items = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' }
];

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const wheel = (target: EventTarget) => {
	const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, composed: true });
	target.dispatchEvent(event);
	return event;
};

describe('Select page-scroll guard in a shadow root', () => {
	test('lets the open list scroll and still blocks the page', async () => {
		const host = document.createElement('div');
		document.body.append(host);
		const shadow = host.attachShadow({ mode: 'open' });
		render(SelectHarness, { target: shadow, props: { label: 'Produce', items } });

		shadow.querySelector<HTMLElement>('[role="combobox"]')!.click();
		await waitFor(() => expect(shadow.querySelector('[role="listbox"]')).not.toBeNull());
		const listbox = shadow.querySelector('[role="listbox"]')!;
		expect(listbox.isConnected).toBe(true);
		expect(document.getElementById(listbox.id)).toBeNull();

		expect(wheel(listbox).defaultPrevented).toBe(false);
		expect(wheel(document.body).defaultPrevented).toBe(true);
		host.remove();
	});
});
