// glimm(element) lays a band over one element and reveals a change behind it. These tests read
// what the sweep leaves on the page: the overlay, the cut of the old picture, the curtain, and that
// nothing stays once it is over.
import { afterEach, describe, expect, test } from 'vitest';
import { glimm, toHex } from './glimm.js';

const scopedTransitions =
	typeof (document.body as { startViewTransition?: unknown }).startViewTransition === 'function';

const overlay = () => document.querySelector<HTMLElement>('[data-glimm-overlay]');

const mount = (style = '') => {
	const element = document.createElement('div');
	element.textContent = 'before';
	element.setAttribute(
		'style',
		`width: 240px; height: 120px; background: rgb(255, 255, 255); border-radius: 12px; ${style}`
	);
	document.body.append(element);
	return element;
};

afterEach(() => {
	document.body.replaceChildren();
});

describe('glimm', () => {
	test('lays the band over the element in the top layer and removes it when done', async () => {
		const element = mount('margin: 40px;');
		const handle = glimm(element, { sweepMs: 300, outroMs: 50 });

		await expect.poll(overlay).not.toBeNull();
		const layer = overlay()!;
		expect(layer.getAttribute('aria-hidden')).toBe('true');
		expect(layer.matches(':popover-open')).toBe(true);
		expect(getComputedStyle(layer).pointerEvents).toBe('none');
		expect(getComputedStyle(layer).borderTopLeftRadius).toBe('12px');
		const box = element.getBoundingClientRect();
		const drawn = layer.getBoundingClientRect();
		expect([drawn.left, drawn.top, drawn.width, drawn.height]).toEqual([
			box.left,
			box.top,
			box.width,
			box.height
		]);
		expect(layer.querySelector('canvas')).not.toBeNull();

		await handle.done;
		expect(overlay()).toBeNull();
	});

	test('the change runs, and the element is left as it was found', async () => {
		const element = mount();
		const styles = document.head.querySelectorAll('style').length;
		const handle = glimm(element, {
			sweepMs: 300,
			outroMs: 50,
			change: () => (element.textContent = 'after')
		});
		await handle.changed;
		expect(element.textContent).toBe('after');
		await handle.done;
		expect(overlay()).toBeNull();
		expect(element.hasAttribute('data-glimm-scope')).toBe(false);
		expect(document.head.querySelectorAll('style').length).toBe(styles);
		expect(element.getAnimations({ subtree: true })).toHaveLength(0);
	});

	test.runIf(scopedTransitions)(
		'the new content shows through the part the band has passed, cut along its shape',
		async () => {
			const cutOf = (element: HTMLElement) => () => {
				const animation = element
					.getAnimations({ subtree: true })
					.find(
						(candidate) =>
							(candidate.effect as KeyframeEffect).pseudoElement === '::view-transition-new(root)'
					);
				return animation
					? String((animation.effect as KeyframeEffect).getKeyframes()[0].clipPath)
					: undefined;
			};

			const element = mount();
			const handle = glimm(element, {
				preset: 'reveal',
				sweepMs: 1200,
				easing: 'linear',
				change: () => (element.textContent = 'after')
			});
			const cut = cutOf(element);
			await expect.poll(cut).toMatch(/^inset\(/);
			// The inset on the far side shrinks as the band moves on.
			const right = () => Number(/inset\(\S+ ([\d.]+)%/.exec(cut() ?? '')?.[1] ?? 100);
			const first = right();
			await expect.poll(right).toBeLessThan(first);
			expect(element.textContent).toBe('after');
			handle.cancel();
			await handle.done;
			expect(cut()).toBeUndefined();

			const ring = mount();
			const ripple = glimm(ring, {
				preset: 'ripple',
				origin: [30, 40],
				change: () => (ring.textContent = 'after')
			});
			await expect.poll(cutOf(ring)).toMatch(/^circle\([\d.]+px at 30px 40px\)$/);
			ripple.cancel();
		}
	);

	test('without scoped view transitions, a curtain covers the element while it changes', async () => {
		const element = mount('background: rgb(10, 20, 30);');
		Object.defineProperty(element, 'startViewTransition', { value: undefined });
		let curtainWhileChanging: string | undefined;
		const handle = glimm(element, {
			sweepMs: 400,
			outroMs: 50,
			change: () => {
				const curtain = overlay()!.firstElementChild as HTMLElement;
				curtainWhileChanging = `${curtain.style.display} ${getComputedStyle(curtain).backgroundColor}`;
				element.textContent = 'after';
			}
		});
		await handle.changed;
		expect(curtainWhileChanging).toBe('block rgb(10, 20, 30)');
		await handle.done;
		expect(overlay()).toBeNull();
	});

	test('a slow change is not held back: the element updates when it is done', async () => {
		const element = mount();
		let release!: () => void;
		const handle = glimm(element, {
			sweepMs: 300,
			outroMs: 50,
			change: () =>
				new Promise<void>((resolve) => {
					release = () => {
						element.textContent = 'after';
						resolve();
					};
				})
		});
		await expect.poll(() => release).toBeDefined();
		await new Promise((resolve) => setTimeout(resolve, 350));
		// Past the 200 ms freeze, the element shows itself live again.
		expect(element.hasAttribute('data-glimm-scope')).toBe(false);
		release();
		await handle.changed;
		expect(element.textContent).toBe('after');
		await handle.done;
		expect(overlay()).toBeNull();
	});

	test('cancel removes the band at once and still applies a change that has not run', async () => {
		const element = mount();
		const handle = glimm(element, { change: () => (element.textContent = 'after') });
		handle.cancel();
		await handle.done;
		expect(element.textContent).toBe('after');
		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(overlay()).toBeNull();
	});

	test('an aborted signal cancels the sweep', async () => {
		const element = mount();
		const controller = new AbortController();
		const handle = glimm(element, { signal: controller.signal, sweepMs: 2000 });
		await expect.poll(overlay).not.toBeNull();
		controller.abort();
		await handle.done;
		expect(overlay()).toBeNull();
	});

	test('a new sweep on the element takes over from the running one', async () => {
		const element = mount();
		const first = glimm(element, { sweepMs: 2000, change: () => (element.dataset.first = '') });
		await expect.poll(overlay).not.toBeNull();
		const second = glimm(element, { sweepMs: 300, outroMs: 50 });
		await first.done;
		expect(element.dataset.first).toBe('');
		await expect.poll(() => document.querySelectorAll('[data-glimm-overlay]').length).toBe(1);
		await second.done;
		expect(overlay()).toBeNull();
	});

	test('with blur, a layer under the band blurs the content around it, and goes with it', async () => {
		const element = mount('margin: 40px;');
		const blurLayer = () => document.querySelector<HTMLElement>('[data-glimm-blur]');
		const handle = glimm(element, { preset: 'surge', sweepMs: 600, outroMs: 50 });

		await expect.poll(blurLayer).not.toBeNull();
		const layer = blurLayer()!;
		expect(layer.getAttribute('aria-hidden')).toBe('true');
		expect(layer.matches(':popover-open')).toBe(true);
		expect(getComputedStyle(layer).pointerEvents).toBe('none');
		expect(
			layer.style.backdropFilter || layer.style.getPropertyValue('-webkit-backdrop-filter')
		).toBe('blur(8px)');
		// Shown first, so it lies under the band in the top layer.
		expect(
			layer.compareDocumentPosition(overlay()!) & Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy();
		await expect.poll(() => layer.style.visibility).toBe('visible');
		expect(layer.style.maskImage || layer.style.getPropertyValue('-webkit-mask-image')).toMatch(
			/^radial-gradient\(/
		);

		await handle.done;
		expect(blurLayer()).toBeNull();
		expect(overlay()).toBeNull();
	});

	test('the colour on the edges goes with the band: it does not hold the sweep open', async () => {
		const element = mount();
		const timed = async (options: Parameters<typeof glimm>[1]) => {
			const started = performance.now();
			await glimm(element, { sweepMs: 1000, outroMs: 50, ...options }).done;
			return performance.now() - started;
		};
		const plain = await timed({ edges: 0, sparks: 0, blur: 0 });
		const edged = await timed({ edges: 1, sparks: 0, blur: 0 });
		// Room for a loaded machine; edges that lingered on their own clock held it a second more.
		expect(edged).toBeLessThan(plain + 300);
		expect(overlay()).toBeNull();
	});

	test.runIf(scopedTransitions)(
		'with distort, a lens bends both pictures of the change, and goes with the sweep',
		async () => {
			const element = mount('margin: 40px;');
			const lens = () => document.querySelector('filter[id^="glimm-lens-"]');
			const handle = glimm(element, {
				preset: 'surge',
				sweepMs: 600,
				outroMs: 50,
				change: () => (element.textContent = 'after')
			});
			await expect.poll(lens).not.toBeNull();
			const filter = lens()!;
			expect(filter.querySelectorAll('feDisplacementMap')).toHaveLength(3);
			// The map is redrawn as the band moves.
			const map = filter.querySelector('feImage')!;
			await expect.poll(() => map.getAttribute('href')).toMatch(/^data:image\/png/);
			const first = map.getAttribute('href');
			await expect.poll(() => map.getAttribute('href')).not.toBe(first);
			const rules = [...document.head.querySelectorAll('style')].map((style) => style.textContent);
			expect(rules.some((rule) => rule?.includes(`filter: url(#${filter.id})`))).toBe(true);

			await handle.done;
			expect(lens()).toBeNull();
			expect(element.textContent).toBe('after');
		}
	);

	test.runIf(scopedTransitions)(
		'a sweep started before the last one ends keeps its cut and lens to the end',
		async () => {
			const element = mount('margin: 40px;');
			const filterOfOld = () =>
				getComputedStyle(element, '::view-transition-old(root)').getPropertyValue('filter');
			const first = glimm(element, {
				preset: 'surge',
				sweepMs: 1500,
				change: () => (element.textContent = 'one')
			});
			await expect.poll(filterOfOld).toMatch(/glimm-lens/);
			const second = glimm(element, {
				preset: 'surge',
				sweepMs: 1500,
				change: () => (element.textContent = 'two')
			});
			await first.done;
			// The first sweep, taken over, has ended: the second still holds the element.
			await new Promise((resolve) => setTimeout(resolve, 200));
			expect(element.hasAttribute('data-glimm-scope')).toBe(true);
			expect(filterOfOld()).toMatch(/glimm-lens/);
			second.cancel();
			await second.done;
			expect(element.hasAttribute('data-glimm-scope')).toBe(false);
		}
	);

	test('the band is clipped to the scroll container around the element', async () => {
		const scroller = document.createElement('div');
		scroller.setAttribute('style', 'height: 100px; overflow: auto;');
		const element = mount('height: 300px;');
		scroller.append(element);
		document.body.append(scroller);
		scroller.scrollTop = 50;

		const handle = glimm(element, { sweepMs: 2000 });
		await expect.poll(overlay).not.toBeNull();
		await expect.poll(() => overlay()!.style.clipPath).toBe('inset(50px 0px 150px)');
		handle.cancel();
	});
});

describe('palette colours', () => {
	test('CSS colours, custom properties included, read as sRGB hex', () => {
		const element = mount('--brand: oklch(0.628 0.2577 29.23); color: rgb(0, 128, 255);');
		expect(toHex('#ff3d7f', element)).toBe('#ff3d7f');
		expect(toHex('var(--brand)', element)).toBe('#ff0000');
		expect(toHex('var(--missing, rgb(1, 2, 3))', element)).toBe('#010203');
		expect(toHex('currentColor', element)).toBe('#0080ff');
		expect(toHex('not a colour', element)).toBeNull();
	});
});
