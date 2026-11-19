// Annotation in real engines: the note and the arrow sit where `placement` says, round the
// target's own box and without moving it, in either reading direction.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './AnnotationHarness.test.svelte';
import type { AnnotationPlacement } from './annotation.props.js';

const root = () => document.querySelector<HTMLElement>('[data-slot="annotation"]')!;
const arrow = () => root().querySelector<SVGElement>(':scope > [data-slot="annotation-arrow"]');
const label = () => root().querySelector<HTMLElement>(':scope > [data-slot="annotation-label"]');

const centre = (node: Element) => {
	const box = node.getBoundingClientRect();
	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

/** Where a part sits from the target: -1 before it, 0 level with it, 1 after it, on each axis. */
const side = (part: Element) => {
	const target = root().getBoundingClientRect();
	const at = centre(part);
	return {
		x: at.x < target.left ? -1 : at.x > target.right ? 1 : 0,
		y: at.y < target.top ? -1 : at.y > target.bottom ? 1 : 0
	};
};

/** The animations that draw the annotation in, in the order they start. */
const drawing = () =>
	root()
		.getAnimations({ subtree: true })
		.filter((animation): animation is CSSAnimation => animation instanceof CSSAnimation)
		.filter((animation) => animation.animationName !== 'annotation-rainbow')
		.map((animation) => {
			const timing = animation.effect!.getComputedTiming();
			return {
				name: animation.animationName,
				delay: timing.delay ?? 0,
				duration: Number(timing.duration),
				fill: timing.fill
			};
		})
		.sort((a, b) => a.delay - b.delay);

/** Resolves once the annotation has come into view and its drawing has started. */
const playing = () => expect.poll(() => root().dataset.draw).toBe('play');

const frames = (count: number) =>
	new Promise<void>((resolve) => {
		const step = () => (count-- > 0 ? requestAnimationFrame(step) : resolve());
		step();
	});

/** The note's centre from the target's, in pixels to the right. */
const lean = () => centre(label()!).x - centre(root()).x;

const placements: Array<[AnnotationPlacement, vertical: number]> = [
	['top', -1],
	['top-start', -1],
	['top-end', -1],
	['bottom', 1],
	['bottom-start', 1],
	['bottom-end', 1]
];

describe('Annotation', () => {
	test.each(placements)(
		'%s puts the note and its arrow on that side',
		async (placement, vertical) => {
			render(Harness, { props: { note: 'look here', placement } });

			expect(root().dataset.placement).toBe(placement);
			expect(side(arrow()!).y).toBe(vertical);
			expect(side(label()!).y).toBe(vertical);
			// The arrow lies between the target and the note.
			const target = centre(root()).y;
			expect(Math.abs(centre(arrow()!).y - target)).toBeLessThan(
				Math.abs(centre(label()!).y - target)
			);

			if (placement.endsWith('-start')) expect(lean()).toBeLessThan(-20);
			else if (placement.endsWith('-end')) expect(lean()).toBeGreaterThan(20);
			else expect(Math.abs(lean())).toBeLessThan(3);
		}
	);

	test('left and right put the note beside the target', async () => {
		const view = await render(Harness, { props: { note: 'look here', placement: 'left' } });
		expect(side(label()!)).toEqual({ x: -1, y: 0 });
		expect(side(arrow()!)).toEqual({ x: -1, y: 0 });
		expect(arrow()!.getBoundingClientRect().right).toBeLessThanOrEqual(
			root().getBoundingClientRect().left
		);

		await view.rerender({ placement: 'right' });
		expect(side(label()!)).toEqual({ x: 1, y: 0 });
		expect(side(arrow()!)).toEqual({ x: 1, y: 0 });
	});

	test('from right to left, start and end swap sides and the arrow is mirrored', async () => {
		const view = await render(Harness, {
			props: { note: 'look here', placement: 'bottom-start', dir: 'rtl' }
		});
		expect(lean()).toBeGreaterThan(20);
		expect(getComputedStyle(arrow()!).scale).toBe('-1 1');

		await view.rerender({ placement: 'top-end' });
		expect(lean()).toBeLessThan(-20);
		expect(getComputedStyle(arrow()!).scale).toBe('-1 1');

		// A straight arrow is its own mirror: it is left as drawn.
		await view.rerender({ placement: 'bottom' });
		expect(getComputedStyle(arrow()!).scale).toBe('none');
	});

	test('the note takes no room: the target keeps its box', async () => {
		const view = await render(Harness, { props: {} });
		const alone = root().getBoundingClientRect();

		await view.rerender({ note: 'a note that is much longer than its target' });
		const noted = root().getBoundingClientRect();
		expect(noted.width).toBe(alone.width);
		expect(noted.height).toBe(alone.height);
		expect(noted.left).toBe(alone.left);
	});

	test('the note is drawn as an arrow of two strokes, in the colour of the note', async () => {
		render(Harness, { props: { note: 'look here', color: 'danger' } });

		expect(arrow()!.querySelectorAll('path')).toHaveLength(2);
		expect(arrow()!.getBoundingClientRect().width).toBe(46);
		expect(arrow()!.getBoundingClientRect().height).toBe(38);
		expect(getComputedStyle(arrow()!).fill).toBe('none');
		expect(getComputedStyle(arrow()!).stroke).toBe(getComputedStyle(label()!).color);
	});

	test('a marker alone tints the target, and `highlight` turns the tint off', async () => {
		const view = await render(Harness, { props: { color: 'warning' } });

		expect(arrow()).toBeNull();
		expect(label()).toBeNull();
		expect(root().hasAttribute('data-placement')).toBe(false);
		expect(root().hasAttribute('aria-describedby')).toBe(false);
		// The marker is the root's `::before`: it runs past the target and takes no room.
		const marker = getComputedStyle(root(), '::before');
		expect(marker.content).not.toBe('none');
		expect(marker.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
		expect(parseFloat(marker.width)).toBeGreaterThan(root().getBoundingClientRect().width);

		await view.rerender({ highlight: false });
		expect(root().hasAttribute('data-highlight')).toBe(false);
		expect(getComputedStyle(root(), '::before').content).toBe('none');
	});

	test('the note describes its target, unless it is decorative', async () => {
		const view = await render(Harness, { props: { note: 'no refresh needed' } });

		expect(label()!.textContent?.trim()).toBe('no refresh needed');
		expect(root().getAttribute('aria-describedby')).toBe(label()!.id);
		expect(label()!.hasAttribute('aria-hidden')).toBe(false);
		expect(arrow()!.getAttribute('aria-hidden')).toBe('true');

		await view.rerender({ decorative: true });
		expect(root().hasAttribute('aria-describedby')).toBe(false);
		expect(label()!.getAttribute('aria-hidden')).toBe('true');
	});

	test('variables on the root recolour, widen and straighten the note', async () => {
		render(Harness, { props: { note: 'a note long enough to wrap onto a second line' } });
		const wrapped = label()!.getBoundingClientRect().height;
		expect(label()!.getBoundingClientRect().width).toBeLessThanOrEqual(160);
		expect(getComputedStyle(label()!).transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');

		root().style.setProperty('--annotation-color', 'rgb(255, 20, 147)');
		root().style.setProperty('--annotation-label-max-width', '600px');
		root().style.setProperty('--annotation-rotate', '0deg');
		root().style.setProperty('--annotation-font-size', '20px');

		expect(getComputedStyle(label()!).color).toBe('rgb(255, 20, 147)');
		expect(getComputedStyle(arrow()!).stroke).toBe('rgb(255, 20, 147)');
		expect(getComputedStyle(label()!).fontSize).toBe('20px');
		// On one line now, and level: only the centring shift is left in the transform.
		expect(label()!.getBoundingClientRect().height).toBeLessThan(wrapped);
		expect(getComputedStyle(label()!).transform).toMatch(/^matrix\(1, 0, 0, 1, /);
	});

	test('the note is set in a handwriting font', async () => {
		render(Harness, { props: { note: 'look here' } });

		expect(getComputedStyle(label()!).fontFamily).toMatch(/Shantell Sans.*cursive/);
	});

	test('round a block the root is a block element', async () => {
		render(Harness, { props: { note: 'look here', as: 'div', highlight: false } });

		expect(root().tagName).toBe('DIV');
		expect(getComputedStyle(root()).display).toBe('block');
		expect(side(label()!).y).toBe(1);
	});

	test('without `draw` nothing is animated', async () => {
		render(Harness, { props: { note: 'look here' } });

		expect(root().hasAttribute('data-draw')).toBe(false);
		expect(drawing()).toEqual([]);
	});

	test('`draw` sweeps the marker, writes the note, then traces the shaft and the head', async () => {
		render(Harness, { props: { note: 'look here', draw: true } });
		await playing();

		const parts = drawing();
		expect(parts.map((part) => part.name)).toEqual([
			'annotation-mark',
			'annotation-write',
			'annotation-stroke',
			'annotation-stroke'
		]);
		// In that order: each starts after the one before it, and the head ends the drawing.
		const starts = parts.map((part) => part.delay);
		expect([...starts].sort((a, b) => a - b)).toEqual(starts);
		expect(new Set(starts).size).toBe(4);
		expect(parts[3].delay + parts[3].duration).toBeCloseTo(900, 0);
		// Every part holds its first frame until its turn, and lets go once drawn.
		expect(parts.every((part) => part.fill === 'backwards')).toBe(true);

		// Before its turn the head is not there; once all is played, everything is.
		const [shaft, head] = arrow()!.querySelectorAll('path');
		expect(getComputedStyle(head).opacity).toBe('0');
		for (const animation of root().getAnimations({ subtree: true })) animation.finish();
		expect(getComputedStyle(head).opacity).toBe('1');
		expect(getComputedStyle(shaft).strokeDasharray).toBe('none');
		expect(getComputedStyle(label()!).clipPath).toBe('none');
		expect(getComputedStyle(root(), '::before').clipPath).toBe('none');
	});

	test('the pace of the drawing follows its variables', async () => {
		render(Harness, {
			props: {
				note: 'look here',
				draw: true,
				class: '[--annotation-draw-duration:2s] [--annotation-draw-delay:1s]'
			}
		});
		await playing();

		const parts = drawing();
		expect(parts[0].delay).toBe(1000);
		expect(parts[0].duration).toBeCloseTo(600, 0);
		expect(parts[3].delay + parts[3].duration).toBeCloseTo(3000, 0);
	});

	test('a marker alone sweeps in, and from right to left the pen starts on the right', async () => {
		const view = await render(Harness, { props: { draw: true } });
		await playing();
		expect(drawing().map((part) => part.name)).toEqual(['annotation-mark']);

		await view.rerender({ dir: 'rtl', note: 'look here' });
		expect(drawing().map((part) => part.name)).toEqual([
			'annotation-mark-rtl',
			'annotation-write-rtl',
			'annotation-stroke',
			'annotation-stroke'
		]);
	});

	test('out of view the drawing waits on its first frame, and plays once scrolled to', async () => {
		render(Harness, { props: { note: 'look here', draw: true, below: 4000 } });
		await frames(4);

		expect(root().dataset.draw).toBe('wait');
		const held = root().getAnimations({ subtree: true });
		expect(held).toHaveLength(4);
		expect(held.every((animation) => animation.playState === 'paused')).toBe(true);
		// Nothing of the drawing shows yet: only the target does.
		const [shaft, head] = arrow()!.querySelectorAll('path');
		expect(getComputedStyle(shaft).opacity).toBe('0');
		expect(getComputedStyle(head).opacity).toBe('0');
		expect(getComputedStyle(label()!).clipPath).toContain('100%');
		expect(getComputedStyle(root(), '::before').clipPath).toContain('100%');

		root().scrollIntoView({ block: 'center' });
		await playing();
		expect(
			root()
				.getAnimations({ subtree: true })
				.every((animation) => animation.playState === 'running')
		).toBe(true);

		// Played once: scrolled away and back, it is not drawn again.
		for (const animation of root().getAnimations({ subtree: true })) animation.finish();
		window.scrollTo(0, 0);
		await frames(4);
		root().scrollIntoView({ block: 'center' });
		await frames(4);
		expect(root().dataset.draw).toBe('play');
		expect(root().getAnimations({ subtree: true })).toEqual([]);
		window.scrollTo(0, 0);
	});

	test('`drawOffset` is how far above the bottom of the screen the target must be', async () => {
		render(Harness, { props: { note: 'look here', draw: true, drawOffset: 200, below: 4000 } });
		/** Scrolls until the top of the target is `inside` pixels over the bottom of the screen. */
		const bring = async (inside: number) => {
			const top = root().getBoundingClientRect().top + window.scrollY;
			window.scrollTo(0, top - window.innerHeight + inside);
			await frames(4);
		};

		await bring(100);
		expect(root().dataset.draw).toBe('wait');
		await bring(260);
		await playing();
		window.scrollTo(0, 0);
	});

	test('a share of the screen, or a negative distance to draw it before it shows', async () => {
		const view = await render(Harness, {
			props: { note: 'look here', draw: true, drawOffset: '50%', below: 4000 }
		});
		const bring = async (inside: number) => {
			const top = root().getBoundingClientRect().top + window.scrollY;
			window.scrollTo(0, top - window.innerHeight + inside);
			await frames(4);
		};

		// A third of the way up the screen is not half of it.
		await bring(window.innerHeight / 3);
		expect(root().dataset.draw).toBe('wait');
		await bring(window.innerHeight / 2 + 40);
		await playing();

		// Near the top of the screen it is far enough up: it plays, also after a jump.
		window.scrollTo(0, 0);
		await view.rerender({ drawOffset: '40%' });
		await frames(4);
		expect(root().dataset.draw).toBe('wait');
		await bring(window.innerHeight - 30);
		await playing();

		// Still under the screen by 150 pixels, and allowed 400 of advance.
		window.scrollTo(0, 0);
		await view.rerender({ drawOffset: -400 });
		await frames(4);
		expect(root().dataset.draw).toBe('wait');
		await bring(-150);
		await playing();
		window.scrollTo(0, 0);
	});

	test('turned off and on again, `draw` plays again', async () => {
		const view = await render(Harness, { props: { note: 'look here', draw: true } });
		await playing();
		for (const animation of root().getAnimations({ subtree: true })) animation.finish();

		await view.rerender({ draw: false });
		expect(root().hasAttribute('data-draw')).toBe(false);
		// A frame passes, as between two presses: the browser sees the drawing gone before it is back.
		await frames(2);
		await view.rerender({ draw: true });
		await playing();
		expect(drawing()).toHaveLength(4);
	});

	test('under reduced motion nothing is drawn in, and the rainbow holds still', async () => {
		document.documentElement.setAttribute('data-entasis-reduce-motion', '');
		try {
			render(Harness, { props: { note: 'look here', draw: true, color: 'rainbow' } });

			expect(root().getAnimations({ subtree: true })).toEqual([]);
			expect(getComputedStyle(label()!).clipPath).toBe('none');
		} finally {
			document.documentElement.removeAttribute('data-entasis-reduce-motion');
		}
	});

	test('the rainbow turns its hue while motion is allowed', async () => {
		render(Harness, { props: { note: 'look here', color: 'rainbow' } });

		expect(root().hasAttribute('data-rainbow')).toBe(true);
		expect(getComputedStyle(root()).animationName).toContain('annotation-rainbow');
		const first = getComputedStyle(label()!).color;
		await expect.poll(() => getComputedStyle(label()!).color).not.toBe(first);
	});
});
