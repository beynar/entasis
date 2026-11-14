// What glimm(element) asks of the glimm package: the band's colours from the theme's semantic
// roles, the preset values under the options passed, and a dimmer band over a dark surface.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const calls = vi.hoisted(() => ({
	chains: [] as string[][],
	pairs: [] as string[][],
	sweeps: [] as Record<string, unknown>[]
}));

vi.mock('glimm', async (importOriginal) => {
	const original = await importOriginal<typeof import('glimm')>();
	return {
		...original,
		accentChain: (hexes: string[]) => {
			calls.chains.push(hexes);
			return original.accentChain(hexes);
		},
		accentPair: (a: string, b: string) => {
			calls.pairs.push([a, b]);
			return original.accentPair(a, b);
		},
		playSweep: (ctrl: Parameters<typeof original.playSweep>[0], options = {}) => {
			calls.sweeps.push(options as Record<string, unknown>);
			return original.playSweep(ctrl, { ...options, sweepMs: 50, outroMs: 10 });
		}
	};
});

const { glimm } = await import('./glimm.js');

const mount = (style = '') => {
	const element = document.createElement('div');
	element.setAttribute(
		'style',
		`width: 200px; height: 100px; background: rgb(255, 255, 255);
		--color-primary: rgb(0, 0, 255); --color-success: rgb(0, 128, 0); ${style}`
	);
	document.body.append(element);
	return element;
};

beforeEach(() => {
	calls.chains.length = 0;
	calls.pairs.length = 0;
	calls.sweeps.length = 0;
});
afterEach(() => document.body.replaceChildren());

describe('colours', () => {
	test('by default the band is the primary colour between its two hue neighbours', async () => {
		await glimm(mount()).done;
		expect(calls.chains).toHaveLength(1);
		const [before, middle, after] = calls.chains[0];
		expect(middle).toBe('#0000ff');
		expect(before).not.toBe(middle);
		expect(after).not.toBe(middle);
		expect(before).not.toBe(after);
	});

	test('color picks another semantic role', async () => {
		await glimm(mount(), { color: 'success' }).done;
		expect(calls.chains[0][1]).toBe('#008000');
	});

	test('a palette blends semantic roles', async () => {
		await glimm(mount('--color-danger: rgb(255, 0, 0);'), { palette: ['success', 'danger'] }).done;
		expect(calls.pairs).toEqual([['#008000', '#ff0000']]);
		expect(calls.chains).toHaveLength(0);
	});
});

describe('presets', () => {
	test('a change reveals with a band, a plain sweep glints', async () => {
		const element = mount();
		await glimm(element, { change: () => {} }).done;
		await glimm(element).done;
		expect(calls.sweeps.at(-1)).toMatchObject({ sweepMs: 900, peakAlpha: 0.85 });
		// One 1000 ms pass, or its covering share where the curtain stands in for the snapshot.
		expect([1000, 1000 * 0.56]).toContain(calls.sweeps[0].sweepMs);
	});

	test('the options passed win over the preset', async () => {
		await glimm(mount(), { preset: 'wave', waveAmount: 0.4 }).done;
		expect(calls.sweeps[0]).toMatchObject({ sweepMs: 1250, waveAmount: 0.4, rippleAmount: 1.4 });
	});

	test('over a dark surface the band is dimmed, unless brightness is set', async () => {
		await glimm(mount('background: rgb(20, 20, 24);')).done;
		await glimm(mount('background: rgb(20, 20, 24);'), { brightness: 1.2 }).done;
		await glimm(mount()).done;
		expect(calls.sweeps.map((sweep) => sweep.brightness)).toEqual([0.8, 1.2, 1]);
	});
});
