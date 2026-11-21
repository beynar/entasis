// Sparkline in real engines: the series fills the box it is given and stays inside it, strokes
// and dots keep their weight however the box stretches, the pointer reads a value, and a change
// of values moves the series unless motion is reduced.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './SparklineHarness.test.svelte';

const root = () => document.querySelector<HTMLElement>('[data-slot="sparkline"]')!;
const part = (slot: string) => root().querySelector<SVGGraphicsElement>(`[data-slot="${slot}"]`)!;
const all = (slot: string) => [
	...root().querySelectorAll<SVGGraphicsElement>(`[data-slot="${slot}"]`)
];
const box = (node: Element) => node.getBoundingClientRect();
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** Moves a mouse over the plot at a share of its width. */
const hover = (share: number) => {
	const svg = box(part('sparkline-svg'));
	const plot = root().querySelector('[data-slot="sparkline-plot"]')!;
	plot.dispatchEvent(
		new PointerEvent('pointermove', {
			bubbles: true,
			pointerType: 'mouse',
			clientX: svg.left + svg.width * share,
			clientY: svg.top + svg.height / 2
		})
	);
};

const DATA = [3, 5, 2, 8, 4, 7, 1, 6];

describe('Sparkline', () => {
	test('a11y:sparkline.name it is one image named by its label and a summary of its values', async () => {
		await render(Harness, { props: { data: DATA, label: 'Signups', animated: false } });

		expect(root().getAttribute('role')).toBe('img');
		expect(root().getAttribute('aria-label')).toBe(
			'Signups, 8 values from 3 to 6, lowest 1, highest 8, trending up'
		);
		expect(part('sparkline-svg').getAttribute('aria-hidden')).toBe('true');
	});

	test('the series stays inside the root, whatever the size', async () => {
		for (const size of ['small', 'normal', 'large'] as const) {
			const view = await render(Harness, {
				props: { data: DATA, size, markers: ['min', 'max'], animated: false }
			});
			const outer = box(root());
			for (const node of [part('sparkline-line'), ...all('sparkline-marker')]) {
				const inner = box(node);
				expect(inner.top).toBeGreaterThanOrEqual(outer.top - 0.5);
				expect(inner.bottom).toBeLessThanOrEqual(outer.bottom + 0.5);
				expect(inner.left).toBeGreaterThanOrEqual(outer.left - 0.5);
				expect(inner.right).toBeLessThanOrEqual(outer.right + 0.5);
			}
			view.unmount();
		}
	});

	test('the fill meets the edges of the root, where the line stops short of them', async () => {
		for (const [variant, data] of [
			['area', DATA],
			['bar', [3, 5, 2, 8]]
		] as const) {
			const view = await render(Harness, {
				props: { data, variant, class: 'h-12 w-48', animated: false }
			});
			await frame();
			const outer = box(root());
			const fill = variant === 'area' ? box(part('sparkline-area')) : box(all('sparkline-bar')[0]);
			expect(fill.bottom).toBeCloseTo(outer.bottom, 0);
			if (variant === 'area') {
				expect(fill.left).toBeCloseTo(outer.left, 0);
				expect(fill.right).toBeCloseTo(outer.right, 0);
			}
			view.unmount();
		}
	});

	test('the tooltip and the markers leave the series its size', async () => {
		const view = await render(Harness, { props: { data: DATA, animated: false } });
		const plain = box(part('sparkline-svg'));

		await view.rerender({ data: DATA, animated: false, tooltip: true });
		expect(box(part('sparkline-svg'))).toEqual(plain);
		await view.rerender({ data: DATA, animated: false, tooltip: true, markers: ['min', 'max'] });
		expect(box(part('sparkline-svg'))).toEqual(plain);
	});

	test('a class stretches the box, and the strokes and dots keep their weight', async () => {
		const view = await render(Harness, {
			props: { data: DATA, variant: 'dot', animated: false, class: 'h-16 w-96' }
		});
		expect(box(root()).width).toBe(384);
		expect(box(root()).height).toBe(64);
		// A dot is a stroke of no length with round ends, in pixels: it stays round.
		const dot = getComputedStyle(part('sparkline-dot'));
		expect(dot.vectorEffect).toBe('non-scaling-stroke');
		expect(dot.strokeLinecap).toBe('round');
		expect(part('sparkline-dot').getAttribute('stroke-width')).toBe('6');

		await view.rerender({ data: DATA, variant: 'line', animated: false, class: 'h-16 w-96' });
		expect(getComputedStyle(part('sparkline-line')).vectorEffect).toBe('non-scaling-stroke');
		expect(part('sparkline-line').getAttribute('stroke-width')).toBe('2');
	});

	test('bars stand on zero, and a negative value hangs under it', async () => {
		await render(Harness, {
			props: { data: [4, -2, 0, 2], variant: 'bar', animated: false, class: 'h-20 w-40' }
		});
		const [up, down, zero, half] = all('sparkline-bar').map(box);
		// The scale runs from -2 to 4: zero sits a third of the way up.
		expect(up.bottom).toBeCloseTo(down.top, 0);
		expect(zero.height).toBe(0);
		expect(up.height).toBeCloseTo(half.height * 2, 0);
		expect(down.height).toBeCloseTo(half.height, 0);
	});

	test('the pointer reads the value under it, and the tooltip stays over the box', async () => {
		await render(Harness, {
			props: {
				data: [1200, 1350, 990],
				labels: ['Mon', 'Tue', 'Wed'],
				tooltip: true,
				format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
				animated: false,
				class: 'w-40'
			}
		});
		expect(root().querySelector('[data-slot="sparkline-tooltip"]')).toBeNull();

		hover(0.55);
		await frame();
		const tip = root().querySelector<HTMLElement>('[data-slot="sparkline-tooltip"]')!;
		expect(tip.textContent).toBe('Tue $1,350');
		expect(tip.getAttribute('aria-hidden')).toBe('true');
		expect(part('sparkline-cursor')).not.toBeNull();

		// At either end the tooltip starts or ends on the point instead of hanging out of the box.
		hover(0);
		await frame();
		expect(box(tip).left).toBeCloseTo(box(part('sparkline-svg')).left, 0);
		hover(1);
		await frame();
		expect(tip.textContent).toBe('Wed $990');
		expect(box(tip).right).toBeCloseTo(box(part('sparkline-svg')).right, 0);

		root()
			.querySelector('[data-slot="sparkline-plot"]')!
			.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
		await frame();
		expect(root().querySelector('[data-slot="sparkline-tooltip"]')).toBeNull();
	});

	test('the trend arrow sits on the last value: under it near the top, over it near the bottom', async () => {
		const rising = await render(Harness, {
			props: { data: [1, 3, 2, 8], showTrend: true, animated: false, class: 'h-20 w-40' }
		});
		let arrow = root().querySelector<HTMLElement>('[data-slot="sparkline-trend"]')!;
		let svg = box(part('sparkline-svg'));
		expect(arrow.dataset.placement).toBe('below');
		expect(arrow.dataset.trend).toBe('up');
		// Under the last value, at the top of the box, and ending on it.
		expect(box(arrow).top).toBeGreaterThan(svg.top);
		expect(box(arrow).right).toBeCloseTo(svg.right, 0);
		rising.unmount();

		await render(Harness, {
			props: { data: [8, 3, 6, 1], showTrend: true, animated: false, class: 'h-20 w-40' }
		});
		arrow = root().querySelector<HTMLElement>('[data-slot="sparkline-trend"]')!;
		svg = box(part('sparkline-svg'));
		expect(arrow.dataset.placement).toBe('above');
		expect(box(arrow).bottom).toBeLessThan(svg.bottom);
		expect(box(arrow).right).toBeCloseTo(svg.right, 0);
		// The arrow takes no room: the box is the size it was given.
		expect(box(root()).width).toBe(160);
	});

	test('the tooltip takes the color of the series, or a color of its own', async () => {
		const tip = () => root().querySelector<HTMLElement>('[data-slot="sparkline-tooltip"]')!;
		const text = () => root().querySelector<HTMLElement>('[data-slot="sparkline-tooltip-text"]')!;
		const fill = () => getComputedStyle(tip()).backgroundColor;
		const stroke = () => getComputedStyle(part('sparkline-line')).stroke;

		// No color: the ink of the text round it, written in the surface color.
		const plain = await render(Harness, { props: { data: DATA, tooltip: true, animated: false } });
		hover(0.5);
		await frame();
		expect(fill()).toBe(stroke());
		expect(getComputedStyle(text()).color).not.toBe(fill());
		plain.unmount();

		// A color on the series: the tooltip is filled with it.
		const colored = await render(Harness, {
			props: { data: DATA, color: 'danger', tooltip: true, animated: false }
		});
		hover(0.5);
		await frame();
		expect(tip().dataset.color).toBe('danger');
		expect(fill()).not.toBe('rgba(0, 0, 0, 0)');
		const danger = fill();
		colored.unmount();

		// A color on the tooltip wins over the series'.
		await render(Harness, {
			props: { data: DATA, color: 'danger', tooltip: 'info', animated: false }
		});
		hover(0.5);
		await frame();
		expect(tip().dataset.color).toBe('info');
		expect(fill()).not.toBe(danger);
	});

	test('it is drawn in from the left when it appears', async () => {
		await render(Harness, { props: { data: DATA } });
		const animations = part('sparkline-svg').getAnimations();
		expect(animations).toHaveLength(1);
		expect((animations[0] as CSSAnimation).animationName).toBe('entasis-sparkline-draw');
	});

	test('animation, duration and easing set how it appears', async () => {
		const view = await render(Harness, {
			props: { data: DATA, animation: 'grow', duration: 1200, easing: 'linear' }
		});
		const svg = () => part('sparkline-svg');
		const [grow] = svg().getAnimations() as CSSAnimation[];
		expect(grow.animationName).toBe('entasis-sparkline-grow');
		expect(getComputedStyle(svg()).animationDuration).toBe('1.2s');
		expect(getComputedStyle(svg()).animationTimingFunction).toBe('linear');
		view.unmount();

		// Theme tokens: `fast` lasts 150 ms, the `enter` role is cubicOut.
		const tokens = await render(Harness, {
			props: { data: DATA, animation: 'fade', duration: 'fast', easing: 'enter' }
		});
		expect((svg().getAnimations()[0] as CSSAnimation).animationName).toBe('entasis-sparkline-fade');
		expect(getComputedStyle(svg()).animationDuration).toBe('0.15s');
		expect(getComputedStyle(svg()).animationTimingFunction).toBe(
			'cubic-bezier(0.215, 0.61, 0.355, 1)'
		);
		tokens.unmount();

		// A spring is traced point by point: a cubic Bézier cannot draw it.
		const spring = await render(Harness, { props: { data: DATA, easing: 'elasticOut' } });
		expect(getComputedStyle(svg()).animationTimingFunction).toMatch(/^linear\(0 0%, /);
		spring.unmount();

		await render(Harness, { props: { data: DATA, animation: 'none' } });
		expect(svg().getAnimations()).toHaveLength(0);
	});

	test('the duration also sets how long the series takes to move', async () => {
		const view = await render(Harness, { props: { data: [1, 2, 3, 4], duration: 0 } });

		await view.rerender({ data: [4, 3, 2, 1], duration: 0 });
		await frame();
		expect(part('sparkline-line').getAttribute('d')).toBe(
			'M0,0 L33.333,33.333 L66.667,66.667 L100,100'
		);
	});

	test('a change of values moves the series to them', async () => {
		const view = await render(Harness, { props: { data: [1, 2, 3, 4], animated: true } });
		const before = part('sparkline-line').getAttribute('d');

		await view.rerender({ data: [4, 3, 2, 1], animated: true });
		await frame();
		await frame();
		const between = part('sparkline-line').getAttribute('d');
		expect(between).not.toBe(before);
		expect(between).not.toBe(
			'M0,100 L33.333,66.667 L66.667,33.333 L100,0'.replace('M0,100', 'M0,0')
		);

		await expect
			.poll(() => part('sparkline-line').getAttribute('d'), { timeout: 2000 })
			.toBe('M0,0 L33.333,33.333 L66.667,66.667 L100,100');
	});

	test('nothing moves under reduced motion', async () => {
		const view = await render(Harness, { props: { data: [1, 2, 3, 4], reduceMotion: true } });
		expect(part('sparkline-svg').getAnimations()).toHaveLength(0);

		await view.rerender({ data: [4, 3, 2, 1], reduceMotion: true });
		await frame();
		expect(part('sparkline-line').getAttribute('d')).toBe(
			'M0,0 L33.333,33.333 L66.667,66.667 L100,100'
		);
	});
});
