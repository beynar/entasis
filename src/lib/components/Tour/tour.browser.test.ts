// The Tour in real engines: the spotlight measures the target and follows it, the hole lets
// presses through while the backdrop takes them, focus and the target's description move with
// the steps, and the open and step requests can be refused.
import { afterEach, describe, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import Harness from './TourHarness.test.svelte';
import type { TourBeforeContext, TourStep } from './tour.props.js';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const root = () => document.querySelector<HTMLElement>('[data-entasis-tour]');
/** The popup of the step on show: the last open dialog that is not leaving. */
const popup = () =>
	[...document.querySelectorAll<HTMLElement>('dialog[open]')]
		.filter(
			(dialog) => dialog.querySelector('[data-step]') && !dialog.querySelector('[data-exiting]')
		)
		.at(-1) ?? null;
const popupTitle = () => popup()?.querySelector('h2')?.textContent?.trim() ?? null;
const cssVar = (name: string) => parseFloat(root()?.style.getPropertyValue(name) ?? 'NaN');
const spot = () => ({
	x: cssVar('--spotlight-x'),
	y: cssVar('--spotlight-y'),
	width: cssVar('--spotlight-width'),
	height: cssVar('--spotlight-height')
});
const button = (name: string) => {
	const found = [...(popup()?.querySelectorAll('button') ?? [])].find(
		(candidate) =>
			candidate.textContent?.trim() === name || candidate.getAttribute('aria-label') === name
	);
	if (!found) throw new Error(`no "${name}" button in the popup`);
	return found;
};
const frames = (count = 2) =>
	new Promise<void>((resolve) => {
		const step = (left: number) =>
			left === 0 ? resolve() : requestAnimationFrame(() => step(left - 1));
		step(count);
	});
const center = (element: Element) => {
	const box = element.getBoundingClientRect();
	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
};

const basic: TourStep[] = [
	{ target: '#first', title: 'First step', description: 'The first button.' },
	{ target: 'named-target', title: 'Second step', description: 'A named target.' },
	{ target: null, title: 'Third step', description: 'Centred.' }
];

afterEach(() => {
	window.scrollTo(0, 0);
});

describe('Tour', () => {
	test('the spotlight matches the target rect, and follows a scroll', async () => {
		await render(Harness, { steps: basic, open: true, padding: 8, reduceMotion: true });
		await expect.poll(popupTitle).toBe('First step');
		const target = byId('first').getBoundingClientRect();
		await expect
			.poll(() => spot())
			.toEqual({
				x: target.left - 8,
				y: target.top - 8,
				width: target.width + 16,
				height: target.height + 16
			});
		const path = root()!.querySelector('path')!.getAttribute('d')!;
		expect(path.match(/M/g)).toHaveLength(2);
		expect(root()!.style.getPropertyValue('--spotlight-radius')).not.toBe('0px');

		window.scrollBy(0, 30);
		await expect.poll(() => spot().y).toBeCloseTo(byId('first').getBoundingClientRect().top - 8, 0);
		expect(root()!.hasAttribute('data-instant')).toBe(true);
	});

	test('a11y:tour.hole-press presses in the hole reach the target; the backdrop takes the others', async () => {
		const log: string[] = [];
		await render(Harness, { steps: basic, open: true, log, reduceMotion: true });
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => spot().width).toBeGreaterThan(0);

		const first = center(byId('first'));
		expect(document.elementFromPoint(first.x, first.y)).toBe(byId('first'));
		await userEvent.click(byId('first'));
		expect(log).toEqual(['first-click']);

		// A control the popup does not cover: the backdrop is over it and takes the press.
		const field = byId('field');
		const point = center(field);
		const hit = document.elementFromPoint(point.x, point.y);
		expect(hit?.closest('[data-entasis-tour]')).toBe(root());
		await page.elementLocator(document.body).click({ position: point, force: true });
		expect(document.activeElement).not.toBe(field);
		expect(log).toEqual(['first-click']);
		// The backdrop does not close the tour by default.
		expect(root()).not.toBeNull();
	});

	test('interactiveTarget={false} blocks presses on the target', async () => {
		const log: string[] = [];
		await render(Harness, {
			steps: basic,
			open: true,
			log,
			reduceMotion: true,
			interactiveTarget: false
		});
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => root()?.querySelector('[data-tour-blocker]')).not.toBeNull();
		const first = center(byId('first'));
		expect(document.elementFromPoint(first.x, first.y)).not.toBe(byId('first'));
	});

	test('a11y:tour.focus-follows-steps focus moves into the popup on each step and returns to the opener on close', async () => {
		await render(Harness, { steps: basic, reduceMotion: true });
		const opener = byId('opener');
		// From the keyboard: Safari does not focus a button it clicks, so a press leaves no focus
		// to return to.
		opener.focus();
		await userEvent.keyboard('{Enter}');
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
		expect(popup()!.getAttribute('aria-labelledby')).toBe(popup()!.querySelector('h2')!.id);
		expect(popup()!.getAttribute('aria-describedby')).toBe(popup()!.querySelector('p')!.id);

		await userEvent.keyboard('{Enter}');
		await expect.poll(popupTitle).toBe('Second step');
		await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
		expect(document.activeElement?.textContent?.trim()).toBe('Next');

		await userEvent.keyboard('{Escape}');
		await expect.poll(root).toBeNull();
		expect(document.activeElement).toBe(opener);
	});

	test('a11y:tour.describes-target the step description describes the target while it shows', async () => {
		await render(Harness, { steps: basic, open: true, reduceMotion: true });
		await expect.poll(popupTitle).toBe('First step');
		const first = byId('first');
		const description = popup()!.querySelector('p')!;
		expect(first.getAttribute('aria-describedby')).toBe(description.id);
		expect(first.hasAttribute('data-tour-target')).toBe(true);

		await userEvent.click(button('Next'));
		await expect.poll(popupTitle).toBe('Second step');
		expect(first.hasAttribute('aria-describedby')).toBe(false);
		expect(first.hasAttribute('data-tour-target')).toBe(false);
		expect(byId('named').getAttribute('aria-describedby')).toBe(popup()!.querySelector('p')!.id);
	});

	test('a11y:tour.keyboard Escape closes with escape-key; arrows move only from the popup or the target', async () => {
		const onOpenChange = vi.fn();
		const onStepChange = vi.fn();
		await render(Harness, {
			steps: basic,
			open: true,
			reduceMotion: true,
			onOpenChange,
			onStepChange
		});
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);

		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(popupTitle).toBe('Second step');
		expect(onStepChange).toHaveBeenLastCalledWith(
			expect.objectContaining({ step: 1, reason: 'arrow-key', from: 0 })
		);
		await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
		await userEvent.keyboard('{ArrowLeft}');
		await expect.poll(popupTitle).toBe('First step');

		// Focus on another control: arrows are that control's.
		byId('other').focus();
		await userEvent.keyboard('{ArrowRight}');
		await frames(3);
		expect(popupTitle()).toBe('First step');
		// On the target they move the tour.
		byId('first').focus();
		await userEvent.keyboard('{ArrowRight}');
		await expect.poll(popupTitle).toBe('Second step');

		popup()!.querySelector<HTMLElement>('button')!.focus();
		await userEvent.keyboard('{Escape}');
		await expect.poll(root).toBeNull();
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'escape-key' })
		);
	});

	test('a cancelled Escape keeps the tour and leaves the event untouched', async () => {
		let escape: KeyboardEvent | undefined;
		const onOpenChange = (_open: boolean, details: OpenChangeDetails) => {
			if (details.reason === 'escape-key') {
				escape = details.event as KeyboardEvent;
				details.cancel();
			}
		};
		await render(Harness, { steps: basic, open: true, reduceMotion: true, onOpenChange });
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => popup()?.contains(document.activeElement)).toBe(true);
		await userEvent.keyboard('{Escape}');
		await frames(3);
		expect(escape).toBeDefined();
		expect(escape!.defaultPrevented).toBe(false);
		expect(popupTitle()).toBe('First step');
		expect(root()).not.toBeNull();
	});

	test('onStepChange can refuse a step; Done completes and Skip skips', async () => {
		const reasons: string[] = [];
		let refuse = true;
		await render(Harness, {
			steps: basic,
			open: true,
			reduceMotion: true,
			onStepChange: (details: { cancel(): void }) => {
				if (refuse) details.cancel();
			},
			onOpenChange: (_open: boolean, details: OpenChangeDetails) => reasons.push(details.reason)
		});
		await expect.poll(popupTitle).toBe('First step');
		await userEvent.click(button('Next'));
		await frames(3);
		expect(popupTitle()).toBe('First step');

		refuse = false;
		await userEvent.click(button('Next'));
		await expect.poll(popupTitle).toBe('Second step');
		await userEvent.click(button('Next'));
		await expect.poll(popupTitle).toBe('Third step');
		// The last step has Done and no Skip.
		expect(() => button('Skip tour')).toThrow();
		await userEvent.click(button('Done'));
		await expect.poll(root).toBeNull();
		expect(reasons).toEqual(['complete']);
	});

	test('Skip and the close button report their reasons', async () => {
		const reasons: string[] = [];
		const screen = await render(Harness, {
			steps: basic,
			open: true,
			reduceMotion: true,
			onOpenChange: (_open: boolean, details: OpenChangeDetails) => reasons.push(details.reason)
		});
		await expect.poll(popupTitle).toBe('First step');
		await userEvent.click(button('Skip tour'));
		await expect.poll(root).toBeNull();
		await screen.rerender({ open: true });
		await expect.poll(popupTitle).toBe('First step');
		await userEvent.click(button('Close tour'));
		await expect.poll(root).toBeNull();
		expect(reasons).toEqual(['skip-press', 'close-press']);
	});

	test('a11y:tour.modal-inert modal makes the rest of the page inert and restores it, keeping an inert the page set', async () => {
		await render(Harness, { steps: basic, open: true, reduceMotion: true, modal: true });
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => byId('sibling').hasAttribute('inert')).toBe(true);
		expect(byId('first').closest('[inert]')).toBeNull();
		expect(popup()!.closest('[inert]')).toBeNull();
		expect(root()!.hasAttribute('data-modal')).toBe(true);

		// Tab cycles between the popup and the target.
		const stops = [...popup()!.querySelectorAll<HTMLElement>('button')];
		stops.at(-1)!.focus();
		await userEvent.keyboard('{Tab}');
		expect(document.activeElement).toBe(byId('first'));
		await userEvent.keyboard('{Tab}');
		expect(popup()!.contains(document.activeElement)).toBe(true);

		await userEvent.keyboard('{Escape}');
		await expect.poll(root).toBeNull();
		expect(byId('sibling').hasAttribute('inert')).toBe(false);
		expect(byId('already-inert').hasAttribute('inert')).toBe(true);
	});

	test.each([
		['skip', 'Second step'],
		['center', 'Missing step']
	] as const)('missingTarget %s', async (missingTarget, expected) => {
		const onStepChange = vi.fn();
		await render(Harness, {
			steps: [
				{ target: '#nowhere', title: 'Missing step' },
				{ target: '#first', title: 'Second step' }
			],
			open: true,
			reduceMotion: true,
			missingTarget,
			targetTimeout: 100,
			onStepChange
		});
		await expect.poll(popupTitle).toBe(expected);
		if (missingTarget === 'skip') {
			expect(onStepChange).toHaveBeenCalledWith(
				expect.objectContaining({ step: 1, reason: 'target-missing' })
			);
		} else {
			expect(root()!.hasAttribute('data-centered')).toBe(true);
			const box = popup()!.querySelector('[data-step]')!.getBoundingClientRect();
			const middle = box.left + box.width / 2;
			expect(Math.abs(middle - document.documentElement.clientWidth / 2)).toBeLessThan(2);
		}
	});

	test('missingTarget stop closes with target-missing', async () => {
		const onOpenChange = vi.fn();
		await render(Harness, {
			steps: [{ target: '#nowhere', title: 'Missing step' }],
			open: true,
			reduceMotion: true,
			missingTarget: 'stop',
			targetTimeout: 100,
			onOpenChange
		});
		await expect.poll(() => onOpenChange.mock.calls.length).toBe(1);
		expect(onOpenChange).toHaveBeenCalledWith(
			false,
			expect.objectContaining({ reason: 'target-missing' })
		);
		await expect.poll(root).toBeNull();
	});

	test('before() is awaited, with the tour resolving meanwhile', async () => {
		let release: () => void = () => {};
		const before = vi.fn<(context: TourBeforeContext) => Promise<void>>(
			() =>
				new Promise<void>((resolve) => {
					release = () => {
						const late = document.createElement('button');
						late.id = 'late';
						late.textContent = 'Late';
						byId('page').prepend(late);
						resolve();
					};
				})
		);
		await render(Harness, {
			steps: [
				{ target: '#first', title: 'First step' },
				{ target: '#late', title: 'Late step', before }
			],
			open: true,
			reduceMotion: true
		});
		await expect.poll(popupTitle).toBe('First step');
		await userEvent.click(button('Next'));
		await expect.poll(() => before.mock.calls.length).toBe(1);
		expect(before.mock.calls[0][0]).toMatchObject({ step: 1, direction: 1 });
		expect(root()!.hasAttribute('data-resolving')).toBe(true);
		expect(popup()!.querySelector('[aria-busy="true"]')).not.toBeNull();
		await frames(5);
		expect(popupTitle()).toBe('First step');

		release();
		await expect.poll(popupTitle).toBe('Late step');
		expect(root()!.hasAttribute('data-resolving')).toBe(false);
		const late = byId('late').getBoundingClientRect();
		await expect.poll(() => spot().x).toBeCloseTo(late.left - 8, 0);
		byId('late').remove();
	});

	test('advanceOn moves on when the target fires the event', async () => {
		const onStepChange = vi.fn();
		await render(Harness, {
			steps: [
				{ target: '#first', title: 'Click it', advanceOn: 'click' },
				{ target: '#other', title: 'Done clicking' }
			],
			open: true,
			reduceMotion: true,
			onStepChange
		});
		await expect.poll(popupTitle).toBe('Click it');
		await userEvent.click(byId('first'));
		await expect.poll(popupTitle).toBe('Done clicking');
		expect(onStepChange).toHaveBeenCalledWith(
			expect.objectContaining({ step: 1, reason: 'advance-on' })
		);
	});

	test('a target out of view is scrolled into view first', async () => {
		await render(Harness, {
			steps: [{ target: '#far', title: 'Far step' }],
			open: true,
			reduceMotion: true
		});
		await expect.poll(popupTitle).toBe('Far step');
		const far = byId('far').getBoundingClientRect();
		expect(far.bottom).toBeLessThanOrEqual(document.documentElement.clientHeight + 1);
		expect(far.top).toBeGreaterThanOrEqual(0);
	});

	test('the spotlight is clipped by the scroller of its target', async () => {
		await render(Harness, {
			steps: [{ target: '#deep', title: 'Deep step' }],
			open: true,
			reduceMotion: true,
			padding: 40
		});
		await expect.poll(popupTitle).toBe('Deep step');
		const scroller = byId('scroller').getBoundingClientRect();
		await expect.poll(() => spot().width).toBeGreaterThan(0);
		const { x, y, width, height } = spot();
		expect(x).toBeGreaterThanOrEqual(scroller.left - 0.5);
		expect(y).toBeGreaterThanOrEqual(scroller.top - 0.5);
		expect(x + width).toBeLessThanOrEqual(scroller.right + 0.5);
		expect(y + height).toBeLessThanOrEqual(scroller.bottom + 0.5);
	});

	test('over an open Dialog: the backdrop and popup sit above it, and pressing Next keeps it open', async () => {
		const log: string[] = [];
		await render(Harness, {
			steps: [
				{ target: '#in-dialog', title: 'In the dialog' },
				{ target: null, title: 'After' }
			],
			dialog: true,
			log,
			reduceMotion: true
		});
		await expect.poll(() => byId('in-dialog')).not.toBeNull();
		await expect.poll(() => byId('in-dialog').getClientRects().length).toBeGreaterThan(0);
		await userEvent.click(byId('in-dialog'));
		expect(log).toEqual(['dialog-click']);
		// Start the tour while the dialog is open.
		byId('opener').click();
		await expect.poll(popupTitle).toBe('In the dialog');
		const dialogSurface = byId('in-dialog').closest('[role="dialog"]') as HTMLElement;
		const zOf = (element: Element | null) => {
			for (let current = element; current; current = current.parentElement) {
				const z = parseInt(getComputedStyle(current).zIndex, 10);
				if (Number.isFinite(z)) return z;
			}
			return 0;
		};
		expect(zOf(root())).toBeGreaterThan(zOf(dialogSurface));
		expect(zOf(popup())).toBeGreaterThan(zOf(root()));

		// The target inside the dialog still takes presses through the hole.
		await expect.poll(() => spot().width).toBeGreaterThan(0);
		const inside = center(byId('in-dialog'));
		expect(document.elementFromPoint(inside.x, inside.y)).toBe(byId('in-dialog'));

		await userEvent.click(button('Next'));
		await expect.poll(popupTitle).toBe('After');
		expect(byId('in-dialog').isConnected).toBe(true);
		expect(dialogSurface.isConnected).toBe(true);
	});

	test('onAfterOpen and onAfterClose fire once each; each step is announced', async () => {
		const onAfterOpen = vi.fn();
		const onAfterClose = vi.fn();
		await render(Harness, { steps: basic, open: true, onAfterOpen, onAfterClose });
		await expect.poll(popupTitle).toBe('First step');
		await expect.poll(() => onAfterOpen.mock.calls.length).toBe(1);
		const polite = () => root()?.querySelector('[data-live-region="polite"]')?.textContent ?? '';
		await expect.poll(polite).toBe('Step 1 of 3: First step');
		await userEvent.click(button('Next'));
		await expect.poll(polite).toBe('Step 2 of 3: Second step');
		await userEvent.click(button('Close tour'));
		await expect.poll(() => onAfterClose.mock.calls.length).toBe(1);
		expect(onAfterOpen).toHaveBeenCalledTimes(1);
		expect(onAfterClose.mock.calls[0][0]).toMatchObject({ isOpen: false, total: 3 });
	});

	test('a target that leaves the page is awaited again, then missingTarget applies', async () => {
		const onStepChange = vi.fn();
		await render(Harness, {
			steps: [
				{ target: '#doomed', title: 'Doomed step' },
				{ target: '#first', title: 'After it' }
			],
			open: false,
			reduceMotion: true,
			targetTimeout: 150,
			onStepChange
		});
		const doomed = document.createElement('button');
		doomed.id = 'doomed';
		doomed.textContent = 'Doomed';
		byId('page').prepend(doomed);
		byId('opener').click();
		await expect.poll(popupTitle).toBe('Doomed step');
		doomed.remove();
		await expect.poll(popupTitle).toBe('After it');
		expect(onStepChange).toHaveBeenCalledWith(
			expect.objectContaining({ step: 1, reason: 'target-missing' })
		);
	});

	test('reduced motion moves the spotlight at once', async () => {
		await render(Harness, { steps: basic, open: true, reduceMotion: true, padding: 0 });
		await expect.poll(popupTitle).toBe('First step');
		await userEvent.click(button('Next'));
		await expect.poll(popupTitle).toBe('Second step');
		await tick();
		const named = byId('named').getBoundingClientRect();
		expect(spot().x).toBeCloseTo(named.left, 0);
		expect(spot().width).toBeCloseTo(named.width, 0);
	});

	test('without reduced motion the spotlight glides between steps', async () => {
		await render(Harness, { steps: basic, open: true, padding: 0 });
		await expect.poll(popupTitle).toBe('First step');
		const first = byId('first').getBoundingClientRect();
		await expect.poll(() => spot().width).toBeCloseTo(first.width, 0);
		const samples: number[] = [];
		await userEvent.click(button('Next'));
		for (let index = 0; index < 30; index += 1) {
			samples.push(spot().width);
			await frames(1);
		}
		const named = byId('named').getBoundingClientRect();
		expect(samples.some((width) => width < first.width - 1 && width > named.width + 1)).toBe(true);
		expect(spot().width).toBeCloseTo(named.width, 0);
	});

	test('the popup glides to the next target as one dialog while its steps slide', async () => {
		// A longer first description, so the popup changes size on the way.
		const steps: TourStep[] = [
			{
				...basic[0],
				description:
					'The first button, described at some length so that this step needs a few more lines than the next one does.'
			},
			basic[1],
			basic[2]
		];
		await render(Harness, { steps, open: true, padding: 0 });
		await expect.poll(popupTitle).toBe('First step');
		const dialog = popup()!;
		const panel = () => dialog.firstElementChild!.getBoundingClientRect();
		const content = (index: number) =>
			dialog.querySelector<HTMLElement>(`[data-tour-content="${index}"]`);
		await frames(4);
		const start = panel();
		const samples: {
			x: number;
			y: number;
			height: number;
			leavingInert: boolean;
			leavingShift: number;
		}[] = [];
		await userEvent.click(button('Next'));
		for (let index = 0; index < 50; index += 1) {
			const box = panel();
			const leaving = content(0);
			samples.push({
				x: box.left,
				y: box.top,
				height: box.height,
				leavingInert: !!leaving?.closest('[inert]'),
				leavingShift: leaving ? leaving.getBoundingClientRect().left - box.left : 0
			});
			await frames(1);
		}
		const end = panel();
		const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
			Math.hypot(a.x - b.x, a.y - b.y);
		const from = { x: start.left, y: start.top };
		const to = { x: end.left, y: end.top };
		expect(distance(from, to)).toBeGreaterThan(20);
		// On the way, not a jump, and its size glides with the move rather than after it.
		expect(start.height).not.toBeCloseTo(end.height, 0);
		const low = Math.min(start.height, end.height);
		const high = Math.max(start.height, end.height);
		expect(
			samples.some(
				(sample) =>
					distance(sample, from) > 5 &&
					distance(sample, to) > 5 &&
					sample.height > low + 1 &&
					sample.height < high - 1
			)
		).toBe(true);
		expect(Math.max(...samples.map((sample) => sample.height))).toBeLessThanOrEqual(high + 1);
		// The previous step's content slides out sideways, out of reach as soon as it leaves.
		expect(samples.some((sample) => sample.leavingShift < -20 && sample.leavingInert)).toBe(true);
		expect(samples.every((sample) => sample.leavingShift >= 0 || sample.leavingInert)).toBe(true);
		expect(popup()).toBe(dialog);
		expect(popupTitle()).toBe('Second step');
		expect(content(0)).toBeNull();
		expect(document.activeElement?.textContent?.trim()).toBe('Next');
		expect(content(1)?.contains(document.activeElement)).toBe(true);
	});
});
