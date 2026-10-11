import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DisclosurePanelHarness from './DisclosurePanelHarness.test.svelte';
import DisclosurePanelThemeHarness from './DisclosurePanelThemeHarness.test.svelte';

type FakeAnimation = {
	element: Element;
	keyframes: Keyframe[];
	options: KeyframeAnimationOptions;
	cancelled: boolean;
	onfinish: (() => void) | null;
	cancel: () => void;
	finish: () => void;
};

let animations: FakeAnimation[] = [];

// The natural box jsdom cannot lay out.
const NATURAL = {
	height: '120px',
	paddingTop: '8px',
	paddingBottom: '8px',
	borderTopWidth: '1px',
	borderBottomWidth: '1px',
	marginTop: '0px',
	marginBottom: '4px'
};
const COLLAPSED = Object.fromEntries(Object.keys(NATURAL).map((key) => [key, '0px']));

beforeEach(() => {
	animations = [];
	vi.spyOn(Element.prototype, 'animate').mockImplementation(function (
		this: Element,
		keyframes,
		options
	) {
		const animation: FakeAnimation = {
			element: this,
			keyframes: keyframes as Keyframe[],
			options: options as KeyframeAnimationOptions,
			cancelled: false,
			onfinish: null,
			cancel() {
				animation.cancelled = true;
			},
			finish() {
				animation.onfinish?.();
			}
		};
		animations.push(animation);
		return animation as unknown as Animation;
	});
	const getComputedStyle = window.getComputedStyle.bind(window);
	vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
		const style = getComputedStyle(element, pseudo);
		if (!(element as HTMLElement).dataset?.testid?.startsWith('panel')) return style;
		return { ...NATURAL } as unknown as CSSStyleDeclaration;
	});
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
});

const toggle = () => fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
const panel = () => screen.queryByTestId('panel');
const status = () => screen.getByTestId('status').textContent;
const heightVariable = () => panel()?.style.getPropertyValue('--disclosure-panel-height');

describe('disclosurePanel', () => {
	test('a kept panel hides while closed, then animates open and reports it once', async () => {
		const onAfterOpen = vi.fn();
		render(DisclosurePanelHarness, {
			keepMounted: true,
			motion: { in: { duration: 150, easing: 'linear' }, out: { duration: 100 } },
			onAfterOpen
		});
		expect(panel()).toHaveAttribute('hidden', '');
		expect(panel()).toHaveAttribute('data-closed', '');
		expect(heightVariable()).toBe('0px');
		expect(animations).toHaveLength(0);

		await toggle();
		expect(panel()).not.toHaveAttribute('hidden');
		expect(panel()).toHaveAttribute('data-open', '');
		expect(panel()).toHaveAttribute('data-entering', '');
		expect(status()).toBe('entering');
		expect(animations).toHaveLength(1);
		expect(animations[0].keyframes).toEqual([COLLAPSED, NATURAL]);
		expect(animations[0].options).toMatchObject({ duration: 150, easing: 'linear' });
		expect(heightVariable()).toBe('120px');
		expect(panel()!.style.overflow).toBe('hidden');
		expect(onAfterOpen).not.toHaveBeenCalled();

		animations[0].finish();
		await tick();
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(status()).toBe('open');
		expect(panel()).not.toHaveAttribute('data-entering');
		expect(heightVariable()).toBe('auto');
		expect(panel()!.style.overflow).toBe('');
		expect(animations[0].cancelled).toBe(true);
	});

	test('an initially open panel does not animate or report an open', async () => {
		const onAfterOpen = vi.fn();
		render(DisclosurePanelHarness, { defaultOpen: true, onAfterOpen });
		await tick();
		expect(panel()).toHaveAttribute('data-open', '');
		expect(heightVariable()).toBe('auto');
		expect(animations).toHaveLength(0);
		expect(onAfterOpen).not.toHaveBeenCalled();
	});

	test('a closing panel stays visible until its exit animation ends, then hides', async () => {
		const onAfterClose = vi.fn();
		render(DisclosurePanelHarness, {
			defaultOpen: true,
			keepMounted: true,
			motion: { out: { duration: 100 } },
			onAfterClose
		});
		await toggle();
		expect(panel()).not.toHaveAttribute('hidden');
		expect(panel()).toHaveAttribute('data-closed', '');
		expect(panel()).toHaveAttribute('data-exiting', '');
		expect(animations[0].keyframes).toEqual([NATURAL, COLLAPSED]);
		expect(animations[0].options).toMatchObject({ duration: 100, fill: 'both' });

		animations[0].finish();
		expect(onAfterClose).toHaveBeenCalledOnce();
		// The collapsed fill holds until `hidden` reaches the DOM.
		expect(animations[0].cancelled).toBe(false);
		await tick();
		expect(panel()).toHaveAttribute('hidden', '');
		expect(panel()).not.toHaveAttribute('data-exiting');
		expect(animations[0].cancelled).toBe(true);
		expect(heightVariable()).toBe('0px');
		expect(status()).toBe('closed');
		expect(onAfterClose).toHaveBeenCalledOnce();
	});

	test('a panel that is not kept renders for the open and leaves after the exit', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(DisclosurePanelHarness, { onAfterOpen, onAfterClose });
		expect(panel()).toBeNull();

		await toggle();
		expect(panel()).toBeInTheDocument();
		expect(animations).toHaveLength(1);
		animations[0].finish();
		await tick();
		expect(onAfterOpen).toHaveBeenCalledOnce();

		await toggle();
		expect(panel()).toBeInTheDocument();
		expect(panel()).toHaveAttribute('data-exiting', '');
		animations[1].finish();
		await tick();
		expect(panel()).toBeNull();
		expect(onAfterClose).toHaveBeenCalledOnce();
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});

	test('a change during an animation reverses it from where it is and reports only the end', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(DisclosurePanelHarness, { keepMounted: true, onAfterOpen, onAfterClose });
		await toggle();
		expect(animations).toHaveLength(1);
		await toggle();
		expect(animations[0].cancelled).toBe(true);
		expect(animations).toHaveLength(2);
		// The reverse starts from the box read while the first animation ran.
		expect(animations[1].keyframes[0]).toEqual(NATURAL);
		expect(animations[1].keyframes[1]).toEqual(COLLAPSED);
		// A stale finish of the cancelled animation changes nothing.
		animations[0].finish();
		expect(onAfterOpen).not.toHaveBeenCalled();
		expect(onAfterClose).not.toHaveBeenCalled();
		animations[1].finish();
		await tick();
		expect(onAfterOpen).not.toHaveBeenCalled();
		expect(onAfterClose).toHaveBeenCalledOnce();
		expect(panel()).toHaveAttribute('hidden', '');
	});

	test('without motion, each change reports once and nothing animates', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		render(DisclosurePanelHarness, {
			motion: { in: { duration: 0 }, out: { duration: 0 } },
			onAfterOpen,
			onAfterClose
		});
		await toggle();
		expect(onAfterOpen).toHaveBeenCalledOnce();
		expect(status()).toBe('open');
		await toggle();
		expect(onAfterClose).toHaveBeenCalledOnce();
		expect(panel()).toBeNull();
		await toggle();
		await toggle();
		expect(onAfterOpen).toHaveBeenCalledTimes(2);
		expect(onAfterClose).toHaveBeenCalledTimes(2);
		expect(animations).toHaveLength(0);
	});

	test('a Theme with reduced motion turns the animation off', async () => {
		const onAfterOpen = vi.fn();
		render(DisclosurePanelThemeHarness, {
			reduceMotion: true,
			motion: { in: { duration: 300 } },
			onAfterOpen
		});
		await toggle();
		expect(animations).toHaveLength(0);
		expect(onAfterOpen).toHaveBeenCalledOnce();
	});

	test("durations default to the Theme's normal step", async () => {
		render(DisclosurePanelThemeHarness, {
			reduceMotion: false,
			motionTokens: { duration: { normal: 321 } }
		});
		await toggle();
		expect(animations[0].options.duration).toBe(321);
	});

	test('a panel removed while it closes finishes closing', async () => {
		const onAfterClose = vi.fn();
		const { unmount } = render(DisclosurePanelHarness, { defaultOpen: true, onAfterClose });
		await toggle();
		expect(animations).toHaveLength(1);
		unmount();
		expect(onAfterClose).toHaveBeenCalledOnce();
	});

	describe('hiddenUntilFound', () => {
		test('a closed panel stays findable under hidden="until-found"', async () => {
			render(DisclosurePanelHarness, { hiddenUntilFound: true });
			expect(panel()).toHaveAttribute('hidden', 'until-found');
			expect(panel()).toHaveTextContent('Secret content');
		});

		test('find-in-page opens the panel at once, without animation', async () => {
			const onBeforeMatch = vi.fn();
			const onAfterOpen = vi.fn();
			render(DisclosurePanelHarness, {
				hiddenUntilFound: true,
				motion: { in: { duration: 200 } },
				onBeforeMatch,
				onAfterOpen
			});
			const element = panel()!;
			element.dispatchEvent(new Event('beforematch'));
			// The browser measures the match right after the event: no styled collapse may remain.
			expect(heightVariable()).toBe('auto');
			element.removeAttribute('hidden');
			await tick();
			expect(onBeforeMatch).toHaveBeenCalledOnce();
			expect(panel()).toHaveAttribute('data-open', '');
			expect(panel()).not.toHaveAttribute('hidden');
			expect(animations).toHaveLength(0);
			expect(onAfterOpen).toHaveBeenCalledOnce();

			// The next close and open animate again.
			await toggle();
			expect(animations).toHaveLength(1);
		});

		test('a refused find-in-page open goes back under hidden="until-found"', async () => {
			vi.useFakeTimers();
			const onAfterOpen = vi.fn();
			render(DisclosurePanelHarness, {
				hiddenUntilFound: true,
				refuseOpen: true,
				motion: { in: { duration: 200 } },
				onAfterOpen
			});
			const element = panel()!;
			element.dispatchEvent(new Event('beforematch'));
			// The browser reveals the match by dropping `hidden` itself.
			element.removeAttribute('hidden');
			await vi.advanceTimersByTimeAsync(0);
			expect(element).not.toHaveAttribute('hidden');
			await vi.advanceTimersByTimeAsync(20);
			expect(element).toHaveAttribute('hidden', 'until-found');
			expect(heightVariable()).toBe('0px');
			expect(onAfterOpen).not.toHaveBeenCalled();

			// A later regular open keeps its animation.
			vi.useRealTimers();
			await toggle();
			expect(animations).toHaveLength(1);
		});
	});
});
