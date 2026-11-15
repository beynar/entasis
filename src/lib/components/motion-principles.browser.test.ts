// The library's motion rules, measured in real engines on components at their default motion:
// surfaces scale in from 0.95 and leave in 80% of their entrance, a pressed
// button and a switch thumb deform, icons crossfade, and a floating window flies on a curve.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './MotionPrinciplesHarness.test.svelte';

const byTestId = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const button = (name: string) => page.getByRole('button', { name, exact: true });

/**
 * The running keyframe animations on `node` or its ancestors, Svelte transitions included. Svelte
 * first runs an empty animation for a transition's delay, so the ones without frames are left out.
 */
const animationsAround = (node: Element) =>
	document
		.getAnimations()
		.filter(
			(animation) =>
				animation.effect instanceof KeyframeEffect &&
				animation.effect.target instanceof Element &&
				animation.effect.target.contains(node) &&
				animation.effect.getKeyframes().length > 0
		);

const duration = (animation: Animation) => Number(animation.effect?.getTiming().duration ?? 0);

describe('surfaces', () => {
	test('a popover scales in from 0.95 and leaves in 80% of its entrance', async () => {
		await render(Harness);
		await button('Details').click();
		await expect.poll(() => byTestId('popover-body')).not.toBeNull();
		const body = byTestId('popover-body')!;
		await expect.poll(() => animationsAround(body).length).toBeGreaterThan(0);
		const enter = animationsAround(body);
		const enterDuration = Math.max(...enter.map(duration));
		expect(enterDuration).toBe(200);
		const first = (enter[0].effect as KeyframeEffect).getKeyframes()[0];
		expect(String(first.transform)).toContain('scale(0.95)');

		// Once the entrance has finished, the way out.
		await Promise.all(enter.map((animation) => animation.finished));
		await userEvent.keyboard('{Escape}');
		await expect.poll(() => animationsAround(body).length).toBeGreaterThan(0);
		const exit = animationsAround(body);
		expect(Math.max(...exit.map(duration))).toBe(160);
	});
});

describe('pressed triggers', () => {
	test('a trigger shrinking under the press does not move its open popover', async () => {
		await render(Harness);
		await button('Details').click();
		await expect.poll(() => byTestId('popover-body')).not.toBeNull();
		const body = byTestId('popover-body')!;
		// Its entrance over: no longer scaled.
		await expect.poll(() => body.getBoundingClientRect().width).toBeCloseTo(body.offsetWidth, 1);
		const trigger = button('Details').element() as HTMLElement;
		const before = body.getBoundingClientRect();

		// What a press does to it, exaggerated so a shift cannot hide in rounding: shrink around its
		// centre, then a resize makes the popover place itself again.
		trigger.style.transition = 'none';
		trigger.style.scale = '0.8';
		window.dispatchEvent(new Event('resize'));
		await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 50)));
		const after = body.getBoundingClientRect();
		expect(trigger.getBoundingClientRect().height).toBeLessThan(trigger.offsetHeight);
		expect(after.x).toBeCloseTo(before.x, 0);
		expect(after.y).toBeCloseTo(before.y, 0);
	});
});

describe('press feedback', () => {
	test('a button transitions its scale and shrinks to the Theme press scale while pressed', async () => {
		await render(Harness);
		const press = byTestId('press')!;
		expect(getComputedStyle(press).transitionProperty).toContain('scale');
		expect(press.className).toContain('active:scale-(--motion-press-scale)');
		expect(
			getComputedStyle(document.documentElement).getPropertyValue('--motion-press-scale')
		).toBe('0.97');
		expect(press.className).not.toContain('translate-y-px');
	});

	test('a switch thumb stretches halfway across, not on press', async () => {
		await render(Harness);
		const toggle = page.getByRole('switch').element() as HTMLElement;
		const thumb = toggle.querySelector<HTMLElement>('[data-checked]')!;
		expect(thumb.className).not.toContain('active:');
		await userEvent.click(toggle);
		await expect.poll(() => thumb.dataset.checked).toBe('true');
		const frames = thumb
			.getAnimations()
			.map((animation) => (animation.effect as KeyframeEffect).getKeyframes())
			.find((keyframes) => keyframes.some((frame) => String(frame.scale).startsWith('1.25')));
		// Round at both ends, longest halfway. Engines serialize `1 1` as `1`.
		const widths = frames?.map((frame) => [
			frame.computedOffset,
			Number(String(frame.scale).split(' ')[0])
		]);
		expect(widths).toEqual([
			[0, 1],
			[0.5, 1.25],
			[1, 1]
		]);
	});
});

describe('icon swaps', () => {
	test('the outgoing icon shrinks and blurs while the incoming one pops in', async () => {
		await render(Harness);
		const from = byTestId('icon-from')!.parentElement!;
		const to = byTestId('icon-to')!.parentElement!;
		expect(getComputedStyle(to).opacity).toBe('0');
		expect(getComputedStyle(to).filter).toContain('blur');
		expect(getComputedStyle(from).transitionProperty).toContain('filter');

		await button('Swap').click();
		await expect.poll(() => getComputedStyle(to).animationName).toContain('icon-swap-pulse');
		expect(to.getAttribute('aria-hidden')).toBeNull();
		expect(from.getAttribute('aria-hidden')).toBe('true');
	});
});

describe('travel', () => {
	test('a floating window flies to the dock along a curve, the vertical part leading', async () => {
		await render(Harness);
		await expect.poll(() => document.querySelector('[role="dialog"]')).not.toBeNull();
		const windowNode = document.querySelector<HTMLElement>('[role="dialog"]')!;
		// Let the window's own entrance finish first.
		await new Promise((resolve) => setTimeout(resolve, 400));

		await button('Toggle dock').click();
		const flight = () =>
			document
				.getAnimations()
				.find(
					(animation) =>
						animation.effect instanceof KeyframeEffect &&
						animation.effect.target === windowNode &&
						animation.effect.getKeyframes().length > 0
				);
		await expect.poll(flight).toBeDefined();
		const frames = (flight()!.effect as KeyframeEffect).getKeyframes();
		const offset = (frame: Keyframe) => {
			const match = /translate\((-?[\d.e-]+)px,\s*(-?[\d.e-]+)px\)/.exec(String(frame.transform));
			if (!match) throw new Error(`no translate in ${String(frame.transform)}`);
			return { x: Number(match[1]), y: Number(match[2]) };
		};
		// Outgoing, the window starts in place and ends on the dock chip. Halfway through the
		// trip, the vertical share of it is ahead of the horizontal one.
		const end = offset(frames.at(-1)!);
		expect(Math.abs(end.x)).toBeGreaterThan(10);
		expect(Math.abs(end.y)).toBeGreaterThan(10);
		const middle = offset(frames[Math.floor(frames.length / 2)]);
		expect(middle.y / end.y - middle.x / end.x).toBeGreaterThan(0.1);
	});
});
