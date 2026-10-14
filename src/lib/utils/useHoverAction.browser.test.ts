// Hover opening with real pointer input (MN-7), in Chromium and WebKit: a real hover opens after
// its delay, leaving cancels it, and a trigger that appears under a resting pointer (WebKit
// reports that as an enter at the resting point) waits for the pointer to move.
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './HoverActionHarness.test.svelte';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

afterEach(async () => {
	// Park the pointer away from where the next test renders.
	await userEvent.hover(document.documentElement, { position: { x: 600, y: 400 } });
});

const place = (element: HTMLElement, zIndex: number) =>
	Object.assign(element.style, {
		position: 'fixed',
		left: '100px',
		top: '100px',
		width: '120px',
		height: '60px',
		zIndex: String(zIndex)
	});

test('a real hover opens after the delay and leaving first cancels it', async () => {
	const onEnter = vi.fn();
	// Long enough to outlast the round trips of the two pointer moves below.
	const screen = await render(Harness, { props: { onEnter, delay: 600 } });
	const trigger = screen.getByRole('button').element() as HTMLElement;

	await userEvent.hover(trigger);
	await userEvent.hover(screen.getByTestId('outside').element());
	await sleep(800);
	expect(onEnter).not.toHaveBeenCalled();

	await userEvent.hover(trigger);
	await expect.poll(() => onEnter.mock.calls.length, { timeout: 1000 }).toBe(1);
});

test('a trigger that appears under the resting pointer waits for it to move', async () => {
	const onEnter = vi.fn();
	const screen = await render(Harness, { props: { onEnter, delay: 50 } });
	const trigger = screen.getByRole('button').element() as HTMLElement;
	const cover = screen.getByTestId('outside').element() as HTMLElement;
	place(trigger, 1);
	place(cover, 2);

	// The pointer rests on the cover; removing it leaves the trigger right under the pointer.
	await userEvent.hover(cover);
	cover.remove();
	await sleep(300);
	expect(onEnter).not.toHaveBeenCalled();

	// Any real move over it is a hover.
	await userEvent.hover(trigger, { position: { x: 10, y: 10 } });
	await expect.poll(() => onEnter.mock.calls.length, { timeout: 1000 }).toBe(1);
});
