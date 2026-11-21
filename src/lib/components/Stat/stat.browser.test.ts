// Stat in real engines: a numeric value is drawn by AnimatedNumber, which must sit where the
// plain text would and animate a change without moving the rest of the card.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Stat from './Stat.svelte';

const box = (node: Element) => node.getBoundingClientRect();
const stats = () => [...document.querySelectorAll<HTMLElement>('[data-slot="stat"]')];
const number = (stat: HTMLElement) =>
	stat.querySelector<HTMLElement>('[data-slot="animated-number"]');

/** The height of the card on each frame for `ms` milliseconds. */
const heights = (stat: HTMLElement, ms: number) =>
	new Promise<number[]>((resolve) => {
		const seen: number[] = [];
		const start = performance.now();
		const frame = () => {
			seen.push(box(stat).height);
			if (performance.now() - start < ms) requestAnimationFrame(frame);
			else resolve(seen);
		};
		requestAnimationFrame(frame);
	});

describe('Stat', () => {
	test('a numeric value sits where the same value written as text sits', async () => {
		for (const size of ['small', 'normal', 'large'] as const) {
			const text = await render(Stat, {
				props: { size, label: 'Response', value: '184', unit: 'ms' }
			});
			const animated = await render(Stat, {
				props: { size, label: 'Response', value: 184, unit: 'ms' }
			});
			const [plain, drawn] = stats();
			expect(number(drawn)).not.toBeNull();

			const unit = (stat: HTMLElement) => box(stat.querySelector('[data-slot="stat-unit"]')!);
			const value = (stat: HTMLElement) => box(stat.querySelector('[data-slot="stat-value"]')!);
			expect(box(drawn).height).toBeCloseTo(box(plain).height, 0);
			expect(value(drawn).height).toBeCloseTo(value(plain).height, 0);
			expect(unit(drawn).top - box(drawn).top).toBeCloseTo(unit(plain).top - box(plain).top, 0);
			expect(unit(drawn).left - box(drawn).left).toBeCloseTo(unit(plain).left - box(plain).left, 0);

			text.unmount();
			animated.unmount();
		}
	});

	test('a change of value is animated, and the card keeps its height', async () => {
		const view = await render(Stat, {
			props: { label: 'Orders', value: 1284, description: 'This month' }
		});
		const [stat] = stats();
		const before = box(stat).height;

		await view.rerender({ label: 'Orders', value: 98753, description: 'This month' });
		expect(number(stat)!.dataset.animating).toBe('');
		expect(stat.getAnimations({ subtree: true }).length).toBeGreaterThan(0);

		for (const height of await heights(stat, 400)) expect(height).toBe(before);
		await expect.poll(() => number(stat)!.dataset.animating, { timeout: 4000 }).toBeUndefined();
		expect(box(stat).height).toBe(before);
	});

	test('animatedNumber false changes the number at once', async () => {
		const view = await render(Stat, {
			props: { label: 'Orders', value: 1284, animatedNumber: false }
		});
		const [stat] = stats();
		expect(number(stat)).toBeNull();

		await view.rerender({ label: 'Orders', value: 1312, animatedNumber: false });
		expect(stat.querySelector('[data-slot="stat-value"]')).toHaveTextContent('1,312');
		expect(stat.getAnimations({ subtree: true })).toHaveLength(0);
	});

	test('the sparkline runs across the card, one step taller with each size', async () => {
		for (const [size, height] of [
			['small', 32],
			['normal', 40],
			['large', 48]
		] as const) {
			const view = await render(Stat, {
				props: { size, label: 'Visits', value: 1284, sparkline: [3, 5, 4, 8] }
			});
			const [stat] = stats();
			const band = stat.querySelector<HTMLElement>('[data-slot="stat-sparkline"]')!;
			const chart = band.querySelector<HTMLElement>('[data-slot="sparkline"]')!;
			const label = stat.querySelector<HTMLElement>('[data-slot="stat-label"]')!;
			expect(box(band).height).toBe(height);
			expect(box(chart).width).toBeCloseTo(box(label).width, 0);
			expect(box(chart).bottom).toBeCloseTo(box(band).bottom, 0);
			view.unmount();
		}
	});

	test('sparklineBleed runs the sparkline to the edges of the card, whatever the density', async () => {
		for (const density of ['compact', 'normal', 'comfortable'] as const) {
			const view = await render(Stat, {
				props: {
					density,
					label: 'Visits',
					value: 1284,
					sparkline: [3, 5, 4, 8],
					sparklineBleed: true
				}
			});
			const [stat] = stats();
			const chart = stat.querySelector<HTMLElement>('[data-slot="sparkline"]')!;
			// Inside the card's 1px border.
			expect(box(chart).left).toBeCloseTo(box(stat).left + 1, 0);
			expect(box(chart).right).toBeCloseTo(box(stat).right - 1, 0);
			expect(box(chart).bottom).toBeCloseTo(box(stat).bottom - 1, 0);
			expect(getComputedStyle(stat).overflow).toBe('hidden');
			view.unmount();
		}
	});
});
