// ThinkingOrb in real engines: each state draws on its canvas in the ink read from the page, the
// drawing follows the root's box, and the orb holds still when it is paused or motion is reduced.
import { afterEach, describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ThinkingOrb from './ThinkingOrb.svelte';
import { createThinkingOrbPlayer, type ThinkingOrbPlayerInputs } from './thinkingOrb.player.js';
import type { ThinkingOrbState } from './thinkingOrb.props.js';

const root = () => document.querySelector<HTMLElement>('[data-slot="thinking-orb"]')!;
const canvas = () => root().querySelector('canvas')!;

const pixels = (node: HTMLCanvasElement = canvas()) =>
	node.getContext('2d')!.getImageData(0, 0, node.width, node.height).data;

/** The share of a canvas that is painted, and its mean colour where it is. */
const painted = (node: HTMLCanvasElement = canvas()) => {
	const data = pixels(node);
	let count = 0;
	const sum = [0, 0, 0];
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] < 40) continue;
		count++;
		for (let c = 0; c < 3; c++) sum[c] += data[i + c];
	}
	return {
		share: count / (data.length / 4),
		color: sum.map((value) => value / Math.max(1, count))
	};
};

const frames = (count: number) =>
	new Promise<void>((resolve) => {
		const step = () => (count-- > 0 ? requestAnimationFrame(step) : resolve());
		step();
	});

/** Has the page's tokens read again, as a theme change does. */
const pokeTokens = () => {
	const html = document.documentElement;
	html.style.setProperty('--thinking-orb-test', String(performance.now()));
};

const states: ThinkingOrbState[] = [
	'working',
	'searching',
	'solving',
	'listening',
	'connecting',
	'weaving',
	'composing',
	'breathing',
	'shaping'
];

afterEach(() => {
	document.documentElement.style.removeProperty('--thinking-orb-test');
});

describe('ThinkingOrb', () => {
	test.each(states)('%s draws on its canvas', async (state) => {
		render(ThinkingOrb, { props: { state, size: 'large' } });

		await expect.poll(() => painted().share).toBeGreaterThan(0.01);
		expect(root().getBoundingClientRect().width).toBe(64);
		expect(root().getBoundingClientRect().height).toBe(64);
		// The canvas keeps a pixel per device pixel, up to three.
		const ratio = Math.min(3, window.devicePixelRatio);
		expect(canvas().width).toBe(Math.round(64 * ratio));
		expect(canvas().height).toBe(Math.round(64 * ratio));
	});

	test('the three sizes are 20, 32 and 64 pixels, and a diameter is any size', async () => {
		const view = await render(ThinkingOrb, { props: { size: 'small' } });
		expect(root().getBoundingClientRect().width).toBe(20);

		await view.rerender({ size: 'normal' });
		expect(root().getBoundingClientRect().width).toBe(32);

		await view.rerender({ size: 'large' });
		expect(root().getBoundingClientRect().width).toBe(64);

		await view.rerender({ diameter: 100 });
		expect(root().getBoundingClientRect().width).toBe(100);
		const ratio = Math.min(3, window.devicePixelRatio);
		await expect.poll(() => canvas().width).toBe(Math.round(100 * ratio));
		await expect.poll(() => painted().share).toBeGreaterThan(0.01);
	});

	test('is an image named by its state, or by its label', async () => {
		const view = await render(ThinkingOrb, { props: { state: 'solving' } });
		expect(root().getAttribute('role')).toBe('img');
		expect(root().getAttribute('aria-label')).toBe('Solving…');
		expect(canvas().getAttribute('aria-hidden')).toBe('true');

		await view.rerender({ state: 'breathing' });
		expect(root().getAttribute('aria-label')).toBe('Thinking…');
		expect(root().dataset.state).toBe('breathing');

		await view.rerender({ label: 'Reading the file' });
		expect(root().getAttribute('aria-label')).toBe('Reading the file');
	});

	test('the ink is the text colour of the root', async () => {
		render(ThinkingOrb, { props: { state: 'searching', size: 'large', colorScheme: 'dark' } });
		await expect.poll(() => painted().share).toBeGreaterThan(0.01);

		root().style.color = 'rgb(255, 0, 0)';
		pokeTokens();
		// On a dark surface the ink only fades toward black: red stays pure red.
		await expect
			.poll(() => {
				const [r, g, b] = painted().color;
				return r > 60 && g < 2 && b < 2;
			})
			.toBe(true);
	});

	test('depth fades the ink toward white on a light surface, toward black on a dark one', async () => {
		const view = await render(ThinkingOrb, {
			props: { state: 'searching', size: 'large', colorScheme: 'light' }
		});
		root().style.color = 'rgb(255, 0, 0)';
		pokeTokens();
		await expect.poll(() => painted().color[1]).toBeGreaterThan(20);

		await view.rerender({ colorScheme: 'dark' });
		await expect.poll(() => painted().color[1]).toBeLessThan(2);
	});

	test('moves while it plays, and holds its frame while paused', async () => {
		const view = await render(ThinkingOrb, { props: { state: 'working', size: 'large' } });
		await expect.poll(() => painted().share).toBeGreaterThan(0.01);

		const first = pixels().slice();
		await expect.poll(() => pixels().some((value, i) => value !== first[i])).toBe(true);

		await view.rerender({ paused: true });
		expect(root().hasAttribute('data-paused')).toBe(true);
		await frames(2);
		const held = pixels().slice();
		await frames(6);
		expect(pixels()).toEqual(held);

		await view.rerender({ paused: false });
		await expect.poll(() => pixels().some((value, i) => value !== held[i])).toBe(true);
	});

	test('a change of state crosses into the new drawing and settles on it', async () => {
		const view = await render(ThinkingOrb, { props: { state: 'shaping', size: 'large' } });
		await expect.poll(() => painted().share).toBeGreaterThan(0.005);
		const outline = painted().share;

		// The globe covers far more of the canvas than the outline does.
		await view.rerender({ state: 'searching' });
		expect(root().dataset.state).toBe('searching');
		await expect.poll(() => painted().share).toBeGreaterThan(outline * 2);
	});

	test('a drawing of your own is painted in place of the state', async () => {
		render(ThinkingOrb, {
			props: {
				size: 'large',
				// One large dot in the middle: most of the canvas is painted.
				frame: (size: number) => ({
					dots: [{ x: size / 2, y: size / 2, z: 0, r: size * 0.4, white: 0 }],
					lines: []
				})
			}
		});

		await expect.poll(() => painted().share).toBeGreaterThan(0.4);
	});
});

describe('ThinkingOrb player', () => {
	const mount = (inputs: Partial<ThinkingOrbPlayerInputs>) => {
		const node = document.createElement('canvas');
		node.style.cssText = 'display:block;width:64px;height:64px';
		document.body.append(node);
		const all: ThinkingOrbPlayerInputs = {
			state: 'working',
			speed: 1,
			paused: false,
			reducedMotion: false,
			dark: false,
			ink: null,
			dots: 1,
			dotSize: 1,
			...inputs
		};
		const player = createThinkingOrbPlayer(node, () => all);
		return {
			node,
			inputs: all,
			player,
			remove: () => {
				player.destroy();
				node.remove();
			}
		};
	};

	test('under reduced motion it shows one still frame, and swaps it at once on a new state', async () => {
		const orb = mount({ reducedMotion: true, state: 'shaping' });
		await expect.poll(() => painted(orb.node).share).toBeGreaterThan(0.005);
		const still = pixels(orb.node).slice();
		await frames(6);
		expect(pixels(orb.node)).toEqual(still);

		orb.inputs.state = 'searching';
		orb.player.sync();
		// No crossing: the new frame is there at once, and holds.
		const swapped = pixels(orb.node).slice();
		expect(swapped).not.toEqual(still);
		await frames(6);
		expect(pixels(orb.node)).toEqual(swapped);
		orb.remove();
	});

	test('two orbs in the same state show the same frame', async () => {
		const one = mount({ state: 'solving', paused: true });
		await frames(3);
		const other = mount({ state: 'solving', paused: true });
		// Held at different instants, they differ; playing, they read one clock.
		one.inputs.paused = false;
		other.inputs.paused = false;
		one.player.sync();
		other.player.sync();
		await expect
			.poll(() => {
				const a = pixels(one.node);
				const b = pixels(other.node);
				return a.length === b.length && a.every((value, i) => value === b[i]);
			})
			.toBe(true);
		one.remove();
		other.remove();
	});

	test('stops drawing once destroyed', async () => {
		const orb = mount({ state: 'working' });
		await expect.poll(() => painted(orb.node).share).toBeGreaterThan(0.01);
		orb.player.destroy();
		const last = pixels(orb.node).slice();
		await frames(6);
		expect(pixels(orb.node)).toEqual(last);
		orb.node.remove();
	});
});
