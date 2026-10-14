// Slider behaviour that needs a real engine: label focus, the focus ring that follows the hidden
// range input, tab order and pointer presses on a laid-out track. Chromium and WebKit.
import { expect, test, vi } from 'vitest';
import { page, server, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import SliderHarness from './SliderHarness.test.svelte';

// The WebKit build under test tabs only through text fields (as Safari does by default) and does
// not focus a range input from its label, so those checks run in Chromium.
const chromiumOnly = server.browser === 'chromium' ? test : test.skip;

const thumbs = () => [...document.querySelectorAll<HTMLInputElement>('input[type="range"]')];
const visualOf = (input: HTMLInputElement) =>
	input
		.closest('[data-slider-thumb-root]')!
		.querySelector<HTMLElement>('[data-slider-thumb-visual]')!;

chromiumOnly('clicking the label focuses the first thumb', async () => {
	render(SliderHarness, { props: { label: 'Budget', mode: 'range', defaultValue: [20, 60] } });

	await userEvent.click(page.getByText('Budget'));
	await expect.poll(() => document.activeElement).toBe(thumbs()[0]);
});

chromiumOnly('Tab visits one stop per thumb and the focus ring shows on the thumb', async () => {
	render(SliderHarness, {
		props: { label: 'Budget', mode: 'range', defaultValue: [20, 60], thumbDisabled: [false, false] }
	});

	await userEvent.tab();
	expect(document.activeElement).toBe(thumbs()[0]);
	expect(getComputedStyle(visualOf(thumbs()[0])).boxShadow).not.toBe('none');
	await userEvent.tab();
	expect(document.activeElement).toBe(thumbs()[1]);
	expect(getComputedStyle(visualOf(thumbs()[0])).boxShadow).not.toBe(
		getComputedStyle(visualOf(thumbs()[1])).boxShadow
	);
});

chromiumOnly('a disabled thumb is skipped by Tab', async () => {
	render(SliderHarness, {
		props: { label: 'Budget', mode: 'range', defaultValue: [20, 60], thumbDisabled: [true, false] }
	});

	await userEvent.tab();
	expect(document.activeElement).toBe(thumbs()[1]);
});

test('arrow keys move the focused thumb and commit each press', async () => {
	const onValueCommit = vi.fn();
	render(SliderHarness, { props: { label: 'Volume', defaultValue: 40, onValueCommit } });

	thumbs()[0].focus();
	await userEvent.keyboard('{ArrowRight}{ArrowRight}');
	expect(onValueCommit.mock.calls).toEqual([[41], [42]]);
});

test('a click on the track commits the pressed value, a read-only track ignores it', async () => {
	const onValueCommit = vi.fn();
	render(SliderHarness, { props: { label: 'Volume', defaultValue: 0, onValueCommit } });
	const track = page.getByRole('group').element() as HTMLElement;
	const box = track.getBoundingClientRect();

	await userEvent.click(page.getByRole('group'), {
		position: { x: box.width / 2, y: box.height / 2 }
	});
	expect(onValueCommit).toHaveBeenCalledOnce();
	expect(onValueCommit.mock.calls[0][0]).toBeGreaterThan(40);
	expect(onValueCommit.mock.calls[0][0]).toBeLessThan(60);
});

test('a read-only track ignores a click', async () => {
	const onValueCommit = vi.fn();
	render(SliderHarness, {
		props: { label: 'Volume', defaultValue: 0, readOnly: true, onValueCommit }
	});
	const box = (page.getByRole('group').element() as HTMLElement).getBoundingClientRect();

	await userEvent.click(page.getByRole('group'), {
		position: { x: box.width / 2, y: box.height / 2 }
	});
	expect(onValueCommit).not.toHaveBeenCalled();
	expect(thumbs()[0].value).toBe('0');
});

chromiumOnly(
	'clicking the label focuses the first enabled thumb when the first is disabled',
	async () => {
		render(SliderHarness, {
			props: {
				label: 'Budget',
				mode: 'range',
				defaultValue: [20, 60],
				thumbDisabled: [true, false]
			}
		});

		await userEvent.click(page.getByText('Budget'));
		await expect.poll(() => document.activeElement).toBe(thumbs()[1]);
	}
);

chromiumOnly('an app ancestor with the group class does not light every thumb ring', async () => {
	render(SliderHarness, { props: { label: 'Budget', mode: 'range', defaultValue: [20, 60] } });
	const wrapper = thumbs()[0].closest('[role="group"]')!.parentElement!;
	wrapper.classList.add('group');

	await userEvent.tab();
	expect(document.activeElement).toBe(thumbs()[0]);
	await expect
		.poll(() => getComputedStyle(visualOf(thumbs()[0])).boxShadow)
		.not.toBe(getComputedStyle(visualOf(thumbs()[1])).boxShadow);
});
