// BeforeAfter in real engines: the divider follows presses, drags, keys and touch on a laid-out
// picture, the before side is cut where the divider sits, and the page keeps its scroll on touch.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import BeforeAfter from './BeforeAfter.svelte';

const picture = (fill: string) =>
	`data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="${fill}"/></svg>`
	)}`;
const before = { src: picture('gray'), alt: 'Before', loading: 'eager' as const };
const after = { src: picture('teal'), alt: 'After', loading: 'eager' as const };

const root = () => document.querySelector<HTMLElement>('[data-slot="before-after"]')!;
const input = () => root().querySelector<HTMLInputElement>('input[type="range"]')!;
const cut = () => root().querySelector<HTMLElement>('[data-slot="before-after-before"]')!;
/** Where the divider's line is drawn, as a share of the picture from its left or top. */
const dividerAt = (axis: 'x' | 'y' = 'x') => {
	const box = root().getBoundingClientRect();
	const line = root()
		.querySelector<HTMLElement>('[data-slot="before-after-line"]')!
		.getBoundingClientRect();
	return axis === 'x'
		? ((line.left + line.width / 2 - box.left) / box.width) * 100
		: ((line.top + line.height / 2 - box.top) / box.height) * 100;
};

const touch = (type: string, x: number, y: number) =>
	root().dispatchEvent(
		new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 9,
			pointerType: 'touch',
			isPrimary: true,
			button: 0,
			buttons: type === 'pointerup' ? 0 : 1,
			clientX: x,
			clientY: y
		})
	);
/** A point of the picture, as shares of its width and height. */
const at = (x: number, y = 0.5) => {
	const box = root().getBoundingClientRect();
	return [box.left + box.width * x, box.top + box.height * y] as const;
};

afterEach(() => {
	document.documentElement.removeAttribute('dir');
});

describe('BeforeAfter', () => {
	test('the before side is cut where the divider sits', async () => {
		render(BeforeAfter, { props: { before, after, ratio: '2x1', defaultValue: 25 } });

		expect(cut().style.clipPath).toBe('inset(0px 75% 0px 0px)');
		await expect.poll(() => Math.round(dividerAt())).toBe(25);
		expect(input().value).toBe('25');
		expect(input().getAttribute('aria-valuetext')).toBe('Before 25%, After 75%');
	});

	test('a press on the picture brings the divider there and commits once', async () => {
		const onValueChange = vi.fn();
		const onValueCommit = vi.fn();
		render(BeforeAfter, { props: { before, after, ratio: '2x1', onValueChange, onValueCommit } });
		const box = root().getBoundingClientRect();

		await userEvent.click(root(), { position: { x: box.width * 0.2, y: box.height * 0.8 } });
		expect(input().value).toBe('20');
		expect(onValueChange).toHaveBeenLastCalledWith(20);
		expect(onValueCommit.mock.calls).toEqual([[20]]);
		await expect.poll(() => Math.round(dividerAt())).toBe(20);
		// The press leaves the keyboard on the divider.
		expect(document.activeElement).toBe(input());
	});

	test('a11y:before-after.keyboard keys move the focused divider by the step, the large step, and to either end', async () => {
		const onValueCommit = vi.fn();
		render(BeforeAfter, { props: { before, after, ratio: '2x1', step: 5, onValueCommit } });

		input().focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(input().value).toBe('55');
		await userEvent.keyboard('{PageDown}');
		expect(input().value).toBe('45');
		await userEvent.keyboard('{End}');
		expect(input().value).toBe('100');
		expect(cut().style.clipPath).toBe('inset(0px 0% 0px 0px)');
		await userEvent.keyboard('{Home}');
		expect(cut().style.clipPath).toBe('inset(0px 100% 0px 0px)');
		expect(onValueCommit.mock.calls).toEqual([[55], [45], [100], [0]]);
	});

	test('a11y:before-after.rtl right to left, the before side is at the right and the arrows are mirrored', async () => {
		document.documentElement.setAttribute('dir', 'rtl');
		render(BeforeAfter, { props: { before, after, ratio: '2x1', defaultValue: 25 } });

		await expect.poll(() => cut().style.clipPath).toBe('inset(0px 0px 0px 75%)');
		await expect.poll(() => Math.round(dividerAt())).toBe(75);
		input().focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(input().value).toBe('26');
		const box = root().getBoundingClientRect();
		await userEvent.click(root(), { position: { x: box.width * 0.9, y: box.height / 2 } });
		expect(input().value).toBe('10');
	});

	test('vertical, the before side is on top and the up arrow moves the divider up', async () => {
		const onValueChange = vi.fn();
		render(BeforeAfter, {
			props: {
				before,
				after,
				ratio: '1x1',
				orientation: 'vertical',
				defaultValue: 30,
				onValueChange
			}
		});

		expect(cut().style.clipPath).toBe('inset(0px 0px 70%)');
		await expect.poll(() => Math.round(dividerAt('y'))).toBe(30);
		input().focus();
		await userEvent.keyboard('{ArrowUp}');
		expect(onValueChange).toHaveBeenLastCalledWith(29);
		const box = root().getBoundingClientRect();
		await userEvent.click(root(), { position: { x: box.width / 2, y: box.height * 0.6 } });
		expect(onValueChange).toHaveBeenLastCalledWith(60);
		expect(input().getAttribute('aria-valuetext')).toBe('Before 60%, After 40%');
	});

	test('on touch, a swipe along the axis drags, a tap moves, and a swipe across is left alone', async () => {
		const onValueCommit = vi.fn();
		render(BeforeAfter, { props: { before, after, ratio: '2x1', onValueCommit } });
		expect(getComputedStyle(root()).touchAction).toBe('pan-y');

		// Across the axis: the page's scroll. Nothing moves, not even on the press.
		touch('pointerdown', ...at(0.2, 0.2));
		expect(input().value).toBe('50');
		touch('pointermove', ...at(0.21, 0.6));
		touch('pointermove', ...at(0.22, 0.9));
		touch('pointercancel', ...at(0.22, 0.9));
		expect(input().value).toBe('50');
		expect(onValueCommit).not.toHaveBeenCalled();

		// Along the axis: the divider comes under the finger and follows it.
		touch('pointerdown', ...at(0.2));
		touch('pointermove', ...at(0.3));
		touch('pointermove', ...at(0.6));
		await expect.poll(() => input().value).toBe('60');
		expect(root().hasAttribute('data-dragging')).toBe(true);
		touch('pointerup', ...at(0.6));
		await expect.poll(() => root().hasAttribute('data-dragging')).toBe(false);
		expect(onValueCommit.mock.calls).toEqual([[60]]);

		// A tap.
		touch('pointerdown', ...at(0.15));
		touch('pointerup', ...at(0.15));
		await expect.poll(() => input().value).toBe('15');
		expect(onValueCommit.mock.calls).toEqual([[60], [15]]);
	});

	test('read-only keeps the divider focusable but still', async () => {
		const onValueChange = vi.fn();
		render(BeforeAfter, { props: { before, after, ratio: '2x1', readOnly: true, onValueChange } });
		const box = root().getBoundingClientRect();

		await userEvent.click(root(), { position: { x: box.width * 0.2, y: box.height / 2 } });
		input().focus();
		await userEvent.keyboard('{ArrowRight}');
		expect(document.activeElement).toBe(input());
		expect(input().getAttribute('aria-readonly')).toBe('true');
		expect(input().value).toBe('50');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('disabled takes the divider out', async () => {
		const onValueChange = vi.fn();
		render(BeforeAfter, { props: { before, after, ratio: '2x1', disabled: true, onValueChange } });
		const box = root().getBoundingClientRect();

		expect(input().disabled).toBe(true);
		await userEvent.click(root(), { position: { x: box.width * 0.2, y: box.height / 2 } });
		expect(input().value).toBe('50');
		expect(onValueChange).not.toHaveBeenCalled();
	});

	test('variants paint the divider, shape its handle and place the labels', async () => {
		const grip = () => root().querySelector<HTMLElement>('[data-slot="before-after-grip"]');
		const line = () => root().querySelector<HTMLElement>('[data-slot="before-after-line"]')!;

		const first = await render(BeforeAfter, {
			props: {
				before,
				after,
				ratio: '2x1',
				variant: 'solid',
				color: 'primary',
				handleVariant: 'pill',
				lineVariant: 'dashed',
				labels: true,
				labelVariant: 'outline',
				labelPosition: 'end'
			}
		});
		expect(root().dataset.color).toBe('primary');
		expect(grip()!.dataset.variant).toBe('pill');
		// The pill lies along the line, and takes the colour role like the line.
		const pill = grip()!.getBoundingClientRect();
		expect(pill.height).toBeGreaterThan(pill.width);
		expect(getComputedStyle(line()).borderInlineStartStyle).toBe('dashed');
		expect(getComputedStyle(grip()!).backgroundColor).toBe(
			getComputedStyle(line()).borderInlineStartColor
		);
		// Labels at the end of the divider: the bottom of a horizontal comparison.
		const label = root().querySelector<HTMLElement>('[data-slot="before-after-label"]')!;
		const box = root().getBoundingClientRect();
		expect(label.getBoundingClientRect().top).toBeGreaterThan(box.top + box.height / 2);
		await first.unmount();

		await render(BeforeAfter, {
			props: { before, after, ratio: '2x1', handleVariant: 'none', lineVariant: 'solid' }
		});
		expect(grip()).toBeNull();
		// With no handle, the line carries the focus ring.
		input().focus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(() => getComputedStyle(line()).boxShadow).not.toBe('none');
		expect(input().value).toBe('51');
	});

	test('a label belongs to its side: the divider covers it with the side', async () => {
		render(BeforeAfter, {
			props: { before, after, ratio: '2x1', labels: { before: '2019', after: '2024' } }
		});

		const labels = [...root().querySelectorAll('[data-slot="before-after-label"]')];
		expect(labels.map((label) => label.textContent?.trim())).toEqual(['2024', '2019']);
		expect(labels[1].closest('[data-slot="before-after-before"]')).not.toBeNull();
		expect(labels[0].closest('[data-slot="before-after-after"]')).not.toBeNull();
		expect(input().getAttribute('aria-valuetext')).toBe('2019 50%, 2024 50%');
	});
});
