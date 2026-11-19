// VoiceIndicator in real engines: each look draws on its canvas, the level follows a source only
// in the states that listen, and the indicator can be the session's button.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import VoiceIndicator from './VoiceIndicator.svelte';

const root = () => document.querySelector<HTMLElement>('[data-slot="voice-indicator"]')!;
const canvas = () => root().querySelector('canvas')!;

/** The share of the canvas that is painted, and its mean colour where it is. */
const painted = () => {
	const node = canvas();
	const { data } = node.getContext('2d')!.getImageData(0, 0, node.width, node.height);
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

afterEach(() => {
	document.documentElement.style.removeProperty('--color-danger');
	document.documentElement.style.removeProperty('--color-primary');
});

describe('VoiceIndicator', () => {
	test.each([
		['ring', 'light'],
		['ring', 'solid'],
		['orb', 'light'],
		['orb', 'solid']
	] as const)('the %s in %s draws on its canvas', async (variant, appearance) => {
		render(VoiceIndicator, {
			props: { variant, appearance, diameter: 120, state: 'speaking', output: 0.7 }
		});

		await expect.poll(() => painted().share).toBeGreaterThan(0.02);
		expect(root().getBoundingClientRect().width).toBe(120);
		// The canvas keeps a pixel per device pixel, up to two.
		const ratio = Math.min(2, window.devicePixelRatio);
		expect(canvas().width).toBe(Math.round(120 * ratio));
		expect(canvas().height).toBe(Math.round(120 * ratio));
	});

	test('the level follows the source while listening, and ignores it while idle', async () => {
		const onLevelChange = vi.fn();
		const view = await render(VoiceIndicator, {
			props: { state: 'listening', input: () => 0.8, tuning: { idle: 0 }, onLevelChange }
		});

		await expect.poll(() => onLevelChange.mock.lastCall?.[0] ?? 0).toBeGreaterThan(0.7);

		await view.rerender({ state: 'idle' });
		await expect.poll(() => onLevelChange.mock.lastCall?.[0] ?? 1).toBeLessThan(0.05);
	});

	test('each side stands in for the other when only one is given', async () => {
		const onLevelChange = vi.fn();
		render(VoiceIndicator, {
			props: { state: 'speaking', input: 0.9, tuning: { idle: 0 }, onLevelChange }
		});

		await expect.poll(() => onLevelChange.mock.lastCall?.[0] ?? 0).toBeGreaterThan(0.7);
	});

	test('reads loudness from an analyser', async () => {
		// A steady tone, as an AnalyserNode would report it.
		const analyser = {
			fftSize: 1024,
			frequencyBinCount: 512,
			context: { sampleRate: 48000 },
			getFloatTimeDomainData: (buffer: Float32Array) => {
				for (let i = 0; i < buffer.length; i++) buffer[i] = 0.2 * Math.sin(i * 0.3);
			},
			getByteFrequencyData: (buffer: Uint8Array) => buffer.fill(120)
		} as unknown as AnalyserNode;
		const onLevelChange = vi.fn();
		render(VoiceIndicator, {
			props: { state: 'listening', input: analyser, tuning: { idle: 0 }, onLevelChange }
		});

		await expect.poll(() => onLevelChange.mock.lastCall?.[0] ?? 0).toBeGreaterThan(0.5);
	});

	test('a curve of your own decides the level a loudness shows', async () => {
		const onLevelChange = vi.fn();
		const view = await render(VoiceIndicator, {
			props: {
				state: 'listening',
				input: 0.2,
				curve: 'exp',
				tuning: { idle: 0 },
				onLevelChange
			}
		});
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(onLevelChange.mock.lastCall?.[0] ?? 0).toBeLessThan(0.1);

		await view.rerender({ curve: (level: number) => (level > 0 ? 1 : 0) });
		await expect.poll(() => onLevelChange.mock.lastCall?.[0] ?? 0).toBeGreaterThan(0.9);
	});

	test('paused holds the level where it is', async () => {
		const onLevelChange = vi.fn();
		render(VoiceIndicator, {
			props: { state: 'listening', input: 0.9, paused: true, tuning: { idle: 0 }, onLevelChange }
		});

		await new Promise((resolve) => setTimeout(resolve, 300));
		expect(Math.max(0, ...onLevelChange.mock.calls.map(([level]) => level))).toBe(0);
		// Held, it still draws its frame.
		expect(painted().share).toBeGreaterThan(0.02);
	});

	test('a colour role is read from the page, and an error shows the danger role', async () => {
		document.documentElement.style.setProperty('--color-danger', 'rgb(225, 30, 30)');
		document.documentElement.style.setProperty('--color-primary', 'rgb(30, 60, 225)');
		const view = await render(VoiceIndicator, {
			props: { variant: 'orb', appearance: 'solid', color: 'primary', paused: true }
		});

		expect(root().dataset.color).toBe('primary');
		await expect
			.poll(() => {
				const [red, , blue] = painted().color;
				return blue - red;
			})
			.toBeGreaterThan(40);

		await view.rerender({ state: 'error' });
		expect(root().dataset.color).toBe('danger');
		await expect
			.poll(() => {
				const [red, , blue] = painted().color;
				return red - blue;
			})
			.toBeGreaterThan(40);
	});

	test('is an image named by its state, or by the label given', async () => {
		const view = await render(VoiceIndicator, { props: { state: 'thinking' } });

		expect(root().getAttribute('role')).toBe('img');
		expect(root().getAttribute('aria-label')).toBe('Voice assistant thinking');
		expect(canvas().getAttribute('aria-hidden')).toBe('true');

		await view.rerender({ label: 'Ada is thinking' });
		expect(root().getAttribute('aria-label')).toBe('Ada is thinking');
	});

	test('as a button, a press starts the session while idle and stops it otherwise', async () => {
		const onStart = vi.fn();
		const onStop = vi.fn();
		const view = await render(VoiceIndicator, { props: { onStart, onStop } });

		expect(root().tagName).toBe('BUTTON');
		expect(root().getAttribute('aria-label')).toBe('Start voice session');
		const description = document.getElementById(root().getAttribute('aria-describedby')!)!;
		expect(description.textContent).toBe('Voice assistant idle');
		root().click();
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(onStop).not.toHaveBeenCalled();

		await view.rerender({ state: 'listening' });
		expect(root().getAttribute('aria-label')).toBe('Stop voice session');
		root().click();
		expect(onStop).toHaveBeenCalledTimes(1);

		await view.rerender({ state: 'error' });
		root().click();
		expect(onStart).toHaveBeenCalledTimes(2);

		await view.rerender({ disabled: true });
		root().click();
		expect(onStart).toHaveBeenCalledTimes(2);
	});

	test('a ring given a direction is drawn past its box on both sides', async () => {
		const view = await render(VoiceIndicator, { props: { diameter: 100, direction: 0 } });

		await expect.poll(() => canvas().getBoundingClientRect().width).toBeGreaterThan(160);
		const box = root().getBoundingClientRect();
		const drawn = canvas().getBoundingClientRect();
		expect(drawn.left + drawn.width / 2).toBeCloseTo(box.left + box.width / 2, 0);

		// An orb drifts inside its box instead.
		await view.rerender({ variant: 'orb' });
		await expect.poll(() => canvas().getBoundingClientRect().width).toBe(100);
	});

	test('stops its loop and releases its listeners when removed', async () => {
		const cancel = vi.spyOn(window, 'cancelAnimationFrame');
		const view = await render(VoiceIndicator, { props: { hoverBend: true } });
		await expect.poll(() => painted().share).toBeGreaterThan(0.02);

		view.unmount();
		expect(cancel).toHaveBeenCalled();
		cancel.mockRestore();
	});
});
