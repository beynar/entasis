import '@testing-library/jest-dom/vitest';
import { render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import StepperTransitionHarness from './StepperTransitionHarness.test.svelte';

const items = ['One', 'Two', 'Three'];

const panels = () => Array.from(document.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
const visiblePanels = () => panels().filter((panel) => !panel.hasAttribute('hidden'));

// The shared setup stub finishes on the next macrotask, which would end the slide before the
// assertion runs. This one never settles, so the component stays in its mid-transition state.
let animate: ReturnType<typeof vi.spyOn> | undefined;
beforeEach(() => {
	animate = vi.spyOn(Element.prototype, 'animate').mockImplementation(
		() =>
			({
				cancel() {},
				finish() {},
				play() {},
				pause() {},
				finished: new Promise(() => {}),
				onfinish: null,
				oncancel: null
			}) as unknown as Animation
	);
});
afterEach(() => {
	animate?.mockRestore();
});

// jsdom never fires rAF from a ResizeObserver, so the scroller's first measurement has to be
// awaited before a step change can start an animation at all.
const settle = async () => {
	await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
	await tick();
};

describe('Stepper panel visibility across a step change', () => {
	test('hides every inactive panel at rest', async () => {
		render(StepperTransitionHarness, { props: { items, value: 0 } });
		await settle();

		expect(visiblePanels()).toHaveLength(1);
		expect(visiblePanels()[0]).toHaveTextContent('Panel One');
	});

	test('keeps the panel the track slides away from rendered until the slide settles', async () => {
		const { rerender } = render(StepperTransitionHarness, { props: { items, value: 0 } });
		await settle();

		await rerender({ items, value: 1 });
		await tick();

		// Both the incoming and the outgoing panel are laid out, so the outgoing one can slide and
		// fade out and the root can transition between two measured heights.
		const visible = visiblePanels();
		expect(visible.map((panel) => panel.textContent?.trim())).toEqual(['Panel One', 'Panel Two']);
		// The outgoing panel is still out of the accessibility tree the whole time.
		const [leaving] = visible;
		expect(leaving).toHaveAttribute('aria-hidden', 'true');
		expect(leaving.inert || leaving.hasAttribute('inert')).toBe(true);
	});

	test('lazy keeps the outgoing panel mounted for the slide, then drops it', async () => {
		const { rerender } = render(StepperTransitionHarness, {
			props: { items, value: 0, mount: 'lazy' }
		});
		await settle();

		await rerender({ items, value: 1, mount: 'lazy' });
		await tick();

		expect(
			panels()
				.map((panel) => panel.textContent?.trim() ?? '')
				.filter(Boolean)
		).toEqual(['Panel One', 'Panel Two']);
	});
});
